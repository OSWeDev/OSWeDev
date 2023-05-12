import BGThreadServerController from '../../../server/modules/BGThread/BGThreadServerController';
import ForkServerController from '../../../server/modules/Fork/ForkServerController';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import StatsGroupVO from '../../../shared/modules/Stats/vos/StatsGroupVO';
import StatVO from '../../../shared/modules/Stats/vos/StatVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import ThrottleHelper from '../../../shared/tools/ThrottleHelper';
import TimeSegmentHandler from '../../../shared/tools/TimeSegmentHandler';
import ConfigurationService from '../../env/ConfigurationService';

export default class StatsServerController {

    public static getInstance(): StatsServerController {
        if (!StatsServerController.instance) {
            StatsServerController.instance = new StatsServerController();
        }
        return StatsServerController.instance;
    }

    /**
     * Sucre syntaxique pour register_stat sur plusieurs aggrégateurs
     * @param name cf. register_stat
     * @param value
     * @param aggregators on applique register_stat sur chaque élément du tableau
     * @param min_segment_type cf. register_stat
     */
    public static register_stats(
        category_name: string, sub_category_name: string, event_name: string, stat_type_name: string,
        value: number, aggregators: number[], min_segment_type: number) {

        for (let i in aggregators) {
            StatsServerController.register_stat(
                category_name, sub_category_name, event_name, stat_type_name,
                value, aggregators[i], min_segment_type);
        }
    }


    /**
     *
     * @param name le nom de la stat, avec des . pour gérer les groupes hiérarchiquement.
     * La fonction ajoute automatiquement l'aggrégateur en fin de nom pour éviter les erreurs de duplicate sur des aggrégateurs différents. (donc ne pas mettre l'aggrégateur dans le nom en amont).
     * Par ailleurs on intègre aussi l'identifiant du thread pour bien séparer les stats en fonction des rôles. Et celà évite les risques de concurrence dans la création des groupes par exemple.
     * @param value
     * @param aggregator à choisir parmi les constantes AGGREGATOR_* de StatVO
     * @param min_segment_type à choisir parmi les constantes TYPE_* de TimeSegmentHandler
     */
    public static register_stat(
        category_name: string, sub_category_name: string, event_name: string, stat_type_name: string,
        value: number, aggregator: number, min_segment_type: number) {

        /**
         * Si le serveur n'est pas up, on peut pas stocker des stats
         */
        if (!BGThreadServerController.SERVER_READY) {
            return;
        }

        let stat = new StatVO();
        stat.value = value;
        stat.timestamp_s = Dates.now();

        let stats_name = category_name + '.' + sub_category_name + '.' + event_name + '.' + stat_type_name + '.' + StatsServerController.get_aggregator_extension(aggregator) + '.' + this.get_thread_name();

        if (!StatsServerController.cached_stack_groupes_by_name[stats_name]) {
            let new_groupe = new StatsGroupVO();
            new_groupe.tmp_category_name = category_name;
            new_groupe.tmp_sub_category_name = sub_category_name;
            new_groupe.tmp_event_name = event_name;
            new_groupe.tmp_stat_type_name = stat_type_name;
            new_groupe.stats_aggregator = aggregator;
            new_groupe.stats_aggregator_min_segment_type = min_segment_type;

            StatsServerController.cached_stack_groupes_by_name[stats_name] = new_groupe;
        }

        stat.stat_group_id = StatsServerController.cached_stack_groupes_by_name[stats_name].id;
        if (!StatsServerController.stacked_registered_stats_by_group_name[stats_name]) {
            StatsServerController.stacked_registered_stats_by_group_name[stats_name] = [];
        }
        StatsServerController.stacked_registered_stats_by_group_name[stats_name].push(stat);
        StatsServerController.throttled_unstack_stats();
    }

    public static get_aggregator_extension(aggregator: number): string {
        switch (aggregator) {
            case StatVO.AGGREGATOR_MEAN:
                return '.mean';
            case StatVO.AGGREGATOR_SUM:
                return '.sum';
            case StatVO.AGGREGATOR_MIN:
                return '.min';
            case StatVO.AGGREGATOR_MAX:
                return '.max';
            default:
                throw new Error('Aggregator inconnu ' + aggregator);
        }
    }

    private static instance: StatsServerController = null;

    private static cached_stack_groupes_by_name: { [name: string]: StatsGroupVO } = {};

    private static stacked_registered_stats_by_group_name: { [group_name: string]: StatVO[] } = {};
    private static throttled_unstack_stats = ThrottleHelper.getInstance().declare_throttle_without_args(
        StatsServerController.unstack_stats.bind(StatsServerController.getInstance()), 60000, { leading: false, trailing: true }); // defaults to 1 minute

    /**
     * Attention : si on met le ppid dans le nom de la stat on va avoir une table par processus,
     *  or on veut plutôt identifier le thread principal, ou thread des vars, ....
     */
    private static get_thread_name(): string {
        let thread_name = 'main';

        if (!ForkServerController.getInstance().is_main_process) {

            thread_name = 'fork.';
            if (BGThreadServerController.getInstance()) {
                thread_name += Object.keys(BGThreadServerController.getInstance().valid_bgthreads_names).join('.').replace(/ /g, '_');
            }
        }

        return thread_name;
    }

    private static async unstack_stats() {

        let unstacking_date: number = Dates.now();
        let to_unstack: { [group_name: string]: StatVO[] } = StatsServerController.stacked_registered_stats_by_group_name;
        let to_restack: { [group_name: string]: StatVO[] } = {};
        StatsServerController.stacked_registered_stats_by_group_name = {};

        if ((!to_unstack) || (!Object.keys(to_unstack).length)) {
            return;
        }
        await StatsServerController.getInstance().check_groups(to_unstack);

        let all_new_stats: StatVO[] = [];

        for (let group_name in to_unstack) {
            let group = StatsServerController.cached_stack_groupes_by_name[group_name];
            let stats = to_unstack[group_name];

            let current_segment_start = TimeSegmentHandler.getCorrespondingTimeSegment(unstacking_date, group.stats_aggregator_min_segment_type).index;

            // On n'aggrège que les stats dont le segment est totalement terminé
            let stats_to_aggregate_by_segment: { [segment_date: number]: StatVO[] } = {};
            for (let i in stats) {
                let stat = stats[i];

                let stat_segment_start = TimeSegmentHandler.getCorrespondingTimeSegment(stat.timestamp_s, group.stats_aggregator_min_segment_type).index;
                if (stat_segment_start >= current_segment_start) {
                    if (!to_restack[group_name]) {
                        to_restack[group_name] = [];
                    }
                    to_restack[group_name].push(stat);
                    continue;
                }

                if (!stats_to_aggregate_by_segment[stat_segment_start]) {
                    stats_to_aggregate_by_segment[stat_segment_start] = [];
                }
                stats_to_aggregate_by_segment[stat_segment_start].push(stat);
            }

            let stats_aggregator = group.stats_aggregator;
            let aggregated_stats: { [segment_date: number]: StatVO } = {};

            for (let i in stats_to_aggregate_by_segment) {
                let segment_date = parseInt(i);
                let segment_stats = stats_to_aggregate_by_segment[segment_date];

                let aggregated_stat = new StatVO();
                aggregated_stat.timestamp_s = segment_date;
                aggregated_stat.stat_group_id = group.id;
                aggregated_stat.value = 0;
                aggregated_stats[segment_date] = aggregated_stat;
                all_new_stats.push(aggregated_stat);

                if (stats_aggregator == StatVO.AGGREGATOR_MEAN) {
                    // Moyenne
                    let sum = 0;
                    for (let j in segment_stats) {
                        sum += segment_stats[j].value;
                    }
                    aggregated_stat.value = sum / segment_stats.length;
                } else if (stats_aggregator == StatVO.AGGREGATOR_SUM) {
                    // Somme
                    let sum = 0;
                    for (let j in segment_stats) {
                        sum += segment_stats[j].value;
                    }
                    aggregated_stat.value = sum;
                } else if (stats_aggregator == StatVO.AGGREGATOR_MIN) {
                    // Min
                    let min = null;
                    for (let j in segment_stats) {
                        if ((min === null) || (min > segment_stats[j].value)) {
                            min = segment_stats[j].value;
                        }
                    }
                    aggregated_stat.value = min;
                } else if (stats_aggregator == StatVO.AGGREGATOR_MAX) {
                    // Max
                    let max = null;
                    for (let j in segment_stats) {
                        if ((max === null) || (max < segment_stats[j].value)) {
                            max = segment_stats[j].value;
                        }
                    }
                    aggregated_stat.value = max;
                }

            }
        }

        if (all_new_stats && all_new_stats.length) {
            await ModuleDAO.getInstance().insertOrUpdateVOs(all_new_stats);
        }

        if (to_restack && Object.keys(to_restack).length) {
            for (let group_name in to_restack) {
                if (!StatsServerController.stacked_registered_stats_by_group_name[group_name]) {
                    StatsServerController.stacked_registered_stats_by_group_name[group_name] = [];
                }
                StatsServerController.stacked_registered_stats_by_group_name[group_name] = StatsServerController.stacked_registered_stats_by_group_name[group_name].concat(to_restack[group_name]);
            }
            StatsServerController.throttled_unstack_stats();
        }
    }

    private is_creating_group_name: { [group_name: string]: boolean } = {};

    private constructor() { }

    /**
     * On check les groups des stats stacked. Soit on a déjà pu remplir le group_id, soit on
     * le fait maintenant en mettant en priorité le cache à jour, puis en créant le groupe si besoin
     */
    private async check_groups(to_unstack: { [group_name: string]: StatVO[] }) {

        let reloaded_cache = false;
        let promises_pipeline = new PromisePipeline(ConfigurationService.node_configuration.MAX_POOL / 2);

        for (let group_name in to_unstack) {
            let group = StatsServerController.cached_stack_groupes_by_name[group_name];

            if (!group) {
                // On devrait avoir a minima le caneva du groupe avec la segmentation, le nom, et l'aggrégateur
                ConsoleHandler.error('Pas de groupe pour ' + group_name + ' dans le cache des groupes de stats');
                throw new Error('Pas de groupe pour ' + group_name + ' dans le cache des groupes de stats');
            }

            if (!group.id) {
                // On a le caneva du groupe, mais pas l'id, on tente de reload le cache si c'est pas déjà tenté, et sinon on le crée
                if (!reloaded_cache) {
                    await this.reload_groups_cache();
                    group = StatsServerController.cached_stack_groupes_by_name[group_name];
                    reloaded_cache = true;
                }

                if (!group.id) {

                    // On crée le groupe si la création est pas déjà en cours, sinon on passe
                    if (!this.is_creating_group_name[group_name]) {
                        this.is_creating_group_name[group_name] = true;
                        await promises_pipeline.push(async () => {
                            let new_group = new StatsGroupVO();
                            new_group.name = group_name;
                            new_group.tmp_category_name = group.tmp_category_name;
                            new_group.tmp_sub_category_name = group.tmp_sub_category_name;
                            new_group.tmp_event_name = group.tmp_event_name;
                            new_group.tmp_stat_type_name = group.tmp_stat_type_name;
                            new_group.tmp_thread_name = group.tmp_thread_name;
                            new_group.stats_aggregator = group.stats_aggregator;
                            new_group.stats_aggregator_min_segment_type = group.stats_aggregator_min_segment_type;
                            let res = await ModuleDAO.getInstance().insertOrUpdateVO(new_group);

                            if ((!res) || !res.id) {
                                ConsoleHandler.error('Erreur lors de la création du groupe de stats ' + group_name);
                                throw new Error('Erreur lors de la création du groupe de stats ' + group_name);
                            }
                            new_group.id = res.id;

                            StatsServerController.cached_stack_groupes_by_name[group_name] = new_group;
                            delete this.is_creating_group_name[group_name];
                        });
                    }
                }
            }
        }
        await promises_pipeline.end();

        // Quand les groupes sont créés, on peut les mettre à jour dans les stats
        for (let group_name in to_unstack) {
            let group = StatsServerController.cached_stack_groupes_by_name[group_name];
            if (!group.id) {
                ConsoleHandler.error('Pas de groupe pour ' + group_name + ' dans le cache des groupes de stats');
            }

            let stats = to_unstack[group_name];
            for (let i in stats) {
                stats[i].stat_group_id = group.id;
            }
        }
    }

    /**
     * On reload le cache des groupes en complètant les éléments manquants, on garde les canevas de groupes en attente d'insertion
     *  on ne peut donc pas supprimer des groupes du cache
     */
    private async reload_groups_cache() {
        let groups = await query(StatsGroupVO.API_TYPE_ID).select_vos<StatsGroupVO>();
        for (let i in groups) {
            let group = groups[i];

            StatsServerController.cached_stack_groupes_by_name[group.name] = group;
        }
    }
}
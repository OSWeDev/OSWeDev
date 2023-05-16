import ThrottleHelper from '../../tools/ThrottleHelper';
import TimeSegmentHandler from '../../tools/TimeSegmentHandler';
import Dates from '../FormatDatesNombres/Dates/Dates';
import ModuleParams from '../Params/ModuleParams';
import StatsGroupVO from '../Stats/vos/StatsGroupVO';
import StatVO from '../Stats/vos/StatVO';
import StatClientWrapperVO from './vos/StatClientWrapperVO';

export default class StatsController {

    /**
     * Le générateur ne crée pas de stats
     */
    public static ACTIVATED: boolean = true;

    /**
     * Le server doit initialiser le THREAD_NAME en fonction du thread. Côté client on garde la valeur par défaut.
     */
    public static THREAD_NAME: string = 'client';
    public static THREAD_IS_CLIENT: boolean = true;
    /**
     * Throttle avant d'unstack les stats : on veut quelque chose d'assez élevé en server (ex 60000 1 min) pour éviter de faire trop de requêtes
     *  et quelque chose de plus bas en client (ex 5000 5 secs) pour pas perdre trop d'infos sur un client qui se déconnecte
     */
    public static UNSTACK_THROTTLE: number = 5000;
    public static UNSTACK_THROTTLE_PARAM_NAME: string = 'StatsController.UNSTACK_THROTTLE_CLIENT';

    public static check_groups_handler: (stats_to_unstack: { [group_name: string]: StatVO[] }) => Promise<void> = null;
    public static new_stats_handler: (new_stats: Array<StatVO | StatClientWrapperVO>) => Promise<void> = null;

    public static cached_stack_groupes_by_name: { [name: string]: StatsGroupVO } = {};
    public static stacked_registered_stats_by_group_name: { [group_name: string]: StatVO[] } = {};

    public static throttled_unstack_stats = ThrottleHelper.getInstance().declare_throttle_without_args(
        StatsController.unstack_stats.bind(StatsController.getInstance()), 60000, { leading: false, trailing: true }); // defaults to 1 minute

    public static getInstance(): StatsController {
        if (!StatsController.instance) {
            StatsController.instance = new StatsController();
        }
        return StatsController.instance;
    }

    public static async init_params() {

        if (!StatsController.ACTIVATED) {
            return;
        }

        StatsController.UNSTACK_THROTTLE = await ModuleParams.getInstance().getParamValueAsInt(StatsController.UNSTACK_THROTTLE_PARAM_NAME);
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

        if (!StatsController.ACTIVATED) {
            return;
        }

        for (let i in aggregators) {
            StatsController.register_stat(
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
        value: number, aggregator: number, min_segment_type: number, force_timestamp: number = null) {

        if (!StatsController.ACTIVATED) {
            return;
        }

        // Côté server : pourquoi on pourrait pas les stacks, on peut pas les unstack oui, mais les stack ?
        //  et on passe en shared, donc en plus on a plus le droit de se poser cette question
        // /**
        //  * Si le serveur n'est pas up, on peut pas stocker des stats
        //  */
        // if (!BGThreadServerController.SERVER_READY) {
        //     return;
        // }

        let stat = new StatVO();
        stat.value = value;
        stat.timestamp_s = force_timestamp ? force_timestamp : Dates.now();

        let stats_name = category_name + '.' + sub_category_name + '.' + event_name + '.' + stat_type_name + '.' + StatsController.get_aggregator_extension(aggregator) + '.' + StatsController.THREAD_NAME;

        if (!StatsController.cached_stack_groupes_by_name[stats_name]) {
            let new_groupe = new StatsGroupVO();
            new_groupe.tmp_category_name = category_name;
            new_groupe.tmp_sub_category_name = sub_category_name;
            new_groupe.tmp_event_name = event_name;
            new_groupe.tmp_stat_type_name = stat_type_name;
            new_groupe.stats_aggregator = aggregator;
            new_groupe.stats_aggregator_min_segment_type = min_segment_type;

            StatsController.cached_stack_groupes_by_name[stats_name] = new_groupe;
        }

        stat.stat_group_id = StatsController.cached_stack_groupes_by_name[stats_name].id;
        if (!StatsController.stacked_registered_stats_by_group_name[stats_name]) {
            StatsController.stacked_registered_stats_by_group_name[stats_name] = [];
        }
        StatsController.stacked_registered_stats_by_group_name[stats_name].push(stat);
        StatsController.throttled_unstack_stats();
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

    private static instance: StatsController = null;

    private static first_unstacking_date: number = null;

    private static async unstack_stats() {

        if (!!this.check_groups_handler) {
            await this.check_groups_handler(StatsController.stacked_registered_stats_by_group_name);
        }

        let unstacking_date: number = Dates.now();
        if (!StatsController.first_unstacking_date) {
            StatsController.first_unstacking_date = unstacking_date;
        }
        let to_unstack: { [group_name: string]: StatVO[] } = StatsController.stacked_registered_stats_by_group_name;
        let to_restack: { [group_name: string]: StatVO[] } = {};
        StatsController.stacked_registered_stats_by_group_name = {};

        if ((!to_unstack) || (!Object.keys(to_unstack).length)) {
            return;
        }

        if (!StatsController.new_stats_handler) {
            /**
             * Si l'appli est pas lancée depuis longtemps (<1 min) c'est peut-être normal, on restack, sinon c'est une erreur
             */
            if ((unstacking_date - StatsController.first_unstacking_date) > 60) {
                throw new Error('StatsController.new_stats_handler doit être défini');
            }

            return;
        }

        let all_new_stats: Array<StatVO | StatClientWrapperVO> = [];

        for (let group_name in to_unstack) {
            let group = StatsController.cached_stack_groupes_by_name[group_name];
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
            let aggregated_stats: { [segment_date: number]: StatVO | StatClientWrapperVO } = {};

            for (let i in stats_to_aggregate_by_segment) {
                let segment_date = parseInt(i);
                let segment_stats = stats_to_aggregate_by_segment[segment_date];

                let aggregated_stat: StatVO | StatClientWrapperVO = null;
                if (StatsController.THREAD_IS_CLIENT) {
                    aggregated_stat = new StatClientWrapperVO();
                    aggregated_stat.timestamp_s = segment_date;
                    aggregated_stat.value = 0;

                    aggregated_stat.tmp_category_name = group.tmp_category_name;
                    aggregated_stat.tmp_sub_category_name = group.tmp_sub_category_name;
                    aggregated_stat.tmp_event_name = group.tmp_event_name;
                    aggregated_stat.tmp_thread_name = group.tmp_thread_name;
                    aggregated_stat.tmp_stat_type_name = group.tmp_stat_type_name;
                    aggregated_stat.stats_aggregator = group.stats_aggregator;
                    aggregated_stat.stats_aggregator_min_segment_type = group.stats_aggregator_min_segment_type;

                    aggregated_stats[segment_date] = aggregated_stat;
                } else {
                    aggregated_stat = new StatVO();
                    aggregated_stat.timestamp_s = segment_date;
                    aggregated_stat.stat_group_id = group.id;
                    aggregated_stat.value = 0;
                    aggregated_stats[segment_date] = aggregated_stat;
                }
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

            await StatsController.new_stats_handler(all_new_stats);
        }

        if (to_restack && Object.keys(to_restack).length) {
            for (let group_name in to_restack) {
                if (!StatsController.stacked_registered_stats_by_group_name[group_name]) {
                    StatsController.stacked_registered_stats_by_group_name[group_name] = [];
                }
                StatsController.stacked_registered_stats_by_group_name[group_name] = StatsController.stacked_registered_stats_by_group_name[group_name].concat(to_restack[group_name]);
            }
            StatsController.throttled_unstack_stats();
        }
    }
}
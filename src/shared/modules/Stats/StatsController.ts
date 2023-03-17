import ThrottleHelper from '../../tools/ThrottleHelper';
import TimeSegmentHandler from '../../tools/TimeSegmentHandler';
import { query } from '../ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../DAO/ModuleDAO';
import Dates from '../FormatDatesNombres/Dates/Dates';
import VOsTypesManager from '../VOsTypesManager';
import StatsGroupVO from './vos/StatsGroupVO';
import StatVO from './vos/StatVO';

export default class StatsController {

    public static getInstance(): StatsController {
        if (!StatsController.instance) {
            StatsController.instance = new StatsController();
        }
        return StatsController.instance;
    }

    /**
     *
     * @param name le nom de la stat, avec des . pour gérer les groupes hiérarchiquement
     * @param value
     * @param aggregator à choisir parmi les constantes AGGREGATOR_* de StatVO
     * @param min_segment_type à choisir parmi les constantes TYPE_* de TimeSegmentHandler
     */
    public static async register_stat(name: string, value: number, aggregator: number, min_segment_type: number) {

        let stat = new StatVO();
        stat.value = value;
        stat.timestamp_s = Dates.now();

        /**
         * Si on trouve pas le groupe, on renouvelle d'abord le cache, et on crée au besoin
         */
        if (!StatsController.cached_stack_groupes_by_name[name]) {
            let groupe = await query(StatsGroupVO.API_TYPE_ID).filter_by_text_eq('name', name).select_vo<StatsGroupVO>();

            // si malgré le rechargement du cache on trouve pas le groupe, on le crée
            if (!groupe) {
                let new_groupe = new StatsGroupVO();
                new_groupe.name = name;
                new_groupe.stats_aggregator = aggregator;
                new_groupe.stats_aggregator_min_segment_type = min_segment_type;

                let res = await ModuleDAO.getInstance().insertOrUpdateVO(new_groupe);
                if ((!res) || !res.id) {
                    throw new Error('Erreur lors de la création du groupe de stats ' + name);
                }
                new_groupe.id = res.id;

                StatsController.cached_stack_groupes_by_name[name] = new_groupe;
            } else {
                StatsController.cached_stack_groupes_by_name[name] = groupe;
            }
        }

        stat.stat_group_id = StatsController.cached_stack_groupes_by_name[name].id;
        StatsController.stacked_registered_stats.push(stat);
        StatsController.throttled_unstack_stats();
    }

    private static instance: StatsController = null;

    private static cached_stack_groupes_by_name: { [name: string]: StatsGroupVO } = {};

    private static stacked_to_register_stats: StatVO[] = [];
    private static stacked_registered_stats: StatVO[] = [];
    private static throttled_unstack_stats = ThrottleHelper.getInstance().declare_throttle_without_args(
        StatsController.unstack_stats.bind(StatsController.getInstance()), 60000, { trailing: true }); // defaults to 1 minute

    private static async unstack_stats() {

        let unstacking_date: number = Dates.now();
        let to_unstack = StatsController.stacked_registered_stats;
        let to_restack: StatVO[] = [];
        StatsController.stacked_registered_stats = [];

        if (!to_unstack.length) {
            return;
        }

        let stats_by_group: { [group_id: number]: StatVO[] } = {};

        for (let i in to_unstack) {
            let stat = to_unstack[i];

            if (!stats_by_group[stat.stat_group_id]) {
                stats_by_group[stat.stat_group_id] = [];
            }

            stats_by_group[stat.stat_group_id].push(stat);
        }

        let groups = await query(StatsGroupVO.API_TYPE_ID)
            .filter_by_ids(Object.keys(stats_by_group).map((group_id_str) => parseInt(group_id_str)))
            .select_vos<StatsGroupVO>();
        let groups_by_id: { [group_id: number]: StatsGroupVO } = VOsTypesManager.vosArray_to_vosByIds(groups);
        let all_new_stats: StatVO[] = [];

        for (let group_id_str in stats_by_group) {
            let group_id = parseInt(group_id_str);
            let stats = stats_by_group[group_id];

            let group = groups_by_id[group_id];
            let current_segment_start = TimeSegmentHandler.getCorrespondingTimeSegment(unstacking_date, group.stats_aggregator_min_segment_type).index;

            // On n'aggrège que les stats dont le segment est totalement terminé
            let stats_to_aggregate_by_segment: { [segment_date: number]: StatVO[] } = {};
            for (let i in stats) {
                let stat = stats[i];

                let stat_segment_start = TimeSegmentHandler.getCorrespondingTimeSegment(stat.timestamp_s, group.stats_aggregator_min_segment_type).index;
                if (stat_segment_start >= current_segment_start) {
                    to_restack.push(stat);
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

            await ModuleDAO.getInstance().insertOrUpdateVOs(all_new_stats);
        }

        if (to_restack && to_restack.length) {
            StatsController.stacked_registered_stats = StatsController.stacked_registered_stats.concat(to_restack);
            StatsController.throttled_unstack_stats();
        }
    }

    private constructor() { }
}
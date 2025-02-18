import { query } from "../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import NumRange from "../../../../../shared/modules/DataRender/vos/NumRange";
import TimeSegment from "../../../../../shared/modules/DataRender/vos/TimeSegment";
import TSRange from "../../../../../shared/modules/DataRender/vos/TSRange";
import StatsGroupSecDataRangesVO from "../../../../../shared/modules/Stats/vars/vos/StatsGroupDayDataRangesVO";
import StatVO from "../../../../../shared/modules/Stats/vos/StatVO";
import { field_names } from "../../../../../shared/tools/ObjectHandler";
import PromisePipeline from "../../../../../shared/tools/PromisePipeline/PromisePipeline";
import RangeHandler from "../../../../../shared/tools/RangeHandler";
import DataSourceControllerBatchLoadBase from "../../../Var/datasource/DataSourceControllerBatchLoadBase";
import VarDAGNode from "../../../Var/vos/VarDAGNode";

export default class StatDatasourceController extends DataSourceControllerBatchLoadBase {

    protected static instance: StatDatasourceController = null;

    // istanbul ignore next: nothing to test
    public static getInstance(): StatDatasourceController {
        if (!StatDatasourceController.instance) {
            StatDatasourceController.instance = new StatDatasourceController(
                'StatDatasourceController',
                [StatVO.API_TYPE_ID],
                { 'fr-fr': 'Stats' });
        }
        return StatDatasourceController.instance;
    }

    public async load_nodes_data_using_pipeline(
        nodes_by_index: { [index: string]: VarDAGNode },
        pipeline: PromisePipeline,
    ): Promise<void> {

        let stats_groupe_id_ranges: NumRange[] = [];
        let ts_ranges: TSRange[] = [];

        // On cherche tous les stores demandés dans les vardatas et on stocke les ids nécessaires
        for (const i in nodes_by_index) {
            const node = nodes_by_index[i];

            if (!node) {
                continue;
            }

            if (!node.var_data) {
                continue;
            }

            const var_data: StatsGroupSecDataRangesVO = node.var_data as StatsGroupSecDataRangesVO;

            if (!var_data.stats_groupe_id_ranges) {
                continue;
            }

            stats_groupe_id_ranges.push(...var_data.stats_groupe_id_ranges);
            ts_ranges.push(...var_data.ts_ranges);
        }

        stats_groupe_id_ranges = RangeHandler.getRangesUnion(stats_groupe_id_ranges);
        ts_ranges = RangeHandler.getRangesUnion(ts_ranges);

        // On charge tous les contrats nécessaires
        let stats_groupes = null;

        await ((await pipeline.push(async () => {
            stats_groupes = await query(StatVO.API_TYPE_ID)
                .filter_by_num_x_ranges(field_names<StatVO>().stat_group_id, stats_groupe_id_ranges)
                .filter_by_date_x_ranges(field_names<StatVO>().timestamp_s, ts_ranges)
                .exec_as_server()
                .select_vos<StatVO>();
        }))());
        const stats_groupes_by_id_and_date: { [stats_groupe_id: number]: { [ts: number]: StatVO } } = {};

        for (const stat of stats_groupes) {
            if (!stats_groupes_by_id_and_date[stat.stat_group_id]) {
                stats_groupes_by_id_and_date[stat.stat_group_id] = {};
            }

            stats_groupes_by_id_and_date[stat.stat_group_id][stat.timestamp_s] = stat;
        }

        // On ventile dans les nodes
        for (const i in nodes_by_index) {
            const node = nodes_by_index[i];

            if (!node) {
                continue;
            }

            if (!node.var_data) {
                continue;
            }

            const var_data: StatsGroupSecDataRangesVO = node.var_data as StatsGroupSecDataRangesVO;

            if (!var_data.stats_groupe_id_ranges) {
                continue;
            }

            const datasource_result: StatVO[] = [];

            RangeHandler.foreach_ranges_sync(var_data.stats_groupe_id_ranges, (stats_groupe_id: number) => {

                RangeHandler.foreach_ranges_sync(var_data.ts_ranges, (ts: number) => {
                    if (stats_groupes_by_id_and_date[stats_groupe_id] && stats_groupes_by_id_and_date[stats_groupe_id][ts]) {
                        datasource_result.push(stats_groupes_by_id_and_date[stats_groupe_id][ts]);
                    }
                }, TimeSegment.TYPE_MINUTE);
            });

            node.datasources[this.name] = datasource_result;
        }
    }
}
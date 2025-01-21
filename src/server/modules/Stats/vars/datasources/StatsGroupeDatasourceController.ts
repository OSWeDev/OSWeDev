import { query } from "../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import NumRange from "../../../../../shared/modules/DataRender/vos/NumRange";
import StatsGroupSecDataRangesVO from "../../../../../shared/modules/Stats/vars/vos/StatsGroupDayDataRangesVO";
import StatsGroupVO from "../../../../../shared/modules/Stats/vos/StatsGroupVO";
import StatVO from "../../../../../shared/modules/Stats/vos/StatVO";
import VOsTypesManager from "../../../../../shared/modules/VO/manager/VOsTypesManager";
import PromisePipeline from "../../../../../shared/tools/PromisePipeline/PromisePipeline";
import RangeHandler from "../../../../../shared/tools/RangeHandler";
import DataSourceControllerBatchLoadBase from "../../../Var/datasource/DataSourceControllerBatchLoadBase";
import VarDAGNode from "../../../Var/vos/VarDAGNode";

export default class StatsGroupeDatasourceController extends DataSourceControllerBatchLoadBase {

    protected static instance: StatsGroupeDatasourceController = null;


    // istanbul ignore next: nothing to test
    public static getInstance(): StatsGroupeDatasourceController {
        if (!StatsGroupeDatasourceController.instance) {
            StatsGroupeDatasourceController.instance = new StatsGroupeDatasourceController(
                'StatsGroupeDatasourceController',
                [StatVO.API_TYPE_ID],
                { 'fr-fr': 'Stats - Groupes' });
        }
        return StatsGroupeDatasourceController.instance;
    }


    public async load_nodes_data_using_pipeline(
        nodes_by_index: { [index: string]: VarDAGNode },
        pipeline: PromisePipeline,
    ): Promise<void> {

        let stats_groupe_id_ranges: NumRange[] = [];

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
        }

        stats_groupe_id_ranges = RangeHandler.getRangesUnion(stats_groupe_id_ranges);

        // On charge tous les contrats nécessaires
        let stats_groupes = null;

        await ((await pipeline.push(async () => {
            stats_groupes = await query(StatsGroupVO.API_TYPE_ID)
                .filter_by_ids(stats_groupe_id_ranges)
                .exec_as_server()
                .select_vos<StatsGroupVO>();
        }))());
        const stats_groupes_by_id: { [stats_groupe_id: number]: StatsGroupVO } = VOsTypesManager.vosArray_to_vosByIds(stats_groupes);

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

            const datasource_result: StatsGroupVO[] = [];

            RangeHandler.foreach_ranges_sync(var_data.stats_groupe_id_ranges, (stats_groupe_id: number) => {
                datasource_result.push(stats_groupes_by_id[stats_groupe_id]);
            });

            node.datasources[this.name] = datasource_result;
        }
    }
}
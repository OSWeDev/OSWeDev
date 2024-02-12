import { query } from "../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import StatsGroupSecDataRangesVO from "../../../../../shared/modules/Stats/vars/vos/StatsGroupDayDataRangesVO";
import StatVO from "../../../../../shared/modules/Stats/vos/StatVO";
import DataSourceControllerMatroidIndexedBase from "../../../Var/datasource/DataSourceControllerMatroidIndexedBase";

export default class StatDatasourceController extends DataSourceControllerMatroidIndexedBase {

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

    protected static instance: StatDatasourceController = null;

    public async get_data(param: StatsGroupSecDataRangesVO): Promise<StatVO[]> {

        return await query(StatVO.API_TYPE_ID)
            .filter_by_date_x_ranges('timestamp_s', param.ts_ranges)
            .filter_by_num_x_ranges('stat_group_id', param.stats_groupe_id_ranges)
            .select_vos<StatVO>();
    }
}
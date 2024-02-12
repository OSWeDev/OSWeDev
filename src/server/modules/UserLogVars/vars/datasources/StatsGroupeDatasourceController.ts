import { query } from "../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import StatsGroupSecDataRangesVO from "../../../../../shared/modules/Stats/vars/vos/StatsGroupDayDataRangesVO";
import StatsGroupVO from "../../../../../shared/modules/Stats/vos/StatsGroupVO";
import StatVO from "../../../../../shared/modules/Stats/vos/StatVO";
import DataSourceControllerMatroidIndexedBase from "../../../Var/datasource/DataSourceControllerMatroidIndexedBase";

export default class StatsGroupeDatasourceController extends DataSourceControllerMatroidIndexedBase {

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

    protected static instance: StatsGroupeDatasourceController = null;

    public async get_data(param: StatsGroupSecDataRangesVO): Promise<StatsGroupVO[]> {

        return await query(StatsGroupVO.API_TYPE_ID)
            .filter_by_ids(param.stats_groupe_id_ranges)
            .select_vos<StatsGroupVO>();
    }
}
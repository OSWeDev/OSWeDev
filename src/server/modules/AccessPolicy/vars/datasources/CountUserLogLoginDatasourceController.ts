import UserMinDataRangesVO from "../../../../../shared/modules/AccessPolicy/vars/vos/UserMinDataRangesVO";
import UserLogVO from "../../../../../shared/modules/AccessPolicy/vos/UserLogVO";
import { query } from "../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import DataSourceControllerMatroidIndexedBase from "../../../Var/datasource/DataSourceControllerMatroidIndexedBase";

export default class CountUserLogLoginDatasourceController extends DataSourceControllerMatroidIndexedBase {

    public static getInstance(): CountUserLogLoginDatasourceController {
        if (!CountUserLogLoginDatasourceController.instance) {
            CountUserLogLoginDatasourceController.instance = new CountUserLogLoginDatasourceController(
                'CountUserLogLoginDatasourceController',
                [UserLogVO.API_TYPE_ID],
                { 'fr-fr': 'Nombre de Login' });
        }
        return CountUserLogLoginDatasourceController.instance;
    }

    protected static instance: CountUserLogLoginDatasourceController = null;

    public async get_data(param: UserMinDataRangesVO): Promise<number> {

        return await query(UserLogVO.API_TYPE_ID)
            .filter_by_date_x_ranges('log_time', param.ts_ranges)
            .filter_by_num_x_ranges('user_id', param.user_id_ranges)
            .filter_is_false('impersonated')
            .filter_by_num_eq('log_type', UserLogVO.LOG_TYPE_LOGIN)
            .select_count();
    }
}
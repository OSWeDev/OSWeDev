import UserLogVO from "../../../../../shared/modules/AccessPolicy/vos/UserLogVO";
import { query } from "../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import UserMinDataRangesVO from "../../../../../shared/modules/UserLogVars/vars/vos/UserMinDataRangesVO";
import DataSourceControllerMatroidIndexedBase from "../../../Var/datasource/DataSourceControllerMatroidIndexedBase";

export default class CountUserLogLogoutDatasourceController extends DataSourceControllerMatroidIndexedBase {

    public static getInstance(): CountUserLogLogoutDatasourceController {
        if (!CountUserLogLogoutDatasourceController.instance) {
            CountUserLogLogoutDatasourceController.instance = new CountUserLogLogoutDatasourceController(
                'CountUserLogLogoutDatasourceController',
                [UserLogVO.API_TYPE_ID],
                { 'fr-fr': 'Nombre de Logout' });
        }
        return CountUserLogLogoutDatasourceController.instance;
    }

    protected static instance: CountUserLogLogoutDatasourceController = null;

    public async get_data(param: UserMinDataRangesVO): Promise<number> {

        return await query(UserLogVO.API_TYPE_ID)
            .filter_by_date_x_ranges('log_time', param.ts_ranges)
            .filter_by_num_x_ranges('user_id', param.user_id_ranges)
            .filter_is_false('impersonated')
            .filter_by_num_eq('log_type', UserLogVO.LOG_TYPE_LOGOUT)
            .select_count();
    }
}
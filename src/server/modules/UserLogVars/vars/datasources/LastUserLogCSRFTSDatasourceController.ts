import UserLogVO from "../../../../../shared/modules/AccessPolicy/vos/UserLogVO";
import { query } from "../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import SortByVO from "../../../../../shared/modules/ContextFilter/vos/SortByVO";
import UserDataRangesVO from "../../../../../shared/modules/UserLogVars/vars/vos/UserDataRangesVO";
import DataSourceControllerMatroidIndexedBase from "../../../Var/datasource/DataSourceControllerMatroidIndexedBase";

export default class LastUserLogCSRFTSDatasourceController extends DataSourceControllerMatroidIndexedBase {

    // istanbul ignore next: nothing to test
    public static getInstance(): LastUserLogCSRFTSDatasourceController {
        if (!LastUserLogCSRFTSDatasourceController.instance) {
            LastUserLogCSRFTSDatasourceController.instance = new LastUserLogCSRFTSDatasourceController(
                'LastUserLogCSRFTSDatasourceController',
                [UserLogVO.API_TYPE_ID],
                { 'fr-fr': 'Dernière date de lancement de l\'application' });
        }
        return LastUserLogCSRFTSDatasourceController.instance;
    }

    protected static instance: LastUserLogCSRFTSDatasourceController = null;

    public async get_data(param: UserDataRangesVO): Promise<number> {

        let last_csrf: UserLogVO = await query(UserLogVO.API_TYPE_ID)
            .filter_by_num_x_ranges('user_id', param.user_id_ranges)
            .filter_is_false('impersonated')
            .filter_by_num_eq('log_type', UserLogVO.LOG_TYPE_CSRF_REQUEST)
            .set_sort(new SortByVO(UserLogVO.API_TYPE_ID, 'log_time', false))
            .set_limit(1)
            .select_vo<UserLogVO>();

        return last_csrf ? last_csrf.log_time : null;
    }
}
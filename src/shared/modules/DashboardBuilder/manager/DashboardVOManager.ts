import ModuleAccessPolicy from "../../AccessPolicy/ModuleAccessPolicy";
import ContextQueryVO, { query } from "../../ContextFilter/vos/ContextQueryVO";
import SortByVO from "../../ContextFilter/vos/SortByVO";
import DashboardVO from "../vos/DashboardVO";
import ModuleDAO from "../../DAO/ModuleDAO";

/**
 * DashboardVOManager
 *  - Find and Store dashboards
 */
export default class DashboardVOManager {

    /**
     * check_dashboard_vo_access
     * - Check if user has access to dashboard vo
     *
     * TODO: to cache access rights we must use the actual user id
     *
     * @param {string} access_type
     * @returns {Promise<boolean>}
     */
    public static async check_dashboard_vo_access(access_type?: string): Promise<boolean> {
        access_type = access_type ?? ModuleDAO.DAO_ACCESS_TYPE_READ;

        // Check access
        const access_policy_name = ModuleDAO.getInstance().getAccessPolicyName(
            access_type,
            DashboardVO.API_TYPE_ID
        );

        const has_access = await ModuleAccessPolicy.getInstance().testAccess(
            access_policy_name
        );

        if (!has_access) {
            return false;
        }

        return true;
    }

    /**
     * find_all_dashboards
     * - Find all dashboards
     *
     * @param {ContextQueryVO} context_query
     * @param {boolean} options.refresh
     * @returns {Promise<DashboardVO[]>}
     */
    public static async find_all_dashboards(
        context_query?: ContextQueryVO,
        pagination?: { offset?: number, limit?: number, sorts?: SortByVO[] },
        options?: {
            select_filter_visible_options?: boolean
            refresh?: boolean
        }
    ): Promise<DashboardVO[]> {
        const self = DashboardVOManager.getInstance();

        const limit = pagination?.limit ?? 50;

        // Check access
        const has_access = await DashboardVOManager.check_dashboard_vo_access();

        if (!has_access) {
            return;
        }

        if (!context_query) {
            context_query = query(DashboardVO.API_TYPE_ID);
        }

        // force set base_api_type_id to DashboardVO.API_TYPE_ID
        context_query.set_base_api_type_id(DashboardVO.API_TYPE_ID);

        if (pagination?.sorts?.length > 0) {
            context_query.set_sorts(pagination.sorts);
        }

        const dashboards = await context_query.set_limit(limit)
            .select_vos<DashboardVO>();


        return dashboards;
    }

    public static getInstance(): DashboardVOManager {
        if (!DashboardVOManager.instance) {
            DashboardVOManager.instance = new DashboardVOManager();
        }

        return DashboardVOManager.instance;
    }

    private static instance: DashboardVOManager = null;

    public dashboards: DashboardVO[] = null;

    protected constructor() { }

}
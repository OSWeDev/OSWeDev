import ModuleAccessPolicy from "../../AccessPolicy/ModuleAccessPolicy";
import FieldFiltersVO from '../vos/FieldFiltersVO';
import { query } from "../../ContextFilter/vos/ContextQueryVO";
import SortByVO from "../../ContextFilter/vos/SortByVO";
import DashboardPageVO from "../vos/DashboardPageVO";
import ModuleDAO from "../../DAO/ModuleDAO";

/**
 * DashboardPageVOManager
 *  - Find and Store dashboard_pages
 */
export default class DashboardPageVOManager {

    /**
     * check_dashboard_page_vo_access
     * - Check if user has access to dashboard_page vo
     *
     * TODO: to cache access rights we must use the actual user id
     *
     * @param {string} access_type
     * @returns {Promise<boolean>}
     */
    public static async check_dashboard_page_vo_access(access_type?: string): Promise<boolean> {
        access_type = access_type ?? ModuleDAO.DAO_ACCESS_TYPE_READ;

        // Check access
        const access_policy_name = ModuleDAO.getInstance().getAccessPolicyName(
            access_type,
            DashboardPageVO.API_TYPE_ID
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
     * find_dashboard_pages_by_dashboard_id
     *
     * @param {number} dashboard_id
     * @returns {Promise<DashboardPageVO[]>}
     */
    public static async find_dashboard_pages_by_dashboard_id(
        dashboard_id: number,
        pagination?: { offset?: number, limit?: number, sorts?: SortByVO[] },
        options?: {
            refresh?: boolean
        }
    ): Promise<DashboardPageVO[]> {
        const self = DashboardPageVOManager.getInstance();

        // Return dashboard_pages if already loaded
        // - options.refresh = true to force reload
        if (!options?.refresh && self.dashboard_pages_by_dashboard_id[dashboard_id]) {
            return self.dashboard_pages_by_dashboard_id[dashboard_id];
        }

        // Check access
        const has_access = await DashboardPageVOManager.check_dashboard_page_vo_access();

        if (!has_access) {
            return;
        }

        const context_query = query(DashboardPageVO.API_TYPE_ID)
            .filter_by_num_eq('dashboard_id', dashboard_id);

        if (pagination?.sorts?.length > 0) {
            // TODO: check if SortByVO is valid (field_id, order)
            context_query.set_sorts(pagination.sorts);
        }

        // Initialize dashboard_pages (all_pages in dashboard) of DashboardPageVOManager instance
        // its should be initialized each time the dashboard page is loaded
        const dashboard_pages = await context_query.select_vos<DashboardPageVO>();

        self.dashboard_pages_by_dashboard_id[dashboard_id] = dashboard_pages;
        self.dashboard_pages = dashboard_pages;

        return dashboard_pages;
    }

    public static getInstance(): DashboardPageVOManager {
        if (!DashboardPageVOManager.instance) {
            DashboardPageVOManager.instance = new DashboardPageVOManager();
        }

        return DashboardPageVOManager.instance;
    }

    private static instance: DashboardPageVOManager = null;

    public field_filters_by_dashboard_page_id: { [dashboard_page_id: number]: FieldFiltersVO } = {};
    public dashboard_pages_by_dashboard_id: { [dashboard_id: number]: DashboardPageVO[] } = {};
    public dashboard_pages: DashboardPageVO[] = null;

    protected constructor() { }

}
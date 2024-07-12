import ModuleAccessPolicy from "../../AccessPolicy/ModuleAccessPolicy";
import ContextQueryVO, { query } from "../../ContextFilter/vos/ContextQueryVO";
import SortByVO from "../../ContextFilter/vos/SortByVO";
import DashboardPageVO from "../vos/DashboardPageVO";
import ModuleDAO from "../../DAO/ModuleDAO";
import { field_names } from "../../../tools/ObjectHandler";

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
            .filter_by_num_eq(field_names<DashboardPageVO>().dashboard_id, dashboard_id);

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

    /**
     * find_all_dashboard_pages
     * - Find all dashboard_pages
     *
     * @param {ContextQueryVO} context_query
     * @param {boolean} options.refresh
     * @returns {Promise<DashboardPageVO[]>}
     */
    public static async find_all_dashboard_pages(
        context_query?: ContextQueryVO,
        pagination?: { offset?: number, limit?: number, sorts?: SortByVO[] },
        options?: {
            select_filter_visible_options?: boolean
            refresh?: boolean
        }
    ): Promise<DashboardPageVO[]> {
        const self = DashboardPageVOManager.getInstance();

        const limit = pagination?.limit ?? 50;

        // Check access
        const has_access = await DashboardPageVOManager.check_dashboard_page_vo_access();

        if (!has_access) {
            return;
        }

        if (!context_query) {
            context_query = query(DashboardPageVO.API_TYPE_ID);
        }

        // force set base_api_type_id to DashboardPageVO.API_TYPE_ID
        context_query.set_base_api_type_id(DashboardPageVO.API_TYPE_ID);

        if (pagination?.sorts?.length > 0) {
            context_query.set_sorts(pagination.sorts);
        }

        const dashboard_pages = await context_query.set_limit(limit)
            .select_vos<DashboardPageVO>();


        return dashboard_pages;
    }

    /**
     * find_dashboard_pages_by_dashboard_ids
     * - Find dashboard_pages by dashboard_ids
     * - This method is used to find all dashboard_pages of many dashboards
     *
     * @param {number[]} dashboard_ids
     * @param {boolean} options.refresh
     * @returns {Promise<DashboardPageVO[]>}
     */
    public static async find_dashboard_pages_by_dashboard_ids(
        dashboard_ids: number[],
        options?: {
            refresh?: boolean
        }
    ): Promise<DashboardPageVO[]> {
        const self = DashboardPageVOManager.getInstance();

        // Check has all page_wigets already loaded
        const has_all_dashboard_pages_loaded = dashboard_ids.every((dashboard_id) => {
            return self.dashboard_pages_by_dashboard_id[dashboard_id]?.length > 0;
        });

        // Return dashboard_pages if already loaded
        if (!options?.refresh && has_all_dashboard_pages_loaded) {
            const pages: DashboardPageVO[] = [];

            dashboard_ids.map((dashboard_id) => {
                const _pages = self.dashboard_pages_by_dashboard_id[dashboard_id];
                pages.push(..._pages);
            });

            return pages;
        }

        // If already loaded, there is no need to check access
        const has_access = await DashboardPageVOManager.check_dashboard_page_vo_access();

        if (!has_access) {
            return;
        }

        // Initialize dashboards_pages (all_page_widget in dashboard) of DashboardPageVOManager instance
        // its should be initialized each time the dashboard page is loaded
        const dashboards_pages = await query(DashboardPageVO.API_TYPE_ID)
            .filter_by_num_has(field_names<DashboardPageVO>().dashboard_id, dashboard_ids)
            .select_vos<DashboardPageVO>();

        dashboard_ids.map((dashboard_id) => {
            const pages = dashboards_pages.filter(
                (page) => page.dashboard_id == dashboard_id
            );

            self.dashboard_pages_by_dashboard_id[dashboard_id] = pages;
        });

        return dashboards_pages;
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): DashboardPageVOManager {
        if (!DashboardPageVOManager.instance) {
            DashboardPageVOManager.instance = new DashboardPageVOManager();
        }

        return DashboardPageVOManager.instance;
    }

    private static instance: DashboardPageVOManager = null;

    public dashboard_pages_by_dashboard_id: { [dashboard_id: number]: DashboardPageVO[] } = {};
    public dashboard_pages: DashboardPageVO[] = null;

    protected constructor() { }

}
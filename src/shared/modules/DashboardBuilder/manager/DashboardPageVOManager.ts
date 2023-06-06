import ModuleAccessPolicy from "../../AccessPolicy/ModuleAccessPolicy";
import FieldFiltersVO from '../vos/FieldFiltersVO';
import { query } from "../../ContextFilter/vos/ContextQueryVO";
import DashboardPageVO from "../vos/DashboardPageVO";
import ModuleDAO from "../../DAO/ModuleDAO";

/**
 * DashboardPageVOManager
 *  - Find and Store dashboard_pages
 */
export default class DashboardPageVOManager {

    /**
     * find_dashboard_pages_by_dashboard_id
     *
     * @param {number} dashboard_id
     * @returns {Promise<DashboardPageVO[]>}
     */
    public static async find_dashboard_pages_by_dashboard_id(
        dashboard_id: number,
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
        const access_policy_name = ModuleDAO.getInstance().getAccessPolicyName(
            ModuleDAO.DAO_ACCESS_TYPE_READ,
            DashboardPageVO.API_TYPE_ID
        );
        const has_access = await ModuleAccessPolicy.getInstance().testAccess(
            access_policy_name
        );

        if (!has_access) {
            return;
        }

        // Initialize dashboard_pages (all_pages in dashboard) of DashboardPageVOManager instance
        // its should be initialized each time the dashboard page is loaded
        const dashboard_pages = await query(DashboardPageVO.API_TYPE_ID)
            .filter_by_num_eq('dashboard_id', dashboard_id)
            .select_vos<DashboardPageVO>();

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
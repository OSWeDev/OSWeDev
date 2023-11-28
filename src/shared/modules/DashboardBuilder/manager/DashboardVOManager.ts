import ModuleAccessPolicy from "../../AccessPolicy/ModuleAccessPolicy";
import ContextQueryVO, { query } from "../../ContextFilter/vos/ContextQueryVO";
import SortByVO from "../../ContextFilter/vos/SortByVO";
import DashboardVO from "../vos/DashboardVO";
import ModuleDAO from "../../DAO/ModuleDAO";
import SharedFiltersVO from "../vos/SharedFiltersVO";
import SharedFiltersVOManager from "./SharedFiltersVOManager";
import RangeHandler from "../../../tools/RangeHandler";
import FieldFiltersVO from "../vos/FieldFiltersVO";
import FieldFiltersVOHandler from "../handlers/FieldFiltersVOHandler";

/**
 * DashboardVOManager
 *  - Find and Store dashboards
 */
export default class DashboardVOManager {

    /**
     * load_shared_filters_with_dashboard
     * - Load shared_filters with the current dashboard and apply the field_filters from the previous dashboard
     * - if the shared_filters.dashboard_id is the previous dashboard_id,
     *      then apply the shared_filters.field_filters to the current dashboard
     * -The shared_filters should be reciprocal (dashboard_id <-> shared_with_dashboard_ids)
     *
     */
    public static async load_shared_filters_with_dashboard(
        dashboard: DashboardVO,
        get_dashboard_navigation_history: { current_dashboard_id: number, previous_dashboard_id: number },
        get_active_field_filters: FieldFiltersVO,
        set_active_field_filters: (field_filters: FieldFiltersVO) => void,
    ): Promise<void> {

        if (!dashboard) {
            return;
        }

        // We may have a previous dashboard_id
        const previous_dashboard_id = get_dashboard_navigation_history?.previous_dashboard_id;

        // If we don't have a previous dashboard_id,
        // we don't have to apply the field_filters from the previous dashboard_id
        if (!previous_dashboard_id) {
            return;
        }

        // We should find all shared_filters with the current dashboard_id
        const all_shared_filters_with_dashboard = await SharedFiltersVOManager.find_shared_filters_with_dashboard_ids(
            [dashboard.id]
        );

        // We should find the shared_filters from the previous dashboard_id
        const shared_filters = all_shared_filters_with_dashboard?.find((shared_filter) => {
            let is_shared_from_dashboard_id = false;

            // Check if the given previous_dashboard_id is in the shared_from_dashboard_ids
            // As it have the field_filters we want to apply
            RangeHandler.foreach_ranges_sync(shared_filter.shared_from_dashboard_ids, (d_id: number) => {
                if (d_id == previous_dashboard_id) {
                    is_shared_from_dashboard_id = true;
                }
            });

            return is_shared_from_dashboard_id;
        });

        const active_field_filters: FieldFiltersVO = get_active_field_filters;
        const field_filters_to_apply: FieldFiltersVO = {};

        // If we have shared_filters from the previous dashboard_id,
        // we apply the field_filters from the previous dashboard_id
        for (const api_type_id in shared_filters?.field_filters_to_share) {
            const field_filters_to_share = shared_filters?.field_filters_to_share[api_type_id];

            for (const field_id in field_filters_to_share) {
                const can_share = field_filters_to_share[field_id];

                // We check if the field_filters can be shared
                if (!can_share) {
                    continue;
                }

                // We check if the field_filters is empty
                const is_field_filters_empty = FieldFiltersVOHandler.is_field_filters_empty(
                    { api_type_id, field_id },
                    active_field_filters
                );

                if (is_field_filters_empty) {
                    continue;
                }

                const context_filter = active_field_filters[api_type_id][field_id];

                field_filters_to_apply[api_type_id] = field_filters_to_apply[api_type_id] || {};
                field_filters_to_apply[api_type_id][field_id] = context_filter;
            }
        }

        // We apply the field_filters from the previous dashboard_id
        set_active_field_filters(field_filters_to_apply);
    }

    /**
     * update_dashboard_navigation_history
     *  - Update the dashboard navigation history
     */
    public static update_dashboard_navigation_history(
        dashboard_id: number,
        get_dashboard_navigation_history: { current_dashboard_id: number, previous_dashboard_id: number },
        set_dashboard_navigation_history: (dashboard_navigation_history: { current_dashboard_id: number, previous_dashboard_id: number }) => void,
    ): void {
        // May be empty
        const dashboard_navigation_history = get_dashboard_navigation_history;

        if (
            (!dashboard_navigation_history) ||
            (dashboard_navigation_history?.current_dashboard_id != dashboard_id)
        ) {
            // We are navigating to a new dashboard, we clear the navigation history
            // In this case we must set the current_dashboard_id
            // and the previous_dashboard_id (with the old current_dashboard_id)
            set_dashboard_navigation_history({
                current_dashboard_id: dashboard_id,
                previous_dashboard_id: dashboard_navigation_history?.current_dashboard_id
            });
        }
    }

    /**
     * load_shared_filters_with_dashboard_id
     * - Load the shared filters with dashboard id and sort them by weight
     *
     * @param {number} [dashboard_id]
     * @param {boolean} [options.refresh]
     * @returns {Promise<DashboardVO[]>}
     */
    public static async load_shared_filters_with_dashboard_id(
        dashboard_id: number,
        options?: { refresh?: boolean }
    ): Promise<SharedFiltersVO[]> {

        const shared_filters = await SharedFiltersVOManager.find_shared_filters_with_dashboard_ids(
            [dashboard_id],
            {
                sorts: [
                    // new SortByVO(DashboardVO.API_TYPE_ID, 'weight', true),
                    new SortByVO(DashboardVO.API_TYPE_ID, 'id', true)
                ]
            },
            options
        );

        return shared_filters;
    }

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

        const limit = pagination?.limit ?? 500;

        if (!options?.refresh && self.all_dashboards_loaded) {
            return self.dashboards;
        }

        // Check access
        const has_access = await DashboardVOManager.check_dashboard_vo_access();

        if (!has_access) {
            return;
        }

        self.all_dashboards_loaded = false;

        if (!context_query) {
            context_query = query(DashboardVO.API_TYPE_ID);
        }

        // force set base_api_type_id to the VO API_TYPE_ID
        context_query.set_base_api_type_id(DashboardVO.API_TYPE_ID);

        if (pagination?.sorts?.length > 0) {
            context_query.set_sorts(pagination.sorts);
        }

        const dashboards = await context_query.set_limit(limit)
            .select_vos<DashboardVO>();

        self.dashboards = dashboards;

        self.all_dashboards_loaded = true;

        return dashboards;
    }

    /**
     * find_dashboard_by_id
     * - Find dashboard by id
     *
     * @param {ContextQueryVO} context_query
     * @param {boolean} options.refresh
     * @returns {Promise<DashboardVO[]>}
     */
    public static async find_dashboard_by_id(
        dashboard_id: number,
        options?: {
            refresh?: boolean
        }
    ): Promise<DashboardVO> {
        const self = DashboardVOManager.getInstance();

        let dashboard: DashboardVO = self.dashboards?.find((d) => {
            return d.id === dashboard_id;
        });

        if (!options?.refresh && dashboard?.id) {
            return dashboard;
        }

        // Check access
        const has_access = await DashboardVOManager.check_dashboard_vo_access();

        if (!has_access) {
            return;
        }

        dashboard = await query(DashboardVO.API_TYPE_ID)
            .filter_by_id(dashboard_id)
            .select_vo<DashboardVO>();

        if (dashboard?.id) {
            self.dashboards.push(dashboard);
        }

        return dashboard;
    }

    public static getInstance(): DashboardVOManager {
        if (!DashboardVOManager.instance) {
            DashboardVOManager.instance = new DashboardVOManager();
        }

        return DashboardVOManager.instance;
    }

    private static instance: DashboardVOManager = null;

    public all_dashboards_loaded: boolean = false;
    public dashboards: DashboardVO[] = [];

    protected constructor() { }

}
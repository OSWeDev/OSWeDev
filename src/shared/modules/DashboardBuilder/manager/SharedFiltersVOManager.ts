
import ModuleAccessPolicy from "../../AccessPolicy/ModuleAccessPolicy";
import { query } from "../../ContextFilter/vos/ContextQueryVO";
import SharedFiltersVO from "../vos/SharedFiltersVO";
import ModuleDAO from "../../DAO/ModuleDAO";
import RangeHandler from "../../../tools/RangeHandler";
import SortByVO from "../../ContextFilter/vos/SortByVO";
import DashboardPageFieldFiltersVOManager from "./DashboardPageFieldFiltersVOManager";
import { field_names } from "../../../tools/ObjectHandler";

/**
 * SharedFiltersVOManager
 */
export default class SharedFiltersVOManager {

    /**
     * check_shared_filters_vo_access
     * - Check if user has access to shared_filters vo
     *
     * TODO: to cache access rights we must use the actual user id
     *
     * @param {string} access_type
     * @returns {Promise<boolean>}
     */
    public static async check_shared_filters_vo_access(access_type?: string): Promise<boolean> {
        access_type = access_type ?? ModuleDAO.DAO_ACCESS_TYPE_READ;

        // Check access
        const access_policy_name = ModuleDAO.instance.getAccessPolicyName(
            access_type,
            SharedFiltersVO.API_TYPE_ID
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
     * find_shared_filters_from_dashboard_ids
     *
     * @param {number[]} dashboard_ids
     * @param {boolean} options.refresh
     * @returns {Promise<SharedFiltersVO[]>}
     */
    public static async find_shared_filters_from_dashboard_ids(
        dashboard_ids: number[],
        pagination?: { offset?: number, limit?: number, sorts?: SortByVO[] },
        options?: {
            refresh?: boolean
        }
    ): Promise<SharedFiltersVO[]> {
        const self = SharedFiltersVOManager.getInstance();

        // Check has all page_wigets already loaded
        const has_all_shared_filters_from_dashboard_loaded = dashboard_ids.every((dashboard_id) => {
            return self.shared_filters_from_dashboard_id[dashboard_id];
        });

        // Return shared_filters if already loaded
        if (!options?.refresh && has_all_shared_filters_from_dashboard_loaded) {
            const _shared_filters: SharedFiltersVO[] = [];

            dashboard_ids.map((dashboard_id) => {
                const shared_filters_map = self.shared_filters_from_dashboard_id[dashboard_id];
                _shared_filters.push(...shared_filters_map);
            });

            return _shared_filters;
        }

        // If already loaded, there is no need to check access
        const has_access = await SharedFiltersVOManager.check_shared_filters_vo_access();

        if (!has_access) {
            return;
        }

        // Convert dashboard_ids to numranges
        const dashboard_ids_numranges = RangeHandler.get_ids_ranges_from_list(
            dashboard_ids
        );

        // force set base_api_type_id
        const context_query = query(SharedFiltersVO.API_TYPE_ID);

        // Initialize context_query
        if (pagination?.sorts?.length > 0) {
            context_query.set_sorts(pagination.sorts);
        }

        // Initialize shared_filters (all_shared_filter in dashboard) of SharedFiltersVOManager instance
        // its should be initialized each time the dashboard page is loaded
        const shared_filters = await context_query
            .filter_by_num_x_ranges(field_names<SharedFiltersVO>().shared_from_dashboard_ids, dashboard_ids_numranges)
            .select_vos<SharedFiltersVO>();

        // We need to filter shared_filters that share by each dashboard_id
        dashboard_ids.map((dashboard_id) => {
            // Filter shared_filters that share by the given dashboard_id
            const shared_filters_map = shared_filters.filter((sf: SharedFiltersVO) => {
                let is_shared_from_dashboard_id = false;

                // Check if the given dashboard_id is in the shared_from_dashboard_ids
                RangeHandler.foreach_ranges_sync(sf.shared_from_dashboard_ids, (d_id: number) => {
                    if (dashboard_id == d_id) {
                        is_shared_from_dashboard_id = true;
                    }
                });

                return is_shared_from_dashboard_id;
            });

            // Save shared_filters_map in cache
            self.shared_filters_from_dashboard_id[dashboard_id] = shared_filters_map;
        });

        return shared_filters;
    }

    /**
     * find_shared_filters_with_dashboard_ids
     *  - Find shared filters with the given dashboard ids
     *
     * @param {number[]} dashboard_ids
     * @param {boolean} options.refresh
     * @returns {Promise<SharedFiltersVO[]>}
     */
    public static async find_shared_filters_with_dashboard_ids(
        dashboard_ids: number[],
        pagination?: { offset?: number, limit?: number, sorts?: SortByVO[] },
        options?: {
            refresh?: boolean
        }
    ): Promise<SharedFiltersVO[]> {
        const self = SharedFiltersVOManager.getInstance();

        // Check has all page_wigets already loaded
        const has_all_shared_filters_with_dashboard_loaded = dashboard_ids.every((dashboard_id) => {
            return self.shared_filters_with_dashboard_id[dashboard_id];
        });

        // Return shared_filters if already loaded
        if (!options?.refresh && has_all_shared_filters_with_dashboard_loaded) {
            const _shared_filters: SharedFiltersVO[] = [];

            dashboard_ids.map((dashboard_id) => {
                const shared_filters_map = self.shared_filters_with_dashboard_id[dashboard_id];
                _shared_filters.push(...shared_filters_map);
            });

            return _shared_filters;
        }

        // If already loaded, there is no need to check access
        const has_access = await SharedFiltersVOManager.check_shared_filters_vo_access();

        if (!has_access) {
            return;
        }

        // Convert dashboard_ids to numranges
        const dashboard_ids_numranges = RangeHandler.get_ids_ranges_from_list(
            dashboard_ids
        );

        // force set base_api_type_id
        const context_query = query(SharedFiltersVO.API_TYPE_ID);

        // Initialize context_query
        if (pagination?.sorts?.length > 0) {
            context_query.set_sorts(pagination.sorts);
        }

        // Initialize shared_filters (all_shared_filter in dashboard) of SharedFiltersVOManager instance
        // its should be initialized each time the dashboard page is loaded
        const shared_filters = await context_query
            .filter_by_num_x_ranges(field_names<SharedFiltersVO>().shared_with_dashboard_ids, dashboard_ids_numranges)
            .select_vos<SharedFiltersVO>();

        // We need to filter shared_filters that share with each dashboard_id
        dashboard_ids.map((dashboard_id) => {
            // Filter shared_filters that share with the given dashboard_id
            const shared_filters_map = shared_filters.filter((sf: SharedFiltersVO) => {
                let share_with_dashboard_id = false;

                // Check if the given dashboard_id is in the shared_with_dashboard_ids
                RangeHandler.foreach_ranges_sync(sf.shared_with_dashboard_ids, (d_id: number) => {
                    if (dashboard_id == d_id) {
                        share_with_dashboard_id = true;
                    }
                });

                return share_with_dashboard_id;
            });

            // Save shared_filters_map in cache
            self.shared_filters_with_dashboard_id[dashboard_id] = shared_filters_map;
        });

        return shared_filters;
    }

    /**
     * save_shared_filters
     *  - Do save or update the given shared filters
     *
     * TODO: check if the user has access to the given shared filters
     *
     * @param {SharedFiltersVO} shared_filters
     * @returns {Promise<boolean>}
     */
    public static async save_shared_filters(shared_filters: SharedFiltersVO): Promise<boolean> {

        /**
         * On filtre tous les false ici, par ce qu'on veut avoir la conf la plus légère possible
         */
        shared_filters = await SharedFiltersVOManager.filter_false_shared_filters(shared_filters);

        const res = await ModuleDAO.instance.insertOrUpdateVO(
            shared_filters
        );

        return res?.id != null;
    }

    /**
     * delete_shared_filters
     *  - Do delete the given shared filters
     *
     * TODO: check if the user has access to the given shared filters
     *
     * @param {SharedFiltersVO} shared_filters
     * @returns {Promise<boolean>}
     */
    public static async delete_shared_filters(shared_filters: SharedFiltersVO): Promise<boolean> {

        const res = await ModuleDAO.instance.deleteVOs(
            [shared_filters]
        );

        return res?.shift()?.id != null;
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): SharedFiltersVOManager {
        if (!SharedFiltersVOManager.instance) {
            SharedFiltersVOManager.instance = new SharedFiltersVOManager();
        }

        return SharedFiltersVOManager.instance;
    }

    private static instance: SharedFiltersVOManager = null;

    private static async filter_false_shared_filters(shared_filters: SharedFiltersVO): Promise<SharedFiltersVO> {

        const dashboard_pages_field_filters_map = await DashboardPageFieldFiltersVOManager.find_dashboard_pages_field_filters_by_dashboard_ids(
            RangeHandler.get_array_from_ranges(shared_filters.shared_from_dashboard_ids)
        );

        const selectionnable_field_filters = DashboardPageFieldFiltersVOManager.get_INTERSECTION_all_dashboard_pages_field_filters(//merge_all_dashboard_pages_field_filters(
            dashboard_pages_field_filters_map
        );


        const field_filters_to_share = {};

        for (const i in shared_filters.field_filters_to_share) {
            const field_filter = shared_filters.field_filters_to_share[i];

            const field_filter_to_share = {};
            for (const j in field_filter) {
                if (field_filter[j]) {
                    field_filter_to_share[j] = true;
                }
            }

            if (Object.keys(field_filter_to_share).length > 0) {
                field_filters_to_share[i] = field_filter_to_share;
            }
        }

        const selected_field_filters_to_share = {};
        for (const i in selectionnable_field_filters.field_filters) {
            const field_filter = selectionnable_field_filters.field_filters[i];

            const field_filter_to_share = {};
            for (const j in field_filter) {
                if ((typeof field_filter[j] !== 'undefined') && field_filters_to_share[i] && field_filters_to_share[i][j]) {
                    field_filter_to_share[j] = true;
                }
            }

            if (Object.keys(field_filter_to_share).length > 0) {
                selected_field_filters_to_share[i] = field_filter_to_share;
            }
        }

        shared_filters.field_filters_to_share = selected_field_filters_to_share;

        return shared_filters;
    }

    public shared_filters_with_dashboard_id: { [dashboard_id: number]: SharedFiltersVO[] } = {};
    public shared_filters_from_dashboard_id: { [dashboard_id: number]: SharedFiltersVO[] } = {};
    public shared_filters: SharedFiltersVO[] = null;
}
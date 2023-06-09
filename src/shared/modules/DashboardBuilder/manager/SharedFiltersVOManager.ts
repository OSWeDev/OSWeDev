
import ModuleAccessPolicy from "../../AccessPolicy/ModuleAccessPolicy";
import { query } from "../../ContextFilter/vos/ContextQueryVO";
import SharedFiltersVO from "../vos/SharedFiltersVO";
import ModuleDAO from "../../DAO/ModuleDAO";

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
        const access_policy_name = ModuleDAO.getInstance().getAccessPolicyName(
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
     * find_shared_filters_by_page_ids
     *
     * @param {number[]} page_ids
     * @param {boolean} options.refresh
     * @returns {Promise<SharedFiltersVO[]>}
     */
    public static async find_shared_filters_by_page_ids(
        page_ids: number[],
        options?: {
            refresh?: boolean
        }
    ): Promise<SharedFiltersVO[]> {
        const self = SharedFiltersVOManager.getInstance();

        // Check has all page_wigets already loaded
        const has_all_shared_filters_loaded = page_ids.every((page_id) => {
            return self.shared_filters_by_page_id[page_id];
        });

        // Return shared_filters if already loaded
        if (!options?.refresh && has_all_shared_filters_loaded) {
            const _shared_filters: SharedFiltersVO[] = [];

            page_ids.map((page_id) => {
                const s_filters = self.shared_filters_by_page_id[page_id];
                _shared_filters.push(...s_filters);
            });

            return _shared_filters;
        }

        // If already loaded, there is no need to check access
        const has_access = await SharedFiltersVOManager.check_shared_filters_vo_access();

        if (!has_access) {
            return;
        }

        // Initialize shared_filters (all_shared_filter in dashboard) of SharedFiltersVOManager instance
        // its should be initialized each time the dashboard page is loaded
        const shared_filters = await query(SharedFiltersVO.API_TYPE_ID)
            .filter_by_num_has('page_id', page_ids)
            .select_vos<SharedFiltersVO>();

        page_ids.map((page_id) => {
            const s_filters = shared_filters.filter((pwidget) => pwidget.page_id == page_id);
            self.shared_filters_by_page_id[page_id] = s_filters;
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

        const res = await ModuleDAO.getInstance().insertOrUpdateVO(shared_filters);

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

        const res = await ModuleDAO.getInstance().deleteVOs([shared_filters]);

        return res?.shift()?.id != null;
    }

    public static getInstance(): SharedFiltersVOManager {
        if (!SharedFiltersVOManager.instance) {
            SharedFiltersVOManager.instance = new SharedFiltersVOManager();
        }

        return SharedFiltersVOManager.instance;
    }

    private static instance: SharedFiltersVOManager = null;

    public shared_filters_by_page_id: { [page_id: number]: SharedFiltersVO[] } = {};
    public shared_filters: SharedFiltersVO[] = null;
}

import { field_names } from "../../../tools/ObjectHandler";
import RangeHandler from "../../../tools/RangeHandler";
import { query } from "../../ContextFilter/vos/ContextQueryVO";
import ModuleDAO from "../../DAO/ModuleDAO";
import SharedFiltersVO from "../vos/SharedFiltersVO";
import DashboardPageFieldFiltersVOManager from "./DashboardPageFieldFiltersVOManager";

/**
 * SharedFiltersVOManager
 */
export default class SharedFiltersVOManager {

    private static instance: SharedFiltersVOManager = null;

    public static async find_shared_filters_from_dashboard_ids(
        dashboard_ids: number[],
    ): Promise<SharedFiltersVO[]> {

        // Convert dashboard_ids to numranges
        const dashboard_ids_numranges = RangeHandler.get_ids_ranges_from_list(
            dashboard_ids
        );

        // force set base_api_type_id
        const context_query = query(SharedFiltersVO.API_TYPE_ID);

        // Initialize shared_filters (all_shared_filter in dashboard) of SharedFiltersVOManager instance
        // its should be initialized each time the dashboard page is loaded
        const shared_filters = await context_query
            .filter_by_num_x_ranges(field_names<SharedFiltersVO>().shared_from_dashboard_ids, dashboard_ids_numranges)
            .select_vos<SharedFiltersVO>();

        return shared_filters;
    }

    /**
     */
    public static async find_shared_filters_with_dashboard_ids(
        dashboard_ids: number[],
    ): Promise<SharedFiltersVO[]> {

        // Convert dashboard_ids to numranges
        const dashboard_ids_numranges = RangeHandler.get_ids_ranges_from_list(
            dashboard_ids
        );

        // force set base_api_type_id
        const context_query = query(SharedFiltersVO.API_TYPE_ID);

        // Initialize shared_filters (all_shared_filter in dashboard) of SharedFiltersVOManager instance
        // its should be initialized each time the dashboard page is loaded
        const shared_filters = await context_query
            .filter_by_num_x_ranges(field_names<SharedFiltersVO>().shared_with_dashboard_ids, dashboard_ids_numranges)
            .select_vos<SharedFiltersVO>();

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
    public static async save_shared_filters(shared_filters: SharedFiltersVO, code_lang: string): Promise<boolean> {

        /**
         * On filtre tous les false ici, par ce qu'on veut avoir la conf la plus légère possible
         */
        shared_filters = await SharedFiltersVOManager.filter_false_shared_filters(shared_filters, code_lang);

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


    private static async filter_false_shared_filters(
        shared_filters: SharedFiltersVO,
        code_lang: string,
    ): Promise<SharedFiltersVO> {

        const dashboard_pages_field_filters_map = await DashboardPageFieldFiltersVOManager.find_dashboard_pages_field_filters_by_dashboard_ids(
            RangeHandler.get_array_from_ranges(shared_filters.shared_from_dashboard_ids),
            code_lang,
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

    // public shared_filters_with_dashboard_id: { [dashboard_id: number]: SharedFiltersVO[] } = {};
    // public shared_filters_from_dashboard_id: { [dashboard_id: number]: SharedFiltersVO[] } = {};
    // public shared_filters: SharedFiltersVO[] = null;
}
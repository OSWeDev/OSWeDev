import VOFieldRefVO from '../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import { field_names } from '../../../tools/ObjectHandler';
import ModuleAccessPolicy from '../../AccessPolicy/ModuleAccessPolicy';
import { query } from "../../ContextFilter/vos/ContextQueryVO";
import ModuleDAO from '../../DAO/ModuleDAO';
import VOsTypesManager from '../../VO/manager/VOsTypesManager';
import DashboardPageWidgetVO from "../vos/DashboardPageWidgetVO";
import DashboardWidgetVO from "../vos/DashboardWidgetVO";
import WidgetOptionsMetadataVO from '../vos/WidgetOptionsMetadataVO';
import VOFieldRefVOManager from './VOFieldRefVOManager';
import WidgetOptionsVOManager from "./WidgetOptionsVOManager";

/**
 * DashboardPageWidgetVOManager
 */
export default class DashboardPageWidgetVOManager {


    /**
     * check_page_widget_vo_access
     * - Check if user has access to page_widget vo
     *
     * TODO: to cache access rights we must use the actual user id
     *
     * @param {string} access_type
     * @returns {Promise<boolean>}
     */
    public static async check_page_widget_vo_access(access_type?: string): Promise<boolean> {
        access_type = access_type ?? ModuleDAO.DAO_ACCESS_TYPE_READ;

        // Check access
        const access_policy_name = ModuleDAO.instance.getAccessPolicyName(
            access_type,
            DashboardPageWidgetVO.API_TYPE_ID
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
     * filter_all_page_widgets_options_by_widget_name
     * - Return all page widgets options corresponding to widget_name
     *
     * @param {string} widget_name
     * @returns {{ [page_widget_id: number]: WidgetOptionsMetadataVO }}
     */
    public static async filter_all_page_widgets_options_by_widget_name(
        dashboard_page_widgets: DashboardPageWidgetVO[],
        widget_name: string,
        options?: {
            all_page_widgets?: DashboardPageWidgetVO[],
            sorted_widgets_types?: DashboardWidgetVO[],
        }
    ): Promise<{ [page_widget_id: number]: WidgetOptionsMetadataVO }> {

        // Get sorted_widgets from dashboard (or sorted_widgets_types)
        const sorted_widgets = await WidgetOptionsVOManager.get_all_sorted_widgets_types();

        const res: {
            [page_widget_id: number]: WidgetOptionsMetadataVO
        } = {};

        const sorted_widgets_types: DashboardWidgetVO[] = options?.sorted_widgets_types ?? sorted_widgets;
        const all_page_widgets: DashboardPageWidgetVO[] = options?.all_page_widgets ?? dashboard_page_widgets;

        if (
            !(sorted_widgets_types?.length > 0) ||
            !(all_page_widgets?.length > 0)
        ) {
            return;
        }

        // Find id of widget named widget_name
        const widget_id = sorted_widgets_types?.find(
            (widget_type) => widget_type?.name == widget_name
        ).id;

        // widget_id required to continue
        if (!widget_id) { return; }

        // Find all widget_name widgets of actual page
        const filtered_page_widgets = Object.values(all_page_widgets)?.filter(
            (pw: DashboardPageWidgetVO) => pw.widget_id == widget_id
        );

        for (const key in filtered_page_widgets) {
            const page_widget = filtered_page_widgets[key];

            const page_widget_options = JSON.parse(page_widget?.json_options ?? '{}');
            const page_widget_id = page_widget.id;

            res[page_widget_id] = new WidgetOptionsMetadataVO().from({
                widget_options: page_widget_options,
                page_widget_id: page_widget.id,
                widget_name,
                page_widget: page_widget, // Add page_widget to metadata for easy access
            });
        }

        return res;
    }

    /**
     * Find all sorted page widgets options
     * - Return all page widgets options sorted by widget name
     *
     * @deprecated: Use find_all_widgets_options_metadata_by_page_id instead
     * It's would be better to use find by page_id (No need to load all page_widgets if already loaded)
     *
     * @param options
     * @returns {{ [page_widget_id: number]: WidgetOptionsMetadataVO }}
     */
    public static async find_all_widgets_options_metadata(
        current_page_page_widgets: DashboardPageWidgetVO[],
        options?: {
            all_page_widgets?: DashboardPageWidgetVO[],
            sorted_widgets_types?: DashboardWidgetVO[],
        }
    ): Promise<{ [page_widget_id: number]: WidgetOptionsMetadataVO }> {

        // Get sorted_widgets from dashboard (or sorted_widgets_types)
        const sorted_widgets = await WidgetOptionsVOManager.get_all_sorted_widgets_types();

        const res: {
            [page_widget_id: number]: WidgetOptionsMetadataVO
        } = {};

        const sorted_widgets_types: DashboardWidgetVO[] = options?.sorted_widgets_types ?? sorted_widgets;
        const all_page_widgets: DashboardPageWidgetVO[] = options?.all_page_widgets ?? current_page_page_widgets;

        if (
            !(sorted_widgets_types?.length > 0) ||
            !(all_page_widgets?.length > 0)
        ) {
            return;
        }

        const sorted_widgets_types_by_id: { [widget_id: number]: DashboardWidgetVO } = VOsTypesManager.vosArray_to_vosByIds(sorted_widgets_types);

        for (const key in all_page_widgets) {
            const page_widget = all_page_widgets[key];

            const page_widget_options = JSON.parse(page_widget?.json_options ?? '{}');
            const page_widget_id = page_widget.id;

            res[page_widget_id] = new WidgetOptionsMetadataVO().from({
                widget_options: page_widget_options,
                page_widget_id: page_widget.id,
                widget_name: sorted_widgets_types_by_id[page_widget.widget_id].name,
            });
        }

        return res;
    }

    // /**
    //  * find_all_widgets_options_metadata_by_page_id
    //  * - Return all page widgets_options metadata of the given page_id
    //  *
    //  * @param {number} dashboard_page_id
    //  * @returns {{ [page_widget_id: number]: WidgetOptionsMetadataVO }}
    //  */
    // public static async find_all_widgets_options_metadata_by_page_id(
    //     dashboard_page_id: number,
    // ): Promise<{ [page_widget_id: number]: WidgetOptionsMetadataVO }> {

    //     // All sorted_widgets_types (Should get all possible widgets_types)
    //     const sorted_widgets_types = await WidgetOptionsVOManager.get_all_sorted_widgets_types();
    //     // Get page_widgets of actual page
    //     const page_widgets = await DashboardPageWidgetVOManager.find_page_widgets_by_page_id(
    //         dashboard_page_id
    //     );

    //     const widgets_options_metadata: {
    //         [page_widget_id: number]: WidgetOptionsMetadataVO
    //     } = {};

    //     // Classify by widget_type
    //     for (const key_i in sorted_widgets_types) {
    //         const widget_type = sorted_widgets_types[key_i];

    //         // Find all widgets of the given widget_type of actual page
    //         const filtered_page_widgets = Object.values(page_widgets)?.filter(
    //             (pw: DashboardPageWidgetVO) => pw.widget_id == widget_type.id
    //         );

    //         for (const key in filtered_page_widgets) {
    //             const page_widget = filtered_page_widgets[key];

    //             const page_widget_options = JSON.parse(page_widget?.json_options ?? '{}');
    //             const page_widget_id = page_widget.id;

    //             // TODO: May be good to create the actual widget_options vo here (ex: YearFilterVO)
    //             // TODO: Create widget_options vo factory

    //             widgets_options_metadata[page_widget_id] = new WidgetOptionsMetadataVO().from({
    //                 widget_options: page_widget_options,
    //                 dashboard_page_id: page_widget.page_id,
    //                 page_widget_id: page_widget.id,
    //                 widget_name: widget_type?.name,
    //             });
    //         }
    //     }

    //     return widgets_options_metadata;
    // }


    /**
     * find_all_widgets_options_metadata_by_page_id
     * - Return all page widgets_options metadata of the given page_id
     *
     * @param {number} dashboard_id
     * @returns {{ [page_widget_id: number]: WidgetOptionsMetadataVO }}
     */
    public static async find_all_widgets_options_metadata_by_dashboard_id(
        dashboard_id: number,
    ): Promise<{ [page_widget_id: number]: WidgetOptionsMetadataVO }> {

        // All sorted_widgets_types (Should get all possible widgets_types)
        const sorted_widgets_types = await WidgetOptionsVOManager.get_all_sorted_widgets_types();
        // Get page_widgets of actual page
        const page_widgets = await query(DashboardPageWidgetVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<DashboardPageWidgetVO>().dashboard_id, dashboard_id)
            .select_vos<DashboardPageWidgetVO>();

        const widgets_options_metadata: {
            [page_widget_id: number]: WidgetOptionsMetadataVO
        } = {};

        // Classify by widget_type
        for (const key_i in sorted_widgets_types) {
            const widget_type = sorted_widgets_types[key_i];

            // Find all widgets of the given widget_type of actual page
            const filtered_page_widgets = Object.values(page_widgets)?.filter(
                (pw: DashboardPageWidgetVO) => pw.widget_id == widget_type.id
            );

            for (const key in filtered_page_widgets) {
                const page_widget = filtered_page_widgets[key];

                const page_widget_options = JSON.parse(page_widget?.json_options ?? '{}');
                const page_widget_id = page_widget.id;

                // TODO: May be good to create the actual widget_options vo here (ex: YearFilterVO)
                // TODO: Create widget_options vo factory

                widgets_options_metadata[page_widget_id] = new WidgetOptionsMetadataVO().from({
                    widget_options: page_widget_options,
                    page_widget_id: page_widget.id,
                    widget_name: widget_type?.name,
                });
            }
        }

        return widgets_options_metadata;
    }


    /**
     * find_widget_options_metadata_by_page_widget_id
     *  - Return widget_options_metadata of the given page_widget_id
     *
     * @param {number} page_widget_id
     * @returns {WidgetOptionsMetadataVO
     */
    public static async find_widget_options_metadata_by_page_widget_id(
        page_widget_id: number,
    ): Promise<WidgetOptionsMetadataVO> {

        // All sorted_widgets_types (Should get all possible widgets_types)
        const sorted_widgets_types = await WidgetOptionsVOManager.get_all_sorted_widgets_types();

        // Get page_widget
        const page_widget = await DashboardPageWidgetVOManager.find_page_widget(
            page_widget_id
        );

        // widget_options_metadata of the given page_widget
        let widgets_options_metadata: {
            widget_options: any, // JSON widget_options of page_widget
            widget_name: string, // Required to find widget_type for factory construction
            page_widget_id: number // Required to find page_widget
        } = null;

        // Find the widget_type of the given page_widget
        const widget_type = Object.values(sorted_widgets_types)?.find(
            (wt: DashboardWidgetVO) => wt.id == page_widget.widget_id
        );

        // Create widget_options vo
        const page_widget_options = WidgetOptionsVOManager.create_widget_options_vo_by_name(
            widget_type?.name,
            widget_type?.is_filter,
            page_widget.json_options
        );

        widgets_options_metadata = {
            widget_options: page_widget_options,
            page_widget_id: page_widget.id,
            widget_name: widget_type?.name,
        };

        return new WidgetOptionsMetadataVO().from(
            widgets_options_metadata
        );
    }

    // /**
    //  * find_all_widgets_options_by_page_id
    //  * - Return all page widgets_options of the given page_id
    //  *
    //  * @param {number} page_id
    //  * @returns {{ [page_widget_id: number]: WidgetOptionsMetadataVO }}
    //  */
    // public static async find_all_widgets_options_by_page_id(
    //     page_id: number,
    // ): Promise<any[]> {

    //     // Get widgets_options_metadata of the current dashboard_page
    //     const widgets_options_metadata = await DashboardPageWidgetVOManager.find_all_widgets_options_metadata_by_dashboard_id(
    //         dashboard_id,
    //     );

    //     // Get widgets_options of the current dashboard_page
    //     const widgets_options = Object.values(widgets_options_metadata).map(
    //         (widget_options_metadata) => widget_options_metadata.widget_options
    //     );

    //     return widgets_options;
    // }

    /**
     * find_all_widgets_options_by_dashboard_id
     * - Return all page widgets_options of the given dashboard_id
     *
     * @param {number} dashboard_id
     * @returns {{ [page_widget_id: number]: WidgetOptionsMetadataVO }}
     */
    public static async find_all_widgets_options_by_dashboard_id(
        dashboard_id: number,
    ): Promise<any[]> {

        // Get widgets_options_metadata of the current dashboard_page
        const widgets_options_metadata = await DashboardPageWidgetVOManager.find_all_widgets_options_metadata_by_dashboard_id(
            dashboard_id,
        );

        // Get widgets_options of the current dashboard_page
        const widgets_options = Object.values(widgets_options_metadata).map(
            (widget_options_metadata) => widget_options_metadata.widget_options
        );

        return widgets_options;
    }

    /**
     * Find all page widgets options by vo_field_ref
     * - Return all page widgets options corresponding to vo_field_ref
     *
     * @param {VOFieldRefVO} vo_field_ref
     * @param {DashboardPageWidgetVO[]} options.all_page_widgets - all_page_widgets from dashboard
     * @param {DashboardWidgetVO[]} options.sorted_widgets_types - sorted_widgets_types the actual widgets types from dashboard
     * @returns {WidgetOptionsMetadataVO[]}
     */
    public static async find_all_widgets_options_metadata_by_vo_field_ref(
        current_page_page_widgets: DashboardPageWidgetVO[],
        vo_field_ref: VOFieldRefVO,
        options?: {
            all_page_widgets?: DashboardPageWidgetVO[],
            sorted_widgets_types?: DashboardWidgetVO[],
        }
    ): Promise<WidgetOptionsMetadataVO[]> {

        // Get widgets_options_metadata from dashboard
        const widgets_options_metadata = DashboardPageWidgetVOManager.find_all_widgets_options_metadata(
            current_page_page_widgets,
            {
                sorted_widgets_types: options?.sorted_widgets_types,
                all_page_widgets: options?.all_page_widgets,
            });

        let res: WidgetOptionsMetadataVO[] = [];

        // Find all page widgets options corresponding to vo_field_ref
        // TODO: Does not apply to all widgets (ex: yearfilter widget does not have vo_field_ref)
        res = Object.values(widgets_options_metadata)?.filter((sorted_page_widget_option) => {
            const _vo_field_ref = VOFieldRefVOManager.create_vo_field_ref_vo_from_widget_options(
                sorted_page_widget_option.widget_options,
            );

            const has_api_type_id = _vo_field_ref?.api_type_id == vo_field_ref.api_type_id;
            const has_field_id = _vo_field_ref?.field_id == vo_field_ref.field_id;

            return has_api_type_id && has_field_id;
        });

        return res;
    }

    /**
     * find_page_widgets_by_widget_name
     * - This method is responsible for loading the page_widgets of the given dashboard_id
     *
     * @param {number} dashboard_id
     * @param {string} widget_name - widget_name (ex: yearfilter, fieldvaluefilter, monthfilter, ...)
     * @returns {Promise<DashboardPageWidgetVO[]>}
     */
    public static async find_page_widgets_by_widget_name(
        dashboard_id: number,
        widget_name: string, // - widget_name (ex: yearfilter, fieldvaluefilter, monthfilter, ...)
    ): Promise<DashboardPageWidgetVO[]> {
        // All page_widgets of the given dashboard_id
        const page_widgets: DashboardPageWidgetVO[] = await query(DashboardPageWidgetVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<DashboardPageWidgetVO>().dashboard_id, dashboard_id)
            .select_vos<DashboardPageWidgetVO>();

        // All sorted_widgets_types (Should get all possible widgets_types)
        const sorted_widgets_types = await WidgetOptionsVOManager.get_all_sorted_widgets_types();

        if (
            !(sorted_widgets_types?.length > 0) ||
            !(page_widgets?.length > 0)
        ) {
            return;
        }

        // Find id of widget that have type e.g. "yearfilter"
        const widget_id = sorted_widgets_types?.find(
            (widget_type) => widget_type?.name == widget_name
        ).id;

        // widget_id required to continue
        if (!widget_id) {
            return;
        }

        // Find all widgets of actual page by the given widget_name (or related widget_id)
        const filtered_page_widgets = Object.values(page_widgets)?.filter(
            (pw: DashboardPageWidgetVO) => pw.widget_id == widget_id
        );

        return filtered_page_widgets;
    }

    // /**
    //  * find_page_widgets_by_page_id
    //  * - This method is responsible for loading the page_widgets of the given page_id
    //  *
    //  * @param {number} page_id
    //  * @returns {Promise<DashboardPageWidgetVO[]>}
    //  */
    // public static async find_page_widgets_by_page_id(
    //     page_id: number,
    // ): Promise<DashboardPageWidgetVO[]> {

    //     // Initialize page_widgets (all_page_widget in dashboard) of DashboardPageWidgetVOManager instance
    //     // its should be initialized each time the dashboard page is loaded
    //     const page_widgets = await query(DashboardPageWidgetVO.API_TYPE_ID)
    //         .filter_by_num_eq(field_names<DashboardPageWidgetVO>().page_id, page_id)
    //         .select_vos<DashboardPageWidgetVO>();

    //     return page_widgets;
    // }


    /**
     * find_page_widget
     *  - This method is responsible for loading the page_widget of the given page_widget_id
     *  - Load from cache if already loaded
     *
     * @param {number} page_widget_id
     * @param {boolean} options.refresh
     * @returns {Promise<DashboardPageWidgetVO[]>}
     */
    public static async find_page_widget(
        page_widget_id: number,
    ): Promise<DashboardPageWidgetVO> {

        return await query(DashboardPageWidgetVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<DashboardPageWidgetVO>().id, page_widget_id)
            .select_vo<DashboardPageWidgetVO>();
    }
}
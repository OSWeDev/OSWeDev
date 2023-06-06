import VOFieldRefVO from '../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import DashboardWidgetVOManager from "./DashboardWidgetVOManager";
import DashboardPageWidgetVO from "../vos/DashboardPageWidgetVO";
import { query } from "../../ContextFilter/vos/ContextQueryVO";
import DashboardWidgetVO from "../vos/DashboardWidgetVO";
import ModuleAccessPolicy from '../../AccessPolicy/ModuleAccessPolicy';
import ModuleDAO from '../../DAO/ModuleDAO';

/**
 * DashboardPageWidgetVOManager
 */
export default class DashboardPageWidgetVOManager {

    /**
     * check_page_widget_access
     * - Check if user has access to page_widget vo
     *
     * TODO: to cache access rights we must use the actual user id
     *
     * @param {string} access_type
     * @returns {Promise<boolean>}
     */
    public static async check_page_widget_access(access_type?: string): Promise<boolean> {
        access_type = access_type ?? ModuleDAO.DAO_ACCESS_TYPE_READ;

        // Check access
        const access_policy_name = ModuleDAO.getInstance().getAccessPolicyName(
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
     * @returns {{ [page_widget_id: string]: { widget_options: any, widget_name: string, page_widget_id: number } }}
     */
    public static filter_all_page_widgets_options_by_widget_name(
        widget_name: string,
        options?: {
            all_page_widgets?: DashboardPageWidgetVO[],
            sorted_widgets_types?: DashboardWidgetVO[],
        }
    ): { [page_widget_id: string]: { widget_options: any, widget_name: string, page_widget_id: number } } {

        // Get sorted_widgets from dashboard (or sorted_widgets_types)
        const { sorted_widgets } = DashboardWidgetVOManager.getInstance();
        // Get page_widgets (or all_page_widgets from dashboard)
        const { page_widgets } = DashboardPageWidgetVOManager.getInstance();

        const res: {
            [page_widget_id: string]: {
                widget_options: any,
                widget_name: string,
                page_widget_id: number
            }
        } = {};

        let sorted_widgets_types: DashboardWidgetVO[] = options?.sorted_widgets_types ?? sorted_widgets;
        let all_page_widgets: DashboardPageWidgetVO[] = options?.all_page_widgets ?? page_widgets;

        if (
            !(sorted_widgets_types?.length > 0) ||
            !(all_page_widgets?.length > 0)
        ) {
            return;
        }

        // Find id of widget that have type "yearfilter"
        const widget_id = sorted_widgets_types?.find(
            (widget_type) => widget_type?.name == widget_name
        ).id;

        // widget_id required to continue
        if (!widget_id) { return; }

        // Find all yearfilter widgets of actual page
        const filtered_page_widgets = Object.values(all_page_widgets)?.filter(
            (pw: DashboardPageWidgetVO) => pw.widget_id == widget_id
        );

        for (const key in filtered_page_widgets) {
            const page_widget = filtered_page_widgets[key];

            const page_widget_options = JSON.parse(page_widget?.json_options ?? '{}');
            const page_widget_id = page_widget.id;

            res[page_widget_id] = {
                widget_options: page_widget_options,
                page_widget_id: page_widget.id,
                widget_name,
            };
        }

        return res;
    }

    /**
     * Find all sorted page widgets options
     * - Return all page widgets options sorted by widget name
     *
     * @deprecated: Use find_all_wigdets_options_metadata_by_page_id instead
     * It's would be better to use find by page_id (There would be no need to load all page_widgets if already loaded)
     *
     * @param options
     * @returns {{ [page_widget_id: string]: { widget_options: any, widget_name: string, page_widget_id: number } }}
     */
    public static find_all_sorted_page_wigdets_options(
        options?: {
            all_page_widgets?: DashboardPageWidgetVO[],
            sorted_widgets_types?: DashboardWidgetVO[],
        }
    ): { [page_widget_id: string]: { widget_options: any, widget_name: string, page_widget_id: number } } {

        // Get sorted_widgets from dashboard (or sorted_widgets_types)
        const { sorted_widgets } = DashboardWidgetVOManager.getInstance();
        // Get page_widgets (or all_page_widgets from dashboard)
        const { page_widgets } = DashboardPageWidgetVOManager.getInstance();

        const res: {
            [page_widget_id: string]: {
                widget_options: any,
                widget_name: string,
                page_widget_id: number
            }
        } = {};

        let sorted_widgets_types: DashboardWidgetVO[] = options?.sorted_widgets_types ?? sorted_widgets;
        let all_page_widgets: DashboardPageWidgetVO[] = options?.all_page_widgets ?? page_widgets;

        if (
            !(sorted_widgets_types?.length > 0) ||
            !(all_page_widgets?.length > 0)
        ) {
            return;
        }

        for (const key_i in sorted_widgets_types) {
            const widget_type = sorted_widgets_types[key_i];

            // Find all yearfilter widgets of actual page
            const filtered_page_widgets = Object.values(all_page_widgets)?.filter(
                (pw: DashboardPageWidgetVO) => pw.widget_id == widget_type.id
            );

            for (const key in filtered_page_widgets) {
                const page_widget = filtered_page_widgets[key];

                const page_widget_options = JSON.parse(page_widget?.json_options ?? '{}');
                const page_widget_id = page_widget.id;

                res[page_widget_id] = {
                    widget_options: page_widget_options,
                    page_widget_id: page_widget.id,
                    widget_name: widget_type?.name,
                };
            }
        }

        return res;
    }

    /**
     * find_all_wigdets_options_metadata_by_page_id
     * - Return all page widgets_options metadata of the given page_id
     *
     * @param {number} page_id
     * @returns {{ [page_widget_id: string]: { widget_options: any, widget_name: string, page_widget_id: number } }}
     */
    public static async find_all_wigdets_options_metadata_by_page_id(
        page_id: number,
    ): Promise<{ [page_widget_id: string]: { widget_options: any, widget_name: string, page_widget_id: number } }> {

        // All sorted_widgets_types (Should get all possible widgets_types)
        const sorted_widgets_types = await DashboardWidgetVOManager.find_all_sorted_widgets_types();
        // Get page_widgets of actual page
        const page_widgets = await DashboardPageWidgetVOManager.find_page_widgets_by_page_id(page_id);

        const widgets_options_metadata: {
            [page_widget_id: string]: {
                widget_options: any, // JSON widget_options of page_widget
                widget_name: string, // Required to find widget_type for factory construction
                page_widget_id: number // Required to find page_widget
            }
        } = {};

        for (const key_i in sorted_widgets_types) {
            const widget_type = sorted_widgets_types[key_i];

            // Find all yearfilter widgets of actual page
            const filtered_page_widgets = Object.values(page_widgets)?.filter(
                (pw: DashboardPageWidgetVO) => pw.widget_id == widget_type.id
            );

            for (const key in filtered_page_widgets) {
                const page_widget = filtered_page_widgets[key];

                const page_widget_options = JSON.parse(page_widget?.json_options ?? '{}');
                const page_widget_id = page_widget.id;

                // TODO: May be good to create the actual widget_options vo here

                widgets_options_metadata[page_widget_id] = {
                    widget_options: page_widget_options,
                    page_widget_id: page_widget.id,
                    widget_name: widget_type?.name,
                };
            }
        }

        return widgets_options_metadata;
    }

    /**
     * Find all page widgets options by vo_field_ref
     * - Return all page widgets options corresponding to vo_field_ref
     *
     * @param {VOFieldRefVO} vo_field_ref
     * @param {DashboardPageWidgetVO[]} options.all_page_widgets - all_page_widgets from dashboard
     * @param {DashboardWidgetVO[]} options.sorted_widgets_types - sorted_widgets_types the actual widgets types from dashboard
     * @returns {{ widget_options: any, widget_name: string, page_widget_id: number }[]}
     */
    public static async find_all_page_wigdets_options_by_vo_field_ref(
        vo_field_ref: VOFieldRefVO,
        options?: {
            all_page_widgets?: DashboardPageWidgetVO[],
            sorted_widgets_types?: DashboardWidgetVO[],
        }
    ): Promise<Array<{ widget_options: any, widget_name: string, page_widget_id: number }>> {

        // Get sorted_page_widgets_options from dashboard
        const sorted_page_widgets_options = DashboardPageWidgetVOManager.find_all_sorted_page_wigdets_options({
            sorted_widgets_types: options?.sorted_widgets_types,
            all_page_widgets: options?.all_page_widgets,
        });

        let res: Array<{ widget_options: any, widget_name: string, page_widget_id: number }> = [];

        res = Object.values(sorted_page_widgets_options)?.filter((sorted_page_widget_option) => {
            const _vo_field_ref = sorted_page_widget_option?.widget_options?.vo_field_ref;

            const has_api_type_id = _vo_field_ref?.api_type_id == vo_field_ref.api_type_id;
            const has_field_id = _vo_field_ref?.field_id == vo_field_ref.field_id;

            return has_api_type_id && has_field_id;
        });

        return res;
    }

    /**
     * find_page_widgets_by_page_id
     * - This method is responsible for loading the page_widgets of the given page_id
     *
     * @param {number} page_id
     * @returns {Promise<DashboardPageWidgetVO[]>}
     */
    public static async find_page_widgets_by_page_id(
        page_id: number,
        options?: {
            refresh?: boolean
        }
    ): Promise<DashboardPageWidgetVO[]> {
        const self = DashboardPageWidgetVOManager.getInstance();

        // Return page_widgets if already loaded
        if (!options?.refresh && self.page_widgets_by_page_id[page_id]) {
            return self.page_widgets_by_page_id[page_id];
        }

        // If already loaded, there is no need to check access
        const has_access = await DashboardPageWidgetVOManager.check_page_widget_access();

        if (!has_access) {
            return;
        }

        // Initialize page_widgets (all_page_widget in dashboard) of DashboardPageWidgetVOManager instance
        // its should be initialized each time the dashboard page is loaded
        const page_widgets = await query(DashboardPageWidgetVO.API_TYPE_ID)
            .filter_by_num_eq('page_id', page_id)
            .select_vos<DashboardPageWidgetVO>();

        self.page_widgets_by_page_id[page_id] = page_widgets;
        self.page_widgets = page_widgets;

        return page_widgets;
    }

    public static getInstance(): DashboardPageWidgetVOManager {
        if (!DashboardPageWidgetVOManager.instance) {
            DashboardPageWidgetVOManager.instance = new DashboardPageWidgetVOManager();
        }

        return DashboardPageWidgetVOManager.instance;
    }

    private static instance: DashboardPageWidgetVOManager = null;

    public page_widgets_by_page_id: { [page_id: number]: DashboardPageWidgetVO[] } = {};
    public page_widgets: DashboardPageWidgetVO[] = null;

    protected constructor() { }
}
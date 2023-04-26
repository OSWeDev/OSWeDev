import DashboardWidgetVOManager from "./DashboardWidgetVOManager";
import DashboardPageWidgetVO from "../vos/DashboardPageWidgetVO";
import { query } from "../../ContextFilter/vos/ContextQueryVO";
import DashboardWidgetVO from "../vos/DashboardWidgetVO";

/**
 * @class DashboardPageWidgetVOManager
 */
export default class DashboardPageWidgetVOManager {

    /**
     * Get Filter Widgets Options By Widget Name
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
            [page_widget_id: string]: { widget_options: any, widget_name: string, page_widget_id: number }
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
            (widget_type) => widget_type.name == widget_name
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
     * find_page_widget_items_by_page_id
     *
     * @param {number} page_id
     * @returns {Promise<DashboardPageWidgetVO[]>}
     */
    public static async find_page_widget_items_by_page_id(page_id: number): Promise<DashboardPageWidgetVO[]> {
        const self = DashboardPageWidgetVOManager.getInstance();

        // Initialize page_widgets (all_page_widget in dashboard) of DashboardPageWidgetVOManager instance
        // its should be initialized each time the dashboard page is loaded
        self.page_widgets = await query(DashboardPageWidgetVO.API_TYPE_ID)
            .filter_by_num_eq('page_id', page_id)
            .select_vos<DashboardPageWidgetVO>();

        return self.page_widgets;
    }

    public static getInstance(): DashboardPageWidgetVOManager {
        if (!DashboardPageWidgetVOManager.instance) {
            DashboardPageWidgetVOManager.instance = new DashboardPageWidgetVOManager();
        }
        return DashboardPageWidgetVOManager.instance;
    }

    private static instance: DashboardPageWidgetVOManager = null;

    public page_widgets: DashboardPageWidgetVO[] = null;

    protected constructor() { }
}
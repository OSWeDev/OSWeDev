import DashboardPageWidgetVOManager from "./DashboardPageWidgetVOManager";
import YearFilterWidgetOptionsVO from "../vos/YearFilterWidgetOptionsVO";

/**
 * @class YearFilterWidgetManager
 */
export default class YearFilterWidgetManager {

    /**
     * Get Year Filters Widgets Options
     *
     * @return {{ [title_name_code: string]: { widget_options: FieldValueFilterWidgetOptionsVO, widget_name: string, dashboard_page_id: number, page_widget_id: number } }}
     */
    public static async get_year_filters_widgets_options(
        dashboard_page_id: number,
    ): Promise<
        {
            [title_name_code: string]: { widget_options: YearFilterWidgetOptionsVO, widget_name: string, dashboard_page_id: number, page_widget_id: number }
        }
    > {

        const year_page_widgets: {
            [page_widget_id: string]: { widget_options: any, widget_name: string, dashboard_page_id: number, page_widget_id: number }
        } = await DashboardPageWidgetVOManager.filter_all_page_widgets_options_by_widget_name([dashboard_page_id], 'yearfilter');

        const res: {
            [title_name_code: string]: { widget_options: YearFilterWidgetOptionsVO, widget_name: string, dashboard_page_id: number, page_widget_id: number }
        } = {};

        for (const key in year_page_widgets) {
            const options = year_page_widgets[key];

            const widget_options = new YearFilterWidgetOptionsVO().from(options.widget_options);
            const name = widget_options.get_placeholder_name_code_text(options.page_widget_id);

            res[name] = {
                dashboard_page_id: options.dashboard_page_id,
                page_widget_id: options.page_widget_id,
                widget_name: options.widget_name,
                widget_options: widget_options
            };
        }

        return res;
    }

    public static getInstance(): YearFilterWidgetManager {
        if (!YearFilterWidgetManager.instance) {
            YearFilterWidgetManager.instance = new YearFilterWidgetManager();
        }
        return YearFilterWidgetManager.instance;
    }

    private static instance: YearFilterWidgetManager = null;
}
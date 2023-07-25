import DashboardPageWidgetVOManager from "./DashboardPageWidgetVOManager";
import MonthFilterWidgetOptionsVO from "../vos/MonthFilterWidgetOptionsVO";
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";
import Dates from "../../FormatDatesNombres/Dates/Dates";
import RangeHandler from "../../../tools/RangeHandler";

/**
 * MonthFilterWidgetManager
 *  - Manage Month Filter Widgets Options
 *  - Manage default input/output values like context_filters,
 *    selected_fields and the whole widget_options configuration
 */
export default class MonthFilterWidgetManager {

    /**
     * get_default_available_months_from_widget_options
     *
     * @param {MonthFilterWidgetOptionsVO} widget_options
     * @returns {string[]}
     */
    public static get_default_available_months_from_widget_options(
        widget_options: MonthFilterWidgetOptionsVO
    ): string[] {
        const available_months: string[] = [];

        if (!widget_options) {
            return null;
        }

        // Depending on the mode, we will have to compute the min and max month
        if (widget_options.month_relative_mode) {
            const current_month = Dates.month(Dates.now()) + 1;

            for (let i = current_month + widget_options.min_month; i <= current_month + widget_options.max_month; i++) {
                available_months.push(i.toString());
            }
        } else {
            for (let i = widget_options.min_month; i <= widget_options.max_month; i++) {
                available_months.push(i.toString());
            }
        }

        return available_months;
    }


    /**
     * get_default_selected_months_from_widget_options
     * - Get default selected months
     *
     * @param {MonthFilterWidgetOptionsVO} widget_options
     * @returns { { [month: number]: boolean }}
     */
    public static get_default_selected_months_from_widget_options(
        widget_options: MonthFilterWidgetOptionsVO
    ): { [month: number]: boolean } {
        const default_selected_months: { [month: number]: boolean } = {};

        if (!widget_options) {
            return null;
        }

        // Depending on the mode, we will have to compute the min and max month
        const months = MonthFilterWidgetManager.get_default_available_months_from_widget_options(
            widget_options
        );

        for (const i in months) {
            const month_key = months[i];

            const current_month = Dates.month(Dates.now()) + 1;
            const month_i = parseInt(month_key);

            default_selected_months[month_key] = false;

            if (widget_options.auto_select_month) {

                if (
                    (widget_options.auto_select_month_min == null) ||
                    (widget_options.auto_select_month_max == null)
                ) {
                    continue;
                }

                if (
                    widget_options.is_month_cumulable &&
                    widget_options.auto_select_month_relative_mode
                ) {
                    // Is auto select month relative to current month ?
                    if ((month_i <= (current_month + widget_options.auto_select_month_max))) {
                        default_selected_months[month_key] = true;
                        continue;
                    }
                } else if (widget_options.auto_select_month_relative_mode) {
                    // Is auto select month relative to current month ?
                    if ((month_i >= (current_month + widget_options.auto_select_month_min)) &&
                        (month_i <= (current_month + widget_options.auto_select_month_max))) {
                        default_selected_months[month_key] = true;
                        continue;
                    }
                } else {
                    if ((month_i >= widget_options.auto_select_month_min) &&
                        (month_i <= widget_options.auto_select_month_max)) {
                        default_selected_months[month_key] = true;
                        continue;
                    }
                }
            }
        }

        return default_selected_months;
    }

    /**
     * get_selected_months_from_context_filter
     * - Get Selected Months By Context Filter
     *
     * @param {ContextFilterVO} context_filter
     * @param {string[]} available_months
     * @returns { { [month: number]: boolean }
     */
    public static get_selected_months_from_context_filter(
        context_filter: ContextFilterVO,
        available_months: string[],
    ): { [month: number]: boolean } {
        if (!context_filter) {
            return null;
        }

        const selected_months: { [month: number]: boolean } = {};

        for (let i in available_months) {
            const month = available_months[i];

            selected_months[month] = false;
        }

        RangeHandler.foreach_ranges_sync(context_filter.param_numranges, (month: number) => {
            selected_months[month] = true;
        });

        return selected_months;
    }

    /**
     * Get Month Filters Widgets Options
     *
     * @return {{ [title_name_code: string]: { widget_options: FieldValueFilterWidgetOptionsVO, widget_name: string, dashboard_page_id: number, page_widget_id: number } }}
     */
    public static async get_month_filters_widgets_options_metadata(
        dashboard_page_id: number,
    ): Promise<
        {
            [title_name_code: string]: { widget_options: MonthFilterWidgetOptionsVO, widget_name: string, dashboard_page_id: number, page_widget_id: number }
        }
    > {

        const month_page_widgets: {
            [page_widget_id: string]: { widget_options: any, widget_name: string, dashboard_page_id: number, page_widget_id: number }
        } = await DashboardPageWidgetVOManager.filter_all_page_widgets_options_by_widget_name([dashboard_page_id], 'monthfilter');

        const res: {
            [title_name_code: string]: { widget_options: MonthFilterWidgetOptionsVO, widget_name: string, dashboard_page_id: number, page_widget_id: number }
        } = {};

        for (const key in month_page_widgets) {
            const options = month_page_widgets[key];

            const widget_options = new MonthFilterWidgetOptionsVO().from(options.widget_options);
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

    public static getInstance(): MonthFilterWidgetManager {
        if (!MonthFilterWidgetManager.instance) {
            MonthFilterWidgetManager.instance = new MonthFilterWidgetManager();
        }
        return MonthFilterWidgetManager.instance;
    }

    private static instance: MonthFilterWidgetManager = null;
}
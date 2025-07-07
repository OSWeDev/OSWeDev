import RangeHandler from "../../../tools/RangeHandler";
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";
import NumRange from "../../DataRender/vos/NumRange";
import NumSegment from "../../DataRender/vos/NumSegment";
import Dates from "../../FormatDatesNombres/Dates/Dates";
import DashboardPageWidgetVO from "../vos/DashboardPageWidgetVO";
import DashboardWidgetVO from "../vos/DashboardWidgetVO";
import MonthFilterWidgetOptionsVO from "../vos/MonthFilterWidgetOptionsVO";
import WidgetOptionsMetadataVO from "../vos/WidgetOptionsMetadataVO";
import DashboardPageWidgetVOManager from "./DashboardPageWidgetVOManager";

/**
 * MonthFilterWidgetManager
 *  - Manage Month Filter Widgets Options
 *  - Manage default input/output values like context_filters,
 *    selected_fields and the whole widget_options configuration
 */
export default class MonthFilterWidgetManager {

    /**
     * create_context_filter_from_widget_options
     *
     * TODO: When depend on other filter, we should take care of the relative mode
     *
     * @param {MonthFilterWidgetOptionsVO} [widget_options]
     * @returns {ContextFilterVO}
     */
    public static create_context_filter_from_widget_options(
        widget_options: MonthFilterWidgetOptionsVO
    ): ContextFilterVO {
        const context_filter: ContextFilterVO = new ContextFilterVO();

        const vo_field_ref = widget_options.vo_field_ref ?? null;

        const selected_months: any = MonthFilterWidgetManager.get_selected_months_from_widget_options(
            widget_options
        );

        let months_ranges: NumRange[] = [];

        for (const i in selected_months) {
            if (!selected_months[i]) {
                continue;
            }

            months_ranges.push(
                RangeHandler.create_single_elt_NumRange(
                    parseInt(i),
                    NumSegment.TYPE_INT
                )
            );
        }

        months_ranges = RangeHandler.getRangesUnion(months_ranges);

        context_filter.filter_type = ContextFilterVO.TYPE_DATE_MONTH;
        context_filter.param_numranges = months_ranges;

        if (widget_options.is_vo_field_ref) {
            context_filter.vo_type = vo_field_ref.api_type_id;
            context_filter.field_name = vo_field_ref.field_id;
        } else {
            context_filter.vo_type = ContextFilterVO.CUSTOM_FILTERS_TYPE;
            context_filter.field_name = widget_options.custom_filter_name;
        }

        return context_filter;
    }



    /**
     * get_available_months_from_widget_options
     *
     * @param {MonthFilterWidgetOptionsVO} [widget_options]
     * @returns {string[]}
     */
    public static get_available_months_from_widget_options(
        widget_options: MonthFilterWidgetOptionsVO
    ): string[] {
        const available_months: string[] = [];

        if (!widget_options) {
            return [];
        }

        if (
            (widget_options.min_month == null) ||
            (widget_options.max_month == null)
        ) {
            return [];
        }

        if ((widget_options.max_month - widget_options.min_month) > 12) {
            return [];
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
     * get_selected_months_from_widget_options
     * - Get default selected months
     *
     * @param {MonthFilterWidgetOptionsVO} [widget_options]
     * @returns { { [month: number]: boolean }}
     */
    public static get_selected_months_from_widget_options(
        widget_options: MonthFilterWidgetOptionsVO
    ): { [month: number]: boolean } {
        const selected_months: { [month: number]: boolean } = {};

        if (!widget_options) {
            return null;
        }

        // Depending on the mode, we will have to compute the min and max month
        const months = MonthFilterWidgetManager.get_available_months_from_widget_options(
            widget_options
        );

        for (const i in months) {
            const month_key = months[i];

            const current_month = Dates.month(Dates.now()) + 1;
            const month_i = parseInt(month_key);

            selected_months[month_key] = false;

            if (widget_options.is_all_months_selected) {
                selected_months[month_key] = true;
                continue;
            }

            if (!widget_options.auto_select_month) {
                continue;
            }

            if (
                (widget_options.auto_select_month_min == null) ||
                (widget_options.auto_select_month_max == null)
            ) {
                continue;
            }

            if (
                widget_options.is_month_cumulated_selected &&
                widget_options.auto_select_month_relative_mode
            ) {
                // Is auto select month relative to current month ?
                if ((month_i <= (current_month + widget_options.auto_select_month_max))) {
                    selected_months[month_key] = true;
                    continue;
                }
            } else if (widget_options.auto_select_month_relative_mode) {
                // Is auto select month relative to current month ?
                if ((month_i >= (current_month + widget_options.auto_select_month_min)) &&
                    (month_i <= (current_month + widget_options.auto_select_month_max))) {
                    selected_months[month_key] = true;
                    continue;
                }
            } else {
                if ((month_i >= widget_options.auto_select_month_min) &&
                    (month_i <= widget_options.auto_select_month_max)) {
                    selected_months[month_key] = true;
                    continue;
                }
            }
        }

        return selected_months;
    }

    /**
     * get_selected_months_from_other_selected_months
     *
     * @param {MonthFilterWidgetOptionsVO} [widget_options]
     * @returns { { [month: number]: boolean }}
     */
    public static get_selected_months_from_other_selected_months(
        widget_options: MonthFilterWidgetOptionsVO,
        other_selected_months: { [month: number]: boolean }
    ): { [month: number]: boolean } {
        const selected_months: { [month: number]: boolean } = {};

        for (const month in other_selected_months) {
            const month_int = parseInt(month);

            if (!other_selected_months[month]) {
                continue;
            }

            const month_from = month_int + widget_options.auto_select_month_min;
            const month_to = month_int + widget_options.auto_select_month_max;

            for (let month_i = month_from; month_i <= month_to; month_i++) {
                selected_months[month_i] = true;
            }
        }

        return selected_months;
    }

    /**
     * get_selected_months_from_context_filter
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

        for (const i in available_months) {
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
     * @return {{ [title_name_code: string]: WidgetOptionsMetadataVO }}
     */
    public static async get_month_filters_widgets_options_metadata(
        dashboard_page_id: number,
        page_widget: DashboardPageWidgetVO,
        selected_page_page_widgets: DashboardPageWidgetVO[],
    ): Promise<
        {
            [title_name_code: string]: WidgetOptionsMetadataVO
        }
    > {

        const month_page_widgets: {
            [page_widget_id: string]: WidgetOptionsMetadataVO
        } = await DashboardPageWidgetVOManager.filter_all_page_widgets_options_by_widget_name(
            dashboard_page_id,
            selected_page_page_widgets,
            DashboardWidgetVO.WIDGET_NAME_monthfilter
        );

        const res: { [title_name_code: string]: WidgetOptionsMetadataVO } = {};

        for (const key in month_page_widgets) {
            const options = month_page_widgets[key];

            const widget_options = new MonthFilterWidgetOptionsVO().from(options.widget_options);
            const name = page_widget.placeholder;

            res[name] = new WidgetOptionsMetadataVO().from({
                dashboard_page_id: options.dashboard_page_id,
                page_widget_id: options.page_widget_id,
                widget_name: options.widget_name,
                widget_options: widget_options
            });
        }

        return res;
    }
}
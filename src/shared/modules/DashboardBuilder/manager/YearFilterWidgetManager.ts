import DashboardPageWidgetVOManager from "./DashboardPageWidgetVOManager";
import YearFilterWidgetOptionsVO from "../vos/YearFilterWidgetOptionsVO";
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";
import DashboardPageWidgetVO from "../vos/DashboardPageWidgetVO";
import RangeHandler from "../../../tools/RangeHandler";
import NumSegment from "../../DataRender/vos/NumSegment";
import NumRange from "../../DataRender/vos/NumRange";
import Dates from "../../FormatDatesNombres/Dates/Dates";

/**
 * @class YearFilterWidgetManager
 */
export default class YearFilterWidgetManager {

    /**
     * Create Context Filter From Year Filter Widget Options
     *
     * TODO: When depend on other filter, we should take care of the relative mode
     *
     * @param {YearFilterWidgetOptionsVO} [widget_options]
     *
     * @returns {ContextFilterVO}
     */
    public static create_context_filter_from_widget_options(
        widget_options: YearFilterWidgetOptionsVO
    ): ContextFilterVO {
        let context_filter: ContextFilterVO = new ContextFilterVO();

        const vo_field_ref = widget_options.vo_field_ref ?? null;

        const selected_years: any = YearFilterWidgetManager.get_selected_years_from_widget_options(
            widget_options
        );

        let years_ranges: NumRange[] = [];

        for (const key in selected_years) {
            if (!selected_years[key]) {
                continue;
            }

            years_ranges.push(
                RangeHandler.create_single_elt_NumRange(
                    parseInt(key.toString()),
                    NumSegment.TYPE_INT
                )
            );
        }

        years_ranges = RangeHandler.getRangesUnion(years_ranges);

        context_filter.filter_type = ContextFilterVO.TYPE_DATE_YEAR;
        context_filter.param_numranges = years_ranges;

        if (widget_options.is_vo_field_ref) {
            context_filter.vo_type = vo_field_ref.api_type_id;
            context_filter.field_id = vo_field_ref.field_id;
        } else {
            context_filter.vo_type = ContextFilterVO.CUSTOM_FILTERS_TYPE;
            context_filter.field_id = widget_options.custom_filter_name;
        }

        return context_filter;
    }

    /**
     * get_relative_page_widget_by_widget_options
     *
     * @param {YearFilterWidgetOptionsVO} [widget_options]
     * @returns {DashboardPageWidgetVO}
     */
    public static async get_relative_page_widget_by_widget_options(
        widget_options: YearFilterWidgetOptionsVO
    ): Promise<DashboardPageWidgetVO> {
        if (!widget_options) {
            return null;
        }

        if (!widget_options.auto_select_year_relative_mode) {
            return null;
        }

        if (!widget_options.is_relative_to_other_filter) {
            return null;
        }

        if (!widget_options.relative_to_other_filter_id) {
            return null;
        }

        const relative_page_widget: DashboardPageWidgetVO = await DashboardPageWidgetVOManager.find_page_widget(
            widget_options.relative_to_other_filter_id
        );

        return relative_page_widget;
    }

    /**
     * get_available_years_from_widget_options
     *
     * @param {YearFilterWidgetOptionsVO} [widget_options]
     * @returns {string[]}
     */
    public static get_available_years_from_widget_options(
        widget_options: YearFilterWidgetOptionsVO
    ): string[] {
        const available_years: string[] = [];

        if (!widget_options) {
            return [];
        }

        if (
            (widget_options.min_year == null) ||
            (widget_options.max_year == null)
        ) {
            return [];
        }

        if ((widget_options.max_year - widget_options.min_year) > 15) {
            return [];
        }

        // Depending on the mode, we will have to compute the min and max year
        if (widget_options.year_relative_mode) {

            let current_year = Dates.year(Dates.now());
            for (let i = current_year + widget_options.min_year; i <= current_year + widget_options.max_year; i++) {
                available_years.push(i.toString());
            }
        } else {
            for (let i = widget_options.min_year; i <= widget_options.max_year; i++) {
                available_years.push(i.toString());
            }
        }

        return available_years;
    }

    /**
     * get_selected_years_from_widget_options
     * - Get default selected years
     *
     * @param {YearFilterWidgetOptionsVO} [widget_options]
     * @returns { { [year: number]: boolean }}
     */
    public static get_selected_years_from_widget_options(
        widget_options: YearFilterWidgetOptionsVO
    ): { [year: number]: boolean } {
        const selected_years: { [year: number]: boolean } = {};

        if (!widget_options) {
            return null;
        }

        // Depending on the mode, we will have to compute the min and max year
        const years = YearFilterWidgetManager.get_available_years_from_widget_options(
            widget_options
        );

        for (const i in years) {
            const year_key = years[i];

            const current_year = Dates.year(Dates.now());
            const year_i = parseInt(year_key);

            selected_years[year_key] = false;

            if (widget_options.is_all_years_selected) {
                selected_years[year_key] = true;
                continue;
            }

            if (!widget_options.auto_select_year) {
                continue;
            }

            if (
                (widget_options.auto_select_year_min == null) ||
                (widget_options.auto_select_year_max == null)
            ) {
                continue;
            }

            if (widget_options.auto_select_year_relative_mode) {
                // Is auto select year relative to current year ?
                if ((year_i >= (current_year + widget_options.auto_select_year_min)) &&
                    (year_i <= (current_year + widget_options.auto_select_year_max))) {
                    selected_years[year_key] = true;
                    continue;
                }
            } else {
                if ((year_i >= widget_options.auto_select_year_min) &&
                    (year_i <= widget_options.auto_select_year_max)) {
                    selected_years[year_key] = true;
                    continue;
                }
            }
        }

        return selected_years;
    }

    /**
     * get_selected_years_from_other_selected_years
     *
     * @param {YearFilterWidgetOptionsVO} [widget_options]
     * @returns { { [year: number]: boolean }}
     */
    public static get_selected_years_from_other_selected_years(
        widget_options: YearFilterWidgetOptionsVO,
        other_selected_years: { [year: number]: boolean }
    ): { [year: number]: boolean } {
        const selected_years: { [year: number]: boolean } = {};

        for (let year in other_selected_years) {
            let year_int = parseInt(year);

            if (!other_selected_years[year]) {
                continue;
            }

            const year_from = year_int + widget_options.auto_select_year_min;
            const year_to = year_int + widget_options.auto_select_year_max;

            for (let year_i = year_from; year_i <= year_to; year_i++) {
                selected_years[year_i] = true;
            }
        }

        return selected_years;
    }

    /**
     * get_selected_years_from_context_filter
     *
     * @param {ContextFilterVO} context_filter
     * @param {string[]} available_years
     * @returns { { [year: number]: boolean }
     */
    public static get_selected_years_from_context_filter(
        context_filter: ContextFilterVO,
        available_years: string[],
    ): { [year: number]: boolean } {
        if (!context_filter) {
            return null;
        }

        const selected_years: { [year: number]: boolean } = {};

        for (let i in available_years) {
            const year = available_years[i];

            selected_years[year] = false;
        }

        RangeHandler.foreach_ranges_sync(context_filter.param_numranges, (year: number) => {
            selected_years[year] = true;
        });

        return selected_years;
    }

    /**
     * Get Year Filters Widgets Options
     *
     * @return {{ [title_name_code: string]: { widget_options: FieldValueFilterWidgetOptionsVO, widget_name: string, dashboard_page_id: number, page_widget_id: number } }}
     */
    public static async get_year_filters_widgets_options_metadata(
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
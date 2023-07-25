import DashboardPageWidgetVOManager from "./DashboardPageWidgetVOManager";
import YearFilterWidgetOptionsVO from "../vos/YearFilterWidgetOptionsVO";
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";
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
     * @param {YearFilterWidgetOptionsVO} [widget_options]
     *
     * @returns {ContextFilterVO}
     */
    public static create_context_filter_from_widget_options(
        widget_options: YearFilterWidgetOptionsVO
    ): ContextFilterVO {
        let context_filter: ContextFilterVO = null;

        const vo_field_ref = widget_options.vo_field_ref ?? null;
        const default_selected_years: any = {};
        const years = [];

        if (widget_options.year_relative_mode) {
            const current_year = Dates.year(Dates.now());
            for (let i = current_year + widget_options.min_year; i <= current_year + widget_options.max_year; i++) {
                years.push(i.toString());
            }
        } else {
            for (let i = widget_options.min_year; i <= widget_options.max_year; i++) {
                years.push(i.toString());
            }
        }

        for (const key in years) {
            const year = years[key];

            if (widget_options.auto_select_year) {

                if ((widget_options.auto_select_year_min == null) || (widget_options.auto_select_year_max == null)) {
                    continue;
                }

                if (widget_options.auto_select_year_relative_mode) {
                    let current_year = Dates.year(Dates.now());
                    let year_int = parseInt(year);
                    if ((year_int >= (current_year + widget_options.auto_select_year_min)) &&
                        (year_int <= (current_year + widget_options.auto_select_year_max))) {
                        default_selected_years[year] = true;
                        continue;
                    }
                } else {
                    let year_int = parseInt(year);
                    if ((year_int >= widget_options.auto_select_year_min) &&
                        (year_int <= widget_options.auto_select_year_max)) {
                        default_selected_years[year] = true;
                        continue;
                    }
                }
            }

            default_selected_years[year] = false;
        }

        let years_ranges: NumRange[] = [];
        for (let key in default_selected_years) {
            if (!default_selected_years[key]) {
                continue;
            }
            years_ranges.push(RangeHandler.create_single_elt_NumRange(parseInt(key.toString()), NumSegment.TYPE_INT));
        }
        years_ranges = RangeHandler.getRangesUnion(years_ranges);

        context_filter = new ContextFilterVO();
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
import MonthFilterWidgetOptionsVO from "../vos/MonthFilterWidgetOptionsVO";
import YearFilterWidgetOptionsVO from "../vos/YearFilterWidgetOptionsVO";

/**
 * IFavoritesFiltersOptions
 */
export default interface IFavoritesFiltersOptions {
    // Overwrite active field filters
    overwrite_active_field_filters: boolean;

    // Is the current favorites field_filters fixed dates
    is_field_filters_fixed_dates: boolean; // if true, use fixed dates field_filters, else use custom dates widget_options

    // dates widgets_options (month, year, etc.) where we can update the custom configs
    dates_custom_widgets_options_by_field_id?: { [field_id: string]: { yearfilter: YearFilterWidgetOptionsVO, monthfilter: MonthFilterWidgetOptionsVO } };
}
import NumRange from "../../../DataRender/vos/NumRange";
import TSRange from "../../../DataRender/vos/TSRange";
import WidgetOptionsBaseVO from "./WidgetOptionsBaseVO";


export default class FieldValueFilterPageWidgetOptionsVO extends WidgetOptionsBaseVO {

    public static API_TYPE_ID: string = "field_value_filter_page_widget_options"; // Attention à la migration pour les patchs : changement subtile, ajout d'un s à la fin....

    public static CHECKBOX_COLUMNS_LABELS: string[] = [
        'FieldValueFilterWidgetOptions.CHECKBOX_COLUMNS.1',
        'FieldValueFilterWidgetOptions.CHECKBOX_COLUMNS.2',
        'FieldValueFilterWidgetOptions.CHECKBOX_COLUMNS.3',
        'FieldValueFilterWidgetOptions.CHECKBOX_COLUMNS.4',
        'FieldValueFilterWidgetOptions.CHECKBOX_COLUMNS.6',
        'FieldValueFilterWidgetOptions.CHECKBOX_COLUMNS.12'
    ];
    public static CHECKBOX_COLUMNS_1: number = 0;
    public static CHECKBOX_COLUMNS_2: number = 1;
    public static CHECKBOX_COLUMNS_3: number = 2;
    public static CHECKBOX_COLUMNS_4: number = 3;
    public static CHECKBOX_COLUMNS_6: number = 4;
    public static CHECKBOX_COLUMNS_12: number = 5;

    public _type: string = FieldValueFilterPageWidgetOptionsVO.API_TYPE_ID;

    public vo_field_ref_id: number;
    public vo_field_ref_lvl2_id: number;
    public vo_field_sort_id: number;
    public vo_field_sort_lvl2_id: number;

    public can_select_multiple: boolean;
    public is_checkbox: boolean;
    public checkbox_columns: number;
    public max_visible_options: number;
    public show_search_field: boolean;
    public hide_lvl2_if_lvl1_not_selected: boolean;
    public segmentation_type: number;
    public advanced_mode: boolean;
    public default_advanced_string_filter_type: number;
    public hide_btn_switch_advanced: boolean;
    public hide_advanced_string_filter_type: boolean;

    public vo_field_ref_multiple_id_ranges: NumRange[];

    // ????? comment on gère ça ?
    public default_showed_filter_opt_values: DataFilterOption[]; // Default filter options to show
    public default_filter_opt_values: DataFilterOption[];
    public exclude_filter_opt_values: DataFilterOption[];

    public default_boolean_values: number[];
    public default_ts_range_values: TSRange;
    public exclude_ts_range_values: TSRange;


    // public hide_filter: boolean; TODO Patch migration vers hide_widget
    public no_inter_filter: boolean; // Do not use the active_field_filter
    public has_other_ref_api_type_id: boolean;
    public other_ref_api_type_id: string;
    public placeholder_advanced_mode: string;
    public separation_active_filter: boolean;
    public autovalidate_advanced_filter: boolean;
    public add_is_null_selectable: boolean;
    public is_button: boolean;

    public enum_bg_colors: { [enum_value: number]: string };
    public enum_fg_colors: { [enum_value: number]: string };

    public show_count_value: boolean; // Seulement pour enum pour l'instant
    public active_field_on_autovalidate_advanced_filter: boolean;
    public force_filter_by_all_api_type_ids: boolean; // (Pour la supervision)

    public bg_color: string;
    public fg_color_value: string;
    // public fg_color_text: string; // TODO Patch migration vers font_color

    public can_select_all: boolean;
    public can_select_none: boolean;
    public default_advanced_ref_field_filter_type: number;
    public hide_advanced_ref_field_filter_type: boolean;
    public date_relative_mode: boolean;
    public auto_select_date: boolean;
    public auto_select_date_relative_mode: boolean;
    public relative_to_other_filter_id: number;
    public auto_select_date_min: number;
    public auto_select_date_max: number;

    /*
    public get_exclude_values(): DataFilterOption[] {

        if (!(this.exclude_filter_opt_values?.length > 0)) {
            return null;
        }

        return this.exclude_filter_opt_values?.map((val) => new DataFilterOption().from(val));
    }

    public get_default_filter_options(): DataFilterOption[] {
        if (!this.default_filter_opt_values?.length) {
            return null;
        }

        if (Array.isArray(this.default_filter_opt_values) && (this.default_filter_opt_values.length > 0)) {
            return this.default_filter_opt_values.map((val) => new DataFilterOption().from(val));
        }

        return [new DataFilterOption().from(this.default_filter_opt_values as any)];
    }
    */
}
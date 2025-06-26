import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";

/**
 * IVarWidgetOptionsProps
 */
export interface IVarWidgetOptionsProps {
    var_id?: number;
    filter_type?: string;
    filter_custom_field_filters?: { [field_id: string]: string };
    filter_additional_params?: string;
    bg_color?: string;
    fg_color_value?: string;
    fg_color_text?: string;
}

export default class VarWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "VarWidgetOptions.title.";

    public constructor(
        public var_id?: number,
        public filter_type?: string,
        public filter_custom_field_filters?: { [field_id: string]: string },
        public filter_additional_params?: string,
        public bg_color?: string,
        public fg_color_value?: string,
        public fg_color_text?: string,
    ) { }

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        return {};
    }

    /**
     * Fill this VarWidgetOptions with the given properties
     *  - Hydrate from JSON Options
     *
     * @param props {IVarWidgetOptionsProps}
     * @returns {VarWidgetOptions}
     */
    public from(props: IVarWidgetOptionsProps): VarWidgetOptions {

        this.filter_custom_field_filters = props.filter_custom_field_filters ?? this.filter_custom_field_filters;
        this.filter_additional_params = props.filter_additional_params ?? this.filter_additional_params;
        this.fg_color_value = props.fg_color_value ?? this.fg_color_value;
        this.fg_color_text = props.fg_color_text ?? this.fg_color_text;
        this.filter_type = props.filter_type ?? this.filter_type;
        this.bg_color = props.bg_color ?? this.bg_color;
        this.var_id = props.var_id ?? this.var_id;

        return this;
    }
}
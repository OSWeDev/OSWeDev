import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import DefaultTranslationVO from "../../../../../../../shared/modules/Translation/vos/DefaultTranslationVO";
import VarConfVO from "../../../../../../../shared/modules/Var/vos/VarConfVO";
import IExportableWidgetOptions from "../../IExportableWidgetOptions";

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

export default class VarWidgetOptions implements IExportableWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "VarWidgetOptions.title.";

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        return {};
    }

    public constructor(
        public var_id?: number,
        public filter_type?: string,
        public filter_custom_field_filters?: { [field_id: string]: string },
        public filter_additional_params?: string,
        public bg_color?: string,
        public fg_color_value?: string,
        public fg_color_text?: string,
    ) { }

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

    public get_title_name_code_text(page_widget_id: number): string {

        if ((!page_widget_id) || (!this.var_id)) {
            return null;
        }

        return VarWidgetOptions.TITLE_CODE_PREFIX + this.var_id + '.' + page_widget_id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    }

    public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {
        let res: { [exportable_code_text: string]: string } = {};

        let placeholder_name_code_text: string = this.get_title_name_code_text(page_widget_id);
        if (placeholder_name_code_text) {

            res[placeholder_name_code_text] =
                VarWidgetOptions.TITLE_CODE_PREFIX +
                '{{IMPORT:' + VarConfVO.API_TYPE_ID + ':' + this.var_id + '}}' +
                '.' +
                '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
                DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
        }
        return res;
    }
}
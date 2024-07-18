import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import DefaultTranslationVO from "../../../../../../../shared/modules/Translation/vos/DefaultTranslationVO";
import VarConfVO from "../../../../../../../shared/modules/Var/vos/VarConfVO";
import VarDataBaseVO from "../../../../../../../shared/modules/Var/vos/VarDataBaseVO";
import IExportableWidgetOptions from "../../IExportableWidgetOptions";

/**
 * IVarWidgetOptionsProps
 */
export interface IVarWidgetOptionsProps {
    vars?: [
        var_principale?: {
            id: number,
            var_id: number,
            filter_type: string,
            filter_additional_params: string,
        },
        var_a_date?: {
            id: number,
            var_id: number,
            filter_type: string,
            filter_additional_params: string,
        },
        var_complementaire?: {
            id: number,
            var_id: number,
            filter_type: string,
            filter_additional_params: string,
        },
        var_complementaire_supp?: {
            id: number,
            var_id: number,
            filter_type: string,
            filter_additional_params: string,
        },
    ],
    filter_custom_field_filters: { [field_id: string]: string }[],
    bg_color?: string;
    fg_color_value?: string;
    fg_color_text?: string;
    style?: string;
    icon_text?: string;
    icon_size?: number;
}

export default class VarWidgetOptionsNew {

    public static TITLE_CODE_PREFIX: string = "VarWidgetOptionsNew.title.";

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        return {};
    }

    public constructor(
        public vars?: [
            var_principale?: {
                id: number,
                var_id: number;
                filter_type: string,
                filter_additional_params: string,
            },
            var_a_date?: {
                id: number,
                var_id: number;
                filter_type: string,
                filter_additional_params: string,
            },
            var_complementaire?: {
                id: number,
                var_id: number;
                filter_type: string,
                filter_additional_params: string,
            },
            var_complementaire_supp?: {
                id: number,
                var_id: number;
                filter_type: string,
                filter_additional_params: string,
            },
        ],
        public filter_custom_field_filters?: { [field_id: string]: string }[],
        public bg_color?: string,
        public fg_color_value?: string,
        public fg_color_text?: string,
        public style?: string,
        public icon_text?: string,
        public icon_size?: number,
    ) { }

    /**
     * Fill this VarWidgetOptionsNew with the given properties
     *  - Hydrate from JSON Options
     *
     * @param props {IVarWidgetOptionsProps}
     * @returns {VarWidgetOptionsNew}
     */
    public from(props: IVarWidgetOptionsProps): VarWidgetOptionsNew {
        this.vars = props.vars ?? this.vars;
        this.filter_custom_field_filters = props.filter_custom_field_filters ?? this.filter_custom_field_filters;
        this.fg_color_value = props.fg_color_value ?? this.fg_color_value;
        this.fg_color_text = props.fg_color_text ?? this.fg_color_text;
        this.bg_color = props.bg_color ?? this.bg_color;
        this.style = props.style ?? this.style;
        this.icon_text = props.icon_text ?? this.icon_text;
        return this;
    }

    public get_title_name_code_text(page_widget_id: number): string {

        if ((!page_widget_id)) {
            return null;
        }

        return VarWidgetOptionsNew.TITLE_CODE_PREFIX + '.' + page_widget_id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    }

    public get_var_name_code_text(page_widget_id: number, var_id: number): string {

        if ((!page_widget_id) || (!var_id)) {
            return null;
        }

        return VarWidgetOptionsNew.TITLE_CODE_PREFIX + var_id + '.' + page_widget_id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    }

    public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number, var_id: number): Promise<{ [current_code_text: string]: string }> {
        const res: { [exportable_code_text: string]: string } = {};

        const placeholder_name_code_text: string = this.get_title_name_code_text(page_widget_id);
        if (placeholder_name_code_text) {

            res[placeholder_name_code_text] =
                VarWidgetOptionsNew.TITLE_CODE_PREFIX +
                '{{IMPORT:' + VarConfVO.API_TYPE_ID + ':' + var_id + '}}'
            '.' +
                '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
                DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
        }
        return res;
    }
}

import DefaultTranslationVO from '../../../../shared/modules/Translation/vos/DefaultTranslationVO';
import DashboardPageWidgetVO from "./DashboardPageWidgetVO";
import AbstractVO from "../../VO/abstract/AbstractVO";
import VarConfVO from "../../Var/vos/VarConfVO";

/**
 * @class VarWidgetOptionsVO
 */
export default class VarWidgetOptionsVO extends AbstractVO {

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
    ) {
        super();
    }

    public get_title_name_code_text(page_widget_id: number): string {

        if ((!page_widget_id) || (!this.var_id)) {
            return null;
        }

        return VarWidgetOptionsVO.TITLE_CODE_PREFIX + this.var_id + '.' + page_widget_id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    }

    public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {
        let res: { [exportable_code_text: string]: string } = {};

        let placeholder_name_code_text: string = this.get_title_name_code_text(page_widget_id);
        if (placeholder_name_code_text) {

            res[placeholder_name_code_text] =
                VarWidgetOptionsVO.TITLE_CODE_PREFIX +
                '{{IMPORT:' + VarConfVO.API_TYPE_ID + ':' + this.var_id + '}}' +
                '.' +
                '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
                DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
        }
        return res;
    }
}
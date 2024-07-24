
import DefaultTranslationVO from '../../../../shared/modules/Translation/vos/DefaultTranslationVO';
import DashboardPageWidgetVO from "./DashboardPageWidgetVO";
import AbstractVO from "../../VO/abstract/AbstractVO";
import VarConfVO from "../../Var/vos/VarConfVO";
import { ConditionStatement } from '../../../tools/ConditionHandler';

/**
 * @class VarWidgetOptionsVO
 */
export default class VarWidgetOptionsVO extends AbstractVO {

    public static TITLE_CODE_PREFIX: string = "VarWidgetOptions.title.";

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        return {};
    }

    public constructor(
        public var_condition_id?: number,
        public icons_by_value_and_conditions?: Array<{
            value: string,
            condition: ConditionStatement,
            icon: string,
        }>,
        public vars?: [
            var_principale?: {
                id: number,
                var_id: number;
                filter_type: string,
                filter_additional_params: string,
                display_label: boolean,
                is_condition_target?: boolean,
            },
            var_a_date?: {
                id: number,
                var_id: number;
                filter_type: string,
                filter_additional_params: string,
                display_label: boolean,
                is_condition_target?: boolean,
            },
            var_complementaire?: {
                id: number,
                var_id: number;
                filter_type: string,
                filter_additional_params: string,
                display_label: boolean,
                is_condition_target?: boolean,
            },
            var_complementaire_supp?: {
                id: number,
                var_id: number;
                filter_type: string,
                filter_additional_params: string,
                display_label: boolean,
                is_condition_target?: boolean,
            },
        ],
        public filter_custom_field_filters?: { [field_id: string]: string }[],
        public bg_color?: string,
        public fg_color_text?: string,
        public style?: string,
        public icon_text?: string,
        public icon_size?: number,
        public subtitle?: string,
    ) {
        super();
    }

    public get_title_name_code_text(page_widget_id: number): string {

        if ((!page_widget_id)) {
            return null;
        }

        return VarWidgetOptionsVO.TITLE_CODE_PREFIX + '.' + page_widget_id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    }

    public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number, var_id: number): Promise<{ [current_code_text: string]: string }> {
        const res: { [exportable_code_text: string]: string } = {};

        const placeholder_name_code_text: string = this.get_title_name_code_text(page_widget_id);
        if (placeholder_name_code_text) {

            res[placeholder_name_code_text] =
                VarWidgetOptionsVO.TITLE_CODE_PREFIX +
                '{{IMPORT:' + VarConfVO.API_TYPE_ID + ':' + var_id + '}}'
            '.' +
                '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
                DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
        }
        return res;
    }
}
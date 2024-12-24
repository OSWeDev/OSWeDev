import DefaultTranslationVO from "../../Translation/vos/DefaultTranslationVO";
import AbstractVO from "../../VO/abstract/AbstractVO";
import DashboardPageWidgetVO from "./DashboardPageWidgetVO";

/**
 * SupervisionTypeWidgetOptionsVO
 *  - TODO: May be rename to SupervisionTypeFilterWidgetOptionsVO
 */
export default class SupervisionTypeWidgetOptionsVO extends AbstractVO {

    public static TITLE_CODE_PREFIX: string = "SupervisionTypeWidgetOptionsVO.title.";
    public static FIELD_ID_INDICATOR: string = 'id';

    public constructor(
        public supervision_api_type_ids?: string[], // Used to filter the supervision items (sondes) from each datatable
    ) {
        super();
    }

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        return {};
    }

    public get_title_name_code_text(page_widget_id: number): string {

        if (!page_widget_id) {
            return null;
        }
        return SupervisionTypeWidgetOptionsVO.TITLE_CODE_PREFIX + page_widget_id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    }

    public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {
        const res: { [exportable_code_text: string]: string } = {};

        const placeholder_name_code_text: string = this.get_title_name_code_text(page_widget_id);
        if (placeholder_name_code_text) {

            res[placeholder_name_code_text] =
                SupervisionTypeWidgetOptionsVO.TITLE_CODE_PREFIX +
                '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
                DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
        }
        return res;
    }
}
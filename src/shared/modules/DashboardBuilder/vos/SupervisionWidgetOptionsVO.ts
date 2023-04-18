import DefaultTranslation from "../../Translation/vos/DefaultTranslation";
import DashboardPageWidgetVO from "./DashboardPageWidgetVO";

/**
 * SupervisionWidgetOptionsVO
 */
export default class SupervisionWidgetOptionsVO {

    public static TITLE_CODE_PREFIX: string = "SupervisionWidgetOptionsVO.title.";

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        return {};
    }

    public constructor(
        public limit: number,
        public supervision_api_type_ids: string[],
        public refresh_button: boolean,
        public auto_refresh: boolean,
        public auto_refresh_seconds: number,
        public show_bulk_edit: boolean,
    ) { }

    public get_title_name_code_text(page_widget_id: number): string {

        if (!page_widget_id) {
            return null;
        }
        return SupervisionWidgetOptionsVO.TITLE_CODE_PREFIX + page_widget_id + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {
        let res: { [exportable_code_text: string]: string } = {};

        let placeholder_name_code_text: string = this.get_title_name_code_text(page_widget_id);
        if (placeholder_name_code_text) {

            res[placeholder_name_code_text] =
                SupervisionWidgetOptionsVO.TITLE_CODE_PREFIX +
                '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
                DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        }
        return res;
    }
}
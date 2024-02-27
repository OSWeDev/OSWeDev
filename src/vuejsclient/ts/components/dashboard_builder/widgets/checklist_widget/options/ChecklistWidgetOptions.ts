import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import DefaultTranslationVO from "../../../../../../../shared/modules/Translation/vos/DefaultTranslationVO";

export default class ChecklistWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "ChecklistWidgetOptions.title.";

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        return {};
    }

    public constructor(
        public limit: number,
        public checklist_id: number,
        public delete_all_button: boolean,
        public create_button: boolean,
        public refresh_button: boolean,
        public export_button: boolean,
    ) { }

    public get_title_name_code_text(page_widget_id: number): string {

        if (!page_widget_id) {
            return null;
        }
        return ChecklistWidgetOptions.TITLE_CODE_PREFIX + page_widget_id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    }

    public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {
        const res: { [exportable_code_text: string]: string } = {};

        const placeholder_name_code_text: string = this.get_title_name_code_text(page_widget_id);
        if (placeholder_name_code_text) {

            res[placeholder_name_code_text] =
                ChecklistWidgetOptions.TITLE_CODE_PREFIX +
                '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
                DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
        }
        return res;
    }
}
import DefaultTranslationVO from "../../Translation/vos/DefaultTranslationVO";
import DashboardPageWidgetVO from "./DashboardPageWidgetVO";
import AbstractVO from "../../VO/abstract/AbstractVO";

/**
 * @class SupervisionWidgetOptionsVO
 */
export default class SupervisionWidgetOptionsVO extends AbstractVO {

    public static TITLE_CODE_PREFIX: string = "SupervisionWidgetOptionsVO.title.";

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        return {};
    }

    public constructor(
        public limit?: number,
        public supervision_api_type_ids?: string[],
        public refresh_button?: boolean,
        public auto_refresh?: boolean,
        public auto_refresh_seconds?: number,
        public show_bulk_edit?: boolean,
    ) {
        super();
    }

    public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {
        const res: { [exportable_code_text: string]: string } = {};

        return res;
    }
}
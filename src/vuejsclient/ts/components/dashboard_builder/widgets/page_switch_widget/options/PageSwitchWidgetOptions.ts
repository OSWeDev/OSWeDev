import DashboardPageVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO";
import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import DefaultTranslationVO from "../../../../../../../shared/modules/Translation/vos/DefaultTranslationVO";
import IExportableWidgetOptions from "../../IExportableWidgetOptions";

export default class PageSwitchWidgetOptions implements IExportableWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "PageSwitchWidgetOptions.title.";

    public constructor(
        public page_id: number
    ) { }

    public get_title_name_code_text(page_widget_id: number): string {

        if ((!page_widget_id) || (!this.page_id)) {
            return null;
        }
        return PageSwitchWidgetOptions.TITLE_CODE_PREFIX + this.page_id + '.' + page_widget_id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    }

    public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {
        const res: { [exportable_code_text: string]: string } = {};

        const placeholder_name_code_text: string = this.get_title_name_code_text(page_widget_id);
        if (placeholder_name_code_text) {

            res[placeholder_name_code_text] =
                PageSwitchWidgetOptions.TITLE_CODE_PREFIX +
                '{{IMPORT:' + DashboardPageVO.API_TYPE_ID + ':' + page_id + '}}' +
                '.' +
                '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
                DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
        }
        return res;
    }
}
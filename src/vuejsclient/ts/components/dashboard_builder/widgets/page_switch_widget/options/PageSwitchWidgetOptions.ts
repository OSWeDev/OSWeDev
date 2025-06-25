import DashboardPageVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO";
import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import DefaultTranslationVO from "../../../../../../../shared/modules/Translation/vos/DefaultTranslationVO";
import IExportableWidgetOptions from "../../IExportableWidgetOptions";

export default class PageSwitchWidgetOptions implements IExportableWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "PageSwitchWidgetOptions.title.";

    public constructor(
        public page_id: number
    ) { }

    public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {
        const res: { [exportable_code_text: string]: string } = {};

        return res;
    }
}
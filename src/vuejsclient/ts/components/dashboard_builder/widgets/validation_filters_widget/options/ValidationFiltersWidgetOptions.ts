import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import DefaultTranslationVO from "../../../../../../../shared/modules/Translation/vos/DefaultTranslationVO";
import AbstractVO from "../../../../../../../shared/modules/VO/abstract/AbstractVO";
import IExportableWidgetOptions from "../../IExportableWidgetOptions";

export default class ValidationFiltersWidgetOptions extends AbstractVO implements IExportableWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "ValidationFiltersWidgetOptions.title.";

    public constructor(
        public load_widgets_prevalidation: boolean = false,
        public bg_color: string = null,
        public fg_color_text: string = null,
    ) {
        super();
    }

    public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {
        const res: { [exportable_code_text: string]: string } = {};

        return res;
    }
}
import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import DefaultTranslation from "../../../../../../../shared/modules/Translation/vos/DefaultTranslation";

export default class PageSwitchWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "PageSwitchWidgetOptions.title.";

    public constructor(
        public page_id: number,
        public page_widget_id: number
    ) { }

    get title_name_code_text(): string {

        if ((!this.page_widget_id) || (!this.page_id)) {
            return null;
        }
        return PageSwitchWidgetOptions.TITLE_CODE_PREFIX + this.page_id + '.' + this.page_widget_id + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }
}
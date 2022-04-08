import DefaultTranslation from "../../../../../../../shared/modules/Translation/vos/DefaultTranslation";

export default class PageSwitchWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "PageSwitchWidgetOptions.title.";

    public constructor(
        public page_id: number
    ) { }

    public get_title_name_code_text(page_widget_id: number): string {

        if ((!page_widget_id) || (!this.page_id)) {
            return null;
        }
        return PageSwitchWidgetOptions.TITLE_CODE_PREFIX + this.page_id + '.' + page_widget_id + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }
}
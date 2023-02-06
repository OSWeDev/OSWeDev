import DefaultTranslation from "../../../../../../../shared/modules/Translation/vos/DefaultTranslation";

export default class ResetFiltersWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "ResetFiltersWidgetOptions.title.";

    public constructor() { }

    public get_title_name_code_text(page_widget_id: number): string {

        if (!page_widget_id) {
            return null;
        }
        return ResetFiltersWidgetOptions.TITLE_CODE_PREFIX + page_widget_id + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }
}
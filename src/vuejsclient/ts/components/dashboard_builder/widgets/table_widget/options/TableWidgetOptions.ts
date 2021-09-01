import VOFieldRefVO from "../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO";
import DefaultTranslation from "../../../../../../../shared/modules/Translation/vos/DefaultTranslation";

export default class TableWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "TableWidgetOptions.title.";

    public constructor(
        public vo_field_refs: VOFieldRefVO[],
        public page_widget_id: number,
    ) { }

    get title_name_code_text(): string {

        if (!this.page_widget_id) {
            return null;
        }
        return TableWidgetOptions.TITLE_CODE_PREFIX + this.page_widget_id + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }
}
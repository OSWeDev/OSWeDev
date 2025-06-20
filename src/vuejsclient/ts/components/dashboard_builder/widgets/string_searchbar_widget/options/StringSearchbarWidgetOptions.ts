import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import VOFieldRefVO from "../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO";
import DefaultTranslationVO from "../../../../../../../shared/modules/Translation/vos/DefaultTranslationVO";
import AbstractVO from "../../../../../../../shared/modules/VO/abstract/AbstractVO";
import IExportableWidgetOptions from "../../IExportableWidgetOptions";

export default class StringSearchbarWidgetOptions extends AbstractVO implements IExportableWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "StringSearchbarWidgetOptions.title.";

    public constructor(
        public vo_field_ref?: VOFieldRefVO,
        public vo_field_ref_multiple?: VOFieldRefVO[],
    ) {
        super();
    }

    public get_title_name_code_text(page_widget_id: number): string {

        if (!page_widget_id) {
            return null;
        }
        return StringSearchbarWidgetOptions.TITLE_CODE_PREFIX + page_widget_id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    }

    public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {
        const res: { [exportable_code_text: string]: string } = {};

        const placeholder_name_code_text: string = this.get_title_name_code_text(page_widget_id);
        if (placeholder_name_code_text) {

            res[placeholder_name_code_text] =
                StringSearchbarWidgetOptions.TITLE_CODE_PREFIX +
                '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
                DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
        }
        return res;
    }
}
import DefaultTranslationVO from "../../Translation/vos/DefaultTranslationVO";
import AbstractVO from "../../VO/abstract/AbstractVO";
import DashboardPageWidgetVO from "./DashboardPageWidgetVO";
import VOFieldRefVO from "./VOFieldRefVO";

/**
 * FavoritesFiltersWidgetOptionsVO
 *  - Options for the FavoritesFiltersWidget
 */
export default class FavoritesFiltersWidgetOptionsVO extends AbstractVO {

    public static TITLE_CODE_PREFIX: string = "FavoritesFiltersWidgetOptionsVO.title.";

    public constructor(
        public vo_field_ref?: VOFieldRefVO,
        public max_visible_options?: number,
        public can_configure_export?: boolean,
        public can_configure_date_filters?: boolean, // If true, the widget will allow the user to configure each Month/Year WidgetOptions for the export
        public send_email_with_export_notification?: boolean, // If true, the app will send to the user an email with a notification of export
    ) {
        super();
    }

    public get_title_name_code_text(page_widget_id: number): string {

        if (!page_widget_id) {
            return null;
        }

        return FavoritesFiltersWidgetOptionsVO.TITLE_CODE_PREFIX + page_widget_id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    }

    public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {
        const res: { [exportable_code_text: string]: string } = {};

        const placeholder_name_code_text: string = this.get_title_name_code_text(page_widget_id);
        if (placeholder_name_code_text) {

            res[placeholder_name_code_text] =
                FavoritesFiltersWidgetOptionsVO.TITLE_CODE_PREFIX +
                '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
                DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
        }
        return res;
    }
}
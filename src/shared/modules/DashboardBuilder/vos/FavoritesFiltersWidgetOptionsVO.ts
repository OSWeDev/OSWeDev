import DefaultTranslation from "../../Translation/vos/DefaultTranslation";
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
    ) {
        super();
    }

    public get_title_name_code_text(page_widget_id: number): string {

        if (!page_widget_id) {
            return null;
        }

        return FavoritesFiltersWidgetOptionsVO.TITLE_CODE_PREFIX + page_widget_id + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {
        let res: { [exportable_code_text: string]: string } = {};

        let placeholder_name_code_text: string = this.get_title_name_code_text(page_widget_id);
        if (placeholder_name_code_text) {

            res[placeholder_name_code_text] =
                FavoritesFiltersWidgetOptionsVO.TITLE_CODE_PREFIX +
                '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
                DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        }
        return res;
    }
}
import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import VOFieldRefVO from "../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO";
import DefaultTranslation from "../../../../../../../shared/modules/Translation/vos/DefaultTranslation";
import IExportableWidgetOptions from "../../IExportableWidgetOptions";

export default class ShowFavoritesFiltersWidgetOptions implements IExportableWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "ShowFavoritesFiltersWidgetOptions.title.";

    public constructor(
        public vo_field_ref?: VOFieldRefVO,
        public max_visible_options?: number,
    ) { }

    /**
     * Hydrate from the given properties
     *
     * @param props {ShowFavoritesFiltersWidgetOptions}
     * @returns {ShowFavoritesFiltersWidgetOptions}
     */
    public from(props: Partial<ShowFavoritesFiltersWidgetOptions>): ShowFavoritesFiltersWidgetOptions {

        Object.assign(this, props);

        return this;
    }

    public get_title_name_code_text(page_widget_id: number): string {

        if (!page_widget_id) {
            return null;
        }

        return ShowFavoritesFiltersWidgetOptions.TITLE_CODE_PREFIX + page_widget_id + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {
        let res: { [exportable_code_text: string]: string } = {};

        let placeholder_name_code_text: string = this.get_title_name_code_text(page_widget_id);
        if (placeholder_name_code_text) {

            res[placeholder_name_code_text] =
                ShowFavoritesFiltersWidgetOptions.TITLE_CODE_PREFIX +
                '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
                DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        }
        return res;
    }
}
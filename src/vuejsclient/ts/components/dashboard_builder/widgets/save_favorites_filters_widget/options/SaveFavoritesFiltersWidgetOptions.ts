import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import DefaultTranslation from "../../../../../../../shared/modules/Translation/vos/DefaultTranslation";
import IExportableWidgetOptions from "../../IExportableWidgetOptions";

export class SaveFavoritesFiltersWidgetOptions implements IExportableWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "SaveFavoritesFiltersWidgetOptions.title.";

    public constructor() { }

    public from(props: SaveFavoritesFiltersWidgetOptions): SaveFavoritesFiltersWidgetOptions {

        return this;
    }

    public get_title_name_code_text(page_widget_id: number): string {

        if (!page_widget_id) {
            return null;
        }

        return SaveFavoritesFiltersWidgetOptions.TITLE_CODE_PREFIX + page_widget_id + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {
        let res: { [exportable_code_text: string]: string } = {};

        let placeholder_name_code_text: string = this.get_title_name_code_text(page_widget_id);
        if (placeholder_name_code_text) {

            res[placeholder_name_code_text] =
                SaveFavoritesFiltersWidgetOptions.TITLE_CODE_PREFIX +
                '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
                DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        }
        return res;
    }
}
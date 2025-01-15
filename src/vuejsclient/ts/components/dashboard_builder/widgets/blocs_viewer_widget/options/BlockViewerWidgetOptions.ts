import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import DefaultTranslationVO from "../../../../../../../shared/modules/Translation/vos/DefaultTranslationVO";
import IExportableWidgetOptions from "../../IExportableWidgetOptions";


export default class BlockViewerWidgetOptions implements IExportableWidgetOptions {
    public static TITLE_CODE_PREFIX: string = "BlockViewerWidgetOptions.title.";

    public constructor(
    ) { }

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        return {};
    }

    get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string; }> {
        throw new Error("Method not implemented.");
    }

    public get_title_name_code_text(page_widget_id: number): string {

        if ((!page_widget_id) ) {
            return null;
        }

        return BlockViewerWidgetOptions.TITLE_CODE_PREFIX + page_widget_id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    }

}
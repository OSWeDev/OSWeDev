import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import DefaultTranslationVO from "../../../../../../../shared/modules/Translation/vos/DefaultTranslationVO";
import IExportableWidgetOptions from "../../IExportableWidgetOptions";

export default class OseliaThreadWidgetOptions implements IExportableWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "OseliaThreadWidgetOptions.title.";

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        return {};
    }

    public constructor(
    ) { }
}
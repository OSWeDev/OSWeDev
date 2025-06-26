import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";

export default class OseliaThreadWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "OseliaThreadWidgetOptions.title.";

    public constructor(
    ) { }

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        return {};
    }
}
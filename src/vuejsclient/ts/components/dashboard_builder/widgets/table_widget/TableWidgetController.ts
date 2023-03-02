import ComponentDatatableFieldVO from "../../../../../../shared/modules/DAO/vos/datatable/ComponentDatatableFieldVO";
import BulkActionVO from "../../../../../../shared/modules/DashboardBuilder/vos/BulkActionVO";

export default class TableWidgetController {

    public static getInstance(): TableWidgetController {
        if (!this.instance) {
            this.instance = new TableWidgetController();
        }

        return this.instance;
    }

    private static instance = null;

    public components_by_crud_api_type_id: { [api_type_id: string]: Array<ComponentDatatableFieldVO<any, any>> } = {};
    public components_by_translatable_title: { [translatable_title: string]: ComponentDatatableFieldVO<any, any> } = {};

    public bulk_actions_by_crud_api_type_id: { [api_type_id: string]: Array<BulkActionVO<any, any>> } = {};
    public bulk_actions_by_translatable_title: { [translatable_title: string]: BulkActionVO<any, any> } = {};

    private constructor() { }

    public register_component(component: ComponentDatatableFieldVO<any, any>) {
        if (!this.components_by_crud_api_type_id[component.vo_type_id]) {
            this.components_by_crud_api_type_id[component.vo_type_id] = [];
        }
        this.components_by_crud_api_type_id[component.vo_type_id].push(component);

        this.components_by_translatable_title[component.translatable_title] = component;
    }

    public register_bulk_action(bulk_action: BulkActionVO<any, any>) {

        if (!this.bulk_actions_by_crud_api_type_id[bulk_action.vo_type_id]) {
            this.bulk_actions_by_crud_api_type_id[bulk_action.vo_type_id] = [];
        }
        this.bulk_actions_by_crud_api_type_id[bulk_action.vo_type_id].push(bulk_action);

        this.bulk_actions_by_translatable_title[bulk_action.translatable_title] = bulk_action;
    }
}
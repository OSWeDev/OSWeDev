import ComponentDatatableField from "../../../../../../shared/modules/DAO/vos/datatable/ComponentDatatableField";

export default class TableWidgetController {

    public static getInstance(): TableWidgetController {
        if (!this.instance) {
            this.instance = new TableWidgetController();
        }

        return this.instance;
    }

    private static instance = null;

    public components_by_crud_api_type_id: { [api_type_id: string]: Array<ComponentDatatableField<any, any>> } = {};
    public components_by_translatable_title: { [translatable_title: string]: ComponentDatatableField<any, any> } = {};

    private constructor() { }

    public register_component(component: ComponentDatatableField<any, any>) {
        if (!this.components_by_crud_api_type_id[component.moduleTable.vo_type]) {
            this.components_by_crud_api_type_id[component.moduleTable.vo_type] = [];
        }
        this.components_by_crud_api_type_id[component.moduleTable.vo_type].push(component);

        this.components_by_translatable_title[component.translatable_title] = component;
    }
}
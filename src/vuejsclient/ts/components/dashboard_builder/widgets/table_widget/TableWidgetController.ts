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

    private constructor() { }
}
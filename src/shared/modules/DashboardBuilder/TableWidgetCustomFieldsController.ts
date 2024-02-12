
/**
 * TableWidgetCustomFieldsController
 */
export default class TableWidgetCustomFieldsController {

    // istanbul ignore next: nothing to test
    public static getInstance(): TableWidgetCustomFieldsController {
        if (!this.instance) {
            this.instance = new TableWidgetCustomFieldsController();
        }

        return this.instance;
    }

    private static instance = null;

    public custom_components_export_cb_by_translatable_title: { [translatable_title: string]: (vo) => Promise<any> } = {};

    private constructor() { }

    public register_component(translatable_title: string, cb: (vo) => Promise<any>) {
        this.custom_components_export_cb_by_translatable_title[translatable_title] = cb;
    }
}
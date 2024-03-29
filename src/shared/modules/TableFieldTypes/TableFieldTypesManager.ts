import TableFieldTypeControllerBase from './vos/TableFieldTypeControllerBase';

export default class TableFieldTypesManager {

    // istanbul ignore next: nothing to test
    public static getInstance(): TableFieldTypesManager {
        if (!TableFieldTypesManager.instance) {
            TableFieldTypesManager.instance = new TableFieldTypesManager();
        }
        return TableFieldTypesManager.instance;
    }

    private static instance: TableFieldTypesManager = null;

    /**
     * Local thread cache -----
     */
    public registeredTableFieldTypeControllers: { [name: string]: TableFieldTypeControllerBase } = {};
    /**
     * ----- Local thread cache
     */

    private constructor() {
    }

    public registerTableFieldTypeController(tableFieldTypeController: TableFieldTypeControllerBase) {
        this.registeredTableFieldTypeControllers[tableFieldTypeController.name] = tableFieldTypeController;
    }

    public registerTableFieldTypeComponents(component_name: string, read_component, create_update_component) {
        if (!this.registeredTableFieldTypeControllers[component_name]) {
            return;
        }
        this.registeredTableFieldTypeControllers[component_name].read_component = read_component;
        this.registeredTableFieldTypeControllers[component_name].create_update_component = create_update_component;
    }
}
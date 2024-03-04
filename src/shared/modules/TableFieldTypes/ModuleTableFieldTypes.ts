import Module from '../Module';

export default class ModuleTableFieldTypes extends Module {

    public static MODULE_NAME: string = 'TableFieldTypes';

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleTableFieldTypes {
        if (!ModuleTableFieldTypes.instance) {
            ModuleTableFieldTypes.instance = new ModuleTableFieldTypes();
        }
        return ModuleTableFieldTypes.instance;
    }

    private static instance: ModuleTableFieldTypes = null;

    private constructor() {

        super("table_field_types", ModuleTableFieldTypes.MODULE_NAME);
        this.forceActivationOnInstallation();
    }
}
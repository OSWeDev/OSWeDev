import Module from '../Module';

export default class ModuleAzureMemoryCheck extends Module {

    public static MODULE_NAME: string = 'AzureMemoryCheck';

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleAzureMemoryCheck {
        if (!ModuleAzureMemoryCheck.instance) {
            ModuleAzureMemoryCheck.instance = new ModuleAzureMemoryCheck();
        }
        return ModuleAzureMemoryCheck.instance;
    }

    private static instance: ModuleAzureMemoryCheck = null;

    private constructor() {
        super("azurememorycheck", ModuleAzureMemoryCheck.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }
}
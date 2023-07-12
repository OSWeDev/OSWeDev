import Module from '../Module';
import MatroidController from './MatroidController';

export default class ModuleMatroid extends Module {

    public static MODULE_NAME: string = 'Matroid';

    public static getInstance(): ModuleMatroid {
        if (!ModuleMatroid.instance) {
            ModuleMatroid.instance = new ModuleMatroid();
        }
        return ModuleMatroid.instance;
    }

    private static instance: ModuleMatroid = null;

    private constructor() {

        super("matroid", ModuleMatroid.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }

    public async hook_module_async_client_admin_initialization(): Promise<any> {
        await MatroidController.initialize();
        return true;
    }

    public async hook_module_configure(): Promise<boolean> {
        await MatroidController.initialize();
        return true;
    }
}
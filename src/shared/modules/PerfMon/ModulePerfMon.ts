import Module from '../Module';
// import PerfMonController from './PerfMonController';

export default class ModulePerfMon extends Module {

    public static MODULE_NAME: string = 'PerfMon';

    public static getInstance(): ModulePerfMon {
        if (!ModulePerfMon.instance) {
            ModulePerfMon.instance = new ModulePerfMon();
        }
        return ModulePerfMon.instance;
    }

    private static instance: ModulePerfMon = null;

    private constructor() {

        super("perfmon", ModulePerfMon.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }

    // public async hook_module_async_client_admin_initialization(): Promise<any> {
    //     await PerfMonController.getInstance().initialize();
    //     return true;
    // }

    // public async hook_module_configure(): Promise<boolean> {
    //     await PerfMonController.getInstance().initialize();
    //     return true;
    // }
}
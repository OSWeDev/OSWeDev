import Module from '../Module';
import DataSourcesController from './DataSourcesController';

export default class ModuleDataSource extends Module {

    public static MODULE_NAME: string = 'DataSource';

    public static getInstance(): ModuleDataSource {
        if (!ModuleDataSource.instance) {
            ModuleDataSource.instance = new ModuleDataSource();
        }
        return ModuleDataSource.instance;
    }

    private static instance: ModuleDataSource = null;

    private constructor() {

        super("datasource", ModuleDataSource.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }

    public async hook_module_async_client_admin_initialization(): Promise<any> {
        await DataSourcesController.getInstance().initialize();
        return true;
    }

    public async hook_module_configure(): Promise<boolean> {
        await DataSourcesController.getInstance().initialize();
        return true;
    }
}
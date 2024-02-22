import Module from '../Module';

export default class ModuleDataSource extends Module {

    public static MODULE_NAME: string = 'DataSource';

    // istanbul ignore next: nothing to test
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
}
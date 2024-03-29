import DashboardBuilderVueModuleBase from './DashboardBuilderVueModuleBase';

export default class DashboardBuilderClientVueModule extends DashboardBuilderVueModuleBase {

    // istanbul ignore next: nothing to test
    public static getInstance(): DashboardBuilderClientVueModule {
        if (!DashboardBuilderClientVueModule.instance) {
            DashboardBuilderClientVueModule.instance = new DashboardBuilderClientVueModule();
        }

        return DashboardBuilderClientVueModule.instance;
    }

    protected static instance: DashboardBuilderClientVueModule = null;

    protected constructor() {
        super();
    }

    public async initializeAsync() {

        await super.initializeAsync();
    }
}
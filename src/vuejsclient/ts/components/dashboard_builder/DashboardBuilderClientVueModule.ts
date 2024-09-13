import DashboardBuilderVueModuleBase from './DashboardBuilderVueModuleBase';

export default class DashboardBuilderClientVueModule extends DashboardBuilderVueModuleBase {

    protected static instance: DashboardBuilderClientVueModule = null;

    protected constructor() {
        super();
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): DashboardBuilderClientVueModule {
        if (!DashboardBuilderClientVueModule.instance) {
            DashboardBuilderClientVueModule.instance = new DashboardBuilderClientVueModule();
        }

        return DashboardBuilderClientVueModule.instance;
    }

    public async initializeAsync() {

        await super.initializeAsync();
    }
}
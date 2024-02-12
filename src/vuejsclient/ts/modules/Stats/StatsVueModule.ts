import ModuleStats from '../../../../shared/modules/Stats/ModuleStats';
import StatsController from '../../../../shared/modules/Stats/StatsController';
import VueModuleBase from '../VueModuleBase';
import StatsClientController from './StatsClientController';

export default class StatsVueModule extends VueModuleBase {

    // istanbul ignore next: nothing to test
    public static getInstance(): StatsVueModule {
        if (!StatsVueModule.instance) {
            StatsVueModule.instance = new StatsVueModule();
        }

        return StatsVueModule.instance;
    }

    private static instance: StatsVueModule = null;

    private constructor() {

        super(ModuleStats.getInstance().name);
    }

    public initialize() {
        StatsController.new_stats_handler = StatsClientController.new_stats_handler;
    }

    public async initializeAsync(): Promise<void> {
        await StatsController.init_params();
    }
}
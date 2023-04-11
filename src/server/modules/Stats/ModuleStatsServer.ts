
import ModuleStats from '../../../shared/modules/Stats/ModuleStats';
import { all_promises } from '../../../shared/tools/PromiseTools';
import ModuleBGThreadServer from '../BGThread/ModuleBGThreadServer';
import ModuleServerBase from '../ModuleServerBase';
import StatsInvalidatorBGThread from './bgthreads/StatsInvalidatorBGThread';
import VarSecStatsGroupeController from './vars/controllers/VarSecStatsGroupeController';

export default class ModuleStatsServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleStatsServer.instance) {
            ModuleStatsServer.instance = new ModuleStatsServer();
        }
        return ModuleStatsServer.instance;
    }

    private static instance: ModuleStatsServer = null;

    private constructor() {
        super(ModuleStats.getInstance().name);
    }

    public async registerAccessPolicies(): Promise<void> {
    }

    public async configure() {
        await this.configure_vars();
        ModuleBGThreadServer.getInstance().registerBGThread(StatsInvalidatorBGThread.getInstance());
    }

    private async configure_vars() {

        await all_promises([
            VarSecStatsGroupeController.getInstance().initialize(),
        ]);
    }
}
import ModuleUserLogVars from '../../../shared/modules/UserLogVars/ModuleUserLogVars';
import { all_promises } from '../../../shared/tools/PromiseTools';
import ModuleServerBase from '../ModuleServerBase';
import VarLastCSRFTSController from './vars/controllers/VarLastCSRFTSController';
import VarMinCSRFCountController from './vars/controllers/VarMinCSRFCountController';
import VarMinLoginCountController from './vars/controllers/VarMinLoginCountController';
import VarMinLogoutCountController from './vars/controllers/VarMinLogoutCountController';
import VarMonthCompareCSRFCountMAndMm2Controller from './vars/controllers/VarMonthCompareCSRFCountMAndMm2Controller';


export default class ModuleUserLogVarsServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleUserLogVarsServer.instance) {
            ModuleUserLogVarsServer.instance = new ModuleUserLogVarsServer();
        }
        return ModuleUserLogVarsServer.instance;
    }

    private static instance: ModuleUserLogVarsServer = null;

    private constructor() {
        super(ModuleUserLogVars.getInstance().name);
    }

    public async configure() {
        await this.configure_vars();
    }

    private async configure_vars() {

        await all_promises([
            VarMinCSRFCountController.getInstance().initialize(),
            VarMinLoginCountController.getInstance().initialize(),
            VarMinLogoutCountController.getInstance().initialize(),
            VarLastCSRFTSController.getInstance().initialize(),
            VarMonthCompareCSRFCountMAndMm2Controller.getInstance().initialize()
        ]);
    }
}
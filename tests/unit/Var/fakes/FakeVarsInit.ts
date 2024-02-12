import VarsServerController from "../../../../src/server/modules/Var/VarsServerController";
import ModuleVar from "../../../../src/shared/modules/Var/ModuleVar";
import VarsController from "../../../../src/shared/modules/Var/VarsController";
import FakeDataHandler from "./FakeDataHandler";
import FakeDistantHandler from "./FakeDistantHandler";
import FakeEmpDayDataHandler from "./FakeEmpDayDataHandler";
import FakeVarControllerDeps from "./FakeVarControllerDeps";
import FakeVarControllerDsDistant from "./FakeVarControllerDsDistant";
import FakeVarControllerDsEmpDistant from "./FakeVarControllerDsEmpDistant";
import FakeVarControllerCyclA from "./cyclical/FakeVarControllerCyclA";
import FakeVarControllerCyclB from "./cyclical/FakeVarControllerCyclB";

export default class FakeVarsInit {

    public static async initAll() {

        FakeDataHandler.initializeFakeDataVO();
        FakeEmpDayDataHandler.initializeFakeEmpDayDataVO();
        FakeDistantHandler.initializeFakeDistantVO();
        await ModuleVar.getInstance().initializeasync({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: FakeVarControllerDsDistant.getInstance().varConf,
            [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: FakeVarControllerDsEmpDistant.getInstance().varConf,
            [FakeVarControllerDeps.getInstance().varConf.id]: FakeVarControllerDeps.getInstance().varConf,
            [FakeVarControllerCyclA.getInstance().varConf.id]: FakeVarControllerDeps.getInstance().varConf,
            [FakeVarControllerCyclB.getInstance().varConf.id]: FakeVarControllerDeps.getInstance().varConf
        });
        await FakeVarControllerDsDistant.getInstance().initialize();
        await FakeVarControllerDsEmpDistant.getInstance().initialize();
        await FakeVarControllerDeps.getInstance().initialize();
        await FakeVarControllerCyclA.getInstance().initialize();
        await FakeVarControllerCyclB.getInstance().initialize();
        VarsServerController.init_varcontrollers_dag();
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): FakeVarsInit {
        if (!FakeVarsInit.instance) {
            FakeVarsInit.instance = new FakeVarsInit();
        }
        return FakeVarsInit.instance;
    }

    protected static instance: FakeVarsInit = null;

    protected constructor() {
    }
}
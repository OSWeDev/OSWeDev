import VarsServerController from "../../../../../src/server/modules/Var/VarsServerController";
import ModuleVar from "../../../../../src/shared/modules/Var/ModuleVar";
import FakeDataHandler from "../FakeDataHandler";
import FakeAVarController from "./ctrls/FakeAVarController";
import FakeBVarController from "./ctrls/FakeBVarController";
import FakeCVarController from "./ctrls/FakeCVarController";
import FakeEVarController from "./ctrls/FakeEVarController";
import FakeFVarController from "./ctrls/FakeFVarController";
import FakeGVarController from "./ctrls/FakeGVarController";
import FakeHVarController from "./ctrls/FakeHVarController";

export default class FakeTriangularVarsInit {

    public static async initAll() {

        FakeDataHandler.initializeFakeDataVO();
        await ModuleVar.getInstance().initializeasync({
            [FakeAVarController.getInstance().varConf.id]: FakeAVarController.getInstance().varConf,
            [FakeBVarController.getInstance().varConf.id]: FakeBVarController.getInstance().varConf,
            [FakeCVarController.getInstance().varConf.id]: FakeCVarController.getInstance().varConf,
            [FakeEVarController.getInstance().varConf.id]: FakeEVarController.getInstance().varConf,
            [FakeFVarController.getInstance().varConf.id]: FakeFVarController.getInstance().varConf,
            [FakeGVarController.getInstance().varConf.id]: FakeGVarController.getInstance().varConf,
            [FakeHVarController.getInstance().varConf.id]: FakeHVarController.getInstance().varConf,
        });
        await FakeAVarController.getInstance().initialize();
        await FakeBVarController.getInstance().initialize();
        await FakeCVarController.getInstance().initialize();
        await FakeEVarController.getInstance().initialize();
        await FakeFVarController.getInstance().initialize();
        await FakeGVarController.getInstance().initialize();
        await FakeHVarController.getInstance().initialize();
        VarsServerController.init_varcontrollers_dag();
    }
}
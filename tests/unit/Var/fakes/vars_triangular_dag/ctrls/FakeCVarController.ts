import VarServerControllerBase from '../../../../../../src/server/modules/Var/VarServerControllerBase';
import VarsServerController from '../../../../../../src/server/modules/Var/VarsServerController';
import TimeSegment from '../../../../../../src/shared/modules/DataRender/vos/TimeSegment';
import VarDAGNode from '../../../../../../src/server/modules/Var/vos/VarDAGNode';
import VarsController from '../../../../../../src/shared/modules/Var/VarsController';
import VarConfVO from '../../../../../../src/shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../../../../src/shared/modules/Var/vos/VarDataBaseVO';
import FakeDataVO from '../vos/FakeDataVO';
import FakeGVarController from './FakeGVarController';
import FakeHVarController from './FakeHVarController';

export default class FakeCVarController extends VarServerControllerBase<FakeDataVO> {

    public static DEP_G: string = 'G' + VarsController.MANDATORY_DEP_ID_SUFFIX;
    public static DEP_H: string = 'H' + VarsController.MANDATORY_DEP_ID_SUFFIX;

    // istanbul ignore next: nothing to test
    public static getInstance(): FakeCVarController {
        if (!FakeCVarController.instance) {
            FakeCVarController.instance = new FakeCVarController();
        }
        return FakeCVarController.instance;
    }

    protected static instance: FakeCVarController = null;

    protected constructor() {
        super(
            new VarConfVO('FakeCVarController', FakeDataVO.API_TYPE_ID, {
                ts_ranges: TimeSegment.TYPE_DAY
            }, 3),
            {}, {}, {}, {}
        );
    }

    public getVarControllerDependencies(): { [dep_name: string]: VarServerControllerBase<any> } {
        return {
            [FakeCVarController.DEP_G]: FakeGVarController.getInstance(),
            [FakeCVarController.DEP_H]: FakeHVarController.getInstance()
        };
    }
    public getParamDependencies(varDAGNode: VarDAGNode): { [dep_id: string]: VarDataBaseVO } {

        return {
            [FakeCVarController.DEP_G]:
                VarDataBaseVO.cloneFromVarName(varDAGNode.var_data as FakeDataVO, FakeGVarController.getInstance().varConf.name),

            [FakeCVarController.DEP_H]:
                VarDataBaseVO.cloneFromVarName(varDAGNode.var_data as FakeDataVO, FakeHVarController.getInstance().varConf.name)
        };
    }

    public async get_invalid_params_intersectors_from_dep<T extends VarDataBaseVO>(dep_id: string, intersectors: T[]): Promise<FakeDataVO[]> {

        switch (dep_id) {
            case FakeCVarController.DEP_H:
                return VarDataBaseVO.cloneArrayFrom(intersectors as any as FakeDataVO[], this.varConf.name);

            case FakeCVarController.DEP_G:
                return VarDataBaseVO.cloneArrayFrom(intersectors as any as FakeDataVO[], this.varConf.name) as FakeDataVO[];
        }

        return null;
    }

    protected getValue(varDAGNode: VarDAGNode): number {

        const DEP_G = VarsServerController.get_outgoing_deps_sum(varDAGNode, FakeCVarController.DEP_G, 0);
        const DEP_H = VarsServerController.get_outgoing_deps_sum(varDAGNode, FakeCVarController.DEP_H, 0);

        return DEP_G - DEP_H;
    }
}
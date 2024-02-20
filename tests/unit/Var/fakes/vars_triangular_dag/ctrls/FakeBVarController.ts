import VarServerControllerBase from '../../../../../../src/server/modules/Var/VarServerControllerBase';
import VarsServerController from '../../../../../../src/server/modules/Var/VarsServerController';
import TimeSegment from '../../../../../../src/shared/modules/DataRender/vos/TimeSegment';
import VarDAGNode from '../../../../../../src/server/modules/Var/vos/VarDAGNode';
import VarsController from '../../../../../../src/shared/modules/Var/VarsController';
import VarConfVO from '../../../../../../src/shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../../../../src/shared/modules/Var/vos/VarDataBaseVO';
import FakeDataVO from '../vos/FakeDataVO';
import FakeEVarController from './FakeEVarController';
import FakeFVarController from './FakeFVarController';

export default class FakeBVarController extends VarServerControllerBase<FakeDataVO> {

    public static DEP_E: string = 'E' + VarsController.MANDATORY_DEP_ID_SUFFIX;
    public static DEP_F: string = 'F' + VarsController.MANDATORY_DEP_ID_SUFFIX;

    // istanbul ignore next: nothing to test
    public static getInstance(): FakeBVarController {
        if (!FakeBVarController.instance) {
            FakeBVarController.instance = new FakeBVarController();
        }
        return FakeBVarController.instance;
    }

    protected static instance: FakeBVarController = null;

    protected constructor() {
        super(
            new VarConfVO('FakeBVarController', FakeDataVO.API_TYPE_ID, {
                ts_ranges: TimeSegment.TYPE_DAY
            }, 2),
            {}, {}, {}, {}
        );
    }

    public getVarControllerDependencies(): { [dep_name: string]: VarServerControllerBase<any> } {
        return {
            [FakeBVarController.DEP_E]: FakeEVarController.getInstance(),
            [FakeBVarController.DEP_F]: FakeFVarController.getInstance()
        };
    }
    public getParamDependencies(varDAGNode: VarDAGNode): { [dep_id: string]: VarDataBaseVO } {

        return {
            [FakeBVarController.DEP_E]:
                VarDataBaseVO.cloneFromVarName(varDAGNode.var_data as FakeDataVO, FakeEVarController.getInstance().varConf.name),

            [FakeBVarController.DEP_F]:
                VarDataBaseVO.cloneFromVarName(varDAGNode.var_data as FakeDataVO, FakeFVarController.getInstance().varConf.name)
        };
    }

    public async get_invalid_params_intersectors_from_dep<T extends VarDataBaseVO>(dep_id: string, intersectors: T[]): Promise<FakeDataVO[]> {

        switch (dep_id) {
            case FakeBVarController.DEP_F:
                return VarDataBaseVO.cloneArrayFrom(intersectors as any as FakeDataVO[], this.varConf.name);

            case FakeBVarController.DEP_E:
                return VarDataBaseVO.cloneArrayFrom(intersectors as any as FakeDataVO[], this.varConf.name) as FakeDataVO[];
        }

        return null;
    }

    protected getValue(varDAGNode: VarDAGNode): number {

        let DEP_E = VarsServerController.get_outgoing_deps_sum(varDAGNode, FakeBVarController.DEP_E, 0);
        let DEP_F = VarsServerController.get_outgoing_deps_sum(varDAGNode, FakeBVarController.DEP_F, 0);

        return DEP_E * DEP_F;
    }
}
import VarServerControllerBase from '../../../../../../src/server/modules/Var/VarServerControllerBase';
import VarsServerController from '../../../../../../src/server/modules/Var/VarsServerController';
import TimeSegment from '../../../../../../src/shared/modules/DataRender/vos/TimeSegment';
import VarDAGNode from '../../../../../../src/shared/modules/Var/graph/VarDAGNode';
import VarsController from '../../../../../../src/shared/modules/Var/VarsController';
import VarCacheConfVO from '../../../../../../src/shared/modules/Var/vos/VarCacheConfVO';
import VarConfVO from '../../../../../../src/shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../../../../src/shared/modules/Var/vos/VarDataBaseVO';
import FakeDataVO from '../vos/FakeDataVO';
import FakeBVarController from './FakeBVarController';
import FakeCVarController from './FakeCVarController';

export default class FakeAVarController extends VarServerControllerBase<FakeDataVO> {

    public static DEP_B: string = 'B' + VarsController.MANDATORY_DEP_ID_SUFFIX;
    public static DEP_C: string = 'C' + VarsController.MANDATORY_DEP_ID_SUFFIX;

    public static getInstance(): FakeAVarController {
        if (!FakeAVarController.instance) {
            FakeAVarController.instance = new FakeAVarController();
        }
        return FakeAVarController.instance;
    }

    protected static instance: FakeAVarController = null;

    protected constructor() {
        super(
            new VarConfVO('FakeAVarController', FakeDataVO.API_TYPE_ID, {
                ts_ranges: TimeSegment.TYPE_DAY
            }, 1),
            {}, {}, {}, {}
        );

        this.optimization__has_no_imports = true;
    }

    public getVarCacheConf(): VarCacheConfVO {
        let res: VarCacheConfVO = new VarCacheConfVO();
        res.id = 1;
        res.var_id = this.varConf.id;
        return res;
    }

    public getVarControllerDependencies(): { [dep_name: string]: VarServerControllerBase<any> } {
        return {
            [FakeAVarController.DEP_B]: FakeBVarController.getInstance(),
            [FakeAVarController.DEP_C]: FakeCVarController.getInstance()
        };
    }
    public getParamDependencies(varDAGNode: VarDAGNode): { [dep_id: string]: VarDataBaseVO } {

        return {
            [FakeAVarController.DEP_B]:
                VarDataBaseVO.cloneFromVarName(varDAGNode.var_data as FakeDataVO, FakeBVarController.getInstance().varConf.name),

            [FakeAVarController.DEP_C]:
                VarDataBaseVO.cloneFromVarName(varDAGNode.var_data as FakeDataVO, FakeCVarController.getInstance().varConf.name)
        };
    }

    public async get_invalid_params_intersectors_from_dep<T extends VarDataBaseVO>(dep_id: string, intersectors: T[]): Promise<FakeDataVO[]> {

        switch (dep_id) {
            case FakeAVarController.DEP_C:
                return VarDataBaseVO.cloneArrayFrom(intersectors as any as FakeDataVO[], this.varConf.name);

            case FakeAVarController.DEP_B:
                return VarDataBaseVO.cloneArrayFrom(intersectors as any as FakeDataVO[], this.varConf.name) as FakeDataVO[];
        }

        return null;
    }

    protected getValue(varDAGNode: VarDAGNode): number {

        let DEP_B = VarsServerController.get_outgoing_deps_sum(varDAGNode, FakeAVarController.DEP_B, 0);
        let DEP_C = VarsServerController.get_outgoing_deps_sum(varDAGNode, FakeAVarController.DEP_C, 0);

        return DEP_B + DEP_C;
    }
}
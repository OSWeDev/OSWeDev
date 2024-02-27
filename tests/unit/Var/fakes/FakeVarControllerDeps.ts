import VarServerControllerBase from '../../../../src/server/modules/Var/VarServerControllerBase';
import VarsServerController from '../../../../src/server/modules/Var/VarsServerController';
import TimeSegment from '../../../../src/shared/modules/DataRender/vos/TimeSegment';
import VarDAGNode from '../../../../src/server/modules/Var/vos/VarDAGNode';
import VarsController from '../../../../src/shared/modules/Var/VarsController';
import VarConfVO from '../../../../src/shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../../src/shared/modules/Var/vos/VarDataBaseVO';
import FakeVarControllerDsDistant from './FakeVarControllerDsDistant';
import FakeVarControllerDsEmpDistant from './FakeVarControllerDsEmpDistant';
import FakeDataVO from './vos/FakeDataVO';
import FakeEmpDayDataVO from './vos/FakeEmpDayDataVO';

export default class FakeVarControllerDeps extends VarServerControllerBase<FakeEmpDayDataVO> {

    public static DEP_DsDistant: string = 'DsDistant' + VarsController.MANDATORY_DEP_ID_SUFFIX;
    public static DEP_DsEmpDistant: string = 'DsEmpDistant' + VarsController.MANDATORY_DEP_ID_SUFFIX;

    // istanbul ignore next: nothing to test
    public static getInstance(): FakeVarControllerDeps {
        if (!FakeVarControllerDeps.instance) {
            FakeVarControllerDeps.instance = new FakeVarControllerDeps();
        }
        return FakeVarControllerDeps.instance;
    }

    protected static instance: FakeVarControllerDeps = null;

    protected constructor() {
        super(
            new VarConfVO('FakeVarControllerDeps', FakeEmpDayDataVO.API_TYPE_ID, {
                ts_ranges: TimeSegment.TYPE_DAY
            }, 3),
            {}, {}, {}, {}
        );
    }

    public getVarControllerDependencies(): { [dep_name: string]: VarServerControllerBase<any> } {
        return {
            [FakeVarControllerDeps.DEP_DsDistant]: FakeVarControllerDsDistant.getInstance(),
            [FakeVarControllerDeps.DEP_DsEmpDistant]: FakeVarControllerDsEmpDistant.getInstance()
        };
    }
    public getParamDependencies(varDAGNode: VarDAGNode): { [dep_id: string]: VarDataBaseVO } {

        return {
            [FakeVarControllerDeps.DEP_DsDistant]:
                VarDataBaseVO.cloneFromVarName(varDAGNode.var_data as FakeEmpDayDataVO, FakeVarControllerDsDistant.getInstance().varConf.name),

            [FakeVarControllerDeps.DEP_DsEmpDistant]:
                VarDataBaseVO.cloneFromVarName(varDAGNode.var_data as FakeEmpDayDataVO, FakeVarControllerDsEmpDistant.getInstance().varConf.name)
        };
    }
    /**
     * 2 deps : DEP_DsEmpDistant, DEP_DsDistant
     */
    public async get_invalid_params_intersectors_from_dep<T extends VarDataBaseVO>(dep_id: string, intersectors: T[]): Promise<FakeEmpDayDataVO[]> {

        switch (dep_id) {
            case FakeVarControllerDeps.DEP_DsEmpDistant:
                return VarDataBaseVO.cloneArrayFrom(intersectors as any as FakeEmpDayDataVO[], this.varConf.name);

            case FakeVarControllerDeps.DEP_DsDistant:
                return VarDataBaseVO.cloneArrayFrom(intersectors as any as FakeDataVO[], this.varConf.name) as FakeEmpDayDataVO[];
        }

        return null;
    }

    protected getValue(varDAGNode: VarDAGNode): number {

        const DEP_DsDistant = VarsServerController.get_outgoing_deps_sum(varDAGNode, FakeVarControllerDeps.DEP_DsDistant, 0);
        const DEP_DsEmpDistant = VarsServerController.get_outgoing_deps_sum(varDAGNode, FakeVarControllerDeps.DEP_DsEmpDistant, 0);

        return DEP_DsDistant * DEP_DsEmpDistant;
    }
}
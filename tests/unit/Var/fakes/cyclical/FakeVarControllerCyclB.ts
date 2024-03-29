import VarServerControllerBase from '../../../../../src/server/modules/Var/VarServerControllerBase';
import VarsServerController from '../../../../../src/server/modules/Var/VarsServerController';
import VarDAGNode from '../../../../../src/server/modules/Var/vos/VarDAGNode';
import VarsController from '../../../../../src/shared/modules/Var/VarsController';
import VarConfVO from '../../../../../src/shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../../../src/shared/modules/Var/vos/VarDataBaseVO';
import FakeDataVO from './../vos/FakeDataVO';
import FakeEmpDayDataVO from './../vos/FakeEmpDayDataVO';
import FakeVarControllerCyclA from './FakeVarControllerCyclA';

export default class FakeVarControllerCyclB extends VarServerControllerBase<FakeEmpDayDataVO> {

    public static DEP_CyclA: string = 'CyclA' + VarsController.MANDATORY_DEP_ID_SUFFIX;

    // istanbul ignore next: nothing to test
    public static getInstance(): FakeVarControllerCyclB {
        if (!FakeVarControllerCyclB.instance) {
            FakeVarControllerCyclB.instance = new FakeVarControllerCyclB();
        }
        return FakeVarControllerCyclB.instance;
    }

    protected static instance: FakeVarControllerCyclB = null;

    protected constructor() {
        super(
            new VarConfVO('FakeVarControllerCyclB', FakeEmpDayDataVO.API_TYPE_ID, null, 11),
            {}, {}, {}, {}
        );

        this.optimization__has_no_imports = true;
    }

    public getVarControllerDependencies(): { [dep_name: string]: VarServerControllerBase<any> } {
        return {
            [FakeVarControllerCyclB.DEP_CyclA]: FakeVarControllerCyclA.getInstance()
        };
    }
    public getParamDependencies(varDAGNode: VarDAGNode): { [dep_id: string]: VarDataBaseVO } {

        return {
            [FakeVarControllerCyclB.DEP_CyclA]:
                VarDataBaseVO.cloneFromVarName(varDAGNode.var_data as FakeEmpDayDataVO, FakeVarControllerCyclA.getInstance().varConf.name),
        };
    }
    /**
     * 2 deps : DEP_DsEmpDistant, DEP_CyclA
     */
    public async get_invalid_params_intersectors_from_dep<T extends VarDataBaseVO>(dep_id: string, intersectors: T[]): Promise<FakeEmpDayDataVO[]> {

        switch (dep_id) {
            case FakeVarControllerCyclB.DEP_CyclA:
                return VarDataBaseVO.cloneArrayFrom(intersectors as any as FakeDataVO[], this.varConf.name) as FakeEmpDayDataVO[];
        }

        return null;
    }

    protected getValue(varDAGNode: VarDAGNode): number {

        let DEP_CyclA = VarsServerController.get_outgoing_deps_sum(varDAGNode, FakeVarControllerCyclB.DEP_CyclA, 0);

        return DEP_CyclA;
    }
}
import VarServerControllerBase from '../../../../server/modules/Var/VarServerControllerBase';
import VarsServerController from '../../../../server/modules/Var/VarsServerController';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import VarDAGNode from '../../../../shared/modules/Var/graph/VarDAGNode';
import VarCacheConfVO from '../../../../shared/modules/Var/vos/VarCacheConfVO';
import VarConfVOBase from '../../../../shared/modules/Var/vos/VarConfVOBase';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import FakeVarControllerDsDistant from './FakeVarControllerDsDistant';
import FakeVarControllerDsEmpDistant from './FakeVarControllerDsEmpDistant';
import TestDataConvertionsController from './TestDataConvertionsController';
import FakeDataVO from './vos/FakeDataVO';
import FakeEmpDayDataVO from './vos/FakeEmpDayDataVO';
import FakeEmpDistantVO from './vos/FakeEmpDistantVO';

export default class FakeVarControllerDeps extends VarServerControllerBase<FakeEmpDayDataVO> {

    public static DEP_DsDistant: string = 'DsDistant';
    public static DEP_DsEmpDistant: string = 'DsEmpDistant';

    public static getInstance(): FakeVarControllerDeps {
        if (!FakeVarControllerDeps.instance) {
            FakeVarControllerDeps.instance = new FakeVarControllerDeps();
        }
        return FakeVarControllerDeps.instance;
    }

    protected static instance: FakeVarControllerDeps = null;

    public segment_type: number = TimeSegment.TYPE_MONTH;

    protected constructor() {
        super(new VarConfVOBase('FakeVarControllerDeps', FakeEmpDistantVO.API_TYPE_ID, 3));

        this.optimization__has_no_imports = true;
    }

    public getVarCacheConf(): VarCacheConfVO {
        let res: VarCacheConfVO = new VarCacheConfVO();
        res.id = 3;
        res.var_id = this.varConf.id;
        res.cache_timeout_ms = 0;
        return res;
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
                TestDataConvertionsController.getInstance().convert_EmpData_to_Data(
                    VarDataBaseVO.cloneFrom(varDAGNode.var_data as FakeEmpDayDataVO, FakeVarControllerDsDistant.getInstance().varConf.name, true)),
            [FakeVarControllerDeps.DEP_DsEmpDistant]:
                VarDataBaseVO.cloneFrom(varDAGNode.var_data as FakeEmpDayDataVO, FakeVarControllerDsEmpDistant.getInstance().varConf.name, true)
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
                let DEP_DsDistant = VarDataBaseVO.cloneArrayFrom(intersectors as any as FakeDataVO[], this.varConf.name);
                DEP_DsDistant.forEach((e) => TestDataConvertionsController.getInstance().convert_Data_to_EmpData(e));
                return DEP_DsDistant as FakeEmpDayDataVO[];
        }

        return null;
    }

    protected getValue(varDAGNode: VarDAGNode): number {

        let DEP_DsDistant = VarsServerController.getInstance().get_outgoing_deps_sum(varDAGNode, FakeVarControllerDeps.DEP_DsDistant, 0);
        let DEP_DsEmpDistant = VarsServerController.getInstance().get_outgoing_deps_sum(varDAGNode, FakeVarControllerDeps.DEP_DsEmpDistant, 0);

        return DEP_DsDistant * DEP_DsEmpDistant;
    }
}
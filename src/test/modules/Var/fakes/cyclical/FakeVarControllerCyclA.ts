import DataSourceControllerBase from '../../../../../server/modules/Var/datasource/DataSourceControllerBase';
import VarServerControllerBase from '../../../../../server/modules/Var/VarServerControllerBase';
import VarsServerController from '../../../../../server/modules/Var/VarsServerController';
import NumSegment from '../../../../../shared/modules/DataRender/vos/NumSegment';
import TimeSegment from '../../../../../shared/modules/DataRender/vos/TimeSegment';
import VarDAGNode from '../../../../../shared/modules/Var/graph/VarDAGNode';
import VarsController from '../../../../../shared/modules/Var/VarsController';
import VarCacheConfVO from '../../../../../shared/modules/Var/vos/VarCacheConfVO';
import VarConfVO from '../../../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../../../shared/modules/Var/vos/VarDataBaseVO';
import RangeHandler from '../../../../../shared/tools/RangeHandler';
import FakeEmpDistantDatasourceController from '../FakeEmpDistantDatasourceController';
import FakeEmpDistantVO from '../vos/FakeEmpDistantVO';
import FakeDataVO from './../vos/FakeDataVO';
import FakeEmpDayDataVO from './../vos/FakeEmpDayDataVO';
import FakeVarControllerCyclB from './FakeVarControllerCyclB';

export default class FakeVarControllerCyclA extends VarServerControllerBase<FakeEmpDayDataVO> {

    public static DEP_CyclB: string = 'CyclB' + VarsController.MANDATORY_DEP_ID_SUFFIX;

    public static getInstance(): FakeVarControllerCyclA {
        if (!FakeVarControllerCyclA.instance) {
            FakeVarControllerCyclA.instance = new FakeVarControllerCyclA();
        }
        return FakeVarControllerCyclA.instance;
    }

    protected static instance: FakeVarControllerCyclA = null;

    protected constructor() {
        super(
            new VarConfVO('FakeVarControllerCyclA', FakeEmpDayDataVO.API_TYPE_ID, TimeSegment.TYPE_MONTH, 10),
            {}, {}, {}, {}
        );

        this.optimization__has_no_imports = true;
    }

    public getVarCacheConf(): VarCacheConfVO {
        let res: VarCacheConfVO = new VarCacheConfVO();
        res.id = 10;
        res.var_id = this.varConf.id;
        res.cache_timeout_secs = 0;
        return res;
    }

    public getDataSourcesDependencies(): DataSourceControllerBase[] {
        return [
            FakeEmpDistantDatasourceController.getInstance()
        ];
    }

    public async get_invalid_params_intersectors_on_POST_C_POST_D(c_or_d_vo: FakeEmpDistantVO): Promise<FakeEmpDayDataVO[]> {

        return [
            FakeEmpDayDataVO.createNew(
                this.varConf.name,
                false,
                [RangeHandler.getInstance().create_single_elt_NumRange((c_or_d_vo as FakeEmpDistantVO).employee_id, NumSegment.TYPE_INT)],
                [RangeHandler.getInstance().create_single_elt_TSRange((c_or_d_vo as FakeEmpDistantVO).date, TimeSegment.TYPE_MONTH)]
            )
        ];
    }

    public getVarControllerDependencies(): { [dep_name: string]: VarServerControllerBase<any> } {
        return {
            [FakeVarControllerCyclA.DEP_CyclB]: FakeVarControllerCyclB.getInstance(),
        };
    }
    public getParamDependencies(varDAGNode: VarDAGNode): { [dep_id: string]: VarDataBaseVO } {

        return {
            [FakeVarControllerCyclA.DEP_CyclB]:
                VarDataBaseVO.cloneFromVarName(varDAGNode.var_data as FakeEmpDayDataVO, FakeVarControllerCyclB.getInstance().varConf.name),
        };
    }
    /**
     * 2 deps : DEP_DsEmpDistant, DEP_CyclB
     */
    public async get_invalid_params_intersectors_from_dep<T extends VarDataBaseVO>(dep_id: string, intersectors: T[]): Promise<FakeEmpDayDataVO[]> {

        switch (dep_id) {
            case FakeVarControllerCyclA.DEP_CyclB:
                return VarDataBaseVO.cloneArrayFrom(intersectors as any as FakeDataVO[], this.varConf.name) as FakeEmpDayDataVO[];
        }

        return null;
    }

    protected getValue(varDAGNode: VarDAGNode): number {

        let DEP_CyclB = VarsServerController.getInstance().get_outgoing_deps_sum(varDAGNode, FakeVarControllerCyclA.DEP_CyclB, 0);

        return DEP_CyclB;
    }
}
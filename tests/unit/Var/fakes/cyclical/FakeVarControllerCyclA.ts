import DataSourceControllerBase from '../../../../../src/server/modules/Var/datasource/DataSourceControllerBase';
import VarServerControllerBase from '../../../../../src/server/modules/Var/VarServerControllerBase';
import VarsServerController from '../../../../../src/server/modules/Var/VarsServerController';
import NumSegment from '../../../../../src/shared/modules/DataRender/vos/NumSegment';
import TimeSegment from '../../../../../src/shared/modules/DataRender/vos/TimeSegment';
import VarDAGNode from '../../../../../src/server/modules/Var/vos/VarDAGNode';
import VarsController from '../../../../../src/shared/modules/Var/VarsController';
import VarConfVO from '../../../../../src/shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../../../src/shared/modules/Var/vos/VarDataBaseVO';
import RangeHandler from '../../../../../src/shared/tools/RangeHandler';
import FakeEmpDistantDatasourceController from '../FakeEmpDistantDatasourceController';
import FakeEmpDistantVO from '../vos/FakeEmpDistantVO';
import FakeDataVO from './../vos/FakeDataVO';
import FakeEmpDayDataVO from './../vos/FakeEmpDayDataVO';
import FakeVarControllerCyclB from './FakeVarControllerCyclB';

export default class FakeVarControllerCyclA extends VarServerControllerBase<FakeEmpDayDataVO> {

    public static DEP_CyclB: string = 'CyclB' + VarsController.MANDATORY_DEP_ID_SUFFIX;

    // istanbul ignore next: nothing to test
    public static getInstance(): FakeVarControllerCyclA {
        if (!FakeVarControllerCyclA.instance) {
            FakeVarControllerCyclA.instance = new FakeVarControllerCyclA();
        }
        return FakeVarControllerCyclA.instance;
    }

    protected static instance: FakeVarControllerCyclA = null;

    protected constructor() {
        super(
            new VarConfVO('FakeVarControllerCyclA', FakeEmpDayDataVO.API_TYPE_ID, null, 10),
            {}, {}, {}, {}
        );
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
                [RangeHandler.create_single_elt_NumRange((c_or_d_vo as FakeEmpDistantVO).employee_id, NumSegment.TYPE_INT)],
                [RangeHandler.create_single_elt_TSRange((c_or_d_vo as FakeEmpDistantVO).date, TimeSegment.TYPE_MONTH)]
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

        let DEP_CyclB = VarsServerController.get_outgoing_deps_sum(varDAGNode, FakeVarControllerCyclA.DEP_CyclB, 0);

        return DEP_CyclB;
    }
}
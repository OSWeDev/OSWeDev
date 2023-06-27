import DAOUpdateVOHolder from '../../../../src/server/modules/DAO/vos/DAOUpdateVOHolder';
import DataSourceControllerBase from '../../../../src/server/modules/Var/datasource/DataSourceControllerBase';
import VarServerControllerBase from '../../../../src/server/modules/Var/VarServerControllerBase';
import NumSegment from '../../../../src/shared/modules/DataRender/vos/NumSegment';
import TimeSegment from '../../../../src/shared/modules/DataRender/vos/TimeSegment';
import IDistantVOBase from '../../../../src/shared/modules/IDistantVOBase';
import VarDAGNode from '../../../../src/shared/modules/Var/graph/VarDAGNode';
import VarCacheConfVO from '../../../../src/shared/modules/Var/vos/VarCacheConfVO';
import VarConfVO from '../../../../src/shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../../src/shared/modules/Var/vos/VarDataBaseVO';
import RangeHandler from '../../../../src/shared/tools/RangeHandler';
import FakeEmpDistantDatasourceController from './FakeEmpDistantDatasourceController';
import FakeEmpDayDataVO from './vos/FakeEmpDayDataVO';
import FakeEmpDistantVO from './vos/FakeEmpDistantVO';

export default class FakeVarControllerDsEmpDistant extends VarServerControllerBase<FakeEmpDayDataVO> {

    public static getInstance(): FakeVarControllerDsEmpDistant {
        if (!FakeVarControllerDsEmpDistant.instance) {
            FakeVarControllerDsEmpDistant.instance = new FakeVarControllerDsEmpDistant();
        }
        return FakeVarControllerDsEmpDistant.instance;
    }

    protected static instance: FakeVarControllerDsEmpDistant = null;

    protected constructor() {
        super(new VarConfVO('FakeVarControllerDsEmpDistant', FakeEmpDayDataVO.API_TYPE_ID, {
            ts_ranges: TimeSegment.TYPE_DAY
        }, 2), {}, {}, {}, {});

        this.optimization__has_no_imports = true;
    }

    public getVarCacheConf(): VarCacheConfVO {
        let res: VarCacheConfVO = new VarCacheConfVO();
        res.id = 2;
        res.var_id = this.varConf.id;
        return res;
    }

    public getDataSourcesDependencies(): DataSourceControllerBase[] {
        return [
            FakeEmpDistantDatasourceController.getInstance()
        ];
    }

    public async get_invalid_params_intersectors_on_POST_C_POST_D(c_or_d_vo: FakeEmpDistantVO): Promise<FakeEmpDayDataVO[]> {

        return [
            VarDataBaseVO.createNew(
                this.varConf.name,
                false,
                [RangeHandler.create_single_elt_NumRange((c_or_d_vo as FakeEmpDistantVO).employee_id, NumSegment.TYPE_INT)],
                [RangeHandler.create_single_elt_TSRange((c_or_d_vo as FakeEmpDistantVO).date, TimeSegment.TYPE_DAY)]
            )
        ];
    }

    public async get_invalid_params_intersectors_on_POST_U<T extends IDistantVOBase>(u_vo_holder: DAOUpdateVOHolder<T>): Promise<FakeEmpDayDataVO[]> {

        let typed: DAOUpdateVOHolder<FakeEmpDistantVO> = u_vo_holder as any as DAOUpdateVOHolder<FakeEmpDistantVO>;

        if (((typed.pre_update_vo as FakeEmpDistantVO).date == (typed.post_update_vo as FakeEmpDistantVO).date) &&
            ((typed.pre_update_vo as FakeEmpDistantVO).value == (typed.post_update_vo as FakeEmpDistantVO).value) &&
            ((typed.pre_update_vo as FakeEmpDistantVO).employee_id == (typed.post_update_vo as FakeEmpDistantVO).employee_id)) {
            return null;
        }

        return [
            VarDataBaseVO.createNew(
                this.varConf.name,
                false,
                [RangeHandler.create_single_elt_NumRange((typed.pre_update_vo as FakeEmpDistantVO).employee_id, NumSegment.TYPE_INT)],
                [RangeHandler.create_single_elt_TSRange((typed.pre_update_vo as FakeEmpDistantVO).date, TimeSegment.TYPE_DAY)]
            ),
            VarDataBaseVO.createNew(
                this.varConf.name,
                false,
                [RangeHandler.create_single_elt_NumRange((typed.post_update_vo as FakeEmpDistantVO).employee_id, NumSegment.TYPE_INT)],
                [RangeHandler.create_single_elt_TSRange((typed.post_update_vo as FakeEmpDistantVO).date, TimeSegment.TYPE_DAY)]
            )
        ];
    }

    protected getValue(varDAGNode: VarDAGNode): number {

        let res = 0;

        let datas: FakeEmpDistantVO[] = varDAGNode.datasources[FakeEmpDistantDatasourceController.getInstance().name];
        datas.forEach((e: FakeEmpDistantVO) => res += e.value);

        return res;
    }
}
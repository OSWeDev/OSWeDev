
import DAOUpdateVOHolder from '../../../../server/modules/DAO/vos/DAOUpdateVOHolder';
import DataSourceControllerBase from '../../../../server/modules/Var/datasource/DataSourceControllerBase';
import VarServerControllerBase from '../../../../server/modules/Var/VarServerControllerBase';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import VarDAGNode from '../../../../shared/modules/Var/graph/VarDAGNode';
import VarCacheConfVO from '../../../../shared/modules/Var/vos/VarCacheConfVO';
import VarConfVO from '../../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import DateHandler from '../../../../shared/tools/DateHandler';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import FakeDistantDatasourceController from './FakeDistantDatasourceController';
import FakeDataVO from './vos/FakeDataVO';
import FakeDistantVO from './vos/FakeDistantVO';

export default class FakeVarControllerDsDistant extends VarServerControllerBase<FakeDataVO> {

    public static getInstance(): FakeVarControllerDsDistant {
        if (!FakeVarControllerDsDistant.instance) {
            FakeVarControllerDsDistant.instance = new FakeVarControllerDsDistant();
        }
        return FakeVarControllerDsDistant.instance;
    }

    protected static instance: FakeVarControllerDsDistant = null;

    protected constructor() {
        super(new VarConfVO('FakeVarControllerDsDistant', FakeDataVO.API_TYPE_ID, null, 1), {}, {}, {}, {});

        this.optimization__has_no_imports = true;
    }

    public getVarCacheConf(): VarCacheConfVO {
        let res: VarCacheConfVO = new VarCacheConfVO();
        res.id = 1;
        res.var_id = this.varConf.id;
        return res;
    }

    public getDataSourcesDependencies(): DataSourceControllerBase[] {
        return [
            FakeDistantDatasourceController.getInstance()
        ];
    }

    public async get_invalid_params_intersectors_on_POST_C_POST_D(c_or_d_vo: FakeDistantVO): Promise<FakeDataVO[]> {

        return [
            VarDataBaseVO.createNew(
                this.varConf.name,
                false,
                [RangeHandler.getInstance().create_single_elt_TSRange((c_or_d_vo as FakeDistantVO).date, TimeSegment.TYPE_DAY)]
            )
        ];
    }

    public async get_invalid_params_intersectors_on_POST_U<T extends IDistantVOBase>(u_vo_holder: DAOUpdateVOHolder<T>): Promise<FakeDataVO[]> {

        let typed: DAOUpdateVOHolder<FakeDistantVO> = u_vo_holder as any as DAOUpdateVOHolder<FakeDistantVO>;

        if (((typed.pre_update_vo as FakeDistantVO).date == (typed.post_update_vo as FakeDistantVO).date) &&
            ((typed.pre_update_vo as FakeDistantVO).value == (typed.post_update_vo as FakeDistantVO).value)) {
            return null;
        }

        return [
            VarDataBaseVO.createNew(
                this.varConf.name,
                false,
                [RangeHandler.getInstance().create_single_elt_TSRange((typed.pre_update_vo as FakeDistantVO).date, TimeSegment.TYPE_DAY)]
            ),
            VarDataBaseVO.createNew(
                this.varConf.name,
                false,
                [RangeHandler.getInstance().create_single_elt_TSRange((typed.post_update_vo as FakeDistantVO).date, TimeSegment.TYPE_DAY)]
            )
        ];
    }

    protected getValue(varDAGNode: VarDAGNode): number {

        let res = 0;

        let datas: { [date_value: number]: FakeDistantVO } = varDAGNode.datasources[FakeDistantDatasourceController.getInstance().name];

        RangeHandler.getInstance().foreach_ranges_sync((varDAGNode.var_data as FakeDataVO).ts_ranges, (date: number) => {

            res += (datas && datas[date]) ? datas[date].value : 0;

        }, TimeSegment.TYPE_DAY);
        return res;
    }
}
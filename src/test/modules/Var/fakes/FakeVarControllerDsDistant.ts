import { Moment } from 'moment';
import DAOUpdateVOHolder from '../../../../server/modules/DAO/vos/DAOUpdateVOHolder';
import DataSourceControllerBase from '../../../../server/modules/Var/datasource/DataSourceControllerBase';
import VarServerControllerBase from '../../../../server/modules/Var/VarServerControllerBase';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import VarDAGNode from '../../../../shared/modules/Var/graph/VarDAGNode';
import VarCacheConfVO from '../../../../shared/modules/Var/vos/VarCacheConfVO';
import VarConfVOBase from '../../../../shared/modules/Var/vos/VarConfVOBase';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import TypesHandler from '../../../../shared/tools/TypesHandler';
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

    public segment_type: number = TimeSegment.TYPE_DAY;

    protected constructor() {
        super(new VarConfVOBase('FakeVarControllerDsDistant', FakeDistantVO.API_TYPE_ID, 1));

        this.optimization__has_no_imports = true;
    }

    public getVarCacheConf(): VarCacheConfVO {
        let res: VarCacheConfVO = new VarCacheConfVO();
        res.id = 1;
        res.var_id = this.varConf.id;
        res.cache_timeout_ms = 0;
        return res;
    }

    public getDataSourcesDependencies(): DataSourceControllerBase[] {
        return [
            FakeDistantDatasourceController.getInstance()
        ];
    }

    public get_invalid_params_intersectors_on_POST_C_POST_D(c_or_d_vo: FakeDistantVO): FakeDataVO[] {

        return [
            VarDataBaseVO.createNew(
                FakeDataVO.API_TYPE_ID,
                this.varConf.name,
                false,
                [RangeHandler.getInstance().create_single_elt_TSRange((c_or_d_vo as FakeDistantVO).date, TimeSegment.TYPE_DAY)]
            )
        ];
    }

    public get_invalid_params_intersectors_on_POST_U<T extends IDistantVOBase>(u_vo_holder: DAOUpdateVOHolder<T>): FakeDataVO[] {

        let typed: DAOUpdateVOHolder<FakeDistantVO> = u_vo_holder as any as DAOUpdateVOHolder<FakeDistantVO>;

        if ((TypesHandler.getInstance().isSameMoment((typed.pre_update_vo as FakeDistantVO).date, (typed.post_update_vo as FakeDistantVO).date)) &&
            ((typed.pre_update_vo as FakeDistantVO).value == (typed.post_update_vo as FakeDistantVO).value)) {
            return null;
        }

        return [
            VarDataBaseVO.createNew(
                FakeDataVO.API_TYPE_ID,
                this.varConf.name,
                false,
                [RangeHandler.getInstance().getMaxNumRange()],
                [RangeHandler.getInstance().create_single_elt_TSRange((typed.pre_update_vo as FakeDistantVO).date, TimeSegment.TYPE_DAY)]
            ),
            VarDataBaseVO.createNew(
                FakeDataVO.API_TYPE_ID,
                this.varConf.name,
                false,
                [RangeHandler.getInstance().getMaxNumRange()],
                [RangeHandler.getInstance().create_single_elt_TSRange((typed.post_update_vo as FakeDistantVO).date, TimeSegment.TYPE_DAY)]
            )
        ];
    }

    protected getValue(varDAGNode: VarDAGNode): number {

        let res = 0;

        let datas: { [date_value: number]: FakeDistantVO } = varDAGNode.datasources[FakeDistantDatasourceController.getInstance().name];

        RangeHandler.getInstance().foreach_ranges_sync((varDAGNode.var_data as FakeDataVO).ts_ranges, (date: Moment) => {

            res += (datas && datas[date.valueOf()]) ? datas[date.valueOf()].value : 0;

        }, this.segment_type);
        return res;
    }
}
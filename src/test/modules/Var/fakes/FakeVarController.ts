import * as moment from 'moment';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import IDataSourceController from '../../../../shared/modules/DataSource/interfaces/IDataSourceController';
import VarDAG from '../../../../shared/modules/Var/graph/var/VarDAG';
import VarDAGNode from '../../../../shared/modules/Var/graph/var/VarDAGNode';
import IVarDataVOBase from '../../../../shared/modules/Var/interfaces/IVarDataVOBase';
import SimpleVarConfVO from '../../../../shared/modules/Var/simple_vars/SimpleVarConfVO';
import VarControllerBase from '../../../../shared/modules/Var/VarControllerBase';
import VarsController from '../../../../shared/modules/Var/VarsController';
import FakeDataVO from './vos/FakeDataVO';

export default class FakeVarController extends VarControllerBase<FakeDataVO> {

    public static VAR_NAME: string = 'FakeVarController';

    public static getInstance(): FakeVarController {
        if (!FakeVarController.instance) {
            FakeVarController.instance = new FakeVarController();
        }
        return FakeVarController.instance;
    }

    protected static instance: FakeVarController = null;

    public segment_type: number = TimeSegment.TYPE_DAY;

    protected constructor(conf: SimpleVarConfVO = null) {
        super(
            conf ? conf : {
                _type: SimpleVarConfVO.API_TYPE_ID,
                id: 1,
                var_data_vo_type: FakeDataVO.API_TYPE_ID,
                name: FakeVarController.VAR_NAME,
            } as SimpleVarConfVO);
    }

    public getVarsIdsDependencies(): number[] {
        return [];
    }


    /**
     * Returns the datasources this var depends on
     */
    public getDataSourcesDependencies(): Array<IDataSourceController<any>> {
        return [
        ];
    }

    /**
     * Fonction qui prépare la mise à jour d'une data
     */
    public updateData(varDAGNode: VarDAGNode, varDAG: VarDAG) {

        let param: FakeDataVO = varDAGNode.param as FakeDataVO;
        let res: FakeDataVO = Object.assign({
            value: 42,
            value_type: VarsController.VALUE_TYPE_COMPUTED,
            value_ts: moment(),
            missing_datas_infos: null
        }, param);

        return res;
    }


    /**
     * Returns the dataparam needed to updateData of the given param. Example : Week sum of worked hours needs worked hours of each day of the given week
     * @param BATCH_UID
     * @param param
     */
    public getParamDependencies(
        varDAGNode: VarDAGNode,
        varDAG: VarDAG): IVarDataVOBase[] {
        return null;
    }

    public getParamDependents(param: FakeDataVO): IVarDataVOBase[] {
        return null;
    }
}
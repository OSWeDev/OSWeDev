import IDataSourceController from '../../../../src/shared/modules/DataSource/interfaces/IDataSourceController';
import VarsCumulsController from '../../../../src/shared/modules/Var/cumuls/VarsCumulsController';
import VarDAG from '../../../../src/shared/modules/Var/graph/var/VarDAG';
import VarDAGNode from '../../../../src/shared/modules/Var/graph/var/VarDAGNode';
import IVarDataParamVOBase from '../../../../src/shared/modules/Var/interfaces/IVarDataParamVOBase';
import SimpleVarConfVO from '../../../../src/shared/modules/Var/simple_vars/SimpleVarConfVO';
import VarCumulableControllerBase from '../../../../src/shared/modules/Var/VarCumulableControllerBase';
import VarsController from '../../../../src/shared/modules/Var/VarsController';
import FakeDataParamController from './FakeDataParamController';
import FakeDataParamVO from './vos/FakeDataParamVO';
import FakeDataVO from './vos/FakeDataVO';
import VarControllerBase from '../../../../src/shared/modules/Var/VarControllerBase';
import moment = require('moment');
import TimeSegment from '../../../../src/shared/modules/DataRender/vos/TimeSegment';

export default class FakeVarController extends VarControllerBase<FakeDataVO, FakeDataParamVO> {

    public static VAR_NAME: string = 'FakeVarController';

    public static getInstance(): FakeVarController {
        if (!FakeVarController.instance) {
            FakeVarController.instance = new FakeVarController();
        }
        return FakeVarController.instance;
    }

    protected static instance: FakeVarController = null;

    public segment_type: number = TimeSegment.TYPE_DAY;

    protected constructor(conf: SimpleVarConfVO = null, controller: FakeDataParamController = null) {
        super(
            conf ? conf : {
                _type: SimpleVarConfVO.API_TYPE_ID,
                id: 1,
                var_data_vo_type: FakeDataVO.API_TYPE_ID,
                name: FakeVarController.VAR_NAME,
            } as SimpleVarConfVO,
            controller ? controller : FakeDataParamController.getInstance());
    }


    public getVarsIdsDependencies(): number[] {
        return [];
    }


    /**
     * Returns the datasources this var depends on
     */
    public getDataSourcesDependencies(): Array<IDataSourceController<any, any>> {
        return [
        ];
    }


    /**
     * Returns the dataparam needed to updateData of the given param. Example : Week sum of worked hours needs worked hours of each day of the given week
     * @param BATCH_UID
     * @param param
     */
    public async getParamDependencies(
        varDAGNode: VarDAGNode,
        varDAG: VarDAG): Promise<IVarDataParamVOBase[]> {
        return null;
    }


    /**
     * Fonction qui prépare la mise à jour d'une data
     */
    public async updateData(varDAGNode: VarDAGNode, varDAG: VarDAG) {

        let param: FakeDataParamVO = varDAGNode.param as FakeDataParamVO;
        let res: FakeDataVO = Object.assign({
            datafound: true,
            value: 42,
            value_type: VarsController.VALUE_TYPE_COMPUTED,
            value_ts: moment().format('YYYY-MM-DD'),
            missing_datas_infos: null
        }, param);

        return res;
    }
}
import * as moment from 'moment';
import { Moment } from 'moment';
import DateHandler from '../../../tools/DateHandler';
import VarDAG from '../graph/var/VarDAG';
import VarDAGNode from '../graph/var/VarDAGNode';
import ISimpleNumberVarData from '../interfaces/ISimpleNumberVarData';
import IVarDataParamVOBase from '../interfaces/IVarDataParamVOBase';
import IVarDataVOBase from '../interfaces/IVarDataVOBase';
import SimpleVarConfVO from '../simple_vars/SimpleVarConfVO';
import VarControllerBase from '../VarControllerBase';
import VarsController from '../VarsController';
import BinaryVarOperatorDataParamController from './BinaryVarOperatorDataParamController';
import BinaryVarOperatorsController from './BinaryVarOperatorsController';
import BinaryVarOperatorDataParamVO from './vos/BinaryVarOperatorDataParamVO';
import BinaryVarOperatorDataVO from './vos/BinaryVarOperatorDataVO';
import IDataSourceController from '../../DataSource/interfaces/IDataSourceController';

export default abstract class BinaryVarOperatorControllerBase<TDataLeft extends ISimpleNumberVarData, TDataRight extends ISimpleNumberVarData> extends VarControllerBase<BinaryVarOperatorDataVO, BinaryVarOperatorDataParamVO> {

    public constructor(
        protected left_var: VarControllerBase<TDataLeft, any>,
        protected operator_name: string,
        protected right_var: VarControllerBase<TDataRight, any>) {
        super({
            _type: SimpleVarConfVO.API_TYPE_ID,
            id: null,
            var_data_vo_type: BinaryVarOperatorDataVO.API_TYPE_ID,
            name: BinaryVarOperatorsController.getInstance().getName(left_var.varConf.name, operator_name, right_var.varConf.name),
        } as SimpleVarConfVO, BinaryVarOperatorDataParamController.getInstance());
    }

    public getDataSourcesDependencies(): Array<IDataSourceController<any, any>> {
        return [];
    }

    /**
     * Returns the var_ids that we depend upon (or might depend)
     */
    public getVarsIdsDependencies(): number[] {
        return [this.left_var.varConf.id, this.right_var.varConf.id];
    }

    /**
     * Returns the dataparam needed to updateData of the given param. Example : Week sum of worked hours needs worked hours of each day of the given week
     */
    public async getParamDependencies(
        varDAGNode: VarDAGNode,
        varDAG: VarDAG): Promise<IVarDataParamVOBase[]> {

        let param: BinaryVarOperatorDataParamVO = (varDAGNode.param as BinaryVarOperatorDataParamVO);

        return [VarsController.getInstance().getParam(param.left_var_param_index), VarsController.getInstance().getParam(param.right_var_param_index)];
    }

    public async updateData(varDAGNode: VarDAGNode, varDAG: VarDAG) {

        let param: BinaryVarOperatorDataParamVO = varDAGNode.param as BinaryVarOperatorDataParamVO;
        let index: string = VarsController.getInstance().getIndex(param);

        // Si importé, on renvoie la valeur importée, sinon on fait le calcul
        if (VarsController.getInstance().varDAG.nodes[index].hasMarker(VarDAG.VARDAG_MARKER_IMPORTED_DATA)) {

            VarsController.getInstance().setVarData(VarsController.getInstance().varDAG.nodes[index].imported, true);
            return;
        }

        let res: BinaryVarOperatorDataVO = Object.assign(new BinaryVarOperatorDataVO(), param);
        res.types_info = [];
        res.var_id = this.varConf.id;

        let data_left: TDataLeft = VarsController.getInstance().getVarData(VarsController.getInstance().getParam(param.left_var_param_index), true);
        let data_right: TDataRight = VarsController.getInstance().getVarData(VarsController.getInstance().getParam(param.right_var_param_index), true);

        res.value = this.calc_value(data_left, data_right);
        if (res.value == null) {
            res.types_info.push(BinaryVarOperatorDataVO.TYPE_INFO_NODATA);
        }

        VarsController.getInstance().setVarData(res, true);
    }

    protected abstract calc_value(left_data: TDataLeft, right_data: TDataRight): number;
}
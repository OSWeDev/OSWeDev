import { isString } from 'util';
import IVarDataParamVOBase from '../../interfaces/IVarDataParamVOBase';
import VarDataParamControllerBase from '../../VarDataParamControllerBase';
import VarsController from '../../VarsController';
import BinaryVarOperatorDataParamVO from './vos/BinaryVarOperatorDataParamVO';

export default class BinaryVarOperatorDataParamController extends VarDataParamControllerBase<BinaryVarOperatorDataParamVO> {

    public static getInstance() {
        if (!BinaryVarOperatorDataParamController.instance) {
            BinaryVarOperatorDataParamController.instance = new BinaryVarOperatorDataParamController();
        }

        return BinaryVarOperatorDataParamController.instance;
    }

    private static instance: BinaryVarOperatorDataParamController = null;

    protected constructor() {
        super();
    }

    public getParamFromIndexes(var_name_or_id: string | number, left_var_param_index: string, right_var_param_index: string): BinaryVarOperatorDataParamVO {

        let res: BinaryVarOperatorDataParamVO = new BinaryVarOperatorDataParamVO();

        res.var_id = (isString(var_name_or_id) ? VarsController.getInstance().getVarConf(var_name_or_id).id : var_name_or_id);
        res.left_var_param_index = left_var_param_index;
        res.right_var_param_index = right_var_param_index;
        return res;
    }

    public getParamFromParams(var_name_or_id: string | number, left_var_param: IVarDataParamVOBase, right_var_param: IVarDataParamVOBase): BinaryVarOperatorDataParamVO {

        return this.getParamFromIndexes(var_name_or_id, VarsController.getInstance().getIndex(left_var_param), VarsController.getInstance().getIndex(right_var_param));
    }

    public getImpactedParamsList(paramUpdated: BinaryVarOperatorDataParamVO, paramsRegisteredByIndex: { [index: string]: BinaryVarOperatorDataParamVO }): BinaryVarOperatorDataParamVO[] {
        return null;
    }

    public getIndex(param: BinaryVarOperatorDataParamVO): string {
        let res: string = "";

        res += param.var_id;

        res += "_" + (param.left_var_param_index ? param.left_var_param_index : "");
        res += "_" + (param.right_var_param_index ? param.right_var_param_index : "");

        return res;
    }

    // public getParam(param_index: string): BinaryVarOperatorDataParamVO {
    //     let res: BinaryVarOperatorDataParamVO = new BinaryVarOperatorDataParamVO();

    //     try {
    //         res.var_id = parseInt(param_index.replace(/^([^_]+)_([^_]*)_([^_]*)$/, '$1'));
    //         res.left_var_param_index = param_index.replace(/^([^_]+)_([^_]*)_([^_]*)$/, '$2');
    //         res.right_var_param_index = param_index.replace(/^([^_]+)_([^_]*)_([^_]*)$/, '$3');

    //         return res;
    //     } catch (error) {
    //     }

    //     return null;
    // }

    // protected compareParams(paramA: BinaryVarOperatorDataParamVO, paramB: BinaryVarOperatorDataParamVO) {

    //     if ((!paramA) || (!paramB)) {
    //         return null;
    //     }

    //     let operator_diff: number = paramA.var_id - paramB.var_id;

    //     if (operator_diff) {
    //         return operator_diff;
    //     }

    //     if (paramA.left_var_param_index < paramB.left_var_param_index) {
    //         return -1;
    //     }

    //     if (paramA.left_var_param_index > paramB.left_var_param_index) {
    //         return 1;
    //     }

    //     if (paramA.right_var_param_index < paramB.right_var_param_index) {
    //         return -1;
    //     }

    //     if (paramA.right_var_param_index > paramB.right_var_param_index) {
    //         return 1;
    //     }

    //     return 0;
    // }
}
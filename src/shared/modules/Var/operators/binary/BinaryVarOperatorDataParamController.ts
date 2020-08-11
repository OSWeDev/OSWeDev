import TypesHandler from '../../../../tools/TypesHandler';
import IVarDataParamVOBase from '../../interfaces/IVarDataParamVOBase';
import VarDataParamControllerBase from '../../VarDataParamControllerBase';
import VarsController from '../../VarsController';
import BinaryVarOperatorDataParamVO from './vos/BinaryVarOperatorDataParamVO';
import BinaryVarOperatorDataVO from './vos/BinaryVarOperatorDataVO';

export default class BinaryVarOperatorDataParamController extends VarDataParamControllerBase<BinaryVarOperatorDataVO, BinaryVarOperatorDataParamVO> {

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

    public cloneParam(param: BinaryVarOperatorDataParamVO): BinaryVarOperatorDataParamVO {
        let res: BinaryVarOperatorDataParamVO = new BinaryVarOperatorDataParamVO();

        res.var_id = param.var_id;
        res.left_var_param_index = param.left_var_param_index;
        res.right_var_param_index = param.right_var_param_index;

        return res;
    }


    public getParamFromIndexes(var_name_or_id: string | number, left_var_param_index: string, right_var_param_index: string): BinaryVarOperatorDataParamVO {

        let res: BinaryVarOperatorDataParamVO = new BinaryVarOperatorDataParamVO();

        res.var_id = (TypesHandler.getInstance().isString(var_name_or_id) ? VarsController.getInstance().getVarConf(var_name_or_id as string).id : var_name_or_id as number);
        res.left_var_param_index = left_var_param_index;
        res.right_var_param_index = right_var_param_index;
        return res;
    }

    public getParamFromParams(var_name_or_id: string | number, left_var_param: IVarDataParamVOBase, right_var_param: IVarDataParamVOBase): BinaryVarOperatorDataParamVO {

        return this.getParamFromIndexes(var_name_or_id, VarsController.getInstance().getIndex(left_var_param), VarsController.getInstance().getIndex(right_var_param));
    }

    public getIndex(param: BinaryVarOperatorDataParamVO): string {
        let res: string = "";

        res += param.var_id;

        res += "_" + (param.left_var_param_index ? param.left_var_param_index : "");
        res += "_" + (param.right_var_param_index ? param.right_var_param_index : "");

        return res;
    }
}
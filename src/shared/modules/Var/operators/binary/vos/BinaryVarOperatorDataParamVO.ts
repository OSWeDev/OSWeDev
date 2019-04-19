import IVarDataParamVOBase from '../../../interfaces/IVarDataParamVOBase';

export default class BinaryVarOperatorDataParamVO implements IVarDataParamVOBase {

    public static API_TYPE_ID: string = "binary_var_operator_param";

    public id: number;
    public _type: string = BinaryVarOperatorDataParamVO.API_TYPE_ID;

    public var_id: number;
    public json_params: string;

    public left_var_param_index: string;
    public right_var_param_index: string;
}
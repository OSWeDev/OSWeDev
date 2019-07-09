import ISimpleNumberVarData from '../../../interfaces/ISimpleNumberVarData';
import VarControllerBase from '../../../VarControllerBase';
import BinaryVarOperatorControllerBase from '../BinaryVarOperatorControllerBase';
import IVarDataParamVOBase from '../../../interfaces/IVarDataParamVOBase';
import VarDataParamControllerBase from '../../../VarDataParamControllerBase';

export default class DivVarController<
    TDataLeft extends ISimpleNumberVarData & TDataParamLeft,
    TDataParamLeft extends IVarDataParamVOBase,
    TDataRight extends ISimpleNumberVarData & TDataParamRight,
    TDataParamRight extends IVarDataParamVOBase,
    TData extends ISimpleNumberVarData & TDataParam,
    TDataParam extends IVarDataParamVOBase
    > extends BinaryVarOperatorControllerBase<TDataLeft, TDataParamLeft, TDataRight, TDataParamRight, TData, TDataParam> {

    public static OPERATOR_NAME: string = "div";

    public constructor(
        left_var: VarControllerBase<TDataLeft, any>,
        right_var: VarControllerBase<TDataRight, any>,
        var_data_api_type_id: string,
        varDataConstructor: () => TData,
        data_param_controller: VarDataParamControllerBase<TData, TDataParam>) {
        super(left_var, DivVarController.OPERATOR_NAME, right_var, var_data_api_type_id, varDataConstructor, data_param_controller);
    }

    protected calc_value(left_data: TDataLeft, right_data: TDataRight): number {

        try {

            if (!right_data.value) {
                return null;
            }

            let res = left_data.value / right_data.value;

            if (isNaN(res)) {
                return null;
            }

            return res;
        } catch (error) {
        }

        return null;
    }
}
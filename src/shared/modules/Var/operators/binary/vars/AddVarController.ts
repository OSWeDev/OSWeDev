import ConsoleHandler from '../../../../../tools/ConsoleHandler';
import ISimpleNumberVarData from '../../../interfaces/ISimpleNumberVarData';
import IVarDataParamVOBase from '../../../interfaces/IVarDataParamVOBase';
import VarControllerBase from '../../../VarControllerBase';
import VarDataParamControllerBase from '../../../VarDataParamControllerBase';
import BinaryVarOperatorControllerBase from '../BinaryVarOperatorControllerBase';

export default class AddVarController<
    TDataLeft extends ISimpleNumberVarData & TDataParamLeft,
    TDataParamLeft extends IVarDataParamVOBase,
    TDataRight extends ISimpleNumberVarData & TDataParamRight,
    TDataParamRight extends IVarDataParamVOBase,
    TData extends ISimpleNumberVarData & TDataParam,
    TDataParam extends IVarDataParamVOBase
    > extends BinaryVarOperatorControllerBase<TDataLeft, TDataParamLeft, TDataRight, TDataParamRight, TData, TDataParam> {

    public static OPERATOR_NAME: string = "add";

    public constructor(
        left_var: VarControllerBase<TDataLeft, any>,
        right_var: VarControllerBase<TDataRight, any>,
        var_data_api_type_id: string,
        varDataConstructor: () => TData,
        data_param_controller: VarDataParamControllerBase<TData, TDataParam>) {
        super(left_var, AddVarController.OPERATOR_NAME, right_var, var_data_api_type_id, varDataConstructor, data_param_controller);
    }

    protected calc_value(left_data: TDataLeft, right_data: TDataRight): number {

        try {

            let a = left_data.value;
            if (!a) {
                a = 0;
            }

            let b = left_data.value;
            if (!b) {
                b = 0;
            }

            let res = a + b;

            if (isNaN(res)) {
                return null;
            }

            return res;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return null;
    }
}
import ConsoleHandler from '../../../../../tools/ConsoleHandler';
import IVarDataVOBase from '../../../interfaces/IVarDataVOBase';
import VarControllerBase from '../../../VarControllerBase';
import BinaryVarOperatorControllerBase from '../BinaryVarOperatorControllerBase';

export default class DivVarController<
    TDataLeft extends IVarDataVOBase,
    TDataRight extends IVarDataVOBase,
    TData extends IVarDataVOBase> extends BinaryVarOperatorControllerBase<TDataLeft, TDataRight, TData> {

    public static OPERATOR_NAME: string = "div";

    public constructor(
        left_var: VarControllerBase<TDataLeft>,
        right_var: VarControllerBase<TDataRight>,
        var_data_api_type_id: string,
        varDataConstructor: () => TData) {
        super(left_var, DivVarController.OPERATOR_NAME, right_var, var_data_api_type_id, varDataConstructor);
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
            ConsoleHandler.getInstance().error(error);
        }

        return null;
    }
}
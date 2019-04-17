import ISimpleNumberVarData from '../../interfaces/ISimpleNumberVarData';
import VarControllerBase from '../../VarControllerBase';
import BinaryVarOperatorControllerBase from '../BinaryVarOperatorControllerBase';

export default class DivVarController<TDataLeft extends ISimpleNumberVarData, TDataRight extends ISimpleNumberVarData> extends BinaryVarOperatorControllerBase<TDataLeft, TDataRight> {

    public static OPERATOR_NAME: string = "div";

    public constructor(
        protected left_var: VarControllerBase<TDataLeft, any>,
        protected right_var: VarControllerBase<TDataRight, any>) {
        super(left_var, DivVarController.OPERATOR_NAME, right_var);
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
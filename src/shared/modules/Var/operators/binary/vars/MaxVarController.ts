import ISimpleNumberVarData from '../../../interfaces/ISimpleNumberVarData';
import VarControllerBase from '../../../VarControllerBase';
import BinaryVarOperatorControllerBase from '../BinaryVarOperatorControllerBase';

export default class MaxVarController<TDataLeft extends ISimpleNumberVarData, TDataRight extends ISimpleNumberVarData> extends BinaryVarOperatorControllerBase<TDataLeft, TDataRight> {

    public static OPERATOR_NAME: string = "max";

    public constructor(
        protected left_var: VarControllerBase<TDataLeft, any>,
        protected right_var: VarControllerBase<TDataRight, any>) {
        super(left_var, MaxVarController.OPERATOR_NAME, right_var);
    }

    protected calc_value(left_data: TDataLeft, right_data: TDataRight): number {

        try {

            let res = Math.max(left_data.value, right_data.value);

            if (isNaN(res)) {
                return null;
            }

            return res;
        } catch (error) {
        }

        return null;
    }
}
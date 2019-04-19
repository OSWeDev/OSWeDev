import ISimpleNumberVarData from '../../../interfaces/ISimpleNumberVarData';
import VarControllerBase from '../../../VarControllerBase';
import BinaryVarOperatorControllerBase from '../BinaryVarOperatorControllerBase';

export default class SubVarController<TDataLeft extends ISimpleNumberVarData, TDataRight extends ISimpleNumberVarData> extends BinaryVarOperatorControllerBase<TDataLeft, TDataRight> {

    public static OPERATOR_NAME: string = "sub";

    public constructor(
        protected left_var: VarControllerBase<TDataLeft, any>,
        protected right_var: VarControllerBase<TDataRight, any>) {
        super(left_var, SubVarController.OPERATOR_NAME, right_var);
    }

    protected calc_value(left_data: TDataLeft, right_data: TDataRight): number {

        try {

            let res = left_data.value - right_data.value;

            if (isNaN(res)) {
                return null;
            }

            return res;
        } catch (error) {
        }

        return null;
    }
}
import BinaryVarOperatorDataParamVO from './BinaryVarOperatorDataParamVO';
import ISimpleNumberVarData from '../../../interfaces/ISimpleNumberVarData';

export default class BinaryVarOperatorDataVO extends BinaryVarOperatorDataParamVO implements ISimpleNumberVarData {

    public static API_TYPE_ID: string = "binary_var_operator_data";

    public _type: string = BinaryVarOperatorDataVO.API_TYPE_ID;
    public datafound: boolean;

    public value: number;

    public value_type: number;
    public value_ts: string;
}
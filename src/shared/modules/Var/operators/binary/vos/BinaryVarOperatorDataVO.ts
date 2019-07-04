import BinaryVarOperatorDataParamVO from './BinaryVarOperatorDataParamVO';
import ISimpleNumberVarData from '../../../interfaces/ISimpleNumberVarData';
import { Moment } from 'moment';

export default class BinaryVarOperatorDataVO extends BinaryVarOperatorDataParamVO implements ISimpleNumberVarData {

    public static API_TYPE_ID: string = "binary_var_operator_data";

    public _type: string = BinaryVarOperatorDataVO.API_TYPE_ID;
    public datafound: boolean;

    public value: number;

    public value_type: number;
    public value_ts: Moment;
    public missing_datas_infos: string[];
}
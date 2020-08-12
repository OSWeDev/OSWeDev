import { Moment } from 'moment';
import IVarDataVOBase from '../../../interfaces/IVarDataVOBase';
import BinaryVarOperatorDataParamVO from './BinaryVarOperatorDataParamVO';

export default class BinaryVarOperatorDataVO extends BinaryVarOperatorDataParamVO implements IVarDataVOBase {

    public static API_TYPE_ID: string = "binary_var_operator_data";

    public _type: string = BinaryVarOperatorDataVO.API_TYPE_ID;

    public value: number;

    public value_type: number;
    public value_ts: Moment;
    public missing_datas_infos: string[];
}
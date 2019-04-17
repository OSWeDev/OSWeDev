import BinaryVarOperatorDataParamVO from './BinaryVarOperatorDataParamVO';
import ISimpleNumberVarData from '../../interfaces/ISimpleNumberVarData';

export default class BinaryVarOperatorDataVO extends BinaryVarOperatorDataParamVO implements ISimpleNumberVarData {

    public static API_TYPE_ID: string = "binary_var_operator_data";

    public static TYPE_INFO_LABELS: string[] = [
        'var_data.type_info.default',
        'var_data.type_info.import',
        'var_data.type_info.nodata'];
    public static TYPE_INFO_DEFAULT: number = 0;
    public static TYPE_INFO_IMPORT: number = 1;
    public static TYPE_INFO_NODATA: number = 2;

    public _type: string = BinaryVarOperatorDataVO.API_TYPE_ID;
    public datafound: boolean;
    public types_info: number[];

    public value: number;
}
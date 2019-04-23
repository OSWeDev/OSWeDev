import NumberDatasourceFieldDataParamVO from './NumberDatasourceFieldDataParamVO';
import ISimpleNumberVarData from '../../interfaces/ISimpleNumberVarData';

export default class NumberDatasourceFieldDataVO extends NumberDatasourceFieldDataParamVO implements ISimpleNumberVarData {

    public static API_TYPE_ID: string = "number_datasource_field_data";

    public static TYPE_INFO_LABELS: string[] = [
        'var_data.type_info.default',
        'var_data.type_info.nodata'];
    public static TYPE_INFO_DEFAULT: number = 0;
    public static TYPE_INFO_NODATA: number = 2;

    public _type: string = NumberDatasourceFieldDataVO.API_TYPE_ID;
    public datafound: boolean;
    public types_info: number[];

    public value: number;
}
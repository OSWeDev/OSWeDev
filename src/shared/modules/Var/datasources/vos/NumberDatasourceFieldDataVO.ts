
import VarDataBaseVO from '../../vos/VarDataBaseVO';

export default class NumberDatasourceFieldDataVO extends VarDataBaseVO {

    public static API_TYPE_ID: string = "number_datasource_field_data";

    public _type: string = NumberDatasourceFieldDataVO.API_TYPE_ID;

    public value: number;

    public value_type: number;
    public value_ts: number;
}
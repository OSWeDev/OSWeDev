import NumberDatasourceFieldDataParamVO from './NumberDatasourceFieldDataParamVO';
import ISimpleNumberVarData from '../../interfaces/ISimpleNumberVarData';
import { Moment } from 'moment';

export default class NumberDatasourceFieldDataVO extends NumberDatasourceFieldDataParamVO implements ISimpleNumberVarData {

    public static API_TYPE_ID: string = "number_datasource_field_data";

    public _type: string = NumberDatasourceFieldDataVO.API_TYPE_ID;
    public datafound: boolean;

    public value: number;

    public value_type: number;
    public value_ts: Moment;
    public missing_datas_infos: string[];
}
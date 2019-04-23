import IVarDataParamVOBase from '../../interfaces/IVarDataParamVOBase';

export default class NumberDatasourceFieldDataParamVO implements IVarDataParamVOBase {

    public static API_TYPE_ID: string = "number_datasource_field_param";

    public id: number;
    public _type: string = NumberDatasourceFieldDataParamVO.API_TYPE_ID;

    public var_id: number;
    public json_params: string;


}
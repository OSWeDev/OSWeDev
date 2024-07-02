import IDistantVOBase from '../../IDistantVOBase';

export default class VarConfAutoParamFieldVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "var_conf_auto_param_field";

    public id: number;
    public _type: string = VarConfAutoParamFieldVO.API_TYPE_ID;

    public api_type_id: string;
    public field_name: string;

}
import ISimpleNumberVarData from '../interfaces/ISimpleNumberVarData';

export default class SimpleNumberVarDataVO implements ISimpleNumberVarData {

    public static API_TYPE_ID: string = "simple_number_var_data";

    public _type: string = SimpleNumberVarDataVO.API_TYPE_ID;

    public id: number;

    public var_id: number;

    public typesInfo: number[];
    public value: number;

    public json_params: string;
}
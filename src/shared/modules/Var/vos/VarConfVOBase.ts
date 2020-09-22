import INamedVO from '../../../interfaces/INamedVO';

export default class VarConfVOBase implements INamedVO {

    public static API_TYPE_ID: string = "simple_var_conf";

    public id: number;

    public _type: string = VarConfVOBase.API_TYPE_ID;
    public name: string;

    public var_data_vo_type: string;
}
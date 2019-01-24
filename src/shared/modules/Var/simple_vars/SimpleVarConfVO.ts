import VarConfVOBase from '../vos/VarConfVOBase';

export default class SimpleVarConfVO extends VarConfVOBase {

    public static API_TYPE_ID: string = "simple_var_conf";

    public _type: string = SimpleVarConfVO.API_TYPE_ID;
}
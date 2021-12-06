import VarDataBaseVO from "../../../../shared/modules/Var/vos/VarDataBaseVO";

export default class NotifVardatasParam {
    public constructor(public var_datas: VarDataBaseVO[], public is_computing: boolean = false) { }
}
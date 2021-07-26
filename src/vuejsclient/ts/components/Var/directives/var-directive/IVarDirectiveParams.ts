import VarDataBaseVO from "../../../../../../shared/modules/Var/vos/VarDataBaseVO";

export default interface IVarDirectiveParams {
    var_param: VarDataBaseVO;
    reload_on_register?: boolean;
    on_every_update?: (varData: VarDataBaseVO, el?, binding?, vnode?) => void;
    on_update_once?: (varData: VarDataBaseVO, el?, binding?, vnode?) => void;
    already_register?: boolean;
    ignore_unvalidated_datas?: boolean;
}
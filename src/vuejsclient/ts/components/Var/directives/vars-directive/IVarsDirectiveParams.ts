import VarDataBaseVO from "../../../../../../shared/modules/Var/vos/VarDataBaseVO";
import VarDataValueResVO from "../../../../../../shared/modules/Var/vos/VarDataValueResVO";

export default interface IVarDirectiveParams {
    var_params: VarDataBaseVO[];
    reload_on_register?: boolean;
    on_every_update?: (varDatas: VarDataBaseVO[] | VarDataValueResVO[], el?, binding?, vnode?) => Promise<void>;
    on_update_once?: (varDatas: VarDataBaseVO[] | VarDataValueResVO[], el?, binding?, vnode?) => Promise<void>;
    ignore_unvalidated_datas?: boolean;
}
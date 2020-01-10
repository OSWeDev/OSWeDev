import IVarDataParamVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataParamVOBase';
import IVarDataVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataVOBase';

export default interface IVarDirectiveParams {
    var_param: IVarDataParamVOBase;
    reload_on_register?: boolean;
    on_every_update?: (varData: IVarDataVOBase, el?, binding?, vnode?) => void;
    on_update_once?: (varData: IVarDataVOBase, el?, binding?, vnode?) => void;
    already_register?: boolean;
    ignore_unvalidated_datas?: boolean;
}
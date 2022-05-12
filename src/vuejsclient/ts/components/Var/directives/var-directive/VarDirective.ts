import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import VarUpdateCallback from '../../../../../../shared/modules/Var/vos/VarUpdateCallback';
import VarsClientController from '../../VarsClientController';

/**
 * Format des params :
 *  - var_param : VarDataBaseVO
 *  - reload_on_register : boolean
 *  - on_every_update: (varData: VarDataBaseVO) => void
 *  - on_update_once: (varData: VarDataBaseVO) => void
 */
export default class VarDirective {


    public static getInstance(): VarDirective {
        if (!VarDirective.instance) {
            VarDirective.instance = new VarDirective();
        }

        return VarDirective.instance;
    }

    private static instance: VarDirective = null;

    private callbacks: { [var_index: string]: { [cb_uid: number]: VarUpdateCallback } } = {};

    private constructor() {
    }

    public async bind(el, binding, vnode) {

        if (!binding || !binding.value) {
            return;
        }

        let var_param: VarDataBaseVO = binding.value.var_param;

        if (!var_param) {
            return;
        }

        VarDirective.getInstance().callbacks[var_param.index] = VarDirective.getInstance().getVarUpdateCallbacks(el, binding, vnode);

        await VarsClientController.getInstance().registerParams([var_param], VarDirective.getInstance().callbacks[var_param.index]);
    }

    public async unbind(el, binding, vnode) {

        if (!binding || !binding.value) {
            return;
        }

        let var_param: VarDataBaseVO = binding.value.var_param;

        if (!var_param) {
            return;
        }

        await VarsClientController.getInstance().unRegisterParams([var_param], VarDirective.getInstance().callbacks[var_param.index]);
    }

    private getVarUpdateCallbacks(el, binding, vnode): { [cb_uid: number]: VarUpdateCallback } {

        let on_every_update: (varData: VarDataBaseVO | VarDataValueResVO, el, binding, vnode) => Promise<void> = binding.value.on_every_update ? binding.value.on_every_update : null;
        let on_update_once: (varData: VarDataBaseVO | VarDataValueResVO, el, binding, vnode) => Promise<void> = binding.value.on_update_once ? binding.value.on_update_once : null;

        let varUpdateCallbacks: { [cb_uid: number]: VarUpdateCallback } = {};

        if (!!on_every_update) {
            let on_every_update_callback = VarUpdateCallback.newCallbackEvery(async (varData: VarDataBaseVO | VarDataValueResVO) => {
                await on_every_update(varData, el, binding, vnode);
            }, VarUpdateCallback.VALUE_TYPE_VALID);
            varUpdateCallbacks[VarsClientController.get_CB_UID()] = on_every_update_callback;
        }
        if (!!on_update_once) {
            let on_update_once_callback = VarUpdateCallback.newCallbackEvery(async (varData: VarDataBaseVO | VarDataValueResVO) => {
                await on_update_once(varData, el, binding, vnode);
            }, VarUpdateCallback.VALUE_TYPE_VALID);
            varUpdateCallbacks[VarsClientController.get_CB_UID()] = on_update_once_callback;
        }

        return varUpdateCallbacks;
    }
}
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
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

    private callbacks: { [var_index: string]: VarUpdateCallback[] } = {};

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

        this.callbacks[var_param.index] = VarDirective.getInstance().getVarUpdateCallbacks(el, binding, vnode);

        VarsClientController.getInstance().registerParams([var_param], this.callbacks[var_param.index]);
    }

    public async unbind(el, binding, vnode) {

        if (!binding || !binding.value) {
            return;
        }

        let var_param: VarDataBaseVO = binding.value.var_param;

        if (!var_param) {
            return;
        }

        VarsClientController.getInstance().unRegisterParams([var_param], this.callbacks[var_param.index]);
    }

    private getVarUpdateCallbacks(el, binding, vnode): VarUpdateCallback[] {

        let on_every_update: (varData: VarDataBaseVO, el, binding, vnode) => Promise<void> = binding.value.on_every_update ? binding.value.on_every_update : null;
        let on_update_once: (varData: VarDataBaseVO, el, binding, vnode) => Promise<void> = binding.value.on_update_once ? binding.value.on_update_once : null;

        let varUpdateCallbacks: VarUpdateCallback[] = [];

        if (!!on_every_update) {
            let on_every_update_callback = VarUpdateCallback.newCallbackEvery(async (varData: VarDataBaseVO) => {
                await on_every_update(varData, el, binding, vnode);
            });
            varUpdateCallbacks.push(on_every_update_callback);
        }
        if (!!on_update_once) {
            let on_update_once_callback = VarUpdateCallback.newCallbackEvery(async (varData: VarDataBaseVO) => {
                await on_update_once(varData, el, binding, vnode);
            });
            varUpdateCallbacks.push(on_update_once_callback);
        }

        return varUpdateCallbacks;
    }
}
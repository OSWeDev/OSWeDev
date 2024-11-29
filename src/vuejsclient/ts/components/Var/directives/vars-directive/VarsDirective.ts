import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import VarUpdateCallback from '../../../../../../shared/modules/Var/vos/VarUpdateCallback';
import VarsClientController from '../../VarsClientController';
import IVarDirectiveParams from './IVarsDirectiveParams';

/**
 * Format des params :
 *  - var_param : VarDataBaseVO
 *  - reload_on_register : boolean
 *  - on_every_update: (varData: VarDataBaseVO) => void
 *  - on_update_once: (varData: VarDataBaseVO) => void
 */
export default class VarsDirective {


    // istanbul ignore next: nothing to test
    public static getInstance(): VarsDirective {
        if (!VarsDirective.instance) {
            VarsDirective.instance = new VarsDirective();
        }

        return VarsDirective.instance;
    }

    private static instance: VarsDirective = null;

    private callbacks: { [var_index: string]: { [cb_uid: number]: VarUpdateCallback } } = {};

    private constructor() {
    }

    public bind(el, binding, vnode) {

        if (!binding || !binding.value) {
            return;
        }

        const value = binding.value as IVarDirectiveParams;
        const var_params: VarDataBaseVO[] = value.var_params;

        if ((!var_params) || (!var_params.length)) {
            return;
        }

        for (const i in var_params) {
            const var_param = var_params[i];

            if (!var_param) {
                continue;
            }

            VarsDirective.getInstance().callbacks[var_param.index] = VarsDirective.getInstance().getVarUpdateCallbacks(el, binding, vnode);

            VarsClientController.getInstance().registerParams([var_param], VarsDirective.getInstance().callbacks[var_param.index]);
        }
    }

    public unbind(el, binding, vnode) {

        if (!binding || !binding.value) {
            return;
        }

        const value = binding.value as IVarDirectiveParams;
        const var_params: VarDataBaseVO[] = value.var_params;

        if ((!var_params) || (!var_params.length)) {
            return;
        }

        for (const i in var_params) {
            const var_param = var_params[i];

            if (!var_param) {
                continue;
            }

            VarsDirective.getInstance().callbacks[var_param.index] = VarsDirective.getInstance().getVarUpdateCallbacks(el, binding, vnode);

            VarsClientController.getInstance().unRegisterParams([var_param], VarsDirective.getInstance().callbacks[var_param.index]);
        }
    }

    private getVarUpdateCallbacks(el, binding, vnode): { [cb_uid: number]: VarUpdateCallback } {

        const value = binding.value as IVarDirectiveParams;
        const on_every_update: (varDatas: VarDataBaseVO[] | VarDataValueResVO[], el?, binding?, vnode?) => Promise<void> = value.on_every_update ? value.on_every_update : null;
        const on_update_once: (varDatas: VarDataBaseVO[] | VarDataValueResVO[], el?, binding?, vnode?) => Promise<void> = value.on_update_once ? value.on_update_once : null;

        const varUpdateCallbacks: { [cb_uid: number]: VarUpdateCallback } = {};

        if (on_every_update) {
            const on_every_update_callback = VarUpdateCallback.newCallbackEvery(async (varData: VarDataBaseVO | VarDataValueResVO) => {

                const varDatas = [];
                let has_valid_value = true;
                for (const i in value.var_params) {
                    const var_param = value.var_params[i].index;
                    const var_data = VarsClientController.cached_var_datas[var_param];

                    if ((!var_data) || (typeof var_data.value === 'undefined')) {
                        has_valid_value = false;
                        break;
                    }

                    varDatas.push(var_data);
                }

                if (has_valid_value) {
                    await on_every_update(varDatas, el, binding, vnode);
                }
            }, VarUpdateCallback.VALUE_TYPE_VALID);
            varUpdateCallbacks[VarsClientController.get_CB_UID()] = on_every_update_callback;
        }
        if (on_update_once) {
            const on_update_once_callback = VarUpdateCallback.newCallbackEvery(async (varData: VarDataBaseVO | VarDataValueResVO) => {

                const varDatas = [];
                let has_valid_value = true;
                for (const i in value.var_params) {
                    const var_param = value.var_params[i].index;
                    const var_data = VarsClientController.cached_var_datas[var_param];

                    if ((!var_data) || (typeof var_data.value === 'undefined')) {
                        has_valid_value = false;
                        break;
                    }

                    varDatas.push(var_data);
                }

                if (has_valid_value) {
                    await on_update_once(varDatas, el, binding, vnode);
                }
            }, VarUpdateCallback.VALUE_TYPE_VALID);
            varUpdateCallbacks[VarsClientController.get_CB_UID()] = on_update_once_callback;
        }

        return varUpdateCallbacks;
    }
}
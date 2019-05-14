import IVarDataParamVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataParamVOBase';
import IVarDataVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataVOBase';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarUpdateCallback from '../../../../../../shared/modules/Var/vos/VarUpdateCallback';

/**
 * Format des params :
 *  - var_param : IVarDataParamVOBase
 *  - reload_on_register : boolean
 *  - on_every_update: (varData: IVarDataVOBase) => void
 *  - on_update_once: (varData: IVarDataVOBase) => void
 */
export default class VarDirective {


    public static getInstance(): VarDirective {
        if (!VarDirective.instance) {
            VarDirective.instance = new VarDirective();
        }

        return VarDirective.instance;
    }

    private static instance: VarDirective = null;

    private constructor() {
    }

    public async bind(el, binding, vnode) {

        let var_param: IVarDataParamVOBase = binding.value.var_param;
        let reload_on_register: boolean = binding.value.reload_on_register ? binding.value.reload_on_register : false;

        if (!var_param) {
            return;
        }

        let varUpdateCallbacks: VarUpdateCallback[] = VarDirective.getInstance().getVarUpdateCallbacks(el, binding, vnode, var_param);

        VarsController.getInstance().registerDataParam(var_param, reload_on_register, varUpdateCallbacks);
    }

    public async unbind(el, binding, vnode) {

        let var_param: IVarDataParamVOBase = binding.value.var_param;

        if (!var_param) {
            return;
        }

        VarsController.getInstance().unregisterCallbacks(var_param, VarDirective.getInstance().getVarUpdateCallbackUIDs(binding));
    }

    private getVarUpdateCallbacks(el, binding, vnode, var_param: IVarDataParamVOBase): VarUpdateCallback[] {
        let param_index: string = VarsController.getInstance().getIndex(var_param);

        let on_every_update: (varData: IVarDataVOBase, el, binding, vnode) => void = binding.value.on_every_update ? binding.value.on_every_update : null;
        let on_update_once: (varData: IVarDataVOBase, el, binding, vnode) => void = binding.value.on_update_once ? binding.value.on_update_once : null;

        let varUpdateCallbacks: VarUpdateCallback[] = [];

        if (!!on_every_update) {
            let on_every_update_callback = VarUpdateCallback.newCallbackEvery(param_index, (varData: IVarDataVOBase) => {
                on_every_update(varData, el, binding, vnode);
            });
            binding.value.on_every_update_uid = on_every_update_callback.UID;
            varUpdateCallbacks.push(on_every_update_callback);
        }
        if (!!on_update_once) {
            let on_update_once_callback = VarUpdateCallback.newCallbackEvery(param_index, (varData: IVarDataVOBase) => {
                on_update_once(varData, el, binding, vnode);
            });
            binding.value.on_update_once_uid = on_update_once_callback.UID;
            varUpdateCallbacks.push(on_update_once_callback);
        }

        return varUpdateCallbacks;
    }

    private getVarUpdateCallbackUIDs(binding): number[] {

        let res: number[] = [];

        if (!binding.value) {
            return null;
        }

        if (!!binding.value.on_every_update_uid) {
            res.push(binding.value.on_every_update_uid);
        }
        if (!!binding.value.on_update_once_uid) {
            res.push(binding.value.on_update_once_uid);
        }

        return res;
    }
}
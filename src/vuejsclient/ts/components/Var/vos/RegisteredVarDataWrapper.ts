import VarDataBaseVO from '../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarUpdateCallback from '../../../../../shared/modules/Var/vos/VarUpdateCallback';
import VarsClientController from '../VarsClientController';

/**
 * Stock les callbacks à appeler pour le var param en question
 */
export default class RegisteredVarDataWrapper {

    public nb_registrations: number = 1;
    public callbacks: { [cb_uid: number]: VarUpdateCallback } = {};

    /**
     * Créé une instance de {@link RegisteredVarDataWrapper}.
     * @remark un {@link RegisteredVarDataWrapper} sert à stocker les callbacks à appeler pour le var param en question
     * @param var_param
     */
    public constructor(
        public var_param: VarDataBaseVO
    ) { }

    public async add_callbacks(callbacks: { [cb_uid: number]: VarUpdateCallback }): Promise<RegisteredVarDataWrapper> {
        for (let uid in callbacks) {
            let callback = callbacks[uid];

            /**
             * Si on a déjà une valeur pour ce param, on peut appeler le callback directement, on attend rien de plus
             */
            if (VarsClientController.getInstance().cached_var_datas[this.var_param.index]) {

                if ((callback.value_type == VarUpdateCallback.VALUE_TYPE_ALL) || (
                    (typeof VarsClientController.getInstance().cached_var_datas[this.var_param.index].value !== 'undefined') &&
                    (VarsClientController.getInstance().cached_var_datas[this.var_param.index].value_ts))) {

                    if (!!callback.callback) {
                        await callback.callback(VarsClientController.getInstance().cached_var_datas[this.var_param.index]);

                        if (callback.type == VarUpdateCallback.TYPE_ONCE) {
                            continue;
                        }
                    }
                }
            }

            this.callbacks[uid] = callbacks[uid];
        }

        return this;
    }

    public remove_callbacks(callbacks: { [cb_uid: number]: VarUpdateCallback }): RegisteredVarDataWrapper {
        for (let uid in callbacks) {
            delete this.callbacks[uid];
        }
        return this;
    }
}
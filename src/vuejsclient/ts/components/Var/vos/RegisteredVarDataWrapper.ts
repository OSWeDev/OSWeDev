import VarDataBaseVO from '../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarUpdateCallback from '../../../../../shared/modules/Var/vos/VarUpdateCallback';

export default class RegisteredVarDataWrapper {

    public nb_registrations: number = 1;
    public callbacks: { [cb_uid: number]: VarUpdateCallback } = {};

    public constructor(
        public var_param: VarDataBaseVO
    ) { }

    public add_callbacks(callbacks: { [cb_uid: number]: VarUpdateCallback }): RegisteredVarDataWrapper {
        for (let uid in callbacks) {
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
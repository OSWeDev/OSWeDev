import VarDataBaseVO from './VarDataBaseVO';
import VarDataValueResVO from './VarDataValueResVO';

export default class VarUpdateCallback {

    public static TYPE_ONCE: number = 0;
    public static TYPE_EVERY: number = 1;

    public static VALUE_TYPE_VALID: number = 0;
    public static VALUE_TYPE_ALL: number = 1;

    public static newCallbackOnce(
        callback: (varData: VarDataBaseVO | VarDataValueResVO) => Promise<void>,
        value_type: number = VarUpdateCallback.VALUE_TYPE_VALID) {
        return new VarUpdateCallback(VarUpdateCallback.UID++, callback, VarUpdateCallback.TYPE_ONCE, value_type);
    }

    public static newCallbackEvery(
        callback: (varData: VarDataBaseVO | VarDataValueResVO) => Promise<void>,
        value_type: number = VarUpdateCallback.VALUE_TYPE_VALID) {
        return new VarUpdateCallback(VarUpdateCallback.UID++, callback, VarUpdateCallback.TYPE_EVERY, value_type);
    }

    private static UID: number = 0;

    private constructor(
        public UID: number,
        public callback: (varData: VarDataBaseVO | VarDataValueResVO) => Promise<void>,
        public type: number,
        public value_type: number = VarUpdateCallback.VALUE_TYPE_VALID) {
    }
}
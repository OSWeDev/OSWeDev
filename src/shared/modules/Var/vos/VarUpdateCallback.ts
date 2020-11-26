import VarDataBaseVO from './VarDataBaseVO';
import VarDataValueResVO from './VarDataValueResVO';

export default class VarUpdateCallback {

    public static TYPE_ONCE: number = 0;
    public static TYPE_EVERY: number = 1;

    public static newCallbackOnce(
        callback: (varData: VarDataBaseVO | VarDataValueResVO) => Promise<void>) {
        return new VarUpdateCallback(VarUpdateCallback.UID++, callback, VarUpdateCallback.TYPE_ONCE);
    }

    public static newCallbackEvery(
        callback: (varData: VarDataBaseVO | VarDataValueResVO) => Promise<void>) {
        return new VarUpdateCallback(VarUpdateCallback.UID++, callback, VarUpdateCallback.TYPE_EVERY);
    }

    private static UID: number = 0;

    private constructor(
        public UID: number,
        public callback: (varData: VarDataBaseVO | VarDataValueResVO) => Promise<void>,
        public type: number) {
    }
}
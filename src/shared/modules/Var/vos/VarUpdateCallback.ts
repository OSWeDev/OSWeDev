import VarDataBaseVO from './VarDataBaseVO';

export default class VarUpdateCallback {

    public static TYPE_ONCE: number = 0;
    public static TYPE_EVERY: number = 1;

    public static newCallbackOnce(
        param_index: string,
        callback: (varData: VarDataBaseVO) => void) {
        return new VarUpdateCallback(VarUpdateCallback.UID++, param_index, callback, VarUpdateCallback.TYPE_ONCE);
    }

    public static newCallbackEvery(
        param_index: string,
        callback: (varData: VarDataBaseVO) => void) {
        return new VarUpdateCallback(VarUpdateCallback.UID++, param_index, callback, VarUpdateCallback.TYPE_EVERY);
    }

    private static UID: number = 0;

    private constructor(
        public UID: number,
        public param_index: string,
        public callback: (varData: VarDataBaseVO) => void,
        public type: number) {
    }
}
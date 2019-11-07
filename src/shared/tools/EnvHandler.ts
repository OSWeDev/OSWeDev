export default class EnvHandler {

    public static getInstance(): EnvHandler {
        if (!EnvHandler.instance) {
            EnvHandler.instance = new EnvHandler();
        }
        return EnvHandler.instance;
    }

    private static instance: EnvHandler = null;

    public IS_DEV: boolean = false;

    private constructor() {
    }
}
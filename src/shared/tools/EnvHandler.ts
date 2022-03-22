/* istanbul ignore file: not a usefull test to write */

export default class EnvHandler {

    public static getInstance(): EnvHandler {
        if (!EnvHandler.instance) {
            EnvHandler.instance = new EnvHandler();
        }
        return EnvHandler.instance;
    }

    private static instance: EnvHandler = null;

    public IS_DEV: boolean = false;
    public NODE_VERBOSE: boolean = true;
    public MSGPCK: boolean = false;
    public COMPRESS: boolean = false;
    public BASE_URL: string = null;
    public CODE_GOOGLE_ANALYTICS: string = null;
    public VERSION: string = null;
    public ACTIVATE_PWA: boolean = false;

    private constructor() { }
}
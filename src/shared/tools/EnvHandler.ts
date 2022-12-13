/* istanbul ignore file: not a usefull test to write */

export default class EnvHandler {

    public static IS_DEV: boolean = false;
    public static NODE_VERBOSE: boolean = true;
    public static MSGPCK: boolean = false;
    public static COMPRESS: boolean = false;
    public static BASE_URL: string = null;
    public static CODE_GOOGLE_ANALYTICS: string = null;
    public static VERSION: string = null;
    public static ACTIVATE_PWA: boolean = false;

    private constructor() { }
}
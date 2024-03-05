/* istanbul ignore file: not a usefull test to write */

export default class EnvHandler {

    public static is_dev: boolean = false;
    public static debug_vars: boolean = false;
    public static node_verbose: boolean = true;
    public static compress: boolean = false;
    public static base_url: string = null;
    public static code_google_analytics: string = null;
    public static version: string = null;
    public static activate_pwa: boolean = false;
    public static max_pool: number = null;
    public static debug_promise_pipeline: boolean = false;
    public static zoom_auto: boolean = false;

    private constructor() { }
}
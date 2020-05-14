/* istanbul ignore file: no usefull tests to build */

export default class EnvParam {
    public CONNECTION_STRING: string;
    public PORT: string;
    public ISDEV: boolean;
    public DEFAULT_LOCALE: string;
    public CODE_PAYS: string;
    public MSGPCK: boolean;
    public COMPRESS: boolean;
    public URL_RECOVERY_CHALLENGE: string;
    public URL_RECOVERY: string;
    public BASE_URL: string;
    public BLOCK_MAIL_DELIVERY: boolean;
    public BDD_OWNER: string;
    public NODE_VERBOSE: boolean;
    public ACTIVATE_LONG_JOHN: boolean;
    public MAX_POOL: number = 10;
    public SERVER_START_BOOSTER: boolean;
    public SERVER_ENCODING: string;
    public CONSOLE_LOG_TO_FILE: boolean = true;
}
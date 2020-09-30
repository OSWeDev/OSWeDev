/* istanbul ignore file: no usefull tests to build */

export default interface IEnvParam {
    APP_TITLE: string;
    CONNECTION_STRING: string;
    PORT: string;
    ISDEV: boolean;
    DEFAULT_LOCALE: string;
    CODE_PAYS: string;
    MSGPCK: boolean;
    COMPRESS: boolean;
    URL_RECOVERY_CHALLENGE: string;
    URL_RECOVERY: string;
    BASE_URL: string;
    BLOCK_MAIL_DELIVERY: boolean;
    MAIL_DELIVERY_WHITELIST: string;
    BDD_OWNER: string;
    NODE_VERBOSE: boolean;
    ACTIVATE_LONG_JOHN: boolean;
    MAX_POOL: number;
    SERVER_START_BOOSTER: boolean;
    SERVER_ENCODING: string;
    CONSOLE_LOG_TO_FILE: boolean;
    DEBUG_FORKS: boolean;
}
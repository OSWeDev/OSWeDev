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

    DEBUG_SLOW_QUERIES_MS_LIMIT?: number;
    DEBUG_SLOW_QUERIES?: boolean;
    DEBUG_PARAM_QUERIES?: boolean;
    DEBUG_DB_QUERY_PERF?: boolean;
    DEBUG_FORKS?: boolean;
    DEBUG_VARS?: boolean;
    DEBUG_VARS_DB_PARAM_BUILDER?: boolean;
    DEBUG_VARS_SERVER_SUBS_CBS?: boolean;
    DEBUG_START_SERVER?: boolean;
    DEBUG_IMPORTS?: boolean;
    DEBUG_DELETEVOS?: boolean;
    DEBUG_THROTTLED_SELECT?: boolean;
    DEBUG_INTERTHREADS_MESSAGES?: boolean;

    START_MAINTENANCE_ACCEPTATION_CODE: string;
    AUTO_END_MAINTENANCE_ON_START: boolean;
    CODE_GOOGLE_ANALYTICS: string;
    LAUNCH_INIT?: boolean;
    ACTIVATE_PWA: boolean;
    RETRY_FAILED_FAST_TRACK_IMPORTS_WITH_NORMAL_IMPORTATION?: boolean;
}
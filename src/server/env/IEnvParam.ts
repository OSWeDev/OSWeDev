/* istanbul ignore file: no usefull tests to build */

export default interface IEnvParam {
    APP_TITLE: string;
    CONNECTION_STRING: string;
    PORT: string;
    ISDEV: boolean;
    DEFAULT_LOCALE: string;
    CODE_PAYS: string;
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
    MAX_NB_AUTO_UNION_IN_SELECT?: number;
    SERVER_START_BOOSTER: boolean;
    SERVER_ENCODING: string;
    CONSOLE_LOG_TO_FILE: boolean;

    MAX_VarsProcessDeployDeps?: number;
    MAX_VarsProcessLoadDatas?: number;
    MAX_Vars_invalidators?: number;

    MAX_SIZE_PER_QUERY?: number;
    MAX_UNION_ALL_PER_QUERY?: number;

    DEBUG_SLOW_QUERIES_MS_LIMIT?: number;
    DEBUG_SLOW_QUERIES?: boolean;
    DEBUG_PARAM_QUERIES?: boolean;
    DEBUG_DB_QUERY_PERF?: boolean;
    DEBUG_DB_QUERY_add_activated_many_to_many?: boolean;
    DEBUG_convert_varparamfields_to_vardatas?: boolean;
    DEBUG_FORKS?: boolean;
    DEBUG_VARS?: boolean;
    DEBUG_VARS_PROCESSES?: boolean;
    DEBUG_VARS_INVALIDATION?: boolean;
    DEBUG_VARS_CURRENT_TREE?: boolean;
    DEBUG_VARS_DB_PARAM_BUILDER?: boolean;
    DEBUG_VARS_SERVER_SUBS_CBS?: boolean;
    DEBUG_START_SERVER?: boolean;
    DEBUG_IMPORTS?: boolean;
    DEBUG_EXPORTS?: boolean;
    DEBUG_DELETEVOS?: boolean;
    DEBUG_THROTTLED_SELECT?: boolean;
    DEBUG_SELECT_DATATABLE_ROWS_query_res?: boolean;
    DEBUG_DB_FULL_QUERY_PERF?: boolean;
    DEBUG_INTERTHREADS_MESSAGES?: boolean;

    DEBUG_PROMISE_PIPELINE?: boolean;
    DEBUG_PROMISE_PIPELINE_WORKER_STATS?: boolean;

    DEBUG_AZURE_MEMORY_CHECK?: boolean;

    DEBUG_CONTEXT_QUERY_build_select_query_not_count?: boolean;
    DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_DATAS?: boolean;
    DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_DATAS_WITH_VARS?: boolean;
    DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_TRANSLATED_DATAS?: boolean;
    DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_XLSX_DATAS?: boolean;

    START_MAINTENANCE_ACCEPTATION_CODE: string;
    AUTO_END_MAINTENANCE_ON_START: boolean;
    CODE_GOOGLE_ANALYTICS: string;
    LAUNCH_INIT?: boolean;
    ACTIVATE_PWA: boolean;
    RETRY_FAILED_FAST_TRACK_IMPORTS_WITH_NORMAL_IMPORTATION?: boolean;
    ZOOM_AUTO?: boolean;

    IS_MAIN_PROD_ENV: boolean;

    OPEN_API_API_KEY?: string;

    TEAMS_WEBHOOK__TECH_ERROR?: string;
    TEAMS_WEBHOOK__TECH_WARN?: string;
    TEAMS_WEBHOOK__TECH_INFO?: string;
    TEAMS_WEBHOOK__TECH_SUCCESS?: string;

    TEAMS_WEBHOOK__THROTTLE_MS?: number;
    TEAMS_WEBHOOK__MESSAGE_MAX_SIZE?: number;
    TEAMS_WEBHOOK__MESSAGE_MAX_SIZE_AUTO_SUMMARIZE?: boolean;
}
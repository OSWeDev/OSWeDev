/* istanbul ignore file: no usefull tests to build */

import IEnvParam from './IEnvParam';

export default class EnvParam implements IEnvParam {
    public APP_TITLE: string;
    public CONNECTION_STRING: string;
    public PORT: string;
    public ISDEV: boolean;
    public DEFAULT_LOCALE: string;
    public CODE_PAYS: string;
    public COMPRESS: boolean;
    public URL_RECOVERY_CHALLENGE: string;
    public URL_RECOVERY: string;
    public BASE_URL: string;
    public BLOCK_MAIL_DELIVERY: boolean;
    public MAIL_DELIVERY_WHITELIST: string;
    public BDD_OWNER: string;
    public NODE_VERBOSE: boolean;
    public ACTIVATE_LONG_JOHN: boolean;
    public MAX_POOL: number = 20;
    public MAX_NB_AUTO_UNION_IN_SELECT?: number = 10;
    public SERVER_START_BOOSTER: boolean;
    public SERVER_ENCODING: string;
    public CONSOLE_LOG_TO_FILE: boolean = true;
    public START_MAINTENANCE_ACCEPTATION_CODE: string;
    public AUTO_END_MAINTENANCE_ON_START: boolean = true;
    public CODE_GOOGLE_ANALYTICS: string = null;
    public LAUNCH_INIT?: boolean = false;

    public MAX_VarsProcessDeployDeps?: number = 100;
    public MAX_VarsProcessLoadDatas?: number = 100;
    public MAX_Vars_invalidators?: number = 200;

    public MAX_SIZE_PER_QUERY?: number = 1000000;
    public MAX_UNION_ALL_PER_QUERY?: number = 1000;

    public MUTE__NO_SORT_BY_BUT_QUERY_LIMIT?: boolean = false;

    public DEBUG_FORKS?: boolean = false;
    public DEBUG_VARS?: boolean = false;
    public DEBUG_VARS_PROCESSES?: boolean = false;
    public DEBUG_VARS_INVALIDATION?: boolean = false;
    public DEBUG_VARS_CURRENT_TREE?: boolean = false;
    public DEBUG_VARS_DB_PARAM_BUILDER?: boolean = false;
    public DEBUG_VARS_SERVER_SUBS_CBS?: boolean = false;
    public DEBUG_PARAM_QUERIES?: boolean = false;
    public DEBUG_DELETEVOS?: boolean = false;
    public DEBUG_START_SERVER?: boolean = false;
    public DEBUG_DB_QUERY_add_activated_many_to_many?: boolean = false;
    public DEBUG_convert_varparamfields_to_vardatas?: boolean = false;
    public DEBUG_IO_ROOMS?: boolean = false;
    public DEBUG_VO_EVENTS?: boolean = false;

    public DEBUG_SELECT_DATATABLE_ROWS_query_res?: boolean = false;

    public DEBUG_CONTEXT_QUERY_build_select_query_not_count?: boolean = false;
    public DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_DATAS?: boolean = false;
    public DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_DATAS_WITH_VARS?: boolean = false;
    public DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_TRANSLATED_DATAS?: boolean = false;
    public DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_XLSX_DATAS?: boolean = false;

    public DEBUG_var_insert_with_copy?: boolean = false;
    public DEBUG_var_get_instance_semaphored_db_loaded_var_data?: boolean = false;

    public DEBUG_waiting_registered_task_result_wrappers?: boolean = false;
    public DEBUG_waiting_registered_task_result_wrappers_threshold?: number = 5;
    public DEBUG_waiting_registered_task_result_wrappers_verbose_result_task_uid?: boolean = false;

    /**
     * Activate this to debug SLOW QUERIES in ModuleServiceBase
     */
    public DEBUG_SLOW_QUERIES?: boolean = false;
    /**
     * Activate this to define threshold for SLOW QUERIES and VERY SLOW QUERIES (10*) in ModuleServiceBase
     */
    public DEBUG_SLOW_QUERIES_MS_LIMIT?: number = 100;
    /**
     * Activate this to log DB PERFs - redondant with DEBUG_SLOW_QUERIES but with more details on who asked the query
     */
    public DEBUG_DB_QUERY_PERF?: boolean = false;
    /**
     * Activate this to log FULL QUERIES instead of a 1k cars limit
     */
    public DEBUG_DB_FULL_QUERY_PERF?: boolean = false;

    public DEBUG_INTERTHREADS_MESSAGES?: boolean = false;
    public DEBUG_IMPORTS?: boolean = false;
    public DEBUG_EXPORTS?: boolean = false;
    public DEBUG_THROTTLED_SELECT?: boolean = false;
    public DEBUG_PROMISE_PIPELINE?: boolean = false;
    /**
     * Activate this to debug the promise pipeline nb_running_promises stat each second
     */
    public DEBUG_PROMISE_PIPELINE_WORKER_STATS?: boolean = false;
    public DEBUG_AZURE_MEMORY_CHECK?: boolean = false;

    public ACTIVATE_PWA: boolean = false;
    public RETRY_FAILED_FAST_TRACK_IMPORTS_WITH_NORMAL_IMPORTATION?: boolean = true;
    public ZOOM_AUTO?: boolean = false;

    /**
     * ATTENTION : bien indiquer l'environnement principal de production. On bloque par exemple les comptes tests sur cet environnement.
     */
    public IS_MAIN_PROD_ENV: boolean = false;

    public OPEN_API_API_KEY?: string = null;

    public DEBUG_add_var_columns_values_for_xlsx_datas?: boolean = false;

    public BLOCK_TEAMS_MESSAGES?: boolean = true;

    public TEAMS_WEBHOOK__TECH_ERROR?: string = null;
    public TEAMS_WEBHOOK__TECH_WARN?: string = null;
    public TEAMS_WEBHOOK__TECH_INFO?: string = null;
    public TEAMS_WEBHOOK__TECH_SUCCESS?: string = null;

    public TEAMS_WEBHOOK__THROTTLE_MS?: number = 15000;
    public TEAMS_WEBHOOK__MESSAGE_MAX_SIZE?: number = 10000;
    public TEAMS_WEBHOOK__MESSAGE_MAX_SIZE_AUTO_SUMMARIZE?: boolean = true;
}
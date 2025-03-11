
import IDistantVOBase from '../../IDistantVOBase';

export default class EnvParamsVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "env_params";

    public id: number;
    public _type: string = EnvParamsVO.API_TYPE_ID;

    // APP_TITLE: string;
    public app_title: string;

    // CONNECTION_STRING: string;
    public connection_string: string;

    // PORT: string;
    public port: string;

    // ISDEV: boolean;
    public isdev: boolean;

    // DEFAULT_LOCALE: string;
    public default_locale: string;

    // CODE_PAYS: string;
    public code_pays: string;

    // COMPRESS: boolean;
    public compress: boolean;

    // URL_RECOVERY_CHALLENGE: string;
    public url_recovery_challenge: string;

    // URL_RECOVERY: string;
    public url_recovery: string;

    // BASE_URL: string;
    public base_url: string;

    // BLOCK_MAIL_DELIVERY: boolean;
    public block_mail_delivery: boolean;

    // MAIL_DELIVERY_WHITELIST: string;
    public mail_delivery_whitelist: string;

    // BDD_OWNER: string;
    public bdd_owner: string;

    // NODE_VERBOSE: boolean;
    public node_verbose: boolean;

    public throw_on_incompatible_stack_context: boolean;
    public activate_incompatible_stack_context: boolean;

    // ACTIVATE_LONG_JOHN: boolean;
    public activate_long_john: boolean;

    // MAX_POOL: number;
    public max_pool: number;

    // MAX_NB_AUTO_UNION_IN_SELECT?: number;
    public max_nb_auto_union_in_select: number;

    // SERVER_START_BOOSTER: boolean;
    public server_start_booster: boolean;

    // SERVER_ENCODING: string;
    public server_encoding: string;

    // CONSOLE_LOG_TO_FILE: boolean;
    public console_log_to_file: boolean;

    // MAX_VarsProcessDeployDeps?: number;
    public max_varsprocessdeploydeps: number;

    // MAX_VarsProcessLoadDatas?: number;
    public max_varsprocessloaddatas: number;

    public max_varsprocessdagcleaner: number;

    public max_varsprocessnotifyend: number;
    public max_varsprocessnotifystart: number;
    public max_varsprocessupdatedb: number;

    // MAX_Vars_invalidators?: number;
    public max_vars_invalidators: number;

    public activate_async_hook_for_promise_watch: boolean;

    // MAX_SIZE_PER_QUERY?: number;
    public max_size_per_query: number;

    // MAX_UNION_ALL_PER_QUERY?: number;
    public max_union_all_per_query: number;

    // MUTE__NO_SORT_BY_BUT_QUERY_LIMIT?: boolean;
    public mute__no_sort_by_but_query_limit: boolean;

    public debug_playwright_controller: boolean;

    // DEBUG_SLOW_QUERIES_MS_LIMIT?: number;
    public debug_slow_queries_ms_limit: number;

    // DEBUG_SLOW_QUERIES?: boolean;
    public debug_slow_queries: boolean;

    // DEBUG_PARAM_QUERIES?: boolean;
    public debug_param_queries: boolean;

    // DEBUG_DB_QUERY_PERF?: boolean;
    public debug_db_query_perf: boolean;

    // DEBUG_DB_QUERY_add_activated_many_to_many?: boolean;
    public debug_db_query_add_activated_many_to_many: boolean;

    // DEBUG_convert_varparamfields_to_vardatas?: boolean;
    public debug_convert_varparamfields_to_vardatas: boolean;

    // DEBUG_FORKS?: boolean;
    public debug_forks: boolean;

    // DEBUG_VARS?: boolean;
    public debug_vars: boolean;

    // DEBUG_VARS_PROCESSES?: boolean;
    public debug_vars_processes: boolean;

    // DEBUG_VARS_INVALIDATION?: boolean;
    public debug_vars_invalidation: boolean;

    // debug_vars_invalidation_param_intersector?: boolean;
    public debug_vars_invalidation_param_intersector: boolean;

    // DEBUG_VARS_CURRENT_TREE?: boolean;
    public debug_vars_current_tree: boolean;

    // DEBUG_VARS_DB_PARAM_BUILDER?: boolean;
    public debug_vars_db_param_builder: boolean;

    // DEBUG_VARS_SERVER_SUBS_CBS?: boolean;
    public debug_vars_server_subs_cbs: boolean;

    // DEBUG_START_SERVER?: boolean;
    public debug_start_server: boolean;

    // DEBUG_IMPORTS?: boolean;
    public debug_imports: boolean;

    // DEBUG_EXPORTS?: boolean;
    public debug_exports: boolean;

    // DEBUG_DELETEVOS?: boolean;
    public debug_deletevos: boolean;

    // DEBUG_THROTTLED_SELECT?: boolean;
    public debug_throttled_select: boolean;

    // DEBUG_SELECT_DATATABLE_ROWS_query_res?: boolean;
    public debug_select_datatable_rows_query_res: boolean;

    // DEBUG_DB_FULL_QUERY_PERF?: boolean;
    public debug_db_full_query_perf: boolean;

    // DEBUG_INTERTHREADS_MESSAGES?: boolean;
    public debug_interthreads_messages: boolean;

    // DEBUG_IO_ROOMS?: boolean;
    public debug_io_rooms: boolean;

    // DEBUG_VO_EVENTS?: boolean;
    public debug_vo_events: boolean;

    // DEBUG_PROMISE_PIPELINE?: boolean;
    public debug_promise_pipeline: boolean;

    // DEBUG_PROMISE_PIPELINE_WORKER_STATS?: boolean;
    public debug_promise_pipeline_worker_stats: boolean;

    // DEBUG_AZURE_MEMORY_CHECK?: boolean;
    public debug_azure_memory_check: boolean;

    public debug_throttle_uid: boolean;

    public debug_slow_event_listeners: boolean;
    public debug_slow_event_listeners_ms_limit: number;

    /**
     * Activate to start event perf reporting, deactivate to stop and save the report in DB
     */
    public create_event_perf_report: boolean;

    public activate_module_perf_throttle_queries: boolean;
    public activate_module_perf_eventify: boolean;
    public activate_module_perf_var_dag_nodes: boolean;
    public activate_module_perf_gpt_assistant_api: boolean;
    public activate_module_perf_gpt_sync: boolean;
    public activate_module_perf_expressjs: boolean;
    public activate_module_perf_worker_messages: boolean;
    public activate_module_perf_bgthread_ping_latency: boolean;
    public activate_module_perf_bgthread_load_balancing: boolean;

    public debug_all_expressjs_perf: boolean;
    public debug_expressjs_request_reflexion_time: boolean;
    public debug_expressjs_request_reflexion_time_console_log_ms_limit: number;
    public debug_expressjs_request_reflexion_time_teams_log_ms_limit: number;
    public debug_expressjs_request_sendres_time: boolean;
    public debug_expressjs_request_sendres_time_console_log_ms_limit: number;
    public debug_expressjs_request_sendres_time_teams_log_ms_limit: number;

    public debug_all_thread_ping_latency: boolean;

    public debug_thread_ping_latency: boolean;
    public debug_thread_ping_latency_console_log_ms_limit: number;
    public debug_thread_ping_latency_teams_log_ms_limit: number;

    // Conf load balancing des apis
    public api_load_balancing: boolean;
    public api_load_balancing_nb_workers: number;

    public load_balancing_debug_log: boolean;

    public debug_reruns_of_oselia: boolean;

    // DEBUG_CONTEXT_QUERY_build_select_query_not_count?: boolean;
    public debug_context_query_build_select_query_not_count: boolean;

    // DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_DATAS?: boolean;
    public debug_export_context_query_to_xlsx_datas: boolean;

    // DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_DATAS_WITH_VARS?: boolean;
    public debug_export_context_query_to_xlsx_datas_with_vars: boolean;

    // DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_TRANSLATED_DATAS?: boolean;
    public debug_export_context_query_to_xlsx_translated_datas: boolean;

    // DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_XLSX_DATAS?: boolean;
    public debug_export_context_query_to_xlsx_xlsx_datas: boolean;

    // START_MAINTENANCE_ACCEPTATION_CODE: string;
    public start_maintenance_acceptation_code: string;

    // AUTO_END_MAINTENANCE_ON_START: boolean;
    public auto_end_maintenance_on_start: boolean;

    // CODE_GOOGLE_ANALYTICS: string;
    public code_google_analytics: string;

    // LAUNCH_INIT?: boolean;
    public launch_init: boolean;

    // ACTIVATE_PWA: boolean;
    public activate_pwa: boolean;

    // RETRY_FAILED_FAST_TRACK_IMPORTS_WITH_NORMAL_IMPORTATION?: boolean;
    public retry_failed_fast_track_imports_with_normal_importation: boolean;

    // ZOOM_AUTO?: boolean;
    public zoom_auto: boolean;

    // IS_MAIN_PROD_ENV: boolean;
    public is_main_prod_env: boolean;

    // OPEN_API_API_KEY?: string;
    public open_api_api_key: string;

    // TEAMS Webhooks
    public teams_webhook_send_message?: string = null;
    public teams_webhook_update_message?: string = null;

    // TEAMS Organisations
    public teams_groupid__oselia?: string = null;
    public teams_groupid__tech?: string = null;

    // TEAMS Channels
    public teams_channelid__oselia_error?: string = null;
    public teams_channelid__oselia_warn?: string = null;
    public teams_channelid__oselia_info?: string = null;
    public teams_channelid__oselia_success?: string = null;
    public teams_channelid__oselia_action_needed?: string = null;

    public teams_channelid__tech_error?: string = null;
    public teams_channelid__tech_warn?: string = null;
    public teams_channelid__tech_info?: string = null;
    public teams_channelid__tech_success?: string = null;

    public teams_throttle_ms?: number = 15000;
    public teams_message_max_size?: number = 10000;
    public teams_message_max_size_auto_summarize?: boolean = false;

    // BLOCK_TEAMS_MESSAGES?: boolean;
    public block_teams_messages: boolean;

    // logo_path?: string;
    public logo_path: string;

    public debug_openai_sync: boolean;
    public debug_oselia_referrer_origin: boolean;
    public debug_openai_generate_image: boolean;

    public block_openai_sync_push_to_openai: boolean;
    public unblock_openai_push_to_openai_gpt_assistant_thread: boolean;
    public unblock_openai_push_to_openai_gpt_assistant_thread_msg: boolean;
    public unblock_openai_push_to_openai_gpt_assistant_run: boolean;
    public unblock_openai_push_to_openai_gpt_assistant: boolean;

    public silent_no_sort_by_but_query_limit: boolean;

    public debug_vars_notifs: boolean;
    public log_login_redirects: boolean;

    public debug_top_10_query_size: boolean;
}
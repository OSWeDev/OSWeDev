/* istanbul ignore file: no usefull tests to build */

import IEnvParam from './IEnvParam';

export default class EnvParam implements IEnvParam {
    public app_title: string;
    public connection_string: string;
    public port: string;
    public isdev: boolean;
    public default_locale: string;
    public code_pays: string;
    public compress: boolean;
    public url_recovery_challenge: string;
    public url_recovery: string;
    public base_url: string;
    public block_mail_delivery: boolean;
    public mail_delivery_whitelist: string;
    public bdd_owner: string;
    public node_verbose: boolean;
    public activate_long_john: boolean;
    public max_pool: number = 20;
    public max_nb_auto_union_in_select?: number = 10;
    public server_start_booster: boolean;
    public server_encoding: string;
    public console_log_to_file: boolean = true;
    public start_maintenance_acceptation_code: string;
    public auto_end_maintenance_on_start: boolean = true;
    public code_google_analytics: string = null;
    public launch_init?: boolean = false;

    public max_varsprocessdeploydeps?: number = 100;
    public max_varsprocessloaddatas?: number = 100;
    public max_varsprocessdagcleaner?: number = 1000;
    public max_vars_invalidators?: number = 200;
    public max_varsprocessnotifyend?: number = 1000;
    public max_varsprocessnotifystart?: number = 1000;
    public max_varsprocessupdatedb?: number = 100;

    public max_size_per_query?: number = 10000000;
    public max_union_all_per_query?: number = 1000;

    public mute__no_sort_by_but_query_limit?: boolean = false;

    public activate_incompatible_stack_context?: boolean = false;
    public throw_on_incompatible_stack_context?: boolean = false;


    public debug_forks?: boolean = false;
    public debug_vars?: boolean = false;
    public debug_vars_processes?: boolean = false;
    public debug_vars_invalidation?: boolean = false;
    public debug_vars_invalidation_param_intersector?: boolean = false;
    public debug_vars_current_tree?: boolean = false;
    public debug_vars_db_param_builder?: boolean = false;
    public debug_vars_server_subs_cbs?: boolean = false;
    public debug_vars_notifs?: boolean = false;
    public debug_param_queries?: boolean = false;
    public debug_deletevos?: boolean = false;
    public debug_start_server?: boolean = false;
    public debug_db_query_add_activated_many_to_many?: boolean = false;
    public debug_convert_varparamfields_to_vardatas?: boolean = false;
    public debug_io_rooms?: boolean = false;
    public debug_vo_events?: boolean = false;

    public debug_playwright_controller?: boolean = false;

    public debug_reruns_of_oselia?: boolean = false;

    public debug_select_datatable_rows_query_res?: boolean = false;

    public debug_context_query_build_select_query_not_count?: boolean = false;
    public debug_export_context_query_to_xlsx_datas?: boolean = false;
    public debug_export_context_query_to_xlsx_datas_with_vars?: boolean = false;
    public debug_export_context_query_to_xlsx_translated_datas?: boolean = false;
    public debug_export_context_query_to_xlsx_xlsx_datas?: boolean = false;

    public debug_var_insert_with_copy?: boolean = false;
    public debug_var_get_instance_semaphored_db_loaded_var_data?: boolean = false;

    public debug_waiting_registered_task_result_wrappers?: boolean = false;
    public debug_waiting_registered_task_result_wrappers_threshold?: number = 5;
    public debug_waiting_registered_task_result_wrappers_verbose_result_task_uid?: boolean = false;

    public debug_slow_event_listeners?: boolean = false;
    public debug_slow_event_listeners_ms_limit?: number = 1000;

    /**
     * Activate this to debug SLOW QUERIES in ModuleServiceBase
     */
    public debug_slow_queries?: boolean = false;
    /**
     * Activate this to define threshold for SLOW QUERIES and VERY SLOW QUERIES (10*) in ModuleServiceBase
     */
    public debug_slow_queries_ms_limit?: number = 100;
    /**
     * Activate this to log DB PERFs - redondant with DEBUG_SLOW_QUERIES but with more details on who asked the query
     */
    public debug_db_query_perf?: boolean = false;
    /**
     * Activate this to log FULL QUERIES instead of a 1k cars limit
     */
    public debug_db_full_query_perf?: boolean = false;

    public debug_interthreads_messages?: boolean = false;
    public debug_imports?: boolean = false;
    public debug_exports?: boolean = false;
    public debug_throttled_select?: boolean = false;
    public debug_promise_pipeline?: boolean = false;

    public debug_throttle_uid?: boolean = false;

    /**
     * Activate this to debug the promise pipeline nb_running_promises stat each second
     */
    public debug_promise_pipeline_worker_stats?: boolean = false;
    public debug_azure_memory_check?: boolean = false;

    public activate_pwa: boolean = false;
    public retry_failed_fast_track_imports_with_normal_importation?: boolean = true;
    public zoom_auto?: boolean = false;

    /**
     * ATTENTION : bien indiquer l'environnement principal de production. On bloque par exemple les comptes tests sur cet environnement.
     */
    public is_main_prod_env: boolean = false;

    public open_api_api_key: string = null;

    public debug_add_var_columns_values_for_xlsx_datas?: boolean = false;

    public block_teams_messages?: boolean = true;

    public create_event_perf_report?: boolean = false;
    public activate_module_perf_throttle_queries?: boolean = false;
    public activate_module_perf_eventify?: boolean = false;
    public activate_module_perf_var_dag_nodes?: boolean = false;
    public activate_module_perf_gpt_assistant_api?: boolean = false;

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

    public express_secret: string = null;
    public logo_path?: string = null;

    public debug_openai_sync?: boolean = true;
    public debug_oselia_referrer_origin?: boolean = false;
    public debug_openai_generate_image?: boolean = false;

    public block_openai_sync_push_to_openai?: boolean = false;
    public unblock_openai_push_to_openai_gpt_assistant_thread?: boolean = false;
    public unblock_openai_push_to_openai_gpt_assistant_thread_msg?: boolean = false;
    public unblock_openai_push_to_openai_gpt_assistant_run?: boolean = false;
    public unblock_openai_push_to_openai_gpt_assistant?: boolean = false;

    public silent_no_sort_by_but_query_limit?: boolean = true;

    public log_login_redirects?: boolean = false;

    public activate_async_hook_for_promise_watch?: boolean = false;

    public debug_top_10_query_size?: boolean = false;
}
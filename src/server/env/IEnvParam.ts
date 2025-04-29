/* istanbul ignore file: no usefull tests to build */

export default interface IEnvParam {
    app_title: string;
    connection_string: string;
    port: string;
    isdev: boolean;
    default_locale: string;
    code_pays: string;
    compress: boolean;
    url_recovery_challenge: string;
    url_recovery: string;
    base_url: string;
    block_mail_delivery: boolean;
    mail_delivery_whitelist: string;
    bdd_owner: string;
    node_verbose: boolean;
    activate_long_john: boolean;
    max_pool: number;
    max_nb_auto_union_in_select?: number;
    server_start_booster: boolean;
    server_encoding: string;
    console_log_to_file: boolean;

    max_varsprocessdeploydeps?: number;
    max_varsprocessloaddatas?: number;
    max_varsprocessdagcleaner?: number;
    max_vars_invalidators?: number;
    max_varsprocessnotifyend?: number;
    max_varsprocessnotifystart?: number;
    max_varsprocessupdatedb?: number;


    max_size_per_query?: number;
    max_union_all_per_query?: number;

    mute__no_sort_by_but_query_limit?: boolean;

    throw_on_incompatible_stack_context?: boolean;
    activate_incompatible_stack_context?: boolean;

    debug_playwright_controller?: boolean;

    debug_slow_queries_ms_limit?: number;
    debug_slow_queries?: boolean;
    debug_param_queries?: boolean;
    debug_db_query_perf?: boolean;
    debug_db_query_add_activated_many_to_many?: boolean;
    debug_convert_varparamfields_to_vardatas?: boolean;
    debug_forks?: boolean;
    debug_vars?: boolean;
    debug_vars_processes?: boolean;
    debug_vars_invalidation?: boolean;
    debug_vars_current_tree?: boolean;
    debug_vars_db_param_builder?: boolean;
    debug_vars_server_subs_cbs?: boolean;
    debug_vars_notifs?: boolean;
    debug_start_server?: boolean;
    debug_imports?: boolean;
    debug_exports?: boolean;
    debug_deletevos?: boolean;
    debug_throttled_select?: boolean;
    debug_select_datatable_rows_query_res?: boolean;
    debug_db_full_query_perf?: boolean;
    debug_all_queries?: boolean;
    debug_interthreads_messages?: boolean;
    debug_io_rooms?: boolean;
    debug_vo_events?: boolean;

    threshold_too_many_imports_waiting?: number;

    debug_var_insert_with_copy?: boolean;

    debug_slow_event_listeners?: boolean;
    debug_slow_event_listeners_ms_limit?: number;

    create_event_perf_report?: boolean;
    activate_module_perf_throttle_queries?: boolean;
    activate_module_perf_eventify?: boolean;
    activate_module_perf_var_dag_nodes?: boolean;
    activate_module_perf_gpt_assistant_api?: boolean;
    activate_module_perf_gpt_sync?: boolean;
    activate_module_perf_expressjs?: boolean;
    activate_module_perf_worker_messages?: boolean;
    activate_module_perf_bgthread_ping_latency?: boolean;
    activate_module_perf_bgthread_load_balancing?: boolean;

    debug_all_expressjs_perf?: boolean;
    debug_expressjs_request_reflexion_time?: boolean;
    debug_expressjs_request_reflexion_time_console_log_ms_limit?: number;
    debug_expressjs_request_reflexion_time_teams_log_ms_limit?: number;
    debug_expressjs_request_sendres_time?: boolean;
    debug_expressjs_request_sendres_time_console_log_ms_limit?: number;
    debug_expressjs_request_sendres_time_teams_log_ms_limit?: number;

    debug_all_thread_ping_latency?: boolean;

    debug_thread_ping_latency?: boolean;
    debug_thread_ping_latency_console_log_ms_limit?: number;
    debug_thread_ping_latency_teams_log_ms_limit?: number;

    api_load_balancing?: boolean;
    api_load_balancing_nb_workers?: number;

    load_balancing_debug_log?: boolean;

    debug_var_get_instance_semaphored_db_loaded_var_data?: boolean;

    debug_waiting_registered_task_result_wrappers?: boolean;
    debug_waiting_registered_task_result_wrappers_threshold?: number;
    debug_waiting_registered_task_result_wrappers_verbose_result_task_uid?: boolean;

    debug_promise_pipeline?: boolean;
    debug_promise_pipeline_worker_stats?: boolean;

    debug_azure_memory_check?: boolean;

    debug_throttle_uid?: boolean;

    debug_context_query_build_select_query_not_count?: boolean;
    debug_export_context_query_to_xlsx_datas?: boolean;
    debug_export_context_query_to_xlsx_datas_with_vars?: boolean;
    debug_export_context_query_to_xlsx_translated_datas?: boolean;
    debug_export_context_query_to_xlsx_xlsx_datas?: boolean;

    debug_reruns_of_oselia?: boolean;

    start_maintenance_acceptation_code: string;
    auto_end_maintenance_on_start: boolean;
    code_google_analytics: string;
    launch_init?: boolean;
    activate_pwa: boolean;
    retry_failed_fast_track_imports_with_normal_importation?: boolean;
    zoom_auto?: boolean;

    is_main_prod_env: boolean;

    open_api_api_key?: string;

    // TEAMS Webhooks
    teams_webhook_send_message?: string;
    teams_webhook_update_message?: string;

    // TEAMS Organisations
    teams_groupid__oselia?: string;
    teams_groupid__tech?: string;

    // TEAMS Channels
    teams_channelid__oselia_error?: string;
    teams_channelid__oselia_warn?: string;
    teams_channelid__oselia_info?: string;
    teams_channelid__oselia_success?: string;
    teams_channelid__oselia_action_needed?: string;

    teams_channelid__tech_error?: string;
    teams_channelid__tech_warn?: string;
    teams_channelid__tech_info?: string;
    teams_channelid__tech_success?: string;

    teams_throttle_ms?: number;
    teams_message_max_size?: number;
    teams_message_max_size_auto_summarize?: boolean;

    block_teams_messages?: boolean;

    express_secret: string;
    logo_path?: string;

    debug_openai_sync?: boolean;
    debug_oselia_referrer_origin?: boolean;
    debug_openai_generate_image?: boolean;

    block_openai_sync_push_to_openai?: boolean;
    unblock_openai_push_to_openai_gpt_assistant_thread?: boolean;
    unblock_openai_push_to_openai_gpt_assistant_thread_msg?: boolean;
    unblock_openai_push_to_openai_gpt_assistant_run?: boolean;
    unblock_openai_push_to_openai_gpt_assistant?: boolean;

    silent_no_sort_by_but_query_limit?: boolean;

    log_login_redirects?: boolean;

    activate_async_hook_for_promise_watch?: boolean;

    debug_top_10_query_size?: boolean;
}
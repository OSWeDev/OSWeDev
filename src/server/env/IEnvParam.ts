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
    max_vars_invalidators?: number;

    max_size_per_query?: number;
    max_union_all_per_query?: number;

    mute__no_sort_by_but_query_limit?: boolean;

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
    debug_start_server?: boolean;
    debug_imports?: boolean;
    debug_exports?: boolean;
    debug_deletevos?: boolean;
    debug_throttled_select?: boolean;
    debug_select_datatable_rows_query_res?: boolean;
    debug_db_full_query_perf?: boolean;
    debug_interthreads_messages?: boolean;
    debug_io_rooms?: boolean;
    debug_vo_events?: boolean;

    debug_var_insert_with_copy?: boolean;

    debug_var_get_instance_semaphored_db_loaded_var_data?: boolean;

    debug_waiting_registered_task_result_wrappers?: boolean;
    debug_waiting_registered_task_result_wrappers_threshold?: number;
    debug_waiting_registered_task_result_wrappers_verbose_result_task_uid?: boolean;

    debug_promise_pipeline?: boolean;
    debug_promise_pipeline_worker_stats?: boolean;

    debug_azure_memory_check?: boolean;

    debug_context_query_build_select_query_not_count?: boolean;
    debug_export_context_query_to_xlsx_datas?: boolean;
    debug_export_context_query_to_xlsx_datas_with_vars?: boolean;
    debug_export_context_query_to_xlsx_translated_datas?: boolean;
    debug_export_context_query_to_xlsx_xlsx_datas?: boolean;

    start_maintenance_acceptation_code: string;
    auto_end_maintenance_on_start: boolean;
    code_google_analytics: string;
    launch_init?: boolean;
    activate_pwa: boolean;
    retry_failed_fast_track_imports_with_normal_importation?: boolean;
    zoom_auto?: boolean;

    is_main_prod_env: boolean;

    open_api_api_key?: string;

    teams_webhook__tech_error?: string;
    teams_webhook__tech_warn?: string;
    teams_webhook__tech_info?: string;
    teams_webhook__tech_success?: string;

    teams_webhook__throttle_ms?: number;
    teams_webhook__message_max_size?: number;
    teams_webhook__message_max_size_auto_summarize?: boolean;

    block_teams_messages?: boolean;

    express_secret: string;
}
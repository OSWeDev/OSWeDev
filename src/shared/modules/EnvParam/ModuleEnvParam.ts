import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import String2ParamVO, { String2ParamVOStatic } from '../API/vos/apis/String2ParamVO';
import StringAndBooleanParamVO, { StringAndBooleanParamVOStatic } from '../API/vos/apis/StringAndBooleanParamVO';
import StringAndNumberParamVO, { StringAndNumberParamVOStatic } from '../API/vos/apis/StringAndNumberParamVO';
import ModuleAccessPolicy from '../AccessPolicy/ModuleAccessPolicy';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import Module from '../Module';
import EnvParamsVO from './vos/EnvParamsVO';

export default class ModuleEnvParam extends Module {

    public static MODULE_NAME: string = 'EnvParam';

    public static APINAME_get_env_params: string = "get_env_params";

    public static APINAME_set_env_param_string: string = "set_env_param_string";
    public static APINAME_set_env_param_boolean: string = "set_env_param_boolean";
    public static APINAME_set_env_param_number: string = "set_env_param_number";

    private static instance: ModuleEnvParam = null;

    public set_env_param_string: (code: string, value: string) => Promise<boolean> = APIControllerWrapper.sah<String2ParamVO, boolean>(ModuleEnvParam.APINAME_set_env_param_string);
    public set_env_param_boolean: (code: string, value: boolean) => Promise<boolean> = APIControllerWrapper.sah<StringAndBooleanParamVO, boolean>(ModuleEnvParam.APINAME_set_env_param_boolean);
    public set_env_param_number: (code: string, value: number) => Promise<boolean> = APIControllerWrapper.sah<StringAndNumberParamVO, boolean>(ModuleEnvParam.APINAME_set_env_param_number);

    public get_env_params: () => Promise<EnvParamsVO> = APIControllerWrapper.sah<null, EnvParamsVO>(ModuleEnvParam.APINAME_get_env_params);

    private constructor() {

        super("env_param", ModuleEnvParam.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleEnvParam {
        if (!ModuleEnvParam.instance) {
            ModuleEnvParam.instance = new ModuleEnvParam();
        }
        return ModuleEnvParam.instance;
    }

    public registerApis() {

        APIControllerWrapper.registerApi(new GetAPIDefinition<null, EnvParamsVO>(
            ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS,
            ModuleEnvParam.APINAME_get_env_params,
            [EnvParamsVO.API_TYPE_ID]
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<String2ParamVO, boolean>(
            ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS,
            ModuleEnvParam.APINAME_set_env_param_string,
            [EnvParamsVO.API_TYPE_ID],
            String2ParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<StringAndBooleanParamVO, boolean>(
            ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS,
            ModuleEnvParam.APINAME_set_env_param_boolean,
            [EnvParamsVO.API_TYPE_ID],
            StringAndBooleanParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<StringAndNumberParamVO, boolean>(
            ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS,
            ModuleEnvParam.APINAME_set_env_param_number,
            [EnvParamsVO.API_TYPE_ID],
            StringAndNumberParamVOStatic
        ));
    }

    public initialize() {
        this.initializeEnvParamsVO();
    }

    private initializeEnvParamsVO() {

        // APP_TITLE: string;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().app_title, ModuleTableFieldVO.FIELD_TYPE_string, 'Titre de l\'application', true);
        // CONNECTION_STRING: string;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().connection_string, ModuleTableFieldVO.FIELD_TYPE_string, 'Connection string', true);
        // PORT: string;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().port, ModuleTableFieldVO.FIELD_TYPE_string, 'Port', true);
        // ISDEV: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().isdev, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Dev', true);
        // DEFAULT_LOCALE: string;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().default_locale, ModuleTableFieldVO.FIELD_TYPE_string, 'Locale par défaut', true);
        // CODE_PAYS: string;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().code_pays, ModuleTableFieldVO.FIELD_TYPE_string, 'Code pays', true);
        // COMPRESS: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().compress, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Compresser', true);
        // URL_RECOVERY_CHALLENGE: string;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().url_recovery_challenge, ModuleTableFieldVO.FIELD_TYPE_string, 'URL de récupération du challenge', true);
        // URL_RECOVERY: string;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().url_recovery, ModuleTableFieldVO.FIELD_TYPE_string, 'URL de récupération', true);
        // BASE_URL: string;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().base_url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL de base', true);
        // BLOCK_MAIL_DELIVERY: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().block_mail_delivery, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Bloquer les mails', true);
        // MAIL_DELIVERY_WHITELIST: string;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().mail_delivery_whitelist, ModuleTableFieldVO.FIELD_TYPE_string, 'Whitelist des mails', true);
        // BDD_OWNER: string;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().bdd_owner, ModuleTableFieldVO.FIELD_TYPE_string, 'Propriétaire de la BDD', true);
        // NODE_VERBOSE: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().node_verbose, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Verbose', true);
        // ACTIVATE_LONG_JOHN: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().activate_long_john, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Activer Long John', true);
        // MAX_POOL: number;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().max_pool, ModuleTableFieldVO.FIELD_TYPE_int, 'Pool max', true);
        // MAX_NB_AUTO_UNION_IN_SELECT ?: number;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().max_nb_auto_union_in_select, ModuleTableFieldVO.FIELD_TYPE_int, 'Max auto union in select', false);
        // SERVER_START_BOOSTER: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().server_start_booster, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Booster le démarrage du serveur', true);
        // SERVER_ENCODING: string;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().server_encoding, ModuleTableFieldVO.FIELD_TYPE_string, 'Encodage du serveur', true);
        // CONSOLE_LOG_TO_FILE: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().console_log_to_file, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Loguer la console dans un fichier', true);

        // MAX_VarsProcessDeployDeps ?: number;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().max_varsprocessdeploydeps, ModuleTableFieldVO.FIELD_TYPE_int, 'Max VarsProcess DeployDeps', false);
        // MAX_VarsProcessLoadDatas ?: number;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().max_varsprocessloaddatas, ModuleTableFieldVO.FIELD_TYPE_int, 'Max VarsProcess LoadDatas', false);
        // MAX_Vars_invalidators ?: number;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().max_vars_invalidators, ModuleTableFieldVO.FIELD_TYPE_int, 'Max Vars invalidators', false);

        // MAX_SIZE_PER_QUERY ?: number;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().max_size_per_query, ModuleTableFieldVO.FIELD_TYPE_int, 'Max size per query', false);
        // MAX_UNION_ALL_PER_QUERY ?: number;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().max_union_all_per_query, ModuleTableFieldVO.FIELD_TYPE_int, 'Max union all per query', false);

        // MUTE__NO_SORT_BY_BUT_QUERY_LIMIT ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().mute__no_sort_by_but_query_limit, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Mute no sort by but query limit', true);

        // DEBUG_SLOW_QUERIES_MS_LIMIT ?: number;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_slow_queries_ms_limit, ModuleTableFieldVO.FIELD_TYPE_int, 'Debug slow queries ms limit', false);
        // DEBUG_SLOW_QUERIES ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_slow_queries, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug slow queries', true);
        // DEBUG_PARAM_QUERIES ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_param_queries, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug param queries', true);
        // DEBUG_DB_QUERY_PERF ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_db_query_perf, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug DB query perf', true);
        // DEBUG_DB_QUERY_add_activated_many_to_many ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_db_query_add_activated_many_to_many, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug DB query add activated many to many', true);
        // DEBUG_convert_varparamfields_to_vardatas ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_convert_varparamfields_to_vardatas, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug convert varparamfields to vardatas', true);
        // DEBUG_FORKS ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_forks, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug forks', true);
        // DEBUG_VARS ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_vars, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug vars', true);
        // DEBUG_VARS_PROCESSES ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_vars_processes, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug vars processes', true);
        // DEBUG_VARS_INVALIDATION ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_vars_invalidation, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug vars invalidation', true);
        // DEBUG_VARS_CURRENT_TREE ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_vars_current_tree, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug vars current tree', true);
        // DEBUG_VARS_DB_PARAM_BUILDER ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_vars_db_param_builder, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug vars DB param builder', true);
        // DEBUG_VARS_SERVER_SUBS_CBS ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_vars_server_subs_cbs, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug vars server subs cbs', true);
        // DEBUG_START_SERVER ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_start_server, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug start server', true);
        // DEBUG_IMPORTS ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_imports, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug imports', true);
        // DEBUG_EXPORTS ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_exports, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug exports', true);
        // DEBUG_DELETEVOS ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_deletevos, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug deletevos', true);
        // DEBUG_THROTTLED_SELECT ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_throttled_select, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug throttled select', true);
        // DEBUG_SELECT_DATATABLE_ROWS_query_res ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_select_datatable_rows_query_res, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug select datatable rows query res', true);
        // DEBUG_DB_FULL_QUERY_PERF ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_db_full_query_perf, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug DB full query perf', true);
        // DEBUG_INTERTHREADS_MESSAGES ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_interthreads_messages, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug interthreads messages', true);
        // DEBUG_IO_ROOMS ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_io_rooms, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug IO rooms', true);
        // DEBUG_VO_EVENTS ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_vo_events, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug VO events', true);

        // DEBUG_PROMISE_PIPELINE ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_promise_pipeline, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug promise pipeline', true);
        // DEBUG_PROMISE_PIPELINE_WORKER_STATS ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_promise_pipeline_worker_stats, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug promise pipeline worker stats', true);

        // DEBUG_AZURE_MEMORY_CHECK ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_azure_memory_check, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug azure memory check', true);

        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_throttle_uid, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug current Throttle UID', true, true, false);

        // DEBUG_CONTEXT_QUERY_build_select_query_not_count ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_context_query_build_select_query_not_count, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug context query build select query not count', true);
        // DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_DATAS ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_export_context_query_to_xlsx_datas, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug export context query to xlsx datas', true);
        // DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_DATAS_WITH_VARS ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_export_context_query_to_xlsx_datas_with_vars, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug export context query to xlsx datas with vars', true);
        // DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_TRANSLATED_DATAS ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_export_context_query_to_xlsx_translated_datas, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug export context query to xlsx translated datas', true);
        // DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_XLSX_DATAS ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_export_context_query_to_xlsx_xlsx_datas, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug export context query to xlsx xlsx datas', true);

        // START_MAINTENANCE_ACCEPTATION_CODE: string;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().start_maintenance_acceptation_code, ModuleTableFieldVO.FIELD_TYPE_string, 'Code d\'acceptation de la maintenance', true);
        // AUTO_END_MAINTENANCE_ON_START: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().auto_end_maintenance_on_start, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Fin automatique de la maintenance au démarrage', true);
        // CODE_GOOGLE_ANALYTICS: string;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().code_google_analytics, ModuleTableFieldVO.FIELD_TYPE_string, 'Code Google Analytics', true);
        // LAUNCH_INIT ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().launch_init, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Lancer l\'init', true);
        // ACTIVATE_PWA: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().activate_pwa, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Activer PWA', true);
        // RETRY_FAILED_FAST_TRACK_IMPORTS_WITH_NORMAL_IMPORTATION ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().retry_failed_fast_track_imports_with_normal_importation, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Réessayer les imports fast track avec les imports normaux', true);
        // ZOOM_AUTO ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().zoom_auto, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Zoom auto', true);

        // IS_MAIN_PROD_ENV: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().is_main_prod_env, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Environnement principal', true);

        // OPEN_API_API_KEY ?: string;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().open_api_api_key, ModuleTableFieldVO.FIELD_TYPE_string, 'Clé API Open API', false);

        // TEAMS Webhooks
        // public teams_webhook_send_message?: string = null;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().teams_webhook_send_message, ModuleTableFieldVO.FIELD_TYPE_string, 'URL Webhook Teams pour envoyer des messages', false);
        // public teams_webhook_update_message?: string = null;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().teams_webhook_update_message, ModuleTableFieldVO.FIELD_TYPE_string, 'URL Webhook Teams pour mettre à jour des messages', false);

        // Organisations
        // public teams_groupid__oselia?: string = null;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().teams_groupid__oselia, ModuleTableFieldVO.FIELD_TYPE_string, 'ID du groupe Teams Oselia', false);
        // public teams_groupid__tech?: string = null;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().teams_groupid__tech, ModuleTableFieldVO.FIELD_TYPE_string, 'ID du groupe Teams Tech', false);

        // Channels
        // public teams_channelid__oselia_error?: string = null;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().teams_channelid__oselia_error, ModuleTableFieldVO.FIELD_TYPE_string, 'ID du channel Teams pour les erreurs Oselia', false);
        // public teams_channelid__oselia_warn?: string = null;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().teams_channelid__oselia_warn, ModuleTableFieldVO.FIELD_TYPE_string, 'ID du channel Teams pour les warnings Oselia', false);
        // public teams_channelid__oselia_info?: string = null;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().teams_channelid__oselia_info, ModuleTableFieldVO.FIELD_TYPE_string, 'ID du channel Teams pour les infos Oselia', false);
        // public teams_channelid__oselia_success?: string = null;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().teams_channelid__oselia_success, ModuleTableFieldVO.FIELD_TYPE_string, 'ID du channel Teams pour les succès Oselia', false);
        // public teams_channelid__oselia_action_needed?: string = null;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().teams_channelid__oselia_action_needed, ModuleTableFieldVO.FIELD_TYPE_string, 'ID du channel Teams pour les actions nécessaires Oselia', false);

        // public teams_channelid__tech_error?: string = null;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().teams_channelid__tech_error, ModuleTableFieldVO.FIELD_TYPE_string, 'ID du channel Teams pour les erreurs techniques', false);
        // public teams_channelid__tech_warn?: string = null;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().teams_channelid__tech_warn, ModuleTableFieldVO.FIELD_TYPE_string, 'ID du channel Teams pour les warnings techniques', false);
        // public teams_channelid__tech_info?: string = null;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().teams_channelid__tech_info, ModuleTableFieldVO.FIELD_TYPE_string, 'ID du channel Teams pour les infos techniques', false);
        // public teams_channelid__tech_success?: string = null;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().teams_channelid__tech_success, ModuleTableFieldVO.FIELD_TYPE_string, 'ID du channel Teams pour les succès techniques', false);

        // public teams_throttle_ms?: number = 15000;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().teams_throttle_ms, ModuleTableFieldVO.FIELD_TYPE_int, 'Throttle Teams', false, true, 15000);
        // public teams_message_max_size?: number = 10000;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().teams_message_max_size, ModuleTableFieldVO.FIELD_TYPE_int, 'Taille max des messages Teams', false, true, 10000);
        // public teams_message_max_size_auto_summarize?: boolean = false;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().teams_message_max_size_auto_summarize, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Auto summarize Teams', false, true, false);

        // BLOCK_TEAMS_MESSAGES ?: boolean;
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().block_teams_messages, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Bloquer les messages Teams', true);

        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().logo_path, ModuleTableFieldVO.FIELD_TYPE_string, 'URL du logo');

        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_openai_sync, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug OpenAI Sync', true, true, true);
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_oselia_referrer_origin, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug Oselia Referrer Origin', true, true, false);
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_openai_generate_image, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug OpenAI Generate Image', true, true, false);

        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().block_openai_sync_push_to_openai, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Bloquer les push OpenAI', true, true, false);

        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().unblock_openai_push_to_openai_gpt_assistant_thread, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Débloquer les push OpenAI GPT Assistant Thread', true, true, false);
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().unblock_openai_push_to_openai_gpt_assistant_thread_msg, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Débloquer les push OpenAI GPT Assistant Thread Msg', true, true, false);
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().unblock_openai_push_to_openai_gpt_assistant_run, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Débloquer les push OpenAI GPT Assistant Run', true, true, false);
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().unblock_openai_push_to_openai_gpt_assistant, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Débloquer les push OpenAI GPT Assistant', true, true, false);

        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().silent_no_sort_by_but_query_limit, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Silent "no sort by but query limit"', true, true, true);

        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().debug_vars_notifs, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug Vars Notifs', true, true, false);
        ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().log_login_redirects, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Log Login Redirects', true, true, false);

        ModuleTableController.create_new(this.name, EnvParamsVO, null, 'Static Env Params');
    }
}
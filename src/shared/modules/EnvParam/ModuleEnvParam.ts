import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import String2ParamVO, { String2ParamVOStatic } from '../API/vos/apis/String2ParamVO';
import StringAndBooleanParamVO, { StringAndBooleanParamVOStatic } from '../API/vos/apis/StringAndBooleanParamVO';
import StringAndNumberParamVO, { StringAndNumberParamVOStatic } from '../API/vos/apis/StringAndNumberParamVO';
import ModuleAccessPolicy from '../AccessPolicy/ModuleAccessPolicy';
import Module from '../Module';
import ModuleTableVO from '../DAO/vos/ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import EnvParamsVO from './vos/EnvParamsVO';

export default class ModuleEnvParam extends Module {

    public static MODULE_NAME: string = 'EnvParam';

    public static APINAME_get_env_params: string = "get_env_params";

    public static APINAME_set_env_param_string: string = "set_env_param_string";
    public static APINAME_set_env_param_boolean: string = "set_env_param_boolean";
    public static APINAME_set_env_param_number: string = "set_env_param_number";

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleEnvParam {
        if (!ModuleEnvParam.instance) {
            ModuleEnvParam.instance = new ModuleEnvParam();
        }
        return ModuleEnvParam.instance;
    }

    private static instance: ModuleEnvParam = null;

    public set_env_param_string: (code: string, value: string) => Promise<boolean> = APIControllerWrapper.sah<String2ParamVO, boolean>(ModuleEnvParam.APINAME_set_env_param_string);
    public set_env_param_boolean: (code: string, value: boolean) => Promise<boolean> = APIControllerWrapper.sah<StringAndBooleanParamVO, boolean>(ModuleEnvParam.APINAME_set_env_param_boolean);
    public set_env_param_number: (code: string, value: number) => Promise<boolean> = APIControllerWrapper.sah<StringAndNumberParamVO, boolean>(ModuleEnvParam.APINAME_set_env_param_number);

    public get_env_params: () => Promise<EnvParamsVO> = APIControllerWrapper.sah<null, EnvParamsVO>(ModuleEnvParam.APINAME_get_env_params);

    private constructor() {

        super("env_param", ModuleEnvParam.MODULE_NAME);
        this.forceActivationOnInstallation();
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
        this.datatables = [];

        this.initializeEnvParamsVO();
    }

    private initializeEnvParamsVO() {

        const fields = [
            // APP_TITLE: string;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().APP_TITLE, ModuleTableFieldVO.FIELD_TYPE_string, 'Titre de l\'application', true),
            // CONNECTION_STRING: string;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().CONNECTION_STRING, ModuleTableFieldVO.FIELD_TYPE_string, 'Connection string', true),
            // PORT: string;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().PORT, ModuleTableFieldVO.FIELD_TYPE_string, 'Port', true),
            // ISDEV: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().ISDEV, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Dev', true),
            // DEFAULT_LOCALE: string;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEFAULT_LOCALE, ModuleTableFieldVO.FIELD_TYPE_string, 'Locale par défaut', true),
            // CODE_PAYS: string;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().CODE_PAYS, ModuleTableFieldVO.FIELD_TYPE_string, 'Code pays', true),
            // COMPRESS: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().COMPRESS, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Compresser', true),
            // URL_RECOVERY_CHALLENGE: string;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().URL_RECOVERY_CHALLENGE, ModuleTableFieldVO.FIELD_TYPE_string, 'URL de récupération du challenge', true),
            // URL_RECOVERY: string;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().URL_RECOVERY, ModuleTableFieldVO.FIELD_TYPE_string, 'URL de récupération', true),
            // BASE_URL: string;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().BASE_URL, ModuleTableFieldVO.FIELD_TYPE_string, 'URL de base', true),
            // BLOCK_MAIL_DELIVERY: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().BLOCK_MAIL_DELIVERY, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Bloquer les mails', true),
            // MAIL_DELIVERY_WHITELIST: string;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().MAIL_DELIVERY_WHITELIST, ModuleTableFieldVO.FIELD_TYPE_string, 'Whitelist des mails', true),
            // BDD_OWNER: string;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().BDD_OWNER, ModuleTableFieldVO.FIELD_TYPE_string, 'Propriétaire de la BDD', true),
            // NODE_VERBOSE: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().NODE_VERBOSE, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Verbose', true),
            // ACTIVATE_LONG_JOHN: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().ACTIVATE_LONG_JOHN, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Activer Long John', true),
            // MAX_POOL: number;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().MAX_POOL, ModuleTableFieldVO.FIELD_TYPE_int, 'Pool max', true),
            // MAX_NB_AUTO_UNION_IN_SELECT ?: number;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().MAX_NB_AUTO_UNION_IN_SELECT, ModuleTableFieldVO.FIELD_TYPE_int, 'Max auto union in select', false),
            // SERVER_START_BOOSTER: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().SERVER_START_BOOSTER, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Booster le démarrage du serveur', true),
            // SERVER_ENCODING: string;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().SERVER_ENCODING, ModuleTableFieldVO.FIELD_TYPE_string, 'Encodage du serveur', true),
            // CONSOLE_LOG_TO_FILE: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().CONSOLE_LOG_TO_FILE, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Loguer la console dans un fichier', true),

            // MAX_VarsProcessDeployDeps ?: number;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().MAX_VarsProcessDeployDeps, ModuleTableFieldVO.FIELD_TYPE_int, 'Max VarsProcess DeployDeps', false),
            // MAX_VarsProcessLoadDatas ?: number;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().MAX_VarsProcessLoadDatas, ModuleTableFieldVO.FIELD_TYPE_int, 'Max VarsProcess LoadDatas', false),
            // MAX_Vars_invalidators ?: number;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().MAX_Vars_invalidators, ModuleTableFieldVO.FIELD_TYPE_int, 'Max Vars invalidators', false),

            // MAX_SIZE_PER_QUERY ?: number;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().MAX_SIZE_PER_QUERY, ModuleTableFieldVO.FIELD_TYPE_int, 'Max size per query', false),
            // MAX_UNION_ALL_PER_QUERY ?: number;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().MAX_UNION_ALL_PER_QUERY, ModuleTableFieldVO.FIELD_TYPE_int, 'Max union all per query', false),

            // MUTE__NO_SORT_BY_BUT_QUERY_LIMIT ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().MUTE__NO_SORT_BY_BUT_QUERY_LIMIT, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Mute no sort by but query limit', true),

            // DEBUG_SLOW_QUERIES_MS_LIMIT ?: number;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_SLOW_QUERIES_MS_LIMIT, ModuleTableFieldVO.FIELD_TYPE_int, 'Debug slow queries ms limit', false),
            // DEBUG_SLOW_QUERIES ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_SLOW_QUERIES, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug slow queries', true),
            // DEBUG_PARAM_QUERIES ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_PARAM_QUERIES, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug param queries', true),
            // DEBUG_DB_QUERY_PERF ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_DB_QUERY_PERF, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug DB query perf', true),
            // DEBUG_DB_QUERY_add_activated_many_to_many ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_DB_QUERY_add_activated_many_to_many, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug DB query add activated many to many', true),
            // DEBUG_convert_varparamfields_to_vardatas ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_convert_varparamfields_to_vardatas, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug convert varparamfields to vardatas', true),
            // DEBUG_FORKS ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_FORKS, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug forks', true),
            // DEBUG_VARS ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_VARS, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug vars', true),
            // DEBUG_VARS_PROCESSES ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_VARS_PROCESSES, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug vars processes', true),
            // DEBUG_VARS_INVALIDATION ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_VARS_INVALIDATION, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug vars invalidation', true),
            // DEBUG_VARS_CURRENT_TREE ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_VARS_CURRENT_TREE, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug vars current tree', true),
            // DEBUG_VARS_DB_PARAM_BUILDER ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_VARS_DB_PARAM_BUILDER, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug vars DB param builder', true),
            // DEBUG_VARS_SERVER_SUBS_CBS ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_VARS_SERVER_SUBS_CBS, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug vars server subs cbs', true),
            // DEBUG_START_SERVER ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_START_SERVER, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug start server', true),
            // DEBUG_IMPORTS ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_IMPORTS, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug imports', true),
            // DEBUG_EXPORTS ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_EXPORTS, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug exports', true),
            // DEBUG_DELETEVOS ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_DELETEVOS, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug deletevos', true),
            // DEBUG_THROTTLED_SELECT ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_THROTTLED_SELECT, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug throttled select', true),
            // DEBUG_SELECT_DATATABLE_ROWS_query_res ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_SELECT_DATATABLE_ROWS_query_res, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug select datatable rows query res', true),
            // DEBUG_DB_FULL_QUERY_PERF ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_DB_FULL_QUERY_PERF, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug DB full query perf', true),
            // DEBUG_INTERTHREADS_MESSAGES ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_INTERTHREADS_MESSAGES, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug interthreads messages', true),
            // DEBUG_IO_ROOMS ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_IO_ROOMS, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug IO rooms', true),
            // DEBUG_VO_EVENTS ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_VO_EVENTS, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug VO events', true),

            // DEBUG_PROMISE_PIPELINE ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_PROMISE_PIPELINE, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug promise pipeline', true),
            // DEBUG_PROMISE_PIPELINE_WORKER_STATS ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_PROMISE_PIPELINE_WORKER_STATS, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug promise pipeline worker stats', true),

            // DEBUG_AZURE_MEMORY_CHECK ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_AZURE_MEMORY_CHECK, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug azure memory check', true),

            // DEBUG_CONTEXT_QUERY_build_select_query_not_count ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_CONTEXT_QUERY_build_select_query_not_count, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug context query build select query not count', true),
            // DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_DATAS ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_DATAS, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug export context query to xlsx datas', true),
            // DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_DATAS_WITH_VARS ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_DATAS_WITH_VARS, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug export context query to xlsx datas with vars', true),
            // DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_TRANSLATED_DATAS ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_TRANSLATED_DATAS, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug export context query to xlsx translated datas', true),
            // DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_XLSX_DATAS ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_XLSX_DATAS, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debug export context query to xlsx xlsx datas', true),

            // START_MAINTENANCE_ACCEPTATION_CODE: string;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().START_MAINTENANCE_ACCEPTATION_CODE, ModuleTableFieldVO.FIELD_TYPE_string, 'Code d\'acceptation de la maintenance', true),
            // AUTO_END_MAINTENANCE_ON_START: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().AUTO_END_MAINTENANCE_ON_START, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Fin automatique de la maintenance au démarrage', true),
            // CODE_GOOGLE_ANALYTICS: string;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().CODE_GOOGLE_ANALYTICS, ModuleTableFieldVO.FIELD_TYPE_string, 'Code Google Analytics', true),
            // LAUNCH_INIT ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().LAUNCH_INIT, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Lancer l\'init', true),
            // ACTIVATE_PWA: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().ACTIVATE_PWA, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Activer PWA', true),
            // RETRY_FAILED_FAST_TRACK_IMPORTS_WITH_NORMAL_IMPORTATION ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().RETRY_FAILED_FAST_TRACK_IMPORTS_WITH_NORMAL_IMPORTATION, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Réessayer les imports fast track avec les imports normaux', true),
            // ZOOM_AUTO ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().ZOOM_AUTO, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Zoom auto', true),

            // IS_MAIN_PROD_ENV: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().IS_MAIN_PROD_ENV, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Environnement principal', true),

            // OPEN_API_API_KEY ?: string;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().OPEN_API_API_KEY, ModuleTableFieldVO.FIELD_TYPE_string, 'Clé API Open API', false),

            // TEAMS_WEBHOOK__TECH_ERROR ?: string;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().TEAMS_WEBHOOK__TECH_ERROR, ModuleTableFieldVO.FIELD_TYPE_string, 'Webhook Teams pour les erreurs techniques', false),
            // TEAMS_WEBHOOK__TECH_WARN ?: string;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().TEAMS_WEBHOOK__TECH_WARN, ModuleTableFieldVO.FIELD_TYPE_string, 'Webhook Teams pour les warnings techniques', false),
            // TEAMS_WEBHOOK__TECH_INFO ?: string;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().TEAMS_WEBHOOK__TECH_INFO, ModuleTableFieldVO.FIELD_TYPE_string, 'Webhook Teams pour les infos techniques', false),
            // TEAMS_WEBHOOK__TECH_SUCCESS ?: string;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().TEAMS_WEBHOOK__TECH_SUCCESS, ModuleTableFieldVO.FIELD_TYPE_string, 'Webhook Teams pour les succès techniques', false),

            // TEAMS_WEBHOOK__THROTTLE_MS ?: number;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().TEAMS_WEBHOOK__THROTTLE_MS, ModuleTableFieldVO.FIELD_TYPE_int, 'Throttle Teams', false),
            // TEAMS_WEBHOOK__MESSAGE_MAX_SIZE ?: number;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().TEAMS_WEBHOOK__MESSAGE_MAX_SIZE, ModuleTableFieldVO.FIELD_TYPE_int, 'Taille max des messages Teams', false),
            // TEAMS_WEBHOOK__MESSAGE_MAX_SIZE_AUTO_SUMMARIZE ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().TEAMS_WEBHOOK__MESSAGE_MAX_SIZE_AUTO_SUMMARIZE, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Auto summarize Teams', true),

            // BLOCK_TEAMS_MESSAGES ?: boolean;
            ModuleTableFieldController.create_new(EnvParamsVO.API_TYPE_ID, field_names<EnvParamsVO>().BLOCK_TEAMS_MESSAGES, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Bloquer les messages Teams', true),
        ];

        const table = new ModuleTableVO(this, EnvParamsVO.API_TYPE_ID, () => new EnvParamsVO(), fields, null, 'Static Env Params');
        this.datatables.push(table);
    }
}
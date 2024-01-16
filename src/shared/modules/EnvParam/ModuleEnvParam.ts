import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import String2ParamVO, { String2ParamVOStatic } from '../API/vos/apis/String2ParamVO';
import StringAndBooleanParamVO, { StringAndBooleanParamVOStatic } from '../API/vos/apis/StringAndBooleanParamVO';
import StringAndNumberParamVO, { StringAndNumberParamVOStatic } from '../API/vos/apis/StringAndNumberParamVO';
import ModuleAccessPolicy from '../AccessPolicy/ModuleAccessPolicy';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import EnvParamsVO from './vos/EnvParamsVO';

export default class ModuleEnvParam extends Module {

    public static MODULE_NAME: string = 'EnvParam';

    public static APINAME_get_env_params: string = "get_env_params";

    public static APINAME_set_env_param_string: string = "set_env_param_string";
    public static APINAME_set_env_param_boolean: string = "set_env_param_boolean";
    public static APINAME_set_env_param_number: string = "set_env_param_number";

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

        let fields = [
            // APP_TITLE: string;
            new ModuleTableField(field_names<EnvParamsVO>().APP_TITLE, ModuleTableField.FIELD_TYPE_string, 'Titre de l\'application', true),
            // CONNECTION_STRING: string;
            new ModuleTableField(field_names<EnvParamsVO>().CONNECTION_STRING, ModuleTableField.FIELD_TYPE_string, 'Connection string', true),
            // PORT: string;
            new ModuleTableField(field_names<EnvParamsVO>().PORT, ModuleTableField.FIELD_TYPE_string, 'Port', true),
            // ISDEV: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().ISDEV, ModuleTableField.FIELD_TYPE_boolean, 'Dev', true),
            // DEFAULT_LOCALE: string;
            new ModuleTableField(field_names<EnvParamsVO>().DEFAULT_LOCALE, ModuleTableField.FIELD_TYPE_string, 'Locale par défaut', true),
            // CODE_PAYS: string;
            new ModuleTableField(field_names<EnvParamsVO>().CODE_PAYS, ModuleTableField.FIELD_TYPE_string, 'Code pays', true),
            // COMPRESS: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().COMPRESS, ModuleTableField.FIELD_TYPE_boolean, 'Compresser', true),
            // URL_RECOVERY_CHALLENGE: string;
            new ModuleTableField(field_names<EnvParamsVO>().URL_RECOVERY_CHALLENGE, ModuleTableField.FIELD_TYPE_string, 'URL de récupération du challenge', true),
            // URL_RECOVERY: string;
            new ModuleTableField(field_names<EnvParamsVO>().URL_RECOVERY, ModuleTableField.FIELD_TYPE_string, 'URL de récupération', true),
            // BASE_URL: string;
            new ModuleTableField(field_names<EnvParamsVO>().BASE_URL, ModuleTableField.FIELD_TYPE_string, 'URL de base', true),
            // BLOCK_MAIL_DELIVERY: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().BLOCK_MAIL_DELIVERY, ModuleTableField.FIELD_TYPE_boolean, 'Bloquer les mails', true),
            // MAIL_DELIVERY_WHITELIST: string;
            new ModuleTableField(field_names<EnvParamsVO>().MAIL_DELIVERY_WHITELIST, ModuleTableField.FIELD_TYPE_string, 'Whitelist des mails', true),
            // BDD_OWNER: string;
            new ModuleTableField(field_names<EnvParamsVO>().BDD_OWNER, ModuleTableField.FIELD_TYPE_string, 'Propriétaire de la BDD', true),
            // NODE_VERBOSE: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().NODE_VERBOSE, ModuleTableField.FIELD_TYPE_boolean, 'Verbose', true),
            // ACTIVATE_LONG_JOHN: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().ACTIVATE_LONG_JOHN, ModuleTableField.FIELD_TYPE_boolean, 'Activer Long John', true),
            // MAX_POOL: number;
            new ModuleTableField(field_names<EnvParamsVO>().MAX_POOL, ModuleTableField.FIELD_TYPE_int, 'Pool max', true),
            // MAX_NB_AUTO_UNION_IN_SELECT ?: number;
            new ModuleTableField(field_names<EnvParamsVO>().MAX_NB_AUTO_UNION_IN_SELECT, ModuleTableField.FIELD_TYPE_int, 'Max auto union in select', false),
            // SERVER_START_BOOSTER: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().SERVER_START_BOOSTER, ModuleTableField.FIELD_TYPE_boolean, 'Booster le démarrage du serveur', true),
            // SERVER_ENCODING: string;
            new ModuleTableField(field_names<EnvParamsVO>().SERVER_ENCODING, ModuleTableField.FIELD_TYPE_string, 'Encodage du serveur', true),
            // CONSOLE_LOG_TO_FILE: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().CONSOLE_LOG_TO_FILE, ModuleTableField.FIELD_TYPE_boolean, 'Loguer la console dans un fichier', true),

            // MAX_VarsProcessDeployDeps ?: number;
            new ModuleTableField(field_names<EnvParamsVO>().MAX_VarsProcessDeployDeps, ModuleTableField.FIELD_TYPE_int, 'Max VarsProcess DeployDeps', false),
            // MAX_VarsProcessLoadDatas ?: number;
            new ModuleTableField(field_names<EnvParamsVO>().MAX_VarsProcessLoadDatas, ModuleTableField.FIELD_TYPE_int, 'Max VarsProcess LoadDatas', false),
            // MAX_Vars_invalidators ?: number;
            new ModuleTableField(field_names<EnvParamsVO>().MAX_Vars_invalidators, ModuleTableField.FIELD_TYPE_int, 'Max Vars invalidators', false),

            // MAX_SIZE_PER_QUERY ?: number;
            new ModuleTableField(field_names<EnvParamsVO>().MAX_SIZE_PER_QUERY, ModuleTableField.FIELD_TYPE_int, 'Max size per query', false),
            // MAX_UNION_ALL_PER_QUERY ?: number;
            new ModuleTableField(field_names<EnvParamsVO>().MAX_UNION_ALL_PER_QUERY, ModuleTableField.FIELD_TYPE_int, 'Max union all per query', false),

            // MUTE__NO_SORT_BY_BUT_QUERY_LIMIT ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().MUTE__NO_SORT_BY_BUT_QUERY_LIMIT, ModuleTableField.FIELD_TYPE_boolean, 'Mute no sort by but query limit', true),

            // DEBUG_SLOW_QUERIES_MS_LIMIT ?: number;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_SLOW_QUERIES_MS_LIMIT, ModuleTableField.FIELD_TYPE_int, 'Debug slow queries ms limit', false),
            // DEBUG_SLOW_QUERIES ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_SLOW_QUERIES, ModuleTableField.FIELD_TYPE_boolean, 'Debug slow queries', true),
            // DEBUG_PARAM_QUERIES ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_PARAM_QUERIES, ModuleTableField.FIELD_TYPE_boolean, 'Debug param queries', true),
            // DEBUG_DB_QUERY_PERF ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_DB_QUERY_PERF, ModuleTableField.FIELD_TYPE_boolean, 'Debug DB query perf', true),
            // DEBUG_DB_QUERY_add_activated_many_to_many ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_DB_QUERY_add_activated_many_to_many, ModuleTableField.FIELD_TYPE_boolean, 'Debug DB query add activated many to many', true),
            // DEBUG_convert_varparamfields_to_vardatas ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_convert_varparamfields_to_vardatas, ModuleTableField.FIELD_TYPE_boolean, 'Debug convert varparamfields to vardatas', true),
            // DEBUG_FORKS ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_FORKS, ModuleTableField.FIELD_TYPE_boolean, 'Debug forks', true),
            // DEBUG_VARS ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_VARS, ModuleTableField.FIELD_TYPE_boolean, 'Debug vars', true),
            // DEBUG_VARS_PROCESSES ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_VARS_PROCESSES, ModuleTableField.FIELD_TYPE_boolean, 'Debug vars processes', true),
            // DEBUG_VARS_INVALIDATION ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_VARS_INVALIDATION, ModuleTableField.FIELD_TYPE_boolean, 'Debug vars invalidation', true),
            // DEBUG_VARS_CURRENT_TREE ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_VARS_CURRENT_TREE, ModuleTableField.FIELD_TYPE_boolean, 'Debug vars current tree', true),
            // DEBUG_VARS_DB_PARAM_BUILDER ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_VARS_DB_PARAM_BUILDER, ModuleTableField.FIELD_TYPE_boolean, 'Debug vars DB param builder', true),
            // DEBUG_VARS_SERVER_SUBS_CBS ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_VARS_SERVER_SUBS_CBS, ModuleTableField.FIELD_TYPE_boolean, 'Debug vars server subs cbs', true),
            // DEBUG_START_SERVER ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_START_SERVER, ModuleTableField.FIELD_TYPE_boolean, 'Debug start server', true),
            // DEBUG_IMPORTS ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_IMPORTS, ModuleTableField.FIELD_TYPE_boolean, 'Debug imports', true),
            // DEBUG_EXPORTS ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_EXPORTS, ModuleTableField.FIELD_TYPE_boolean, 'Debug exports', true),
            // DEBUG_DELETEVOS ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_DELETEVOS, ModuleTableField.FIELD_TYPE_boolean, 'Debug deletevos', true),
            // DEBUG_THROTTLED_SELECT ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_THROTTLED_SELECT, ModuleTableField.FIELD_TYPE_boolean, 'Debug throttled select', true),
            // DEBUG_SELECT_DATATABLE_ROWS_query_res ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_SELECT_DATATABLE_ROWS_query_res, ModuleTableField.FIELD_TYPE_boolean, 'Debug select datatable rows query res', true),
            // DEBUG_DB_FULL_QUERY_PERF ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_DB_FULL_QUERY_PERF, ModuleTableField.FIELD_TYPE_boolean, 'Debug DB full query perf', true),
            // DEBUG_INTERTHREADS_MESSAGES ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_INTERTHREADS_MESSAGES, ModuleTableField.FIELD_TYPE_boolean, 'Debug interthreads messages', true),
            // DEBUG_IO_ROOMS ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_IO_ROOMS, ModuleTableField.FIELD_TYPE_boolean, 'Debug IO rooms', true),
            // DEBUG_VO_EVENTS ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_VO_EVENTS, ModuleTableField.FIELD_TYPE_boolean, 'Debug VO events', true),

            // DEBUG_PROMISE_PIPELINE ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_PROMISE_PIPELINE, ModuleTableField.FIELD_TYPE_boolean, 'Debug promise pipeline', true),
            // DEBUG_PROMISE_PIPELINE_WORKER_STATS ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_PROMISE_PIPELINE_WORKER_STATS, ModuleTableField.FIELD_TYPE_boolean, 'Debug promise pipeline worker stats', true),

            // DEBUG_AZURE_MEMORY_CHECK ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_AZURE_MEMORY_CHECK, ModuleTableField.FIELD_TYPE_boolean, 'Debug azure memory check', true),

            // DEBUG_CONTEXT_QUERY_build_select_query_not_count ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_CONTEXT_QUERY_build_select_query_not_count, ModuleTableField.FIELD_TYPE_boolean, 'Debug context query build select query not count', true),
            // DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_DATAS ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_DATAS, ModuleTableField.FIELD_TYPE_boolean, 'Debug export context query to xlsx datas', true),
            // DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_DATAS_WITH_VARS ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_DATAS_WITH_VARS, ModuleTableField.FIELD_TYPE_boolean, 'Debug export context query to xlsx datas with vars', true),
            // DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_TRANSLATED_DATAS ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_TRANSLATED_DATAS, ModuleTableField.FIELD_TYPE_boolean, 'Debug export context query to xlsx translated datas', true),
            // DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_XLSX_DATAS ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_XLSX_DATAS, ModuleTableField.FIELD_TYPE_boolean, 'Debug export context query to xlsx xlsx datas', true),

            // START_MAINTENANCE_ACCEPTATION_CODE: string;
            new ModuleTableField(field_names<EnvParamsVO>().START_MAINTENANCE_ACCEPTATION_CODE, ModuleTableField.FIELD_TYPE_string, 'Code d\'acceptation de la maintenance', true),
            // AUTO_END_MAINTENANCE_ON_START: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().AUTO_END_MAINTENANCE_ON_START, ModuleTableField.FIELD_TYPE_boolean, 'Fin automatique de la maintenance au démarrage', true),
            // CODE_GOOGLE_ANALYTICS: string;
            new ModuleTableField(field_names<EnvParamsVO>().CODE_GOOGLE_ANALYTICS, ModuleTableField.FIELD_TYPE_string, 'Code Google Analytics', true),
            // LAUNCH_INIT ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().LAUNCH_INIT, ModuleTableField.FIELD_TYPE_boolean, 'Lancer l\'init', true),
            // ACTIVATE_PWA: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().ACTIVATE_PWA, ModuleTableField.FIELD_TYPE_boolean, 'Activer PWA', true),
            // RETRY_FAILED_FAST_TRACK_IMPORTS_WITH_NORMAL_IMPORTATION ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().RETRY_FAILED_FAST_TRACK_IMPORTS_WITH_NORMAL_IMPORTATION, ModuleTableField.FIELD_TYPE_boolean, 'Réessayer les imports fast track avec les imports normaux', true),
            // ZOOM_AUTO ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().ZOOM_AUTO, ModuleTableField.FIELD_TYPE_boolean, 'Zoom auto', true),

            // IS_MAIN_PROD_ENV: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().IS_MAIN_PROD_ENV, ModuleTableField.FIELD_TYPE_boolean, 'Environnement principal', true),

            // OPEN_API_API_KEY ?: string;
            new ModuleTableField(field_names<EnvParamsVO>().OPEN_API_API_KEY, ModuleTableField.FIELD_TYPE_string, 'Clé API Open API', false),

            // TEAMS_WEBHOOK__TECH_ERROR ?: string;
            new ModuleTableField(field_names<EnvParamsVO>().TEAMS_WEBHOOK__TECH_ERROR, ModuleTableField.FIELD_TYPE_string, 'Webhook Teams pour les erreurs techniques', false),
            // TEAMS_WEBHOOK__TECH_WARN ?: string;
            new ModuleTableField(field_names<EnvParamsVO>().TEAMS_WEBHOOK__TECH_WARN, ModuleTableField.FIELD_TYPE_string, 'Webhook Teams pour les warnings techniques', false),
            // TEAMS_WEBHOOK__TECH_INFO ?: string;
            new ModuleTableField(field_names<EnvParamsVO>().TEAMS_WEBHOOK__TECH_INFO, ModuleTableField.FIELD_TYPE_string, 'Webhook Teams pour les infos techniques', false),
            // TEAMS_WEBHOOK__TECH_SUCCESS ?: string;
            new ModuleTableField(field_names<EnvParamsVO>().TEAMS_WEBHOOK__TECH_SUCCESS, ModuleTableField.FIELD_TYPE_string, 'Webhook Teams pour les succès techniques', false),

            // TEAMS_WEBHOOK__THROTTLE_MS ?: number;
            new ModuleTableField(field_names<EnvParamsVO>().TEAMS_WEBHOOK__THROTTLE_MS, ModuleTableField.FIELD_TYPE_int, 'Throttle Teams', false),
            // TEAMS_WEBHOOK__MESSAGE_MAX_SIZE ?: number;
            new ModuleTableField(field_names<EnvParamsVO>().TEAMS_WEBHOOK__MESSAGE_MAX_SIZE, ModuleTableField.FIELD_TYPE_int, 'Taille max des messages Teams', false),
            // TEAMS_WEBHOOK__MESSAGE_MAX_SIZE_AUTO_SUMMARIZE ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().TEAMS_WEBHOOK__MESSAGE_MAX_SIZE_AUTO_SUMMARIZE, ModuleTableField.FIELD_TYPE_boolean, 'Auto summarize Teams', true),

            // BLOCK_TEAMS_MESSAGES ?: boolean;
            new ModuleTableField(field_names<EnvParamsVO>().BLOCK_TEAMS_MESSAGES, ModuleTableField.FIELD_TYPE_boolean, 'Bloquer les messages Teams', true),
        ];

        let table = new ModuleTable(this, EnvParamsVO.API_TYPE_ID, () => new EnvParamsVO(), fields, null, 'Static Env Params');
        this.datatables.push(table);
    }
}
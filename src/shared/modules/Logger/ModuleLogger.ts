import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import UserVO from '../AccessPolicy/vos/UserVO';
import APIControllerWrapper from '../API/APIControllerWrapper';
import APIDefinition from '../API/vos/APIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import NumSegment from '../DataRender/vos/NumSegment';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import ParamsManager from '../Params/ParamsManager';
import LogTypeVO from './vos/LogTypeVO';
import LogVO from './vos/LogVO';

export default class ModuleLogger extends Module {

    public static MODULE_NAME: string = 'Logger';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleLogger.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleLogger.MODULE_NAME + '.BO_ACCESS';

    public static PARAM_LOGGER_CLEANER_MAX_NB_DAYS: string = ModuleLogger.MODULE_NAME + ".LOGGER_CLEANER_MAX_NB_DAYS";
    public static PARAM_LOGGER_LOG_TYPE_LOG: string = ModuleLogger.MODULE_NAME + ".LOGGER_LOG_TYPE_LOG";
    public static PARAM_LOGGER_LOG_TYPE_ERROR: string = ModuleLogger.MODULE_NAME + ".LOGGER_LOG_TYPE_ERROR";
    public static PARAM_LOGGER_LOG_TYPE_WARN: string = ModuleLogger.MODULE_NAME + ".LOGGER_LOG_TYPE_WARN";
    public static PARAM_LOGGER_LOG_TYPE_DEBUG: string = ModuleLogger.MODULE_NAME + ".LOGGER_LOG_TYPE_DEBUG";
    public static PARAM_LOGGER_LOG_TYPE_CLIENT_MAX: string = ModuleLogger.MODULE_NAME + ".LOGGER_LOG_TYPE_CLIENT_MAX";
    public static PARAM_LOGGER_LOG_TYPE_SERVER_MAX: string = ModuleLogger.MODULE_NAME + ".LOGGER_LOG_TYPE_SERVER_MAX";

    public static APINAME_addLogsClient: string = "addLogsClient";

    private static instance: ModuleLogger = null;

    public addLogsClient: (logs: LogVO[]) => Promise<void> = APIControllerWrapper.sah(ModuleLogger.APINAME_addLogsClient);

    private constructor() {
        super("logger", ModuleLogger.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleLogger {
        if (!ModuleLogger.instance) {
            ModuleLogger.instance = new ModuleLogger();
        }
        return ModuleLogger.instance;
    }

    public registerApis() {
        APIControllerWrapper.registerApi(new PostAPIDefinition<LogVO[], void>(
            null,
            ModuleLogger.APINAME_addLogsClient,
            [LogVO.API_TYPE_ID],
            null,
            APIDefinition.API_RETURN_TYPE_NOTIF,
        ));
    }

    public initialize() {
        ParamsManager.addPreloadParams([
            { param_name: ModuleLogger.PARAM_LOGGER_LOG_TYPE_LOG, type: ParamsManager.PRELOAD_PARAM_TYPE_INT },
            { param_name: ModuleLogger.PARAM_LOGGER_LOG_TYPE_ERROR, type: ParamsManager.PRELOAD_PARAM_TYPE_INT },
            { param_name: ModuleLogger.PARAM_LOGGER_LOG_TYPE_WARN, type: ParamsManager.PRELOAD_PARAM_TYPE_INT },
            { param_name: ModuleLogger.PARAM_LOGGER_LOG_TYPE_DEBUG, type: ParamsManager.PRELOAD_PARAM_TYPE_INT },
            { param_name: ModuleLogger.PARAM_LOGGER_LOG_TYPE_CLIENT_MAX, type: ParamsManager.PRELOAD_PARAM_TYPE_INT },
            { param_name: ModuleLogger.PARAM_LOGGER_LOG_TYPE_SERVER_MAX, type: ParamsManager.PRELOAD_PARAM_TYPE_INT },
        ]);

        this.initializeLogTypeVO();
        this.initializeLogVO();
    }

    private initializeLogTypeVO() {
        ModuleTableFieldController.create_new(LogTypeVO.API_TYPE_ID, field_names<LogTypeVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Type de log');

        ModuleTableController.create_new(this.name, LogTypeVO, null, LogTypeVO.API_TYPE_ID);
    }

    private initializeLogVO() {
        const log_type_id = ModuleTableFieldController.create_new(LogVO.API_TYPE_ID, field_names<LogVO>().log_type_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Type de log', true);
        const user_id = ModuleTableFieldController.create_new(LogVO.API_TYPE_ID, field_names<LogVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur');

        ModuleTableFieldController.create_new(LogVO.API_TYPE_ID, field_names<LogVO>().process_pid, ModuleTableFieldVO.FIELD_TYPE_int, 'PID du process');
        ModuleTableFieldController.create_new(LogVO.API_TYPE_ID, field_names<LogVO>().date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date', true).set_segmentation_type(TimeSegment.TYPE_MS).set_format_localized_time(true);
        ModuleTableFieldController.create_new(LogVO.API_TYPE_ID, field_names<LogVO>().msg, ModuleTableFieldVO.FIELD_TYPE_string, 'Message', true).index();
        ModuleTableFieldController.create_new(LogVO.API_TYPE_ID, field_names<LogVO>().client_tab_id, ModuleTableFieldVO.FIELD_TYPE_string, 'Tab client');
        ModuleTableFieldController.create_new(LogVO.API_TYPE_ID, field_names<LogVO>().url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL');

        ModuleTableController.create_new(this.name, LogVO, null, LogVO.API_TYPE_ID);

        log_type_id.set_many_to_one_target_moduletable_name(LogTypeVO.API_TYPE_ID);
        user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);

        ModuleTableController.module_tables_by_vo_type[LogVO.API_TYPE_ID].segment_on_field(field_names<LogVO>().log_type_id, NumSegment.TYPE_INT);
    }
}
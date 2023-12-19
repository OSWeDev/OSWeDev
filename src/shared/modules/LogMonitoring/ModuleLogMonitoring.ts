import TimeSegment from '../DataRender/vos/TimeSegment';
import ModuleTableField from '../ModuleTableField';
import ModuleTable from '../ModuleTable';
import FileVO from './vos/FileVO';
import LogVO from './vos/LogVO';
import Module from '../Module';
import LogMonitoringFiles, { LogMonitoringFilesStatic } from './api/LogMonitoringFiles';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import APIControllerWrapper from '../API/APIControllerWrapper';

export default class ModuleLogMonitoring extends Module {

    public static MODULE_NAME: string = 'LogMonitoring';

    // -- HTTP APIS --
    public static APINAME_query_log_files: string = "modulelogmonitoring_query_lo_files";

    // -- SOCKET APIS --
    public static SOCKET_APINAME_server_logs_rows: string = "server:app_logs_rows";   // From the server to the client
    public static SOCKET_APINAME_client_logs_query: string = "client:app_logs_query"; // From the client to the server (update the context_query to load the logs)

    public static getInstance(): ModuleLogMonitoring {
        if (!ModuleLogMonitoring.instance) {
            ModuleLogMonitoring.instance = new ModuleLogMonitoring();
        }

        return ModuleLogMonitoring.instance;
    }

    private static instance: ModuleLogMonitoring = null;

    public query_log_files: () => Promise<FileVO[]> = APIControllerWrapper.sah<LogMonitoringFiles, FileVO[]>(
        ModuleLogMonitoring.APINAME_query_log_files
    );

    private constructor() {
        super("logmonitoring", ModuleLogMonitoring.MODULE_NAME);

        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.initializeFileVO();
        this.initializeLogVO();
    }

    public registerApis() {
        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<LogMonitoringFiles, FileVO[]>(
            null,
            ModuleLogMonitoring.APINAME_query_log_files,
            null,
            LogMonitoringFilesStatic
        ));
    }

    private initializeLogVO() {
        const datatable_fields = [
            new ModuleTableField('date', ModuleTableField.FIELD_TYPE_tstz, 'Date', true).set_segmentation_type(TimeSegment.TYPE_SECOND),
            new ModuleTableField('message', ModuleTableField.FIELD_TYPE_string, 'Message du log', true),
            new ModuleTableField('level', ModuleTableField.FIELD_TYPE_string, 'Sévérité du log', true),
            new ModuleTableField('filename', ModuleTableField.FIELD_TYPE_string, 'Nom du fichier', true),
        ];
        const datatable = new ModuleTable(this, LogVO.API_TYPE_ID, () => new LogVO(), datatable_fields, null, "App Logs");

        this.datatables.push(datatable);
    }

    private initializeFileVO() {
        const datatable_fields = [
            new ModuleTableField('created_at', ModuleTableField.FIELD_TYPE_tstz, 'Date de creation', true).set_segmentation_type(TimeSegment.TYPE_SECOND),
            new ModuleTableField('updated_at', ModuleTableField.FIELD_TYPE_tstz, 'Date de dernière modification', true).set_segmentation_type(TimeSegment.TYPE_SECOND),
            new ModuleTableField('filename', ModuleTableField.FIELD_TYPE_string, 'Nom du fichier', true),
            new ModuleTableField('size', ModuleTableField.FIELD_TYPE_int, 'Taille du fichier', true),
            new ModuleTableField('path', ModuleTableField.FIELD_TYPE_string, 'Chemin d\'accès au fichier', true),
        ];
        const datatable = new ModuleTable(this, FileVO.API_TYPE_ID, () => new FileVO(), datatable_fields, null, "App Logs Files");

        this.datatables.push(datatable);
    }
}
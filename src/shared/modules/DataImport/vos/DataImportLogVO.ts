import IDistantVOBase from '../../IDistantVOBase';

export default class DataImportLogVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "data_import_log";

    public static LOG_LEVEL_LABELS: string[] = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"];
    public static LOG_LEVEL_DEBUG: number = 0;
    public static LOG_LEVEL_INFO: number = 1;
    public static LOG_LEVEL_WARN: number = 2;
    public static LOG_LEVEL_ERROR: number = 3;
    public static LOG_LEVEL_FATAL: number = 4;

    public id: number;
    public _type: string = DataImportLogVO.API_TYPE_ID;

    public data_import_file_id: number;
    public data_import_historic_id: number;

    public date: string;
    public log_level: number;

    // Uses code_text if defined or message if not
    public code_text: string;
    public message: string;
}
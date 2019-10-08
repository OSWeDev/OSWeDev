import IDistantVOBase from '../../IDistantVOBase';
import { Moment } from 'moment';

export default class DataImportLogVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "dil";

    public static LOG_LEVEL_LABELS: string[] = [
        "import.logs.lvl.DEBUG",
        "import.logs.lvl.INFO",
        "import.logs.lvl.SUCCESS",
        "import.logs.lvl.WARN",
        "import.logs.lvl.ERROR",
        "import.logs.lvl.FATAL"];
    public static LOG_LEVEL_DEBUG: number = 0;
    public static LOG_LEVEL_INFO: number = 1;
    public static LOG_LEVEL_SUCCESS: number = 2;
    public static LOG_LEVEL_WARN: number = 3;
    public static LOG_LEVEL_ERROR: number = 4;
    public static LOG_LEVEL_FATAL: number = 5;

    public id: number;
    public _type: string = DataImportLogVO.API_TYPE_ID;

    public api_type_id: string;

    public data_import_format_id: number;
    public data_import_historic_id: number;

    public date: Moment;
    public log_level: number;

    // Uses code_text if defined or message if not
    public code_text: string;
    public message: string;
}
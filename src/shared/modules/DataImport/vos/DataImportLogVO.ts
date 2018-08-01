import IDistantVOBase from '../../IDistantVOBase';
import ConversionHandler from '../../../tools/ConversionHandler';
import DateHandler from '../../../tools/DateHandler';
import * as moment from 'moment';

export default class DataImportLogVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "data_import_log";

    public static LOG_LEVEL_0_DEBUG: string = "DEBUG";
    public static LOG_LEVEL_10_INFO: string = "INFO";
    public static LOG_LEVEL_25_WARN: string = "WARN";
    public static LOG_LEVEL_50_ERROR: string = "ERROR";
    public static LOG_LEVEL_100_FATAL: string = "FATAL";

    public id: number;
    public _type: string = DataImportLogVO.API_TYPE_ID;

    public data_import_file_id: number;
    public data_import_historic_id: number;

    public date: string;
    public log_level: string;
    public message: string;
}
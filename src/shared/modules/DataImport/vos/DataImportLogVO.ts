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

    // Pour forcer les numériques à court terme
    public static forceNumeric(e: DataImportLogVO): DataImportLogVO {
        if (!e) {
            return null;
        }

        e.data_import_file_id = ConversionHandler.forceNumber(e.data_import_file_id);
        e.data_import_historic_id = ConversionHandler.forceNumber(e.data_import_historic_id);
        e.id = ConversionHandler.forceNumber(e.id);

        e._type = DataImportLogVO.API_TYPE_ID;

        return e;
    }

    public static forceNumerics(es: DataImportLogVO[]): DataImportLogVO[] {
        for (let i in es) {
            es[i] = DataImportLogVO.forceNumeric(es[i]);
        }
        return es;
    }

    public id: number;
    public _type: string = DataImportLogVO.API_TYPE_ID;

    public data_import_file_id: number;
    public data_import_historic_id: number;

    public date: string;
    public log_level: string;
    public message: string;
}
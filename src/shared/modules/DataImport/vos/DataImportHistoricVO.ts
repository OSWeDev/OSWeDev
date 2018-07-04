import IDistantVOBase from '../../IDistantVOBase';
import ConversionHandler from '../../../tools/ConversionHandler';
import DateHandler from '../../../tools/DateHandler';
import * as moment from 'moment';

export default class DataImportHistoricVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "data_import_historic";

    public static IMPORT_STATE_STARTED: number = 0;
    public static IMPORT_STATE_OK: number = 1;
    public static IMPORT_STATE_NODATA: number = 5;
    public static IMPORT_STATE_FAILED: number = 10;
    public static IMPORT_STATE_POSTTRAITMENT_FAILED: number = 20;

    public static FAILED_HTML_STATUS: number = 500;

    // Pour forcer les numériques à court terme
    public static forceNumeric(e: DataImportHistoricVO): DataImportHistoricVO {
        if (!e) {
            return null;
        }

        e.data_import_file_id = ConversionHandler.getInstance().forceNumber(e.data_import_file_id);
        e.state = ConversionHandler.getInstance().forceNumber(e.state);
        e.id = ConversionHandler.getInstance().forceNumber(e.id);

        e._type = DataImportHistoricVO.API_TYPE_ID;

        return e;
    }

    public static forceNumerics(es: DataImportHistoricVO[]): DataImportHistoricVO[] {
        for (let i in es) {
            es[i] = DataImportHistoricVO.forceNumeric(es[i]);
        }
        return es;
    }

    public id: number;
    public _type: string = DataImportHistoricVO.API_TYPE_ID;

    public data_import_file_id: number;

    public start_date: string;
    public end_date: string;
    public target_date: string;
    public last_up_date: string;

    public state: number;

    public filepath: string;
}
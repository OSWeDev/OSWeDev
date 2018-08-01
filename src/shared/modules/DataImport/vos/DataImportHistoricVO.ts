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
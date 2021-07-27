import IDistantVOBase from '../../IDistantVOBase';
import ConversionHandler from '../../../tools/ConversionHandler';
import DateHandler from '../../../tools/DateHandler';


export default class DataRenderingLogVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "data_rendering_log";

    public static RENDERING_STATE_STARTED: number = 0;
    public static RENDERING_STATE_OK: number = 1;
    public static RENDERING_STATE_FAILED: number = 10;

    public static FAILED_HTML_STATUS: number = 500;

    public id: number;
    public _type: string = DataRenderingLogVO.API_TYPE_ID;

    public rendered_api_type_id: number;
    public date: string;
    public state: number;
    public message: string;
    public data_time_segment_json: string;
}
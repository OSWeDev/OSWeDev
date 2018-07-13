import IDistantVOBase from '../../IDistantVOBase';
import ConversionHandler from '../../../tools/ConversionHandler';
import DateHandler from '../../../tools/DateHandler';
import * as moment from 'moment';

export default class DataRenderingLogVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "module_data_rendering_log";

    public static RENDERING_STATE_STARTED: number = 0;
    public static RENDERING_STATE_OK: number = 1;
    public static RENDERING_STATE_FAILED: number = 10;

    public static FAILED_HTML_STATUS: number = 500;

    // Pour forcer les numériques à court terme
    public static forceNumeric(e: DataRenderingLogVO): DataRenderingLogVO {
        if (!e) {
            return null;
        }

        e.state = ConversionHandler.getInstance().forceNumber(e.state);
        e.id = ConversionHandler.getInstance().forceNumber(e.id);
        e.rendered_api_type_id = ConversionHandler.getInstance().forceNumber(e.rendered_api_type_id);

        e._type = DataRenderingLogVO.API_TYPE_ID;

        return e;
    }

    public static forceNumerics(es: DataRenderingLogVO[]): DataRenderingLogVO[] {
        for (let i in es) {
            es[i] = DataRenderingLogVO.forceNumeric(es[i]);
        }
        return es;
    }

    public id: number;
    public _type: string = DataRenderingLogVO.API_TYPE_ID;

    public rendered_api_type_id: number;
    public date: string;
    public state: number;
    public message: string;
    public data_time_segment_json: string;
}
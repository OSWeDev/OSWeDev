import { Moment } from 'moment';
import * as moment from 'moment';
import DateHandler from '../../../../tools/DateHandler';

export default class DayParamVO {

    public static URL: string = ':day';

    public static async translateCheckAccessParams(
        day: Moment): Promise<DayParamVO> {

        return new DayParamVO(day);
    }

    public static async translateToURL(param: DayParamVO): Promise<string> {

        return param ? DateHandler.getInstance().formatDayForApi(param.day) : '';
    }
    public static async translateFromREQ(req): Promise<DayParamVO> {

        if (!(req && req.params)) {
            return null;
        }
        return new DayParamVO(moment(req.params.day).utc(true));
    }

    public constructor(
        public day: Moment) {
    }
}
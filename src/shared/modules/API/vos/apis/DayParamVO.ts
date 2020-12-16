import * as moment from 'moment';
import { Moment } from 'moment';
import DateHandler from '../../../../tools/DateHandler';
import IAPIParamTranslator from '../../interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../interfaces/IAPIParamTranslatorStatic';

export default class DayParamVO implements IAPIParamTranslator<DayParamVO>{

    public static URL: string = ':day';

    public static fromREQ(req): DayParamVO {

        if (!(req && req.params)) {
            return null;
        }
        return new DayParamVO(moment(req.params.day).utc(true));
    }

    public static fromParams(day: Moment): DayParamVO {

        return new DayParamVO(day);
    }

    public constructor(
        public day: Moment) {
    }

    public translateToURL(): string {

        return DateHandler.getInstance().formatDayForApi(this.day);
    }

    public getAPIParams(): any[] {
        return [this.day];
    }
}

export const DayParamVOStatic: IAPIParamTranslatorStatic<DayParamVO> = DayParamVO;
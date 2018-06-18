import * as moment from 'moment';
import { Moment, unitOfTime } from "moment";
import DateHandler from './DateHandler';

export default class PeriodHandler {

    public static getInstance(): PeriodHandler {
        if (!PeriodHandler.instance) {
            PeriodHandler.instance = new PeriodHandler();
        }
        return PeriodHandler.instance;
    }

    private static instance: PeriodHandler = null;

    private constructor() {
    }

    public lower(period: string, base: unitOfTime.Base = 'days'): string {

        return DateHandler.getInstance().formatDayForIndex(this.lowerMoment(period, base));
    }

    public lowerMoment(period: string, base: unitOfTime.Base = 'days'): Moment {

        let split = this.split(period);

        return (split[1] == '[') ? moment(split[2]) : moment(split[2]).add(1, base);
    }

    public split(period: string): string[] {
        let regexpPeriod = /(\(|\[)(.*),(.*)(\)|\])/i;
        let res = period.match(regexpPeriod);

        if (res[2] == "") {
            res[2] = "1900-01-01";
        }

        if (res[3] == "") {
            res[3] = "2100-01-01";
        }

        return res;
    }

    public upper(period: string, base: unitOfTime.Base = 'days'): string {

        return DateHandler.getInstance().formatDayForIndex(this.upperMoment(period, base));
    }

    public upperMoment(period: string, base: unitOfTime.Base = 'days'): Moment {

        let split = this.split(period);

        return (split[4] == ']') ? moment(split[3]) : moment(split[3]).add(-1, base);
    }
}
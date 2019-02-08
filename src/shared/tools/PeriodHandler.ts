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

        if ((!split[2]) || (split[2] == '')) {
            return null;
        }

        return (split[1] == '[') ? moment(split[2]) : moment(split[2]).add(1, base);
    }

    public split(period: string, return_null_values: boolean = false): string[] {
        let regexpPeriod = /(\(|\[)(.*),(.*)(\)|\])/i;
        let res = period.match(regexpPeriod);

        if (res[2] == "") {
            res[2] = return_null_values ? null : "1900-01-01";
        }

        if (res[3] == "") {
            res[3] = return_null_values ? null : "2100-01-01";
        }

        return res;
    }

    public upper(period: string, base: unitOfTime.Base = 'days'): string {

        return DateHandler.getInstance().formatDayForIndex(this.upperMoment(period, base));
    }

    public upperMoment(period: string, base: unitOfTime.Base = 'days'): Moment {

        let split = this.split(period);

        if ((!split[3]) || (split[3] == '')) {
            return null;
        }

        return (split[4] == ']') ? moment(split[3]) : moment(split[3]).add(-1, base);
    }

    public hasUpper(period: string, base: unitOfTime.Base = 'days'): boolean {

        let split = this.split(period, true);

        return !((!split[3]) || (split[3] == ''));
    }

    public hasLower(period: string, base: unitOfTime.Base = 'days'): boolean {

        let split = this.split(period, true);

        return !((!split[2]) || (split[2] == ''));
    }

    public isDateInPeriod(date: Moment, period: string, base: unitOfTime.Base = 'days'): boolean {
        let lower: Moment = this.lowerMoment(period, base);
        let upper: Moment = this.upperMoment(period, base);

        return (!!date) && (!!lower) && (!!upper) && (date.isSameOrAfter(lower) && date.isBefore(upper));
    }
}

import { Moment, unitOfTime } from "moment";
import moment from 'moment';
import TSRange from '../modules/DataRender/vos/TSRange';
import DateHandler from './DateHandler';
import TimeSegmentHandler from './TimeSegmentHandler';

export default class PeriodHandler {


    /** istanbul ignore next: nothing to test here */
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

        const m = this.lowerMoment(period, base);
        if (!m) {
            return null;
        }
        return DateHandler.getInstance().formatDayForIndex(m.unix());
    }

    public lowerMoment(period: string, base: unitOfTime.Base = 'days'): Moment {
        const split = this.split(period);

        if ((!split) || (!split[2]) || (split[2] == '')) {
            return null;
        }

        return (split[1] == '[') ? moment(split[2]).utc(true) : moment(split[2]).utc(true).add(1, base);
    }

    public split(period: string, return_null_values: boolean = false): string[] {
        const regexpPeriod = /(\(|\[)(.*),(.*)(\)|\])/i;
        const res = (period) ? period.match(regexpPeriod) : null;

        if (!res) {
            return null;
        }

        if (res[2] == "") {
            res[2] = return_null_values ? null : "1900-01-01";
        }

        if (res[3] == "") {
            res[3] = return_null_values ? null : "2100-01-01";
        }

        return res;
    }

    public upper(period: string, base: unitOfTime.Base = 'days'): string {

        const m = this.upperMoment(period, base);
        if (!m) {
            return null;
        }
        return DateHandler.getInstance().formatDayForIndex(m.unix());
    }

    public upperMoment(period: string, base: unitOfTime.Base = 'days'): Moment {

        const split = this.split(period);

        if ((!split) || (!split[3]) || (split[3] == '')) {
            return null;
        }

        return (split[4] == ']') ? moment(split[3]).utc(true) : moment(split[3]).utc(true).add(-1, base);
    }

    public hasUpper(period: string, base: unitOfTime.Base = 'days'): boolean {

        const split = this.split(period, true);

        return !((!split) || (!split[3]) || (split[3] == ''));
    }

    public hasLower(period: string, base: unitOfTime.Base = 'days'): boolean {

        const split = this.split(period, true);

        return !((!split) || (!split[2]) || (split[2] == ''));
    }

    public isDateInPeriod(date: Moment, period: string): boolean {
        if (!period) {
            return false;
        }

        if (!date) {
            return false;
        }

        const lower: Moment = this.lowerMoment(period, 'days');
        const upper: Moment = this.upperMoment(period, 'days');

        return (!!date) && (!!lower) && (!!upper) && (date.isSameOrAfter(lower) && date.isSameOrBefore(upper));
    }

    public get_ts_range_from_period(period: string, segment_type: number): TSRange {

        const ml = this.lowerMoment(period, TimeSegmentHandler.getCorrespondingMomentUnitOfTime(segment_type));
        const mu = this.upperMoment(period, TimeSegmentHandler.getCorrespondingMomentUnitOfTime(segment_type));

        if ((!ml) || (!mu)) {
            return null;
        }

        return TSRange.createNew(
            ml.unix(),
            mu.unix(),
            true,
            true,
            segment_type);
    }
}
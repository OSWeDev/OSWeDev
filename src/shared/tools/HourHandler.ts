import * as moment from 'moment';
import HourSegment from '../modules/DataRender/vos/HourSegment';

export default class HourHandler {

    public static getInstance(): HourHandler {
        if (!HourHandler.instance) {
            HourHandler.instance = new HourHandler();
        }
        return HourHandler.instance;
    }

    private static instance: HourHandler = null;

    private constructor() {
    }

    public formatHourForIHM(hour: moment.Duration, segment_type: number): string {
        if ((hour == null) || (typeof hour == 'undefined')) {
            return '';
        }

        switch (segment_type) {
            case HourSegment.TYPE_HOUR:
                return this.force2DigitMin(hour.hours()) + 'h';
            case HourSegment.TYPE_MINUTE:
                return this.force2DigitMin(hour.hours()) + ':' + this.force2DigitMin(hour.minutes());
            case HourSegment.TYPE_SECOND:
                return this.force2DigitMin(hour.hours()) + ':' + this.force2DigitMin(hour.minutes()) + ':' + this.force2DigitMin(hour.seconds());
            case HourSegment.TYPE_MS:
                return this.force2DigitMin(hour.hours()) + ':' + this.force2DigitMin(hour.minutes()) + ':' + this.force2DigitMin(hour.seconds()) + '.' + this.force3Digit(hour.milliseconds());
        }
    }

    public formatHourForAPI(hour: moment.Duration): number {
        if ((hour == null) || (typeof hour == 'undefined')) {
            return null;
        }
        return hour.asMilliseconds();
    }

    public formatHourForBDD(hour: moment.Duration): number {
        if ((hour == null) || (typeof hour == 'undefined')) {
            return null;
        }
        return hour.asMilliseconds();
    }

    public getDateFromApi(hour: number): moment.Duration {
        if ((hour == null) || (typeof hour == 'undefined')) {
            return null;
        }
        return moment.duration(hour);
    }

    public getDateFromSQLDay(hour: number): moment.Duration {
        if ((hour == null) || (typeof hour == 'undefined')) {
            return null;
        }
        return moment.duration(hour);
    }

    private force2DigitMin(e: number): string {
        if (!e) {
            return '00';
        }

        if (e < 10) {
            return '0' + e;
        }

        return e.toString();
    }

    private force3Digit(e: number): string {

        if ((e == null) || (typeof e === 'undefined')) {
            return '000';
        }

        if (e > 1000) {
            e = e % 1000;
        }

        if (!e) {
            return '000';
        }

        if (e < 10) {
            return '00' + e;
        }

        if (e < 100) {
            return '0' + e;
        }

        return e.toString();
    }
}
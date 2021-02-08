import * as moment from 'moment';
import HourSegment from '../modules/DataRender/vos/HourSegment';
import TimeSegment from '../modules/DataRender/vos/TimeSegment';
import ConsoleHandler from './ConsoleHandler';

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
        if (segment_type == null) {
            return null;
        }
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

    public formatHourFromIHM(hour: string, segment_type: number): moment.Duration {
        if (hour == null || typeof hour == 'undefined' || segment_type == null) {
            return null;
        }

        try {

            var splitted: string[] = hour.split(/[:h.]/);

            let duration_ms: number = 0;
            switch (segment_type) {
                case HourSegment.TYPE_MS:
                    duration_ms += parseInt(splitted[3]);
                case HourSegment.TYPE_SECOND:
                    duration_ms += parseInt(splitted[2]) * 1000;
                case HourSegment.TYPE_MINUTE:
                    duration_ms += parseInt(splitted[1]) * 60 * 1000;
                case HourSegment.TYPE_HOUR:
                    duration_ms += parseInt(splitted[0]) * 60 * 60 * 1000;
            }

            return moment.duration(duration_ms);
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return null;
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

    public diffDuration(start: moment.Duration, end: moment.Duration, time_segment: number): number {
        if (!start || !end) {
            return null;
        }

        let start_m: moment.Moment = moment().utc(true).startOf('day').add(start);
        let end_m: moment.Moment = moment().utc(true).startOf('day').add(end);

        let diff: number = end_m.diff(start_m, 'seconds');

        if (!diff) {
            return diff;
        }

        switch (time_segment) {
            case TimeSegment.TYPE_SECOND:
                return diff;
            case TimeSegment.TYPE_MINUTE:
                return diff / 60;
            case TimeSegment.TYPE_HOUR:
                return diff / 60 / 60;
        }
    }

    private force2DigitMin(e: number): string {
        if (!e || e == null) {
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
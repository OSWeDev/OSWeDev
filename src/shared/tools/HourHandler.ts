
import HourSegment from '../modules/DataRender/vos/HourSegment';
import Durations from '../modules/FormatDatesNombres/Dates/Durations';
import ConsoleHandler from './ConsoleHandler';

export default class HourHandler {

    /* istanbul ignore next: nothing to test here*/
    public static getInstance(): HourHandler {
        if (!HourHandler.instance) {
            HourHandler.instance = new HourHandler();
        }
        return HourHandler.instance;
    }

    private static instance: HourHandler = null;

    private constructor() {
    }

    public formatHourForIHM(hour: number, segment_type: number): string {
        if (segment_type == null) {
            return null;
        }
        if ((hour == null) || (typeof hour == 'undefined')) {
            return '';
        }
        switch (segment_type) {
            case HourSegment.TYPE_HOUR:
                return this.force2DigitMin(Durations.hours(hour)) + 'h';
            case HourSegment.TYPE_MINUTE:
                return this.force2DigitMin(Durations.hours(hour)) + ':' + this.force2DigitMin(Durations.minutes(hour));
            case HourSegment.TYPE_SECOND:
                return this.force2DigitMin(Durations.hours(hour)) + ':' + this.force2DigitMin(Durations.minutes(hour)) + ':' + this.force2DigitMin(Durations.seconds(hour));
        }
    }

    public formatHourFromIHM(hour: string, segment_type: number): number {
        if (hour == null || typeof hour == 'undefined' || segment_type == null) {
            return null;
        }

        try {

            const splitted: string[] = hour.split(/[:h.]/);

            let duration_s: number = 0;
            switch (segment_type) {
                case HourSegment.TYPE_SECOND:
                    duration_s += parseInt(splitted[2]);
                case HourSegment.TYPE_MINUTE:
                    duration_s += parseInt(splitted[1]) * 60;
                case HourSegment.TYPE_HOUR:
                    duration_s += parseInt(splitted[0]) * 60 * 60;
            }

            return duration_s;
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return null;
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

        if ((e === null) || (typeof e === 'undefined')) {
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
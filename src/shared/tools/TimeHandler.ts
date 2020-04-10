import { Moment } from 'moment';
import ConsoleHandler from './ConsoleHandler';
import TypesHandler from './TypesHandler';

export default class TimeHandler {
    public static MINUTES_TIME_FOR_INDEX_FORMAT: string = 'HH:mm';

    public static getInstance(): TimeHandler {
        if (!TimeHandler.instance) {
            TimeHandler.instance = new TimeHandler();
        }
        return TimeHandler.instance;
    }

    private static instance: TimeHandler = null;

    private constructor() {
    }

    public formatMomentMinutePrecisionTime(date: Moment): string {
        if ((date == null) || (typeof date == 'undefined')) {
            return null;
        }
        return date.format(TimeHandler.MINUTES_TIME_FOR_INDEX_FORMAT);
    }

    public formatMinutePrecisionTime(time: string): string {
        if ((time == null) || (typeof time == 'undefined')) {
            return null;
        }

        try {

            time = time.replace(/h/gi, ':');

            if (time.match(/^(24:00|2[0-3]:[0-5][0-9]|[0-1][0-9]:[0-5][0-9])$/)) {
                return time;
            }

            let segments: string[] = time.split(':');
            if ((!segments) || (segments.length < 1)) {
                return null;
            }

            let hours: number = parseInt(segments[0]);
            if ((hours == null) || (!TypesHandler.getInstance().isNumber(hours)) || (isNaN(hours)) || (hours < 0) || (hours > 24)) {
                return null;
            }

            let minutes: number = ((segments.length > 1) && (segments[1] != '')) ? parseInt(segments[1]) : 0;
            if ((minutes == null) || (!TypesHandler.getInstance().isNumber(minutes)) || (isNaN(minutes)) || (minutes < 0) || (minutes > 59) || ((hours == 24) && (minutes > 0))) {
                return null;
            }

            return ((hours >= 10) ? hours : '0' + hours) + ':' + ((minutes >= 10) ? minutes : '0' + minutes);
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        return null;
    }
}
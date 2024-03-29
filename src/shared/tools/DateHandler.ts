import moment from 'moment';
import Dates from "../modules/FormatDatesNombres/Dates/Dates";



export default class DateHandler {
    public static DAY_FOR_INDEX_FORMAT: string = 'YYYY-MM-DD';
    public static DateTime_FOR_BDD_FORMAT: string = 'YYYY-MM-DD HH:mm:ss';
    public static DateTime_FOR_API_FORMAT: string = 'x';

    /* istanbul ignore next: nothing to test here */
    public static getInstance(): DateHandler {
        if (!DateHandler.instance) {
            DateHandler.instance = new DateHandler();
        }
        return DateHandler.instance;
    }

    private static instance: DateHandler = null;

    private constructor() {
    }

    /* istanbul ignore next: quite difficult test : depends on the local and the number... might want to write one anyway sometime but doesn't seem very important */
    public humanizeDurationTo(date: number): string {
        if (!date) {
            return "";
        }
        return moment.duration(Dates.diff(date, Dates.now()), 'seconds').humanize();
    }

    /**
     * Check injection OK
     */
    public formatDayForIndex(date: number): string {
        if ((date === null) || (typeof date == 'undefined')) {
            return null;
        }
        return Dates.format(date, DateHandler.DAY_FOR_INDEX_FORMAT, false);
    }

    public formatDayForVO(date: number): string {
        if ((date === null) || (typeof date == 'undefined')) {
            return null;
        }
        return Dates.format(date, 'YYYY-MM-DD', false);
    }

    public formatMonthFromVO(date: number): string {
        if ((date === null) || (typeof date == 'undefined')) {
            return null;
        }
        return Dates.format(date, 'YYYY-MM', false);
    }

    public formatDayForApi(date: number): string {
        if ((date === null) || (typeof date == 'undefined')) {
            return null;
        }
        return Dates.format(date, 'YYYY-MM-DD', false);
    }

    public formatDayForSQL(date: number): string {
        if ((date === null) || (typeof date == 'undefined')) {
            return null;
        }
        return Dates.format(date, 'YYYY-MM-DD', false);
    }
}
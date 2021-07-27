


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

    public isSameMoment(a: Moment, b: Moment): boolean {
        if ((a == null) != (b == null)) {
            return false;
        }

        if (a == null) {
            return true;
        }

        return a.valueOf() == b.valueOf();
    }

    public getUnixForBDD(date: Moment): number {
        if ((date === null) || (typeof date == 'undefined')) {
            return null;
        }
        return date.unix();
    }

    /* istanbul ignore next: quite difficult test : depends on the local and the moment... might want to write one anyway sometime but doesn't seem very important */
    public humanizeDurationTo(date: Moment): string {
        if (!date) {
            return "";
        }
        return moment.duration(date.diff(Dates.now())).humanize();
    }

    public formatDayForIndex(date: Moment): string {
        if ((date === null) || (typeof date == 'undefined')) {
            return null;
        }
        return date.format(DateHandler.DAY_FOR_INDEX_FORMAT);
    }

    public formatDayForVO(date: Moment): string {
        if ((date === null) || (typeof date == 'undefined')) {
            return null;
        }
        return date.format('YYYY-MM-DD');
    }

    public formatMonthFromVO(date: Moment): string {
        if ((date === null) || (typeof date == 'undefined')) {
            return null;
        }
        return date.format('YYYY-MM');
    }

    public formatDayForApi(date: Moment): string {
        if ((date === null) || (typeof date == 'undefined')) {
            return null;
        }
        return date.format('YYYY-MM-DD');
    }

    public formatDayForSQL(date: Moment): string {
        if ((date === null) || (typeof date == 'undefined')) {
            return null;
        }
        return date.format('YYYY-MM-DD');
    }
}
import { Moment } from 'moment';
import ISegment from '../interfaces/ISegment';

export default class TimeSegment implements ISegment<Moment> {
    public static TYPE_NAMES: string[] = [
        "timesegment.year.type_name",
        "timesegment.month.type_name",
        "timesegment.day.type_name",
        "timesegment.week.type_name",
        "timesegment.rolling_year_month_start.type_name",
        "timesegment.hour.type_name",
        "timesegment.minute.type_name",
        "timesegment.second.type_name",
        "timesegment.ms.type_name",
    ];
    public static TYPE_YEAR: number = 0;
    public static TYPE_MONTH: number = 1;
    public static TYPE_DAY: number = 2;
    public static TYPE_WEEK: number = 3;
    public static TYPE_ROLLING_YEAR_MONTH_START: number = 4;
    public static TYPE_HOUR: number = 5;
    public static TYPE_MINUTE: number = 6;
    public static TYPE_SECOND: number = 7;
    public static TYPE_MS: number = 8;
    public static TYPE_NAMES_ENUM: { [type: number]: string } = {
        [TimeSegment.TYPE_YEAR]: TimeSegment.TYPE_NAMES[TimeSegment.TYPE_YEAR],
        [TimeSegment.TYPE_MONTH]: TimeSegment.TYPE_NAMES[TimeSegment.TYPE_MONTH],
        [TimeSegment.TYPE_DAY]: TimeSegment.TYPE_NAMES[TimeSegment.TYPE_DAY],
        [TimeSegment.TYPE_WEEK]: TimeSegment.TYPE_NAMES[TimeSegment.TYPE_WEEK],
        [TimeSegment.TYPE_ROLLING_YEAR_MONTH_START]: TimeSegment.TYPE_NAMES[TimeSegment.TYPE_ROLLING_YEAR_MONTH_START],
        [TimeSegment.TYPE_HOUR]: TimeSegment.TYPE_NAMES[TimeSegment.TYPE_HOUR],
        [TimeSegment.TYPE_MINUTE]: TimeSegment.TYPE_NAMES[TimeSegment.TYPE_MINUTE],
        [TimeSegment.TYPE_SECOND]: TimeSegment.TYPE_NAMES[TimeSegment.TYPE_SECOND],
        [TimeSegment.TYPE_MS]: TimeSegment.TYPE_NAMES[TimeSegment.TYPE_MS],
    };

    /**
     * DON'T USE this method to create TimeSegments, use only the TimeSegmentHandler to get corresponding segment from Moment and segment_type
     */
    public static createNew(date: Moment, type: number): TimeSegment {
        return new TimeSegment(date, type);
    }

    private constructor(public index: Moment, public type: number) { }

    get dateIndex(): string {
        return this.index ? this.index.format('Y-MM-DD') : null;
    }
}
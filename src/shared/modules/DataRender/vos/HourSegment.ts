
import ISegment from '../interfaces/ISegment';

export default class HourSegment implements ISegment {
    public static TYPE_NAMES: string[] = [
        "HourSegment.hour.type_name",
        "HourSegment.minute.type_name",
        "HourSegment.second.type_name",
        "HourSegment.year.type_name",
        "HourSegment.month.type_name",
        "HourSegment.day.type_name",
        "HourSegment.week.type_name",
        "HourSegment.rolling_year_month_start.type_name",
    ];
    public static TYPE_HOUR: number = 0;
    public static TYPE_MINUTE: number = 1;
    public static TYPE_SECOND: number = 2;

    public static TYPE_YEAR: number = 3;
    public static TYPE_MONTH: number = 4;
    public static TYPE_DAY: number = 5;
    public static TYPE_WEEK: number = 6;
    public static TYPE_ROLLING_YEAR_MONTH_START: number = 7;

    public static TYPE_NAMES_ENUM: { [type: number]: string } = {
        [HourSegment.TYPE_HOUR]: HourSegment.TYPE_NAMES[HourSegment.TYPE_HOUR],
        [HourSegment.TYPE_MINUTE]: HourSegment.TYPE_NAMES[HourSegment.TYPE_MINUTE],
        [HourSegment.TYPE_SECOND]: HourSegment.TYPE_NAMES[HourSegment.TYPE_SECOND],

        [HourSegment.TYPE_YEAR]: HourSegment.TYPE_NAMES[HourSegment.TYPE_YEAR],
        [HourSegment.TYPE_MONTH]: HourSegment.TYPE_NAMES[HourSegment.TYPE_MONTH],
        [HourSegment.TYPE_DAY]: HourSegment.TYPE_NAMES[HourSegment.TYPE_DAY],
        [HourSegment.TYPE_WEEK]: HourSegment.TYPE_NAMES[HourSegment.TYPE_WEEK],
        [HourSegment.TYPE_ROLLING_YEAR_MONTH_START]: HourSegment.TYPE_NAMES[HourSegment.TYPE_ROLLING_YEAR_MONTH_START],
    };

    /**
     * DON'T USE this method to create HourSegments, use only the HourSegmentHandler to get corresponding segment from Duration and segment_type
     */
    public static createNew(date: number, type: number): HourSegment {
        return new HourSegment(date, type);
    }

    private constructor(public index: number, public type: number) { }
}
export default class TimeSegment {
    public static TYPE_NAMES: string[] = ["timesegment.year.type_name", "timesegment.month.type_name", "timesegment.day.type_name", "timesegment.week.type_name", "timesegment.rolling_year_month_start.type_name"];
    public static TYPE_YEAR: number = 0;
    public static TYPE_MONTH: number = 1;
    public static TYPE_DAY: number = 2;
    public static TYPE_WEEK: number = 3;
    public static TYPE_ROLLING_YEAR_MONTH_START: number = 4;

    public static fromDateAndType(dateIndex: string, type: number) {
        let res = new TimeSegment();

        res.dateIndex = dateIndex;
        res.type = type;

        return res;
    }

    public dateIndex: string;
    public type: number;
}
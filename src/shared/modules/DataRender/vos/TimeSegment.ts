export default class TimeSegment {
    public static TYPE_YEAR: string = "year";
    public static TYPE_MONTH: string = "month";
    public static TYPE_DAY: string = "day";

    public static fromDateAndType(dateIndex: string, type: string) {
        let res = new TimeSegment();

        res.dateIndex = dateIndex;
        res.type = type;

        return res;
    }

    public dateIndex: string;
    public type: string;
}
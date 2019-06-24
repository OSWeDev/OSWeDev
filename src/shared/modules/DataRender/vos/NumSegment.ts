export default class NumSegment {
    public static TYPE_NAMES: string[] = ["numsegment.int.type_name"];
    public static TYPE_INT: number = 0;

    public static fromNumAndType(num: number, type: number) {
        let res = new NumSegment();

        res.num = num;
        res.type = type;

        return res;
    }

    public num: number;
    public type: number;
}
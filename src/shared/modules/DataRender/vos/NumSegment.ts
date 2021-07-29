import ISegment from '../interfaces/ISegment';

export default class NumSegment implements ISegment {
    public static TYPE_NAMES: string[] = ["numsegment.int.type_name"];
    public static TYPE_INT: number = 0;

    public static fromNumAndType(num: number, type: number) {
        let res = new NumSegment();

        res.index = num;
        res.type = type;

        return res;
    }

    public index: number;
    public type: number;
}
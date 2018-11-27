import ColumnDataVO from "./ColumnDataVO";

export default class GroupColumnDataVO {
    public constructor(
        public name: string,
        public columns: ColumnDataVO[],
    ) { }
}
import ColumnVO from "./ColumnVO";

export default class GroupColumnVO {
    public constructor(
        public name: string,
        public columns: ColumnVO[],
    ) { }
}
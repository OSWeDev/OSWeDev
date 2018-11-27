import ColumnVO from "./ColumnVO";

export default class ColumnDataVO {
    public constructor(
        public column: ColumnVO,
        public type: string,
        public is_decimal: boolean,
        public value: number,
        public moyenne: number,
        public trend: boolean,
    ) { }
}
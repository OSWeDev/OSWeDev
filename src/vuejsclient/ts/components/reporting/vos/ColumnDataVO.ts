import ColumnVO from "./ColumnVO";

export default class ColumnDataVO {
    public constructor(
        public column: ColumnVO,
        public value: any,
        public moyenne: number = null,
        public classLabelData: string = null,
    ) { }
}
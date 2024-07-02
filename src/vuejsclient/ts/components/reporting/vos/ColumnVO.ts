export default class ColumnVO {

    public static TYPE_PERCENT: string = 'percent';
    public static TYPE_AMOUNT: string = 'amount';
    public static TYPE_FIXED: string = 'fixed';
    public static TYPE_TEXT: string = 'text';

    public static GET_CLASSES(column: ColumnVO): string {
        const classes: string[] = [];

        if (!column) {
            return null;
        }

        if (column.admin) {
            classes.push('admin');
        }
        if (column.bold) {
            classes.push('bold');
        }
        if (column.separate) {
            classes.push('separate');
        }
        classes.push(column.name);

        classes.push(column.classLabel);

        return classes.join(' ');
    }

    public constructor(
        public name: string,
        public colspan: number,
        public label: string,
        public classLabel: string,
        public type: string = ColumnVO.TYPE_TEXT,
        public bold: boolean = false,
        public admin: boolean = false,
        public is_decimal: boolean = false,
        public trend: boolean = false,
        public separate: boolean = false,
    ) { }
}
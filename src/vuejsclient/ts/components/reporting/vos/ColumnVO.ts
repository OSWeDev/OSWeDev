export default class ColumnVO {

    public static GET_CLASSES(column: ColumnVO): string {
        let classes: string[] = [];

        if (!column) {
            return null;
        }

        if (column.admin) {
            classes.push('admin');
        }
        if (column.bold) {
            classes.push('bold');
        }
        classes.push(column.name);

        return classes.join(' ');
    }

    public constructor(
        public name: string,
        public colspan: number,
        public label: string,
        public classLabel: string,
        public bold: boolean,
        public admin: boolean,
    ) { }
}
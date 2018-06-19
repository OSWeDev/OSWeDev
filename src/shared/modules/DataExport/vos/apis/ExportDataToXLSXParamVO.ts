export default class ExportDataToXLSXParamVO {

    public constructor(
        public filename: string,
        public datas: any[],
        public ordered_column_list: string[],
        public column_labels: { [field_name: string]: string }) {
    }
}
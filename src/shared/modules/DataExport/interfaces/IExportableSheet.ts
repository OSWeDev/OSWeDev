export default interface IExportableSheet {
    sheet_name: string;
    datas: any[];
    ordered_column_list: string[];
    column_labels: { [field_name: string]: string };
}
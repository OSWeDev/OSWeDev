
export default interface IExportableDatas {
    filename: string;
    datas: any[];
    ordered_column_list: string[];
    column_labels: { [field_name: string]: string };
    api_type_id: string;
}
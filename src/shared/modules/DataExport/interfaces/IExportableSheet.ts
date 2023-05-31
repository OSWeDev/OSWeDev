/**
 * Interface for a sheet that can be exported
 */
export default interface IExportableSheet {
    sheet_name: string;
    datas: Array<{ [column_list_key: string]: { value: string | number, format?: string } }>; // Format on each data value e.g. { value: 'value', format: 'filterFormat' }
    ordered_column_list: string[];
    column_labels: { [field_name: string]: string };
}
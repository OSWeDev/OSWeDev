/**
 * IExportOptions
 *  - Definitions of exportable data sheets
 *  - We may choose to export additional data than actual datatable
 */
export default interface IExportOptions {
    export_active_field_filters?: boolean;
    export_vars_indicator?: boolean;
}
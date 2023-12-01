/**
 * IExportOptions
 *  - Definitions of exportable data sheets
 *  - We may choose to export additional data than actual datatable
 */
export default interface IExportOptions {
    export_active_field_filters?: boolean;
    export_vars_indicator?: boolean;
    send_email_with_export_notification?: boolean; // - For the user to connect to the platform and download the file
}
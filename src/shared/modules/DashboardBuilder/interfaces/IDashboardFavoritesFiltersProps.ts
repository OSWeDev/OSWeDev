
import ExportContextQueryToXLSXParamVO from '../../../../shared/modules/DataExport/vos/apis/ExportContextQueryToXLSXParamVO';
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";

/**
 * IDashboardFavoritesFiltersProps
 *  - Props for DashboardFavoritesFilters
 */
export default interface IDashboardFavoritesFiltersProps {
    // dashboard id of this favorite list
    dashboard_id?: number;
    // User id of saved active filters
    owner_id?: number;
    // Name which the owner gave to the current backup
    name?: string;
    // JSON object of page active field filters
    page_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };
    // JSON object of export configurations
    export_params?: IExportParamsProps;
}

/**
 * IExportParamsProps
 *  - Props for Cron worker to execute export
 */
export interface IExportParamsProps {
    is_export_planned: boolean;         // Can the Cron worker export ?
    last_export_at_ts?: number;
    export_frequency: {
        every?: number,  // 1, 3, e.g. every 1 day, every 3 months
        granularity?: 'day' | 'month' | 'year',
        day_in_month?: number,  // day in the month e.g. every 3 months at day 15
    };
    exportable_data: { [title_name_code: string]: ExportContextQueryToXLSXParamVO };
}
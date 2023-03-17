
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
    page_filters?: string;
    // JSON object of export configurations
    export_params?: string; // e.g. {is_export_planned?: boolean, export_frequency?: {day?:number }, exportable_data?:Array<ExportContextQueryToXLSXParamVO>}
}
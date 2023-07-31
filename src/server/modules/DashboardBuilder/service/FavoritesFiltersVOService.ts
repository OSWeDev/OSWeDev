import FieldFiltersVOManager from "../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager";
import ExportContextQueryToXLSXParamVO from "../../../../shared/modules/DataExport/vos/apis/ExportContextQueryToXLSXParamVO";
import IExportParamsProps from "../../../../shared/modules/DashboardBuilder/interfaces/IExportParamsProps";
import FavoritesFiltersVO from "../../../../shared/modules/DashboardBuilder/vos/FavoritesFiltersVO";
import FieldFiltersVO from "../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO";
import { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ModuleDAO from "../../../../shared/modules/DAO/ModuleDAO";
import Dates from "../../../../shared/modules/FormatDatesNombres/Dates/Dates";
import ModuleDataExportServer from "../../DataExport/ModuleDataExportServer";

/**
 * FavoritesFiltersVOService
 */
export default class FavoritesFiltersVOService {

    /**
     * can_export_favorites_filters
     * - This method is responsible for checking if the given favorites_filters can be exported
     *
     * @param {FavoritesFiltersVO} favorites_filters
     * @returns {boolean}
     */
    public static can_export_favorites_filters(favorites_filters: FavoritesFiltersVO): boolean {
        // Can I export ?
        let can_export = false;

        const export_params: IExportParamsProps = favorites_filters.export_params ?? null;

        // There is no need to process export if there is no export_planned
        // is_export_planned, export_frequency and exportable_data must be sets
        if (
            !export_params?.is_export_planned ||
            !export_params?.export_frequency ||
            !export_params?.exportable_data
        ) {
            return false;
        }

        const export_frequency = export_params.export_frequency;

        // Can export the first time here
        if (!export_params.last_export_at_ts) {
            return true;
        }

        // Define if the data have to be exported
        const last_export_at_ts: number = export_params.last_export_at_ts;
        const now_ts = new Date().getTime();

        const offset = parseInt(export_frequency.every?.toString()); // 1, 3, e.g. every 1 day, every 3 months
        const granularity = export_frequency.granularity; // 'day' | 'month' | 'year'
        const day_in_month = export_frequency.day_in_month ? parseInt(export_frequency.day_in_month.toString()) : null; // day in the month e.g. every 3 months at day 15

        // Get date offset (by using "every", "granularity" and "day_in_month")
        let last_export_at_date = new Date(last_export_at_ts);
        let offset_day_ts = null; // (timestamp)
        switch (granularity) {
            case 'day':
                offset_day_ts = last_export_at_date.setDate(last_export_at_date.getDate() + offset);

                break;
            case 'month':
                if (!(day_in_month)) {
                    throw new Error(`Day in month must be given !`);
                }

                offset_day_ts = last_export_at_date.setMonth(last_export_at_date.getMonth() + offset);
                offset_day_ts = new Date(offset_day_ts).setDate(day_in_month);
                break;
            case 'year':
                offset_day_ts = last_export_at_date.setFullYear(last_export_at_date.getFullYear() + offset);

                break;
            default: throw new Error(`Invalid granularity given! :${granularity}`);
        }

        // To export, the actual_days_diff shall be greater or equal of "0"
        // That mean the actual "now" day has been outdated
        const one_day_ts = (24 * 60 * 60 * 1000); // hours * minutes * seconds * milliseconds (timestamp)
        const actual_days_diff = Math.round((now_ts - offset_day_ts) / one_day_ts);

        if (actual_days_diff >= 0) {
            can_export = true;
        }

        return can_export;
    }

    public static getInstance(): FavoritesFiltersVOService {
        if (!FavoritesFiltersVOService.instance) {
            FavoritesFiltersVOService.instance = new FavoritesFiltersVOService();
        }

        return FavoritesFiltersVOService.instance;
    }

    private static instance: FavoritesFiltersVOService = null;

    private constructor() { }

    /**
     * Start Export Datatable Using Favorites Filters
     *
     * @return {Promise<void>}
     */
    public async export_all_favorites_filters_datatable(): Promise<void> {

        // For all favorites filters, Export by using export_params
        const all_favorites_filters: FavoritesFiltersVO[] = await query(FavoritesFiltersVO.API_TYPE_ID)
            .select_vos<FavoritesFiltersVO>();

        for (const fav_i in all_favorites_filters) {
            const favorites_filters: FavoritesFiltersVO = all_favorites_filters[fav_i];

            // Can I export ?
            let can_export = FavoritesFiltersVOService.can_export_favorites_filters(favorites_filters);

            if (!can_export) {
                continue;
            }

            // Export favorites_filters datatable
            await this.export_favorites_filters_datatable(favorites_filters);
        }
    }

    /**
     * export_favorites_filters_datatable
     * - This method is responsible for exporting the datatable of the given favorites_filters
     *
     * @param favorites_filters
     */
    public async export_favorites_filters_datatable(favorites_filters: FavoritesFiltersVO): Promise<void> {
        const export_params: IExportParamsProps = favorites_filters.export_params;
        const favorites_field_filters = favorites_filters.field_filters;
        const favorites_filters_options = favorites_filters.options;
        const exportable_data = export_params.exportable_data;

        // Actual context field filters to be used for the export
        let context_field_filters: FieldFiltersVO = {};

        // Default field_filters from each page widget_options
        const default_field_filters: FieldFiltersVO = await FieldFiltersVOManager.find_default_field_filters_by_dashboard_page_id(
            favorites_filters.page_id
        );

        // Create context_field_filters with the default one
        for (const api_type_id in default_field_filters) {
            const filters = default_field_filters[api_type_id];

            for (const field_id in filters) {
                // Add default context filters
                context_field_filters = FieldFiltersVOManager.overwrite_field_filters_with_context_filter(
                    context_field_filters,
                    { api_type_id, field_id },
                    filters[field_id]
                );
            }
        }

        // Merge/replace default_field_filters with favorites_field_filters
        for (const api_type_id in favorites_field_filters) {
            const filters = favorites_field_filters[api_type_id];

            for (const field_id in filters) {
                // Add default context filters
                context_field_filters = FieldFiltersVOManager.overwrite_field_filters_with_context_filter(
                    context_field_filters,
                    { api_type_id, field_id },
                    filters[field_id]
                );
            }
        }

        // Create field_filters depend on if the user choose to config its dates filters
        if (
            favorites_filters_options &&
            favorites_filters_options?.is_field_filters_fixed_dates === false
        ) {
            // Overwrite active field filters with custom dates widget_options (month, year, etc.)
        }

        // Export all exportable data
        for (const key in exportable_data) {
            // TODO - This exportable data must have to be created from the backend
            const xlsx_data: ExportContextQueryToXLSXParamVO = new ExportContextQueryToXLSXParamVO().from(exportable_data[key]);

            // Replace the "{#Date}" placeholder with the current date
            const date_rgx = /\{(?<date_placeholder>\#Date)\}/;
            let filename: string = xlsx_data.filename;

            if (date_rgx.test(filename)) {
                filename = filename.replace(date_rgx, Dates.now().toString());
            }

            await ModuleDataExportServer.getInstance().prepare_exportContextQueryToXLSX(
                filename,
                xlsx_data.context_query,
                xlsx_data.ordered_column_list,
                xlsx_data.column_labels,
                xlsx_data.exportable_datatable_custom_field_columns,
                xlsx_data.columns,
                xlsx_data.fields,
                xlsx_data.varcolumn_conf,
                context_field_filters,
                xlsx_data.custom_filters,
                xlsx_data.active_api_type_ids,
                xlsx_data.discarded_field_paths,
                xlsx_data.is_secured,
                xlsx_data.file_access_policy_name,
                xlsx_data.target_user_id,
                xlsx_data.do_not_user_filter_by_datatable_field_uid,
                xlsx_data.export_options,
                xlsx_data.vars_indicator,
            );
        }

        // Set up last_export_at_ts timestamp
        export_params.last_export_at_ts = new Date().getTime();

        // update this favorites_filters
        await ModuleDAO.getInstance().insertOrUpdateVO(favorites_filters);
    }
}
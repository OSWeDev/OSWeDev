import { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import FavoritesFiltersController from "../../../../shared/modules/DashboardBuilder/favorite_filters/FavoritesFiltersController";
import FavoritesFiltersExportParamsVO from "../../../../shared/modules/DashboardBuilder/vos/FavoritesFiltersExportParamsVO";
import FavoritesFiltersVO from "../../../../shared/modules/DashboardBuilder/vos/FavoritesFiltersVO";
import FieldFiltersVO from "../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO";
import ExportContextQueryToXLSXParamVO from "../../../../shared/modules/DataExport/vos/apis/ExportContextQueryToXLSXParamVO";
import ExportContextQueryToXLSXQueryVO from "../../../../shared/modules/DataExport/vos/ExportContextQueryToXLSXQueryVO";
import Dates from "../../../../shared/modules/FormatDatesNombres/Dates/Dates";
import ModuleDAOServer from "../../DAO/ModuleDAOServer";

/**
 * FavoritesFiltersServerController
 */

export default class FavoritesFiltersServerController {

    /**
     * Start Export Datatable Using Favorites Filters
     *
     * @return {Promise<void>}
     */
    public static async export_all_favorites_filters_datatable(): Promise<void> {

        // For all favorites filters, Export by using export_params
        const all_favorites_filters: FavoritesFiltersVO[] = await query(FavoritesFiltersVO.API_TYPE_ID)
            .select_vos<FavoritesFiltersVO>();

        for (const fav_i in all_favorites_filters) {
            const favorites_filters: FavoritesFiltersVO = all_favorites_filters[fav_i];

            // Can I export ?
            const can_export = FavoritesFiltersController.can_export_favorites_filters(favorites_filters);

            if (!can_export) {
                continue;
            }

            // Export favorites_filters datatable
            await FavoritesFiltersServerController.export_favorites_filters_datatable(favorites_filters);
        }
    }

    /**
     * export_favorites_filters_datatable
     * - FavoritesFiltersServerController method is responsible for exporting the datatable of the given favorites_filters
     *
     * @param favorites_filters
     */
    public static async export_favorites_filters_datatable(favorites_filters: FavoritesFiltersVO): Promise<void> {
        const export_params: FavoritesFiltersExportParamsVO = favorites_filters.export_params;
        const exportable_data = export_params.exportable_data;

        // Actual context field_filters to be used for the export
        const context_field_filters: FieldFiltersVO = await FavoritesFiltersController.create_field_filters_for_export(
            favorites_filters
        );

        // Export all exportable data
        for (const key in exportable_data) {

            const xlsx_data: ExportContextQueryToXLSXParamVO = new ExportContextQueryToXLSXParamVO().from(
                exportable_data[key]
            );

            // Replace the "{#Date}" placeholder with the current date
            const date_rgx = /\{(?<date_placeholder>\#Date)\}/;
            let filename: string = favorites_filters.name + '__' + xlsx_data.filename;

            if (date_rgx.test(filename)) {
                filename = filename.replace(date_rgx, Dates.now().toString());
            }

            const export_contextquery_to_xlsx: ExportContextQueryToXLSXQueryVO = ExportContextQueryToXLSXQueryVO.create_new(
                favorites_filters.dashboard_id,
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
                favorites_filters.export_params.export_to_user_id_ranges,
                xlsx_data.do_not_use_filter_by_datatable_field_uid,
                xlsx_data.export_active_field_filters,
                xlsx_data.export_vars_indicator,
                xlsx_data.send_email_with_export_notification
            );
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(export_contextquery_to_xlsx);
        }

        // Set up last_export_at_ts timestamp
        export_params.last_export_at_ts = Dates.now();

        // update FavoritesFiltersServerController favorites_filters
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(favorites_filters);
    }
}
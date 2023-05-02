import ContextFilterVOManager from "../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager";
import VOFieldRefVOManager from '../../../../shared/modules/DashboardBuilder/manager/VOFieldRefVOManager';
import FieldFilterManager from "../../../../shared/modules/DashboardBuilder/manager/FieldFilterManager";
import ContextFilterVO from "../../../../shared/modules/ContextFilter/vos/ContextFilterVO";
import { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ModuleDAO from "../../../../shared/modules/DAO/ModuleDAO";
import ExportContextQueryToXLSXParamVO from "../../../../shared/modules/DataExport/vos/apis/ExportContextQueryToXLSXParamVO";
import DashboardBuilderVOFactory from "../../../../shared/modules/DashboardBuilder/factory/DashboardBuilderVOFactory";
import IExportParamsProps from "../../../../shared/modules/DashboardBuilder/interfaces/IExportParamsProps";
import DashboardPageWidgetVO from "../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import FavoritesFiltersVO from "../../../../shared/modules/DashboardBuilder/vos/FavoritesFiltersVO";
import DashboardWidgetVO from "../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO";
import Dates from "../../../../shared/modules/FormatDatesNombres/Dates/Dates";
import ModuleDataExportServer from "../../DataExport/ModuleDataExportServer";
import ConsoleHandler from "../../../../shared/tools/ConsoleHandler";
import ObjectHandler from "../../../../shared/tools/ObjectHandler";

/**
 * @class FavoritesFiltersVOService
 */
export default class FavoritesFiltersVOService {

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
    public async export_favorites_filters_datatable(): Promise<void> {

        // For all users favorites filters, Export by using export_params
        const users_favorites_filters: FavoritesFiltersVO[] = await query(FavoritesFiltersVO.API_TYPE_ID)
            .select_vos<FavoritesFiltersVO>();

        const widgets: DashboardWidgetVO[] = await query(DashboardWidgetVO.API_TYPE_ID)
            .select_vos<DashboardWidgetVO>();

        for (const fav_i in users_favorites_filters) {
            const favorites_filters: FavoritesFiltersVO = users_favorites_filters[fav_i];

            const export_params: IExportParamsProps = favorites_filters.export_params ?? null;

            // There is no need to process export if there is no export_planned
            // is_export_planned, export_frequency and exportable_data must be sets
            if (
                !export_params?.is_export_planned ||
                !export_params?.export_frequency ||
                !export_params?.exportable_data
            ) {
                continue;
            }

            const favorites_field_filters = favorites_filters.field_filters;
            const export_frequency = export_params.export_frequency;
            const exportable_data = export_params.exportable_data;

            // Do I have to export ?
            let do_export = false;

            // Shall export the first time here
            if (!export_params.last_export_at_ts) {
                do_export = true;
            }

            // Define if the data have to be exported
            if (!do_export) {
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
                    do_export = true;
                }
            }

            if (!do_export) {
                continue;
            }

            // Default field_filters from each page widget_options
            let default_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = {};
            // Actual context field filters to be used for the export
            let context_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = {};

            // Get widgets of the given favorites filters page
            const page_widgets: DashboardPageWidgetVO[] = await query(DashboardPageWidgetVO.API_TYPE_ID)
                .filter_by_num_eq('page_id', favorites_filters.page_id)
                .select_vos<DashboardPageWidgetVO>();

            // Process the export
            // - Create context field filters and then export
            for (const key in widgets) {
                const widget = widgets[key];

                // Get Default fields filters
                page_widgets.filter((page_widget: DashboardPageWidgetVO) => {
                    // page_widget must have json_options to continue
                    return page_widget.widget_id === widget.id &&
                        page_widget.json_options?.length > 0;
                }).map((page_widget: DashboardPageWidgetVO) => {
                    const options = JSON.parse(page_widget.json_options ?? '{}');

                    let context_filter: ContextFilterVO = null;
                    let widget_options: any = null;

                    try {
                        widget_options = DashboardBuilderVOFactory.create_widget_options_vo_by_name(widget.name, options);
                    } catch (e) {

                    }

                    // We must have widget_options to keep proceed
                    if (!widget_options) {
                        return;
                    }

                    let vo_field_ref = VOFieldRefVOManager.create_vo_field_ref_vo_from_widget_options(widget_options);

                    context_filter = ContextFilterVOManager.create_context_filter_from_widget_options(widget.name, widget_options);

                    // We must transform this ContextFilterVO into { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }
                    if (vo_field_ref && context_filter) {
                        default_field_filters = FieldFilterManager.merge_field_filters_with_context_filter(default_field_filters, vo_field_ref, context_filter);
                    }
                });
            }

            // TODO: test the following code
            // Merge/replace default_field_filters with favorites_field_filters
            // Create context_field_filters with the default one
            // try {
            //     context_field_filters = ObjectHandler.deepmerge(context_field_filters, default_field_filters);
            //     // Add/Overwrite default context_field_filters with the favorites_field_filters one
            //     context_field_filters = ObjectHandler.deepmerge(context_field_filters, favorites_field_filters);
            // } catch (e) {
            //     ConsoleHandler.error('Error while merging context_field_filters', e);
            // }

            // TODO: remove this part once the previous one has been tested
            for (const api_type_id in default_field_filters) {
                const filters = default_field_filters[api_type_id];

                for (const field_id in filters) {
                    // Add default context filters
                    context_field_filters = FieldFilterManager.overwrite_field_filters_with_context_filter(
                        context_field_filters,
                        { api_type_id, field_id },
                        filters[field_id]
                    );
                }
            }

            for (const api_type_id in favorites_field_filters) {
                const filters = favorites_field_filters[api_type_id];

                for (const field_id in filters) {
                    // Add default context filters
                    context_field_filters = FieldFilterManager.overwrite_field_filters_with_context_filter(
                        context_field_filters,
                        { api_type_id, field_id },
                        filters[field_id]
                    );
                }
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
}
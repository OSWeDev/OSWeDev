import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";
import ExportVarIndicatorVO from "../../DataExport/vos/ExportVarIndicatorVO";
import ExportVarcolumnConfVO from "../../DataExport/vos/ExportVarcolumnConfVO";
import FieldFiltersVOHandler from "../handlers/FieldFiltersVOHandler";
import DashboardPageWidgetVO from "../vos/DashboardPageWidgetVO";
import FieldFiltersVO from "../vos/FieldFiltersVO";
import VarWidgetOptionsVO from "../vos/VarWidgetOptionsVO";
import WidgetOptionsMetadataVO from "../vos/WidgetOptionsMetadataVO";
import DashboardPageWidgetVOManager from "./DashboardPageWidgetVOManager";

/**
 * @class VarWidgetManager
 */
export default class VarWidgetManager {

    /**
     * get_var_custom_filters
     *
     * @param var_custom_filters
     * @param field_filters
     * @returns {{ [var_param_field_name: string]: ContextFilterVO }}
     */
    public static get_var_custom_filters(
        var_custom_filters: { [var_param_field_name: string]: string },
        widget_id: number,
        field_filters: FieldFiltersVO
    ): { [var_param_field_name: string]: { [widget_id: number]: ContextFilterVO } } {

        /**
         * On crée le custom_filters
         */
        const custom_filters: { [var_param_field_name: string]: { [widget_id: number]: ContextFilterVO } } = {};

        for (const var_param_field_name in var_custom_filters) {
            const custom_filter_name = var_custom_filters[var_param_field_name];

            if (!custom_filter_name) {
                continue;
            }

            const is_field_filter_empty = FieldFiltersVOHandler.is_field_filters_empty(
                { api_type_id: ContextFilterVO.CUSTOM_FILTERS_TYPE, field_id: custom_filter_name },
                widget_id,
                field_filters,
            );

            const custom_filter = !is_field_filter_empty ? field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][custom_filter_name][widget_id] : null;

            if (!custom_filter) {
                continue;
            }

            if (!custom_filters[var_param_field_name]) {
                custom_filters[var_param_field_name] = {};
            }

            custom_filters[var_param_field_name][widget_id] = custom_filter;
        }

        return custom_filters;
    }

    /**
     * Var Exportable Indicator
     *  - All vars indicator on the actual page to be exported
     *
     * @return {ExportVarIndicatorVO}
     */
    public static async get_exportable_vars_indicator(
        dashboard_page_widgets: DashboardPageWidgetVO[],
    ): Promise<ExportVarIndicatorVO> {

        const varcolumn_conf: { [xlsx_sheet_row_code_name: string]: ExportVarcolumnConfVO } = {};

        const var_page_widgets: {
            [page_widget_id: string]: WidgetOptionsMetadataVO
        } = await DashboardPageWidgetVOManager.filter_all_page_widgets_options_by_widget_name(
            dashboard_page_widgets,
            'var'
        );

        for (const key in var_page_widgets) {
            const var_page_widget = var_page_widgets[key];

            const var_widget_options = new VarWidgetOptionsVO().from(var_page_widget.widget_options);

            const conf: ExportVarcolumnConfVO = ExportVarcolumnConfVO.create_new(
                var_widget_options.var_id,
                var_widget_options.filter_custom_field_filters,
                var_widget_options.filter_type,
                var_widget_options.filter_additional_params
            );

            varcolumn_conf[var_page_widget.page_widget.titre] = conf;
        }

        // returns ordered_column_list, column_labels and varcolumn_conf
        return ExportVarIndicatorVO.create_new(
            ['name', 'value'],
            { name: 'Nom', value: 'Valeur' },
            varcolumn_conf
        );
    }
}
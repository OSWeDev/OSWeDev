import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";
import ExportVarIndicatorVO from "../../DataExport/vos/ExportVarIndicatorVO";
import ExportVarcolumnConfVO from "../../DataExport/vos/ExportVarcolumnConfVO";
import FieldFiltersVOHandler from "../handlers/FieldFiltersVOHandler";
import FieldFiltersVO from "../vos/FieldFiltersVO";
import VarWidgetOptionsVO from "../vos/VarWidgetOptionsVO";
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
        field_filters: FieldFiltersVO
    ): { [var_param_field_name: string]: ContextFilterVO } {

        /**
         * On crée le custom_filters
         */
        let custom_filters: { [var_param_field_name: string]: ContextFilterVO } = {};

        for (let var_param_field_name in var_custom_filters) {
            let custom_filter_name = var_custom_filters[var_param_field_name];

            if (!custom_filter_name) {
                continue;
            }

            const is_field_filter_empty = FieldFiltersVOHandler.is_field_filters_empty(
                { api_type_id: ContextFilterVO.CUSTOM_FILTERS_TYPE, field_id: custom_filter_name },
                field_filters,
            );

            let custom_filter = !is_field_filter_empty ? field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][custom_filter_name] : null;

            if (!custom_filter) {
                continue;
            }

            custom_filters[var_param_field_name] = custom_filter;
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
        dashboard_page_id: number,
    ): Promise<ExportVarIndicatorVO> {

        const varcolumn_conf: { [xlsx_sheet_row_code_name: string]: ExportVarcolumnConfVO } = {};

        const var_page_widgets: {
            [page_widget_id: string]: { widget_options: any, widget_name: string, dashboard_page_id: number, page_widget_id: number }
        } = await DashboardPageWidgetVOManager.filter_all_page_widgets_options_by_widget_name(
            [dashboard_page_id],
            'var'
        );

        for (const key in var_page_widgets) {
            const var_page_widget = var_page_widgets[key];

            const var_widget_options = new VarWidgetOptionsVO().from(var_page_widget.widget_options);
            const name = var_widget_options.get_title_name_code_text(var_page_widget.page_widget_id);

            let conf: ExportVarcolumnConfVO = ExportVarcolumnConfVO.create_new(
                var_widget_options.var_id,
                var_widget_options.filter_custom_field_filters,
                var_widget_options.filter_type,
                var_widget_options.filter_additional_params
            );

            varcolumn_conf[name] = conf;
        }

        // returns ordered_column_list, column_labels and varcolumn_conf
        return ExportVarIndicatorVO.create_new(
            ['name', 'value'],
            { name: 'Nom', value: 'Valeur' },
            varcolumn_conf
        );
    }

    public static getInstance(): VarWidgetManager {
        if (!VarWidgetManager.instance) {
            VarWidgetManager.instance = new VarWidgetManager();
        }
        return VarWidgetManager.instance;
    }

    private static instance: VarWidgetManager = null;
}
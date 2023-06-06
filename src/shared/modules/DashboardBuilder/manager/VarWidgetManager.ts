import ExportVarcolumnConf from "../../DataExport/vos/ExportVarcolumnConf";
import DashboardPageWidgetVOManager from "./DashboardPageWidgetVOManager";
import ExportVarIndicator from "../../DataExport/vos/ExportVarIndicator";
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";
import VarWidgetOptionsVO from "../vos/VarWidgetOptionsVO";
import FieldFiltersVO from "../vos/FieldFiltersVO";

/**
 * @class VarWidgetManager
 */
export default class VarWidgetManager {

    /**
     * get_var_custom_filters
     *
     * @param var_custom_filters
     * @param get_active_field_filters
     * @returns {{ [var_param_field_name: string]: ContextFilterVO }}
     */
    public static get_var_custom_filters(
        var_custom_filters: { [var_param_field_name: string]: string },
        get_active_field_filters: FieldFiltersVO
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

            let custom_filter = get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE] ? get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][custom_filter_name] : null;

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
     * @return {ExportVarIndicator}
     */
    public static get_exportable_vars_indicator(): ExportVarIndicator {

        const varcolumn_conf: { [xlsx_sheet_row_code_name: string]: ExportVarcolumnConf } = {};

        const var_page_widgets: {
            [page_widget_id: string]: { widget_options: any, widget_name: string, page_widget_id: number }
        } = DashboardPageWidgetVOManager.filter_all_page_widgets_options_by_widget_name('var');

        for (const key in var_page_widgets) {
            const var_page_widget = var_page_widgets[key];

            const var_widget_options = new VarWidgetOptionsVO().from(var_page_widget.widget_options);
            const name = var_widget_options.get_title_name_code_text(var_page_widget.page_widget_id);

            let conf: ExportVarcolumnConf = {
                custom_field_filters: var_widget_options.filter_custom_field_filters,
                filter_additional_params: var_widget_options.filter_additional_params,
                filter_type: var_widget_options.filter_type,
                var_id: var_widget_options.var_id
            };

            varcolumn_conf[name] = conf;
        }

        // returns ordered_column_list, column_labels and varcolumn_conf
        return new ExportVarIndicator(
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
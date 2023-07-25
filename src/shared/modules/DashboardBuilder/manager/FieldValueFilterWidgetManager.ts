import ConsoleHandler from "../../../tools/ConsoleHandler";
import ModuleContextFilter from "../../ContextFilter/ModuleContextFilter";
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";
import ContextQueryVO from "../../ContextFilter/vos/ContextQueryVO";
import ModuleTable from "../../ModuleTable";
import ModuleTableField from "../../ModuleTableField";
import VOsTypesManager from "../../VO/manager/VOsTypesManager";
import DashboardVO from "../vos/DashboardVO";
import FieldValueFilterWidgetOptionsVO from "../vos/FieldValueFilterWidgetOptionsVO";
import DashboardPageWidgetVOManager from "./DashboardPageWidgetVOManager";

/**
 * @class FieldValueFilterWidgetManager
 *  - This class is used to manage the field value filter widget
 */
export default class FieldValueFilterWidgetManager {

    /**
     * Get Field Value Filters Widgets Options
     *
     * @return {{ [title_name_code: string]: { widget_options: FieldValueFilterWidgetOptionsVO, widget_name: string, dashboard_page_id: number, page_widget_id: number } }}
     */
    public static async get_field_value_filters_widgets_options_metadata(
        dashboard_page_id: number,
    ): Promise<
        {
            [title_name_code: string]: { widget_options: FieldValueFilterWidgetOptionsVO, widget_name: string, dashboard_page_id: number, page_widget_id: number }
        }
    > {

        const valuetable_page_widgets: {
            [page_widget_id: string]: { widget_options: any, widget_name: string, dashboard_page_id: number, page_widget_id: number }
        } = await DashboardPageWidgetVOManager.filter_all_page_widgets_options_by_widget_name([dashboard_page_id], 'fieldvaluefilter');

        const res: {
            [title_name_code: string]: {
                widget_options: FieldValueFilterWidgetOptionsVO,
                widget_name: string,
                dashboard_page_id: number,
                page_widget_id: number
            }
        } = {};

        for (const key in valuetable_page_widgets) {
            const options = valuetable_page_widgets[key];

            const widget_options = new FieldValueFilterWidgetOptionsVO().from(options.widget_options);
            const name = widget_options.get_placeholder_name_code_text(options.page_widget_id);

            res[name] = {
                dashboard_page_id: options.dashboard_page_id,
                page_widget_id: options.page_widget_id,
                widget_name: options.widget_name,
                widget_options: widget_options
            };
        }

        return res;
    }

    /**
     * Add the discarded field paths to the context query
     *
     * @param {ContextQueryVO} context_query
     * @param {{ [vo_type: string]: { [field_id: string]: boolean } }} discarded_field_paths
     * @returns {ContextQueryVO}
     */
    public static add_discarded_field_paths(
        context_query: ContextQueryVO,
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } }
    ): ContextQueryVO {

        //On évite les jointures supprimées.
        for (const vo_type in discarded_field_paths) {
            const discarded_field_paths_vo_type = discarded_field_paths[vo_type];

            for (const field_id in discarded_field_paths_vo_type) {
                context_query.set_discarded_field_path(vo_type, field_id); //On annhile le chemin possible depuis la cellule source de champs field_id
            }
        }

        return context_query;
    }

    public static async get_overflowing_segmented_options_api_type_id_from_dashboard(
        dashboard: DashboardVO,
        context_query: ContextQueryVO,
        ignore_self_filter: boolean = true
    ): Promise<string> {

        /**
         * Si on est pas segmenté, mais qu'on a dans les active_api_type_ids un type segmenté, on check que le nombre d'option est faible pour la table segmentée,
         *  sinon on supprime les filtrages sur la table segmentée et on discard les fields, et on supprime du active_api_type_ids
         */
        let has_segmented: boolean = false;
        let overflowing_api_type_id: string = null;

        for (let i in dashboard.api_type_ids) {
            let api_type_id: string = dashboard.api_type_ids[i];
            let module_table: ModuleTable<any> = VOsTypesManager.moduleTables_by_voType[api_type_id];

            if (module_table && module_table.is_segmented) {

                // On ne devrait pas avoir plus d'une table segmentée dans les api_type_ids sinon not implemented
                if (has_segmented) {
                    throw new Error('On ne peut pas avoir plusieurs tables segmentées dans un dashboard');
                }

                has_segmented = true;

                let count_segmentations = await ModuleContextFilter.getInstance().count_valid_segmentations(
                    api_type_id,
                    context_query,
                    ignore_self_filter
                );

                if (count_segmentations > 20) {
                    ConsoleHandler.warn('On a trop d\'options (' + count_segmentations + ') pour la table segmentée ' + overflowing_api_type_id + ', on ne filtre pas sur cette table');
                    overflowing_api_type_id = api_type_id;
                }
            }
        }

        return overflowing_api_type_id;
    }

    public static remove_overflowing_api_type_id_from_context_query(
        context_query: ContextQueryVO,
        api_type_id: string,
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } },
    ) {

        if (api_type_id?.length > 0) {
            let new_filters = [];

            for (let i in context_query.filters) {
                const context_filter: ContextFilterVO = context_query.filters[i];

                if (context_filter.vo_type == api_type_id) {
                    continue;
                }

                new_filters.push(context_filter);
            }

            context_query.filters = new_filters;

            context_query.active_api_type_ids = context_query.active_api_type_ids.filter((_api_type_id: string) => {
                return api_type_id != _api_type_id;
            });

            FieldValueFilterWidgetManager.add_discarded_field_paths(
                context_query,
                discarded_field_paths
            );

            let segmented_moduletable = VOsTypesManager.moduleTables_by_voType[api_type_id];
            let fields = segmented_moduletable.get_fields();

            for (let i in fields) {
                let field: ModuleTableField<any> = fields[i];

                if (!field.manyToOne_target_moduletable) {
                    continue;
                }

                context_query.set_discarded_field_path(api_type_id, field.field_id);
            }
        }

        return context_query;
    }

    public static getInstance(): FieldValueFilterWidgetManager {
        if (!this.instance) {
            this.instance = new FieldValueFilterWidgetManager();
        }

        return this.instance;
    }

    protected static instance = null;

    constructor() { }
}
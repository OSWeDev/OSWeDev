import ConsoleHandler from "../../../tools/ConsoleHandler";
import ModuleContextFilter from "../../ContextFilter/ModuleContextFilter";
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";
import ContextQueryVO from "../../ContextFilter/vos/ContextQueryVO";
import DashboardVO from "../vos/DashboardVO";
import ModuleTableField from "../../ModuleTableField";
import ModuleTable from "../../ModuleTable";
import VOsTypesManager from "../../VO/manager/VOsTypesManager";

/**
 * VOFilterWidgetManager
 */
export default class VOFilterWidgetManager {

    public static getInstance(): VOFilterWidgetManager {
        if (!this.instance) {
            this.instance = new VOFilterWidgetManager();
        }

        return this.instance;
    }

    protected static instance = null;

    private constructor() {

    }

    public add_discarded_field_paths(
        context_query: ContextQueryVO,
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } }
    ): ContextQueryVO {

        //On évite les jointures supprimées.
        for (let vo_type in discarded_field_paths) {
            let discarded_field_paths_vo_type = discarded_field_paths[vo_type];

            for (let field_id in discarded_field_paths_vo_type) {
                context_query.discard_field_path(vo_type, field_id); //On annhile le chemin possible depuis la cellule source de champs field_id
            }
        }

        return context_query;
    }

    public async check_segmented_dependencies(
        dashboard: DashboardVO,
        context_query: ContextQueryVO,
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } },
        ignore_self_filter: boolean = true
    ): Promise<ContextQueryVO> {

        /**
         * Si on est pas segmenté, mais qu'on a dans les active_api_type_ids un type segmenté, on check que le nombre d'option est faible pour la table segmentée,
         *  sinon on supprime les filtrages sur la table segmentée et on discard les fields, et on supprime du active_api_type_ids
         */
        let has_segmented: boolean = false;
        let has_segmented_too_much_options: boolean = false;
        let has_segmented_too_much_options_api_type_id: string = null;

        for (let i in dashboard.api_type_ids) {
            let api_type_id: string = dashboard.api_type_ids[i];
            let module_table: ModuleTable<any> = VOsTypesManager.moduleTables_by_voType[api_type_id];

            if (module_table && module_table.is_segmented) {

                // On ne devrait pas avoir plus d'une table segmentée dans les api_type_ids sinon not implemented
                if (has_segmented) {
                    throw new Error('On ne peut pas avoir plusieurs tables segmentées dans un dashboard');
                }

                has_segmented = true;

                let count_segmentations = await ModuleContextFilter.getInstance().count_valid_segmentations(api_type_id, context_query, ignore_self_filter);

                if (count_segmentations > 20) {
                    ConsoleHandler.warn('On a trop d\'options (' + count_segmentations + ') pour la table segmentée ' + has_segmented_too_much_options_api_type_id + ', on ne filtre pas sur cette table');
                    has_segmented_too_much_options = true;
                    has_segmented_too_much_options_api_type_id = api_type_id;
                }
            }
        }

        if (has_segmented_too_much_options && has_segmented_too_much_options_api_type_id) {
            let new_filters = [];
            for (let i in context_query.filters) {
                let context_filter: ContextFilterVO = context_query.filters[i];

                if (context_filter.vo_type == has_segmented_too_much_options_api_type_id) {
                    continue;
                }

                new_filters.push(context_filter);
            }

            context_query.filters = new_filters;
            context_query.active_api_type_ids = context_query.active_api_type_ids.filter((api_type_id: string) => {
                return api_type_id != has_segmented_too_much_options_api_type_id;
            });

            VOFilterWidgetManager.getInstance().add_discarded_field_paths(context_query, discarded_field_paths);

            let segmented_moduletable = VOsTypesManager.moduleTables_by_voType[has_segmented_too_much_options_api_type_id];
            let fields = segmented_moduletable.get_fields();
            for (let i in fields) {
                let field: ModuleTableField<any> = fields[i];
                if (!field.manyToOne_target_moduletable) {
                    continue;
                }
                context_query.discard_field_path(has_segmented_too_much_options_api_type_id, field.field_id);
            }
        }

        return context_query;
    }
}
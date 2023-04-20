import ConsoleHandler from "../../../tools/ConsoleHandler";
import ModuleContextFilter from "../../ContextFilter/ModuleContextFilter";
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";
import ContextQueryVO from "../../ContextFilter/vos/ContextQueryVO";
import ModuleTable from "../../ModuleTable";
import ModuleTableField from "../../ModuleTableField";
import { VOsTypesManager } from "../../VO/manager/VOsTypesManager";
import DashboardVO from "../vos/DashboardVO";

/**
 * @class FieldValueFilterWidgetManager
 *  - This class is used to manage the field value filter widget
 */
export class FieldValueFilterWidgetManager {

    public static add_discarded_field_paths(q: ContextQueryVO, discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } }): ContextQueryVO {

        //On évite les jointures supprimées.
        for (let vo_type in discarded_field_paths) {
            let discarded_field_paths_vo_type = discarded_field_paths[vo_type];

            for (let field_id in discarded_field_paths_vo_type) {
                q.discard_field_path(vo_type, field_id); //On annhile le chemin possible depuis la cellule source de champs field_id
            }
        }

        return q;
    }

    public static async get_overflowing_segmented_options_api_type_id_from_dashboard(
        dashboard: DashboardVO,
        _query: ContextQueryVO,
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

                let count_segmentations = await ModuleContextFilter.getInstance().count_valid_segmentations(api_type_id, _query, ignore_self_filter);

                if (count_segmentations > 20) {
                    ConsoleHandler.warn('On a trop d\'options (' + count_segmentations + ') pour la table segmentée ' + overflowing_api_type_id + ', on ne filtre pas sur cette table');
                    overflowing_api_type_id = api_type_id;
                }
            }
        }

        return overflowing_api_type_id;
    }

    public static remove_overflowing_api_type_id_from_context_query(
        _query: ContextQueryVO,
        api_type_id: string,
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } },
    ) {

        if (api_type_id?.length > 0) {
            let new_filters = [];

            for (let i in _query.filters) {
                let filter_: ContextFilterVO = _query.filters[i];

                if (filter_.vo_type == api_type_id) {
                    continue;
                }

                new_filters.push(filter_);
            }

            _query.filters = new_filters;

            _query.active_api_type_ids = _query.active_api_type_ids.filter((_api_type_id: string) => {
                return api_type_id != _api_type_id;
            });

            FieldValueFilterWidgetManager.add_discarded_field_paths(_query, discarded_field_paths);

            let segmented_moduletable = VOsTypesManager.moduleTables_by_voType[api_type_id];
            let fields = segmented_moduletable.get_fields();

            for (let i in fields) {
                let field: ModuleTableField<any> = fields[i];

                if (!field.manyToOne_target_moduletable) {
                    continue;
                }

                _query.discard_field_path(api_type_id, field.field_id);
            }
        }

        return _query;
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
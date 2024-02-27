import FieldValueFilterWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldValueFilterWidgetManager';
import ModuleContextFilter from "../../../../../../shared/modules/ContextFilter/ModuleContextFilter";
import ContextFilterVO from "../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO";
import ContextQueryVO from "../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import DashboardVO from "../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO";
import ModuleTableVO from "../../../../../../shared/modules/ModuleTableVO";
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from "../../../../../../shared/modules/ModuleTableFieldVO";
import VOsTypesManager from "../../../../../../shared/modules/VO/manager/VOsTypesManager";
import ConsoleHandler from "../../../../../../shared/tools/ConsoleHandler";

export default class FieldValueFilterWidgetController extends FieldValueFilterWidgetManager {

    public static get_query_param_filter_name(api_type_id: string, field_id: string): string {
        return 'FILTER__' + api_type_id + '__' + field_id;
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): FieldValueFilterWidgetController {
        if (!this.instance) {
            this.instance = new FieldValueFilterWidgetController();
        }

        return this.instance;
    }

    protected static instance = null;

    private constructor() {
        super();
    }

    public add_discarded_field_paths(q: ContextQueryVO, discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } }): ContextQueryVO {

        //On évite les jointures supprimées.
        for (const vo_type in discarded_field_paths) {
            const discarded_field_paths_vo_type = discarded_field_paths[vo_type];

            for (const field_id in discarded_field_paths_vo_type) {
                q.discard_field_path(vo_type, field_id); //On annhile le chemin possible depuis la cellule source de champs field_id
            }
        }

        return q;
    }

    public async check_segmented_dependencies(
        query_: ContextQueryVO,
        api_type_ids: string[],
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } },
        ignore_self_filter: boolean = true): Promise<ContextQueryVO> {

        /**
         * Si on est pas segmenté, mais qu'on a dans les active_api_type_ids un type segmenté, on check que le nombre d'option est faible pour la table segmentée,
         *  sinon on supprime les filtrages sur la table segmentée et on discard les fields, et on supprime du active_api_type_ids
         */
        let has_segmented: boolean = false;
        let has_segmented_too_much_options: boolean = false;
        let has_segmented_too_much_options_api_type_id: string = null;

        for (const i in api_type_ids) {
            const api_type_id: string = api_type_ids[i];
            const module_table: ModuleTableVO = ModuleTableController.module_tables_by_vo_type[api_type_id];

            if (module_table && module_table.is_segmented) {

                // On ne devrait pas avoir plus d'une table segmentée dans les api_type_ids sinon not implemented
                if (has_segmented) {
                    throw new Error('On ne peut pas avoir plusieurs tables segmentées dans un dashboard');
                }

                has_segmented = true;

                const count_segmentations = await ModuleContextFilter.getInstance().count_valid_segmentations(api_type_id, query_, ignore_self_filter);

                if (count_segmentations > ModuleContextFilter.MAX_SEGMENTATION_OPTIONS) {
                    ConsoleHandler.warn('On a trop d\'options (' + count_segmentations + '/' + ModuleContextFilter.MAX_SEGMENTATION_OPTIONS + ') pour la table segmentée ' + has_segmented_too_much_options_api_type_id + ', on ne filtre pas sur cette table');
                    has_segmented_too_much_options = true;
                    has_segmented_too_much_options_api_type_id = api_type_id;
                }
            }
        }

        if (has_segmented_too_much_options && has_segmented_too_much_options_api_type_id) {
            const new_filters = [];
            for (const i in query_.filters) {
                const filter_: ContextFilterVO = query_.filters[i];

                if (filter_.vo_type == has_segmented_too_much_options_api_type_id) {
                    continue;
                }
                new_filters.push(filter_);
            }

            query_.filters = new_filters;
            query_.active_api_type_ids = query_.active_api_type_ids.filter((api_type_id: string) => {
                return api_type_id != has_segmented_too_much_options_api_type_id;
            });
            FieldValueFilterWidgetController.getInstance().add_discarded_field_paths(query_, discarded_field_paths);

            const segmented_moduletable = ModuleTableController.module_tables_by_vo_type[has_segmented_too_much_options_api_type_id];
            const fields = segmented_moduletable.get_fields();
            for (const i in fields) {
                const field: ModuleTableFieldVO = fields[i];
                if (!field.manyToOne_target_moduletable) {
                    continue;
                }
                query_.discard_field_path(has_segmented_too_much_options_api_type_id, field.field_id);
            }
        }

        return query_;
    }
}
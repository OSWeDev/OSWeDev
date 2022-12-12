import ModuleContextFilter from "../../../../../../shared/modules/ContextFilter/ModuleContextFilter";
import ContextFilterVO from "../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO";
import ContextQueryVO from "../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import DashboardVO from "../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO";
import ModuleTable from "../../../../../../shared/modules/ModuleTable";
import ModuleTableField from "../../../../../../shared/modules/ModuleTableField";
import VOsTypesManager from "../../../../../../shared/modules/VOsTypesManager";
import ConsoleHandler from "../../../../../../shared/tools/ConsoleHandler";

export default class FieldValueFilterWidgetController {

    public static getInstance(): FieldValueFilterWidgetController {
        if (!this.instance) {
            this.instance = new FieldValueFilterWidgetController();
        }

        return this.instance;
    }

    private static instance = null;

    private constructor() { }

    public async check_segmented_dependencies(dashboard: DashboardVO, query_: ContextQueryVO, ignore_self_filter: boolean = true): Promise<ContextQueryVO> {

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

                let count_segmentations = await ModuleContextFilter.getInstance().count_valid_segmentations(api_type_id, query_, ignore_self_filter);

                if (count_segmentations > 20) {
                    ConsoleHandler.getInstance().warn('On a trop d\'options (' + count_segmentations + ') pour la table segmentée ' + has_segmented_too_much_options_api_type_id + ', on ne filtre pas sur cette table');
                    has_segmented_too_much_options = true;
                    has_segmented_too_much_options_api_type_id = api_type_id;
                }
            }
        }

        if (has_segmented_too_much_options && has_segmented_too_much_options_api_type_id) {
            let new_filters = [];
            for (let i in query_.filters) {
                let filter_: ContextFilterVO = query_.filters[i];

                if (filter_.vo_type == has_segmented_too_much_options_api_type_id) {
                    continue;
                }
                new_filters.push(filter_);
            }

            query_.filters = new_filters;
            query_.active_api_type_ids = query_.active_api_type_ids.filter((api_type_id: string) => {
                return api_type_id != has_segmented_too_much_options_api_type_id;
            });
            let segmented_moduletable = VOsTypesManager.moduleTables_by_voType[has_segmented_too_much_options_api_type_id];
            let fields = segmented_moduletable.get_fields();
            for (let i in fields) {
                let field: ModuleTableField<any> = fields[i];
                if (!field.manyToOne_target_moduletable) {
                    continue;
                }
                query_.discard_field_path(has_segmented_too_much_options_api_type_id, field.field_id);
            }
        }

        return query_;
    }
}
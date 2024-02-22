import pgPromise from 'pg-promise';
import ContextQueryVO from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ParameterizedQueryWrapperField from "../../../../shared/modules/ContextFilter/vos/ParameterizedQueryWrapperField";
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import StatsController from '../../../../shared/modules/Stats/StatsController';
import ModuleTableField from '../../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';

export default class ThrottledSelectQueryParam {

    public static ThrottledSelectQueryParam_index: number = 1;

    public index: number = null;
    public semaphore: boolean = false;

    public parameterized_full_query: string;
    public fields_labels: string = null;

    private time_in: number = null;
    private post_unstack_time_in: number = null;
    private pre_cbs_time_in: number = null;

    public constructor(
        public cbs: Array<(...any) => void>,
        public context_query: ContextQueryVO,
        public parameterizedQueryWrapperFields: ParameterizedQueryWrapperField[],
        query_: string,
        values: any) {
        this.parameterized_full_query = (values && values.length) ? pgPromise.as.format(query_, values) : query_;
        this.index = ThrottledSelectQueryParam.ThrottledSelectQueryParam_index++;
        this.time_in = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('ThrottledSelectQueryParam', 'init', '-');

        this.define_fields_labels();
    }

    public register_unstack_stats() {
        StatsController.register_stat_COMPTEUR('ThrottledSelectQueryParam', 'unstack', '-');
        this.post_unstack_time_in = Dates.now_ms();
    }

    public register_precbs_stats() {
        StatsController.register_stat_COMPTEUR('ThrottledSelectQueryParam', 'precbs', '-');
        StatsController.register_stat_DUREE('ThrottledSelectQueryParam', 'start_to_unstack', '-', this.post_unstack_time_in - this.time_in);
        StatsController.register_stat_DUREE('ThrottledSelectQueryParam', 'unstack_to_precbs', '-', Dates.now_ms() - this.post_unstack_time_in);
        StatsController.register_stat_DUREE('ThrottledSelectQueryParam', 'start_to_precbs', '-', Dates.now_ms() - this.time_in);
        this.pre_cbs_time_in = Dates.now_ms();
    }

    public register_postcbs_stats() {
        StatsController.register_stat_COMPTEUR('ThrottledSelectQueryParam', 'postcbs', '-');
        StatsController.register_stat_DUREE('ThrottledSelectQueryParam', 'precbs_to_postcbs', '-', Dates.now_ms() - this.pre_cbs_time_in);
        StatsController.register_stat_DUREE('ThrottledSelectQueryParam', 'unstack_to_postcbs', '-', Dates.now_ms() - this.post_unstack_time_in);
        StatsController.register_stat_DUREE('ThrottledSelectQueryParam', 'start_to_postcbs', '-', Dates.now_ms() - this.time_in);
    }

    private define_fields_labels() {
        let fields = this.parameterizedQueryWrapperFields;
        let fields_labels: string = null;

        fields_labels = (this.context_query && this.context_query.do_count_results) ? 'number,c' : null;

        if (!fields_labels) {
            fields_labels = fields ? fields.map((field) => {

                // On a besoin du type du champs et de l'alias
                let table_field_type = 'N/A';

                try {

                    // si on a pas de moduletable, on est sur une sélection issue d'une sous-requete. On va chercher le type dans la sous-requete
                    let table = VOsTypesManager.moduleTables_by_voType[field.api_type_id];
                    if (!table) {
                        let sub_query = this.context_query.joined_context_queries.find((joinedcq) => joinedcq.joined_table_alias == field.api_type_id);
                        if (!sub_query) {
                            throw new Error('throttled_select_query : error while getting field type for field ' + field.field_id + ' of type ' + field.api_type_id + ' : no subquery found');
                        }

                        // on doit retrouver le champs qui a le même id/alias
                        let sub_field = sub_query.joined_context_query.fields.find((sq_field) => sq_field.alias == field.row_col_alias);
                        if (!sub_field) {
                            throw new Error('throttled_select_query : error while getting field type for field ' + field.field_id + ' of type ' + field.api_type_id + ' : no subquery field found');
                        }

                        table_field_type = (sub_field.field_name == 'id') ? ModuleTableField.FIELD_TYPE_int :
                            VOsTypesManager.moduleTables_by_voType[sub_field.api_type_id].getFieldFromId(sub_field.field_name)?.field_type ?? 'N/A';
                    } else {
                        table_field_type = (field.field_id == 'id') ? ModuleTableField.FIELD_TYPE_int :
                            VOsTypesManager.moduleTables_by_voType[field.api_type_id].getFieldFromId(field.field_id)?.field_type ?? 'N/A';
                    }
                } catch (error) {
                    ConsoleHandler.error('throttled_select_query : error while getting field type for field ' + field.field_id + ' of type ' + field.api_type_id);
                }

                return table_field_type + ',' + field.row_col_alias;

            }).join(';') : null;
        }

        if (!fields_labels) {
            ConsoleHandler.warn('Throttled select query without fields, not supported yet');
        }

        this.fields_labels = fields_labels;
    }
}
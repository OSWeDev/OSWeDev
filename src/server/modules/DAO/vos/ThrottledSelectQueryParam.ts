import pgPromise from 'pg-promise';
import ContextQueryVO from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ParameterizedQueryWrapperField from "../../../../shared/modules/ContextFilter/vos/ParameterizedQueryWrapperField";
import ModuleTableController from '../../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldVO from '../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import StatsController from '../../../../shared/modules/Stats/StatsController';
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

        this.get_fields_labels();
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

    private get_fields_labels() {
        const fields = this.parameterizedQueryWrapperFields;
        let fields_labels: string = null;

        fields_labels = (this.context_query && this.context_query.do_count_results) ? 'number,c' : null;

        if (!fields_labels) {
            fields_labels = fields ? fields.map(this.get_field_label.bind(this)).join(';') : null;
        }

        if (!fields_labels) {
            ConsoleHandler.warn('Throttled select query without fields, not supported yet');
        }

        this.fields_labels = fields_labels;
    }

    private get_field_label(field: ParameterizedQueryWrapperField): string {

        // On a besoin du type du champs et de l'alias
        let table_field_type = 'N/A';

        try {

            // Si le champs est un opérateur, et qu'il y a plusieurs champs, on va chercher le nom des champs liés, et on concat le tout
            if (field.operator && field.operator_fields && field.operator_fields.length) {
                return field.operator + "##" + field.operator_fields.map((operator_field) => this.get_field_label(operator_field)).join('#') + '##' + field.row_col_alias;
            }

            if (field.static_value != null) {
                return 'static,' + field.static_value;
            }

            // si on a pas de moduletable, on est sur une sélection issue d'une sous-requete. On va chercher le type dans la sous-requete
            const table = ModuleTableController.module_tables_by_vo_type[field.api_type_id];
            if (!table) {
                const sub_query = this.context_query.joined_context_queries.find((joinedcq) => joinedcq.joined_table_alias == field.api_type_id);
                if (!sub_query) {
                    throw new Error('throttled_select_query : error while getting field type for field ' + field.field_id + ' of type ' + field.api_type_id + ' : no subquery found');
                }

                // on doit retrouver le champs qui a le même id/alias
                const sub_field = sub_query.joined_context_query.fields.find((sq_field) => sq_field.alias == field.row_col_alias);
                if (!sub_field) {
                    throw new Error('throttled_select_query : error while getting field type for field ' + field.field_id + ' of type ' + field.api_type_id + ' : no subquery field found');
                }

                table_field_type = (sub_field.field_name == 'id') ? ModuleTableFieldVO.FIELD_TYPE_int :
                    ModuleTableController.module_tables_by_vo_type[sub_field.api_type_id].getFieldFromId(sub_field.field_name)?.field_type ?? 'N/A';
            } else {
                table_field_type = (field.field_id == 'id') ? ModuleTableFieldVO.FIELD_TYPE_int :
                    ModuleTableController.module_tables_by_vo_type[field.api_type_id].getFieldFromId(field.field_id)?.field_type ?? 'N/A';
            }
        } catch (error) {
            ConsoleHandler.error('throttled_select_query : error while getting field type for field ' + field.field_id + ' of type ' + field.api_type_id);
        }

        return table_field_type + ',' + field.row_col_alias;
    }
}
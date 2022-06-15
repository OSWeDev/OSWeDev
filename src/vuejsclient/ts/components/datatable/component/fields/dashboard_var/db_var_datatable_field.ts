import { cloneDeep } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterVO from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import TableColumnDescVO from '../../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import NumSegment from '../../../../../../../shared/modules/DataRender/vos/NumSegment';
import TimeSegment from '../../../../../../../shared/modules/DataRender/vos/TimeSegment';
import ModuleTableField from '../../../../../../../shared/modules/ModuleTableField';
import ModuleVar from '../../../../../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VOsTypesManager from '../../../../../../../shared/modules/VOsTypesManager';
import RangeHandler from '../../../../../../../shared/tools/RangeHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import { ModuleDashboardPageGetter } from '../../../../dashboard_builder/page/DashboardPageStore';
import VueComponentBase from '../../../../VueComponentBase';
import './db_var_datatable_field.scss';

@Component({
    template: require('./db_var_datatable_field.pug'),
    components: {}
})
export default class DBVarDatatableFieldComponent extends VueComponentBase {

    @Prop()
    public var_id: number;

    @Prop()
    public filter_type: string;

    @Prop()
    public filter_additional_params: string;

    @Prop()
    private dashboard_id: number;

    @Prop({ default: null })
    private row_value: any;

    @Prop({ default: null })
    private columns: TableColumnDescVO[];

    @ModuleDashboardPageGetter
    private get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };

    private throttled_init_param = ThrottleHelper.getInstance().declare_throttle_without_args(this.init_param.bind(this), 300, { leading: false, trailing: true });

    private var_param: VarDataBaseVO = null;
    private dashboard: DashboardVO = null;


    @Watch('dashboard_id', { immediate: true })
    @Watch('var_id', { immediate: true })
    @Watch('filter_type', { immediate: true })
    @Watch('filter_additional_params', { immediate: true })
    @Watch('get_active_field_filters', { immediate: true })
    @Watch('row_value', { immediate: true })
    @Watch('columns', { immediate: true })
    private async onchange_dashboard_id() {
        await this.throttled_init_param();

    }

    private async init_param() {

        if ((!this.dashboard_id) || (!this.var_id)) {
            this.dashboard = null;
            this.var_param = null;
            return;
        }

        this.dashboard = await ModuleDAO.getInstance().getVoById<DashboardVO>(DashboardVO.API_TYPE_ID, this.dashboard_id);

        /**
         * Si on a des colonnes qui sont des colonnes de données sur la row, on doit amender les filtres pour ajouter le "contexte" de la ligne
         */
        let context = cloneDeep(this.get_active_field_filters);
        if (!context) {
            context = {};
        }

        for (let i in this.columns) {
            let column = this.columns[i];

            if (column.type != TableColumnDescVO.TYPE_vo_field_ref) {
                continue;
            }

            if (!context[column.api_type_id]) {
                context[column.api_type_id] = {};
            }

            let field_filter = this.get_ContextFilterVO_add_Column_context(column);

            if (!context[column.api_type_id][column.field_id]) {
                context[column.api_type_id][column.field_id] = field_filter;
            } else {

                let existing_filter = context[column.api_type_id][column.field_id];
                let and_filter = new ContextFilterVO();
                and_filter.field_id = column.field_id;
                and_filter.vo_type = column.api_type_id;
                and_filter.filter_type = ContextFilterVO.TYPE_FILTER_AND;
                and_filter.left_hook = existing_filter;
                and_filter.right_hook = field_filter;
                context[column.api_type_id][column.field_id] = and_filter;
            }
        }

        /**
         * On crée le custom_filters
         */
        let custom_filters: { [var_param_field_name: string]: ContextFilterVO } = {};
        throw new Error('Not implemented');

        this.var_param = await ModuleVar.getInstance().getVarParamFromContextFilters(
            VarsController.getInstance().var_conf_by_id[this.var_id].name,
            context,
            custom_filters,
            this.dashboard.api_type_ids);
    }


    private get_ContextFilterVO_add_Column_context(column: TableColumnDescVO): ContextFilterVO {
        let translated_active_options = new ContextFilterVO();

        translated_active_options.field_id = column.field_id;
        translated_active_options.vo_type = column.api_type_id;

        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[column.api_type_id];
        let field = moduletable.get_field_by_id(column.field_id);

        if (this.row_value[column.field_id] == null) {
            translated_active_options.filter_type = ContextFilterVO.TYPE_NULL_ALL;
        } else {
            switch (field.field_type) {
                case ModuleTableField.FIELD_TYPE_file_ref:
                case ModuleTableField.FIELD_TYPE_image_field:
                case ModuleTableField.FIELD_TYPE_image_ref:
                case ModuleTableField.FIELD_TYPE_enum:
                case ModuleTableField.FIELD_TYPE_int:
                case ModuleTableField.FIELD_TYPE_geopoint:
                case ModuleTableField.FIELD_TYPE_float:
                case ModuleTableField.FIELD_TYPE_decimal_full_precision:
                case ModuleTableField.FIELD_TYPE_amount:
                case ModuleTableField.FIELD_TYPE_foreign_key:
                case ModuleTableField.FIELD_TYPE_isoweekdays:
                case ModuleTableField.FIELD_TYPE_prct:
                case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                case ModuleTableField.FIELD_TYPE_hour:
                    translated_active_options.filter_type = ContextFilterVO.TYPE_NUMERIC_EQUALS;
                    translated_active_options.param_numeric = this.row_value[column.field_id];
                    break;

                case ModuleTableField.FIELD_TYPE_tstz:
                    translated_active_options.filter_type = ContextFilterVO.TYPE_DATE_EQUALS;
                    translated_active_options.param_numeric = this.row_value[column.field_id];
                    break;

                case ModuleTableField.FIELD_TYPE_html:
                case ModuleTableField.FIELD_TYPE_password:
                case ModuleTableField.FIELD_TYPE_email:
                case ModuleTableField.FIELD_TYPE_file_field:
                case ModuleTableField.FIELD_TYPE_string:
                case ModuleTableField.FIELD_TYPE_textarea:
                case ModuleTableField.FIELD_TYPE_translatable_text:
                    translated_active_options.filter_type = ContextFilterVO.TYPE_TEXT_EQUALS_ALL;
                    translated_active_options.param_text = this.row_value[column.field_id];
                    break;

                case ModuleTableField.FIELD_TYPE_plain_vo_obj:
                case ModuleTableField.FIELD_TYPE_html_array:
                    throw new Error('Not Implemented');

                case ModuleTableField.FIELD_TYPE_boolean:
                    if (!!this.row_value[column.field_id]) {
                        translated_active_options.filter_type = ContextFilterVO.TYPE_BOOLEAN_TRUE_ALL;
                    } else {
                        translated_active_options.filter_type = ContextFilterVO.TYPE_BOOLEAN_FALSE_ALL;
                    }
                    break;

                case ModuleTableField.FIELD_TYPE_numrange:
                    throw new Error('Not Implemented');

                case ModuleTableField.FIELD_TYPE_numrange_array:
                case ModuleTableField.FIELD_TYPE_refrange_array:
                    throw new Error('Not Implemented');

                case ModuleTableField.FIELD_TYPE_daterange:
                    throw new Error('Not Implemented');

                case ModuleTableField.FIELD_TYPE_hourrange:
                    throw new Error('Not Implemented');

                case ModuleTableField.FIELD_TYPE_tsrange:
                    throw new Error('Not Implemented');

                case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    throw new Error('Not Implemented');

                case ModuleTableField.FIELD_TYPE_hourrange_array:
                    throw new Error('Not Implemented');

                case ModuleTableField.FIELD_TYPE_int_array:
                case ModuleTableField.FIELD_TYPE_float_array:
                case ModuleTableField.FIELD_TYPE_tstz_array:
                    throw new Error('Not Implemented');

                case ModuleTableField.FIELD_TYPE_string_array:
                    throw new Error('Not Implemented');

                case ModuleTableField.FIELD_TYPE_date:
                case ModuleTableField.FIELD_TYPE_day:
                case ModuleTableField.FIELD_TYPE_month:
                    translated_active_options.filter_type = ContextFilterVO.TYPE_DATE_EQUALS;
                    translated_active_options.param_numeric = this.row_value[column.field_id];
                    break;

                case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                    throw new Error('Not Implemented');
            }
        }

        return translated_active_options;
    }

    get var_filter(): string {
        return this.filter_type ? this.const_filters[this.filter_type].read : undefined;
    }

    get var_filter_additional_params(): string {
        return this.filter_additional_params ? JSON.parse(this.filter_additional_params) : undefined;
    }
}
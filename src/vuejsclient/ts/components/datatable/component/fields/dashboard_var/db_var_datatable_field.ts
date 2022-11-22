import { cloneDeep } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterVO, { filter } from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardBuilderController from '../../../../../../../shared/modules/DashboardBuilder/DashboardBuilderController';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import TableColumnDescVO from '../../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import NumSegment from '../../../../../../../shared/modules/DataRender/vos/NumSegment';
import TimeSegment from '../../../../../../../shared/modules/DataRender/vos/TimeSegment';
import ModuleTableField from '../../../../../../../shared/modules/ModuleTableField';
import ModuleVar from '../../../../../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VOsTypesManager from '../../../../../../../shared/modules/VOsTypesManager';
import ObjectHandler from '../../../../../../../shared/tools/ObjectHandler';
import RangeHandler from '../../../../../../../shared/tools/RangeHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import { ModuleDashboardPageGetter } from '../../../../dashboard_builder/page/DashboardPageStore';
import VarWidgetComponent from '../../../../dashboard_builder/widgets/var_widget/VarWidgetComponent';
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

    @Prop({ default: null })
    public filter_custom_field_filters: { [field_id: string]: string };

    @Prop()
    private dashboard_id: number;

    @Prop({ default: null })
    private row_value: any;

    @Prop({ default: null })
    private columns: TableColumnDescVO[];

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };

    private throttled_init_param = ThrottleHelper.getInstance().declare_throttle_without_args(this.init_param.bind(this), 300, { leading: false, trailing: true });

    private var_param: VarDataBaseVO = null;
    private dashboard: DashboardVO = null;

    get var_custom_filters(): { [var_param_field_name: string]: string } {

        return ObjectHandler.getInstance().hasAtLeastOneAttribute(this.filter_custom_field_filters) ? this.filter_custom_field_filters : null;
    }

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

        this.isLoading = true;

        if ((!this.dashboard_id) || (!this.var_id)) {
            this.dashboard = null;
            this.var_param = null;
            this.isLoading = false;
            return;
        }

        this.dashboard = await query(DashboardVO.API_TYPE_ID).filter_by_id(this.dashboard_id).select_vo<DashboardVO>();

        let context = DashboardBuilderController.getInstance().add_table_row_context(cloneDeep(this.get_active_field_filters), this.columns, this.row_value);

        /**
         * On crée le custom_filters
         */
        let custom_filters: { [var_param_field_name: string]: ContextFilterVO } = VarWidgetComponent.get_var_custom_filters(this.var_custom_filters, this.get_active_field_filters);

        this.var_param = await ModuleVar.getInstance().getVarParamFromContextFilters(
            VarsController.getInstance().var_conf_by_id[this.var_id].name,
            context,
            custom_filters,
            this.dashboard.api_type_ids,
            this.get_discarded_field_paths);

        this.isLoading = false;
    }

    get var_filter(): string {
        return this.filter_type ? this.const_filters[this.filter_type].read : undefined;
    }

    get var_filter_additional_params(): string {
        return this.filter_additional_params ? JSON.parse(this.filter_additional_params) : undefined;
    }
}
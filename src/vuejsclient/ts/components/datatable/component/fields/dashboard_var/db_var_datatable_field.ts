import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterVO from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import ModuleVar from '../../../../../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../../../../shared/modules/Var/vos/VarDataBaseVO';
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

    @ModuleDashboardPageGetter
    private get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };

    private throttled_init_param = ThrottleHelper.getInstance().declare_throttle_without_args(this.init_param.bind(this), 300, { leading: false });

    private var_param: VarDataBaseVO = null;
    private dashboard: DashboardVO = null;


    @Watch('dashboard_id')
    private async onchange_dashboard_id() {

    }

    private async init_param() {

        if ((!this.dashboard_id) || (!this.var_id)) {
            this.dashboard = null;
            this.var_param = null;
            return;
        }

        this.dashboard = await ModuleDAO.getInstance().getVoById<DashboardVO>(DashboardVO.API_TYPE_ID, this.dashboard_id);
        this.var_param = await ModuleVar.getInstance().getVarParamFromContextFilters(
            VarsController.getInstance().var_conf_by_id[this.var_id].name,
            this.get_active_field_filters, this.dashboard.api_type_ids);
    }

    get var_filter(): string {
        return this.filter_type ? this.const_filters[this.filter_type].read : undefined;
    }

    get var_filter_additional_params(): string {
        return this.filter_additional_params ? JSON.parse(this.filter_additional_params) : undefined;
    }
}
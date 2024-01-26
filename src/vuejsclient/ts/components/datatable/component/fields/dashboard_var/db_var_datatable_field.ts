import { cloneDeep, debounce } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterVO from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import TableColumnDescVO from '../../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import MatroidController from '../../../../../../../shared/modules/Matroid/MatroidController';
import ModuleTableField from '../../../../../../../shared/modules/ModuleTableField';
import ModuleParams from '../../../../../../../shared/modules/Params/ModuleParams';
import VOsTypesManager from '../../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ModuleVar from '../../../../../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../../../../../shared/modules/Var/VarsController';
import VarConfVO from '../../../../../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../../../../shared/tools/PromiseTools';
import ThreadHandler from '../../../../../../../shared/tools/ThreadHandler';
import VarDataRefComponent from '../../../../Var/components/dataref/VarDataRefComponent';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDashboardPageGetter } from '../../../../dashboard_builder/page/DashboardPageStore';
import DashboardBuilderWidgetsController from '../../../../dashboard_builder/widgets/DashboardBuilderWidgetsController';
import ValidationFiltersWidgetController from '../../../../dashboard_builder/widgets/validation_filters_widget/ValidationFiltersWidgetController';
import VarWidgetComponent from '../../../../dashboard_builder/widgets/var_widget/VarWidgetComponent';
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

    @Prop({ default: null })
    public do_not_user_filter_active_ids: number[];

    @Prop({ default: false })
    public table_is_busy: boolean;

    @Prop({ default: false })
    public editable: boolean;

    @Prop()
    private dashboard_id: number;

    @Prop({ default: null })
    private row_value: any;

    @Prop({ default: null })
    private column: TableColumnDescVO;

    @Prop({ default: null })
    private columns: TableColumnDescVO[];

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private var_value_callback: (var_value: VarDataValueResVO, component: VarDataRefComponent) => any;

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    private throttle_init_param = debounce(this.throttled_init_param.bind(this), 10);
    // private throttle_do_init_param = debounce(this.throttled_do_init_param.bind(this), 10);

    private var_param: VarDataBaseVO = null;
    private dashboard: DashboardVO = null;
    private is_loading: boolean = true;

    private var_param_no_value_or_param_is_invalid: boolean = false;
    private limit_nb_ts_ranges_on_param_by_context_filter: number = 100;

    get var_custom_filters(): { [var_param_field_name: string]: string } {

        return ObjectHandler.hasAtLeastOneAttribute(this.filter_custom_field_filters) ? this.filter_custom_field_filters : null;
    }

    @Watch('dashboard_id')
    @Watch('var_id')
    @Watch('filter_type')
    @Watch('filter_additional_params')
    @Watch('get_active_field_filters')
    @Watch('columns')
    private async onchange_dashboard_id() {
        await this.throttle_init_param();
    }

    private async mounted() {

        let promises = [];
        if ((!this.dashboard) || (this.dashboard.id != this.dashboard_id)) {
            promises.push((async () => {
                this.dashboard = await query(DashboardVO.API_TYPE_ID).filter_by_id(this.dashboard_id).select_vo<DashboardVO>();
            })());
        }
        if (!this.limit_nb_ts_ranges_on_param_by_context_filter) {
            promises.push((async () => {
                this.limit_nb_ts_ranges_on_param_by_context_filter = await ModuleParams.getInstance().getParamValueAsInt(
                    ModuleVar.PARAM_NAME_limit_nb_ts_ranges_on_param_by_context_filter, 100, 180000);
            })());
        }
        promises.push((async () => {
            await ValidationFiltersWidgetController.getInstance().register_updater(
                this.dashboard_id,
                this.page_widget.page_id,
                this.page_widget.id,
                this.throttled_do_init_param.bind(this),
            );
        })());

        await all_promises(promises);

        await this.throttled_init_param();
    }

    private async throttled_init_param() {

        // Si j'ai mon bouton de validation des filtres qui est actif, j'attends que ce soit lui qui m'appelle
        if (this.has_widget_validation_filtres()) {
            return;
        }

        await this.throttled_do_init_param();
    }

    @Watch('row_value', { immediate: true })
    private async onchange_row() {
        await this.throttled_do_init_param();
    }

    get widgets_by_id(): { [id: number]: DashboardWidgetVO } {
        return VOsTypesManager.vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets);
    }

    private has_widget_validation_filtres(): boolean {

        if (!this.all_page_widget) {
            return false;
        }

        for (let i in this.all_page_widget) {
            let widget: DashboardWidgetVO = this.widgets_by_id[this.all_page_widget[i].widget_id];

            if (!widget) {
                continue;
            }

            if (widget.is_validation_filters) {
                return true;
            }
        }

        return false;
    }

    private async wait_for_custom_filters_on_tsranges(var_id: number) {

        let var_conf: VarConfVO = VarsController.var_conf_by_id[var_id];
        let matroid_fields = MatroidController.getMatroidFields(var_conf.var_data_vo_type);
        let tries = 100;

        while (tries > 0) {

            let can_exit = true;
            for (let i in matroid_fields) {

                let matroid_field = matroid_fields[i];

                if ((matroid_field.field_type == ModuleTableField.FIELD_TYPE_tstzrange_array)
                    && (!this.var_custom_filters[matroid_field.field_id])) {
                    can_exit = false;
                    break;
                }
            }

            if (can_exit) {
                return;
            }

            await ThreadHandler.sleep(100, 'wait_for_custom_filters_on_tsranges');
            tries--;
        }

        ConsoleHandler.warn('wait_for_custom_filters_on_tsranges timeout');
    }

    private async throttled_do_init_param() {

        this.is_loading = true;

        if ((!this.dashboard_id) || (!this.var_id)) {
            this.dashboard = null;
            this.var_param = null;
            this.is_loading = false;
            this.var_param_no_value_or_param_is_invalid = false;
            return;
        }

        // On refuse de charger des vars si la table est en cours de chargement
        if (this.table_is_busy) {
            setTimeout(this.throttled_do_init_param.bind(this), 100);
            return;
        }

        // On doit attendre le chargement des filtres de date, sinon impossible de créer des params puisqu'on refuse les max ranges sur les dates
        await this.wait_for_custom_filters_on_tsranges(this.var_id);

        let active_field_filters: FieldFiltersVO = cloneDeep(this.get_active_field_filters);

        /**
         * On crée le custom_filters
         */
        let custom_filters: { [var_param_field_name: string]: ContextFilterVO } = VarWidgetComponent.get_var_custom_filters(this.var_custom_filters, active_field_filters);

        let new_param = ModuleVar.getInstance().getVarParamFromDataRow(
            this.row_value,
            this.column,
            custom_filters,
            this.limit_nb_ts_ranges_on_param_by_context_filter,
            false,
            false
        );

        if (!this.var_param || !new_param || (this.var_param.index != new_param.index)) {
            this.var_param = new_param;
        }

        if (!this.var_param) {
            this.var_param_no_value_or_param_is_invalid = true;
        } else {
            this.var_param_no_value_or_param_is_invalid = false;
        }

        this.is_loading = false;
    }

    /**
     * handle_var_value_callback
     * - keep track of the var value
     *
     * @param {VarDataValueResVO} var_value
     * @param {VarDataRefComponent} component
     */
    private handle_var_value_callback(var_value: VarDataValueResVO, component: VarDataRefComponent): any {
        if (this.var_value_callback && (typeof this.var_value_callback == 'function')) {
            this.var_value_callback(var_value, component);
        }

        return var_value.value;
    }

    get var_filter(): string {
        return this.filter_type ? this.const_filters[this.filter_type].read : undefined;
    }

    get var_filter_additional_params(): string {
        return this.filter_additional_params ? JSON.parse(this.filter_additional_params) : undefined;
    }
}
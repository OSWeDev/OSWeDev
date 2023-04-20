import { cloneDeep, debounce } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterVO from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import DashboardBuilderController from '../../../../../../../shared/modules/DashboardBuilder/DashboardBuilderController';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import TableColumnDescVO from '../../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import ModuleVar from '../../../../../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import {VOsTypesManager} from '../../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ObjectHandler from '../../../../../../../shared/tools/ObjectHandler';
import { ModuleDashboardPageGetter } from '../../../../dashboard_builder/page/DashboardPageStore';
import DashboardBuilderWidgetsController from '../../../../dashboard_builder/widgets/DashboardBuilderWidgetsController';
import FieldValueFilterWidgetOptions from '../../../../dashboard_builder/widgets/field_value_filter_widget/options/FieldValueFilterWidgetOptions';
import ValidationFiltersWidgetController from '../../../../dashboard_builder/widgets/validation_filters_widget/ValidationFiltersWidgetController';
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
    private columns: TableColumnDescVO[];

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };

    private throttle_init_param = debounce(this.throttled_init_param.bind(this), 500);
    private throttle_do_init_param = debounce(this.throttled_do_init_param.bind(this), 500);

    private var_param: VarDataBaseVO = null;
    private dashboard: DashboardVO = null;
    private is_loading: boolean = true;

    get var_custom_filters(): { [var_param_field_name: string]: string } {

        return ObjectHandler.getInstance().hasAtLeastOneAttribute(this.filter_custom_field_filters) ? this.filter_custom_field_filters : null;
    }

    @Watch('dashboard_id', { immediate: true })
    @Watch('var_id', { immediate: true })
    @Watch('filter_type', { immediate: true })
    @Watch('filter_additional_params', { immediate: true })
    @Watch('get_active_field_filters', { immediate: true })
    @Watch('columns', { immediate: true })
    private async onchange_dashboard_id() {
        await this.throttle_init_param();

    }

    private mounted() {
        ValidationFiltersWidgetController.getInstance().register_updater(
            this.dashboard_id,
            this.page_widget.page_id,
            this.page_widget.id,
            this.throttle_do_init_param.bind(this),
        );
    }

    private async throttled_init_param() {

        // Si j'ai mon bouton de validation des filtres qui est actif, j'attends que ce soit lui qui m'appelle
        if (this.has_widget_validation_filtres()) {
            return;
        }

        await this.throttle_do_init_param();
    }

    @Watch('row_value', { immediate: true })
    private async onchange_row() {
        await this.throttle_do_init_param();
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

    private async throttled_do_init_param() {

        this.is_loading = true;

        if ((!this.dashboard_id) || (!this.var_id)) {
            this.dashboard = null;
            this.var_param = null;
            this.is_loading = false;
            return;
        }

        // On refuse de charger des vars si la table est en cours de chargement
        if (this.table_is_busy) {
            this.throttle_do_init_param();
            return;
        }

        this.dashboard = await query(DashboardVO.API_TYPE_ID).filter_by_id(this.dashboard_id).select_vo<DashboardVO>();

        let active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = cloneDeep(this.get_active_field_filters);

        // On supprime les filtres à ne pas prendre en compte pour créer le bon param
        if (this.do_not_user_filter_active_ids && this.do_not_user_filter_active_ids.length) {
            let all_page_widget_by_id: { [id: number]: DashboardPageWidgetVO } = VOsTypesManager.vosArray_to_vosByIds(this.all_page_widget);

            for (let i in this.do_not_user_filter_active_ids) {
                let page_filter_id = this.do_not_user_filter_active_ids[i];

                let page_widget: DashboardPageWidgetVO = all_page_widget_by_id[page_filter_id];
                if (!page_widget) {
                    continue;
                }

                let page_widget_options = JSON.parse(page_widget.json_options) as FieldValueFilterWidgetOptions;

                if (page_widget_options?.vo_field_ref) {
                    if (active_field_filters && active_field_filters[page_widget_options.vo_field_ref.api_type_id]) {
                        delete active_field_filters[page_widget_options.vo_field_ref.api_type_id][page_widget_options.vo_field_ref.field_id];
                    }
                }
            }
        }

        let context = DashboardBuilderController.getInstance().add_table_row_context(active_field_filters, this.columns, this.row_value);

        /**
         * On crée le custom_filters
         */
        let custom_filters: { [var_param_field_name: string]: ContextFilterVO } = VarWidgetComponent.get_var_custom_filters(this.var_custom_filters, active_field_filters);

        this.var_param = await ModuleVar.getInstance().getVarParamFromContextFilters(
            VarsController.getInstance().var_conf_by_id[this.var_id].name,
            context,
            custom_filters,
            this.dashboard.api_type_ids,
            this.get_discarded_field_paths);

        this.is_loading = false;
    }

    get var_filter(): string {
        return this.filter_type ? this.const_filters[this.filter_type].read : undefined;
    }

    get var_filter_additional_params(): string {
        return this.filter_additional_params ? JSON.parse(this.filter_additional_params) : undefined;
    }
}
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import StringSearchbarWidgetOptions from '../../../../../../../shared/modules/DashboardBuilder/vos/StringSearchbarWidgetOptions';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import MultipleVoFieldRefHolderComponent from '../../../options_tools/multiple_vo_field_ref_holder/MultipleVoFieldRefHolderComponent';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import AdvancedRefFieldFilter from '../../field_value_filter_widget/ref_field/AdvancedRefFieldFilter';
import AdvancedStringFilter from '../../field_value_filter_widget/string/AdvancedStringFilter';
import './StringSearchbarWidgetOptionsComponent.scss';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ModuleTableFieldVO from '../../../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import ModuleTableController from '../../../../../../../shared/modules/DAO/ModuleTableController';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import WidgetOptionsVOManager from '../../../../../../../shared/modules/DashboardBuilder/manager/WidgetOptionsVOManager';
import VOFieldRefVOHandler from '../../../../../../../shared/modules/DashboardBuilder/handlers/VOFieldRefVOHandler';
import DataFilterOption from '../../../../../../../shared/modules/DataRender/vos/DataFilterOption';
import ModuleAccessPolicy from '../../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import FieldValueFilterWidgetManager from '../../../../../../../shared/modules/DashboardBuilder/manager/FieldValueFilterWidgetManager';
import SortByVO from '../../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleTableVO from '../../../../../../../shared/modules/DAO/vos/ModuleTableVO';
import ModuleContextFilter from '../../../../../../../shared/modules/ContextFilter/ModuleContextFilter';

@Component({
    template: require('./StringSearchbarWidgetOptionsComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
        Multiplevofieldrefholdercomponent: MultipleVoFieldRefHolderComponent,
    }
})
export default class StringSearchbarWidgetOptionsComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleDashboardPageGetter
    private get_active_api_type_ids: string[];

    @ModuleDashboardPageGetter
    private get_query_api_type_ids: string[];

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private filter_type_options: number[] = [
        AdvancedStringFilter.FILTER_TYPE_COMMENCE,
        AdvancedStringFilter.FILTER_TYPE_COMMENCE_PAS,
        AdvancedStringFilter.FILTER_TYPE_CONTIENT,
        AdvancedStringFilter.FILTER_TYPE_CONTIENT_PAS,
        AdvancedStringFilter.FILTER_TYPE_EST,
        AdvancedStringFilter.FILTER_TYPE_EST_NULL,
        AdvancedStringFilter.FILTER_TYPE_EST_VIDE,
        AdvancedStringFilter.FILTER_TYPE_NEST_PAS,
        AdvancedStringFilter.FILTER_TYPE_NEST_PAS_NULL,
        AdvancedStringFilter.FILTER_TYPE_NEST_PAS_VIDE
    ];

    private tmp_default_advanced_string_filter_type: number = null;

    private actual_query: string = null;

    private next_update_options: StringSearchbarWidgetOptions = null;

    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(
        'StringSearchbarWidgetOptionsComponent.throttled_update_options',
        this.update_options.bind(this), 50, false);
    private throttled_update_visible_options = ThrottleHelper.declare_throttle_without_args(
        'StringSearchbarWidgetOptionsComponent.throttled_update_visible_options',
        this.update_visible_options.bind(this), 300, false);

    private default_filter_visible_options: DataFilterOption[] = [];
    private filter_visible_options: DataFilterOption[] = [];

    private placeholder_advanced_string_filter: string = null;
    private last_calculation_cpt: number = 0;

    get default_advanced_mode_placeholder_translation(): string {
        return this.label('StringSearchbarWidget.advanced_mode_placeholder');
    }

    get default_widget_props(): StringSearchbarWidgetOptions {
        return new StringSearchbarWidgetOptions(
            null,
            null,
            AdvancedStringFilter.FILTER_TYPE_CONTIENT,
            "",
            false,
            false,
            false,
        );
    }

    /**
     *  Widget Options
     *   - Load default widget option (from backend)
     */
    get widget_options(): StringSearchbarWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: StringSearchbarWidgetOptions = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as StringSearchbarWidgetOptions;
                options = options ? new StringSearchbarWidgetOptions().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    get is_type_string(): boolean {
        return VOFieldRefVOHandler.is_type_string(this.vo_field_ref);
    }

    get field(): ModuleTableFieldVO {
        if ((!this.vo_field_ref) || (!this.vo_field_ref.api_type_id) || (!this.vo_field_ref.field_id)) {
            return null;
        }

        return ModuleTableController.module_tables_by_vo_type[this.vo_field_ref.api_type_id].get_field_by_id(this.vo_field_ref.field_id);
    }

    get placeholder_advanced_mode(): string {

        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.placeholder_advanced_mode;
    }

    get autovalidate_advanced_filter(): boolean {

        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.autovalidate_advanced_filter;
    }

    get default_advanced_string_filter_type(): number {

        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.default_advanced_string_filter_type;
    }

    get vo_field_ref_multiple(): VOFieldRefVO[] {

        if (!this.widget_options) {
            return null;
        }

        if ((!this.widget_options) || (!this.widget_options.vo_field_ref_multiple) || (!this.widget_options.vo_field_ref_multiple.length)) {
            return null;
        }

        const res: VOFieldRefVO[] = [];

        for (const i in this.widget_options.vo_field_ref_multiple) {
            res.push(Object.assign(new VOFieldRefVO(), this.widget_options.vo_field_ref_multiple[i]));
        }

        return res;
    }

    get vo_field_ref(): VOFieldRefVO {
        const options: StringSearchbarWidgetOptions = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return new VOFieldRefVO().from(options.vo_field_ref);
    }

    get hide_advanced_string_filter_type(): boolean {

        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.hide_advanced_string_filter_type;
    }

    get active_field_on_autovalidate_advanced_filter(): boolean {

        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.active_field_on_autovalidate_advanced_filter;
    }

    get translatable_name_code_text() {

        if (!this.vo_field_ref) {
            return null;
        }

        return this.vo_field_ref.get_translatable_name_code_text(this.page_widget.id);
    }

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.tmp_default_advanced_string_filter_type = null;

            return;
        }
        this.tmp_default_advanced_string_filter_type = this.widget_options.default_advanced_string_filter_type;

        if (!(this.filter_visible_options?.length > 0)) {
            await this.throttled_update_visible_options();
        }
    }

    @Watch('placeholder_advanced_string_filter')
    private async onchange_placeholder_advanced_string_filter() {
        this.next_update_options = this.widget_options;

        if (this.next_update_options.placeholder_advanced_mode != this.placeholder_advanced_string_filter) {
            this.next_update_options.placeholder_advanced_mode = this.placeholder_advanced_string_filter;

            await this.throttled_update_options();
        }
    }

    @Watch('tmp_default_advanced_string_filter_type')
    private async onchange_tmp_default_advanced_string_filter_type() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.default_advanced_string_filter_type != this.tmp_default_advanced_string_filter_type) {
            this.next_update_options = this.widget_options;
            this.next_update_options.default_advanced_string_filter_type = this.tmp_default_advanced_string_filter_type;

            await this.throttled_update_options();
        }
    }

    private async switch_autovalidate_advanced_filter() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.default_widget_props;
        }

        this.next_update_options.autovalidate_advanced_filter = !this.next_update_options.autovalidate_advanced_filter;

        await this.throttled_update_options();
    }

    private async switch_hide_advanced_string_filter_type() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.default_widget_props;
        }

        this.next_update_options.hide_advanced_string_filter_type = !this.next_update_options.hide_advanced_string_filter_type;

        await this.throttled_update_options();
    }

    private async switch_active_field_on_autovalidate_advanced_filter() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.default_widget_props;
        }

        this.next_update_options.active_field_on_autovalidate_advanced_filter = !this.next_update_options.active_field_on_autovalidate_advanced_filter;

        await this.throttled_update_options();
    }

    private async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }
        await ModuleDAO.getInstance().insertOrUpdateVO(this.page_widget);

        // this.set_page_widget(this.page_widget);
        this.$emit('update_layout_widget', this.page_widget);

        const all_widgets_types: DashboardWidgetVO[] = WidgetOptionsVOManager.getInstance().sorted_widgets_types;
        const widget_type: DashboardWidgetVO = all_widgets_types.find((e) => e.id == this.page_widget.widget_id);

        const name = widget_type?.name;

        const get_selected_fields = WidgetOptionsVOManager.getInstance().widgets_get_selected_fields[name];

        this.set_selected_fields(get_selected_fields ? get_selected_fields(this.page_widget) : {});

        await this.throttled_update_visible_options();
    }

    private async remove_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.vo_field_ref) {
            return null;
        }

        this.next_update_options.vo_field_ref = null;

        await this.throttled_update_options();
    }

    private async remove_field_ref_multiple(vo_field_ref: VOFieldRefVO) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.vo_field_ref_multiple || !this.next_update_options.vo_field_ref_multiple.length) {
            return null;
        }

        let vo_field_ref_multiple: VOFieldRefVO[] = [];

        for (const i in this.next_update_options.vo_field_ref_multiple) {
            vo_field_ref_multiple.push(new VOFieldRefVO().from(this.next_update_options.vo_field_ref_multiple[i]));
        }

        const vo_field_ref_opt: VOFieldRefVO = vo_field_ref_multiple.find((e) => (
            (e.api_type_id == vo_field_ref.api_type_id) &&
            (e.field_id == vo_field_ref.field_id))
        );

        if (vo_field_ref_opt) {
            vo_field_ref_multiple = vo_field_ref_multiple.filter((e) => (
                (e.api_type_id != vo_field_ref_opt.api_type_id) &&
                (e.field_id != vo_field_ref_opt.field_id))
            );
        }

        if (!vo_field_ref_multiple.length) {
            vo_field_ref_multiple = null;
        }

        this.next_update_options.vo_field_ref_multiple = vo_field_ref_multiple;

        await this.throttled_update_options();
    }

    private async add_field_ref(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.default_widget_props;
        }

        const vo_field_ref = new VOFieldRefVO();
        vo_field_ref.api_type_id = api_type_id;
        vo_field_ref.field_id = field_id;
        vo_field_ref.weight = 0;

        this.next_update_options.vo_field_ref = vo_field_ref;

        await this.throttled_update_options();
    }

    private async add_field_ref_multiple(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.default_widget_props;
        }

        const vo_field_ref = new VOFieldRefVO();
        vo_field_ref.api_type_id = api_type_id;
        vo_field_ref.field_id = field_id;
        vo_field_ref.weight = 0;

        let vo_field_ref_multiple: VOFieldRefVO[] = [];

        for (const i in this.next_update_options.vo_field_ref_multiple) {
            vo_field_ref_multiple.push(new VOFieldRefVO().from(this.next_update_options.vo_field_ref_multiple[i]));
        }

        if (!vo_field_ref_multiple) {
            vo_field_ref_multiple = [];
        }

        vo_field_ref_multiple.push(vo_field_ref);

        this.next_update_options.vo_field_ref_multiple = vo_field_ref_multiple;

        await this.throttled_update_options();
    }

    private ref_field_filter_type_label(filter_type: number): string {
        if (filter_type != null) {
            return this.t(AdvancedRefFieldFilter.FILTER_TYPE_LABELS[filter_type]);
        }
        return null;
    }

    private filter_type_label(filter_type: number): string {
        if (filter_type != null) {
            return this.t(AdvancedStringFilter.FILTER_TYPE_LABELS[filter_type]);
        }
        return null;
    }

    private async query_update_visible_options(context_query: string) {
        this.actual_query = context_query;
        await this.throttled_update_visible_options();
    }

    private async update_visible_options() {

        const launch_cpt: number = (this.last_calculation_cpt + 1);

        this.last_calculation_cpt = launch_cpt;

        if (!this.is_type_string) {
            return;
        }

        if ((!this.widget_options) || (!this.vo_field_ref)) {
            this.filter_visible_options = [];
            return;
        }

        const field_sort: VOFieldRefVO = this.vo_field_ref ? this.vo_field_ref : null;
        let data_filters: DataFilterOption[] = [];

        const api_type_id = this.vo_field_ref.api_type_id;

        const access_policy_name = ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, api_type_id);
        const has_access = await ModuleAccessPolicy.getInstance().testAccess(access_policy_name);

        if (!has_access) {
            return;
        }

        // Load data_filters for string and number
        const context_query = query(api_type_id)
            .field(this.vo_field_ref.field_id, 'label')
            .set_sort(new SortByVO(field_sort.api_type_id, field_sort.field_id, true))
            .using(this.get_dashboard_api_type_ids);
        FieldValueFilterWidgetManager.add_discarded_field_paths(context_query, this.get_discarded_field_paths);

        // Si je suis sur une table segmentée, je vais voir si j'ai un filtre sur mon field qui segmente
        // Si ce n'est pas le cas, je n'envoie pas la requête
        const base_table: ModuleTableVO = ModuleTableController.module_tables_by_vo_type[context_query.base_api_type_id];

        if (
            base_table &&
            base_table.is_segmented
        ) {
            if (
                !base_table.table_segmented_field ||
                !base_table.table_segmented_field.foreign_ref_vo_type ||
                !this.get_active_field_filters[base_table.table_segmented_field.foreign_ref_vo_type] ||
                !Object.keys(this.get_active_field_filters[base_table.table_segmented_field.foreign_ref_vo_type]).length
            ) {
                return;
            }

            let has_filter: boolean = false;

            for (const field_id in this.get_active_field_filters[base_table.table_segmented_field.foreign_ref_vo_type]) {
                if (this.get_active_field_filters[base_table.table_segmented_field.foreign_ref_vo_type][field_id]) {
                    has_filter = true;
                    break;
                }
            }

            if (!has_filter) {
                return;
            }

            data_filters = await ModuleContextFilter.getInstance().select_filter_visible_options(
                context_query,
                this.actual_query,
            );
        }

        // Si je ne suis pas sur la dernière demande, je me casse
        if (this.last_calculation_cpt != launch_cpt) {
            return;
        }

        for (const i in data_filters) {
            const tmpi = data_filters[i];
            tmpi.label = this.t(tmpi.label);
        }

        if (!data_filters) {
            this.filter_visible_options = [];
        } else {
            this.filter_visible_options = data_filters;
        }

        this.default_filter_visible_options = this.filter_visible_options;
    }

    private filter_visible_label(dfo: DataFilterOption): string {
        return dfo.label;
    }
}
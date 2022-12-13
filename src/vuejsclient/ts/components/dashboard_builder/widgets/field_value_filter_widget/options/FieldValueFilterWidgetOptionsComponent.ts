import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleContextFilter from '../../../../../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVO from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import TableColumnDescVO from '../../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import DataFilterOption from '../../../../../../../shared/modules/DataRender/vos/DataFilterOption';
import TimeSegment from '../../../../../../../shared/modules/DataRender/vos/TimeSegment';
import TSRange from '../../../../../../../shared/modules/DataRender/vos/TSRange';
import ModuleTable from '../../../../../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../../../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import RangeHandler from '../../../../../../../shared/tools/RangeHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import TSRangeInputComponent from '../../../../tsrangeinput/TSRangeInputComponent';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import MultipleVoFieldRefHolderComponent from '../../../options_tools/multiple_vo_field_ref_holder/MultipleVoFieldRefHolderComponent';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import DashboardBuilderWidgetsController from '../../DashboardBuilderWidgetsController';
import BooleanFilter from '../boolean/BooleanFilter';
import AdvancedStringFilter from '../string/AdvancedStringFilter';
import FieldValueFilterWidgetOptions from './FieldValueFilterWidgetOptions';
import './FieldValueFilterWidgetOptionsComponent.scss';

@Component({
    template: require('./FieldValueFilterWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
        Multiplevofieldrefholdercomponent: MultipleVoFieldRefHolderComponent,
        Inlinetranslatabletext: InlineTranslatableText,
        Tsrangeinputcomponent: TSRangeInputComponent,
    }
})
export default class FieldValueFilterWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;


    @ModuleDashboardPageGetter
    private get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };

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
    private boolean_filter_type_options: number[] = [
        BooleanFilter.FILTER_TYPE_TRUE,
        BooleanFilter.FILTER_TYPE_FALSE,
        BooleanFilter.FILTER_TYPE_VIDE
    ];

    private tmp_default_advanced_string_filter_type: number = null;

    private max_visible_options: number = null;
    private tmp_segmentation_type: DataFilterOption = null;

    private tmp_default_filter_opt_values: DataFilterOption[] = [];
    private tmp_default_ts_range_values: TSRange = null;
    private tmp_default_boolean_values: number[] = [];

    private tmp_exclude_filter_opt_values: DataFilterOption[] = [];
    private tmp_exclude_ts_range_values: TSRange = null;

    private filter_visible_options: DataFilterOption[] = [];
    private actual_query: string = null;

    private next_update_options: FieldValueFilterWidgetOptions = null;
    private throttled_update_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });
    private throttled_update_visible_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_visible_options.bind(this), 300, { leading: false, trailing: true });

    private crud_api_type_id_selected: string = null;

    private placeholder_advanced_string_filter: string = null;
    private last_calculation_cpt: number = 0;

    private crud_api_type_id_select_label(api_type_id: string): string {
        return this.t(VOsTypesManager.moduleTables_by_voType[api_type_id].label.code_text);
    }

    @Watch('placeholder_advanced_string_filter')
    private async onchange_placeholder_advanced_string_filter() {
        this.next_update_options = this.widget_options;

        if (this.next_update_options.placeholder_advanced_mode != this.placeholder_advanced_string_filter) {
            this.next_update_options.placeholder_advanced_mode = this.placeholder_advanced_string_filter;

            await this.throttled_update_options();
        }
    }

    @Watch('crud_api_type_id_selected')
    private async onchange_crud_api_type_id_selected() {
        this.next_update_options = this.widget_options;

        if (this.next_update_options.other_ref_api_type_id != this.crud_api_type_id_selected) {
            this.next_update_options.other_ref_api_type_id = this.crud_api_type_id_selected;

            await this.throttled_update_options();
        }
    }

    @Watch('widget_options', { immediate: true })
    private onchange_widget_options() {
        if (!this.widget_options) {
            this.max_visible_options = null;
            this.tmp_segmentation_type = null;
            this.tmp_default_filter_opt_values = [];
            this.tmp_default_ts_range_values = null;
            this.tmp_default_boolean_values = [];
            this.tmp_default_advanced_string_filter_type = null;
            this.crud_api_type_id_selected = null;
            this.tmp_exclude_filter_opt_values = [];
            this.tmp_exclude_ts_range_values = null;
            return;
        }
        this.max_visible_options = this.widget_options.max_visible_options;
        this.tmp_default_filter_opt_values = this.widget_options.default_filter_opt_values ? this.widget_options.default_filter_opt_values : [];
        this.tmp_default_ts_range_values = this.widget_options.default_ts_range_values;
        this.tmp_default_boolean_values = this.widget_options.default_boolean_values ? this.widget_options.default_boolean_values : [];
        this.tmp_segmentation_type = !!this.widget_options.segmentation_type ? this.segmentation_type_options.find((e) => e.id == this.widget_options.segmentation_type) : null;
        this.tmp_default_advanced_string_filter_type = this.widget_options.default_advanced_string_filter_type;
        this.crud_api_type_id_selected = this.widget_options.other_ref_api_type_id;
        this.tmp_exclude_filter_opt_values = this.widget_options.exclude_filter_opt_values ? this.widget_options.exclude_filter_opt_values : [];
        this.tmp_exclude_ts_range_values = this.widget_options.exclude_ts_range_values;

        if (!this.tmp_segmentation_type && this.is_type_date) {
            let field = this.field;

            if (field && field.segmentation_type) {
                this.tmp_segmentation_type = this.segmentation_type_options.find((e) => e.id == field.segmentation_type);
            }
        }

        if (!this.filter_visible_options || !this.filter_visible_options.length) {
            this.throttled_update_visible_options();
        }


    }

    @Watch('max_visible_options')
    private async onchange_max_visible_options() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.max_visible_options != this.max_visible_options) {
            this.next_update_options = this.widget_options;
            this.next_update_options.max_visible_options = this.max_visible_options;

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

    @Watch('tmp_segmentation_type')
    private async onchange_tmp_segmentation_type() {
        if (!this.widget_options) {
            return;
        }

        if (!this.tmp_segmentation_type || (this.widget_options.segmentation_type != this.tmp_segmentation_type.id)) {
            this.next_update_options = this.widget_options;
            this.next_update_options.segmentation_type = this.tmp_segmentation_type ? this.tmp_segmentation_type.id : null;

            await this.throttled_update_options();
        }
    }

    @Watch('tmp_default_filter_opt_values')
    private async onchange_tmp_default_filter_opt_values() {
        if (!this.widget_options) {
            return;
        }

        this.next_update_options = this.widget_options;
        this.next_update_options.default_filter_opt_values = (this.tmp_default_filter_opt_values && this.tmp_default_filter_opt_values.length > 0) ? this.tmp_default_filter_opt_values : null;

        await this.throttled_update_options();
    }

    @Watch('tmp_default_ts_range_values')
    private async onchange_tmp_default_ts_range_values() {
        if (!this.widget_options) {
            return;
        }

        this.next_update_options = this.widget_options;
        this.next_update_options.default_ts_range_values = this.tmp_default_ts_range_values;

        await this.throttled_update_options();
    }

    @Watch('tmp_default_boolean_values')
    private async onchange_tmp_default_boolean_values() {
        if (!this.widget_options) {
            return;
        }

        this.next_update_options = this.widget_options;
        this.next_update_options.default_boolean_values = (this.tmp_default_boolean_values && this.tmp_default_boolean_values.length > 0) ? this.tmp_default_boolean_values : null;

        await this.throttled_update_options();
    }

    @Watch('tmp_exclude_filter_opt_values')
    private async onchange_tmp_exclude_filter_opt_values() {
        if (!this.widget_options) {
            return;
        }

        this.next_update_options = this.widget_options;
        this.next_update_options.exclude_filter_opt_values = (this.tmp_exclude_filter_opt_values && this.tmp_exclude_filter_opt_values.length > 0) ? this.tmp_exclude_filter_opt_values : null;

        await this.throttled_update_options();
    }

    @Watch('tmp_exclude_ts_range_values')
    private async onchange_tmp_exclude_ts_range_values() {
        if (!this.widget_options) {
            return;
        }

        this.next_update_options = this.widget_options;
        this.next_update_options.exclude_ts_range_values = this.tmp_exclude_ts_range_values;

        await this.throttled_update_options();
    }

    private async switch_can_select_multiple() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new FieldValueFilterWidgetOptions(
                null,
                null,
                null,
                this.can_select_multiple,
                this.is_checkbox,
                50,
                this.show_search_field,
                this.hide_lvl2_if_lvl1_not_selected,
                this.segmentation_type,
                this.advanced_mode,
                this.default_advanced_string_filter_type,
                this.hide_btn_switch_advanced,
                this.hide_advanced_string_filter_type,
                this.vo_field_ref_multiple,
                this.tmp_default_filter_opt_values,
                this.tmp_default_ts_range_values,
                this.tmp_default_boolean_values,
                this.hide_filter,
                this.no_inter_filter,
                this.has_other_ref_api_type_id,
                this.other_ref_api_type_id,
                this.tmp_exclude_filter_opt_values,
                this.tmp_exclude_ts_range_values,
                this.placeholder_advanced_mode,
                this.separation_active_filter,
                null,
                this.autovalidate_advanced_filter,
                this.add_is_null_selectable,
            );
        }

        this.next_update_options.can_select_multiple = !this.next_update_options.can_select_multiple;

        await this.throttled_update_options();
    }

    private async switch_is_checkbox() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new FieldValueFilterWidgetOptions(
                null,
                null,
                null,
                this.can_select_multiple,
                this.is_checkbox,
                50,
                this.show_search_field,
                this.hide_lvl2_if_lvl1_not_selected,
                this.segmentation_type,
                this.advanced_mode,
                this.default_advanced_string_filter_type,
                this.hide_btn_switch_advanced,
                this.hide_advanced_string_filter_type,
                this.vo_field_ref_multiple,
                this.tmp_default_filter_opt_values,
                this.tmp_default_ts_range_values,
                this.tmp_default_boolean_values,
                this.hide_filter,
                this.no_inter_filter,
                this.has_other_ref_api_type_id,
                this.other_ref_api_type_id,
                this.tmp_exclude_filter_opt_values,
                this.tmp_exclude_ts_range_values,
                this.placeholder_advanced_mode,
                this.separation_active_filter,
                null,
                this.autovalidate_advanced_filter,
                this.add_is_null_selectable,
            );
        }

        this.next_update_options.is_checkbox = !this.next_update_options.is_checkbox;

        await this.throttled_update_options();
    }

    private async switch_hide_filter() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new FieldValueFilterWidgetOptions(
                null,
                null,
                null,
                this.can_select_multiple,
                this.is_checkbox,
                50,
                this.show_search_field,
                this.hide_lvl2_if_lvl1_not_selected,
                this.segmentation_type,
                this.advanced_mode,
                this.default_advanced_string_filter_type,
                this.hide_btn_switch_advanced,
                this.hide_advanced_string_filter_type,
                this.vo_field_ref_multiple,
                this.tmp_default_filter_opt_values,
                this.tmp_default_ts_range_values,
                this.tmp_default_boolean_values,
                this.hide_filter,
                this.no_inter_filter,
                this.has_other_ref_api_type_id,
                this.other_ref_api_type_id,
                this.tmp_exclude_filter_opt_values,
                this.tmp_exclude_ts_range_values,
                this.placeholder_advanced_mode,
                this.separation_active_filter,
                null,
                this.autovalidate_advanced_filter,
                this.add_is_null_selectable,
            );
        }

        this.next_update_options.hide_filter = !this.next_update_options.hide_filter;

        await this.throttled_update_options();
    }

    private async switch_no_inter_filter() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new FieldValueFilterWidgetOptions(
                null,
                null,
                null,
                this.can_select_multiple,
                this.is_checkbox,
                50,
                this.show_search_field,
                this.hide_lvl2_if_lvl1_not_selected,
                this.segmentation_type,
                this.advanced_mode,
                this.default_advanced_string_filter_type,
                this.hide_btn_switch_advanced,
                this.hide_advanced_string_filter_type,
                this.vo_field_ref_multiple,
                this.tmp_default_filter_opt_values,
                this.tmp_default_ts_range_values,
                this.tmp_default_boolean_values,
                this.hide_filter,
                this.no_inter_filter,
                this.has_other_ref_api_type_id,
                this.other_ref_api_type_id,
                this.tmp_exclude_filter_opt_values,
                this.tmp_exclude_ts_range_values,
                this.placeholder_advanced_mode,
                this.separation_active_filter,
                null,
                this.autovalidate_advanced_filter,
                this.add_is_null_selectable,
            );
        }

        this.next_update_options.no_inter_filter = !this.next_update_options.no_inter_filter;

        await this.throttled_update_options();
    }

    private async switch_autovalidate_advanced_filter() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new FieldValueFilterWidgetOptions(
                null,
                null,
                null,
                this.can_select_multiple,
                this.is_checkbox,
                50,
                this.show_search_field,
                this.hide_lvl2_if_lvl1_not_selected,
                this.segmentation_type,
                this.advanced_mode,
                this.default_advanced_string_filter_type,
                this.hide_btn_switch_advanced,
                this.hide_advanced_string_filter_type,
                this.vo_field_ref_multiple,
                this.tmp_default_filter_opt_values,
                this.tmp_default_ts_range_values,
                this.tmp_default_boolean_values,
                this.hide_filter,
                this.no_inter_filter,
                this.has_other_ref_api_type_id,
                this.other_ref_api_type_id,
                this.tmp_exclude_filter_opt_values,
                this.tmp_exclude_ts_range_values,
                this.placeholder_advanced_mode,
                this.separation_active_filter,
                null,
                this.autovalidate_advanced_filter,
                this.add_is_null_selectable,
            );
        }

        this.next_update_options.autovalidate_advanced_filter = !this.next_update_options.autovalidate_advanced_filter;

        await this.throttled_update_options();
    }

    private async switch_add_is_null_selectable() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new FieldValueFilterWidgetOptions(
                null,
                null,
                null,
                this.can_select_multiple,
                this.is_checkbox,
                50,
                this.show_search_field,
                this.hide_lvl2_if_lvl1_not_selected,
                this.segmentation_type,
                this.advanced_mode,
                this.default_advanced_string_filter_type,
                this.hide_btn_switch_advanced,
                this.hide_advanced_string_filter_type,
                this.vo_field_ref_multiple,
                this.tmp_default_filter_opt_values,
                this.tmp_default_ts_range_values,
                this.tmp_default_boolean_values,
                this.hide_filter,
                this.no_inter_filter,
                this.has_other_ref_api_type_id,
                this.other_ref_api_type_id,
                this.tmp_exclude_filter_opt_values,
                this.tmp_exclude_ts_range_values,
                this.placeholder_advanced_mode,
                this.separation_active_filter,
                null,
                this.autovalidate_advanced_filter,
                this.add_is_null_selectable,
            );
        }

        this.next_update_options.add_is_null_selectable = !this.next_update_options.add_is_null_selectable;

        await this.throttled_update_options();
    }

    private async switch_has_other_ref_api_type_id() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new FieldValueFilterWidgetOptions(
                null,
                null,
                null,
                this.can_select_multiple,
                this.is_checkbox,
                50,
                this.show_search_field,
                this.hide_lvl2_if_lvl1_not_selected,
                this.segmentation_type,
                this.advanced_mode,
                this.default_advanced_string_filter_type,
                this.hide_btn_switch_advanced,
                this.hide_advanced_string_filter_type,
                this.vo_field_ref_multiple,
                this.tmp_default_filter_opt_values,
                this.tmp_default_ts_range_values,
                this.tmp_default_boolean_values,
                this.hide_filter,
                this.no_inter_filter,
                this.has_other_ref_api_type_id,
                this.other_ref_api_type_id,
                this.tmp_exclude_filter_opt_values,
                this.tmp_exclude_ts_range_values,
                this.placeholder_advanced_mode,
                this.separation_active_filter,
                null,
                this.autovalidate_advanced_filter,
                this.add_is_null_selectable,
            );
        }

        this.next_update_options.has_other_ref_api_type_id = !this.next_update_options.has_other_ref_api_type_id;

        await this.throttled_update_options();
    }

    private async switch_show_search_field() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new FieldValueFilterWidgetOptions(
                null,
                null,
                null,
                this.can_select_multiple,
                this.is_checkbox,
                50,
                this.show_search_field,
                this.hide_lvl2_if_lvl1_not_selected,
                this.segmentation_type,
                this.advanced_mode,
                this.default_advanced_string_filter_type,
                this.hide_btn_switch_advanced,
                this.hide_advanced_string_filter_type,
                this.vo_field_ref_multiple,
                this.tmp_default_filter_opt_values,
                this.tmp_default_ts_range_values,
                this.tmp_default_boolean_values,
                this.hide_filter,
                this.no_inter_filter,
                this.has_other_ref_api_type_id,
                this.other_ref_api_type_id,
                this.tmp_exclude_filter_opt_values,
                this.tmp_exclude_ts_range_values,
                this.placeholder_advanced_mode,
                this.separation_active_filter,
                null,
                this.autovalidate_advanced_filter,
                this.add_is_null_selectable,
            );
        }

        this.next_update_options.show_search_field = !this.next_update_options.show_search_field;

        await this.throttled_update_options();
    }

    private async switch_separation_active_filter() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new FieldValueFilterWidgetOptions(
                null,
                null,
                null,
                this.can_select_multiple,
                this.is_checkbox,
                50,
                this.show_search_field,
                this.hide_lvl2_if_lvl1_not_selected,
                this.segmentation_type,
                this.advanced_mode,
                this.default_advanced_string_filter_type,
                this.hide_btn_switch_advanced,
                this.hide_advanced_string_filter_type,
                this.vo_field_ref_multiple,
                this.tmp_default_filter_opt_values,
                this.tmp_default_ts_range_values,
                this.tmp_default_boolean_values,
                this.hide_filter,
                this.no_inter_filter,
                this.has_other_ref_api_type_id,
                this.other_ref_api_type_id,
                this.tmp_exclude_filter_opt_values,
                this.tmp_exclude_ts_range_values,
                this.placeholder_advanced_mode,
                this.separation_active_filter,
                null,
                this.autovalidate_advanced_filter,
                this.add_is_null_selectable,
            );
        }

        this.next_update_options.separation_active_filter = !this.next_update_options.separation_active_filter;

        await this.throttled_update_options();
    }

    private async switch_hide_lvl2_if_lvl1_not_selected() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new FieldValueFilterWidgetOptions(
                null,
                null,
                null,
                this.can_select_multiple,
                this.is_checkbox,
                50,
                this.show_search_field,
                this.hide_lvl2_if_lvl1_not_selected,
                this.segmentation_type,
                this.advanced_mode,
                this.default_advanced_string_filter_type,
                this.hide_btn_switch_advanced,
                this.hide_advanced_string_filter_type,
                this.vo_field_ref_multiple,
                this.tmp_default_filter_opt_values,
                this.tmp_default_ts_range_values,
                this.tmp_default_boolean_values,
                this.hide_filter,
                this.no_inter_filter,
                this.has_other_ref_api_type_id,
                this.other_ref_api_type_id,
                this.tmp_exclude_filter_opt_values,
                this.tmp_exclude_ts_range_values,
                this.placeholder_advanced_mode,
                this.separation_active_filter,
                null,
                this.autovalidate_advanced_filter,
                this.add_is_null_selectable,
            );
        }

        this.next_update_options.hide_lvl2_if_lvl1_not_selected = !this.next_update_options.hide_lvl2_if_lvl1_not_selected;

        await this.throttled_update_options();
    }

    private async switch_advanced_mode() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new FieldValueFilterWidgetOptions(
                null,
                null,
                null,
                this.can_select_multiple,
                this.is_checkbox,
                50,
                this.show_search_field,
                this.hide_lvl2_if_lvl1_not_selected,
                this.segmentation_type,
                this.advanced_mode,
                this.default_advanced_string_filter_type,
                this.hide_btn_switch_advanced,
                this.hide_advanced_string_filter_type,
                this.vo_field_ref_multiple,
                this.tmp_default_filter_opt_values,
                this.tmp_default_ts_range_values,
                this.tmp_default_boolean_values,
                this.hide_filter,
                this.no_inter_filter,
                this.has_other_ref_api_type_id,
                this.other_ref_api_type_id,
                this.tmp_exclude_filter_opt_values,
                this.tmp_exclude_ts_range_values,
                this.placeholder_advanced_mode,
                this.separation_active_filter,
                null,
                this.autovalidate_advanced_filter,
                this.add_is_null_selectable,
            );
        }

        this.next_update_options.advanced_mode = !this.next_update_options.advanced_mode;

        await this.throttled_update_options();
    }

    private async switch_hide_btn_switch_advanced() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new FieldValueFilterWidgetOptions(
                null,
                null,
                null,
                this.can_select_multiple,
                this.is_checkbox,
                50,
                this.show_search_field,
                this.hide_lvl2_if_lvl1_not_selected,
                this.segmentation_type,
                this.advanced_mode,
                this.default_advanced_string_filter_type,
                this.hide_btn_switch_advanced,
                this.hide_advanced_string_filter_type,
                this.vo_field_ref_multiple,
                this.tmp_default_filter_opt_values,
                this.tmp_default_ts_range_values,
                this.tmp_default_boolean_values,
                this.hide_filter,
                this.no_inter_filter,
                this.has_other_ref_api_type_id,
                this.other_ref_api_type_id,
                this.tmp_exclude_filter_opt_values,
                this.tmp_exclude_ts_range_values,
                this.placeholder_advanced_mode,
                this.separation_active_filter,
                null,
                this.autovalidate_advanced_filter,
                this.add_is_null_selectable,
            );
        }

        this.next_update_options.hide_btn_switch_advanced = !this.next_update_options.hide_btn_switch_advanced;

        await this.throttled_update_options();
    }

    private async switch_hide_advanced_string_filter_type() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new FieldValueFilterWidgetOptions(
                null,
                null,
                null,
                this.can_select_multiple,
                this.is_checkbox,
                50,
                this.show_search_field,
                this.hide_lvl2_if_lvl1_not_selected,
                this.segmentation_type,
                this.advanced_mode,
                this.default_advanced_string_filter_type,
                this.hide_btn_switch_advanced,
                this.hide_advanced_string_filter_type,
                this.vo_field_ref_multiple,
                this.tmp_default_filter_opt_values,
                this.tmp_default_ts_range_values,
                this.tmp_default_boolean_values,
                this.hide_filter,
                this.no_inter_filter,
                this.has_other_ref_api_type_id,
                this.other_ref_api_type_id,
                this.tmp_exclude_filter_opt_values,
                this.tmp_exclude_ts_range_values,
                this.placeholder_advanced_mode,
                this.separation_active_filter,
                null,
                this.autovalidate_advanced_filter,
                this.add_is_null_selectable,
            );
        }

        this.next_update_options.hide_advanced_string_filter_type = !this.next_update_options.hide_advanced_string_filter_type;

        await this.throttled_update_options();
    }

    private async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }
        await ModuleDAO.getInstance().insertOrUpdateVO(this.page_widget);

        this.set_page_widget(this.page_widget);
        this.$emit('update_layout_widget', this.page_widget);

        let name = VOsTypesManager.vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets)[this.page_widget.widget_id].name;
        let get_selected_fields = DashboardBuilderWidgetsController.getInstance().widgets_get_selected_fields[name];
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

    private async remove_field_ref_lvl2() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.vo_field_ref_lvl2) {
            return null;
        }

        this.next_update_options.vo_field_ref_lvl2 = null;

        await this.throttled_update_options();
    }

    private async remove_field_sort() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.vo_field_sort) {
            return null;
        }

        this.next_update_options.vo_field_sort = null;

        await this.throttled_update_options();
    }

    private async remove_field_sort_lvl2() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.vo_field_sort_lvl2) {
            return null;
        }

        this.next_update_options.vo_field_sort_lvl2 = null;

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

        for (let i in this.next_update_options.vo_field_ref_multiple) {
            vo_field_ref_multiple.push(Object.assign(new VOFieldRefVO(), this.next_update_options.vo_field_ref_multiple[i]));
        }

        let opt_index: number = vo_field_ref_multiple.findIndex((e) => ((e.api_type_id == vo_field_ref.api_type_id) && (e.field_id == vo_field_ref.field_id)));

        if (opt_index >= 0) {
            vo_field_ref_multiple.splice(opt_index, 1);
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
            this.next_update_options = new FieldValueFilterWidgetOptions(
                null,
                null,
                null,
                this.can_select_multiple,
                this.is_checkbox,
                50,
                this.show_search_field,
                this.hide_lvl2_if_lvl1_not_selected,
                this.segmentation_type,
                this.advanced_mode,
                this.default_advanced_string_filter_type,
                this.hide_btn_switch_advanced,
                this.hide_advanced_string_filter_type,
                this.vo_field_ref_multiple,
                this.tmp_default_filter_opt_values,
                this.tmp_default_ts_range_values,
                this.tmp_default_boolean_values,
                this.hide_filter,
                this.no_inter_filter,
                this.has_other_ref_api_type_id,
                this.other_ref_api_type_id,
                this.tmp_exclude_filter_opt_values,
                this.tmp_exclude_ts_range_values,
                this.placeholder_advanced_mode,
                this.separation_active_filter,
                null,
                this.autovalidate_advanced_filter,
                this.add_is_null_selectable,
            );
        }

        let vo_field_ref = new VOFieldRefVO();
        vo_field_ref.api_type_id = api_type_id;
        vo_field_ref.field_id = field_id;
        vo_field_ref.weight = 0;

        this.next_update_options.vo_field_ref = vo_field_ref;

        await this.throttled_update_options();
    }

    private async add_field_ref_lvl2(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new FieldValueFilterWidgetOptions(
                null,
                null,
                null,
                this.can_select_multiple,
                this.is_checkbox,
                50,
                this.show_search_field,
                this.hide_lvl2_if_lvl1_not_selected,
                this.segmentation_type,
                this.advanced_mode,
                this.default_advanced_string_filter_type,
                this.hide_btn_switch_advanced,
                this.hide_advanced_string_filter_type,
                this.vo_field_ref_multiple,
                this.tmp_default_filter_opt_values,
                this.tmp_default_ts_range_values,
                this.tmp_default_boolean_values,
                this.hide_filter,
                this.no_inter_filter,
                this.has_other_ref_api_type_id,
                this.other_ref_api_type_id,
                this.tmp_exclude_filter_opt_values,
                this.tmp_exclude_ts_range_values,
                this.placeholder_advanced_mode,
                this.separation_active_filter,
                null,
                this.autovalidate_advanced_filter,
                this.add_is_null_selectable,
            );
        }

        let vo_field_ref_lvl2 = new VOFieldRefVO();
        vo_field_ref_lvl2.api_type_id = api_type_id;
        vo_field_ref_lvl2.field_id = field_id;
        vo_field_ref_lvl2.weight = 0;

        this.next_update_options.vo_field_ref_lvl2 = vo_field_ref_lvl2;

        await this.throttled_update_options();
    }

    private async add_field_sort(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new FieldValueFilterWidgetOptions(
                null,
                null,
                null,
                this.can_select_multiple,
                this.is_checkbox,
                50,
                this.show_search_field,
                this.hide_lvl2_if_lvl1_not_selected,
                this.segmentation_type,
                this.advanced_mode,
                this.default_advanced_string_filter_type,
                this.hide_btn_switch_advanced,
                this.hide_advanced_string_filter_type,
                this.vo_field_ref_multiple,
                this.tmp_default_filter_opt_values,
                this.tmp_default_ts_range_values,
                this.tmp_default_boolean_values,
                this.hide_filter,
                this.no_inter_filter,
                this.has_other_ref_api_type_id,
                this.other_ref_api_type_id,
                this.tmp_exclude_filter_opt_values,
                this.tmp_exclude_ts_range_values,
                this.placeholder_advanced_mode,
                this.separation_active_filter,
                null,
                this.autovalidate_advanced_filter,
                this.add_is_null_selectable,
            );
        }

        let vo_field_sort = new VOFieldRefVO();
        vo_field_sort.api_type_id = api_type_id;
        vo_field_sort.field_id = field_id;
        vo_field_sort.weight = 0;

        this.next_update_options.vo_field_sort = vo_field_sort;

        await this.throttled_update_options();
    }

    private async add_field_sort_lvl2(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new FieldValueFilterWidgetOptions(
                null,
                null,
                null,
                this.can_select_multiple,
                this.is_checkbox,
                50,
                this.show_search_field,
                this.hide_lvl2_if_lvl1_not_selected,
                this.segmentation_type,
                this.advanced_mode,
                this.default_advanced_string_filter_type,
                this.hide_btn_switch_advanced,
                this.hide_advanced_string_filter_type,
                this.vo_field_ref_multiple,
                this.tmp_default_filter_opt_values,
                this.tmp_default_ts_range_values,
                this.tmp_default_boolean_values,
                this.hide_filter,
                this.no_inter_filter,
                this.has_other_ref_api_type_id,
                this.other_ref_api_type_id,
                this.tmp_exclude_filter_opt_values,
                this.tmp_exclude_ts_range_values,
                this.placeholder_advanced_mode,
                this.separation_active_filter,
                null,
                this.autovalidate_advanced_filter,
                this.add_is_null_selectable,
            );
        }

        let vo_field_sort_lvl2 = new VOFieldRefVO();
        vo_field_sort_lvl2.api_type_id = api_type_id;
        vo_field_sort_lvl2.field_id = field_id;
        vo_field_sort_lvl2.weight = 0;

        this.next_update_options.vo_field_sort_lvl2 = vo_field_sort_lvl2;

        await this.throttled_update_options();
    }

    private async add_field_ref_multiple(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new FieldValueFilterWidgetOptions(
                null,
                null,
                null,
                this.can_select_multiple,
                this.is_checkbox,
                50,
                this.show_search_field,
                this.hide_lvl2_if_lvl1_not_selected,
                this.segmentation_type,
                this.advanced_mode,
                this.default_advanced_string_filter_type,
                this.hide_btn_switch_advanced,
                this.hide_advanced_string_filter_type,
                this.vo_field_ref_multiple,
                this.tmp_default_filter_opt_values,
                this.tmp_default_ts_range_values,
                this.tmp_default_boolean_values,
                this.hide_filter,
                this.no_inter_filter,
                this.has_other_ref_api_type_id,
                this.other_ref_api_type_id,
                this.tmp_exclude_filter_opt_values,
                this.tmp_exclude_ts_range_values,
                this.placeholder_advanced_mode,
                this.separation_active_filter,
                null,
                this.autovalidate_advanced_filter,
                this.add_is_null_selectable,
            );
        }

        let vo_field_ref = new VOFieldRefVO();
        vo_field_ref.api_type_id = api_type_id;
        vo_field_ref.field_id = field_id;
        vo_field_ref.weight = 0;

        let vo_field_ref_multiple: VOFieldRefVO[] = [];

        for (let i in this.next_update_options.vo_field_ref_multiple) {
            vo_field_ref_multiple.push(Object.assign(new VOFieldRefVO(), this.next_update_options.vo_field_ref_multiple[i]));
        }

        if (!vo_field_ref_multiple) {
            vo_field_ref_multiple = [];
        }

        vo_field_ref_multiple.push(vo_field_ref);

        this.next_update_options.vo_field_ref_multiple = vo_field_ref_multiple;

        await this.throttled_update_options();
    }

    private filter_type_label(filter_type: number): string {
        if (filter_type != null) {
            return this.t(AdvancedStringFilter.FILTER_TYPE_LABELS[filter_type]);
        }
        return null;
    }

    private async query_update_visible_options(query_: string) {
        this.actual_query = query_;
        await this.throttled_update_visible_options();
    }

    private async update_visible_options() {

        let launch_cpt: number = (this.last_calculation_cpt + 1);

        this.last_calculation_cpt = launch_cpt;

        if (!this.is_type_string && !this.is_type_number && !this.is_type_enum) {
            return;
        }

        if ((!this.widget_options) || (!this.vo_field_ref)) {
            this.filter_visible_options = [];
            return;
        }

        let field_sort: VOFieldRefVO = this.vo_field_sort ? this.vo_field_sort : this.vo_field_ref;

        let query_ = query(this.vo_field_ref.api_type_id)
            .field(this.vo_field_ref.field_id, 'label')
            .set_limit(this.max_visible_options)
            .set_sort(new SortByVO(field_sort.api_type_id, field_sort.field_id, true))
            .using(this.dashboard.api_type_ids);

        // Si je suis sur une table segmentée, je vais voir si j'ai un filtre sur mon field qui segmente
        // Si ce n'est pas le cas, je n'envoie pas la requête
        let base_table: ModuleTable<any> = VOsTypesManager.moduleTables_by_voType[query_.base_api_type_id];

        if (
            base_table &&
            base_table.is_segmented
        ) {
            if (
                !base_table.table_segmented_field ||
                !base_table.table_segmented_field.manyToOne_target_moduletable ||
                !this.get_active_field_filters[base_table.table_segmented_field.manyToOne_target_moduletable.vo_type] ||
                !Object.keys(this.get_active_field_filters[base_table.table_segmented_field.manyToOne_target_moduletable.vo_type]).length
            ) {
                return;
            }

            let has_filter: boolean = false;

            for (let field_id in this.get_active_field_filters[base_table.table_segmented_field.manyToOne_target_moduletable.vo_type]) {
                if (this.get_active_field_filters[base_table.table_segmented_field.manyToOne_target_moduletable.vo_type][field_id]) {
                    has_filter = true;
                    break;
                }
            }

            if (!has_filter) {
                return;
            }
        }

        let tmp: DataFilterOption[] = await ModuleContextFilter.getInstance().select_filter_visible_options(
            query_,
            this.actual_query,
        );

        // Si je ne suis pas sur la dernière demande, je me casse
        if (this.last_calculation_cpt != launch_cpt) {
            return;
        }

        for (let i in tmp) {
            let tmpi = tmp[i];
            tmpi.label = this.t(tmpi.label);
        }

        if (this.add_is_null_selectable) {
            tmp.unshift(new DataFilterOption(
                DataFilterOption.STATE_SELECTABLE,
                this.label('datafilteroption.is_null'),
                RangeHandler.MIN_INT,
            ));
        }

        if (!tmp) {
            this.filter_visible_options = [];
        } else {
            this.filter_visible_options = tmp;
        }
    }

    private boolean_filter_type_label(filter_type: number): string {
        if (filter_type != null) {
            return this.t(BooleanFilter.FILTER_TYPE_LABELS[filter_type]);
        }
        return null;
    }

    private filter_visible_label(dfo: DataFilterOption): string {
        return dfo.label;
    }

    get default_placeholder_translation(): string {
        return this.label('FieldValueFilterWidget.filter_placeholder');
    }

    get default_advanced_mode_placeholder_translation(): string {
        return this.label('FieldValueFilterWidget.advanced_mode_placeholder');
    }

    get widget_options(): FieldValueFilterWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: FieldValueFilterWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as FieldValueFilterWidgetOptions;
                options = options ? new FieldValueFilterWidgetOptions(
                    options.vo_field_ref,
                    options.vo_field_ref_lvl2,
                    options.vo_field_sort,
                    options.can_select_multiple,
                    options.is_checkbox,
                    options.max_visible_options,
                    options.show_search_field,
                    options.hide_lvl2_if_lvl1_not_selected,
                    options.segmentation_type,
                    options.advanced_mode,
                    options.default_advanced_string_filter_type,
                    options.hide_btn_switch_advanced,
                    options.hide_advanced_string_filter_type,
                    options.vo_field_ref_multiple,
                    options.default_filter_opt_values,
                    options.default_ts_range_values,
                    options.default_boolean_values,
                    options.hide_filter,
                    options.no_inter_filter,
                    options.has_other_ref_api_type_id,
                    options.other_ref_api_type_id,
                    options.exclude_filter_opt_values,
                    options.exclude_ts_range_values,
                    options.placeholder_advanced_mode,
                    options.separation_active_filter,
                    options.vo_field_sort_lvl2,
                    options.autovalidate_advanced_filter,
                    options.add_is_null_selectable,
                ) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    get is_type_string(): boolean {

        let field = this.field;

        if (!field) {
            return false;
        }

        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_html:
            case ModuleTableField.FIELD_TYPE_html_array:
            case ModuleTableField.FIELD_TYPE_email:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_textarea:
            case ModuleTableField.FIELD_TYPE_string_array:
            case ModuleTableField.FIELD_TYPE_translatable_text:
            case ModuleTableField.FIELD_TYPE_file_field:
                return true;

            case ModuleTableField.FIELD_TYPE_password:
            case ModuleTableField.FIELD_TYPE_file_ref:
            case ModuleTableField.FIELD_TYPE_image_field:
            case ModuleTableField.FIELD_TYPE_image_ref:
            case ModuleTableField.FIELD_TYPE_boolean:
            case ModuleTableField.FIELD_TYPE_enum:
            case ModuleTableField.FIELD_TYPE_int:
            case ModuleTableField.FIELD_TYPE_geopoint:
            case ModuleTableField.FIELD_TYPE_float:
            case ModuleTableField.FIELD_TYPE_decimal_full_precision:
            case ModuleTableField.FIELD_TYPE_amount:
            case ModuleTableField.FIELD_TYPE_foreign_key:
            case ModuleTableField.FIELD_TYPE_numrange:
            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_refrange_array:
            case ModuleTableField.FIELD_TYPE_isoweekdays:
            case ModuleTableField.FIELD_TYPE_int_array:
            case ModuleTableField.FIELD_TYPE_prct:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
            case ModuleTableField.FIELD_TYPE_date:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes:
            case ModuleTableField.FIELD_TYPE_daterange:
            case ModuleTableField.FIELD_TYPE_tstz:
            case ModuleTableField.FIELD_TYPE_tstz_array:
            case ModuleTableField.FIELD_TYPE_tstzrange_array:
            case ModuleTableField.FIELD_TYPE_tsrange:
            case ModuleTableField.FIELD_TYPE_hour:
            case ModuleTableField.FIELD_TYPE_hourrange:
            case ModuleTableField.FIELD_TYPE_hourrange_array:
            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_timewithouttimezone:
            case ModuleTableField.FIELD_TYPE_month:
            case ModuleTableField.FIELD_TYPE_plain_vo_obj:
            default:
                return false;
        }
    }

    get is_type_number(): boolean {

        let field = this.field;

        if (!field) {

            /**
             * Cas spécifique du field_id == 'id' qu'on voudrait pouvoir filtrer comme un number
             */
            return this.vo_field_ref ? (this.vo_field_ref.field_id == 'id') : false;
        }

        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_int:
            case ModuleTableField.FIELD_TYPE_geopoint:
            case ModuleTableField.FIELD_TYPE_float:
            case ModuleTableField.FIELD_TYPE_decimal_full_precision:
            case ModuleTableField.FIELD_TYPE_amount:
            case ModuleTableField.FIELD_TYPE_prct:
                return true;

            default:
                return false;
        }
    }

    get is_type_date(): boolean {

        let field = this.field;

        if (!field) {
            return false;
        }

        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_tstz:
                return true;
        }
    }

    get is_type_boolean(): boolean {

        let field = this.field;

        if (!field) {
            return false;
        }

        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_boolean:
                return true;

            default:
                return false;
        }
    }

    get is_type_enum(): boolean {

        let field = this.field;

        if (!field) {
            return false;
        }

        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_enum:
                return true;

            default:
                return false;
        }
    }

    get field(): ModuleTableField<any> {
        if ((!this.vo_field_ref) || (!this.vo_field_ref.api_type_id) || (!this.vo_field_ref.field_id)) {
            return null;
        }

        return VOsTypesManager.moduleTables_by_voType[this.vo_field_ref.api_type_id].get_field_by_id(this.vo_field_ref.field_id);
    }

    get segmentation_type_options(): DataFilterOption[] {
        let res: DataFilterOption[] = [];

        for (let segmentation_type in TimeSegment.TYPE_NAMES_ENUM) {
            let new_opt: DataFilterOption = new DataFilterOption(
                DataFilterOption.STATE_SELECTABLE,
                this.t(TimeSegment.TYPE_NAMES_ENUM[segmentation_type]),
                parseInt(segmentation_type)
            );

            res.push(new_opt);
        }

        return res;
    }

    get can_select_multiple(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return (this.widget_options.can_select_multiple == null) || !!this.widget_options.can_select_multiple;
    }

    get is_checkbox(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.is_checkbox;
    }

    get hide_filter(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.hide_filter;
    }

    get no_inter_filter(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.no_inter_filter;
    }

    get has_other_ref_api_type_id(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.has_other_ref_api_type_id;
    }

    get other_ref_api_type_id(): string {

        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.other_ref_api_type_id;
    }

    get placeholder_advanced_mode(): string {

        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.placeholder_advanced_mode;
    }

    get separation_active_filter(): boolean {

        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.separation_active_filter;
    }

    get autovalidate_advanced_filter(): boolean {

        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.autovalidate_advanced_filter;
    }

    get add_is_null_selectable(): boolean {

        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.add_is_null_selectable;
    }

    get show_search_field(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.show_search_field;
    }

    get hide_lvl2_if_lvl1_not_selected(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.hide_lvl2_if_lvl1_not_selected;
    }

    get segmentation_type(): number {

        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.segmentation_type;
    }

    get advanced_mode(): boolean {

        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.advanced_mode;
    }

    get default_advanced_string_filter_type(): number {

        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.default_advanced_string_filter_type;
    }

    get hide_btn_switch_advanced(): boolean {

        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.hide_btn_switch_advanced;
    }

    get hide_advanced_string_filter_type(): boolean {

        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.hide_advanced_string_filter_type;
    }

    get vo_field_ref_multiple(): VOFieldRefVO[] {

        if (!this.widget_options) {
            return null;
        }

        if ((!this.widget_options) || (!this.widget_options.vo_field_ref_multiple) || (!this.widget_options.vo_field_ref_multiple.length)) {
            return null;
        }

        let res: VOFieldRefVO[] = [];

        for (let i in this.widget_options.vo_field_ref_multiple) {
            res.push(Object.assign(new VOFieldRefVO(), this.widget_options.vo_field_ref_multiple[i]));
        }

        return res;
    }

    get vo_field_ref(): VOFieldRefVO {
        let options: FieldValueFilterWidgetOptions = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
    }

    get vo_field_ref_lvl2(): VOFieldRefVO {
        let options: FieldValueFilterWidgetOptions = this.widget_options;

        if ((!options) || (!options.vo_field_ref_lvl2)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref_lvl2);
    }

    get vo_field_sort(): VOFieldRefVO {
        let options: FieldValueFilterWidgetOptions = this.widget_options;

        if ((!options) || (!options.vo_field_sort)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_sort);
    }

    get vo_field_sort_lvl2(): VOFieldRefVO {
        let options: FieldValueFilterWidgetOptions = this.widget_options;

        if ((!options) || (!options.vo_field_sort_lvl2)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_sort_lvl2);
    }

    get crud_api_type_id_select_options(): string[] {
        return this.dashboard.api_type_ids;
    }
}
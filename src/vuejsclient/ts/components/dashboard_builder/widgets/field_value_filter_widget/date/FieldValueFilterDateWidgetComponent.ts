import Component from 'vue-class-component';
import { cloneDeep, isEqual } from 'lodash';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterHandler from '../../../../../../../shared/modules/ContextFilter/ContextFilterHandler';
import ContextFilterVO from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import SimpleDatatableFieldVO from '../../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
import DashboardPageVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import TSRange from '../../../../../../../shared/modules/DataRender/vos/TSRange';
import ModuleTableField from '../../../../../../../shared/modules/ModuleTableField';
import { VOsTypesManager } from '../../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import { ModuleTranslatableTextGetter } from '../../../../InlineTranslatableText/TranslatableTextStore';
import TSRangeInputComponent from '../../../../tsrangeinput/TSRangeInputComponent';
import RangeHandler from '../../../../../../../shared/tools/RangeHandler';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import FieldValueFilterWidgetOptions from '../options/FieldValueFilterWidgetOptions';
import './FieldValueFilterDateWidgetComponent.scss';

@Component({
    template: require('./FieldValueFilterDateWidgetComponent.pug'),
    components: {
        Tsrangeinputcomponent: TSRangeInputComponent
    }
})
export default class FieldValueFilterDateWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };
    @ModuleDashboardPageAction
    private set_active_field_filter: (param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) => void;
    @ModuleDashboardPageAction
    private remove_active_field_filter: (params: { vo_type: string, field_id: string }) => void;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private ts_range: TSRange = null;

    private warn_existing_external_filters: boolean = false;
    private old_widget_options: FieldValueFilterWidgetOptions = null;

    private actual_query: string = null;

    get vo_field_ref_label(): string {
        if ((!this.widget_options) || (!this.vo_field_ref)) {
            return null;
        }

        return this.get_flat_locale_translations[this.vo_field_ref.get_translatable_name_code_text(this.page_widget.id)];
    }

    /**
     * Computed widget options
     *  - Happen on component|widget creation
     */
    get widget_options() {
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
                    options.checkbox_columns,
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
                    options.is_button,
                    options.enum_bg_colors,
                    options.enum_fg_colors,
                    options.show_count_value,
                    options.active_field_on_autovalidate_advanced_filter,
                    options.force_filter_all_api_type_ids,
                    options.bg_color,
                    options.fg_color_value,
                    options.fg_color_text,
                ) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    /**
     * Watch on widget_options
     *  - Shall happen first on component init or each time widget_options changes
     *  - Initialize the times range (ts_range) with default widget options
     * @returns void
     */
    @Watch('widget_options', { immediate: true })
    private onchange_widget_options(): void {
        if (!!this.old_widget_options) {
            if (isEqual(this.widget_options, this.old_widget_options)) {
                return;
            }
        }

        this.old_widget_options = cloneDeep(this.widget_options);

        let options: FieldValueFilterWidgetOptions = this.widget_options;

        if (!options) {
            return null;
        }

        this.ts_range = options.default_ts_range_values;
    }

    /**
     * Get active field filters
     *  - Shall initialize the ts_range by using context filter
     * @returns void
     */
    @Watch("get_active_field_filters", { immediate: true })
    private try_preload_ts_range(): void {
        // Search context filter for this filter in the store
        let root_context_filter: ContextFilterVO = null;
        root_context_filter = this.get_active_field_filters[this.vo_field_ref.api_type_id] ? this.get_active_field_filters[this.vo_field_ref.api_type_id][this.vo_field_ref.field_id] : null;

        // We must search for the actual context filter
        let context_filter: ContextFilterVO = null;
        if (!!root_context_filter) {
            context_filter = ContextFilterHandler.getInstance().find_context_filter_by_type(root_context_filter, ContextFilterVO.TYPE_DATE_INTERSECTS);
        }

        // If no context filter that mean there is no initialization
        // - Then keep let all selected months with default values
        if (!context_filter) {
            return;
        }

        // Just sets the current ts_range with the stored one (from context filter)
        this.ts_range = context_filter.param_tsranges[0];
    }

    /**
     * Watch on ts_range
     *  - Happen each time ts_range change
     *  - This (re)initialize the context store on each call
     * @returns void
     */
    @Watch('ts_range', { immediate: true, deep: true })
    private onchange_ts_range() {
        if (!this.widget_options) {
            return;
        }

        // Search context filter for this filter in the store
        let root_context_filter: ContextFilterVO = null;
        root_context_filter = this.get_active_field_filters[this.vo_field_ref.api_type_id] ? this.get_active_field_filters[this.vo_field_ref.api_type_id][this.vo_field_ref.field_id] : null;

        // We must search for the actual context filter
        let context_filter: ContextFilterVO = null;
        if (!!root_context_filter) {
            context_filter = ContextFilterHandler.getInstance().find_context_filter_by_type(root_context_filter, ContextFilterVO.TYPE_DATE_INTERSECTS);
        }

        // if there is no ts_range there is no need to continue
        if (!this.ts_range) {
            this.remove_active_field_filter({ vo_type: this.vo_field_ref.api_type_id, field_id: this.vo_field_ref.field_id });
            return;
        }

        // (on initialization) if context exist and ts_range
        let ts_ranges: TSRange[] = [];
        ts_ranges.push(this.ts_range);

        // If the is no context_filter create a new one with this ts_range
        if (!context_filter) {
            let moduletable = VOsTypesManager.moduleTables_by_voType[this.vo_field_ref.api_type_id];
            let field = moduletable.get_field_by_id(this.vo_field_ref.field_id);
            context_filter = ContextFilterHandler.getInstance().get_ContextFilterVO_from_DataFilterOption(null, this.ts_range, field, this.vo_field_ref);

            this.set_active_field_filter({
                field_id: this.vo_field_ref.field_id,
                vo_type: this.vo_field_ref.api_type_id,
                active_field_filter: context_filter,
            });
            return;
        }

        // If context_filter exist, replace with the actual ts_range
        if (!!context_filter) {
            if (!RangeHandler.are_same(context_filter.param_tsranges, ts_ranges)) {
                context_filter.param_tsranges = ts_ranges;

                let new_root = ContextFilterHandler.getInstance().add_context_filter_to_tree(root_context_filter, context_filter);

                this.set_active_field_filter({
                    field_id: this.vo_field_ref.field_id,
                    vo_type: this.vo_field_ref.api_type_id,
                    active_field_filter: new_root,
                });
            }
            return;
        }
    }

    get vo_field_ref(): VOFieldRefVO {
        let options: FieldValueFilterWidgetOptions = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
    }

    get segmentation_type(): number {
        let options: FieldValueFilterWidgetOptions = this.widget_options;

        return options ? options.segmentation_type : null;
    }

    get exclude_values(): TSRange {
        let options: FieldValueFilterWidgetOptions = this.widget_options;

        if (!options) {
            return null;
        }

        return options.exclude_ts_range_values;
    }

    get field_date(): SimpleDatatableFieldVO<any, any> {
        return SimpleDatatableFieldVO.createNew(this.vo_field_ref.field_id).setModuleTable(VOsTypesManager.moduleTables_by_voType[this.vo_field_ref.api_type_id]);
    }
}
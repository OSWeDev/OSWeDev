import { cloneDeep, isEqual } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterVOHandler from '../../../../../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextFilterVOManager from '../../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import FieldValueFilterWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldValueFilterWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import SimpleDatatableFieldVO from '../../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
import DashboardPageVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import ContextFilterVO from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import TSRange from '../../../../../../../shared/modules/DataRender/vos/TSRange';
import VOsTypesManager from '../../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import RangeHandler from '../../../../../../../shared/tools/RangeHandler';
import { ModuleTranslatableTextGetter } from '../../../../InlineTranslatableText/TranslatableTextStore';
import TSRangeInputComponent from '../../../../tsrangeinput/TSRangeInputComponent';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import Dates from '../../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import './FieldValueFilterDateWidgetComponent.scss';

@Component({
    template: require('./FieldValueFilterDateWidgetComponent.pug'),
    components: {
        Tsrangeinputcomponent: TSRangeInputComponent
    }
})
export default class FieldValueFilterDateWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;
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
    private old_widget_options: FieldValueFilterWidgetOptionsVO = null;

    private actual_query: string = null;

    private auto_select_date: boolean = null;
    private auto_select_date_min: number = null;
    private auto_select_date_max: number = null;
    private auto_select_date_relative_mode: boolean = null;
    private relative_to_other_filter_id: number = null;

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

        let options: FieldValueFilterWidgetOptionsVO = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as FieldValueFilterWidgetOptionsVO;
                options = options ? new FieldValueFilterWidgetOptionsVO().from(options) : null;
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

        let options: FieldValueFilterWidgetOptionsVO = this.widget_options;

        if (!options) {
            return null;
        }

        this.auto_select_date = this.widget_options.auto_select_date;
        this.auto_select_date_min = this.widget_options.auto_select_date_min;
        this.auto_select_date_max = this.widget_options.auto_select_date_max;
        this.auto_select_date_relative_mode = this.widget_options.auto_select_date_relative_mode;
        this.relative_to_other_filter_id = this.widget_options.relative_to_other_filter_id;

        // If it is a auto_select_date widget
        if (this.auto_select_date) {
            if (this.auto_select_date_relative_mode) {
                const now = Dates.now();

                this.ts_range = RangeHandler.createNew(
                    TSRange.RANGE_TYPE,
                    Dates.add(now, this.auto_select_date_min, this.segmentation_type),
                    Dates.add(now, this.auto_select_date_max, this.segmentation_type),
                    true,
                    true,
                    this.segmentation_type
                );
            }
        } else {
            this.ts_range = options.default_ts_range_values;
        }
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
            context_filter = ContextFilterVOHandler.find_context_filter_by_type(root_context_filter, ContextFilterVO.TYPE_DATE_INTERSECTS);
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
            context_filter = ContextFilterVOHandler.find_context_filter_by_type(root_context_filter, ContextFilterVO.TYPE_DATE_INTERSECTS);
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
            context_filter = ContextFilterVOManager.create_context_filter_from_data_filter_option(null, this.ts_range, field, this.vo_field_ref);

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

                let new_root = ContextFilterVOHandler.add_context_filter_to_tree(root_context_filter, context_filter);

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
        let options: FieldValueFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
    }

    get segmentation_type(): number {
        let options: FieldValueFilterWidgetOptionsVO = this.widget_options;

        return options ? options.segmentation_type : null;
    }

    get exclude_values(): TSRange {
        let options: FieldValueFilterWidgetOptionsVO = this.widget_options;

        if (!options) {
            return null;
        }

        return options.exclude_ts_range_values;
    }

    get field_date(): SimpleDatatableFieldVO<any, any> {
        let field = SimpleDatatableFieldVO.createNew(this.vo_field_ref.field_id)
            .setModuleTable(VOsTypesManager.moduleTables_by_voType[this.vo_field_ref.api_type_id]);

        if (this.segmentation_type != null) {
            field.segmentation_type = this.segmentation_type;
        }

        return field;
    }
}
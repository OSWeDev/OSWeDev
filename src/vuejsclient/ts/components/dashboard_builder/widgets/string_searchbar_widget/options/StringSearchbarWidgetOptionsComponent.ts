import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import StringSearchbarWidgetOptions from './StringSearchbarWidgetOptions';
import './StringSearchbarWidgetOptionsComponent.scss';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import { ModuleTranslatableTextGetter } from '../../../../InlineTranslatableText/TranslatableTextStore';
import ContextFilterVO from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import DashboardPageVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DataFilterOption from '../../../../../../../shared/modules/DataRender/vos/DataFilterOption';
import AdvancedStringFilter from '../../field_value_filter_widget/string/AdvancedStringFilter';
import { cloneDeep, debounce, isEqual } from 'lodash';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import ResetFiltersWidgetController from '../../reset_filters_widget/ResetFiltersWidgetController';
import ModuleTableController from '../../../../../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldVO from '../../../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import DashboardBuilderWidgetsController from '../../DashboardBuilderWidgetsController';
import VOsTypesManager from '../../../../../../../shared/modules/VO/manager/VOsTypesManager';
import StringSearchbarWidgetController from '../StringSearchbarWidgetController';
import FieldFiltersVOManager from '../../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';

@Component({
    template: require('./StringSearchbarWidgetOptionsComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class StringSearchbarWidgetOptionsComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleDashboardPageAction
    private set_active_field_filter: (param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) => void;

    @ModuleDashboardPageAction
    private remove_active_field_filter: (params: { vo_type: string, field_id: string }) => void;

    @ModuleDashboardPageGetter
    private get_widgets_invisibility: { [w_id: number]: boolean };

    @ModuleDashboardPageAction
    private set_widgets_invisibility: (widgets_invisibility: { [w_id: number]: boolean }) => void;

    @ModuleDashboardPageAction
    private set_widget_invisibility: (w_id: number) => void;

    @ModuleDashboardPageAction
    private set_widget_visibility: (w_id: number) => void;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private default_values_changed: boolean = false; // Attribut pour reaffecter les valeurs par défaut lorsqu'elles sont modifiées.

    private advanced_string_filters: AdvancedStringFilter[] = [new AdvancedStringFilter()];

    private warn_existing_external_filters: boolean = false;

    private actual_query: string = null;
    private force_filter_change: boolean = false;

    private is_init: boolean = false;
    private old_widget_options: StringSearchbarWidgetOptions = null;

    private last_calculation_cpt: number = 0;


    get vo_field_ref_label(): string {
        if ((!this.widget_options) || (!this.vo_field_ref)) {
            return null;
        }

        return this.get_flat_locale_translations[this.vo_field_ref.get_translatable_name_code_text(this.page_widget.id)];
    }

    get vo_field_ref(): VOFieldRefVO {
        const options: StringSearchbarWidgetOptions = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
    }

    get vo_field_ref_multiple(): VOFieldRefVO[] {
        const options: StringSearchbarWidgetOptions = this.widget_options;

        if ((!options) || (!options.vo_field_ref_multiple) || (!options.vo_field_ref_multiple.length)) {
            return null;
        }

        const res: VOFieldRefVO[] = [];

        for (const i in options.vo_field_ref_multiple) {
            res.push(Object.assign(new VOFieldRefVO(), options.vo_field_ref_multiple[i]));
        }

        return res;
    }

    get is_translatable_type(): boolean {
        if (!this.vo_field_ref) {
            return false;
        }

        const moduletable = ModuleTableController.module_tables_by_vo_type[this.vo_field_ref.api_type_id];
        if (!moduletable) {
            return false;
        }

        const field = moduletable.get_field_by_id(this.vo_field_ref.field_id);
        if (!field) {
            return false;
        }

        return field.field_type == ModuleTableFieldVO.FIELD_TYPE_translatable_text;
    }

    get widgets_by_id(): { [id: number]: DashboardWidgetVO } {
        return VOsTypesManager.vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets);
    }

    /**
     * Computed widget options
     *  - Called on component|widget creation
     * @returns StringSearchbarWidgetOptions
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

    /**
     * Watch on widget_options
     *  - Shall happen first on component init or each time widget_options changes
     *  - Initialize the tmp_active_filter_options with default widget options
     *
     * @returns void
     */
    @Watch('widget_options', { immediate: true })
    private onchange_widget_options(): void {
        if (this.old_widget_options) {
            if (isEqual(this.widget_options, this.old_widget_options)) {
                return;
            }
        }

        this.old_widget_options = cloneDeep(this.widget_options);

        this.is_init = false;

        this.throttled_update_visible_options();
    }

    private throttled_update_visible_options = (timeout: number = 300) =>
        ThrottleHelper.declare_throttle_without_args(
            'StringSearchbarWidgetOptionsComponent.throttled_update_visible_options',
            this.update_visible_options.bind(this),
            timeout,
            false
        )();

    /**
     * Watch on active_field_filters
     *  - Shall happen first on component init or each time active_field_filters changes
     *  - Initialize the tmp_active_filter_options with default widget options
     * @returns {void}
     */
    @Watch('get_active_field_filters', { deep: true })
    private onchange_active_field_filters(): void {
        this.throttled_update_visible_options();
    }

    /**
     * onchange_tmp_active_filter_options
     * tmp_active_filter_options is the visible active filters of the widget
     * - Happen each time tmp_active_filter_options changes
     * - Update the active_field_filters
     * @returns {void}
     */
    @Watch('tmp_active_filter_options', { deep: true })
    private onchange_tmp_active_filter_options(): void {

        if (!this.widget_options) {
            return;
        }

        const context_filter = StringSearchbarWidgetController.create_context_filter_from_string_filter_options(
            this.vo_field_ref,
            this.tmp_active_filter_options,
            {
                vo_field_ref_multiple: this.vo_field_ref_multiple,
                vo_field_ref: this.vo_field_ref,
            }
        );

        this.set_active_field_filter({
            field_id: this.vo_field_ref.field_id,
            vo_type: this.vo_field_ref.api_type_id,
            active_field_filter: context_filter,
        });
    }

    private async mounted() {
        ResetFiltersWidgetController.getInstance().register_reseter(
            this.dashboard_page,
            this.page_widget,
            this.reset_visible_options.bind(this),
        );
    }

    private filter_type_label(filter_type: number): string {
        if (filter_type != null) {
            return this.t(AdvancedStringFilter.FILTER_TYPE_LABELS[filter_type]);
        }
        return null;
    }

    private add_advanced_string_filter() {
        if (!this.advanced_string_filters) {
            this.advanced_string_filters = [];
            return;
        }

        this.advanced_string_filters[this.advanced_string_filters.length - 1].link_type = AdvancedStringFilter.LINK_TYPE_ET;
        this.advanced_string_filters.push(new AdvancedStringFilter());
    }

    private validate_advanced_string_filter() {

        const context_active_filter_options: ContextFilterVO[] = [];

        const moduletable = ModuleTableController.module_tables_by_vo_type[this.vo_field_ref.api_type_id];
        const field = moduletable.get_field_by_id(this.vo_field_ref.field_id);

        let previous_filter: AdvancedStringFilter = null;
        let tmp_context_filter: ContextFilterVO = null;


        // query().filter_by_date_after().filter_by_date_before()
        // a.or(b).or(c)
        // ContextFilterVO.or([a, b, c]).by_date_eq().by_date_before()

        if (this.vo_field_ref_multiple?.length > 0) {
            // Case when we have a search from multiple vos api_type_id
            // We need to create a context_filter for each of those
            for (const j in this.vo_field_ref_multiple) {
                const vo_field_ref_multiple = this.vo_field_ref_multiple[j];

                const moduletable_multiple = ModuleTableController.module_tables_by_vo_type[vo_field_ref_multiple.api_type_id];
                const field_multiple = moduletable_multiple.get_field_by_id(vo_field_ref_multiple.field_id);

                tmp_context_filter = null;
                previous_filter = null;

                for (const i in this.advanced_string_filters) {
                    const advanced_filter: AdvancedStringFilter = this.advanced_string_filters[i];

                    tmp_context_filter = this.get_advanced_string_filter(
                        tmp_context_filter,
                        advanced_filter,
                        field_multiple,
                        vo_field_ref_multiple,
                        previous_filter
                    );
                }

                if (tmp_context_filter) {
                    context_active_filter_options.push(tmp_context_filter);
                }
            }
        }

        previous_filter = null;
        tmp_context_filter = null;

        for (const i in this.advanced_string_filters) {
            const advanced_filter: AdvancedStringFilter = this.advanced_string_filters[i];

            tmp_context_filter = this.get_advanced_string_filter(
                tmp_context_filter,
                advanced_filter,
                field,
                this.vo_field_ref,
                previous_filter
            );
        }

        if (tmp_context_filter) {
            context_active_filter_options.push(tmp_context_filter);
        }

        if (context_active_filter_options.length > 0) {
            this.set_active_field_filter({
                field_id: this.vo_field_ref.field_id,
                vo_type: this.vo_field_ref.api_type_id,
                active_field_filter: ContextFilterVO.or(context_active_filter_options),
            });
        }
    }

    private get_advanced_string_filter(context_filter: ContextFilterVO, advanced_filter: AdvancedStringFilter, field: ModuleTableFieldVO, vo_field_ref: VOFieldRefVO, previous_filter: AdvancedStringFilter): ContextFilterVO {
        const new_context_filter = this.get_ContextFilterVO_from_AdvancedStringFilter(advanced_filter, field, vo_field_ref);

        if (!new_context_filter) {
            return null;
        }

        if (!context_filter) {
            context_filter = new_context_filter;
        } else {

            const link_ = new ContextFilterVO();
            link_.field_name = context_filter.field_name;
            link_.vo_type = context_filter.vo_type;

            if (previous_filter.link_type == AdvancedStringFilter.LINK_TYPE_ET) {
                link_.filter_type = ContextFilterVO.TYPE_FILTER_AND;
            } else {
                link_.filter_type = ContextFilterVO.TYPE_FILTER_OR;
            }

            link_.left_hook = context_filter;
            link_.right_hook = new_context_filter;
            context_filter = link_;
        }

        previous_filter = advanced_filter;

        return context_filter;
    }

    private delete_advanced_string_filter(index: number) {
        if ((!this.advanced_string_filters) || (index >= this.advanced_string_filters.length - 1)) {
            return;
        }

        this.advanced_string_filters.splice(index, 1);
    }

    private switch_link_type(advanced_string_filter: AdvancedStringFilter) {
        advanced_string_filter.link_type = 1 - advanced_string_filter.link_type;
    }

    private query_update_visible_options(_query: string) {
        this.actual_query = _query;
        this.throttled_update_visible_options();
    }

    /**
     * Reset visible options
     */
    private reset_visible_options() {
        // Reset des filtres
        this.advanced_string_filters = [new AdvancedStringFilter()]; // Reset les champs saisie libre

        // On update le visuel de tout le monde suite au reset
        this.throttled_update_visible_options(0);
    }

    /**
     * Update visible option
     *  - This happen | triggered with lodash throttle method (throttled_update_visible_options)
     *  - Each time visible option shall be updated
     * @returns void
     */
    private async update_visible_options(): Promise<void> {

        const launch_cpt: number = (this.last_calculation_cpt + 1);

        this.last_calculation_cpt = launch_cpt;

        if ((!this.widget_options) || (!this.vo_field_ref)) {
            this.filter_visible_options = [];
            return;
        }

        // Init context filter of the current filter
        const root_context_filter: ContextFilterVO = FieldFiltersVOManager.get_context_filter_from_field_filters(
            this.vo_field_ref,
            this.get_active_field_filters,
        );

        // Say if has active field filter
        const has_active_field_filter: boolean = !!(root_context_filter);

        // Si on a des valeurs par défaut, on va faire l'init
        const old_is_init: boolean = this.is_init;

        this.is_init = true;

        if (this.force_filter_change) {
            this.force_filter_change = false;
        }

        // case when has active context filter but active visible filter empty
        // - try to apply context filter or display filter application fail alert
        if (has_active_field_filter &&
            (!(this.tmp_active_filter_options?.length > 0))) {

            this.warn_existing_external_filters = !this.try_apply_actual_active_filters(
                root_context_filter
            );
        }
    }

    // create single data filter to apply
    private createDataFilter(text: string, index: string | number): DataFilterOption {
        const dataFilter = new DataFilterOption(
            DataFilterOption.STATE_SELECTED,
            text,
            parseInt(index.toString())
        );
        dataFilter.string_value = text;

        return dataFilter;
    }

    /**
     * Try Apply Actual Active Filters
     *  - Make the showable active filter options by the given filter
     * @param filter ContextFilterVO
     * @returns boolean
     */
    private try_apply_actual_active_filters(filter_: ContextFilterVO): boolean {

        /**
         * si on a des filtres autres que simple, on doit passer en advanced
         */
        if (this.has_advanced_filter(filter_)) {

            if (this.tmp_active_filter_options?.length > 0) {
                this.tmp_active_filter_options = null;
            }

            const advanced_filters: AdvancedStringFilter[] = [];

            if ((this.vo_field_ref_multiple?.length > 0)) {
                this.try_apply_advanced_filters(filter_.left_hook, advanced_filters);
            } else {
                this.try_apply_advanced_filters(filter_, advanced_filters);
            }

            this.advanced_string_filters = advanced_filters;
        } else {

            if (this.is_advanced_filters) {
                this.is_advanced_filters = false;
            }

            if (this.advanced_string_filters) {
                this.advanced_string_filters = null;
            }

            const tmp_active_filter_options: DataFilterOption[] = [];

            for (const i in filter_.param_textarray) {
                const text = filter_.param_textarray[i];

                const dataFilter = this.createDataFilter(text, i);

                tmp_active_filter_options.push(dataFilter);
            }

            this.tmp_active_filter_options = tmp_active_filter_options;
        }

        return true;
    }

    private has_advanced_filter(filter_: ContextFilterVO): boolean {
        if ((filter_.filter_type == ContextFilterVO.TYPE_TEXT_EQUALS_ANY) && (filter_.param_textarray != null) && (filter_.param_textarray.length > 0)) {
            return false;
        }

        return true;
    }
}
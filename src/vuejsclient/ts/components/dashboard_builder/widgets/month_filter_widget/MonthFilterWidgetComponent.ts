import { cloneDeep, isEqual } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Vue, Watch } from 'vue-property-decorator';
import MonthFilterWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/MonthFilterWidgetManager';
import FieldFiltersVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import ContextFilterVOHandler from '../../../../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import MonthFilterWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/MonthFilterWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import NumRange from '../../../../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../../../../shared/modules/DataRender/vos/NumSegment';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import './MonthFilterWidgetComponent.scss';

@Component({
    template: require('./MonthFilterWidgetComponent.pug'),
    components: {}
})
export default class MonthFilterWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;
    @ModuleDashboardPageAction
    private set_active_field_filter: (param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) => void;
    @ModuleDashboardPageAction
    private remove_active_field_filter: (params: { vo_type: string, field_id: string }) => void;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @ModuleDashboardPageAction
    private set_page_widget_component_by_pwid: (param: { pwid: number, page_widget_component: VueComponentBase }) => void;

    @ModuleDashboardPageGetter
    private get_page_widgets_components_by_pwid: { [pwid: number]: VueComponentBase };

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private selected_months: { [month: number]: boolean } = {};

    // Is All Months Selected Toggle Button
    // - Shall be highlight or true when selected_months empty
    // - Shall be false when selected_months has at least one selected
    private is_all_months_selected: boolean = false;
    private force_selected_months_reset: boolean = false;

    private auto_select_month: boolean = null;
    private auto_select_month_relative_mode: boolean = null;
    private auto_select_month_min: number = null;
    private auto_select_month_max: number = null;
    private old_widget_options: MonthFilterWidgetOptionsVO = null;
    private is_relative_to_other_filter: boolean = false;
    private relative_to_other_filter_id: number = null;
    // Current filter may cumulate months
    private is_month_cumulable: boolean = false;

    private widget_options: MonthFilterWidgetOptionsVO = null;

    protected async mounted() {
        this.set_page_widget_component_by_pwid({
            pwid: this.page_widget.id,
            page_widget_component: this
        });
    }

    /**
     * Handle toggle selected month
     *  - Called when we click on toggle month button
     * @param i index in selected month array
     */
    private handle_toggle_selected_month(i: string) {
        Vue.set(this.selected_months, i, !this.selected_months[i]);

        if (!(Object.keys(this.selected_months)?.length > 0)) {
            // if there is no selected_months
            this.is_all_months_selected = true;
        } else {
            this.is_all_months_selected = false;
        }
    }

    /**
     * Handle Toggle Select All
     *  - Called when we click on toggle select all
     */
    private handle_toggle_select_all() {
        this.is_all_months_selected = !this.is_all_months_selected;

        if (this.is_all_months_selected) {
            // If is all months selected reset selected_months
            this.selected_months = {};
            this.force_selected_months_reset = true;
        }
    }

    get vo_field_ref_label(): string {
        if ((!this.widget_options) || (!this.vo_field_ref)) {
            return null;
        }

        return this.get_flat_locale_translations[this.vo_field_ref.get_translatable_name_code_text(this.page_widget.id)];
    }

    get relative_to_this_filter(): MonthFilterWidgetComponent {
        if (!this.widget_options.auto_select_month_relative_mode) {
            return null;
        }

        if (!this.widget_options.is_relative_to_other_filter) {
            return null;
        }

        if (!this.widget_options.relative_to_other_filter_id) {
            return null;
        }

        return this.get_page_widgets_components_by_pwid[this.widget_options.relative_to_other_filter_id] as MonthFilterWidgetComponent;
    }

    /**
     * Computed widget options
     *  - Called on component|widget creation
     *
     * @returns {MonthFilterWidgetOptionsVO}
     */
    private get_widget_options(): MonthFilterWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: MonthFilterWidgetOptionsVO = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as MonthFilterWidgetOptionsVO;
                options = options ? new MonthFilterWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    /**
     * onchange_page_widget
     *  - Called when page_widget is changed
     *
     * @returns {void}
     */
    @Watch('page_widget', { immediate: true, deep: true })
    private onchange_page_widget(): void {
        if (!this.page_widget) {
            return;
        }

        this.widget_options = this.get_widget_options();
    }

    /**
     * Watch on widget_options
     *  - Shall happen first on component init or each time widget_options changes
     *  - Initialize the selected_months with default widget options
     *
     * @returns {void}
     */
    @Watch('widget_options', { immediate: true, deep: true })
    private onchange_widget_options(): void {
        if (!!this.old_widget_options) {
            if (isEqual(this.widget_options, this.old_widget_options)) {
                return;
            }
        }

        this.old_widget_options = cloneDeep(this.widget_options);

        /**
         * Si on change la conf de auto_select on veut réinit le filtre (on est en modif donc et on vient de changer la conf on veut voir l'impact)
         *  sinon on veut surtout pas changer la sélection actuelle
         */
        if (
            (this.auto_select_month == this.widget_options.auto_select_month) &&
            (this.auto_select_month_relative_mode == this.widget_options.auto_select_month_relative_mode) &&
            (this.auto_select_month_min == this.widget_options.auto_select_month_min) &&
            (this.auto_select_month_max == this.widget_options.auto_select_month_max) &&
            (this.is_relative_to_other_filter == this.widget_options.is_relative_to_other_filter) &&
            (this.relative_to_other_filter_id == this.widget_options.relative_to_other_filter_id) &&
            (this.is_month_cumulable == this.widget_options.is_month_cumulable)
        ) {
            return;
        }

        this.auto_select_month = this.widget_options.auto_select_month;
        this.auto_select_month_relative_mode = this.widget_options.auto_select_month_relative_mode;
        this.auto_select_month_min = this.widget_options.auto_select_month_min;
        this.auto_select_month_max = this.widget_options.auto_select_month_max;
        this.is_relative_to_other_filter = this.widget_options.is_relative_to_other_filter;
        this.relative_to_other_filter_id = this.widget_options.relative_to_other_filter_id;
        this.is_month_cumulable = this.widget_options.is_month_cumulable;

        this.selected_months = MonthFilterWidgetManager.get_selected_months_from_widget_options(
            this.widget_options
        );
    }

    get other_filter_selected_months(): { [year: string]: boolean } {
        if (!this.relative_to_this_filter) {
            return null;
        }

        let other_filter_selected_months = this.relative_to_this_filter.selected_months;
        if (!other_filter_selected_months) {
            return null;
        }

        return other_filter_selected_months;
    }

    /**
     * onchange_other_filter_selected_months
     *  - Called when other_filter_selected_months changes
     *  - Case when this filter is relative to another filter
     *
     * @returns {void}
     */
    @Watch('other_filter_selected_months', { immediate: true, deep: true })
    private onchange_other_filter_selected_months(): void {
        if (!this.relative_to_this_filter) {
            return;
        }

        let selected_months = {};
        for (let month in this.other_filter_selected_months) {
            let month_int = parseInt(month);

            if (!this.other_filter_selected_months[month]) {
                continue;
            }

            for (let month_i = month_int + this.widget_options.auto_select_month_min; month_i <= month_int + this.widget_options.auto_select_month_max; month_i++) {
                selected_months[month_i] = true;
            }
        }

        this.selected_months = selected_months;
    }

    /**
     * Get active field filters
     *  - Shall initialize the selected months by using context filter
     *
     * @returns {void}
     */
    @Watch("get_active_field_filters", { immediate: true })
    private try_preload_selected_months(): void {

        // 1 on cherche le contextfilter correspondant à ce type de filtre
        const root_context_filter: ContextFilterVO = FieldFiltersVOManager.get_context_filter_by_widget_options_from_field_filters(
            this.widget_options,
            this.get_active_field_filters
        );

        /**
         * Si on a un root_context_filter, on cherche celui qui est du type concerné
         */
        let context_filter: ContextFilterVO = null;
        if (!!root_context_filter) {
            context_filter = ContextFilterVOHandler.getInstance().find_context_filter_by_type(
                root_context_filter,
                ContextFilterVO.TYPE_DATE_MONTH
            );
        }

        // If no context filter that mean there is no initialization
        // - Then keep let all selected months with default values
        if (!context_filter) {
            return;
        }

        // On veut surtout pas changer si ya pas de changement à faire, donc on test la conf actuelle et on verra après
        this.selected_months = MonthFilterWidgetManager.get_selected_months_from_context_filter(
            context_filter,
            this.months
        );
    }

    /**
     * Watch on selected_months
     *  - Called each time the selected_months changes
     *  - This (re)initialize the context store on each call
     *
     * @returns {void}
     */
    @Watch('selected_months', { immediate: true, deep: true })
    private onchange_selected_months(): void {
        // 1 on cherche le contextfilter correspondant à ce type de filtre
        const root_context_filter: ContextFilterVO = FieldFiltersVOManager.get_context_filter_by_widget_options_from_field_filters(
            this.widget_options,
            this.get_active_field_filters
        );

        // (on initialization) if context exist and selected_months exist overwrite months_range
        let months_ranges: NumRange[] = [];
        for (let i in this.selected_months) {
            if (!this.selected_months[i]) {
                continue;
            }

            months_ranges.push(
                RangeHandler.create_single_elt_NumRange(
                    parseInt(i),
                    NumSegment.TYPE_INT
                )
            );
        }
        months_ranges = RangeHandler.getRangesUnion(months_ranges);

        /**
         * Si on a un root_context_filter, on cherche celui qui est du type concerné
         */
        let context_filter: ContextFilterVO = null;
        if (!!root_context_filter) {
            context_filter = ContextFilterVOHandler.getInstance().find_context_filter_by_type(
                root_context_filter,
                ContextFilterVO.TYPE_DATE_MONTH
            );
        }

        /**
         * Si on a pas de contextfilter actuellement et qu'on a pas besoin d'en avoir, inutile de continuer
         */
        if ((!context_filter) && (!(months_ranges?.length > 0))) {
            return;
        }

        /**
         * Si on a pas de contextfilter pour le moment mais qu'il en faut un, on le crée
         */
        if (!context_filter) {
            context_filter = new ContextFilterVO();
            context_filter.filter_type = ContextFilterVO.TYPE_DATE_MONTH;
            context_filter.param_numranges = months_ranges;

            if (this.is_vo_field_ref) {
                context_filter.vo_type = this.vo_field_ref.api_type_id;
                context_filter.field_id = this.vo_field_ref.field_id;
            } else {
                context_filter.vo_type = ContextFilterVO.CUSTOM_FILTERS_TYPE;
                context_filter.field_id = this.custom_filter_name;
            }

            let new_root = ContextFilterVOHandler.add_context_filter_to_tree(root_context_filter, context_filter);
            if (new_root != root_context_filter) {
                if (!new_root) {
                    this.remove_active_field_filter({
                        field_id: this.is_vo_field_ref ? this.vo_field_ref.field_id : this.custom_filter_name,
                        vo_type: this.is_vo_field_ref ? this.vo_field_ref.api_type_id : ContextFilterVO.CUSTOM_FILTERS_TYPE,
                    });
                } else {
                    this.set_active_field_filter({
                        field_id: this.is_vo_field_ref ? this.vo_field_ref.field_id : this.custom_filter_name,
                        vo_type: this.is_vo_field_ref ? this.vo_field_ref.api_type_id : ContextFilterVO.CUSTOM_FILTERS_TYPE,
                        active_field_filter: new_root,
                    });
                }
            }
            return;
        }

        /**
         * Si on a un context_filter et qu'on en a plus besoin on le supprime
         */
        if ((!!context_filter) && (!this.force_selected_months_reset) && (!(months_ranges?.length > 0))) {
            let new_root = ContextFilterVOHandler.getInstance().remove_context_filter_from_tree(root_context_filter, context_filter);
            if (new_root != root_context_filter) {
                if (!new_root) {
                    this.remove_active_field_filter({
                        field_id: this.is_vo_field_ref ? this.vo_field_ref.field_id : this.custom_filter_name,
                        vo_type: this.is_vo_field_ref ? this.vo_field_ref.api_type_id : ContextFilterVO.CUSTOM_FILTERS_TYPE,
                    });
                } else {
                    this.set_active_field_filter({
                        field_id: this.is_vo_field_ref ? this.vo_field_ref.field_id : this.custom_filter_name,
                        vo_type: this.is_vo_field_ref ? this.vo_field_ref.api_type_id : ContextFilterVO.CUSTOM_FILTERS_TYPE,
                        active_field_filter: new_root,
                    });
                }
            }
            return;
        }

        /**
         * Si on a un contextfilter, on check si on doit faire un update et si c'est nécessaire on le fait
         */
        if (!!context_filter) {
            if (!RangeHandler.are_same(context_filter.param_numranges, months_ranges)) {
                context_filter.param_numranges = months_ranges;

                let new_root = ContextFilterVOHandler.add_context_filter_to_tree(root_context_filter, context_filter);

                this.set_active_field_filter({
                    field_id: this.is_vo_field_ref ? this.vo_field_ref.field_id : this.custom_filter_name,
                    vo_type: this.is_vo_field_ref ? this.vo_field_ref.api_type_id : ContextFilterVO.CUSTOM_FILTERS_TYPE,
                    active_field_filter: new_root,
                });

                // Reset default value
                this.force_selected_months_reset = false;
            }
            return;
        }
    }

    get is_vo_field_ref(): boolean {
        if (!this.widget_options) {
            return true;
        }

        return this.widget_options.is_vo_field_ref;
    }

    get custom_filter_name(): string {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.custom_filter_name;
    }

    get vo_field_ref(): VOFieldRefVO {
        let options: MonthFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
    }

    get months(): string[] {
        return MonthFilterWidgetManager.get_available_months_from_widget_options(
            this.widget_options
        );
    }

    /**
     * Can Select All
     *  - Can select all clickable button
     */
    get can_select_all(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.can_select_all;
    }
}
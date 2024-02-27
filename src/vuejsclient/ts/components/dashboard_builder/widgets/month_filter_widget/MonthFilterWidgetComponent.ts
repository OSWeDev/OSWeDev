import { cloneDeep, isEqual } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterVOHandler from '../../../../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import MonthFilterWidgetHandler from '../../../../../../shared/modules/DashboardBuilder/handlers/MonthFilterWidgetHandler';
import FieldFiltersVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import MonthFilterWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/MonthFilterWidgetManager';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import MonthFilterWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/MonthFilterWidgetOptionsVO';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import NumRange from '../../../../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../../../../shared/modules/DataRender/vos/NumSegment';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../VueComponentBase';
import MonthFilterInputComponent from '../../../month_filter_input/MonthFilterInputComponent';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import './MonthFilterWidgetComponent.scss';

@Component({
    template: require('./MonthFilterWidgetComponent.pug'),
    components: {
        Monthfilterinputcomponent: MonthFilterInputComponent,
    }
})
export default class MonthFilterWidgetComponent extends VueComponentBase {

    public selected_months: { [month: number]: boolean } = {};

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

    // Relative page widget (if relative_to_other_filter_id is set)
    private relative_page_widget: DashboardPageWidgetVO = null;

    // Current filter may cumulate months
    private is_month_cumulated_selected: boolean = false;

    private widget_options: MonthFilterWidgetOptionsVO = null;

    protected async mounted() {
        this.set_page_widget_component_by_pwid({
            pwid: this.page_widget.id,
            page_widget_component: this
        });
    }

    get can_ytd() {
        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.can_ytd;
    }

    get ytd_option_m_minus_x() {
        if (!this.widget_options) {
            return 1;
        }

        return (this.widget_options.ytd_option_m_minus_x == null) ? 1 : this.widget_options.ytd_option_m_minus_x;
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
        if (this.old_widget_options) {
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
            (this.is_month_cumulated_selected == this.widget_options.is_month_cumulated_selected)
        ) {
            return;
        }

        this.auto_select_month = this.widget_options.auto_select_month;
        this.auto_select_month_relative_mode = this.widget_options.auto_select_month_relative_mode;
        this.auto_select_month_min = this.widget_options.auto_select_month_min;
        this.auto_select_month_max = this.widget_options.auto_select_month_max;
        this.is_relative_to_other_filter = this.widget_options.is_relative_to_other_filter;
        this.relative_to_other_filter_id = this.widget_options.relative_to_other_filter_id;
        this.is_month_cumulated_selected = this.widget_options.is_month_cumulated_selected;

        this.selected_months = MonthFilterWidgetManager.get_selected_months_from_widget_options(
            this.widget_options
        );
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

        const selected_months = MonthFilterWidgetManager.get_selected_months_from_other_selected_months(
            this.widget_options,
            this.other_filter_selected_months
        );

        this.selected_months = selected_months;
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
        for (const i in this.selected_months) {
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
        if (root_context_filter) {
            context_filter = ContextFilterVOHandler.find_context_filter_by_type(root_context_filter, ContextFilterVO.TYPE_DATE_MONTH);
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

            const new_root = ContextFilterVOHandler.add_context_filter_to_tree(
                root_context_filter,
                context_filter
            );

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
            const new_root = ContextFilterVOHandler.remove_context_filter_from_tree(root_context_filter, context_filter);
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
        if (context_filter) {
            if (!RangeHandler.are_same(context_filter.param_numranges, months_ranges)) {
                context_filter.param_numranges = months_ranges;

                const new_root = ContextFilterVOHandler.add_context_filter_to_tree(
                    root_context_filter,
                    context_filter
                );

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

    /**
     * onchange_active_field_filters
     *  - Shall initialize the selected months by using context filter
     *
     * @returns {void}
     */
    @Watch("get_active_field_filters", { immediate: true, deep: true })
    private onchange_active_field_filters(): void {

        // 1 on cherche le contextfilter correspondant à ce type de filtre
        const root_context_filter: ContextFilterVO = FieldFiltersVOManager.get_context_filter_by_widget_options_from_field_filters(
            this.widget_options,
            this.get_active_field_filters
        );

        /**
         * Si on a un root_context_filter, on cherche celui qui est du type concerné
         */
        let context_filter: ContextFilterVO = null;
        if (root_context_filter) {
            context_filter = ContextFilterVOHandler.find_context_filter_by_type(
                root_context_filter,
                ContextFilterVO.TYPE_DATE_MONTH
            );
        }

        // If no context filter that mean there is no initialization
        // - Then keep let all selected months with default values
        if (!context_filter) {
            return;
        }

        const selected_months_has_changed: boolean = MonthFilterWidgetHandler.has_selectected_months_changed(
            context_filter,
            this.selected_months,
            this.months
        );

        // On veut surtout pas changer si ya pas de changement à faire, donc on test la conf actuelle et on verra après
        if (selected_months_has_changed) {
            this.selected_months = MonthFilterWidgetManager.get_selected_months_from_context_filter(
                context_filter,
                this.months
            );
        }
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
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as MonthFilterWidgetOptionsVO;
                options = options ? new MonthFilterWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    /**
     * Handle Select All Change
     */
    private handle_all_months_selected_change(is_all_months_selected: boolean): void {
        this.is_all_months_selected = is_all_months_selected;
    }

    /**
     * Handle Selected Month Change
     */
    private handle_selected_month_change(selected_months: { [month: number]: boolean }): void {
        this.selected_months = selected_months;
    }

    get other_filter_selected_months(): { [year: string]: boolean } {
        if (!this.relative_to_this_filter) {
            return null;
        }

        const other_filter_selected_months = this.relative_to_this_filter.selected_months;
        if (!other_filter_selected_months) {
            return null;
        }

        return other_filter_selected_months;
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
        const options: MonthFilterWidgetOptionsVO = this.widget_options;

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
import { cloneDeep, isEqual } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterVOHandler from '../../../../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import YearFilterWidgetHandler from '../../../../../../shared/modules/DashboardBuilder/handlers/YearFilterWidgetHandler';
import FieldFiltersVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import YearFilterWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/YearFilterWidgetManager';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import YearFilterWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/YearFilterWidgetOptionsVO';
import NumRange from '../../../../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../../../../shared/modules/DataRender/vos/NumSegment';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../VueComponentBase';
import YearFilterInputComponent from '../../../year_filter_input/YearFilterInputComponent';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import './YearFilterWidgetComponent.scss';

@Component({
    template: require('./YearFilterWidgetComponent.pug'),
    components: {
        Yearfilterinputcomponent: YearFilterInputComponent,
    }
})
export default class YearFilterWidgetComponent extends VueComponentBase {

    public selected_years: { [year: number]: boolean } = {};

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDashboardPageAction
    private set_page_widget_component_by_pwid: (param: { pwid: number, page_widget_component: VueComponentBase }) => void;

    @ModuleDashboardPageGetter
    private get_page_widgets_components_by_pwid: { [pwid: number]: VueComponentBase };

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleDashboardPageAction
    private set_active_field_filter: (param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) => void;

    @ModuleDashboardPageAction
    private remove_active_field_filter: (params: { vo_type: string, field_id: string }) => void;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    // Is All Years Selected Toggle Button
    // - Shall be highlight or true when selected_years empty
    // - Shall be false when selected_years has at least one selected
    private is_all_years_selected: boolean = false;
    private force_selected_years_reset: boolean = false;

    private auto_select_year: boolean = null;
    private auto_select_year_relative_mode: boolean = null;
    private auto_select_year_min: number = null;
    private auto_select_year_max: number = null;

    private old_widget_options: YearFilterWidgetOptionsVO = null;
    private is_relative_to_other_filter: boolean = false;
    private relative_to_other_filter_id: number = null;

    // Relative page widget (if relative_to_other_filter_id is set)
    private relative_page_widget: DashboardPageWidgetVO = null;

    private widget_options: YearFilterWidgetOptionsVO = null;

    protected async mounted() {
        this.set_page_widget_component_by_pwid({
            pwid: this.page_widget.id,
            page_widget_component: this
        });
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
     *  - Shall happen first on component init (just after the computed widget_options)
     *  - Initialize the selected_years with default widget options
     * @returns void
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
            (this.auto_select_year == this.widget_options.auto_select_year) &&
            (this.auto_select_year_relative_mode == this.widget_options.auto_select_year_relative_mode) &&
            (this.auto_select_year_min == this.widget_options.auto_select_year_min) &&
            (this.auto_select_year_max == this.widget_options.auto_select_year_max) &&
            (this.is_relative_to_other_filter == this.widget_options.is_relative_to_other_filter) &&
            (this.relative_to_other_filter_id == this.widget_options.relative_to_other_filter_id)
        ) {
            return;
        }

        this.auto_select_year = this.widget_options.auto_select_year;
        this.auto_select_year_relative_mode = this.widget_options.auto_select_year_relative_mode;
        this.auto_select_year_min = this.widget_options.auto_select_year_min;
        this.auto_select_year_max = this.widget_options.auto_select_year_max;
        this.is_relative_to_other_filter = this.widget_options.is_relative_to_other_filter;
        this.relative_to_other_filter_id = this.widget_options.relative_to_other_filter_id;

        let selected_years = YearFilterWidgetManager.get_selected_years_from_widget_options(
            this.widget_options,
        );

        this.selected_years = selected_years;
    }

    @Watch('other_filter_selected_years', { immediate: true, deep: true })
    private onchange_other_filter_selected_years() {
        if (!this.relative_to_this_filter) {
            return;
        }

        const selected_years = YearFilterWidgetManager.get_selected_years_from_other_selected_years(
            this.widget_options,
            this.other_filter_selected_years,
        );

        this.selected_years = selected_years;
    }

    /**
     * Watch on select changes
     *  - Called each time the selected_years changes
     *  - This initialize the context store on first call
     * @returns void
     */
    @Watch('selected_years', { immediate: true, deep: true })
    private onchange_selected_years(): void {
        // 1 on cherche le contextfilter correspondant à ce type de filtre
        const root_context_filter: ContextFilterVO = FieldFiltersVOManager.get_context_filter_by_widget_options_from_field_filters(
            this.widget_options,
            this.get_active_field_filters,
        );

        let years_ranges: NumRange[] = [];
        for (let i in this.selected_years) {
            if (!this.selected_years[i]) {
                continue;
            }

            years_ranges.push(
                RangeHandler.create_single_elt_NumRange(
                    parseInt(i.toString()),
                    NumSegment.TYPE_INT
                )
            );
        }
        years_ranges = RangeHandler.getRangesUnion(years_ranges);

        /**
         * Si on a un root_context_filter, on cherche celui qui est du type concerné
         */
        let context_filter: ContextFilterVO = null;
        if (!!root_context_filter) {
            context_filter = ContextFilterVOHandler.find_context_filter_by_type(root_context_filter, ContextFilterVO.TYPE_DATE_YEAR);
        }

        /**
         * Si on a pas de contextfilter actuellement et qu'on a pas besoin d'en avoir, inutile de continuer
         */
        if ((!context_filter) && (!(years_ranges?.length > 0))) {
            return;
        }

        /**
         * Si on a pas de contextfilter pour le moment mais qu'il en faut un, on le crée
         */
        if (!context_filter) {
            context_filter = new ContextFilterVO();
            context_filter.filter_type = ContextFilterVO.TYPE_DATE_YEAR;
            context_filter.param_numranges = years_ranges;

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
         * Si on a un contextfilter et qu'on en a plus besoin on le supprime
         */
        if ((!!context_filter) && (!this.force_selected_years_reset) && (!(years_ranges?.length > 0))) {
            let new_root = ContextFilterVOHandler.remove_context_filter_from_tree(root_context_filter, context_filter);
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
            if (!RangeHandler.are_same(context_filter.param_numranges, years_ranges)) {
                context_filter.param_numranges = years_ranges;

                let new_root = ContextFilterVOHandler.add_context_filter_to_tree(root_context_filter, context_filter);

                this.set_active_field_filter({
                    field_id: this.is_vo_field_ref ? this.vo_field_ref.field_id : this.custom_filter_name,
                    vo_type: this.is_vo_field_ref ? this.vo_field_ref.api_type_id : ContextFilterVO.CUSTOM_FILTERS_TYPE,
                    active_field_filter: new_root,
                });

                // Reset default value
                this.force_selected_years_reset = false;
            }
            return;
        }
    }

    /**
     * Get active field filters
     *  - Shall initialize the selected years by using context filter
     * @returns void
     */
    @Watch("get_active_field_filters", { immediate: true, deep: true })
    private try_preload_selected_years(): void {

        // 1 on cherche le contextfilter correspondant à ce type de filtre
        const root_context_filter: ContextFilterVO = FieldFiltersVOManager.get_context_filter_by_widget_options_from_field_filters(
            this.widget_options,
            this.get_active_field_filters,
        );

        /**
         * Si on a un root_context_filter, on cherche celui qui est du type concerné
         */
        let context_filter: ContextFilterVO = null;
        if (!!root_context_filter) {
            context_filter = ContextFilterVOHandler.find_context_filter_by_type(
                root_context_filter,
                ContextFilterVO.TYPE_DATE_YEAR
            );
        }

        // If no context filter that mean there is no initialization
        // - Then keep let all selected years with default values
        if (!context_filter) {
            return;
        }

        const selected_years_has_changed: boolean = YearFilterWidgetHandler.has_selectected_years_changed(
            context_filter,
            this.selected_years,
            this.years
        );

        // On veut surtout pas changer si ya pas de changement à faire, donc on test la conf actuelle et on verra après
        if (selected_years_has_changed) {
            this.selected_years = YearFilterWidgetManager.get_selected_years_from_context_filter(
                context_filter,
                this.years
            );
        }
    }

    /**
     * computed widget_options
     *  - Called on component|widget creation
     */
    private get_widget_options(): YearFilterWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: YearFilterWidgetOptionsVO = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as YearFilterWidgetOptionsVO;
                options = options ? new YearFilterWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    /**
     * Handle Select All Change
     */
    private handle_all_years_selected_change(is_all_years_selected: boolean): void {
        this.is_all_years_selected = is_all_years_selected;
    }

    /**
     * Handle Selected Month Change
     */
    private handle_selected_year_change(selected_years: { [year: number]: boolean }): void {
        this.selected_years = selected_years;
    }

    get vo_field_ref_label(): string {
        if ((!this.widget_options) || (!this.vo_field_ref)) {
            return null;
        }

        return this.get_flat_locale_translations[this.vo_field_ref.get_translatable_name_code_text(this.page_widget.id)];
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
        let options: YearFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
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

    get relative_to_this_filter(): YearFilterWidgetComponent {
        if (!this.widget_options.auto_select_year_relative_mode) {
            return null;
        }

        if (!this.widget_options.is_relative_to_other_filter) {
            return null;
        }

        if (!this.widget_options.relative_to_other_filter_id) {
            return null;
        }

        return this.get_page_widgets_components_by_pwid[this.widget_options.relative_to_other_filter_id] as YearFilterWidgetComponent;
    }

    get other_filter_selected_years(): { [year: string]: boolean } {
        if (!this.relative_to_this_filter) {
            return null;
        }

        let other_filter_selected_years = this.relative_to_this_filter.selected_years;
        if (!other_filter_selected_years) {
            return null;
        }

        return other_filter_selected_years;
    }

    get years(): string[] {
        let res: string[] = YearFilterWidgetManager.get_available_years_from_widget_options(
            this.widget_options,
        );

        return res;
    }
}
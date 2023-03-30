import { cloneDeep, isEqual } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Vue, Watch } from 'vue-property-decorator';
import ContextFilterHandler from '../../../../../../shared/modules/ContextFilter/ContextFilterHandler';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import NumRange from '../../../../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../../../../shared/modules/DataRender/vos/NumSegment';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import YearFilterWidgetOptions from './options/YearFilterWidgetOptions';
import './YearFilterWidgetComponent.scss';

@Component({
    template: require('./YearFilterWidgetComponent.pug'),
    components: {}
})
export default class YearFilterWidgetComponent extends VueComponentBase {

    @Prop({ default: null })
    public page_widget: DashboardPageWidgetVO;

    @ModuleDashboardPageAction
    protected set_page_widget_component_by_pwid: (param: { pwid: number, page_widget_component: VueComponentBase }) => void;

    @ModuleDashboardPageGetter
    private get_page_widgets_components_by_pwid: { [pwid: number]: VueComponentBase };

    @ModuleDashboardPageGetter
    private get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };
    @ModuleDashboardPageAction
    private set_active_field_filter: (param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) => void;
    @ModuleDashboardPageAction
    private remove_active_field_filter: (params: { vo_type: string, field_id: string }) => void;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    private selected_years: { [year: number]: boolean } = {};

    // Is All Years Selected Toggle Button
    // - Shall be highlight or true when selected_years empty
    // - Shall be false when selected_years has at least one selected
    private is_all_years_selected: boolean = false;
    private force_selected_years_reset: boolean = false;

    private auto_select_year: boolean = null;
    private auto_select_year_relative_mode: boolean = null;
    private auto_select_year_min: number = null;
    private auto_select_year_max: number = null;

    private old_widget_options: YearFilterWidgetOptions = null;
    private is_relative_to_other_filter: boolean = false;
    private relative_to_other_filter_id: number = null;

    protected async mounted() {
        this.set_page_widget_component_by_pwid({
            pwid: this.page_widget.id,
            page_widget_component: this
        });
    }

    /**
     * Handle toggle selected year
     *  - Called when we click on toggle year button
     * @param i index in selected year array
     */
    private handle_toggle_selected_year(i: string): void {
        Vue.set(this.selected_years, i, !this.selected_years[i]);

        if (!(Object.keys(this.selected_years)?.length > 0)) {
            // if there is no selected_years
            this.is_all_years_selected = true;
        } else {
            this.is_all_years_selected = false;
        }
    }

    /**
     * Handle Toggle Select All
     *  - Called when we click on toggle select all
     */
    private handle_toggle_select_all() {
        this.is_all_years_selected = !this.is_all_years_selected;

        if (this.is_all_years_selected) {
            // If is all years selected reset selected_years
            this.selected_years = {};
            this.force_selected_years_reset = true;
        }
    }

    get vo_field_ref_label(): string {
        if ((!this.widget_options) || (!this.vo_field_ref)) {
            return null;
        }

        return this.get_flat_locale_translations[this.vo_field_ref.get_translatable_name_code_text(this.page_widget.id)];
    }

    /**
     * computed widget_options
     *  - Called on component|widget creation
     */
    get widget_options(): YearFilterWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: YearFilterWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as YearFilterWidgetOptions;
                options = options ? new YearFilterWidgetOptions(
                    options.is_vo_field_ref,
                    options.vo_field_ref,
                    options.custom_filter_name,
                    options.year_relative_mode,
                    options.min_year,
                    options.max_year,
                    options.auto_select_year,
                    options.auto_select_year_relative_mode,
                    options.auto_select_year_min,
                    options.auto_select_year_max,
                    options.is_relative_to_other_filter,
                    options.relative_to_other_filter_id,
                    options.hide_filter,
                    options.can_select_all
                ) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    /**
     * Watch on widget_options
     *  - Shall happen first on component init (just after the computed widget_options)
     *  - Initialize the selected_years with default widget options
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

        let selected_years = {};

        let years = this.years;
        if (years && (!!years.length)) {
            for (let i in years) {
                let year = years[i];
                // if (this.selected_years[year]) {
                //     selected_years[year] = true;
                //     continue;
                // }

                if (this.widget_options.auto_select_year) {

                    if ((this.widget_options.auto_select_year_min == null) || (this.widget_options.auto_select_year_max == null)) {
                        continue;
                    }

                    if (this.widget_options.auto_select_year_relative_mode) {
                        let current_year = Dates.year(Dates.now());
                        let year_int = parseInt(year);
                        if ((year_int >= (current_year + this.widget_options.auto_select_year_min)) &&
                            (year_int <= (current_year + this.widget_options.auto_select_year_max))) {
                            selected_years[year] = true;
                            continue;
                        }
                    } else {
                        let year_int = parseInt(year);
                        if ((year_int >= this.widget_options.auto_select_year_min) &&
                            (year_int <= this.widget_options.auto_select_year_max)) {
                            selected_years[year] = true;
                            continue;
                        }
                    }
                }

                selected_years[year] = false;
            }
        }
        this.selected_years = selected_years;
    }

    /**
     * Get active field filters
     *  - Shall initialize the selected years by using context filter
     * @returns void
     */
    @Watch("get_active_field_filters", { immediate: true })
    private try_preload_selected_years(): void {

        // 1 on cherche le contextfilter correspondant à ce type de filtre
        let root_context_filter: ContextFilterVO = null;
        if (this.is_vo_field_ref) {
            if (!this.vo_field_ref) {
                return null;
            }
            root_context_filter = this.get_active_field_filters[this.vo_field_ref.api_type_id] ? this.get_active_field_filters[this.vo_field_ref.api_type_id][this.vo_field_ref.field_id] : null;
        } else {
            if (!this.custom_filter_name) {
                return null;
            }
            root_context_filter = this.get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE] ? this.get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][this.custom_filter_name] : null;
        }

        /**
         * Si on a un root_context_filter, on cherche celui qui est du type concerné
         */
        let context_filter: ContextFilterVO = null;
        if (!!root_context_filter) {
            context_filter = ContextFilterHandler.getInstance().find_context_filter_by_type(root_context_filter, ContextFilterVO.TYPE_DATE_YEAR);
        }

        // If no context filter that mean there is no initialization
        // - Then keep let all selected years with default values
        if (!context_filter) {
            return;
        }

        // On veut surtout pas changer si ya pas de changement à faire, donc on test la conf actuelle et on verra après
        let new_value: { [year: number]: boolean } = {};
        for (let i in this.years) {
            new_value[this.years[i]] = false;
        }
        RangeHandler.foreach_ranges_sync(context_filter.param_numranges, (year: number) => {
            new_value[year] = true;
        });

        for (let i in new_value) {
            if (new_value[i] != this.selected_years[i]) {
                this.selected_years = new_value;
                break;
            }
        }
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
        let root_context_filter: ContextFilterVO = null;
        if (this.is_vo_field_ref) {
            if (!this.vo_field_ref) {
                return null;
            }
            root_context_filter = this.get_active_field_filters[this.vo_field_ref.api_type_id] ? this.get_active_field_filters[this.vo_field_ref.api_type_id][this.vo_field_ref.field_id] : null;
        } else {
            if (!this.custom_filter_name) {
                return null;
            }
            root_context_filter = this.get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE] ? this.get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][this.custom_filter_name] : null;
        }

        let years_ranges: NumRange[] = [];
        for (let i in this.selected_years) {
            if (!this.selected_years[i]) {
                continue;
            }
            years_ranges.push(RangeHandler.create_single_elt_NumRange(parseInt(i.toString()), NumSegment.TYPE_INT));
        }
        years_ranges = RangeHandler.getRangesUnion(years_ranges);

        /**
         * Si on a un root_context_filter, on cherche celui qui est du type concerné
         */
        let context_filter: ContextFilterVO = null;
        if (!!root_context_filter) {
            context_filter = ContextFilterHandler.getInstance().find_context_filter_by_type(root_context_filter, ContextFilterVO.TYPE_DATE_YEAR);
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

            let new_root = ContextFilterHandler.getInstance().add_context_filter_to_tree(root_context_filter, context_filter);
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
            let new_root = ContextFilterHandler.getInstance().remove_context_filter_from_tree(root_context_filter, context_filter);
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

                let new_root = ContextFilterHandler.getInstance().add_context_filter_to_tree(root_context_filter, context_filter);

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
        let options: YearFilterWidgetOptions = this.widget_options;

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

    @Watch('other_filter_selected_years', { immediate: true, deep: true })
    private onchange_other_filter_selected_years() {
        if (!this.relative_to_this_filter) {
            return;
        }

        let selected_years = {};
        for (let year in this.other_filter_selected_years) {
            let year_int = parseInt(year);

            if (!this.other_filter_selected_years[year]) {
                continue;
            }

            for (let year_i = year_int + this.widget_options.auto_select_year_min; year_i <= year_int + this.widget_options.auto_select_year_max; year_i++) {
                selected_years[year_i] = true;
            }
        }
        this.selected_years = selected_years;
    }

    get years(): string[] {
        let res: string[] = [];

        if ((!this.widget_options) || (this.widget_options.min_year == null) || (this.widget_options.max_year == null)) {
            return [];
        }

        if ((this.widget_options.max_year - this.widget_options.min_year) > 15) {
            return [];
        }

        if (this.widget_options.year_relative_mode) {

            let current_year = Dates.year(Dates.now());
            for (let i = current_year + this.widget_options.min_year; i <= current_year + this.widget_options.max_year; i++) {
                res.push(i.toString());
            }
        } else {
            for (let i = this.widget_options.min_year; i <= this.widget_options.max_year; i++) {
                res.push(i.toString());
            }
        }

        return res;
    }
}
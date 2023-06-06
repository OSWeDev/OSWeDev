import { cloneDeep, isEqual } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Vue, Watch } from 'vue-property-decorator';
import ContextFilterVOHandler from '../../../../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import NumRange from '../../../../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../../../../shared/modules/DataRender/vos/NumSegment';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import './MonthFilterWidgetComponent.scss';
import MonthFilterWidgetOptions from './options/MonthFilterWidgetOptions';

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
    private old_widget_options: MonthFilterWidgetOptions = null;
    private is_relative_to_other_filter: boolean = false;
    private relative_to_other_filter_id: number = null;

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
     * @returns MonthFilterWidgetOptions
     */
    get widget_options(): MonthFilterWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: MonthFilterWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as MonthFilterWidgetOptions;
                options = options ? new MonthFilterWidgetOptions(
                    options.is_vo_field_ref,
                    options.vo_field_ref,
                    options.custom_filter_name,
                    options.month_relative_mode,
                    options.min_month,
                    options.max_month,
                    options.auto_select_month,
                    options.auto_select_month_relative_mode,
                    options.auto_select_month_min,
                    options.auto_select_month_max,
                    options.is_relative_to_other_filter,
                    options.relative_to_other_filter_id,
                    options.hide_filter,
                    options.can_select_all,
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
     *  - Initialize the selected_months with default widget options
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
            (this.auto_select_month == this.widget_options.auto_select_month) &&
            (this.auto_select_month_relative_mode == this.widget_options.auto_select_month_relative_mode) &&
            (this.auto_select_month_min == this.widget_options.auto_select_month_min) &&
            (this.auto_select_month_max == this.widget_options.auto_select_month_max) &&
            (this.is_relative_to_other_filter == this.widget_options.is_relative_to_other_filter) &&
            (this.relative_to_other_filter_id == this.widget_options.relative_to_other_filter_id)
        ) {
            return;
        }

        this.auto_select_month = this.widget_options.auto_select_month;
        this.auto_select_month_relative_mode = this.widget_options.auto_select_month_relative_mode;
        this.auto_select_month_min = this.widget_options.auto_select_month_min;
        this.auto_select_month_max = this.widget_options.auto_select_month_max;
        this.is_relative_to_other_filter = this.widget_options.is_relative_to_other_filter;
        this.relative_to_other_filter_id = this.widget_options.relative_to_other_filter_id;

        let selected_months = {};

        let months = this.months;
        if (months && (!!months.length)) {
            for (let i in months) {
                let month = months[i];
                // if (this.selected_months[month]) {
                //     selected_months[month] = true;
                //     continue;
                // }

                if (this.widget_options.auto_select_month) {

                    if ((this.widget_options.auto_select_month_min == null) || (this.widget_options.auto_select_month_max == null)) {
                        continue;
                    }

                    if (this.widget_options.auto_select_month_relative_mode) {
                        let current_month = Dates.month(Dates.now()) + 1;
                        let month_int = parseInt(month);
                        if ((month_int >= (current_month + this.widget_options.auto_select_month_min)) &&
                            (month_int <= (current_month + this.widget_options.auto_select_month_max))) {
                            selected_months[month] = true;
                            continue;
                        }
                    } else {
                        let month_int = parseInt(month);
                        if ((month_int >= this.widget_options.auto_select_month_min) &&
                            (month_int <= this.widget_options.auto_select_month_max)) {
                            selected_months[month] = true;
                            continue;
                        }
                    }
                }

                selected_months[month] = false;
            }
        }
        this.selected_months = selected_months;
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

    @Watch('other_filter_selected_months', { immediate: true, deep: true })
    private onchange_other_filter_selected_months() {
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
     * @returns void
     */
    @Watch("get_active_field_filters", { immediate: true })
    private try_preload_selected_months(): void {

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
            context_filter = ContextFilterVOHandler.getInstance().find_context_filter_by_type(root_context_filter, ContextFilterVO.TYPE_DATE_MONTH);
        }

        // If no context filter that mean there is no initialization
        // - Then keep let all selected months with default values
        if (!context_filter) {
            return;
        }

        // On veut surtout pas changer si ya pas de changement à faire, donc on test la conf actuelle et on verra après
        let new_value: { [month: number]: boolean } = {};
        for (let i in this.months) {
            new_value[this.months[i]] = false;
        }
        RangeHandler.foreach_ranges_sync(context_filter.param_numranges, (month: number) => {
            new_value[month] = true;
        });

        for (let i in new_value) {
            if (new_value[i] != this.selected_months[i]) {
                this.selected_months = new_value;
                break;
            }
        }
    }

    /**
     * Watch on selected_months
     *  - Called each time the selected_months changes
     *  - This (re)initialize the context store on each call
     * @returns void
     */
    @Watch('selected_months', { immediate: true, deep: true })
    private onchange_selected_months(): void {
        // 1 on cherche le contextfilter correspondant à ce type de filtre
        let root_context_filter: ContextFilterVO = null;
        if (this.is_vo_field_ref) {
            if (!this.vo_field_ref) {
                return null;
            }
            root_context_filter = this.get_active_field_filters[this.vo_field_ref.api_type_id] ?
                this.get_active_field_filters[this.vo_field_ref.api_type_id][this.vo_field_ref.field_id] :
                null;
        } else {
            if (!this.custom_filter_name) {
                return null;
            }
            root_context_filter = this.get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE] ?
                this.get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][this.custom_filter_name] :
                null;
        }

        // (on initialization) if context exist and selected_months exist overwrite months_range
        let months_ranges: NumRange[] = [];
        for (let i in this.selected_months) {
            if (!this.selected_months[i]) {
                continue;
            }
            months_ranges.push(RangeHandler.create_single_elt_NumRange(parseInt(i.toString()), NumSegment.TYPE_INT));
        }
        months_ranges = RangeHandler.getRangesUnion(months_ranges);

        /**
         * Si on a un root_context_filter, on cherche celui qui est du type concerné
         */
        let context_filter: ContextFilterVO = null;
        if (!!root_context_filter) {
            context_filter = ContextFilterVOHandler.getInstance().find_context_filter_by_type(root_context_filter, ContextFilterVO.TYPE_DATE_MONTH);
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
        let options: MonthFilterWidgetOptions = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
    }

    get months(): string[] {
        let res: string[] = [];

        if ((!this.widget_options) || (this.widget_options.min_month == null) || (this.widget_options.max_month == null)) {
            return [];
        }

        if ((this.widget_options.max_month - this.widget_options.min_month) > 12) {
            return [];
        }

        if (this.widget_options.month_relative_mode) {

            let current_month = Dates.month(Dates.now()) + 1;
            for (let i = current_month + this.widget_options.min_month; i <= current_month + this.widget_options.max_month; i++) {
                res.push(i.toString());
            }
        } else {
            for (let i = this.widget_options.min_month; i <= this.widget_options.max_month; i++) {
                res.push(i.toString());
            }
        }
        return res;
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
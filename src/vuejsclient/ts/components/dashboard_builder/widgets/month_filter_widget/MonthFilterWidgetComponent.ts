import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterHandler from '../../../../../../shared/modules/ContextFilter/ContextFilterHandler';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import NumRange from '../../../../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../../../../shared/modules/DataRender/vos/NumSegment';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import './MonthFilterWidgetComponent.scss';
import MonthFilterWidgetOptions from './options/MonthFilterWidgetOptions';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';

@Component({
    template: require('./MonthFilterWidgetComponent.pug'),
    components: {}
})
export default class MonthFilterWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };
    @ModuleDashboardPageAction
    private set_active_field_filter: (active_field_filter: ContextFilterVO) => void;
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

    private selected_months: { [month: number]: boolean } = {};

    private auto_select_month: boolean = null;
    private auto_select_month_relative_mode: boolean = null;
    private auto_select_month_min: number = null;
    private auto_select_month_max: number = null;

    private switch_selection(i: string) {
        this.selected_months[i] = !this.selected_months[i];
    }

    get vo_field_ref_label(): string {
        if ((!this.widget_options) || (!this.vo_field_ref)) {
            return null;
        }

        return this.get_flat_locale_translations[this.vo_field_ref.translatable_name_code_text];
    }

    @Watch('selected_months', { deep: true })
    private onchange_selected_months() {
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

        let months_ranges: NumRange[] = [];
        for (let i in this.selected_months) {
            if (!this.selected_months[i]) {
                continue;
            }
            months_ranges.push(RangeHandler.getInstance().create_single_elt_NumRange(parseInt(i.toString()), NumSegment.TYPE_INT));
        }
        months_ranges = RangeHandler.getInstance().getRangesUnion(months_ranges);

        /**
         * Si on a un root_context_filter, on cherche celui qui est du type concerné
         */
        let context_filter: ContextFilterVO = null;
        if (!!root_context_filter) {
            context_filter = ContextFilterHandler.getInstance().find_context_filter_by_type(root_context_filter, ContextFilterVO.TYPE_DATE_MONTH);
        }

        /**
         * Si on a pas de contextfilter actuellement et qu'on a pas besoin d'en avoir, inutile de continuer
         */
        if ((!context_filter) && ((!months_ranges) || (!months_ranges.length))) {
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

            let new_root = ContextFilterHandler.getInstance().add_context_filter_to_tree(root_context_filter, context_filter);
            if (new_root != root_context_filter) {
                if (!new_root) {
                    this.remove_active_field_filter({
                        field_id: this.is_vo_field_ref ? this.vo_field_ref.field_id : this.custom_filter_name,
                        vo_type: this.is_vo_field_ref ? this.vo_field_ref.api_type_id : ContextFilterVO.CUSTOM_FILTERS_TYPE,
                    });
                } else {
                    this.set_active_field_filter(new_root);
                }
            }
            return;
        }

        /**
         * Si on a un contextfilter et qu'on en a plus besoin on le supprime
         */
        if ((!!context_filter) && ((!months_ranges) || (!months_ranges.length))) {
            let new_root = ContextFilterHandler.getInstance().remove_context_filter_from_tree(root_context_filter, context_filter);
            if (new_root != root_context_filter) {
                if (!new_root) {
                    this.remove_active_field_filter({
                        field_id: this.is_vo_field_ref ? this.vo_field_ref.field_id : this.custom_filter_name,
                        vo_type: this.is_vo_field_ref ? this.vo_field_ref.api_type_id : ContextFilterVO.CUSTOM_FILTERS_TYPE,
                    });
                } else {
                    this.set_active_field_filter(new_root);
                }
            }
            return;
        }

        /**
         * Si on a un contextfilter, on check si on doit faire un update et si c'est nécessaire on le fait
         */
        if (!!context_filter) {
            if (!RangeHandler.getInstance().are_same(context_filter.param_numranges, months_ranges)) {
                context_filter.param_numranges = months_ranges;
            }
            return;
        }
    }

    @Watch("get_active_field_filters", { immediate: true })
    private try_preload_selected_months() {

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
            context_filter = ContextFilterHandler.getInstance().find_context_filter_by_type(root_context_filter, ContextFilterVO.TYPE_DATE_MONTH);
        }

        // si ya pas de root ou de context_filter, on a pas de filtre en cours
        if (!context_filter) {
            for (let i in this.selected_months) {
                if (!!this.selected_months[i]) {
                    this.selected_months[i] = false;
                }
            }
            return;
        }

        // On veut surtout pas changer si ya pas de changement à faire, donc on test la conf actuelle et on verra après
        let new_value: { [month: number]: boolean } = {};
        for (let i in this.months) {
            new_value[this.months[i]] = false;
        }
        RangeHandler.getInstance().foreach_ranges_sync(context_filter.param_numranges, (month: number) => {
            new_value[month] = true;
        });

        for (let i in new_value) {
            if (new_value[i] != this.selected_months[i]) {
                this.selected_months = new_value;
                break;
            }
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

    get widget_options() {
        if (!this.page_widget) {
            return null;
        }

        let options: MonthFilterWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as MonthFilterWidgetOptions;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return options;
    }

    @Watch('widget_options', { immediate: true })
    private onchange_widget_options() {

        /**
         * Si on change la conf de auto_select on veut réinit le filtre (on est en modif donc et on vient de changer la conf on veut voir l'impact)
         *  sinon on veut surtout pas changer la sélection actuelle
         */
        if (
            (this.auto_select_month == this.widget_options.auto_select_month) &&
            (this.auto_select_month_relative_mode == this.widget_options.auto_select_month_relative_mode) &&
            (this.auto_select_month_min == this.widget_options.auto_select_month_min) &&
            (this.auto_select_month_max == this.widget_options.auto_select_month_max)
        ) {
            return;
        }

        this.auto_select_month = this.widget_options.auto_select_month;
        this.auto_select_month_relative_mode = this.widget_options.auto_select_month_relative_mode;
        this.auto_select_month_min = this.widget_options.auto_select_month_min;
        this.auto_select_month_max = this.widget_options.auto_select_month_max;

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
}
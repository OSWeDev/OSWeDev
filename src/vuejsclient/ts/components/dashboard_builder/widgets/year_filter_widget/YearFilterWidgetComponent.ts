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
import './YearFilterWidgetComponent.scss';
import YearFilterWidgetOptions from './options/YearFilterWidgetOptions';

@Component({
    template: require('./YearFilterWidgetComponent.pug'),
    components: {}
})
export default class YearFilterWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };
    @ModuleDashboardPageAction
    private set_active_field_filter: (active_field_filter: ContextFilterVO) => void;
    @ModuleDashboardPageAction
    private remove_active_field_filter: (params: { vo_type: string, field_id: string }) => void;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private selected_years: { [year: number]: boolean } = {};

    private switch_selection(i: string) {
        this.selected_years[i] = !this.selected_years[i];
    }

    @Watch('selected_years', { deep: true })
    private onchange_selected_years() {
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
            years_ranges.push(RangeHandler.getInstance().create_single_elt_NumRange(parseInt(i.toString()) + 1, NumSegment.TYPE_INT));
        }
        years_ranges = RangeHandler.getInstance().getRangesUnion(years_ranges);

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
        if ((!context_filter) && ((!years_ranges) || (!years_ranges.length))) {
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
                    this.set_active_field_filter(new_root);
                }
            }
            return;
        }

        /**
         * Si on a un contextfilter et qu'on en a plus besoin on le supprime
         */
        if ((!!context_filter) && ((!years_ranges) || (!years_ranges.length))) {
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
            if (!RangeHandler.getInstance().are_same(context_filter.param_numranges, years_ranges)) {
                context_filter.param_numranges = years_ranges;
            }
            return;
        }
    }

    @Watch("get_active_field_filters", { immediate: true })
    private try_preload_selected_years() {

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

        // si ya pas de root ou de context_filter, on a pas de filtre en cours
        if (!context_filter) {
            for (let i in this.selected_years) {
                if (!!this.selected_years[i]) {
                    this.selected_years[i] = false;
                }
            }
            return;
        }

        // On veut surtout pas changer si ya pas de changement à faire, donc on test la conf actuelle et on verra après
        let need_switch: { [year: number]: boolean } = Object.assign({}, this.selected_years);
        RangeHandler.getInstance().foreach_ranges_sync(context_filter.param_numranges, (isoyear: number) => {

            if (!need_switch[isoyear - 1]) {
                need_switch[isoyear - 1] = true;
            }
        });

        if (Object.values(need_switch).indexOf(true) >= 0) {
            this.selected_years = need_switch;
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

    get widget_options() {
        if (!this.page_widget) {
            return null;
        }

        let options: YearFilterWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as YearFilterWidgetOptions;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return options;
    }

    @Watch('widget_options', { immediate: true })
    private onchange_widget_options() {
        let selected_years = {};

        let years = this.years;
        if ((!years) || (!years.length)) {
            for (let i in years) {
                let year = years[i];
                if (this.selected_years[year]) {
                    selected_years[year] = true;
                    continue;
                }

                selected_years[year] = false;
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

        for (let i = this.widget_options.min_year; i <= this.widget_options.max_year; i++) {
            res.push(i.toString());
        }
        return res;
    }
}
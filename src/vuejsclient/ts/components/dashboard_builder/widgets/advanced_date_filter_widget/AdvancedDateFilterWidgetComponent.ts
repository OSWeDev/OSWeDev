import { cloneDeep, isEqual } from 'lodash';
import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import ContextFilterVOHandler from '../../../../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ModuleTableController from '../../../../../../shared/modules/DAO/ModuleTableController';
import SimpleDatatableFieldVO from '../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
import AdvancedDateFilterOptDescVO from '../../../../../../shared/modules/DashboardBuilder/vos/AdvancedDateFilterOptDescVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import TimeSegment from '../../../../../../shared/modules/DataRender/vos/TimeSegment';
import TSRange from '../../../../../../shared/modules/DataRender/vos/TSRange';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import { reflect } from '../../../../../../shared/tools/ObjectHandler';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import TSRangeInputComponent from '../../../tsrangeinput/TSRangeInputComponent';
import TSRangesInputComponent from '../../../tsrangesinput/TSRangesInputComponent';
import VueComponentBase from '../../../VueComponentBase';
import ResetFiltersWidgetController from '../reset_filters_widget/ResetFiltersWidgetController';
import './AdvancedDateFilterWidgetComponent.scss';
import AdvancedDateFilterWidgetOptions from './options/AdvancedDateFilterWidgetOptions';

@Component({
    template: require('./AdvancedDateFilterWidgetComponent.pug'),
    components: {
        Tsrangeinputcomponent: TSRangeInputComponent,
        Tsrangesinputcomponent: TSRangesInputComponent,
    }
})
export default class AdvancedDateFilterWidgetComponent extends VueComponentBase {

    @Inject('storeNamespace') readonly storeNamespace!: string;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private tmp_filter_active_opt: AdvancedDateFilterOptDescVO = null;
    private tmp_ts_range: TSRange = null;
    private tmp_ts_ranges: TSRange[] = [];
    private old_widget_options: AdvancedDateFilterWidgetOptions = null;

    get get_active_field_filters(): FieldFiltersVO {
        return this.vuexGet<FieldFiltersVO>(reflect<this>().get_active_field_filters);
    }
    get get_page_widgets_components_by_pwid(): { [pwid: number]: VueComponentBase } {
        return this.vuexGet<{ [pwid: number]: VueComponentBase }>(reflect<this>().get_page_widgets_components_by_pwid);
    }

    get is_auto_selectable_choice() {
        return (this.opts && (this.opts.length == 1) && (this.opts[0].search_type == AdvancedDateFilterOptDescVO.SEARCH_TYPE_CUSTOM));
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

    get widget_options() {
        if (!this.page_widget) {
            return null;
        }

        let options: AdvancedDateFilterWidgetOptions = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as AdvancedDateFilterWidgetOptions;
                options = options ? new AdvancedDateFilterWidgetOptions(
                    options.is_vo_field_ref == null ? true : options.is_vo_field_ref,
                    options.vo_field_ref,
                    options.custom_filter_name,
                    options.opts,
                    options.is_checkbox,
                    options.default_value,
                    options.hide_opts,
                    options.refuse_left_open,
                    options.refuse_right_open,
                    options.is_relative_to_other_filter,
                    options.relative_to_other_filter_id,
                    options.hide_filter,
                    options.is_relative_to_today,
                    options.auto_select_relative_date_min,
                    options.auto_select_relative_date_max,
                ) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    get vo_field_ref(): VOFieldRefVO {
        const options: AdvancedDateFilterWidgetOptions = this.widget_options;

        if ((!options) || (!options.vo_field_ref) || (!options.is_vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
    }

    get opts(): AdvancedDateFilterOptDescVO[] {
        const options: AdvancedDateFilterWidgetOptions = this.widget_options;

        if ((!options) || (!options.opts) || (!options.opts.length)) {
            return null;
        }

        const res: AdvancedDateFilterOptDescVO[] = [];

        for (const i in options.opts) {
            res.push(Object.assign(new AdvancedDateFilterOptDescVO(), options.opts[i]));
        }

        res.sort((a: AdvancedDateFilterOptDescVO, b: AdvancedDateFilterOptDescVO) => {
            if (a.weight < b.weight) {
                return -1;
            }
            if (a.weight > b.weight) {
                return 1;
            }
            return 0;
        });

        return res;
    }

    get is_checkbox(): boolean {
        const options: AdvancedDateFilterWidgetOptions = this.widget_options;

        return options.is_checkbox;
    }

    get hide_opts(): boolean {
        const options: AdvancedDateFilterWidgetOptions = this.widget_options;

        return options.hide_opts;
    }

    get default_value(): AdvancedDateFilterOptDescVO {
        const options: AdvancedDateFilterWidgetOptions = this.widget_options;

        return options.default_value;
    }

    get is_type_custom(): boolean {
        return this.tmp_filter_active_opt ? (this.tmp_filter_active_opt.search_type == AdvancedDateFilterOptDescVO.SEARCH_TYPE_CUSTOM) : false;
    }

    get field_date(): SimpleDatatableFieldVO<any, any> {
        if (!this.vo_field_ref) {
            return null;
        }
        return SimpleDatatableFieldVO.createNew(this.vo_field_ref.field_id).setModuleTable(ModuleTableController.module_tables_by_vo_type[this.vo_field_ref.api_type_id]);
    }

    get base_filter(): string {
        return 'filter_opt_' + this.page_widget.id + '_';
    }

    get relative_to_this_filter(): AdvancedDateFilterWidgetComponent {

        if (!this.widget_options.is_relative_to_other_filter) {
            return null;
        }

        if (!this.widget_options.relative_to_other_filter_id) {
            return null;
        }

        return this.get_page_widgets_components_by_pwid[this.widget_options.relative_to_other_filter_id] as AdvancedDateFilterWidgetComponent;
    }

    get other_filter_tmp_ts_range(): TSRange {
        if (!this.relative_to_this_filter) {
            return null;
        }

        const tmp_ts_range = this.relative_to_this_filter.tmp_ts_range;
        if (!tmp_ts_range) {
            return null;
        }

        return tmp_ts_range;
    }

    get other_filter_tmp_ts_ranges(): TSRange[] {
        if (!this.relative_to_this_filter) {
            return null;
        }

        const tmp_ts_ranges = this.relative_to_this_filter.tmp_ts_ranges;
        if (!tmp_ts_ranges) {
            return null;
        }

        return tmp_ts_ranges;
    }

    get is_type_quarter(): boolean {
        return this.tmp_filter_active_opt?.segmentation_type == TimeSegment.TYPE_QUARTER;
    }

    @Watch('widget_options', { immediate: true })
    private onchange_widget_options() {
        if (this.old_widget_options) {
            if (isEqual(this.widget_options, this.old_widget_options)) {
                return;
            }
        }

        this.old_widget_options = cloneDeep(this.widget_options);

        this.tmp_filter_active_opt = this.widget_options.default_value;

        // Si on a qu'un seul choix possible, et que ce n'est pas le choix qui change la date (is_type_custom par exemple qui ne fait qu'afficher un input), on le sélectionne
        if ((!this.widget_options.default_value) && this.is_auto_selectable_choice) {
            this.tmp_filter_active_opt = this.opts[0];
        } else if (this.widget_options.default_value) {
            this.tmp_filter_active_opt = this.widget_options.default_value;
        } else {
            this.tmp_filter_active_opt = null;
        }

        if (this.widget_options.is_relative_to_today) {
            if (
                (this.widget_options.auto_select_relative_date_min != null) &&
                (this.widget_options.auto_select_relative_date_max != null) &&
                this.tmp_filter_active_opt
            ) {
                const now = Dates.now();

                this.tmp_ts_range = RangeHandler.createNew(
                    TSRange.RANGE_TYPE,
                    Dates.add(now, this.widget_options.auto_select_relative_date_min, this.tmp_filter_active_opt.segmentation_type),
                    Dates.add(now, this.widget_options.auto_select_relative_date_max, this.tmp_filter_active_opt.segmentation_type),
                    true,
                    true,
                    this.tmp_filter_active_opt.segmentation_type
                );

                this.tmp_ts_ranges = [this.tmp_ts_range];
            }
        } else {
            this.tmp_ts_range = null;
            this.tmp_ts_ranges = [];
        }
    }

    @Watch('tmp_ts_range', { immediate: true })
    @Watch('tmp_ts_ranges', { immediate: true })
    @Watch('tmp_filter_active_opt')
    private onchange_selected_months() {
        if (!this.tmp_filter_active_opt && !this.tmp_ts_range && !this.tmp_ts_ranges?.length) {
            return;
        }

        if (!this.check_value_tsrange() || !this.check_value_tsranges()) {
            return;
        }

        // 1 on cherche le contextfilter correspondant à ce type de filtre
        const root_context_filter: ContextFilterVO = this.vo_field_ref ?
            (this.get_active_field_filters[this.vo_field_ref.api_type_id] ? this.get_active_field_filters[this.vo_field_ref.api_type_id][this.vo_field_ref.field_id] : null) :
            (this.get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE] ? this.get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][this.custom_filter_name] : null);

        /**
         * Si on a un root_context_filter, on cherche celui qui est du type concerné
         */
        let context_filter: ContextFilterVO = null;
        if (root_context_filter) {
            context_filter = ContextFilterVOHandler.find_context_filter_by_type(root_context_filter, ContextFilterVO.TYPE_DATE_INTERSECTS);
        }

        let ts_ranges: TSRange[] = null;

        if (this.tmp_filter_active_opt) {
            switch (this.tmp_filter_active_opt.search_type) {
                case AdvancedDateFilterOptDescVO.SEARCH_TYPE_LAST:
                    if ((this.tmp_filter_active_opt.value == null) || (this.tmp_filter_active_opt.segmentation_type == null)) {
                        break;
                    }

                    let start_date: number = null;
                    let end_date: number = null;
                    const now: number = Dates.now();

                    if (this.tmp_filter_active_opt.value < 0) {
                        start_date = Dates.add(now, this.tmp_filter_active_opt.value, this.tmp_filter_active_opt.segmentation_type);
                        end_date = now;
                    } else {
                        start_date = now;
                        end_date = Dates.add(now, this.tmp_filter_active_opt.value, this.tmp_filter_active_opt.segmentation_type);
                    }

                    ts_ranges = [RangeHandler.createNew(
                        TSRange.RANGE_TYPE,
                        start_date,
                        end_date,
                        true,
                        true,
                        this.tmp_filter_active_opt.segmentation_type
                    )];
                    break;
                case AdvancedDateFilterOptDescVO.SEARCH_TYPE_YTD:
                    if ((this.tmp_filter_active_opt.value == null) || (this.tmp_filter_active_opt.segmentation_type == null)) {
                        break;
                    }

                    const now_ytd: number = Dates.now();
                    const end_ytd_date: number = Dates.add(now_ytd, this.tmp_filter_active_opt.value, this.tmp_filter_active_opt.segmentation_type);
                    const start_ytd_date: number = Dates.startOf(end_ytd_date, TimeSegment.TYPE_YEAR);

                    ts_ranges = [RangeHandler.createNew(
                        TSRange.RANGE_TYPE,
                        start_ytd_date,
                        end_ytd_date,
                        true,
                        true,
                        this.tmp_filter_active_opt.segmentation_type
                    )];
                    break;
                case AdvancedDateFilterOptDescVO.SEARCH_TYPE_CALENDAR:
                    ts_ranges = [this.tmp_filter_active_opt.ts_range];
                    break;
                case AdvancedDateFilterOptDescVO.SEARCH_TYPE_CUSTOM:
                    if (this.is_type_quarter) {
                        ts_ranges = this.tmp_ts_ranges;
                    } else if (this.tmp_ts_range) {
                        ts_ranges = [this.tmp_ts_range];
                    }
                    break;
            }
        }

        /**
         * Si on a pas de contextfilter actuellement et qu'on a pas besoin d'en avoir, inutile de continuer
         */
        if ((!context_filter) && (!ts_ranges?.length)) {
            return;
        }

        /**
         * Si on a pas de contextfilter pour le moment mais qu'il en faut un, on le crée
         */
        if (!context_filter) {
            context_filter = new ContextFilterVO();
            context_filter.filter_type = ContextFilterVO.TYPE_DATE_INTERSECTS;
            context_filter.param_tsranges = ts_ranges;

            if (this.is_vo_field_ref) {
                context_filter.vo_type = this.vo_field_ref.api_type_id;
                context_filter.field_name = this.vo_field_ref.field_id;
            } else {
                context_filter.vo_type = ContextFilterVO.CUSTOM_FILTERS_TYPE;
                context_filter.field_name = this.custom_filter_name;
            }

            const new_root = ContextFilterVOHandler.add_context_filter_to_tree(root_context_filter, context_filter);
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
        if ((!!context_filter) && (!ts_ranges?.length)) {
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
            if (!RangeHandler.are_same(context_filter.param_tsranges, ts_ranges)) {
                context_filter.param_tsranges = ts_ranges;

                const new_root = ContextFilterVOHandler.add_context_filter_to_tree(root_context_filter, context_filter);

                this.set_active_field_filter({
                    field_id: this.is_vo_field_ref ? this.vo_field_ref.field_id : this.custom_filter_name,
                    vo_type: this.is_vo_field_ref ? this.vo_field_ref.api_type_id : ContextFilterVO.CUSTOM_FILTERS_TYPE,
                    active_field_filter: new_root,
                });
            }
            return;
        }
    }

    @Watch('other_filter_tmp_ts_range', { immediate: true, deep: true })
    private onchange_other_filter_tmp_ts_range() {
        if (!this.relative_to_this_filter) {
            return;
        }

        this.tmp_ts_range = cloneDeep(this.other_filter_tmp_ts_range);
    }

    @Watch('other_filter_tmp_ts_ranges', { immediate: true, deep: true })
    private onchange_other_filter_tmp_ts_ranges() {
        if (!this.relative_to_this_filter) {
            return;
        }

        this.tmp_ts_ranges = cloneDeep(this.other_filter_tmp_ts_ranges);
    }

    // Accès dynamiques Vuex
    public vuexGet<T>(getter: string): T {
        return (this.$store.getters as any)[`${this.storeNamespace}/${getter}`];
    }
    public vuexAct<A>(action: string, payload?: A) {
        return this.$store.dispatch(`${this.storeNamespace}/${action}`, payload);
    }

    public set_active_field_filter(param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) {
        return this.vuexAct(reflect<this>().set_active_field_filter, param);
    }

    public remove_active_field_filter(params: { vo_type: string, field_id: string }) {
        return this.vuexAct(reflect<this>().set_active_field_filter, params);
    }

    public set_page_widget_component_by_pwid(param: { pwid: number, page_widget_component: VueComponentBase }) {
        return this.vuexAct(reflect<this>().set_active_field_filter, param);
    }

    public clear_active_field_filters() {
        return this.vuexAct(reflect<this>().set_active_field_filter);
    }



    private async mounted() {
        ResetFiltersWidgetController.getInstance().register_reseter(
            this.dashboard_page,
            this.page_widget,
            this.reset_visible_options.bind(this),
        );
        this.set_page_widget_component_by_pwid({
            pwid: this.page_widget.id,
            page_widget_component: this
        });
    }

    private async reset_visible_options() {
        // Reset des checkbox
        if (this.tmp_filter_active_opt) {
            const old_id: number = this.tmp_filter_active_opt.id;

            // On simule le click pour décocher le input
            $('#' + this.base_filter + old_id.toString()).click();
        }

        this.tmp_ts_range = null;
        this.tmp_ts_ranges = [];
    }

    private onchange_filter_opt_input(input: any, opt: AdvancedDateFilterOptDescVO) {
        // Si j'ai rien, j'affecte
        if (!this.tmp_filter_active_opt) {
            this.tmp_filter_active_opt = opt;
            return;
        }

        // Si on essaye de sélectionner le même, on sort
        if ((this.tmp_filter_active_opt.id == opt.id) && input.checked) {
            return;
        }

        // Si on décoche le filtre actif, on vide
        if ((this.tmp_filter_active_opt.id == opt.id) && !input.checked) {
            this.tmp_filter_active_opt = null;
            return;
        }

        // Si on décoche un autre filtre, on sort
        if (!input.checked) {
            return;
        }

        // On affecte en décochant l'autre

        const old_id: number = this.tmp_filter_active_opt.id;

        this.tmp_filter_active_opt = opt;

        // On simule le click pour décocher le input
        $('#' + this.base_filter + old_id.toString()).click();
    }

    private check_value_tsrange(): boolean {
        if (!this.tmp_ts_range) {
            return true;
        }

        if (this.widget_options?.refuse_left_open && RangeHandler.is_left_open(this.tmp_ts_range)) {
            return false;
        }

        if (this.widget_options?.refuse_right_open && RangeHandler.is_right_open(this.tmp_ts_range)) {
            return false;
        }

        return true;
    }

    private check_value_tsranges(): boolean {
        if (!this.tmp_ts_ranges?.length) {
            return true;
        }

        if (this.widget_options?.refuse_left_open) {
            for (let i in this.tmp_ts_ranges) {
                if (RangeHandler.is_left_open(this.tmp_ts_ranges[i])) {
                    return false;
                }
            }
        }

        if (this.widget_options?.refuse_right_open) {
            for (let i in this.tmp_ts_ranges) {
                if (RangeHandler.is_right_open(this.tmp_ts_ranges[i])) {
                    return false;
                }
            }
        }

        return true;
    }
}
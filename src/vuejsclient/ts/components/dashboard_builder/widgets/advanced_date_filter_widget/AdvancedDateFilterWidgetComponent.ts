import { cloneDeep, isEqual } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterVOHandler from '../../../../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import SimpleDatatableFieldVO from '../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
import AdvancedDateFilterOptDescVO from '../../../../../../shared/modules/DashboardBuilder/vos/AdvancedDateFilterOptDescVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import TimeSegment from '../../../../../../shared/modules/DataRender/vos/TimeSegment';
import TSRange from '../../../../../../shared/modules/DataRender/vos/TSRange';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import VOsTypesManager from '../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import TSRangeInputComponent from '../../../tsrangeinput/TSRangeInputComponent';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import ResetFiltersWidgetController from '../reset_filters_widget/ResetFiltersWidgetController';
import './AdvancedDateFilterWidgetComponent.scss';
import AdvancedDateFilterWidgetOptions from './options/AdvancedDateFilterWidgetOptions';

@Component({
    template: require('./AdvancedDateFilterWidgetComponent.pug'),
    components: {
        Tsrangeinputcomponent: TSRangeInputComponent
    }
})
export default class AdvancedDateFilterWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };
    @ModuleDashboardPageAction
    private set_active_field_filter: (param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) => void;
    @ModuleDashboardPageAction
    private remove_active_field_filter: (params: { vo_type: string, field_id: string }) => void;
    @ModuleDashboardPageAction
    private clear_active_field_filters: () => void;

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
    private old_widget_options: AdvancedDateFilterWidgetOptions = null;

    private async mounted() {
        ResetFiltersWidgetController.getInstance().register_reseter(
            this.dashboard_page,
            this.page_widget,
            this.reset_visible_options.bind(this),
        );
    }

    @Watch('widget_options', { immediate: true })
    private onchange_widget_options() {
        if (!!this.old_widget_options) {
            if (isEqual(this.widget_options, this.old_widget_options)) {
                return;
            }
        }

        this.old_widget_options = cloneDeep(this.widget_options);

        this.tmp_filter_active_opt = null;
        this.tmp_ts_range = null;
    }

    @Watch('tmp_ts_range')
    @Watch('tmp_filter_active_opt')
    private onchange_selected_months() {

        // 1 on cherche le contextfilter correspondant à ce type de filtre
        let root_context_filter: ContextFilterVO = this.vo_field_ref ?
            (this.get_active_field_filters[this.vo_field_ref.api_type_id] ? this.get_active_field_filters[this.vo_field_ref.api_type_id][this.vo_field_ref.field_id] : null) :
            (this.get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE] ? this.get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][this.custom_filter_name] : null);

        /**
         * Si on a un root_context_filter, on cherche celui qui est du type concerné
         */
        let context_filter: ContextFilterVO = null;
        if (!!root_context_filter) {
            context_filter = ContextFilterVOHandler.find_context_filter_by_type(root_context_filter, ContextFilterVO.TYPE_DATE_INTERSECTS);
        }

        let ts_range: TSRange = null;

        if (this.tmp_filter_active_opt) {
            switch (this.tmp_filter_active_opt.search_type) {
                case AdvancedDateFilterOptDescVO.SEARCH_TYPE_LAST:
                    if ((this.tmp_filter_active_opt.value == null) || (this.tmp_filter_active_opt.segmentation_type == null)) {
                        break;
                    }

                    let start_date: number = null;
                    let end_date: number = null;
                    let now: number = Dates.now();

                    if (this.tmp_filter_active_opt.value < 0) {
                        start_date = Dates.add(now, this.tmp_filter_active_opt.value, this.tmp_filter_active_opt.segmentation_type);
                        end_date = now;
                    } else {
                        start_date = now;
                        end_date = Dates.add(now, this.tmp_filter_active_opt.value, this.tmp_filter_active_opt.segmentation_type);
                    }

                    ts_range = RangeHandler.createNew(
                        TSRange.RANGE_TYPE,
                        start_date,
                        end_date,
                        true,
                        true,
                        this.tmp_filter_active_opt.segmentation_type
                    );
                    break;
                case AdvancedDateFilterOptDescVO.SEARCH_TYPE_YTD:
                    if ((this.tmp_filter_active_opt.value == null) || (this.tmp_filter_active_opt.segmentation_type == null)) {
                        break;
                    }

                    let now_ytd: number = Dates.now();
                    let end_ytd_date: number = Dates.add(now_ytd, this.tmp_filter_active_opt.value, this.tmp_filter_active_opt.segmentation_type);
                    let start_ytd_date: number = Dates.startOf(end_ytd_date, TimeSegment.TYPE_YEAR);

                    ts_range = RangeHandler.createNew(
                        TSRange.RANGE_TYPE,
                        start_ytd_date,
                        end_ytd_date,
                        true,
                        true,
                        this.tmp_filter_active_opt.segmentation_type
                    );
                    break;
                case AdvancedDateFilterOptDescVO.SEARCH_TYPE_CALENDAR:
                    ts_range = this.tmp_filter_active_opt.ts_range;
                    break;
                case AdvancedDateFilterOptDescVO.SEARCH_TYPE_CUSTOM:
                    ts_range = this.tmp_ts_range;
                    break;
            }
        }

        /**
         * Si on a pas de contextfilter actuellement et qu'on a pas besoin d'en avoir, inutile de continuer
         */
        if ((!context_filter) && (!ts_range)) {
            return;
        }

        /**
         * Si on a pas de contextfilter pour le moment mais qu'il en faut un, on le crée
         */
        if (!context_filter) {
            context_filter = new ContextFilterVO();
            context_filter.filter_type = ContextFilterVO.TYPE_DATE_INTERSECTS;
            context_filter.param_tsranges = [ts_range];

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
        if ((!!context_filter) && (!ts_range)) {
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
            if (!RangeHandler.are_same(context_filter.param_tsranges, [ts_range])) {
                context_filter.param_tsranges = [ts_range];

                let new_root = ContextFilterVOHandler.add_context_filter_to_tree(root_context_filter, context_filter);

                this.set_active_field_filter({
                    field_id: this.is_vo_field_ref ? this.vo_field_ref.field_id : this.custom_filter_name,
                    vo_type: this.is_vo_field_ref ? this.vo_field_ref.api_type_id : ContextFilterVO.CUSTOM_FILTERS_TYPE,
                    active_field_filter: new_root,
                });
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

    private async reset_visible_options() {
        // Reset des checkbox
        if (this.tmp_filter_active_opt) {
            let old_id: number = this.tmp_filter_active_opt.id;

            // On simule le click pour décocher le input
            $('#' + this.base_filter + old_id.toString()).click();
        }

        this.tmp_ts_range = null;
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

        let old_id: number = this.tmp_filter_active_opt.id;

        this.tmp_filter_active_opt = opt;

        // On simule le click pour décocher le input
        $('#' + this.base_filter + old_id.toString()).click();
    }

    get vo_field_ref_label(): string {
        if ((!this.widget_options) || (!this.vo_field_ref)) {
            return null;
        }

        return this.get_flat_locale_translations[this.vo_field_ref.get_translatable_name_code_text(this.page_widget.id)];
    }

    get widget_options() {
        if (!this.page_widget) {
            return null;
        }

        let options: AdvancedDateFilterWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as AdvancedDateFilterWidgetOptions;
                options = options ? new AdvancedDateFilterWidgetOptions(
                    options.is_vo_field_ref,
                    options.vo_field_ref,
                    options.custom_filter_name,
                    options.opts,
                    options.is_checkbox,
                ) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    get vo_field_ref(): VOFieldRefVO {
        let options: AdvancedDateFilterWidgetOptions = this.widget_options;

        if ((!options) || (!options.vo_field_ref) || (!options.is_vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
    }

    get opts(): AdvancedDateFilterOptDescVO[] {
        let options: AdvancedDateFilterWidgetOptions = this.widget_options;

        if ((!options) || (!options.opts) || (!options.opts.length)) {
            return null;
        }

        let res: AdvancedDateFilterOptDescVO[] = [];

        for (let i in options.opts) {
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
        let options: AdvancedDateFilterWidgetOptions = this.widget_options;

        return options.is_checkbox;
    }

    get is_type_custom(): boolean {
        return this.tmp_filter_active_opt ? (this.tmp_filter_active_opt.search_type == AdvancedDateFilterOptDescVO.SEARCH_TYPE_CUSTOM) : false;
    }

    get field_date(): SimpleDatatableFieldVO<any, any> {
        if (!this.vo_field_ref) {
            return null;
        }
        return SimpleDatatableFieldVO.createNew(this.vo_field_ref.field_id).setModuleTable(VOsTypesManager.moduleTables_by_voType[this.vo_field_ref.api_type_id]);
    }

    get base_filter(): string {
        return 'filter_opt_' + this.page_widget.id + '_';
    }
}
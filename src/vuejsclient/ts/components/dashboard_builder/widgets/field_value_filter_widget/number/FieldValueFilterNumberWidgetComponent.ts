import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterHandler from '../../../../../../../shared/modules/ContextFilter/ContextFilterHandler';
import ModuleContextFilter from '../../../../../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVO from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryFieldVO from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryFieldVO';
import ContextQueryVO, { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import DashboardPageVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import DataFilterOption from '../../../../../../../shared/modules/DataRender/vos/DataFilterOption';
import ModuleTableField from '../../../../../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import RangeHandler from '../../../../../../../shared/tools/RangeHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import TypesHandler from '../../../../../../../shared/tools/TypesHandler';
import { ModuleTranslatableTextGetter } from '../../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import ValidationFiltersWidgetController from '../../validation_filters_widget/ValidationFiltersWidgetController';
import FieldValueFilterWidgetOptions from '../options/FieldValueFilterWidgetOptions';
import AdvancedNumberFilter from './AdvancedNumberFilter';
import './FieldValueFilterNumberWidgetComponent.scss';

@Component({
    template: require('./FieldValueFilterNumberWidgetComponent.pug'),
    components: {
    }
})
export default class FieldValueFilterNumberWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };
    @ModuleDashboardPageAction
    private set_active_field_filter: (param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) => void;
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

    private tmp_filter_active_options: DataFilterOption[] = [];

    private filter_visible_options: DataFilterOption[] = [];

    private advanced_filters: boolean = false;
    private advanced_number_filters: AdvancedNumberFilter[] = [new AdvancedNumberFilter()];

    private warn_existing_external_filters: boolean = false;

    private is_init: boolean = false;

    private actual_query: string = null;
    private last_calculation_cpt: number = 0;

    private throttled_update_visible_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_visible_options.bind(this), 300, { leading: false, trailing: true });

    private filter_type_options: number[] = [
        AdvancedNumberFilter.FILTER_TYPE_INF,
        AdvancedNumberFilter.FILTER_TYPE_INFEQ,
        AdvancedNumberFilter.FILTER_TYPE_SUP,
        AdvancedNumberFilter.FILTER_TYPE_SUPEQ,
        AdvancedNumberFilter.FILTER_TYPE_EST_NULL,
        AdvancedNumberFilter.FILTER_TYPE_NEST_PAS_NULL
    ];

    private filter_type_label(filter_type: number): string {
        if (filter_type != null) {
            return this.t(AdvancedNumberFilter.FILTER_TYPE_LABELS[filter_type]);
        }
        return null;
    }

    get has_content_filter_type(): { [filter_type: number]: boolean } {
        let res: { [filter_type: number]: boolean } = {
            [AdvancedNumberFilter.FILTER_TYPE_INF]: true,
            [AdvancedNumberFilter.FILTER_TYPE_INFEQ]: true,
            [AdvancedNumberFilter.FILTER_TYPE_SUP]: true,
            [AdvancedNumberFilter.FILTER_TYPE_SUPEQ]: true,
            [AdvancedNumberFilter.FILTER_TYPE_EST_NULL]: false,
            [AdvancedNumberFilter.FILTER_TYPE_NEST_PAS_NULL]: false
        };

        return res;
    }

    private add_advanced_number_filter() {
        if (!this.advanced_number_filters) {
            this.advanced_number_filters = [];
            return;
        }

        this.advanced_number_filters[this.advanced_number_filters.length - 1].link_type = AdvancedNumberFilter.LINK_TYPE_ET;
        this.advanced_number_filters.push(new AdvancedNumberFilter());
    }

    private validate_advanced_number_filter() {
        if (!this.is_advanced_filter_valid) {
            return;
        }

        let translated_active_options: ContextFilterVO = null;

        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[this.vo_field_ref.api_type_id];
        let field = moduletable.get_field_by_id(this.vo_field_ref.field_id);
        let previous_filter: AdvancedNumberFilter = null;

        for (let i in this.advanced_number_filters) {
            let advanced_filter: AdvancedNumberFilter = this.advanced_number_filters[i];

            let new_translated_active_options = this.get_ContextFilterVO_from_AdvancedNumberFilter(advanced_filter, field);

            if (!new_translated_active_options) {
                continue;
            }

            if (!translated_active_options) {
                translated_active_options = new_translated_active_options;
            } else {

                let link_ = new ContextFilterVO();
                link_.field_id = translated_active_options.field_id;
                link_.vo_type = translated_active_options.vo_type;

                if (previous_filter.link_type == AdvancedNumberFilter.LINK_TYPE_ET) {
                    link_.filter_type = ContextFilterVO.TYPE_FILTER_AND;
                } else {
                    link_.filter_type = ContextFilterVO.TYPE_FILTER_OR;
                }

                link_.left_hook = translated_active_options;
                link_.right_hook = new_translated_active_options;
                translated_active_options = link_;
            }
            previous_filter = advanced_filter;
        }

        this.set_active_field_filter({
            field_id: this.vo_field_ref.field_id,
            vo_type: this.vo_field_ref.api_type_id,
            active_field_filter: translated_active_options,
        });
    }

    get is_advanced_filter_valid(): boolean {
        if (!this.widget_options) {
            return false;
        }

        if ((!this.advanced_number_filters) || (!this.advanced_number_filters.length)) {
            return false;
        }

        for (let i in this.advanced_number_filters) {
            let advanced_number_filter = this.advanced_number_filters[i];

            if (!this.has_content_filter_type[advanced_number_filter.filter_type]) {
                continue;
            }

            if (advanced_number_filter.filter_content == null) {
                return false;
            }
        }

        return true;
    }

    private delete_advanced_number_filter(i: number) {
        if ((!this.advanced_number_filters) || (i >= this.advanced_number_filters.length - 1)) {
            return;
        }
        this.advanced_number_filters.splice(i, 1);
    }

    private switch_link_type(advanced_number_filter: AdvancedNumberFilter) {
        advanced_number_filter.link_type = 1 - advanced_number_filter.link_type;
    }

    private async switch_advanced_filters() {
        this.advanced_filters = !this.advanced_filters;

        this.tmp_filter_active_options = null;
        if (!!this.vo_field_ref) {
            this.remove_active_field_filter({ vo_type: this.vo_field_ref.api_type_id, field_id: this.vo_field_ref.field_id });
        }
        this.advanced_number_filters = [new AdvancedNumberFilter()];

        await this.throttled_update_visible_options();
    }

    get vo_field_ref_label(): string {
        if ((!this.widget_options) || (!this.vo_field_ref)) {
            return null;
        }

        return this.get_flat_locale_translations[this.vo_field_ref.get_translatable_name_code_text(this.page_widget.id)];
    }

    get link_type_labels(): { [link_type: number]: string } {
        return AdvancedNumberFilter.FILTER_TYPE_LABELS;
    }

    @Watch('get_active_field_filters', { deep: true })
    private async onchange_active_field_filters() {
        await this.throttled_update_visible_options();
    }

    private async query_update_visible_options(queryStr: string) {
        this.actual_query = queryStr;
        await this.throttled_update_visible_options();
    }

    private async update_visible_options() {

        let launch_cpt: number = (this.last_calculation_cpt + 1);

        this.last_calculation_cpt = launch_cpt;

        if ((!this.widget_options) || (!this.vo_field_ref)) {
            this.filter_visible_options = [];
            return;
        }

        // Si on a des valeurs par défaut, on va faire l'init
        let old_is_init: boolean = this.is_init;

        this.is_init = true;

        if (!old_is_init) {
            // Si on a des valeurs par défaut, on va faire l'init
            if (this.default_values && (this.default_values.length > 0)) {
                ValidationFiltersWidgetController.getInstance().set_is_init(
                    this.dashboard_page,
                    this.page_widget,
                    true
                );

                this.tmp_filter_active_options = this.default_values;
                return;
            }
        }

        /**
         * Si le filtrage est vide, on repasse en filtrage normal si on était en avancé
         */
        if ((!this.get_active_field_filters) || (!this.get_active_field_filters[this.vo_field_ref.api_type_id]) ||
            (!this.get_active_field_filters[this.vo_field_ref.api_type_id][this.vo_field_ref.field_id])) {

            if (this.advanced_filters) {
                this.advanced_filters = false;
            }
            if (this.advanced_number_filters) {
                this.advanced_number_filters = null;
            }
        }

        /**
         * Cas où l'on réinit un filter alors qu'on a déjà un filtre actif enregistré (retour sur la page du filtre typiquement)
         */
        if (this.get_active_field_filters && this.get_active_field_filters[this.vo_field_ref.api_type_id] &&
            this.get_active_field_filters[this.vo_field_ref.api_type_id][this.vo_field_ref.field_id] &&
            ((!this.tmp_filter_active_options) || (!this.tmp_filter_active_options.length))) {

            /**
             * On essaye d'appliquer les filtres. Si on peut pas appliquer un filtre, on garde l'info pour afficher une petite alerte
             */
            this.warn_existing_external_filters = !this.try_apply_actual_active_filters(this.get_active_field_filters[this.vo_field_ref.api_type_id][this.vo_field_ref.field_id]);
        }

        let active_field_filters_query: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = null;

        if (!this.no_inter_filter) {
            active_field_filters_query = ContextFilterHandler.getInstance().clean_context_filters_for_request(
                this.get_active_field_filters
            );
        }

        let tmp: DataFilterOption[] = [];

        let query_api_type_id: string = (this.has_other_ref_api_type_id && this.other_ref_api_type_id) ? this.other_ref_api_type_id : this.vo_field_ref.api_type_id;

        let query_ = query(query_api_type_id).set_limit(this.widget_options.max_visible_options, 0);
        query_.fields = [new ContextQueryFieldVO(this.vo_field_ref.api_type_id, this.vo_field_ref.field_id, 'label')];
        query_.filters = ContextFilterHandler.getInstance().get_filters_from_active_field_filters(active_field_filters_query);
        query_.active_api_type_ids = this.dashboard.api_type_ids;

        query_.filters = ContextFilterHandler.getInstance().add_context_filters_exclude_values(
            this.exclude_values,
            this.vo_field_ref,
            query_.filters,
            false,
        );

        tmp = await ModuleContextFilter.getInstance().select_filter_visible_options(
            query_,
            this.actual_query
        );


        // Si je ne suis pas sur la dernière demande, je me casse
        if (this.last_calculation_cpt != launch_cpt) {
            return;
        }

        if (!tmp) {
            this.filter_visible_options = [];
        } else {
            this.filter_visible_options = tmp;
        }
    }

    private try_apply_actual_active_filters(filter: ContextFilterVO): boolean {
        if (!filter) {
            if (this.advanced_filters) {
                this.advanced_filters = false;
            }
            if (this.tmp_filter_active_options) {
                this.tmp_filter_active_options = null;
            }
            if (this.advanced_number_filters) {
                this.advanced_number_filters = null;
            }

            return true;
        }

        /**
         * si on a des filtres autres que simple, on doit passer en advanced
         */
        if (this.has_advanced_filter(filter)) {

            if (!this.advanced_filters) {
                this.advanced_filters = true;
            }
            if (this.tmp_filter_active_options) {
                this.tmp_filter_active_options = null;
            }

            let advanced_filters: AdvancedNumberFilter[] = [];
            this.try_apply_advanced_filters(filter, advanced_filters);
            this.advanced_number_filters = advanced_filters;
        } else {

            if (this.advanced_filters) {
                this.advanced_filters = false;
            }
            if (this.advanced_number_filters) {
                this.advanced_number_filters = null;
            }

            let tmp_filter_active_options: DataFilterOption[] = [];

            for (let i in filter.param_textarray) {
                let text = filter.param_textarray[i];
                let datafilter = new DataFilterOption(
                    DataFilterOption.STATE_SELECTED,
                    text,
                    parseInt(i.toString())
                );
                datafilter.string_value = text;
                tmp_filter_active_options.push(datafilter);
            }
            this.tmp_filter_active_options = tmp_filter_active_options;
        }
        return true;
    }

    private has_advanced_filter(filter: ContextFilterVO): boolean {
        if ((filter.filter_type == ContextFilterVO.TYPE_NUMERIC_INTERSECTS) && (filter.param_textarray != null) && (filter.param_textarray.length > 0)) {
            return false;
        }

        return true;
    }

    @Watch('widget_options', { immediate: true })
    private async onchange_widget_options() {
        this.is_init = false;
        ValidationFiltersWidgetController.getInstance().set_is_init(
            this.dashboard_page,
            this.page_widget,
            false
        );
        await this.throttled_update_visible_options();
    }

    @Watch('tmp_filter_active_options')
    private onchange_tmp_filter_active_options() {

        if (!this.widget_options) {
            return;
        }

        let translated_active_options: ContextFilterVO = null;
        let locale_tmp_filter_active_options = null;

        if (TypesHandler.getInstance().isArray(this.tmp_filter_active_options)) {
            locale_tmp_filter_active_options = this.tmp_filter_active_options;
        } else {
            if (this.tmp_filter_active_options != null) {
                locale_tmp_filter_active_options = [this.tmp_filter_active_options];
            }
        }

        if ((!locale_tmp_filter_active_options) || (!locale_tmp_filter_active_options.length)) {
            this.remove_active_field_filter({ vo_type: this.vo_field_ref.api_type_id, field_id: this.vo_field_ref.field_id });
            return;
        }

        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[this.vo_field_ref.api_type_id];
        let field = moduletable.get_field_by_id(this.vo_field_ref.field_id);

        for (let i in locale_tmp_filter_active_options) {
            let active_option = locale_tmp_filter_active_options[i];

            let new_translated_active_options = ContextFilterHandler.getInstance().get_ContextFilterVO_from_DataFilterOption(active_option, null, field, this.vo_field_ref);

            if (!new_translated_active_options) {
                continue;
            }

            if (!translated_active_options) {
                translated_active_options = new_translated_active_options;
            } else {
                translated_active_options = ContextFilterHandler.getInstance().merge_ContextFilterVOs(translated_active_options, new_translated_active_options);
            }
        }

        this.set_active_field_filter({
            field_id: this.vo_field_ref.field_id,
            vo_type: this.vo_field_ref.api_type_id,
            active_field_filter: translated_active_options,
        });
    }

    get placeholder(): string {
        if ((!this.get_flat_locale_translations) || (!this.widget_options) || (!this.get_flat_locale_translations[this.widget_options.get_placeholder_name_code_text(this.page_widget.id)])) {
            return null;
        }

        return this.get_flat_locale_translations[this.widget_options.get_placeholder_name_code_text(this.page_widget.id)];
    }

    get can_select_multiple(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.can_select_multiple;
    }

    get no_inter_filter(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.no_inter_filter;
    }

    get has_other_ref_api_type_id(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.has_other_ref_api_type_id;
    }

    get other_ref_api_type_id(): string {

        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.other_ref_api_type_id;
    }

    get vo_field_ref(): VOFieldRefVO {
        let options: FieldValueFilterWidgetOptions = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
    }

    get default_values(): DataFilterOption[] {
        let options: FieldValueFilterWidgetOptions = this.widget_options;

        if ((!options) || (!options.default_filter_opt_values) || (!options.default_filter_opt_values.length)) {
            return null;
        }

        let res: DataFilterOption[] = [];

        for (let i in options.default_filter_opt_values) {
            res.push(new DataFilterOption(
                options.default_filter_opt_values[i].select_state,
                options.default_filter_opt_values[i].label,
                options.default_filter_opt_values[i].id,
                options.default_filter_opt_values[i].disabled_state_selected,
                options.default_filter_opt_values[i].disabled_state_selectable,
                options.default_filter_opt_values[i].disabled_state_unselectable,
                options.default_filter_opt_values[i].img,
                options.default_filter_opt_values[i].desc,
                options.default_filter_opt_values[i].boolean_value,
                options.default_filter_opt_values[i].numeric_value,
                options.default_filter_opt_values[i].string_value,
                options.default_filter_opt_values[i].tstz_value,
                true,
            ));
        }

        return res;
    }

    get exclude_values(): DataFilterOption[] {
        let options: FieldValueFilterWidgetOptions = this.widget_options;

        if ((!options) || (!options.exclude_filter_opt_values) || (!options.exclude_filter_opt_values.length)) {
            return null;
        }

        let res: DataFilterOption[] = [];

        for (let i in options.exclude_filter_opt_values) {
            res.push(new DataFilterOption(
                options.exclude_filter_opt_values[i].select_state,
                options.exclude_filter_opt_values[i].label,
                options.exclude_filter_opt_values[i].id,
                options.exclude_filter_opt_values[i].disabled_state_selected,
                options.exclude_filter_opt_values[i].disabled_state_selectable,
                options.exclude_filter_opt_values[i].disabled_state_unselectable,
                options.exclude_filter_opt_values[i].img,
                options.exclude_filter_opt_values[i].desc,
                options.exclude_filter_opt_values[i].boolean_value,
                options.exclude_filter_opt_values[i].numeric_value,
                options.exclude_filter_opt_values[i].string_value,
                options.exclude_filter_opt_values[i].tstz_value,
                true,
            ));
        }

        return res;
    }

    get widget_options() {
        if (!this.page_widget) {
            return null;
        }

        let options: FieldValueFilterWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as FieldValueFilterWidgetOptions;
                options = options ? new FieldValueFilterWidgetOptions(
                    options.vo_field_ref,
                    options.vo_field_ref_lvl2,
                    options.vo_field_sort,
                    options.can_select_multiple,
                    options.is_checkbox,
                    options.max_visible_options,
                    options.show_search_field,
                    options.hide_lvl2_if_lvl1_not_selected,
                    options.segmentation_type,
                    options.advanced_mode,
                    options.default_advanced_string_filter_type,
                    options.hide_btn_switch_advanced,
                    options.hide_advanced_string_filter_type,
                    options.vo_field_ref_multiple,
                    options.default_filter_opt_values,
                    options.default_ts_range_values,
                    options.default_boolean_values,
                    options.hide_filter,
                    options.no_inter_filter,
                    options.has_other_ref_api_type_id,
                    options.other_ref_api_type_id,
                    options.exclude_filter_opt_values,
                    options.exclude_ts_range_values,
                    options.placeholder_advanced_mode,
                ) : null;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return options;
    }

    private get_ContextFilterVO_from_AdvancedNumberFilter(advanced_filter: AdvancedNumberFilter, field: ModuleTableField<any>): ContextFilterVO {
        let translated_active_options = new ContextFilterVO();

        translated_active_options.field_id = this.vo_field_ref.field_id;
        translated_active_options.vo_type = this.vo_field_ref.api_type_id;

        let field_type = null;
        if ((!field) && (this.vo_field_ref.field_id == 'id')) {
            field_type = ModuleTableField.FIELD_TYPE_int;
        } else {
            field_type = field.field_type;
        }

        switch (field_type) {
            case ModuleTableField.FIELD_TYPE_int:
            case ModuleTableField.FIELD_TYPE_geopoint:
            case ModuleTableField.FIELD_TYPE_float:
            case ModuleTableField.FIELD_TYPE_decimal_full_precision:
            case ModuleTableField.FIELD_TYPE_amount:
            case ModuleTableField.FIELD_TYPE_prct:
            case ModuleTableField.FIELD_TYPE_boolean:
                switch (advanced_filter.filter_type) {
                    case AdvancedNumberFilter.FILTER_TYPE_EST_NULL:
                        translated_active_options.filter_type = ContextFilterVO.TYPE_NULL_ANY;
                        break;
                    case AdvancedNumberFilter.FILTER_TYPE_INF:
                        translated_active_options.filter_type = ContextFilterVO.TYPE_NUMERIC_INF_ANY;
                        translated_active_options.param_numeric = advanced_filter.filter_content;
                        break;
                    case AdvancedNumberFilter.FILTER_TYPE_INFEQ:
                        translated_active_options.filter_type = ContextFilterVO.TYPE_NUMERIC_INFEQ_ANY;
                        translated_active_options.param_numeric = advanced_filter.filter_content;
                        break;
                    case AdvancedNumberFilter.FILTER_TYPE_NEST_PAS_NULL:
                        translated_active_options.filter_type = ContextFilterVO.TYPE_NULL_NONE;
                        break;
                    case AdvancedNumberFilter.FILTER_TYPE_SUP:
                        translated_active_options.filter_type = ContextFilterVO.TYPE_NUMERIC_SUP_ANY;
                        translated_active_options.param_numeric = advanced_filter.filter_content;
                        break;
                    case AdvancedNumberFilter.FILTER_TYPE_SUPEQ:
                        translated_active_options.filter_type = ContextFilterVO.TYPE_NUMERIC_SUPEQ_ANY;
                        translated_active_options.param_numeric = advanced_filter.filter_content;
                        break;
                }
                break;

            default:
                throw new Error('Not Implemented');
        }

        return translated_active_options;
    }

    private try_apply_advanced_filters(filter: ContextFilterVO, advanced_filters: AdvancedNumberFilter[]) {
        let advanced_filter = new AdvancedNumberFilter();

        switch (filter.filter_type) {
            case ContextFilterVO.TYPE_FILTER_AND:
                this.try_apply_advanced_filters(filter.left_hook, advanced_filters);
                advanced_filters[advanced_filters.length].link_type = AdvancedNumberFilter.LINK_TYPE_ET;
                this.try_apply_advanced_filters(filter.right_hook, advanced_filters);
                break;

            case ContextFilterVO.TYPE_FILTER_OR:
                this.try_apply_advanced_filters(filter.left_hook, advanced_filters);
                advanced_filters[advanced_filters.length].link_type = AdvancedNumberFilter.LINK_TYPE_OU;
                this.try_apply_advanced_filters(filter.right_hook, advanced_filters);
                break;

            case ContextFilterVO.TYPE_NULL_ANY:
                advanced_filter.filter_type = AdvancedNumberFilter.FILTER_TYPE_EST_NULL;
                break;

            case ContextFilterVO.TYPE_NUMERIC_INF_ANY:
                advanced_filter.filter_type = AdvancedNumberFilter.FILTER_TYPE_INF;
                advanced_filter.filter_content = filter.param_numeric;
                break;

            case ContextFilterVO.TYPE_NUMERIC_INFEQ_ANY:
                advanced_filter.filter_type = AdvancedNumberFilter.FILTER_TYPE_INFEQ;
                advanced_filter.filter_content = filter.param_numeric;
                break;

            case ContextFilterVO.TYPE_NULL_NONE:
                advanced_filter.filter_type = AdvancedNumberFilter.FILTER_TYPE_NEST_PAS_NULL;
                break;

            case ContextFilterVO.TYPE_NUMERIC_SUP_ANY:
                advanced_filter.filter_type = AdvancedNumberFilter.FILTER_TYPE_SUP;
                advanced_filter.filter_content = filter.param_numeric;
                break;

            case ContextFilterVO.TYPE_NUMERIC_SUPEQ_ANY:
                advanced_filter.filter_type = AdvancedNumberFilter.FILTER_TYPE_SUPEQ;
                advanced_filter.filter_content = filter.param_numeric;
                break;

            default:
                throw new Error('Not Implemented');
        }

        advanced_filters.push(advanced_filter);
    }
}
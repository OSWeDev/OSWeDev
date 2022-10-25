import { cloneDeep, isEqual } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterHandler from '../../../../../../../shared/modules/ContextFilter/ContextFilterHandler';
import ModuleContextFilter from '../../../../../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVO from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
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
import './FieldValueFilterEnumWidgetComponent.scss';

@Component({
    template: require('./FieldValueFilterEnumWidgetComponent.pug'),
    components: {
    }
})
export default class FieldValueFilterEnumWidgetComponent extends VueComponentBase {

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

    private warn_existing_external_filters: boolean = false;

    private excludes_values_labels: { [label: string]: boolean } = {};

    private is_init: boolean = false;

    private actual_query: string = null;
    private old_widget_options: FieldValueFilterWidgetOptions = null;

    private throttled_update_visible_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_visible_options.bind(this), 300, { leading: false, trailing: true });
    private last_calculation_cpt: number = 0;

    @Watch('get_active_field_filters', { deep: true })
    private async onchange_active_field_filters() {
        await this.throttled_update_visible_options();
    }

    @Watch('widget_options', { immediate: true })
    private async onchange_widget_options() {
        if (!!this.old_widget_options) {
            if (isEqual(this.widget_options, this.old_widget_options)) {
                return;
            }
        }

        this.old_widget_options = cloneDeep(this.widget_options);

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
        let has_null_value: boolean = false;

        for (let i in locale_tmp_filter_active_options) {
            let active_option: DataFilterOption = locale_tmp_filter_active_options[i];

            if (active_option.id == RangeHandler.MIN_INT) {
                has_null_value = true;
                continue;
            }

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

        if (has_null_value) {
            let cf_null_value: ContextFilterVO = new ContextFilterVO();
            cf_null_value.field_id = this.vo_field_ref.field_id;
            cf_null_value.vo_type = this.vo_field_ref.api_type_id;
            cf_null_value.filter_type = ContextFilterVO.TYPE_NULL_OR_EMPTY;

            if (!translated_active_options) {
                translated_active_options = cf_null_value;
            } else {
                translated_active_options = ContextFilterVO.or([cf_null_value, translated_active_options]);
            }
        }

        this.set_active_field_filter({
            field_id: this.vo_field_ref.field_id,
            vo_type: this.vo_field_ref.api_type_id,
            active_field_filter: translated_active_options,
        });
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

        let active_field_filters = null;

        if (!this.no_inter_filter) {
            active_field_filters = this.get_active_field_filters;
        }

        let tmp: DataFilterOption[] = [];

        let query_api_type_id: string = (this.has_other_ref_api_type_id && this.other_ref_api_type_id) ? this.other_ref_api_type_id : this.vo_field_ref.api_type_id;

        let query_ = query(query_api_type_id)
            .field(this.vo_field_ref.field_id, 'label', this.vo_field_ref.api_type_id)
            .add_filters(ContextFilterHandler.getInstance().get_filters_from_active_field_filters(ContextFilterHandler.getInstance().clean_context_filters_for_request(active_field_filters)))
            .set_limit(this.widget_options.max_visible_options)
            .using(this.dashboard.api_type_ids);

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
            tmp = [];
        }

        for (let i in tmp) {
            let tmpi = tmp[i];
            tmpi.label = this.t(tmpi.label);
        }

        if (this.add_is_null_selectable) {
            tmp.unshift(new DataFilterOption(
                DataFilterOption.STATE_SELECTABLE,
                this.label('datafilteroption.is_null'),
                RangeHandler.MIN_INT,
            ));
        }

        this.filter_visible_options = tmp;
    }

    private try_apply_actual_active_filters(filter: ContextFilterVO): boolean {
        if (!filter) {

            if (this.tmp_filter_active_options && this.tmp_filter_active_options.length) {
                this.tmp_filter_active_options = [];
            }
            return true;
        }

        let tmp_filter_active_options: DataFilterOption[] = [];

        if (!filter.param_numranges) {
            if (this.tmp_filter_active_options && this.tmp_filter_active_options.length) {
                this.tmp_filter_active_options = [];
            }
            return true;
        }

        RangeHandler.getInstance().foreach_ranges_sync(filter.param_numranges, (num: number) => {

            let datafilter = new DataFilterOption(
                DataFilterOption.STATE_SELECTED,
                this.field.enum_values[num],
                num
            );
            datafilter.string_value = this.field.enum_values[num];
            datafilter.numeric_value = num;
            tmp_filter_active_options.push(datafilter);
        });

        this.tmp_filter_active_options = tmp_filter_active_options;
        return true;
    }

    private filter_visible_label(dfo: DataFilterOption): string {
        return dfo.label;
    }

    get vo_field_ref_label(): string {
        if ((!this.widget_options) || (!this.vo_field_ref)) {
            return null;
        }

        return this.get_flat_locale_translations[this.vo_field_ref.get_translatable_name_code_text(this.page_widget.id)];
    }

    get field(): ModuleTableField<any> {
        if (!this.vo_field_ref) {
            return null;
        }

        return VOsTypesManager.getInstance().moduleTables_by_voType[this.vo_field_ref.api_type_id].get_field_by_id(this.vo_field_ref.field_id);
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

    get add_is_null_selectable(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.add_is_null_selectable;
    }

    get vo_field_ref(): VOFieldRefVO {
        let options: FieldValueFilterWidgetOptions = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
    }

    get no_inter_filter(): boolean {
        return this.widget_options.no_inter_filter;
    }

    get has_other_ref_api_type_id(): boolean {
        return this.widget_options.has_other_ref_api_type_id;
    }

    get other_ref_api_type_id(): string {
        return this.widget_options.other_ref_api_type_id;
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
                    options.separation_active_filter,
                    options.vo_field_sort_lvl2,
                    options.autovalidate_advanced_filter,
                    options.add_is_null_selectable,
                ) : null;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return options;
    }
}
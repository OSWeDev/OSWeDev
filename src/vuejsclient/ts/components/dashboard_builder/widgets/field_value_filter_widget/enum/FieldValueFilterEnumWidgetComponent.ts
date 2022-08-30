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
import NumSegment from '../../../../../../../shared/modules/DataRender/vos/NumSegment';
import TimeSegment from '../../../../../../../shared/modules/DataRender/vos/TimeSegment';
import ModuleTableField from '../../../../../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import RangeHandler from '../../../../../../../shared/tools/RangeHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import TypesHandler from '../../../../../../../shared/tools/TypesHandler';
import { ModuleTranslatableTextGetter } from '../../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
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
    private is_init: boolean = true;

    private actual_query: string = null;

    private throttled_update_visible_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_visible_options.bind(this), 300, { leading: false, trailing: true });

    get vo_field_ref_label(): string {
        if ((!this.widget_options) || (!this.vo_field_ref)) {
            return null;
        }

        return this.get_flat_locale_translations[this.vo_field_ref.get_translatable_name_code_text(this.page_widget.id)];
    }

    @Watch('get_active_field_filters', { deep: true })
    private async onchange_active_field_filters() {
        await this.throttled_update_visible_options();
    }

    private async query_update_visible_options(queryStr: string) {
        this.actual_query = queryStr;
        await this.throttled_update_visible_options();
    }

    get field(): ModuleTableField<any> {
        if (!this.vo_field_ref) {
            return null;
        }

        return VOsTypesManager.getInstance().moduleTables_by_voType[this.vo_field_ref.api_type_id].get_field_by_id(this.vo_field_ref.field_id);
    }

    private async update_visible_options() {

        if ((!this.widget_options) || (!this.vo_field_ref)) {
            this.filter_visible_options = [];
            return;
        }

        // Si on a des valeurs par défaut, on va faire l'init
        if (this.is_init && this.default_values && (this.default_values.length > 0)) {
            this.is_init = false;
            this.tmp_filter_active_options = this.default_values;
            return;
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

        let query_api_type_id: string = (this.has_other_ref_api_type_id && this.other_ref_api_type_id) ? this.other_ref_api_type_id : this.vo_field_ref.api_type_id;

        let query_ = query(query_api_type_id).set_limit(this.widget_options.max_visible_options, 0);
        query_.fields = [new ContextQueryFieldVO(this.vo_field_ref.api_type_id, this.vo_field_ref.field_id, 'label')];
        query_.filters = ContextFilterHandler.getInstance().get_filters_from_active_field_filters(
            ContextFilterHandler.getInstance().clean_context_filters_for_request(active_field_filters));
        query_.active_api_type_ids = this.dashboard.api_type_ids;

        let tmp: DataFilterOption[] = await ModuleContextFilter.getInstance().select_filter_visible_options(
            query_,
            this.actual_query
        );

        if (!tmp) {
            this.filter_visible_options = [];
        } else {

            for (let i in tmp) {
                let tmpi = tmp[i];
                tmpi.label = this.t(tmpi.label);
            }
            this.filter_visible_options = tmp;
        }
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

    @Watch('widget_options', { immediate: true })
    private async onchange_widget_options() {
        this.is_init = true;
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

            let new_translated_active_options = this.get_ContextFilterVO_from_DataFilterOption(active_option, field);

            if (!new_translated_active_options) {
                continue;
            }

            if (!translated_active_options) {
                translated_active_options = new_translated_active_options;
            } else {
                translated_active_options = this.merge_ContextFilterVOs(translated_active_options, new_translated_active_options);
            }
        }

        this.set_active_field_filter({
            field_id: this.vo_field_ref.field_id,
            vo_type: this.vo_field_ref.api_type_id,
            active_field_filter: translated_active_options,
        });
    }

    private filter_visible_label(dfo: DataFilterOption): string {
        return this.t(this.field.enum_values[dfo.label]);
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
                ) : null;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return options;
    }

    private merge_ContextFilterVOs(a: ContextFilterVO, b: ContextFilterVO, try_union: boolean = false): ContextFilterVO {
        if (!a) {
            return b;
        }

        if (!b) {
            return a;
        }

        if (a.filter_type == b.filter_type) {
            if (a.param_numranges && b.param_numranges) {
                a.param_numranges = a.param_numranges.concat(b.param_numranges);
                if (try_union) {
                    a.param_numranges = RangeHandler.getInstance().getRangesUnion(a.param_numranges);
                }
                return a;
            }

            if (a.param_tsranges && b.param_tsranges) {
                a.param_tsranges = a.param_tsranges.concat(b.param_tsranges);
                if (try_union) {
                    a.param_tsranges = RangeHandler.getInstance().getRangesUnion(a.param_tsranges);
                }
                return a;
            }

            if (a.param_textarray && b.param_textarray) {
                if (!a.param_textarray.length) {
                    a.param_textarray = b.param_textarray;
                } else if (!b.param_textarray.length) {
                } else {
                    a.param_textarray = a.param_textarray.concat(b.param_textarray);
                }
                return a;
            }

            /**
             * On doit gérer les merges booleans, en supprimant potentiellement la condition
             *  (par exemple si on merge un true any avec un false any par définition c'est juste plus un filtre)
             */
            switch (a.filter_type) {
                case ContextFilterVO.TYPE_BOOLEAN_TRUE_ANY:
                    throw new Error('Not Implemented');
                case ContextFilterVO.TYPE_BOOLEAN_TRUE_ALL:
                    throw new Error('Not Implemented');
                case ContextFilterVO.TYPE_BOOLEAN_FALSE_ANY:
                    throw new Error('Not Implemented');
                case ContextFilterVO.TYPE_BOOLEAN_FALSE_ALL:
                    throw new Error('Not Implemented');

                case ContextFilterVO.TYPE_TEXT_INCLUDES_ALL:

                default:
                    break;
            }
        }

        return a;
    }

    private get_ContextFilterVO_from_DataFilterOption(active_option: DataFilterOption, field: ModuleTableField<any>): ContextFilterVO {
        let translated_active_options = new ContextFilterVO();

        translated_active_options.field_id = this.vo_field_ref.field_id;
        translated_active_options.vo_type = this.vo_field_ref.api_type_id;

        switch (field.field_type) {
            // case ModuleTableField.FIELD_TYPE_file_field:
            // case ModuleTableField.FIELD_TYPE_file_ref:
            // case ModuleTableField.FIELD_TYPE_image_field:
            // case ModuleTableField.FIELD_TYPE_image_ref:
            case ModuleTableField.FIELD_TYPE_enum:
                translated_active_options.filter_type = ContextFilterVO.TYPE_NUMERIC_INTERSECTS;
                translated_active_options.param_numranges = [RangeHandler.getInstance().create_single_elt_NumRange(active_option.numeric_value, NumSegment.TYPE_INT)];
                break;
            // case ModuleTableField.FIELD_TYPE_int:
            // case ModuleTableField.FIELD_TYPE_geopoint:
            // case ModuleTableField.FIELD_TYPE_float:
            // case ModuleTableField.FIELD_TYPE_decimal_full_precision:
            // case ModuleTableField.FIELD_TYPE_amount:
            // case ModuleTableField.FIELD_TYPE_foreign_key:
            // case ModuleTableField.FIELD_TYPE_isoweekdays:
            // case ModuleTableField.FIELD_TYPE_prct:
            // case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
            // case ModuleTableField.FIELD_TYPE_hours_and_minutes:
            // case ModuleTableField.FIELD_TYPE_hour:
            //     translated_active_options.filter_type = ContextFilterVO.TYPE_NUMERIC_INTERSECTS;
            //     translated_active_options.param_numranges = [RangeHandler.getInstance().create_single_elt_NumRange(active_option.numeric_value, NumSegment.TYPE_INT)];
            //     break;

            // case ModuleTableField.FIELD_TYPE_tstz:
            //     translated_active_options.filter_type = ContextFilterVO.TYPE_DATE_INTERSECTS;
            //     translated_active_options.param_tsranges = [RangeHandler.getInstance().create_single_elt_TSRange(
            //         active_option.tstz_value, (field.segmentation_type != null) ? field.segmentation_type : TimeSegment.TYPE_DAY)];
            //     break;

            // case ModuleTableField.FIELD_TYPE_html:
            // case ModuleTableField.FIELD_TYPE_password:
            // case ModuleTableField.FIELD_TYPE_email:
            // case ModuleTableField.FIELD_TYPE_string:
            // case ModuleTableField.FIELD_TYPE_textarea:
            // case ModuleTableField.FIELD_TYPE_translatable_text:
            //     translated_active_options.filter_type = ContextFilterVO.TYPE_TEXT_EQUALS_ANY;
            //     translated_active_options.param_textarray = [active_option.string_value];
            //     break;

            // case ModuleTableField.FIELD_TYPE_plain_vo_obj:
            // case ModuleTableField.FIELD_TYPE_html_array:
            //     throw new Error('Not Implemented');

            // case ModuleTableField.FIELD_TYPE_boolean:
            //     if (!!active_option.boolean_value) {
            //         translated_active_options.filter_type = ContextFilterVO.TYPE_BOOLEAN_TRUE_ANY;
            //     } else {
            //         translated_active_options.filter_type = ContextFilterVO.TYPE_BOOLEAN_FALSE_ANY;
            //     }
            //     break;

            // case ModuleTableField.FIELD_TYPE_numrange:
            //     throw new Error('Not Implemented');

            // case ModuleTableField.FIELD_TYPE_numrange_array:
            // case ModuleTableField.FIELD_TYPE_refrange_array:
            //     throw new Error('Not Implemented');

            // case ModuleTableField.FIELD_TYPE_daterange:
            //     throw new Error('Not Implemented');

            // case ModuleTableField.FIELD_TYPE_hourrange:
            //     throw new Error('Not Implemented');

            // case ModuleTableField.FIELD_TYPE_tsrange:
            //     throw new Error('Not Implemented');

            // case ModuleTableField.FIELD_TYPE_tstzrange_array:
            //     throw new Error('Not Implemented');

            // case ModuleTableField.FIELD_TYPE_hourrange_array:
            //     throw new Error('Not Implemented');

            // case ModuleTableField.FIELD_TYPE_int_array:
            // case ModuleTableField.FIELD_TYPE_tstz_array:
            //     throw new Error('Not Implemented');

            // case ModuleTableField.FIELD_TYPE_string_array:
            //     throw new Error('Not Implemented');

            // case ModuleTableField.FIELD_TYPE_date:
            // case ModuleTableField.FIELD_TYPE_day:
            // case ModuleTableField.FIELD_TYPE_month:
            //     translated_active_options.filter_type = ContextFilterVO.TYPE_DATE_INTERSECTS;
            //     translated_active_options.param_tsranges = [RangeHandler.getInstance().create_single_elt_TSRange(
            //         active_option.tstz_value, (field.segmentation_type != null) ? field.segmentation_type : TimeSegment.TYPE_DAY)];
            //     break;

            // case ModuleTableField.FIELD_TYPE_timewithouttimezone:
            //     throw new Error('Not Implemented');

            default:
                throw new Error('Not Implemented');
        }

        return translated_active_options;
    }
}
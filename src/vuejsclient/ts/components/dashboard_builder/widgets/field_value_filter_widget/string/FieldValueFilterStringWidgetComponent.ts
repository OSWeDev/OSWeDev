import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterHandler from '../../../../../../../shared/modules/ContextFilter/ContextFilterHandler';
import ModuleContextFilter from '../../../../../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVO from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
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
import AdvancedStringFilter from './AdvancedStringFilter';
import './FieldValueFilterStringWidgetComponent.scss';

@Component({
    template: require('./FieldValueFilterStringWidgetComponent.pug'),
    components: {
    }
})
export default class FieldValueFilterStringWidgetComponent extends VueComponentBase {

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

    private tmp_filter_active_options: DataFilterOption[] = [];

    private filter_visible_options: DataFilterOption[] = [];

    private advanced_filters: boolean = false;
    private advanced_string_filters: AdvancedStringFilter[] = [new AdvancedStringFilter()];

    private warn_existing_external_filters: boolean = false;

    private actual_query: string = null;

    private throttled_update_visible_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_visible_options.bind(this), 300, { leading: false, trailing: true });

    private filter_type_options: number[] = [
        AdvancedStringFilter.FILTER_TYPE_COMMENCE,
        AdvancedStringFilter.FILTER_TYPE_COMMENCE_PAS,
        AdvancedStringFilter.FILTER_TYPE_CONTIENT,
        AdvancedStringFilter.FILTER_TYPE_CONTIENT_PAS,
        AdvancedStringFilter.FILTER_TYPE_EST,
        AdvancedStringFilter.FILTER_TYPE_EST_NULL,
        AdvancedStringFilter.FILTER_TYPE_EST_VIDE,
        AdvancedStringFilter.FILTER_TYPE_NEST_PAS,
        AdvancedStringFilter.FILTER_TYPE_NEST_PAS_NULL,
        AdvancedStringFilter.FILTER_TYPE_NEST_PAS_VIDE
    ];

    private filter_type_label(filter_type: number): string {
        if (filter_type != null) {
            return this.t(AdvancedStringFilter.FILTER_TYPE_LABELS[filter_type]);
        }
        return null;
    }

    get has_content_filter_type(): { [filter_type: number]: boolean } {
        let res: { [filter_type: number]: boolean } = {
            [AdvancedStringFilter.FILTER_TYPE_COMMENCE]: true,
            [AdvancedStringFilter.FILTER_TYPE_COMMENCE_PAS]: true,
            [AdvancedStringFilter.FILTER_TYPE_CONTIENT]: true,
            [AdvancedStringFilter.FILTER_TYPE_CONTIENT_PAS]: true,
            [AdvancedStringFilter.FILTER_TYPE_EST]: true,
            [AdvancedStringFilter.FILTER_TYPE_EST_NULL]: false,
            [AdvancedStringFilter.FILTER_TYPE_EST_VIDE]: false,
            [AdvancedStringFilter.FILTER_TYPE_NEST_PAS]: true,
            [AdvancedStringFilter.FILTER_TYPE_NEST_PAS_NULL]: false,
            [AdvancedStringFilter.FILTER_TYPE_NEST_PAS_VIDE]: false,
        };

        return res;
    }

    private add_advanced_string_filter() {
        if (!this.advanced_string_filters) {
            this.advanced_string_filters = [];
            return;
        }

        this.advanced_string_filters[this.advanced_string_filters.length - 1].link_type = AdvancedStringFilter.LINK_TYPE_ET;
        this.advanced_string_filters.push(new AdvancedStringFilter());
    }

    private validate_advanced_string_filter() {
        if (!this.is_advanced_filter_valid) {
            return;
        }

        let translated_active_options: ContextFilterVO = null;

        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[this.vo_field_ref.api_type_id];
        let field = moduletable.get_field_by_id(this.vo_field_ref.field_id);
        let previous_filter: AdvancedStringFilter = null;

        for (let i in this.advanced_string_filters) {
            let advanced_filter: AdvancedStringFilter = this.advanced_string_filters[i];

            let new_translated_active_options = this.get_ContextFilterVO_from_AdvancedStringFilter(advanced_filter, field);

            if (!new_translated_active_options) {
                continue;
            }

            if (!translated_active_options) {
                translated_active_options = new_translated_active_options;
            } else {

                let link_ = new ContextFilterVO();
                link_.field_id = translated_active_options.field_id;
                link_.vo_type = translated_active_options.vo_type;

                if (previous_filter.link_type == AdvancedStringFilter.LINK_TYPE_ET) {
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
        this.set_active_field_filter(translated_active_options);
    }

    get is_advanced_filter_valid(): boolean {
        if (!this.widget_options) {
            return false;
        }

        if ((!this.advanced_string_filters) || (!this.advanced_string_filters.length)) {
            return false;
        }

        for (let i in this.advanced_string_filters) {
            let advanced_string_filter = this.advanced_string_filters[i];

            if (!this.has_content_filter_type[advanced_string_filter.filter_type]) {
                continue;
            }

            if (advanced_string_filter.filter_content == '') {
                return false;
            }
        }

        return true;
    }

    private delete_advanced_string_filter(i: number) {
        if ((!this.advanced_string_filters) || (i >= this.advanced_string_filters.length - 1)) {
            return;
        }
        this.advanced_string_filters.splice(i, 1);
    }

    private switch_link_type(advanced_string_filter: AdvancedStringFilter) {
        advanced_string_filter.link_type = 1 - advanced_string_filter.link_type;
    }

    private async switch_advanced_filters() {
        this.advanced_filters = !this.advanced_filters;

        this.tmp_filter_active_options = null;
        if (!!this.vo_field_ref) {
            this.remove_active_field_filter({ vo_type: this.vo_field_ref.api_type_id, field_id: this.vo_field_ref.field_id });
        }
        this.advanced_string_filters = [new AdvancedStringFilter()];

        await this.throttled_update_visible_options();
    }

    get vo_field_ref_label(): string {
        if ((!this.widget_options) || (!this.vo_field_ref)) {
            return null;
        }

        return this.get_flat_locale_translations[this.vo_field_ref.translatable_name_code_text];
    }

    get link_type_labels(): { [link_type: number]: string } {
        return AdvancedStringFilter.FILTER_TYPE_LABELS;
    }

    @Watch('get_active_field_filters', { deep: true })
    private async onchange_active_field_filters() {
        await this.throttled_update_visible_options();
    }

    private async query_update_visible_options(query: string) {
        this.actual_query = query;
        await this.throttled_update_visible_options();
    }

    private async update_visible_options() {
        if (this.advanced_filters) {
            this.filter_visible_options = [];
            return;
        }

        if ((!this.widget_options) || (!this.vo_field_ref)) {
            this.filter_visible_options = [];
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

        let tmp = await ModuleContextFilter.getInstance().get_filter_visible_options(
            this.vo_field_ref.api_type_id,
            this.vo_field_ref.field_id,
            ContextFilterHandler.getInstance().clean_context_filters_for_request(this.get_active_field_filters),
            this.dashboard.api_type_ids,
            this.actual_query,
            this.widget_options.max_visible_options,
            0);

        if (!tmp) {
            this.filter_visible_options = [];
        } else {
            this.filter_visible_options = tmp;
        }
    }

    private try_apply_actual_active_filters(filter: ContextFilterVO): boolean {
        if (!filter) {
            return true;
        }

        /**
         * si on a des filtres autres que simple, on doit passer en advanced
         */
        if (this.has_advanced_filter(filter)) {

            this.switch_advanced_filters();
            let advanced_filters: AdvancedStringFilter[] = [];
            this.try_apply_advanced_filters(filter, advanced_filters);
            this.advanced_string_filters = advanced_filters;
        } else {

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
        if ((filter.filter_type == ContextFilterVO.TYPE_TEXT_EQUALS_ANY) && (filter.param_textarray != null) && (filter.param_textarray.length > 0)) {
            return false;
        }

        return true;
    }

    @Watch('widget_options', { immediate: true })
    private async onchange_widget_options() {

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
        this.set_active_field_filter(translated_active_options);
    }

    get placeholder(): string {
        if ((!this.get_flat_locale_translations) || (!this.widget_options) || (!this.get_flat_locale_translations[this.widget_options.placeholder_name_code_text])) {
            return null;
        }

        return this.get_flat_locale_translations[this.widget_options.placeholder_name_code_text];
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

    get widget_options() {
        if (!this.page_widget) {
            return null;
        }

        let options: FieldValueFilterWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as FieldValueFilterWidgetOptions;
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

    get is_translatable_type(): boolean {
        if (!this.vo_field_ref) {
            return false;
        }

        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[this.vo_field_ref.api_type_id];
        if (!moduletable) {
            return false;
        }

        let field = moduletable.get_field_by_id(this.vo_field_ref.field_id);
        if (!field) {
            return false;
        }

        return field.field_type == ModuleTableField.FIELD_TYPE_translatable_text;
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
            // case ModuleTableField.FIELD_TYPE_enum:
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

            case ModuleTableField.FIELD_TYPE_html:
            case ModuleTableField.FIELD_TYPE_password:
            case ModuleTableField.FIELD_TYPE_email:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_textarea:
            case ModuleTableField.FIELD_TYPE_translatable_text:
                translated_active_options.filter_type = ContextFilterVO.TYPE_TEXT_EQUALS_ANY;
                translated_active_options.param_textarray = [active_option.string_value];
                break;

            case ModuleTableField.FIELD_TYPE_plain_vo_obj:
            case ModuleTableField.FIELD_TYPE_html_array:
                throw new Error('Not Implemented');

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

    private get_ContextFilterVO_from_AdvancedStringFilter(advanced_filter: AdvancedStringFilter, field: ModuleTableField<any>): ContextFilterVO {
        let translated_active_options = new ContextFilterVO();

        translated_active_options.field_id = this.vo_field_ref.field_id;
        translated_active_options.vo_type = this.vo_field_ref.api_type_id;

        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_file_field:
            case ModuleTableField.FIELD_TYPE_file_ref:
            case ModuleTableField.FIELD_TYPE_image_field:
            case ModuleTableField.FIELD_TYPE_image_ref:
            case ModuleTableField.FIELD_TYPE_enum:
            case ModuleTableField.FIELD_TYPE_int:
            case ModuleTableField.FIELD_TYPE_geopoint:
            case ModuleTableField.FIELD_TYPE_float:
            case ModuleTableField.FIELD_TYPE_decimal_full_precision:
            case ModuleTableField.FIELD_TYPE_amount:
            case ModuleTableField.FIELD_TYPE_foreign_key:
            case ModuleTableField.FIELD_TYPE_isoweekdays:
            case ModuleTableField.FIELD_TYPE_prct:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes:
            case ModuleTableField.FIELD_TYPE_hour:
            case ModuleTableField.FIELD_TYPE_tstz:
            case ModuleTableField.FIELD_TYPE_boolean:
            case ModuleTableField.FIELD_TYPE_plain_vo_obj:
                throw new Error('Not Implemented');

            case ModuleTableField.FIELD_TYPE_html:
            case ModuleTableField.FIELD_TYPE_password:
            case ModuleTableField.FIELD_TYPE_email:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_textarea:
            case ModuleTableField.FIELD_TYPE_translatable_text:

                switch (advanced_filter.filter_type) {
                    case AdvancedStringFilter.FILTER_TYPE_COMMENCE:
                        translated_active_options.filter_type = ContextFilterVO.TYPE_TEXT_STARTSWITH_ANY;
                        translated_active_options.param_text = advanced_filter.filter_content;
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_COMMENCE_PAS:
                        translated_active_options.filter_type = ContextFilterVO.TYPE_TEXT_STARTSWITH_NONE;
                        translated_active_options.param_text = advanced_filter.filter_content;
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_CONTIENT:
                        translated_active_options.filter_type = ContextFilterVO.TYPE_TEXT_INCLUDES_ANY;
                        translated_active_options.param_text = advanced_filter.filter_content;
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_CONTIENT_PAS:
                        translated_active_options.filter_type = ContextFilterVO.TYPE_TEXT_INCLUDES_NONE;
                        translated_active_options.param_text = advanced_filter.filter_content;
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_EST:
                        translated_active_options.filter_type = ContextFilterVO.TYPE_TEXT_EQUALS_ANY;
                        translated_active_options.param_text = advanced_filter.filter_content;
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_NEST_PAS:
                        translated_active_options.filter_type = ContextFilterVO.TYPE_TEXT_EQUALS_NONE;
                        translated_active_options.param_text = advanced_filter.filter_content;
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_EST_NULL:
                        translated_active_options.filter_type = ContextFilterVO.TYPE_NULL_ANY;
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_NEST_PAS_NULL:
                        translated_active_options.filter_type = ContextFilterVO.TYPE_NULL_NONE;
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_EST_VIDE:
                        translated_active_options.filter_type = ContextFilterVO.TYPE_TEXT_EQUALS_ANY;
                        translated_active_options.param_text = '';
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_NEST_PAS_VIDE:
                        translated_active_options.filter_type = ContextFilterVO.TYPE_TEXT_EQUALS_NONE;
                        translated_active_options.param_text = '';
                        break;
                }
                break;

            case ModuleTableField.FIELD_TYPE_string_array:
            case ModuleTableField.FIELD_TYPE_html_array:
                throw new Error('Not Implemented');

            case ModuleTableField.FIELD_TYPE_numrange:
            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_refrange_array:
            case ModuleTableField.FIELD_TYPE_daterange:
            case ModuleTableField.FIELD_TYPE_hourrange:
            case ModuleTableField.FIELD_TYPE_tsrange:
            case ModuleTableField.FIELD_TYPE_tstzrange_array:
            case ModuleTableField.FIELD_TYPE_hourrange_array:
            case ModuleTableField.FIELD_TYPE_int_array:
            case ModuleTableField.FIELD_TYPE_tstz_array:
            case ModuleTableField.FIELD_TYPE_date:
            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_month:
            case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                throw new Error('Not Implemented');
        }

        return translated_active_options;
    }

    private try_apply_advanced_filters(filter: ContextFilterVO, advanced_filters: AdvancedStringFilter[]) {
        let advanced_filter = new AdvancedStringFilter();

        switch (filter.filter_type) {
            case ContextFilterVO.TYPE_FILTER_AND:
                this.try_apply_advanced_filters(filter.left_hook, advanced_filters);
                advanced_filters[advanced_filters.length].link_type = AdvancedStringFilter.LINK_TYPE_ET;
                this.try_apply_advanced_filters(filter.right_hook, advanced_filters);
                break;

            case ContextFilterVO.TYPE_FILTER_OR:
                this.try_apply_advanced_filters(filter.left_hook, advanced_filters);
                advanced_filters[advanced_filters.length].link_type = AdvancedStringFilter.LINK_TYPE_OU;
                this.try_apply_advanced_filters(filter.right_hook, advanced_filters);
                break;

            case ContextFilterVO.TYPE_TEXT_STARTSWITH_ANY:
                advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_COMMENCE;
                advanced_filter.filter_content = filter.param_text;
                break;

            case ContextFilterVO.TYPE_TEXT_STARTSWITH_NONE:
                advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_COMMENCE_PAS;
                advanced_filter.filter_content = filter.param_text;
                break;

            case ContextFilterVO.TYPE_TEXT_INCLUDES_ANY:
                advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_CONTIENT;
                advanced_filter.filter_content = filter.param_text;
                break;

            case ContextFilterVO.TYPE_TEXT_INCLUDES_NONE:
                advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_CONTIENT_PAS;
                advanced_filter.filter_content = filter.param_text;
                break;

            case ContextFilterVO.TYPE_NULL_ANY:
                advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_EST_NULL;
                break;

            case ContextFilterVO.TYPE_NULL_NONE:
                advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_NEST_PAS_NULL;
                break;

            case ContextFilterVO.TYPE_TEXT_EQUALS_ANY:
                if (filter.param_text == '') {
                    advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_EST_VIDE;
                    advanced_filter.filter_content = filter.param_text;
                } else {
                    advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_EST;
                    advanced_filter.filter_content = filter.param_text;
                }
                break;
            case ContextFilterVO.TYPE_TEXT_EQUALS_NONE:
                if (filter.param_text == '') {
                    advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_NEST_PAS_VIDE;
                    advanced_filter.filter_content = filter.param_text;
                } else {
                    advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_NEST_PAS;
                    advanced_filter.filter_content = filter.param_text;
                }
                break;

            default:
                throw new Error('Not Implemented');
        }

        advanced_filters.push(advanced_filter);
    }
}
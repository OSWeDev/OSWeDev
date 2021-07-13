import { isEqual } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleContextFilter from '../../../../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DataFilterOption from '../../../../../../shared/modules/DataRender/vos/DataFilterOption';
import NumSegment from '../../../../../../shared/modules/DataRender/vos/NumSegment';
import TimeSegment from '../../../../../../shared/modules/DataRender/vos/TimeSegment';
import ModuleTableField from '../../../../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import './FieldValueFilterWidgetComponent.scss';
import FieldValueFilterWidgetOptions from './options/FieldValueFilterWidgetOptions';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import ObjectHandler from '../../../../../../shared/tools/ObjectHandler';
import TypesHandler from '../../../../../../shared/tools/TypesHandler';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';

@Component({
    template: require('./FieldValueFilterWidgetComponent.pug'),
    components: {
    }
})
export default class FieldValueFilterWidgetComponent extends VueComponentBase {

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

    // private filter_active_options: DataFilterOption[] = [];
    private filter_visible_options: DataFilterOption[] = [];

    private actual_query: string = null;

    private throttled_update_visible_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_visible_options.bind(this), 300, { leading: false });

    // USEFUL ? if yes, implement, if not, delete : private set_active_options_states(options: DataFilterOption[]) {
    //     for (let i in options) {
    //         let option = options[i];

    //         if (filter_active_options.)
    //     }
    // }

    get vo_field_ref_label(): string {
        if ((!this.widget_options) || (!this.vo_field_ref)) {
            return null;
        }

        return this.get_flat_locale_translations[this.vo_field_ref.translatable_name_code_text];
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
        if ((!this.widget_options) || (!this.vo_field_ref)) {
            this.filter_visible_options = [];
            return;
        }

        let tmp = await ModuleContextFilter.getInstance().get_filter_visible_options(
            this.vo_field_ref.api_type_id,
            this.vo_field_ref.field_id,
            this.get_active_field_filters,
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
            if (!!this.tmp_filter_active_options) {
                locale_tmp_filter_active_options = [this.tmp_filter_active_options];
            }
        }

        if ((!locale_tmp_filter_active_options) || (!locale_tmp_filter_active_options.length)) {
            this.remove_active_field_filter({ vo_type: this.vo_field_ref.api_type_id, field_id: this.vo_field_ref.field_id });
            // this.filter_active_options = [];
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
        // this.filter_active_options = locale_tmp_filter_active_options;
    }

    // @Watch('filter_active_options')
    // private async onchange_filter_active_options() {
    //     if (!isEqual(this.tmp_filter_active_options, this.filter_active_options)) {
    //         this.tmp_filter_active_options = this.filter_active_options;
    //     }
    // }

    get placeholder(): string {
        if ((!this.get_flat_locale_translations) || (!this.widget_options) || (!this.get_flat_locale_translations[this.widget_options.placeholder_name_code_text])) {
            return null;
        }

        return this.get_flat_locale_translations[this.widget_options.placeholder_name_code_text];
    }

    // get filter_options(): DataFilterOption[] {
    //     let res: DataFilterOption[] = [];

    //     let id_marker: number[] = [];

    //     for (let i in this.filter_active_options) {
    //         let filter_zone_active_option: DataFilterOption = this.filter_active_options[i];

    //         res.push(new DataFilterOption(DataFilterOption.STATE_SELECTED, filter_zone_active_option.label, filter_zone_active_option.id));
    //         id_marker.push(filter_zone_active_option.id);
    //     }

    //     for (let i in this.selectables_by_ids) {
    //         let vo: IDistantVOBase = this.selectables_by_ids[i];

    //         if (id_marker.indexOf(vo.id) > -1) {
    //             continue;
    //         }

    //         let label = this.get_label(vo);
    //         if (((!!this.actual_query) && (new RegExp('.*' + this.actual_query + '.*', 'i')).test(label)) || (!this.actual_query)) {

    //             res.push(new DataFilterOption(DataFilterOption.STATE_SELECTABLE, label, vo.id));
    //         }
    //     }

    //     if (this.sort_options_func) {
    //         this.sort_options_func(res);
    //     } else {
    //         DataFilterOptionsHandler.getInstance().sort_options(res);
    //     }

    //     return res;
    // }

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

    private get_ContextFilterVO_from_DataFilterOption(active_option: DataFilterOption, field: ModuleTableField<any>): ContextFilterVO {
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
            case ModuleTableField.FIELD_TYPE_amount:
            case ModuleTableField.FIELD_TYPE_foreign_key:
            case ModuleTableField.FIELD_TYPE_isoweekdays:
            case ModuleTableField.FIELD_TYPE_prct:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes:
            case ModuleTableField.FIELD_TYPE_hour:
                translated_active_options.filter_type = ContextFilterVO.TYPE_NUMERIC_INTERSECTS;
                translated_active_options.param_numranges = [RangeHandler.getInstance().create_single_elt_NumRange(active_option.numeric_value, NumSegment.TYPE_INT)];
                break;

            case ModuleTableField.FIELD_TYPE_tstz:
                translated_active_options.filter_type = ContextFilterVO.TYPE_DATE_INTERSECTS;
                translated_active_options.param_tsranges = [RangeHandler.getInstance().create_single_elt_TSRange(
                    active_option.tstz_value, (field.segmentation_type != null) ? field.segmentation_type : TimeSegment.TYPE_DAY)];
                break;

            case ModuleTableField.FIELD_TYPE_html:
            case ModuleTableField.FIELD_TYPE_password:
            case ModuleTableField.FIELD_TYPE_email:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_textarea:
            case ModuleTableField.FIELD_TYPE_translatable_text:
                translated_active_options.filter_type = ContextFilterVO.TYPE_TEXT_INCLUDES_ANY;
                translated_active_options.param_textarray = [active_option.string_value];
                break;

            case ModuleTableField.FIELD_TYPE_html_array:
                throw new Error('Not Implemented');

            case ModuleTableField.FIELD_TYPE_boolean:
                if (!!active_option.boolean_value) {
                    translated_active_options.filter_type = ContextFilterVO.TYPE_BOOLEAN_TRUE_ANY;
                } else {
                    translated_active_options.filter_type = ContextFilterVO.TYPE_BOOLEAN_FALSE_ANY;
                }
                break;

            case ModuleTableField.FIELD_TYPE_numrange:
                throw new Error('Not Implemented');

            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_refrange_array:
                throw new Error('Not Implemented');

            case ModuleTableField.FIELD_TYPE_daterange:
                throw new Error('Not Implemented');

            case ModuleTableField.FIELD_TYPE_hourrange:
                throw new Error('Not Implemented');

            case ModuleTableField.FIELD_TYPE_tsrange:
                throw new Error('Not Implemented');

            case ModuleTableField.FIELD_TYPE_tstzrange_array:
                throw new Error('Not Implemented');

            case ModuleTableField.FIELD_TYPE_hourrange_array:
                throw new Error('Not Implemented');

            case ModuleTableField.FIELD_TYPE_int_array:
            case ModuleTableField.FIELD_TYPE_tstz_array:
                throw new Error('Not Implemented');

            case ModuleTableField.FIELD_TYPE_string_array:
                throw new Error('Not Implemented');

            case ModuleTableField.FIELD_TYPE_date:
            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_month:
                translated_active_options.filter_type = ContextFilterVO.TYPE_DATE_INTERSECTS;
                translated_active_options.param_tsranges = [RangeHandler.getInstance().create_single_elt_TSRange(
                    active_option.tstz_value, (field.segmentation_type != null) ? field.segmentation_type : TimeSegment.TYPE_DAY)];
                break;

            case ModuleTableField.FIELD_TYPE_timestamp:
            case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                throw new Error('Not Implemented');
        }

        return translated_active_options;
    }
}
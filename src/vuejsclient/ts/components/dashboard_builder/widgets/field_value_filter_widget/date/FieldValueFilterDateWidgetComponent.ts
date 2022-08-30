import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterVO from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import SimpleDatatableField from '../../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField';
import DashboardPageVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import TSRange from '../../../../../../../shared/modules/DataRender/vos/TSRange';
import ModuleTableField from '../../../../../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import { ModuleTranslatableTextGetter } from '../../../../InlineTranslatableText/TranslatableTextStore';
import TSRangeInputComponent from '../../../../tsrangeinput/TSRangeInputComponent';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import FieldValueFilterWidgetOptions from '../options/FieldValueFilterWidgetOptions';
import './FieldValueFilterDateWidgetComponent.scss';

@Component({
    template: require('./FieldValueFilterDateWidgetComponent.pug'),
    components: {
        Tsrangeinputcomponent: TSRangeInputComponent
    }
})
export default class FieldValueFilterDateWidgetComponent extends VueComponentBase {

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

    private ts_range: TSRange = null;

    private warn_existing_external_filters: boolean = false;

    private actual_query: string = null;

    @Watch('ts_range')
    private onchange_ts_range() {

        if (!this.widget_options) {
            return;
        }

        if (!this.ts_range) {
            this.remove_active_field_filter({ vo_type: this.vo_field_ref.api_type_id, field_id: this.vo_field_ref.field_id });
            return;
        }

        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[this.vo_field_ref.api_type_id];
        let field = moduletable.get_field_by_id(this.vo_field_ref.field_id);

        this.set_active_field_filter({
            field_id: this.vo_field_ref.field_id,
            vo_type: this.vo_field_ref.api_type_id,
            active_field_filter: this.get_ContextFilterVO_from_DataFilterOption(this.ts_range, field),
        });
    }

    @Watch('widget_options', { immediate: true })
    private async onchange_widget_options() {
        this.ts_range = this.default_values;
    }

    private get_ContextFilterVO_from_DataFilterOption(ts_range: TSRange, field: ModuleTableField<any>): ContextFilterVO {
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

            case ModuleTableField.FIELD_TYPE_tstz:
                translated_active_options.filter_type = ContextFilterVO.TYPE_DATE_INTERSECTS;
                translated_active_options.param_tsranges = [ts_range];
                break;

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

    get vo_field_ref_label(): string {
        if ((!this.widget_options) || (!this.vo_field_ref)) {
            return null;
        }

        return this.get_flat_locale_translations[this.vo_field_ref.get_translatable_name_code_text(this.page_widget.id)];
    }

    get vo_field_ref(): VOFieldRefVO {
        let options: FieldValueFilterWidgetOptions = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
    }

    get segmentation_type(): number {
        let options: FieldValueFilterWidgetOptions = this.widget_options;

        return options ? options.segmentation_type : null;
    }

    get default_values(): TSRange {
        let options: FieldValueFilterWidgetOptions = this.widget_options;

        if (!options) {
            return null;
        }

        return options.default_ts_range_values;
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

    get field_date(): SimpleDatatableField<any, any> {
        return new SimpleDatatableField(this.vo_field_ref.field_id).setModuleTable(VOsTypesManager.getInstance().moduleTables_by_voType[this.vo_field_ref.api_type_id]);
    }
}
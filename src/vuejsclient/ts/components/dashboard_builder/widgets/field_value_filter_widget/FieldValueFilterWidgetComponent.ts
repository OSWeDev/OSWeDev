import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import ModuleTableField from '../../../../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../VueComponentBase';
import FieldValueFilterBooleanWidgetComponent from './boolean/FieldValueFilterBooleanWidgetComponent';
import FieldValueFilterDateWidgetComponent from './date/FieldValueFilterDateWidgetComponent';
import FieldValueFilterEnumWidgetComponent from './enum/FieldValueFilterEnumWidgetComponent';
import './FieldValueFilterWidgetComponent.scss';
import FieldValueFilterNumberWidgetComponent from './number/FieldValueFilterNumberWidgetComponent';
import FieldValueFilterWidgetOptions from './options/FieldValueFilterWidgetOptions';
import FieldValueFilterStringWidgetComponent from './string/FieldValueFilterStringWidgetComponent';

@Component({
    template: require('./FieldValueFilterWidgetComponent.pug'),
    components: {
        Fieldvaluefilterstringwidgetcomponent: FieldValueFilterStringWidgetComponent,
        Fieldvaluefilterbooleanwidgetcomponent: FieldValueFilterBooleanWidgetComponent,
        Fieldvaluefilterenumwidgetcomponent: FieldValueFilterEnumWidgetComponent,
        Fieldvaluefilterdatewidgetcomponent: FieldValueFilterDateWidgetComponent,
        Fieldvaluefilternumberwidgetcomponent: FieldValueFilterNumberWidgetComponent
    }
})
export default class FieldValueFilterWidgetComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    get is_type_boolean(): boolean {

        if ((!this.vo_field_ref) || (!this.vo_field_ref.api_type_id) || (!this.vo_field_ref.field_id)) {
            return false;
        }

        let field = VOsTypesManager.getInstance().moduleTables_by_voType[this.vo_field_ref.api_type_id].get_field_by_id(this.vo_field_ref.field_id);

        if (!field) {
            return false;
        }

        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_boolean:
                return true;

            default:
                return false;
        }
    }

    get is_type_enum(): boolean {

        if ((!this.vo_field_ref) || (!this.vo_field_ref.api_type_id) || (!this.vo_field_ref.field_id)) {
            return false;
        }

        let field = VOsTypesManager.getInstance().moduleTables_by_voType[this.vo_field_ref.api_type_id].get_field_by_id(this.vo_field_ref.field_id);

        if (!field) {
            return false;
        }

        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_enum:
                return true;

            default:
                return false;
        }
    }

    get is_type_date(): boolean {

        if ((!this.vo_field_ref) || (!this.vo_field_ref.api_type_id) || (!this.vo_field_ref.field_id)) {
            return false;
        }

        let field = VOsTypesManager.getInstance().moduleTables_by_voType[this.vo_field_ref.api_type_id].get_field_by_id(this.vo_field_ref.field_id);

        if (!field) {
            return false;
        }

        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_tstz:
                return true;

            default:
                return false;
        }
    }

    get is_type_string(): boolean {

        if ((!this.vo_field_ref) || (!this.vo_field_ref.api_type_id) || (!this.vo_field_ref.field_id)) {
            return false;
        }

        let field = VOsTypesManager.getInstance().moduleTables_by_voType[this.vo_field_ref.api_type_id].get_field_by_id(this.vo_field_ref.field_id);

        if (!field) {
            return false;
        }

        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_html:
            case ModuleTableField.FIELD_TYPE_html_array:
            case ModuleTableField.FIELD_TYPE_email:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_textarea:
            case ModuleTableField.FIELD_TYPE_string_array:
            case ModuleTableField.FIELD_TYPE_translatable_text:
            case ModuleTableField.FIELD_TYPE_file_field:
                return true;

            case ModuleTableField.FIELD_TYPE_password:
            case ModuleTableField.FIELD_TYPE_file_ref:
            case ModuleTableField.FIELD_TYPE_image_field:
            case ModuleTableField.FIELD_TYPE_image_ref:
            case ModuleTableField.FIELD_TYPE_boolean:
            case ModuleTableField.FIELD_TYPE_enum:
            case ModuleTableField.FIELD_TYPE_int:
            case ModuleTableField.FIELD_TYPE_geopoint:
            case ModuleTableField.FIELD_TYPE_float:
            case ModuleTableField.FIELD_TYPE_decimal_full_precision:
            case ModuleTableField.FIELD_TYPE_amount:
            case ModuleTableField.FIELD_TYPE_foreign_key:
            case ModuleTableField.FIELD_TYPE_numrange:
            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_refrange_array:
            case ModuleTableField.FIELD_TYPE_isoweekdays:
            case ModuleTableField.FIELD_TYPE_int_array:
            case ModuleTableField.FIELD_TYPE_float_array:
            case ModuleTableField.FIELD_TYPE_prct:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
            case ModuleTableField.FIELD_TYPE_date:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes:
            case ModuleTableField.FIELD_TYPE_daterange:
            case ModuleTableField.FIELD_TYPE_tstz:
            case ModuleTableField.FIELD_TYPE_tstz_array:
            case ModuleTableField.FIELD_TYPE_tstzrange_array:
            case ModuleTableField.FIELD_TYPE_tsrange:
            case ModuleTableField.FIELD_TYPE_hour:
            case ModuleTableField.FIELD_TYPE_hourrange:
            case ModuleTableField.FIELD_TYPE_hourrange_array:
            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_timewithouttimezone:
            case ModuleTableField.FIELD_TYPE_month:
            case ModuleTableField.FIELD_TYPE_plain_vo_obj:
            default:
                return false;
        }
    }

    get is_type_number(): boolean {

        if ((!this.vo_field_ref) || (!this.vo_field_ref.api_type_id) || (!this.vo_field_ref.field_id)) {
            return false;
        }

        let field = VOsTypesManager.getInstance().moduleTables_by_voType[this.vo_field_ref.api_type_id].get_field_by_id(this.vo_field_ref.field_id);

        if (!field) {

            /**
             * Cas spécifique du field_id == 'id' qu'on voudrait pouvoir filtrer comme un number
             */
            return this.vo_field_ref.field_id == 'id';
        }

        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_int:
            case ModuleTableField.FIELD_TYPE_geopoint:
            case ModuleTableField.FIELD_TYPE_float:
            case ModuleTableField.FIELD_TYPE_decimal_full_precision:
            case ModuleTableField.FIELD_TYPE_amount:
            case ModuleTableField.FIELD_TYPE_prct:
                return true;

            default:
                return false;
        }
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
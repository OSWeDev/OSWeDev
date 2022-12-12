import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import ModuleTableField from '../../../../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import VueComponentBase from '../../../VueComponentBase';
import VoFieldWidgetRefComponent from '../../vo_field_widget_ref/VoFieldWidgetRefComponent';
import './MultipleVoFieldRefHolderComponent.scss';

@Component({
    template: require('./MultipleVoFieldRefHolderComponent.pug'),
    components: {
        Vofieldwidgetrefcomponent: VoFieldWidgetRefComponent
    }
})
export default class MultipleVoFieldRefHolderComponent extends VueComponentBase {

    @Prop({ default: null })
    private vo_field_ref: VOFieldRefVO;

    @Prop({ default: null })
    private vo_field_ref_multiple: VOFieldRefVO[];

    @Prop()
    private page_widget_id: number;

    private remove_field_ref(vo_field_ref: VOFieldRefVO) {
        this.$emit('remove_field_ref', vo_field_ref);
    }

    private allowDrop(event) {
        event.preventDefault();

        if ((!event) || (!event.dataTransfer)) {
            return false;
        }

        let api_type_id: string = event.dataTransfer.getData("api_type_id");
        let field_id: string = event.dataTransfer.getData("field_id");

        if ((!api_type_id) || (!field_id)) {
            return false;
        }

        if (this.vo_field_ref_multiple) {
            if (this.vo_field_ref_multiple.find((e) => (e.api_type_id == api_type_id) && (e.field_id == field_id))) {
                return false;
            }
        }

        if (this.vo_field_ref && (this.vo_field_ref.api_type_id == api_type_id) && (this.vo_field_ref.field_id == field_id)) {
            return false;
        }

        return this.is_same_type_vo_field_ref(api_type_id, field_id);
    }

    private drop(event) {
        event.preventDefault();

        if (!this.allowDrop(event)) {
            return;
        }

        let api_type_id: string = event.dataTransfer.getData("api_type_id");
        let field_id: string = event.dataTransfer.getData("field_id");

        this.$emit('add_field_ref', api_type_id, field_id);
    }

    private is_same_type_vo_field_ref(api_type_id: string, field_id: string): boolean {

        if ((!api_type_id) || (!field_id) || (!this.vo_field_ref)) {
            return false;
        }

        let vo_field_ref_field = VOsTypesManager.moduleTables_by_voType[this.vo_field_ref.api_type_id].get_field_by_id(this.vo_field_ref.field_id);
        let new_field = VOsTypesManager.moduleTables_by_voType[api_type_id].get_field_by_id(field_id);

        if (this.is_type_boolean(vo_field_ref_field)) {
            return this.is_type_boolean(new_field);
        }

        if (this.is_type_enum(vo_field_ref_field)) {
            return this.is_type_enum(new_field);
        }

        if (this.is_type_date(vo_field_ref_field)) {
            return this.is_type_date(new_field);
        }

        if (this.is_type_string(vo_field_ref_field)) {
            return this.is_type_string(new_field);
        }

        if (this.is_type_number(vo_field_ref_field, this.vo_field_ref.field_id)) {
            return this.is_type_number(new_field, field_id);
        }

        return false;
    }

    private is_type_boolean(field: ModuleTableField<any>): boolean {
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

    private is_type_enum(field: ModuleTableField<any>): boolean {
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

    private is_type_date(field: ModuleTableField<any>): boolean {
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

    private is_type_string(field: ModuleTableField<any>): boolean {
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

    private is_type_number(field: ModuleTableField<any>, field_id: string): boolean {
        if (!field) {

            /**
             * Cas spécifique du field_id == 'id' qu'on voudrait pouvoir filtrer comme un number
             */
            return field_id == 'id';
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
}
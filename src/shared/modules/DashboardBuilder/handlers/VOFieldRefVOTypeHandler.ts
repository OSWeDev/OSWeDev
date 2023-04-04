import ModuleTableField from "../../ModuleTableField";
import VOsTypesManager from "../../VOsTypesManager";
import VOFieldRefVO from "../vos/VOFieldRefVO";

/**
 * VO Field Ref VO Type Handler
 *  - vo field ref type manager
 */
export class VOFieldRefVOTypeHandler {

    public static is_type_boolean(vo_field_ref: VOFieldRefVO): boolean {

        if ((!vo_field_ref) || (!vo_field_ref.api_type_id) || (!vo_field_ref.field_id)) {
            return false;
        }

        let field = VOsTypesManager.moduleTables_by_voType[vo_field_ref.api_type_id].get_field_by_id(vo_field_ref.field_id);

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

    public static is_type_enum(vo_field_ref: VOFieldRefVO): boolean {

        if ((!vo_field_ref) || (!vo_field_ref.api_type_id) || (!vo_field_ref.field_id)) {
            return false;
        }

        let field = VOsTypesManager.moduleTables_by_voType[vo_field_ref.api_type_id].get_field_by_id(vo_field_ref.field_id);

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

    public static is_type_date(vo_field_ref: VOFieldRefVO): boolean {

        if ((!vo_field_ref) || (!vo_field_ref.api_type_id) || (!vo_field_ref.field_id)) {
            return false;
        }

        let field = VOsTypesManager.moduleTables_by_voType[vo_field_ref.api_type_id].get_field_by_id(vo_field_ref.field_id);

        if (!field) {
            return false;
        }

        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_tstz:
            case ModuleTableField.FIELD_TYPE_tsrange:
            case ModuleTableField.FIELD_TYPE_tstzrange_array:
            case ModuleTableField.FIELD_TYPE_tstz_array:
                return true;

            default:
                return false;
        }
    }

    public static is_type_string(vo_field_ref: VOFieldRefVO): boolean {

        if ((!vo_field_ref) || (!vo_field_ref.api_type_id) || (!vo_field_ref.field_id)) {
            return false;
        }

        let field = VOsTypesManager.moduleTables_by_voType[vo_field_ref.api_type_id].get_field_by_id(vo_field_ref.field_id);

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

    public static is_type_number(vo_field_ref: VOFieldRefVO): boolean {

        if ((!vo_field_ref) || (!vo_field_ref.api_type_id) || (!vo_field_ref.field_id)) {
            return false;
        }

        let field = VOsTypesManager.moduleTables_by_voType[vo_field_ref.api_type_id].get_field_by_id(vo_field_ref.field_id);

        if (!field) {

            /**
             * Cas spécifique du field_id == 'id' qu'on voudrait pouvoir filtrer comme un number
             */
            return vo_field_ref.field_id == 'id';
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
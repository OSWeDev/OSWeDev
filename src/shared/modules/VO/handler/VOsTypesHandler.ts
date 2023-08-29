import ModuleTableField from '../../ModuleTableField';

/**
 * VOsTypesHandler
 *  - Manager for each VOs Fields
 */
export default class VOsTypesHandler {

    public static is_type_boolean<T>(field: ModuleTableField<T>): boolean {

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

    public static is_type_enum<T>(field: ModuleTableField<T>): boolean {

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

    public static is_type_date<T>(field: ModuleTableField<T>): boolean {

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

    public static is_type_string<T>(field: ModuleTableField<T>): boolean {

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

            default:
                return false;
        }
    }

    public static is_type_number<T>(field: ModuleTableField<T>): boolean {

        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_int:
            case ModuleTableField.FIELD_TYPE_geopoint:
            case ModuleTableField.FIELD_TYPE_float:
            case ModuleTableField.FIELD_TYPE_foreign_key:
            case ModuleTableField.FIELD_TYPE_decimal_full_precision:
            case ModuleTableField.FIELD_TYPE_amount:
            case ModuleTableField.FIELD_TYPE_prct:
                return true;

            default:
                return false;
        }
    }
}
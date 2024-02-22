import TableFieldTypesManager from "../TableFieldTypes/TableFieldTypesManager";
import DefaultTranslation from "../Translation/vos/DefaultTranslation";
import ModuleTableFieldVO from "./vos/ModuleTableFieldVO";

export default class ModuleTableController {

    public static create_new_field<T>(
        field_id: string,                    //titre de la colonne en base
        field_type: string,                  //type de donnée dans la colonne
        field_label: string | DefaultTranslation,   //titre de la colonne a afficher
        field_required: boolean = false,     //si champ obligatoire
        has_default: boolean = false,        //si valeur par defaut
        field_default: T = null              //valeur par defaut
    ) {

        let res: ModuleTableFieldVO = new ModuleTableFieldVO();
        res.field_id = field_id;
        res.field_type = field_type;
        res.field_required = field_required;
        res.has_default = has_default;
        res.field_default = field_default;

        res.cascade_on_delete = field_required;

        if (!field_label) {
            field_label = new DefaultTranslation({ [DefaultTranslation.DEFAULT_LANG_DEFAULT_TRANSLATION]: res.field_id });
        }

        if (typeof field_label === "string") {
            field_label = new DefaultTranslation({ [DefaultTranslation.DEFAULT_LANG_DEFAULT_TRANSLATION]: field_label });
        } else {
            if ((!field_label.default_translations) || (!field_label.default_translations[DefaultTranslation.DEFAULT_LANG_DEFAULT_TRANSLATION])) {
                field_label.default_translations[DefaultTranslation.DEFAULT_LANG_DEFAULT_TRANSLATION] = res.field_id;
            }
        }

        res.field_label = field_label;                     //titre colonne a afficher

        res.target_database = null;                        //la database en base avec laquelle il y a une relation (generalement "ref")

        return res;
    }

    public static validate_field_value(field: ModuleTableFieldVO, data: any): string {
        switch (field.field_type) {
            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                if (data == null || data == "") {
                    return null;
                }
                if (data.toLowerCase().indexOf("h") < 0) {
                    return ModuleTableFieldVO.VALIDATION_CODE_TEXT_need_h;
                }
                return null;

            case ModuleTableFieldVO.FIELD_TYPE_password:
                return ModuleTableController.passwordIsValidProposition(data);

            case ModuleTableFieldVO.FIELD_TYPE_image_field:
            case ModuleTableFieldVO.FIELD_TYPE_image_ref:
            case ModuleTableFieldVO.FIELD_TYPE_file_field:
            case ModuleTableFieldVO.FIELD_TYPE_file_ref:
            case ModuleTableFieldVO.FIELD_TYPE_html:
            case ModuleTableFieldVO.FIELD_TYPE_html_array:
            case ModuleTableFieldVO.FIELD_TYPE_int:
            case ModuleTableFieldVO.FIELD_TYPE_enum:
            case ModuleTableFieldVO.FIELD_TYPE_amount:
            case ModuleTableFieldVO.FIELD_TYPE_boolean:
            case ModuleTableFieldVO.FIELD_TYPE_date:
            case ModuleTableFieldVO.FIELD_TYPE_daterange:
            case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_numrange:
            case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
            // case ModuleTableFieldVO.FIELD_TYPE_daterange_array:
            case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_tstz:
            case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
            case ModuleTableFieldVO.FIELD_TYPE_day:
            case ModuleTableFieldVO.FIELD_TYPE_month:
            case ModuleTableFieldVO.FIELD_TYPE_float:
            case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
            case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
            case ModuleTableFieldVO.FIELD_TYPE_geopoint:
            case ModuleTableFieldVO.FIELD_TYPE_int_array:
            case ModuleTableFieldVO.FIELD_TYPE_float_array:
            case ModuleTableFieldVO.FIELD_TYPE_prct:
            case ModuleTableFieldVO.FIELD_TYPE_email:
            case ModuleTableFieldVO.FIELD_TYPE_string:
            case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:
            case ModuleTableFieldVO.FIELD_TYPE_textarea:
            case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
            case ModuleTableFieldVO.FIELD_TYPE_string_array:
            case ModuleTableFieldVO.FIELD_TYPE_tsrange:
            case ModuleTableFieldVO.FIELD_TYPE_hour:
            case ModuleTableFieldVO.FIELD_TYPE_hourrange:
            case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_timewithouttimezone:
                return null;

            default:
                for (let i in TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers) {
                    let tableFieldTypeController = TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers[i];

                    if (field.field_type == tableFieldTypeController.name) {
                        return tableFieldTypeController.defaultValidator(data, field);
                    }
                }
        }
    }

    private static passwordIsValidProposition(pwd_proposition: string): string {
        if (!pwd_proposition) {
            return ModuleTableFieldVO.VALIDATION_CODE_TEXT_required;
        }

        if (pwd_proposition.length < 8) {
            return ModuleTableFieldVO.VALIDATION_CODE_TEXT_length_min_8;
        }

        // Doit contenir un chiffre
        if (!/[0-9]/.test(pwd_proposition)) {
            return ModuleTableFieldVO.VALIDATION_CODE_TEXT_need_number;
        }

        // Doit contenir une minuscule
        if (!/[a-z]/.test(pwd_proposition)) {
            return ModuleTableFieldVO.VALIDATION_CODE_TEXT_need_lowercase;
        }

        // Doit contenir une majuscule
        if (!/[A-Z]/.test(pwd_proposition)) {
            return ModuleTableFieldVO.VALIDATION_CODE_TEXT_need_uppercase;
        }

        return null;
    }
}
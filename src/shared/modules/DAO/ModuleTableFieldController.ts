import TableFieldTypesManager from "../TableFieldTypes/TableFieldTypesManager";
import DefaultTranslationVO from "../Translation/vos/DefaultTranslationVO";
import ModuleTableFieldVO from "./vos/ModuleTableFieldVO";

export default class ModuleTableFieldController {

    public static GENERATOR_default_field_translations: { [vo_type: string]: { [field_name: string]: DefaultTranslationVO } } = {};

    public static create_new<T>(
        vo_type: string,
        field_name: string,                    //titre de la colonne en base
        field_type: string,                  //type de donnée dans la colonne
        field_label: string | DefaultTranslationVO,   //titre de la colonne a afficher
        field_required: boolean = false,     //si champ obligatoire
        has_default: boolean = false,        //si valeur par defaut
        field_default: T = null              //valeur par defaut
    ): ModuleTableFieldVO {
        let res: ModuleTableFieldVO = new ModuleTableFieldVO();

        res.module_table_name = vo_type;
        res.field_name = field_name;
        res.field_type = field_type;
        res.field_required = field_required;
        res.has_default = has_default;

        if (has_default) {
            res.field_default_value = {
                value: typeof field_default == 'undefined' ? null : field_default,
            };
        }

        res.cascade_on_delete = field_required;

        if (!field_label) {
            field_label = DefaultTranslationVO.create_new({ [DefaultTranslationVO.DEFAULT_LANG_DEFAULT_TRANSLATION]: res.field_name });
        }

        if (typeof field_label === "string") {
            field_label = DefaultTranslationVO.create_new({ [DefaultTranslationVO.DEFAULT_LANG_DEFAULT_TRANSLATION]: field_label });
        } else {
            if ((!field_label.default_translations) || (!field_label.default_translations[DefaultTranslationVO.DEFAULT_LANG_DEFAULT_TRANSLATION])) {
                field_label.default_translations[DefaultTranslationVO.DEFAULT_LANG_DEFAULT_TRANSLATION] = res.field_name;
            }
        }

        if (!ModuleTableFieldController.GENERATOR_default_field_translations[vo_type]) {
            ModuleTableFieldController.GENERATOR_default_field_translations[vo_type] = {};
        }
        ModuleTableFieldController.GENERATOR_default_field_translations[vo_type][field_name] = field_label;

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
                return ModuleTableFieldController.passwordIsValidProposition(data);

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
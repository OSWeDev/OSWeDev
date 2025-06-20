import { query } from "../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ModuleTableFieldVO from "../../../../../shared/modules/DAO/vos/ModuleTableFieldVO";
import DefaultTranslationVO from "../../../../../shared/modules/Translation/vos/DefaultTranslationVO";
import LangVO from "../../../../../shared/modules/Translation/vos/LangVO";
import TranslatableTextVO from "../../../../../shared/modules/Translation/vos/TranslatableTextVO";
import TranslationVO from "../../../../../shared/modules/Translation/vos/TranslationVO";
import { field_names } from "../../../../../shared/tools/ObjectHandler";

export default class AssistantVoFieldDescription {
    public api_type_id: string;
    public error?: string;

    public vo_field_name: string;
    public name: string;
    public description: string;

    /**
     *
     */
    public vo_field_type: string;

    public static async from_vo_field(vo_field: ModuleTableFieldVO): Promise<AssistantVoFieldDescription> {
        const res: AssistantVoFieldDescription = new AssistantVoFieldDescription();
        res.vo_field_name = vo_field.field_name;
        res.api_type_id = vo_field._type;

        if (vo_field.default_translation && vo_field.default_translation.code_text) {
            const trad = await query(TranslationVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<TranslatableTextVO>().code_text, vo_field.default_translation.code_text, TranslatableTextVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<LangVO>().code_lang, DefaultTranslationVO.DEFAULT_LANG_DEFAULT_TRANSLATION, LangVO.API_TYPE_ID)
                .exec_as_server()
                .select_vo<TranslationVO>();
            res.name = trad ? trad.translated : null;
        }

        res.description = vo_field.description;
        res.vo_field_type = AssistantVoFieldDescription.get_vo_field_type_from_vo_field(vo_field);
        return res;
    }

    public static get_vo_field_type_from_vo_field(vo_field: ModuleTableFieldVO): string {
        switch (vo_field.field_type) {
            case ModuleTableFieldVO.FIELD_TYPE_file_ref:
            case ModuleTableFieldVO.FIELD_TYPE_image_ref:
            case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                return 'foreign_key';

            case ModuleTableFieldVO.FIELD_TYPE_html:
                return 'html';
            case ModuleTableFieldVO.FIELD_TYPE_html_array:
                return 'array of html';
            case ModuleTableFieldVO.FIELD_TYPE_email:
                return 'email';
            case ModuleTableFieldVO.FIELD_TYPE_color:
                return 'color';
            case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:
                return 'json';

            case ModuleTableFieldVO.FIELD_TYPE_translatable_string:
                return 'translatable_string'; // pas clair que ça serve à quelque chose ces types ésotériques, un throw c'est ptetre plus adapté en vrai....

            case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
                return 'translatable_code_text';

            case ModuleTableFieldVO.FIELD_TYPE_password:
                return 'encrypted_password';

            case ModuleTableFieldVO.FIELD_TYPE_file_field:
            case ModuleTableFieldVO.FIELD_TYPE_image_field:
                return 'local_path_to_file';

            case ModuleTableFieldVO.FIELD_TYPE_textarea:
            case ModuleTableFieldVO.FIELD_TYPE_string:
                return 'text';

            case ModuleTableFieldVO.FIELD_TYPE_boolean:
                return 'boolean';
            case ModuleTableFieldVO.FIELD_TYPE_enum:
                let res = 'enum - value is the key of the value. valid key/value pairs : [';
                let first = true;
                for (const key in vo_field.enum_values) {
                    res += (first ? '' : ',') + '(' + key + ':' + vo_field.enum_values[key] + ')';
                    first = false;
                }
                return res + ']';

            case ModuleTableFieldVO.FIELD_TYPE_int:
                return 'integer';
            case ModuleTableFieldVO.FIELD_TYPE_float:
            case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                return 'float';

            case ModuleTableFieldVO.FIELD_TYPE_amount:
                return 'amount - as float';

            case ModuleTableFieldVO.FIELD_TYPE_geopoint:
                return 'geopoint'; // TODO FIXME: voir comment préciser ce cas

            case ModuleTableFieldVO.FIELD_TYPE_tstz:
                return 'date as utc unix timestamp in seconds';

            case ModuleTableFieldVO.FIELD_TYPE_daterange:
                return 'daterange as [start_date, end_date]';
            case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                return 'tsrange'; // TODO FIXME: voir comment on pourrait gérer ce cas
            case ModuleTableFieldVO.FIELD_TYPE_hour:
                return 'hour as float';
            case ModuleTableFieldVO.FIELD_TYPE_hourrange:
                return 'hourrange'; // TODO FIXME: voir comment on pourrait gérer ce cas
            case ModuleTableFieldVO.FIELD_TYPE_int_array:
                return 'array of integers';
            case ModuleTableFieldVO.FIELD_TYPE_float_array:
                return 'array of floats';
            case ModuleTableFieldVO.FIELD_TYPE_string_array:
                return 'array of strings';
            case ModuleTableFieldVO.FIELD_TYPE_color_array:
                return 'array of colors';
            case ModuleTableFieldVO.FIELD_TYPE_prct:
                return 'percentage as float (1 == 100%)';
            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                return 'hours and minutes as float (35.5 == 35h30)';
            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                return 'hours and minutes as float (23.5 == 23h30) limited to 24h';
            case ModuleTableFieldVO.FIELD_TYPE_numrange:
                return 'numrange'; // TODO FIXME: voir comment on pourrait gérer ce cas
            case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                return 'array of numranges'; // TODO FIXME: voir comment on pourrait gérer ce cas
            case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                return 'array of ranges of references'; // TODO FIXME: voir comment on pourrait gérer ce cas
            case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                return 'array of dates as utc unix timestamp in seconds';
            case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                return 'array of tsranges'; // TODO FIXME: voir comment on pourrait gérer ce cas
            case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
                return 'array of hourranges'; // TODO FIXME: voir comment on pourrait gérer ce cas

            case ModuleTableFieldVO.FIELD_TYPE_day:
            case ModuleTableFieldVO.FIELD_TYPE_date:
                return 'moment object'; // TODO FIXME On devrait supprimer ces types
            case ModuleTableFieldVO.FIELD_TYPE_month:
                return 'moment object'; // TODO FIXME On devrait supprimer ces types
            case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                return 'array of integers (1-7)'; // TODO FIXME On devrait supprimer ces types
            case ModuleTableFieldVO.FIELD_TYPE_timewithouttimezone:
                return 'time without timezone'; // TODO FIXME On devrait supprimer ces types

            default:
                throw new Error('Unknown vo_field_type: ' + vo_field.field_type);
        }
    }
}
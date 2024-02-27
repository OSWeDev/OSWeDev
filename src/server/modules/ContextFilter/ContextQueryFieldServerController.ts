import moment from 'moment';
import ContextQueryFieldVO from '../../../shared/modules/ContextFilter/vos/ContextQueryFieldVO';
import ModuleTableFieldVO from '../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import DataFilterOption from '../../../shared/modules/DataRender/vos/DataFilterOption';
import ConversionHandler from '../../../shared/tools/ConversionHandler';
import ModuleTableFieldController from '../../../shared/modules/DAO/ModuleTableFieldController';

export default class ContextQueryFieldServerController {

    public static translate_db_res_to_dataoption(
        query_field: ContextQueryFieldVO,
        db_res: any
    ): DataFilterOption[] {

        if (db_res == null) {
            /**
             * TODO FIXME a voir si on retourne pas une option explicite et sélectionnable
             */
            return null;
        }

        const field = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[query_field.api_type_id][query_field.field_name];
        const field_type = field ? field.field_type : ((query_field.field_name == 'id') ? ModuleTableFieldVO.FIELD_TYPE_int : null);
        const res: DataFilterOption[] = [];

        let use_default_res = true;
        const default_res = new DataFilterOption(
            DataFilterOption.STATE_SELECTABLE,
            db_res.toString(),
            null
        );
        switch (field_type) {
            case ModuleTableFieldVO.FIELD_TYPE_enum:
                default_res.numeric_value = ConversionHandler.forceNumber(db_res);
                default_res.string_value = (default_res.numeric_value == null) ? null : field.enum_values[default_res.numeric_value];
                default_res.label = default_res.string_value;
                break;

            case ModuleTableFieldVO.FIELD_TYPE_file_ref:
            case ModuleTableFieldVO.FIELD_TYPE_image_field:
            case ModuleTableFieldVO.FIELD_TYPE_image_ref:
            case ModuleTableFieldVO.FIELD_TYPE_int:
            case ModuleTableFieldVO.FIELD_TYPE_geopoint:
            case ModuleTableFieldVO.FIELD_TYPE_float:
            case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
            case ModuleTableFieldVO.FIELD_TYPE_amount:
            case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
            case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
            case ModuleTableFieldVO.FIELD_TYPE_prct:
            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
            case ModuleTableFieldVO.FIELD_TYPE_hour:
                default_res.numeric_value = ConversionHandler.forceNumber(db_res);
                break;

            case ModuleTableFieldVO.FIELD_TYPE_tstz:
                default_res.tstz_value = parseInt(db_res.toString());
                break;


            case ModuleTableFieldVO.FIELD_TYPE_email:
                if (db_res && db_res.trim) {
                    default_res.string_value = db_res.trim();
                }
                break;

            case ModuleTableFieldVO.FIELD_TYPE_html:
            case ModuleTableFieldVO.FIELD_TYPE_password:
            case ModuleTableFieldVO.FIELD_TYPE_string:
            case ModuleTableFieldVO.FIELD_TYPE_file_field:
            case ModuleTableFieldVO.FIELD_TYPE_textarea:
            case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
                default_res.string_value = db_res;
                break;


            case ModuleTableFieldVO.FIELD_TYPE_boolean:
                default_res.boolean_value = db_res;
                break;

            case ModuleTableFieldVO.FIELD_TYPE_html_array:
            case ModuleTableFieldVO.FIELD_TYPE_string_array:
                use_default_res = false;
                for (const i in db_res) {
                    const db_i_res = db_res[i];
                    const data_option = new DataFilterOption(
                        DataFilterOption.STATE_SELECTABLE,
                        db_i_res,
                        null
                    );
                    data_option.string_value = db_i_res;
                    data_option.init_text_uid();
                    res.push(data_option);
                }
                break;

            case ModuleTableFieldVO.FIELD_TYPE_numrange:
            case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_daterange:
            case ModuleTableFieldVO.FIELD_TYPE_hourrange:
            case ModuleTableFieldVO.FIELD_TYPE_tsrange:
            case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_int_array:
            case ModuleTableFieldVO.FIELD_TYPE_float_array:
            case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
            case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:
                throw new Error('Not Implemented');

            case ModuleTableFieldVO.FIELD_TYPE_date:
            case ModuleTableFieldVO.FIELD_TYPE_day:
            case ModuleTableFieldVO.FIELD_TYPE_month:
                default_res.tstz_value = moment(db_res).utc(true).unix();
                break;

            case ModuleTableFieldVO.FIELD_TYPE_timewithouttimezone:
                throw new Error('Not Implemented');
        }

        if (use_default_res) {
            default_res.init_text_uid();
            res.push(default_res);
        }

        return res;
    }

    public static apply_modifier(context_query_field: ContextQueryFieldVO, field_query_statement: string): string {

        switch (context_query_field.modifier) {
            case ContextQueryFieldVO.FIELD_MODIFIER_DISTINCT:
                return "DISTINCT(" + field_query_statement + ")";

            case ContextQueryFieldVO.FIELD_MODIFIER_LOWER:
                return "LOWER(" + field_query_statement + ")";

            case ContextQueryFieldVO.FIELD_MODIFIER_NULL_IF_NAN:
                return "NULLIF(" + field_query_statement + ", 'NaN')";

            case ContextQueryFieldVO.FIELD_MODIFIER_NULL_IF_NO_COLUMN: {
                const cast_with = context_query_field.cast_with;

                let null_modifier = "(NULL)";

                if (cast_with?.length > 0) {
                    null_modifier += "::" + cast_with;
                }

                return null_modifier + " as " + field_query_statement;
            }

            case ContextQueryFieldVO.FIELD_MODIFIER_FIELD_AS_EXPLICIT_API_TYPE_ID:
                const api_type_id = context_query_field.api_type_id;

                return `('${api_type_id}')::text as ${field_query_statement}`;

            case ContextQueryFieldVO.FIELD_MODIFIER_NONE:

            default:
                break;
        }

        return field_query_statement;
    }
}
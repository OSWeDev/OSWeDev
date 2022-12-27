import ContextQueryFieldVO from '../../../shared/modules/ContextFilter/vos/ContextQueryFieldVO';
import DataFilterOption from '../../../shared/modules/DataRender/vos/DataFilterOption';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ConversionHandler from '../../../shared/tools/ConversionHandler';
import moment = require('moment');

export default class ContextQueryFieldServerController {

    public static getInstance() {
        if (!ContextQueryFieldServerController.instance) {
            ContextQueryFieldServerController.instance = new ContextQueryFieldServerController();
        }
        return ContextQueryFieldServerController.instance;
    }

    private static instance: ContextQueryFieldServerController = null;

    private constructor() { }

    public async configure() {
    }

    public translate_db_res_to_dataoption(
        query_field: ContextQueryFieldVO,
        db_res: any
    ): DataFilterOption {

        if (db_res == null) {
            /**
             * TODO FIXME a voir si on retourne pas une option explicite et sélectionnable
             */
            return null;
        }

        let field = VOsTypesManager.getInstance().moduleTables_by_voType[query_field.api_type_id].get_field_by_id(query_field.field_id);
        let field_type = field ? field.field_type : ((query_field.field_id == 'id') ? ModuleTableField.FIELD_TYPE_int : null);
        let res: DataFilterOption = new DataFilterOption(
            DataFilterOption.STATE_SELECTABLE,
            db_res.toString(),
            null
        );
        switch (field_type) {
            case ModuleTableField.FIELD_TYPE_enum:
                res.numeric_value = ConversionHandler.forceNumber(db_res);
                res.string_value = (res.numeric_value == null) ? null : field.enum_values[res.numeric_value];
                res.label = res.string_value;
                break;

            case ModuleTableField.FIELD_TYPE_file_ref:
            case ModuleTableField.FIELD_TYPE_image_field:
            case ModuleTableField.FIELD_TYPE_image_ref:
            case ModuleTableField.FIELD_TYPE_int:
            case ModuleTableField.FIELD_TYPE_geopoint:
            case ModuleTableField.FIELD_TYPE_float:
            case ModuleTableField.FIELD_TYPE_decimal_full_precision:
            case ModuleTableField.FIELD_TYPE_amount:
            case ModuleTableField.FIELD_TYPE_foreign_key:
            case ModuleTableField.FIELD_TYPE_isoweekdays:
            case ModuleTableField.FIELD_TYPE_prct:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes:
            case ModuleTableField.FIELD_TYPE_hour:
                res.numeric_value = ConversionHandler.forceNumber(db_res);
                break;

            case ModuleTableField.FIELD_TYPE_tstz:
                res.tstz_value = parseInt(db_res.toString());
                break;


            case ModuleTableField.FIELD_TYPE_email:
                if (db_res && db_res.trim) {
                    res.string_value = db_res.trim();
                }
                break;

            case ModuleTableField.FIELD_TYPE_html:
            case ModuleTableField.FIELD_TYPE_password:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_file_field:
            case ModuleTableField.FIELD_TYPE_textarea:
            case ModuleTableField.FIELD_TYPE_translatable_text:
                res.string_value = db_res;
                break;

            case ModuleTableField.FIELD_TYPE_html_array:

            case ModuleTableField.FIELD_TYPE_boolean:
                res.boolean_value = db_res;
                break;

            case ModuleTableField.FIELD_TYPE_numrange:
            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_refrange_array:
            case ModuleTableField.FIELD_TYPE_daterange:
            case ModuleTableField.FIELD_TYPE_hourrange:
            case ModuleTableField.FIELD_TYPE_tsrange:
            case ModuleTableField.FIELD_TYPE_tstzrange_array:
            case ModuleTableField.FIELD_TYPE_hourrange_array:
            case ModuleTableField.FIELD_TYPE_int_array:
            case ModuleTableField.FIELD_TYPE_float_array:
            case ModuleTableField.FIELD_TYPE_tstz_array:
            case ModuleTableField.FIELD_TYPE_string_array:
            case ModuleTableField.FIELD_TYPE_plain_vo_obj:
                throw new Error('Not Implemented');

            case ModuleTableField.FIELD_TYPE_date:
            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_month:
                res.tstz_value = moment(db_res).utc(true).unix();
                break;

            case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                throw new Error('Not Implemented');
        }

        res.init_text_uid();
        return res;
    }

    public apply_modifier(context_query_field: ContextQueryFieldVO, field_query_statement: string): string {
        switch (context_query_field.modifier) {
            case ContextQueryFieldVO.FIELD_MODIFIER_LOWER:
                return "LOWER(" + field_query_statement + ")";
            case ContextQueryFieldVO.FIELD_MODIFIER_NULL_IF_NAN:
                return "NULLIF(" + field_query_statement + ", 'NaN')";
            case ContextQueryFieldVO.FIELD_MODIFIER_NONE:
            default:
                break;
        }

        return field_query_statement;
    }
}
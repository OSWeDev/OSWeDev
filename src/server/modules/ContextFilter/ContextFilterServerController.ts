import { cloneDeep } from 'lodash';
import moment = require('moment');
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import ContextFilterVO from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import SortByVO from '../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import DataFilterOption from '../../../shared/modules/DataRender/vos/DataFilterOption';
import NumRange from '../../../shared/modules/DataRender/vos/NumRange';
import ModuleTable from '../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ConversionHandler from '../../../shared/tools/ConversionHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import RangeHandler from '../../../shared/tools/RangeHandler';
import StackContext from '../../StackContext';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import FieldPathWrapper from './vos/FieldPathWrapper';
import TypesPathElt from './vos/TypesPathElt';

export default class ContextFilterServerController {

    public static getInstance() {
        if (!ContextFilterServerController.instance) {
            ContextFilterServerController.instance = new ContextFilterServerController();
        }
        return ContextFilterServerController.instance;
    }

    private static instance: ContextFilterServerController = null;

    private constructor() { }

    public async configure() {
    }

    /**
     * Builds a query to return the field values according to the context filters
     * @param api_type_id
     * @param field_id null returns all fields as would a getvo
     * @param get_active_field_filters
     * @param active_api_type_ids
     * @param limit
     * @param offset
     * @param res_field_alias ignored if field_id is null
     * @returns
     */
    public build_request_from_active_field_filters(
        api_type_ids: string[],
        field_ids: string[],
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[],
        limit: number,
        offset: number,
        sort_by: SortByVO,
        res_field_aliases: string[],
        is_delete: boolean = false
    ): string {

        let res = this.build_request_from_active_field_filters_(
            api_type_ids,
            field_ids,
            get_active_field_filters,
            active_api_type_ids,
            sort_by,
            res_field_aliases
        );

        if (limit) {
            res += ' LIMIT ' + limit;

            if (offset) {
                res += ' OFFSET ' + offset;
            }
        }

        return res;
    }

    public build_request_from_active_field_filters_count(
        api_type_ids: string[],
        field_ids: string[],
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[],
        res_field_aliases: string[]
    ): string {

        let res = 'SELECT COUNT(*) c FROM (' + this.build_request_from_active_field_filters_(
            api_type_ids,
            field_ids,
            get_active_field_filters,
            active_api_type_ids,
            null,
            res_field_aliases
        ) + ') as tocount';

        return res;
    }

    public translate_db_res_to_dataoption(
        api_type_id: string,
        field_id: string,
        db_res: any
    ): DataFilterOption {

        if (db_res == null) {
            /**
             * TODO FIXME a voir si on retourne pas une option explicite et sélectionnable
             */
            return null;
        }

        let field = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id].get_field_by_id(field_id);
        let res: DataFilterOption = new DataFilterOption(
            DataFilterOption.STATE_SELECTABLE,
            db_res.toString(),
            null
        );
        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_enum:
                res.numeric_value = ConversionHandler.forceNumber(db_res);
                res.string_value = (res.numeric_value == null) ? null : field.enum_values[res.numeric_value];
                res.label = res.string_value;
                break;

            case ModuleTableField.FIELD_TYPE_file_field:
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

    public update_where_conditions(
        where_conditions: string[],
        active_field_filter: ContextFilterVO,
        tables_aliases_by_type: { [vo_type: string]: string }
    ) {

        let field_id = tables_aliases_by_type[active_field_filter.vo_type] + '.' + active_field_filter.field_id;
        let field = VOsTypesManager.getInstance().moduleTables_by_voType[active_field_filter.vo_type].get_field_by_id(active_field_filter.field_id);

        switch (active_field_filter.filter_type) {

            case ContextFilterVO.TYPE_BOOLEAN_TRUE_ALL:
            case ContextFilterVO.TYPE_BOOLEAN_TRUE_ANY:
                where_conditions.push(field_id + " = TRUE");
                break;
            case ContextFilterVO.TYPE_BOOLEAN_FALSE_ALL:
            case ContextFilterVO.TYPE_BOOLEAN_FALSE_ANY:
                where_conditions.push(field_id + " = FALSE");
                break;

            case ContextFilterVO.TYPE_TEXT_INCLUDES_ANY:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_string:
                    case ModuleTableField.FIELD_TYPE_html:
                    case ModuleTableField.FIELD_TYPE_textarea:
                    case ModuleTableField.FIELD_TYPE_translatable_text:
                    case ModuleTableField.FIELD_TYPE_email:
                    case ModuleTableField.FIELD_TYPE_password:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push(field_id + " ILIKE '%" + text + "%'");
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'%" + text + "%'");
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push(field_id + " ILIKE ANY(ARRAY[" + like_array.join(',') + "])");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_string_array:
                    case ModuleTableField.FIELD_TYPE_html_array:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push("'%" + text + "%' ILIKE ANY(" + field_id + ')');
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'%" + text + "%' ILIKE ANY(" + field_id + ')');
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push("(" + like_array.join(') OR (') + ")");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_DATE_EQUALS:
                throw new Error('Not Implemented');

            case ContextFilterVO.TYPE_TEXT_EQUALS_ALL:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_string:
                    case ModuleTableField.FIELD_TYPE_html:
                    case ModuleTableField.FIELD_TYPE_textarea:
                    case ModuleTableField.FIELD_TYPE_translatable_text:
                    case ModuleTableField.FIELD_TYPE_email:
                    case ModuleTableField.FIELD_TYPE_password:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push(field_id + " = '" + text + "'");
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'" + text + "'");
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            // TODO on peut aussi identifie qu'on a plusieurs chaines différentes et fuir la requete (si on doit être = à TOUS il vaut mieux en avoir qu'un...)
                            where_conditions.push(field_id + " = ALL(ARRAY[" + like_array.join(',') + "])");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_string_array:
                    case ModuleTableField.FIELD_TYPE_html_array:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push("'" + active_field_filter.param_text + "' = ALL(" + field_id + ")");
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                like_array.push(text.replace(/'/g, "''"));
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push("['" + like_array.join("','") + "'] <@ " + field_id + " AND ['" + like_array.join("','") + "'] @> " + field_id);
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_TEXT_EQUALS_ANY:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_string:
                    case ModuleTableField.FIELD_TYPE_html:
                    case ModuleTableField.FIELD_TYPE_textarea:
                    case ModuleTableField.FIELD_TYPE_translatable_text:
                    case ModuleTableField.FIELD_TYPE_email:
                    case ModuleTableField.FIELD_TYPE_password:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push(field_id + " = '" + text + "'");
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'" + text + "'");
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push(field_id + " = ANY(ARRAY[" + like_array.join(',') + "])");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_string_array:
                    case ModuleTableField.FIELD_TYPE_html_array:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push("'" + active_field_filter.param_text + "' = ANY(" + field_id + ")");
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'" + text + "' = ANY(" + field_id + ')');
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push("(" + like_array.join(') OR (') + ")");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_TEXT_STARTSWITH_ANY:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_string:
                    case ModuleTableField.FIELD_TYPE_html:
                    case ModuleTableField.FIELD_TYPE_textarea:
                    case ModuleTableField.FIELD_TYPE_translatable_text:
                    case ModuleTableField.FIELD_TYPE_email:
                    case ModuleTableField.FIELD_TYPE_password:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push(field_id + " ILIKE '" + text + "%'");
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'" + text + "%'");
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push(field_id + " ILIKE ANY(ARRAY[" + like_array.join(',') + "])");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_string_array:
                    case ModuleTableField.FIELD_TYPE_html_array:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push("'" + text + "%' ILIKE ANY(" + field_id + ')');
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'" + text + "%' ILIKE ANY(" + field_id + ')');
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push("(" + like_array.join(') OR (') + ")");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_TEXT_ENDSWITH_ANY:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_string:
                    case ModuleTableField.FIELD_TYPE_html:
                    case ModuleTableField.FIELD_TYPE_textarea:
                    case ModuleTableField.FIELD_TYPE_translatable_text:
                    case ModuleTableField.FIELD_TYPE_email:
                    case ModuleTableField.FIELD_TYPE_password:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push(field_id + " ILIKE '%" + text + "'");
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'%" + text + "'");
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push(field_id + " ILIKE ANY(ARRAY[" + like_array.join(',') + "])");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_string_array:
                    case ModuleTableField.FIELD_TYPE_html_array:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push("'%" + text + "' ILIKE ANY(" + field_id + ')');
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'%" + text + "' ILIKE ANY(" + field_id + ')');
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push("(" + like_array.join(') OR (') + ")");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_TEXT_EQUALS_NONE:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_string:
                    case ModuleTableField.FIELD_TYPE_html:
                    case ModuleTableField.FIELD_TYPE_textarea:
                    case ModuleTableField.FIELD_TYPE_translatable_text:
                    case ModuleTableField.FIELD_TYPE_email:
                    case ModuleTableField.FIELD_TYPE_password:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push(field_id + " != '" + text + "'");
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'" + text + "'");
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push(field_id + " != ALL(ARRAY[" + like_array.join(',') + "])");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_string_array:
                    case ModuleTableField.FIELD_TYPE_html_array:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push("'" + active_field_filter.param_text + "' != ALL(" + field_id + ")");
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'" + text + "' != ALL(" + field_id + ')');
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push("(" + like_array.join(') AND (') + ")");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_TEXT_INCLUDES_NONE:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_string:
                    case ModuleTableField.FIELD_TYPE_html:
                    case ModuleTableField.FIELD_TYPE_textarea:
                    case ModuleTableField.FIELD_TYPE_translatable_text:
                    case ModuleTableField.FIELD_TYPE_email:
                    case ModuleTableField.FIELD_TYPE_password:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push(field_id + " NOT ILIKE '%" + text + "%'");
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'%" + text + "%'");
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push(field_id + " NOT ILIKE ALL(ARRAY[" + like_array.join(',') + "])");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_string_array:
                    case ModuleTableField.FIELD_TYPE_html_array:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push("'%" + text + "%' NOT ILIKE ALL(" + field_id + ')');
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'%" + text + "%' NOT ILIKE ALL(" + field_id + ')');
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push("(" + like_array.join(') AND (') + ")");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_TEXT_STARTSWITH_NONE:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_string:
                    case ModuleTableField.FIELD_TYPE_html:
                    case ModuleTableField.FIELD_TYPE_textarea:
                    case ModuleTableField.FIELD_TYPE_translatable_text:
                    case ModuleTableField.FIELD_TYPE_email:
                    case ModuleTableField.FIELD_TYPE_password:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push(field_id + " NOT ILIKE '" + text + "%'");
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'" + text + "%'");
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push(field_id + " NOT ILIKE ALL(ARRAY[" + like_array.join(',') + "])");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_string_array:
                    case ModuleTableField.FIELD_TYPE_html_array:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push("'" + text + "%' NOT ILIKE ALL(" + field_id + ')');
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'" + text + "%' NOT ILIKE ALL(" + field_id + ')');
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push("(" + like_array.join(') AND (') + ")");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_TEXT_ENDSWITH_NONE:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_string:
                    case ModuleTableField.FIELD_TYPE_html:
                    case ModuleTableField.FIELD_TYPE_textarea:
                    case ModuleTableField.FIELD_TYPE_translatable_text:
                    case ModuleTableField.FIELD_TYPE_email:
                    case ModuleTableField.FIELD_TYPE_password:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push(field_id + " NOT ILIKE '%" + text + "'");
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'%" + text + "'");
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push(field_id + " NOT ILIKE ALL(ARRAY[" + like_array.join(',') + "])");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_string_array:
                    case ModuleTableField.FIELD_TYPE_html_array:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push("'%" + text + "' NOT ILIKE ALL(" + field_id + ')');
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'%" + text + "' NOT ILIKE ALL(" + field_id + ')');
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push("(" + like_array.join(') AND (') + ")");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_NUMERIC_INFEQ_ALL:
            case ContextFilterVO.TYPE_NUMERIC_INFEQ_ANY:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_amount:
                    case ModuleTableField.FIELD_TYPE_enum:
                    case ModuleTableField.FIELD_TYPE_file_ref:
                    case ModuleTableField.FIELD_TYPE_float:
                    case ModuleTableField.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableField.FIELD_TYPE_foreign_key:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableField.FIELD_TYPE_image_ref:
                    case ModuleTableField.FIELD_TYPE_int:
                    case ModuleTableField.FIELD_TYPE_prct:
                    case ModuleTableField.FIELD_TYPE_tstz:
                        if (active_field_filter.param_numeric != null) {
                            where_conditions.push(field_id + " <= " + active_field_filter.param_numeric);
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_isoweekdays:
                    case ModuleTableField.FIELD_TYPE_int_array:
                    case ModuleTableField.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_numrange:
                    case ModuleTableField.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_numrange_array:
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    case ModuleTableField.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_NUMERIC_INF_ALL:
            case ContextFilterVO.TYPE_NUMERIC_INF_ANY:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_amount:
                    case ModuleTableField.FIELD_TYPE_enum:
                    case ModuleTableField.FIELD_TYPE_file_ref:
                    case ModuleTableField.FIELD_TYPE_float:
                    case ModuleTableField.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableField.FIELD_TYPE_foreign_key:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableField.FIELD_TYPE_image_ref:
                    case ModuleTableField.FIELD_TYPE_int:
                    case ModuleTableField.FIELD_TYPE_prct:
                    case ModuleTableField.FIELD_TYPE_tstz:
                        if (active_field_filter.param_numeric != null) {
                            where_conditions.push(field_id + " < " + active_field_filter.param_numeric);
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_isoweekdays:
                    case ModuleTableField.FIELD_TYPE_int_array:
                    case ModuleTableField.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_numrange:
                    case ModuleTableField.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_numrange_array:
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    case ModuleTableField.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_NUMERIC_SUP_ALL:
            case ContextFilterVO.TYPE_NUMERIC_SUP_ANY:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_amount:
                    case ModuleTableField.FIELD_TYPE_enum:
                    case ModuleTableField.FIELD_TYPE_file_ref:
                    case ModuleTableField.FIELD_TYPE_float:
                    case ModuleTableField.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableField.FIELD_TYPE_foreign_key:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableField.FIELD_TYPE_image_ref:
                    case ModuleTableField.FIELD_TYPE_int:
                    case ModuleTableField.FIELD_TYPE_prct:
                    case ModuleTableField.FIELD_TYPE_tstz:
                        if (active_field_filter.param_numeric != null) {
                            where_conditions.push(field_id + " > " + active_field_filter.param_numeric);
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_isoweekdays:
                    case ModuleTableField.FIELD_TYPE_int_array:
                    case ModuleTableField.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_numrange:
                    case ModuleTableField.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_numrange_array:
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    case ModuleTableField.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_NUMERIC_SUPEQ_ALL:
            case ContextFilterVO.TYPE_NUMERIC_SUPEQ_ANY:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_amount:
                    case ModuleTableField.FIELD_TYPE_enum:
                    case ModuleTableField.FIELD_TYPE_file_ref:
                    case ModuleTableField.FIELD_TYPE_float:
                    case ModuleTableField.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableField.FIELD_TYPE_foreign_key:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableField.FIELD_TYPE_image_ref:
                    case ModuleTableField.FIELD_TYPE_int:
                    case ModuleTableField.FIELD_TYPE_prct:
                    case ModuleTableField.FIELD_TYPE_tstz:
                        if (active_field_filter.param_numeric != null) {
                            where_conditions.push(field_id + " >= " + active_field_filter.param_numeric);
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_isoweekdays:
                    case ModuleTableField.FIELD_TYPE_int_array:
                    case ModuleTableField.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_numrange:
                    case ModuleTableField.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_numrange_array:
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    case ModuleTableField.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_NUMERIC_EQUALS:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_amount:
                    case ModuleTableField.FIELD_TYPE_enum:
                    case ModuleTableField.FIELD_TYPE_file_ref:
                    case ModuleTableField.FIELD_TYPE_float:
                    case ModuleTableField.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableField.FIELD_TYPE_foreign_key:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableField.FIELD_TYPE_image_ref:
                    case ModuleTableField.FIELD_TYPE_int:
                    case ModuleTableField.FIELD_TYPE_prct:
                    case ModuleTableField.FIELD_TYPE_tstz:
                        if (active_field_filter.param_numeric != null) {
                            where_conditions.push(field_id + " = '" + active_field_filter.param_numeric + "'");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_isoweekdays:
                    case ModuleTableField.FIELD_TYPE_int_array:
                    case ModuleTableField.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_numrange:
                    case ModuleTableField.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_numrange_array:
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    case ModuleTableField.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_NUMERIC_INTERSECTS:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_amount:
                    case ModuleTableField.FIELD_TYPE_enum:
                    case ModuleTableField.FIELD_TYPE_file_ref:
                    case ModuleTableField.FIELD_TYPE_float:
                    case ModuleTableField.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableField.FIELD_TYPE_foreign_key:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableField.FIELD_TYPE_image_ref:
                    case ModuleTableField.FIELD_TYPE_int:
                    case ModuleTableField.FIELD_TYPE_prct:
                    case ModuleTableField.FIELD_TYPE_tstz:

                    case ModuleTableField.FIELD_TYPE_isoweekdays:
                    case ModuleTableField.FIELD_TYPE_int_array:
                    case ModuleTableField.FIELD_TYPE_tstz_array:

                    case ModuleTableField.FIELD_TYPE_numrange:
                    case ModuleTableField.FIELD_TYPE_tsrange:

                    case ModuleTableField.FIELD_TYPE_numrange_array:
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    case ModuleTableField.FIELD_TYPE_refrange_array:

                        let where_clause: string = '';

                        for (let j in active_field_filter.param_numranges) {
                            let field_range: NumRange = active_field_filter.param_numranges[j];

                            where_clause += (where_clause == '') ? "" : " OR ";

                            where_clause += ModuleDAOServer.getInstance().getClauseWhereRangeIntersectsField(field, field_range);
                        }

                        where_conditions.push(where_clause);
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_NULL_ALL:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_amount:
                    case ModuleTableField.FIELD_TYPE_enum:
                    case ModuleTableField.FIELD_TYPE_file_ref:
                    case ModuleTableField.FIELD_TYPE_float:
                    case ModuleTableField.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableField.FIELD_TYPE_foreign_key:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableField.FIELD_TYPE_image_ref:
                    case ModuleTableField.FIELD_TYPE_int:
                    case ModuleTableField.FIELD_TYPE_prct:
                    case ModuleTableField.FIELD_TYPE_tstz:
                    case ModuleTableField.FIELD_TYPE_isoweekdays:
                    case ModuleTableField.FIELD_TYPE_int_array:
                    case ModuleTableField.FIELD_TYPE_tstz_array:
                    case ModuleTableField.FIELD_TYPE_numrange:
                    case ModuleTableField.FIELD_TYPE_tsrange:
                    case ModuleTableField.FIELD_TYPE_numrange_array:
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    case ModuleTableField.FIELD_TYPE_refrange_array:
                    default:
                        where_conditions.push(field_id + " is NULL");
                }
                break;


            case ContextFilterVO.TYPE_FILTER_OR:
                let conditions_OR: string[] = [];
                this.update_where_conditions(conditions_OR, active_field_filter.left_hook, tables_aliases_by_type);
                this.update_where_conditions(conditions_OR, active_field_filter.right_hook, tables_aliases_by_type);
                where_conditions.push(' ((' + conditions_OR[0] + ') OR (' + conditions_OR[1] + ')) ');
                break;

            case ContextFilterVO.TYPE_FILTER_AND:
                let conditions_AND: string[] = [];
                this.update_where_conditions(conditions_AND, active_field_filter.left_hook, tables_aliases_by_type);
                this.update_where_conditions(conditions_AND, active_field_filter.right_hook, tables_aliases_by_type);
                where_conditions.push(' ((' + conditions_AND[0] + ') AND (' + conditions_AND[1] + ')) ');
                break;

            case ContextFilterVO.TYPE_FILTER_NOT:
                let conditions_NOT: string[] = [];
                this.update_where_conditions(conditions_NOT, active_field_filter.left_hook, tables_aliases_by_type);
                where_conditions.push(' (NOT (' + conditions_NOT[0] + ')) ');
                break;


            case ContextFilterVO.TYPE_NULL_ANY:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_amount:
                    case ModuleTableField.FIELD_TYPE_enum:
                    case ModuleTableField.FIELD_TYPE_file_ref:
                    case ModuleTableField.FIELD_TYPE_float:
                    case ModuleTableField.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableField.FIELD_TYPE_foreign_key:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableField.FIELD_TYPE_image_ref:
                    case ModuleTableField.FIELD_TYPE_int:
                    case ModuleTableField.FIELD_TYPE_prct:
                    case ModuleTableField.FIELD_TYPE_tstz:
                    case ModuleTableField.FIELD_TYPE_numrange:
                    case ModuleTableField.FIELD_TYPE_tsrange:
                    default:
                        where_conditions.push(field_id + " is NULL");
                        break;


                    case ModuleTableField.FIELD_TYPE_isoweekdays:
                    case ModuleTableField.FIELD_TYPE_int_array:
                    case ModuleTableField.FIELD_TYPE_tstz_array:
                    case ModuleTableField.FIELD_TYPE_numrange_array:
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    case ModuleTableField.FIELD_TYPE_refrange_array:
                        where_conditions.push("ANY(" + field_id + ") is NULL");
                        break;
                }
                break;

            case ContextFilterVO.TYPE_NULL_NONE:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_amount:
                    case ModuleTableField.FIELD_TYPE_enum:
                    case ModuleTableField.FIELD_TYPE_file_ref:
                    case ModuleTableField.FIELD_TYPE_float:
                    case ModuleTableField.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableField.FIELD_TYPE_foreign_key:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableField.FIELD_TYPE_image_ref:
                    case ModuleTableField.FIELD_TYPE_int:
                    case ModuleTableField.FIELD_TYPE_prct:
                    case ModuleTableField.FIELD_TYPE_tstz:
                    case ModuleTableField.FIELD_TYPE_numrange:
                    case ModuleTableField.FIELD_TYPE_tsrange:
                    default:
                        where_conditions.push(field_id + " is NOT NULL");
                        break;


                    case ModuleTableField.FIELD_TYPE_isoweekdays:
                    case ModuleTableField.FIELD_TYPE_int_array:
                    case ModuleTableField.FIELD_TYPE_tstz_array:
                    case ModuleTableField.FIELD_TYPE_numrange_array:
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    case ModuleTableField.FIELD_TYPE_refrange_array:
                        where_conditions.push("ALL(" + field_id + ") is NOT NULL");
                        break;
                }
                break;

            case ContextFilterVO.TYPE_DATE_DOW:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_tstz:
                        let where_clause: string = '';

                        if (active_field_filter.param_numranges && active_field_filter.param_numranges.length) {
                            let dows: number[] = [];

                            RangeHandler.getInstance().foreach_ranges_sync(active_field_filter.param_numranges, (dow) => dows.push(dow));
                            if ((!dows) || (!dows.length)) {
                                break;
                            }

                            where_clause = 'extract(isodow from to_timestamp(' + field.field_id + ')::date) in (' + dows.join(',') + ')';
                            where_conditions.push(where_clause);
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_DATE_YEAR:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_tstz:
                        let where_clause: string = '';

                        if (active_field_filter.param_numranges && active_field_filter.param_numranges.length) {
                            let years: number[] = [];

                            RangeHandler.getInstance().foreach_ranges_sync(active_field_filter.param_numranges, (year) => years.push(year));
                            if ((!years) || (!years.length)) {
                                break;
                            }

                            where_clause = 'extract(year from to_timestamp(' + field.field_id + ')::date) in (' + years.join(',') + ')';
                            where_conditions.push(where_clause);
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_DATE_MONTH:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_tstz:
                        let where_clause: string = '';

                        if (active_field_filter.param_numranges && active_field_filter.param_numranges.length) {
                            let months: number[] = [];

                            RangeHandler.getInstance().foreach_ranges_sync(active_field_filter.param_numranges, (month) => months.push(month));
                            if ((!months) || (!months.length)) {
                                break;
                            }

                            where_clause = 'extract(month from to_timestamp(' + field.field_id + ')::date) in (' + months.join(',') + ')';
                            where_conditions.push(where_clause);
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_FILTER_XOR:
            case ContextFilterVO.TYPE_NUMERIC_INCLUDES:
            case ContextFilterVO.TYPE_NUMERIC_IS_INCLUDED_IN:
            case ContextFilterVO.TYPE_ID_INTERSECTS:
            case ContextFilterVO.TYPE_ID_EQUALS:
            case ContextFilterVO.TYPE_ID_INCLUDES:
            case ContextFilterVO.TYPE_ID_IS_INCLUDED_IN:
            case ContextFilterVO.TYPE_HOUR_INTERSECTS:
            case ContextFilterVO.TYPE_HOUR_EQUALS:
            case ContextFilterVO.TYPE_HOUR_INCLUDES:
            case ContextFilterVO.TYPE_HOUR_IS_INCLUDED_IN:
            case ContextFilterVO.TYPE_DATE_INTERSECTS:
            case ContextFilterVO.TYPE_DATE_INCLUDES:
            case ContextFilterVO.TYPE_DATE_IS_INCLUDED_IN:
            case ContextFilterVO.TYPE_TEXT_INCLUDES_ALL:
            case ContextFilterVO.TYPE_TEXT_STARTSWITH_ALL:
            case ContextFilterVO.TYPE_TEXT_ENDSWITH_ALL:



            case ContextFilterVO.TYPE_DATE_DOM:
            case ContextFilterVO.TYPE_DATE_WEEK:

                throw new Error('Not Implemented');
        }
    }

    /**
     * Méthode qui liste les jointures à réaliser, en suivant le chemin
     *  Pour chaque étape path_i de path :
     *      Si on est sur un manytoone
     *          Si path_i.field.target_moduletable pas encore aliasé (et donc pas joined)
     *              Ajouter un alias sur le path_i.field.target_moduletable => m
     *              On doit faire un join path_i.field.target_moduletable m on m.id = alias[path_i.field.moduletable].[path_i.field.field_id]
     *      Sinon (donc onetomany)
     *          Si path_i.field.moduletable pas encore aliasé (et donc pas joined)
     *              Ajouter un alias sur le path_i.field.moduletable => m
     *              On doit faire un join path_i.field.moduletable m on m.[path_i.field.field_id] = alias[path_i.field.target_moduletable].id
     */
    public updates_jointures(
        jointures: string[],
        targeted_type: string,
        joined_tables_by_vo_type: { [vo_type: string]: ModuleTable<any> },
        tables_aliases_by_type: { [vo_type: string]: string },
        path: FieldPathWrapper[],
        aliases_n: number
    ): number {

        if ((!path) || (!path.length)) {
            return aliases_n;
        }

        for (let i in path) {
            let path_i = path[i];

            if (path_i.is_manytoone) {

                if (!tables_aliases_by_type[path_i.field.manyToOne_target_moduletable.vo_type]) {
                    tables_aliases_by_type[path_i.field.manyToOne_target_moduletable.vo_type] = 't' + (aliases_n++);
                    joined_tables_by_vo_type[path_i.field.manyToOne_target_moduletable.vo_type] = path_i.field.manyToOne_target_moduletable;
                    jointures.push(
                        path_i.field.manyToOne_target_moduletable.full_name + ' ' + tables_aliases_by_type[path_i.field.manyToOne_target_moduletable.vo_type] +
                        ' on ' +
                        tables_aliases_by_type[path_i.field.manyToOne_target_moduletable.vo_type] + '.id = ' +
                        tables_aliases_by_type[path_i.field.module_table.vo_type] + '.' + path_i.field.field_id
                    );
                }
            } else {
                if (!tables_aliases_by_type[path_i.field.module_table.vo_type]) {
                    tables_aliases_by_type[path_i.field.module_table.vo_type] = 't' + (aliases_n++);
                    joined_tables_by_vo_type[path_i.field.module_table.vo_type] = path_i.field.module_table;
                    jointures.push(
                        path_i.field.module_table.full_name + ' ' + tables_aliases_by_type[path_i.field.module_table.vo_type] +
                        ' on ' +
                        tables_aliases_by_type[path_i.field.module_table.vo_type] + '.' + path_i.field.field_id + ' = ' +
                        tables_aliases_by_type[path_i.field.manyToOne_target_moduletable.vo_type] + '.id'
                    );
                }
            }
        }

        return aliases_n;
    }

    /**
     * On avance sur tous les fronts en même temps et on veut associer à chaque chemin un poids qui correspond à la distance
     *  Une relation N/N compte pour 1 en poids et non 2 même si on a 2 vo_type_id à passer, on ignore directement la table intermédiaire
     *
     *  En premier lieu, si le type cible est un type from on retourne null, aucun chemin à chercher on a déjà un type connu
     *  Ensuite on cherche à partir du type cible, et à remonter toutes les branches possibles jusqu'à atteindre un type from
     *  On stocke les types rencontrés en chemin car si on retombe sur un type déjà présent dans un autre chemin, alors ce
     *  chemin est inutile (liste_types_chemins_connus)
     *  On avance chemin par chemin, d'un cran à chaque fois, à ceci près que si l'on rencontre un N/N qui n'est ni connu, ni from,
     *  on continue directement à l'autre côté de la relation N/N pour traduire le fait que la distance d'une relation N/N est 1 et pas 2
     *
     *      On liste les champs ManyToOne du type sur lequel on est (au début type cible, ensuite le bout du chemin en cours d'extension)
     *      NB : puisqu'il s'agit d'un manytoone ici on ne peut pas rencontrer de table N/N, au mieux on peut être sur une relation N/N
     *      mais pas en atteindre une
     *          On filtre sur les types actifs
     *          Si on trouve parmi ces field.target_moduletable un type from, on a identifié le chemin => on renvoie
     *          Sinon
     *              Pour chaque field
     *                  si le type field.target_moduletable est dans liste_types_chemins_connus, ce chemin est inutile, on ignore (puisqu'un autre chemin a déjà trouvé un
     *                  moyen de joindre ce type)
     *                  sinon on crée un nouveau chemin avec ce nouveau type cible en bout, et on le stocke pour le prochain passage
     *      On liste par ailleurs les relations OneToMany vers notre type actuel
     *          On filtre sur les types actifs
     *          Si on trouve parmi ces field.moduletable un type from, on a identifié le chemin => on renvoie
     *          Sinon
     *              Pour chaque field
     *                  si le type field.moduletable est dans liste_types_chemins_connus, ce chemin est inutile, on ignore (puisqu'un autre chemin a déjà trouvé un
     *                  moyen de joindre ce type)
     *                  sinon
     *                      on check si le field.moduletable est un N/N, dans ce cas on ajoute au chemin l'autre field pour sortir du N/N rapidement
     *                      on stocke ce nouveau chemin pour le prochain passage
     *
     *      Si on a trouvé aucun nouveau chemin, on quitte sans solution
     *      Sinon on reprend sur la base des nouveaux chemins
     *
     *
     * On peut simplifier l'algo en séparant une fonction intermédiaire qui doit savoir si on traite du manytone ou du onetomany en entrée pour faire varier
     *  entre field.target_moduletable et field.moduletable, et qui dans le cas onetomany check la possible relation N/N
     *
     * @param active_api_type_ids liste des types valides pour la recherche. Un chemin qui passe par un autre api_type_id doit être ignoré
     * @param from_types liste des types déjà liés par des jointures, donc dès qu'on en trouve un on peut arrêter la recherche de chemin
     * @param to_type le type ciblé pour lequel on cherche le chemin
     */
    public get_path_between_types(active_api_type_ids: string[], from_types: string[], to_type: string): FieldPathWrapper[] {

        /**
         * Forme opti du from_types et active_api_type_ids
         */
        let from_types_by_name: { [api_type_id: string]: boolean } = {};
        from_types.forEach((type) => from_types_by_name[type] = true);
        let active_api_type_ids_by_name: { [api_type_id: string]: boolean } = {};
        active_api_type_ids.forEach((type) => active_api_type_ids_by_name[type] = true);

        /**
         * pas de cible ou cible connue ou cible pas autorisée
         */
        if ((!to_type) || from_types_by_name[to_type] || !active_api_type_ids_by_name[to_type]) {
            return null;
        }

        /**
         * Marqueur des types rencontrés
         */
        let deployed_deps_from: { [api_type_id: string]: boolean } = {};

        /**
         * Les chemins à étudier à ce tour, et le stockage des chemins à traiter au tour suivant
         *  Le premier tour se fait avec un actual_paths vide, donc on est en train de tester le
         */
        let actual_paths: FieldPathWrapper[][] = [];
        let next_turn_paths: FieldPathWrapper[][] = [];

        /**
         * Le marqueur pour identifier la fin de la balade
         */
        let is_blocked: boolean = false;

        while (!is_blocked) {
            is_blocked = true;

            actual_paths = next_turn_paths;
            next_turn_paths = [];

            /**
             * Le premier tour on demande de générer des chemins sans en fournir un, mais avec un moduletable de départ identifié
             */
            let this_path_next_turn_paths: FieldPathWrapper[][] = [];

            if ((!actual_paths) || (!actual_paths.length)) {
                let valid_path: FieldPathWrapper[] = this.get_paths_from_moduletable(
                    [],
                    this_path_next_turn_paths,
                    to_type,
                    from_types_by_name,
                    active_api_type_ids_by_name,
                    deployed_deps_from);
                if (valid_path) {
                    return this.reverse_path(valid_path);
                }

                if ((!this_path_next_turn_paths) || (!this_path_next_turn_paths.length)) {
                    return null;
                }

                is_blocked = false;
                next_turn_paths = this_path_next_turn_paths;
                continue;
            }

            /**
             * Sur un tour classique, on demande pour chaque chemin à identifier les ramifications possibles pour le prochain tour
             */
            for (let i in actual_paths) {
                let actual_path = actual_paths[i];

                let valid_path: FieldPathWrapper[] = this.get_paths_from_moduletable(
                    actual_path,
                    this_path_next_turn_paths,
                    to_type,
                    from_types_by_name,
                    active_api_type_ids_by_name,
                    deployed_deps_from);
                if (valid_path) {
                    return this.reverse_path(valid_path);
                }

                if ((!this_path_next_turn_paths) || (!this_path_next_turn_paths.length)) {
                    continue;
                }

                is_blocked = false;
                if ((!next_turn_paths) || (!next_turn_paths.length)) {
                    next_turn_paths = this_path_next_turn_paths;
                } else {
                    next_turn_paths.concat(this_path_next_turn_paths);
                }
            }
        }

        return null;
    }

    public get_starting_point(
        from_types: string[], to_type: string,
        reverse_paths_to_test: { [api_type_id: string]: { [field_id: string]: TypesPathElt } }): TypesPathElt {

        if (!reverse_paths_to_test) {
            return null;
        }

        for (let i in from_types) {
            let from_type = from_types[i];

            if (!!reverse_paths_to_test[from_type]) {
                return reverse_paths_to_test[from_type][ObjectHandler.getInstance().getFirstAttributeName(reverse_paths_to_test[from_type])];
            }
        }

        for (let type_i in reverse_paths_to_test) {
            let reverse_paths_to_test_fields = reverse_paths_to_test[type_i];

            for (let field_i in reverse_paths_to_test_fields) {
                let reverse_path_to_test = reverse_paths_to_test_fields[field_i];

                if (from_types.indexOf(reverse_path_to_test.to_api_type_id) >= 0) {
                    return reverse_path_to_test;
                }
            }
        }

        return null;
    }

    public get_fields_path_from_path_elts(
        starting_path_elt: TypesPathElt): Array<ModuleTableField<any>> {

        if (!starting_path_elt) {
            return null;
        }

        let res: Array<ModuleTableField<any>> = [];
        let path_elt: TypesPathElt = starting_path_elt;
        while (path_elt) {

            res.push(VOsTypesManager.getInstance().moduleTables_by_voType[path_elt.from_api_type_id].get_field_by_id(path_elt.from_field_id));
            path_elt = path_elt.next_path_elt;
        }
        return res;
    }

    public merge_new_paths(
        local_new_paths: { [api_type_id: string]: { [field_id: string]: TypesPathElt } },
        new_paths: { [api_type_id: string]: { [field_id: string]: TypesPathElt } }
    ) {
        for (let i in local_new_paths) {
            let local_new_paths_fields = local_new_paths[i];

            if (!new_paths[i]) {
                new_paths[i] = {};
            }

            for (let j in local_new_paths_fields) {
                let local_new_path = local_new_paths_fields[j];

                if (!new_paths[i][j]) {
                    new_paths[i][j] = local_new_path;
                }
                /**
                 * Probablement pas utile de merger ici
                 */
            }
        }
    }

    /**
     * On prend en param les types ciblés pour break rapidement si on a une réponse à fournir.
     *  Cependant à voir dans le temps si on peut avoir des chemins plus courts en restant plus longtemps. Je pense pas.
     * @param references
     * @param reverse_paths
     * @param targeted_types
     * @param actual_path
     */
    public merge_references(
        references: Array<ModuleTableField<any>>,
        reverse_paths: { [api_type_id: string]: { [field_id: string]: TypesPathElt } },
        targeted_types: string[],
        actual_path: TypesPathElt = null): { [api_type_id: string]: { [field_id: string]: TypesPathElt } } {

        let new_paths: { [api_type_id: string]: { [field_id: string]: TypesPathElt } } = null;

        for (let i in references) {
            let reference = references[i];

            // // INFO : Si on passe par une table segmentée sans que celle-ci soit la cible ou la source, on ignore cette référence
            // // Obj par l'exemple : lignes de factures, très nombreuses, et plusieurs catégories / PDVs, on veut pas filtrer les
            // //  PDV en fonction de la catégorie choisie dans les factures liées. Sinon c'est délirant en terme de requetes / temps de
            // //  réponse. On pourrait ajouter un switch sur une requete très insistante mais par défaut ça semble pas une bonne idée
            // //  ça sous-entend surtout peutêtre qu'il y a un poids sur les tables pour le chemin à utiliser et qu'on est en train
            // //  de dire que dans ce cas précis on a juste un poids très élevé.
            // if (reference.module_table.is_segmented) {
            //     if ((!reverse_paths[reference.module_table.vo_type]) && (targeted_types.indexOf(reference.module_table.vo_type) < 0)) {
            //         continue;
            //     }
            // }

            /**
             * Les tables de matroides (params de vars) sont ignorées pour la définition des paths
             *  on veut que des tables de datas
             */
            if (reference.module_table.isMatroidTable) {
                if ((!reverse_paths[reference.module_table.vo_type]) && (targeted_types.indexOf(reference.module_table.vo_type) < 0)) {
                    continue;
                }
            }

            // Si c'est une ref via many to many on ajoute pas de poids sur cette ref
            let reference_weight: number = VOsTypesManager.getInstance().isManyToManyModuleTable(
                VOsTypesManager.getInstance().moduleTables_by_voType[reference.module_table.vo_type]) ? 0 : 1;

            if (reverse_paths[reference.module_table.vo_type] &&
                reverse_paths[reference.module_table.vo_type][reference.field_id]) {

                // On check qu'on est pas sur un trajet plus rapide => mais c'est improbable/impossible non ?
                if (actual_path) {
                    if (
                        reverse_paths[reference.module_table.vo_type][reference.field_id].from_path_index >
                        actual_path.from_path_index + reference_weight
                    ) {
                        reverse_paths[reference.module_table.vo_type][reference.field_id].from_path_index = actual_path ? actual_path.from_path_index + reference_weight : reference_weight;
                        reverse_paths[reference.module_table.vo_type][reference.field_id].to_path_index = actual_path ? actual_path.from_path_index : 0;
                        reverse_paths[reference.module_table.vo_type][reference.field_id].next_path_elt = actual_path;
                    }
                }

                continue;
            }

            if (!reverse_paths[reference.module_table.vo_type]) {
                reverse_paths[reference.module_table.vo_type] = {};
            }

            reverse_paths[reference.module_table.vo_type][reference.field_id] = new TypesPathElt(
                reference.module_table.vo_type,
                reference.field_id,

                reference.manyToOne_target_moduletable.vo_type,
                reference.target_field,

                actual_path ? actual_path.from_path_index + reference_weight : reference_weight,
                actual_path ? actual_path.from_path_index : 0,

                actual_path ? actual_path : null
            );

            if (!new_paths) {
                new_paths = {};
            }

            if (!new_paths[reference.module_table.vo_type]) {
                new_paths[reference.module_table.vo_type] = {};
            }

            new_paths[reference.module_table.vo_type][reference.field_id] = reverse_paths[reference.module_table.vo_type][reference.field_id];

            if (targeted_types && targeted_types.find((target) => target == reference.module_table.vo_type)) {
                return new_paths;
            }
        }

        return new_paths;
    }

    /**
     * ATTENTION : sécurité déclarative...
     * access_right doit contenir le droit (exemple DAO_ACCESS_TYPE_READ) le plus élevé nécessité pour la requête qui sera construite avec cette fonction
     * Par défaut on met donc la suppression puisque si l'on a accès à la suppression, on a accès à tout.
     */
    public build_request_from_active_field_filters_(
        api_type_ids: string[],
        field_ids: string[],
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[],
        sort_by: SortByVO,
        res_field_aliases: string[],
        access_type: string = ModuleDAO.DAO_ACCESS_TYPE_DELETE,
        is_delete: boolean = false
    ): string {

        try {

            /**
             * Par mesure de sécu on check que les éléments proposés existent en base
             */
            if ((!api_type_ids) ||
                (api_type_ids.length <= 0) ||
                ((field_ids && res_field_aliases) &&
                    ((res_field_aliases.length != field_ids.length) ||
                        (api_type_ids.length != field_ids.length)))) {
                return null;
            }

            if (!this.check_access_to_api_type_ids_field_ids(api_type_ids, field_ids, access_type)) {
                return null;
            }

            let aliases_n: number = 0;
            let tables_aliases_by_type: { [vo_type: string]: string } = {
                [api_type_ids[0]]: 't' + (aliases_n++)
            };

            let res: string = null;
            let FROM: string = null;

            /**
             * On prend arbitrairement la première table comme FROM, on join vers elle par la suite.
             */
            let main_api_type_id = null;
            let jointures: string[] = [];
            let joined_tables_by_vo_type: { [vo_type: string]: ModuleTable<any> } = {};


            /**
             * On agrémente la liste des active_api_type_ids par les relations N/N dont les types liés sont actifs
             */
            let nn_tables = VOsTypesManager.getInstance().get_manyToManyModuleTables();
            for (let i in nn_tables) {
                let nn_table = nn_tables[i];

                let nnfields = nn_table.get_fields();
                let has_inactive_relation = false;
                for (let j in nnfields) {
                    let nnfield = nnfields[j];

                    if (active_api_type_ids.indexOf(nnfield.manyToOne_target_moduletable.vo_type) < 0) {
                        has_inactive_relation = true;
                        break;
                    }
                }

                if (!has_inactive_relation) {
                    active_api_type_ids.push(nn_table.vo_type);
                }
            }


            if (!field_ids) {
                if (api_type_ids.length != 1) {
                    ConsoleHandler.getInstance().error('build_request_from_active_field_filters:api_type_ids.length != 1:' + api_type_ids.join(','));
                    return null;
                }

                main_api_type_id = api_type_ids[0];
                let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[main_api_type_id];

                if (!moduletable) {
                    return null;
                }

                /**
                 * FIXME Les tables segmentées sont pas du tout compatibles pour le moment
                 */
                if (moduletable.is_segmented) {
                    throw new Error('Not implemented');
                }

                if (!is_delete) {
                    res = "SELECT " + tables_aliases_by_type[main_api_type_id] + ".* ";
                    FROM = " FROM " + moduletable.full_name + " " + tables_aliases_by_type[main_api_type_id];
                } else {
                    res = "DELETE ";
                    FROM = " FROM " + moduletable.full_name + " " + tables_aliases_by_type[main_api_type_id];
                }
            } else {

                if (is_delete) {
                    throw new Error('Not implemented');
                }

                res = "SELECT DISTINCT ";
                let first = true;

                for (let i in api_type_ids) {
                    let api_type_id = api_type_ids[i];
                    let field_id = field_ids[i];

                    let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];
                    if ((!moduletable) || ((!!field_id) && (field_id != 'id') && (!moduletable.get_field_by_id(field_id)))) {
                        return null;
                    }

                    /**
                     * FIXME Les tables segmentées sont pas du tout compatibles pour le moment
                     */
                    if (moduletable.is_segmented) {
                        throw new Error('Not implemented');
                    }

                    if (!main_api_type_id) {
                        main_api_type_id = api_type_id;

                        FROM = " FROM " + moduletable.full_name + " " + tables_aliases_by_type[api_type_id];
                        joined_tables_by_vo_type[api_type_id] = moduletable;
                    } else {
                        /**
                         * Si on découvre, et qu'on est pas sur la première table, on passe sur un join à mettre en place
                         */
                        if (!tables_aliases_by_type[api_type_id]) {

                            /**
                             * On doit identifier le chemin le plus court pour rejoindre les 2 types de données
                             */
                            let path: FieldPathWrapper[] = this.get_path_between_types(active_api_type_ids, Object.keys(joined_tables_by_vo_type), api_type_id);
                            if (!path) {
                                // pas d'impact de ce filtrage puisqu'on a pas de chemin jusqu'au type cible
                                continue;
                            }

                            /**
                             * On doit checker le trajet complet
                             */
                            if (!this.check_access_to_fields(path, access_type)) {
                                return null;
                            }

                            aliases_n = this.updates_jointures(jointures, api_type_id, joined_tables_by_vo_type, tables_aliases_by_type, path, aliases_n);
                            // joined_tables_by_vo_type[api_type_id_i] = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id_i];
                        }
                    }

                    if (!first) {
                        res += ', ';
                    }
                    first = false;

                    res += tables_aliases_by_type[api_type_id] + "." + field_id + " as " + res_field_aliases[i] + ' ';
                }
            }

            res += FROM;

            /**
             * C'est là que le fun prend place, on doit créer la requête pour chaque context_filter et combiner tout ensemble
             */
            let where_conditions: string[] = [];

            for (let api_type_id_i in get_active_field_filters) {
                let active_field_filters_by_fields = get_active_field_filters[api_type_id_i];

                for (let field_id_i in active_field_filters_by_fields) {
                    let active_field_filter: ContextFilterVO = active_field_filters_by_fields[field_id_i];

                    if (!active_field_filter) {
                        continue;
                    }

                    if (active_field_filter.vo_type == main_api_type_id) {
                        /**
                         * On a pas besoin de jointure mais par contre on a besoin du filtre
                         */
                        this.update_where_conditions(where_conditions, active_field_filter, tables_aliases_by_type);
                        continue;
                    }

                    if (!joined_tables_by_vo_type[api_type_id_i]) {

                        /**
                         * On doit identifier le chemin le plus court pour rejoindre les 2 types de données
                         */
                        let path: FieldPathWrapper[] = this.get_path_between_types(active_api_type_ids, Object.keys(tables_aliases_by_type), api_type_id_i);
                        if (!path) {
                            // pas d'impact de ce filtrage puisqu'on a pas de chemin jusqu'au type cible
                            continue;
                        }
                        aliases_n = this.updates_jointures(jointures, main_api_type_id, joined_tables_by_vo_type, tables_aliases_by_type, path, aliases_n);
                        // joined_tables_by_vo_type[api_type_id_i] = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id_i];
                    }

                    this.update_where_conditions(where_conditions, active_field_filter, tables_aliases_by_type);
                }
            }

            if (jointures && jointures.length) {
                /**
                 * Il faut ordonner les jointures, pour ne pas référencer des aliases pas encore déclarés
                 */
                jointures.sort((jointurea: string, jointureb: string) => {
                    // Si on cite un alias dans a qui est déclaré dans b, on doit être après b, sinon
                    //  soit l'inverse soit osef
                    let alias_a = jointurea.split(' ')[1];
                    let alias_b = jointureb.split(' ')[1];

                    let citation_1_a = jointurea.split(' ')[3].split('.')[0];
                    let citation_2_a = jointurea.split(' ')[5].split('.')[0];

                    let citation_1_b = jointureb.split(' ')[3].split('.')[0];
                    let citation_2_b = jointureb.split(' ')[5].split('.')[0];

                    if ((citation_1_a == alias_b) || (citation_2_a == alias_b)) {
                        return 1;
                    }

                    if ((citation_1_b == alias_a) || (citation_2_b == alias_a)) {
                        return -1;
                    }

                    return 0;
                });
                res += ' JOIN ' + jointures.join(' JOIN ');
            }

            if (where_conditions && where_conditions.length) {
                res += ' WHERE (' + where_conditions.join(') AND (') + ')';
            }

            if (sort_by) {

                res += ' ORDER BY ' + tables_aliases_by_type[sort_by.vo_type] + '.' + sort_by.field_id + (sort_by.sort_asc ? ' ASC ' : ' DESC ');
            }

            return res;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            return null;
        }
    }

    public check_access_to_api_type_ids_field_ids(
        api_type_ids: string[],
        field_ids: string[],
        access_type: string): boolean {

        if (!StackContext.getInstance().get('IS_CLIENT')) {
            return true;
        }

        let uid: number = StackContext.getInstance().get('UID');
        let roles;
        if (!uid) {
            roles = AccessPolicyServerController.getInstance().getUsersRoles(false, null);
        } else {
            roles = AccessPolicyServerController.getInstance().getUsersRoles(true, uid);
        }

        for (let i in api_type_ids) {
            let api_type_id = api_type_ids[i];
            let field_id = field_ids ? field_ids[i] : null;

            if (!this.check_access_to_field(api_type_id, field_id, access_type, roles)) {
                return false;
            }
        }

        return true;
    }

    public check_access_to_fields(
        fields: FieldPathWrapper[],
        access_type: string): boolean {

        if (!StackContext.getInstance().get('IS_CLIENT')) {
            return true;
        }

        let uid: number = StackContext.getInstance().get('UID');
        let roles;
        if (!uid) {
            roles = AccessPolicyServerController.getInstance().getUsersRoles(false, null);
        } else {
            roles = AccessPolicyServerController.getInstance().getUsersRoles(true, uid);
        }

        for (let i in fields) {
            let api_type_id = fields[i].field.module_table.vo_type;
            let field_id = fields[i].field.field_id;

            if (!this.check_access_to_field(api_type_id, field_id, access_type, roles)) {
                return false;
            }
        }

        return true;
    }

    public check_access_to_field(
        api_type_id: string,
        field_id: string,
        access_type: string,
        roles): boolean {

        /**
         * Si le field_id est le label du type ou id, on peut transformer un droit de type READ en LIST
         */
        let table = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];
        let tmp_access_type = access_type;
        if ((access_type == ModuleDAO.DAO_ACCESS_TYPE_READ) && ((field_id == 'id') || (table.default_label_field && table.default_label_field.field_id && (field_id == table.default_label_field.field_id)))) {
            tmp_access_type = ModuleDAO.DAO_ACCESS_TYPE_LIST_LABELS;
        }

        let target_policy: AccessPolicyVO = AccessPolicyServerController.getInstance().get_registered_policy(
            ModuleDAO.getInstance().getAccessPolicyName(tmp_access_type, api_type_id)
        );

        if (!AccessPolicyServerController.getInstance().checkAccessTo(target_policy, roles)) {
            return false;
        }

        return true;
    }

    /**
     * Fonction qui inverse le chemin pour simplifier l'algo de jointure
     */
    private reverse_path(actual_path: FieldPathWrapper[]): FieldPathWrapper[] {

        let res: FieldPathWrapper[] = [];

        if ((!actual_path) || (!actual_path.length)) {
            return res;
        }

        for (let i = (actual_path.length - 1); i >= 0; i--) {
            let actual_path_i = actual_path[i];
            let res_i = new FieldPathWrapper(actual_path_i.field, !actual_path_i.is_manytoone);
            res.push(res_i);
        }

        return res;
    }

    /**
     * On avance d'un pas sur le chemin proposé en paramètre, et on peut en sortir donc plusieurs nouveaux chemins,
     *  et peut-être une solution pour aller de from_types_by_name => to_type, en sachant que le chemin renvoyé est inversé
     *  (on trace le chemin de to_type => un des from_types_by_name) donc on pourra appeler reverse_path pour le remettre dans le bon sens
     * @see reverse_path
     * @see get_path_between_types for algo
     * @returns solution path if has one
     */
    private get_paths_from_moduletable(
        actual_path: FieldPathWrapper[],
        this_path_next_turn_paths: FieldPathWrapper[][],
        to_type: string,
        from_types_by_name: { [api_type_id: string]: boolean },
        active_api_type_ids_by_name: { [api_type_id: string]: boolean },
        deployed_deps_from: { [api_type_id: string]: boolean }): FieldPathWrapper[] {

        let moduletable: ModuleTable<any> = null;

        /**
         * Si on démarre on part du type cible
         * Sinon on part du dernier type du chemin
         */
        if ((!actual_path) || (!actual_path.length)) {
            moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[to_type];
        } else {
            /**
             * Si on a pris un manytoone => on est parti de field.moduletable vers field.target_moduletable qui est donc le dernier api_type_id du path
             * sinon, on est en onetomany et donc c'est l'inverse, la dernière étape est le field.moduletable
             */
            let last_field_path = actual_path[actual_path.length - 1];
            moduletable = last_field_path.is_manytoone ?
                last_field_path.field.manyToOne_target_moduletable :
                last_field_path.field.module_table;
        }

        if (deployed_deps_from[moduletable.vo_type]) {
            return null;
        }

        /**
         * On charge les manytoone et on filtre sur les types actifs et les recursifs
         */
        let manytoone_fields = VOsTypesManager.getInstance().getManyToOneFields(moduletable.vo_type, Object.keys(deployed_deps_from));
        manytoone_fields = manytoone_fields.filter((field) =>
            active_api_type_ids_by_name[field.manyToOne_target_moduletable.vo_type] &&
            (field.manyToOne_target_moduletable.vo_type != field.module_table.vo_type));

        /**
         * si on trouve un des point de départ (une des cibles) dans les targets des fields, on a terminé on a un chemin valide on le renvoie
         */
        let manytoone_fields_to_sources: Array<ModuleTableField<any>> = manytoone_fields.filter((field) => from_types_by_name[field.manyToOne_target_moduletable.vo_type]);
        if (manytoone_fields_to_sources && manytoone_fields_to_sources.length) {
            actual_path.push(new FieldPathWrapper(manytoone_fields_to_sources[0], true));
            return actual_path;
        }

        /**
         * Sinon, (on a déjà filtré les chemins potentiellement déjà connus) pour chaque nouveau field, on crée un nouveau chemin.
         */
        for (let i in manytoone_fields) {
            let manytoone_field = manytoone_fields[i];

            let newpath = cloneDeep(actual_path);
            newpath.push(new FieldPathWrapper(manytoone_field, true));
            this_path_next_turn_paths.push(newpath);
        }

        /**
         * On passe aux onetomany. idem on charge toutes les refs et on filtres les types déjà connus (exclus) et les types actifs (inclus)
         */
        let onetomany_fields: Array<ModuleTableField<any>> = VOsTypesManager.getInstance().get_type_references(moduletable.vo_type);
        onetomany_fields = onetomany_fields.filter((ref) => active_api_type_ids_by_name[ref.module_table.vo_type] && !deployed_deps_from[ref.module_table.vo_type]);

        /**
         * si on trouve un des point de départ (une des cibles) dans les tables des fields, on a terminé on a un chemin valide on le renvoie
         */
        let onetomany_fields_to_sources: Array<ModuleTableField<any>> = onetomany_fields.filter((field) => from_types_by_name[field.module_table.vo_type]);
        if (onetomany_fields_to_sources && onetomany_fields_to_sources.length) {
            actual_path.push(new FieldPathWrapper(onetomany_fields_to_sources[0], false));
            return actual_path;
        }

        /**
         * Sinon pour chacun,
         *      on check la possibilité d'être sur un N/N.
         *      si c'est le cas
         *          on passe l'autre field aussi en même temps, et on check si c'est pas une source, un !active_api_type_ids_by_name ou une deployed_deps_from
         *          et on réagit en conséquence
         *          sinon on crée le nouveau chemin avec ces 2 fields ajoutés
         *      sinon
         *          on crée un nouveau chemin avec ce field ajouté
         */
        for (let i in onetomany_fields) {
            let onetomany_field = onetomany_fields[i];

            if (VOsTypesManager.getInstance().isManyToManyModuleTable(onetomany_field.module_table)) {
                let second_field = VOsTypesManager.getInstance().getManyToManyOtherField(onetomany_field.module_table, onetomany_field);

                if (from_types_by_name[second_field.manyToOne_target_moduletable.vo_type]) {
                    actual_path.push(new FieldPathWrapper(onetomany_field, false));
                    actual_path.push(new FieldPathWrapper(second_field, true));
                    return actual_path;
                }

                if (!active_api_type_ids_by_name[second_field.manyToOne_target_moduletable.vo_type]) {
                    continue;
                }

                if (deployed_deps_from[second_field.manyToOne_target_moduletable.vo_type]) {
                    continue;
                }

                let newpath = cloneDeep(actual_path);
                newpath.push(new FieldPathWrapper(onetomany_field, false));
                newpath.push(new FieldPathWrapper(second_field, true));
                this_path_next_turn_paths.push(newpath);

                // On marque la relation N/N comme déployée aussi du coup
                deployed_deps_from[onetomany_field.module_table.vo_type] = true;
            } else {
                let newpath = cloneDeep(actual_path);
                newpath.push(new FieldPathWrapper(onetomany_field, false));
                this_path_next_turn_paths.push(newpath);
            }
        }

        deployed_deps_from[moduletable.vo_type] = true;

        return null;
    }
}
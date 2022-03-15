import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import ContextFilterHandler from '../../../shared/modules/ContextFilter/ContextFilterHandler';
import ContextFilterVO from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryVO from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import NumRange from '../../../shared/modules/DataRender/vos/NumRange';
import ModuleTable from '../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import RangeHandler from '../../../shared/tools/RangeHandler';
import StackContext from '../../StackContext';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ContextQueryServerController from './ContextQueryServerController';
import FieldPathWrapper from './vos/FieldPathWrapper';
import moment = require('moment');

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

    public async update_where_conditions(
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
                await this.update_where_conditions(conditions_OR, active_field_filter.left_hook, tables_aliases_by_type);
                await this.update_where_conditions(conditions_OR, active_field_filter.right_hook, tables_aliases_by_type);
                where_conditions.push(' ((' + conditions_OR[0] + ') OR (' + conditions_OR[1] + ')) ');
                break;

            case ContextFilterVO.TYPE_FILTER_AND:
                let conditions_AND: string[] = [];
                await this.update_where_conditions(conditions_AND, active_field_filter.left_hook, tables_aliases_by_type);
                await this.update_where_conditions(conditions_AND, active_field_filter.right_hook, tables_aliases_by_type);
                where_conditions.push(' ((' + conditions_AND[0] + ') AND (' + conditions_AND[1] + ')) ');
                break;

            case ContextFilterVO.TYPE_FILTER_NOT:
                let conditions_NOT: string[] = [];
                await this.update_where_conditions(conditions_NOT, active_field_filter.left_hook, tables_aliases_by_type);
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

                            where_clause = 'extract(isodow from to_timestamp(' + field_id + ')::date) in (' + dows.join(',') + ')';
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

                            where_clause = 'extract(year from to_timestamp(' + field_id + ')::date) in (' + years.join(',') + ')';
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

                            where_clause = 'extract(month from to_timestamp(' + field_id + ')::date) in (' + months.join(',') + ')';
                            where_conditions.push(where_clause);
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_DATE_INTERSECTS:
                if ((!active_field_filter.param_tsranges) || (!active_field_filter.param_tsranges.length)) {
                    throw new Error('Not Implemented');
                }

                let where_clause_date_intersects = null;
                active_field_filter.param_tsranges.forEach((tsrange) => {
                    where_clause_date_intersects = (where_clause_date_intersects ? where_clause_date_intersects + ' OR ' : '');
                    switch (field.field_type) {
                        case ModuleTableField.FIELD_TYPE_tstzrange_array:
                            where_clause_date_intersects += "('[" + tsrange.min + "," + tsrange.max + ")'::numrange && ANY (" + field_id + "::numrange[]))";
                            break;

                        case ModuleTableField.FIELD_TYPE_tsrange:
                            where_clause_date_intersects += '(' + field_id + " && '[" + tsrange.min + "," + tsrange.max + ")'::numrange)";
                            break;

                        case ModuleTableField.FIELD_TYPE_tstz_array:
                            where_clause_date_intersects += "('[" + tsrange.min + "," + tsrange.max + ")'::numrange && ANY (" + field_id + "::numeric[]))";
                            break;

                        case ModuleTableField.FIELD_TYPE_tstz:
                            where_clause_date_intersects += '((' + field_id + " >= " + tsrange.min + ") and (" + field_id + " < " + tsrange.max + '))';
                            break;

                        default:
                            throw new Error('Not Implemented');
                    }
                });
                where_conditions.push(where_clause_date_intersects);
                break;

            case ContextFilterVO.TYPE_SUB_QUERY:
                if (!active_field_filter.sub_query) {
                    throw new Error('Not Implemented');
                }

                where_conditions.push(field_id + ' IN (' + await ContextQueryServerController.getInstance().build_select_query(active_field_filter.sub_query) + ')');

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
     *
     * Par ailleurs tout dépend du type de champs qui fait la jointure. sur un ref_ranges il faut utiliser id::numeric <@ ANY(ref_ranges_field)
     */
    public async updates_jointures(
        jointures: string[],
        targeted_type: string,
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        joined_tables_by_vo_type: { [vo_type: string]: ModuleTable<any> },
        tables_aliases_by_type: { [vo_type: string]: string },
        path: FieldPathWrapper[],
        aliases_n: number
    ): Promise<number> {

        if ((!path) || (!path.length)) {
            return aliases_n;
        }

        for (let i in path) {
            let path_i = path[i];

            if (path_i.is_manytoone) {

                if (!tables_aliases_by_type[path_i.field.manyToOne_target_moduletable.vo_type]) {

                    tables_aliases_by_type[path_i.field.manyToOne_target_moduletable.vo_type] = 't' + (aliases_n++);
                    joined_tables_by_vo_type[path_i.field.manyToOne_target_moduletable.vo_type] = path_i.field.manyToOne_target_moduletable;

                    let full_name = await this.get_table_full_name(path_i.field.manyToOne_target_moduletable, get_active_field_filters);

                    switch (path_i.field.field_type) {
                        case ModuleTableField.FIELD_TYPE_foreign_key:
                        case ModuleTableField.FIELD_TYPE_file_ref:
                        case ModuleTableField.FIELD_TYPE_image_ref:
                            jointures.push(
                                full_name + ' ' + tables_aliases_by_type[path_i.field.manyToOne_target_moduletable.vo_type] +
                                ' on ' +
                                tables_aliases_by_type[path_i.field.manyToOne_target_moduletable.vo_type] + '.id = ' +
                                tables_aliases_by_type[path_i.field.module_table.vo_type] + '.' + path_i.field.field_id
                            );
                            break;
                        case ModuleTableField.FIELD_TYPE_refrange_array:
                            jointures.push(
                                full_name + ' ' + tables_aliases_by_type[path_i.field.manyToOne_target_moduletable.vo_type] +
                                ' on ' +
                                tables_aliases_by_type[path_i.field.manyToOne_target_moduletable.vo_type] + '.id::numeric <@ ANY(' +
                                tables_aliases_by_type[path_i.field.module_table.vo_type] + '.' + path_i.field.field_id + ')'
                            );
                            break;
                        default:
                            throw new Error('Not Implemented');
                    }
                }
            } else {
                if (!tables_aliases_by_type[path_i.field.module_table.vo_type]) {

                    tables_aliases_by_type[path_i.field.module_table.vo_type] = 't' + (aliases_n++);
                    joined_tables_by_vo_type[path_i.field.module_table.vo_type] = path_i.field.module_table;

                    let full_name = await this.get_table_full_name(path_i.field.module_table, get_active_field_filters);

                    switch (path_i.field.field_type) {
                        case ModuleTableField.FIELD_TYPE_foreign_key:
                        case ModuleTableField.FIELD_TYPE_file_ref:
                        case ModuleTableField.FIELD_TYPE_image_ref:
                            jointures.push(
                                full_name + ' ' + tables_aliases_by_type[path_i.field.module_table.vo_type] +
                                ' on ' +
                                tables_aliases_by_type[path_i.field.module_table.vo_type] + '.' + path_i.field.field_id + ' = ' +
                                tables_aliases_by_type[path_i.field.manyToOne_target_moduletable.vo_type] + '.id'
                            );
                            break;
                        case ModuleTableField.FIELD_TYPE_refrange_array:
                            jointures.push(
                                full_name + ' ' + tables_aliases_by_type[path_i.field.module_table.vo_type] +
                                ' on ' +
                                tables_aliases_by_type[path_i.field.manyToOne_target_moduletable.vo_type] + '.id::numeric <@ ANY(' +
                                tables_aliases_by_type[path_i.field.module_table.vo_type] + '.' + path_i.field.field_id + ')'
                            );
                            break;
                        default:
                            throw new Error('Not Implemented');
                    }
                }
            }
        }

        return aliases_n;
    }

    /**
     * Fonction qui cherche à renvoyer un table full_name, même quand la table est segmentée
     *  Faire évoluer vers un tableau de full_names et gérer le tableau dans le context filter pour
     *  faire des requetes de context filter sur tables segmentées
     */
    public async get_table_full_name(
        moduletable: ModuleTable<any>,
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }): Promise<string> {

        let full_name = moduletable.full_name;

        /**
         * FIXME Les tables segmentées sont pas du tout compatibles pour le moment
         */
        if (moduletable.is_segmented) {

            /**
             * On peut peut-être gérer un cas simple, une table segmentée sur laquelle on a fait un filtrage
             *  précis sur le champ de segmentation, ce qui fait une requete sur une table en fait
             *  ou alors sur un champs unique de l'objet qui est lié directement en onetomany au champ de segmentation
             *  exemple du userlog, segmenté sur user_id, et on sélection un user par l'email (unique) on peut donc
             *  charger le user, puis son id, puis la table segmentée précise
             */
            let is_implemented = false;

            // Cas champ segmenté exacte
            if (get_active_field_filters && get_active_field_filters[moduletable.vo_type] &&
                get_active_field_filters[moduletable.vo_type][moduletable.table_segmented_field.field_id]) {

                let filter = get_active_field_filters[moduletable.vo_type][moduletable.table_segmented_field.field_id];

                if ((filter.filter_type == ContextFilterVO.TYPE_NUMERIC_EQUALS) &&
                    (filter.param_numeric != null)) {
                    is_implemented = true;
                    full_name = moduletable.get_segmented_full_name(filter.param_numeric);
                }
            }

            // Cas champ unique du vo_type sur lequel on segmente
            if ((!is_implemented) && moduletable.table_segmented_field.manyToOne_target_moduletable) {
                let linked_segment_table = moduletable.table_segmented_field.manyToOne_target_moduletable;

                if (get_active_field_filters && get_active_field_filters[linked_segment_table.vo_type]) {

                    let linked_segment_field_filters = get_active_field_filters[linked_segment_table.vo_type];

                    let context_query = new ContextQueryVO();
                    context_query.base_api_type_id = linked_segment_table.vo_type;
                    context_query.active_api_type_ids = [linked_segment_table.vo_type];
                    context_query.filters = ContextFilterHandler.getInstance().get_filters_from_active_field_filters(
                        { [linked_segment_table.vo_type]: linked_segment_field_filters });
                    let query_res: any[] = await ContextQueryServerController.getInstance().select_vos(context_query);

                    if (query_res && query_res.length) {

                        let unique_segment_vos = await ModuleDAOServer.getInstance().filterVOsAccess(linked_segment_table, ModuleDAO.DAO_ACCESS_TYPE_READ, linked_segment_table.forceNumerics(query_res));

                        if (unique_segment_vos && (unique_segment_vos.length == 1)) {
                            is_implemented = true;
                            full_name = moduletable.get_segmented_full_name(unique_segment_vos[0].id);
                        }
                    }
                }
            }

            if (!is_implemented) {
                throw new Error('Not implemented');
            }
        }

        return full_name;
    }
}
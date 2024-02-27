import pgPromise from 'pg-promise';
import ContextQueryInjectionCheckHandler from '../../../shared/modules/ContextFilter/ContextQueryInjectionCheckHandler';
import ContextFilterVOHandler from '../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextFilterVO from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryVO, { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import FieldPathWrapper from '../../../shared/modules/ContextFilter/vos/FieldPathWrapper';
import ParameterizedQueryWrapper from '../../../shared/modules/ContextFilter/vos/ParameterizedQueryWrapper';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleTableController from '../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldController from '../../../shared/modules/DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../../../shared/modules/DAO/vos/ModuleTableVO';
import NumRange from '../../../shared/modules/DataRender/vos/NumRange';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import MatroidIndexHandler from '../../../shared/tools/MatroidIndexHandler';
import RangeHandler from '../../../shared/tools/RangeHandler';
import StackContext from '../../StackContext';
import ServerAnonymizationController from '../Anonymization/ServerAnonymizationController';
import DAOServerController from '../DAO/DAOServerController';
import ContextQueryServerController from './ContextQueryServerController';

export default class ContextFilterServerController {

    // istanbul ignore next: cannot test configure
    public static async configure() {
    }

    /**
     * Check injection : OK
     * @param where_conditions
     * @param context_filter
     * @param tables_aliases_by_type
     * @returns
     */
    public static async update_where_conditions(
        context_query: ContextQueryVO,
        query_result: ParameterizedQueryWrapper,
        where_conditions: string[],
        context_filter: ContextFilterVO,
        tables_aliases_by_type: { [vo_type: string]: string }
    ) {

        ContextQueryInjectionCheckHandler.assert_api_type_id_format(context_filter.vo_type);
        ContextQueryInjectionCheckHandler.assert_postgresql_name_format(context_filter.field_name);

        if (context_filter.param_alias) {
            ContextQueryInjectionCheckHandler.assert_postgresql_name_format(context_filter.param_alias);
        }

        const field_name = context_filter.field_name ?
            tables_aliases_by_type[context_filter.vo_type] + '.' + context_filter.field_name :
            null;

        /**
         * On est sur un filtre qui a pas de rapport a priori avec la requete (aucune jointure trouvée)
         *  on ignore le filtrage tout simplement
         */
        if (field_name && !tables_aliases_by_type[context_filter.vo_type]) {
            // Typiquement pas un souci dans les requetes sur les param de vars dans les dbs ...
            // ConsoleHandler.log('Filtrage initié via table non liée à la requête (pas forcément une erreur dans un DB pour le moment):' + JSON.stringify(context_filter) + ':' + JSON.stringify(tables_aliases_by_type) + ':');
            return;
        }

        const field = context_filter.vo_type ?
            ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[context_filter.vo_type][context_filter.field_name] :
            null;

        /**
         * Cas spécifique de l'id qu'on doit gérer comme un field de type int
         *  et des or / xor / ... qui n'ont pas de filed_id et pas de vo_type
         */
        const field_type = field_name ? (field ? field.field_type : ModuleTableFieldVO.FIELD_TYPE_int) : null;

        // On tente de déanonymiser avant de construire la requête
        const uid = await StackContext.get('UID');
        if (context_filter.param_text) {
            context_filter.param_text = await ServerAnonymizationController.get_unanonymised_row_field_value(
                context_filter.param_text,
                context_filter.vo_type,
                context_filter.field_name,
                uid
            );
        }
        if (context_filter.param_textarray) {
            for (const i in context_filter.param_textarray) {
                const param_text = context_filter.param_textarray[i];

                context_filter.param_textarray[i] = await ServerAnonymizationController.get_unanonymised_row_field_value(param_text, context_filter.vo_type, context_filter.field_name, uid);
            }
        }

        switch (context_filter.filter_type) {

            case ContextFilterVO.TYPE_BOOLEAN_TRUE_ALL:
            case ContextFilterVO.TYPE_BOOLEAN_TRUE_ANY:
                where_conditions.push(field_name + " = TRUE");
                break;
            case ContextFilterVO.TYPE_BOOLEAN_FALSE_ALL:
            case ContextFilterVO.TYPE_BOOLEAN_FALSE_ANY:
                where_conditions.push(field_name + " = FALSE");
                break;

            case ContextFilterVO.TYPE_TEXT_CONTAINS_ALL_EXACT:
                switch (field_type) {

                    case ModuleTableFieldVO.FIELD_TYPE_string:
                    case ModuleTableFieldVO.FIELD_TYPE_html:
                    case ModuleTableFieldVO.FIELD_TYPE_file_field:
                    case ModuleTableFieldVO.FIELD_TYPE_textarea:
                    case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
                    case ModuleTableFieldVO.FIELD_TYPE_email:
                    case ModuleTableFieldVO.FIELD_TYPE_password:

                    /**
                     * C'est pas ça, pour plein de raisons : il faut pouvoir conserver les filtres dans la sub query ,mais pas tous sinon cyclique
                     *  et puis en fait l'exemple c'est de savoir si un utilisateur est rôles A et B,  mais on trouvera toujours A et B dans les rôles,
                     *  juste peut-etre pas dans les rôles de l'utilisateur. Donc faudrait même presque tester les role_id du userrolevo dont user_id = x
                     *  à creuser
                     */
                    // /**
                    //  * Le but est d'identifier que toutes les refs de ce champs (toutes les valeurs possibles avec la requête en cours)
                    //  *  incluent toutes les valeurs du param text_array
                    //  */
                    // if ((!context_filter.param_textarray) || (!context_filter.param_textarray.length)) {
                    //     throw new Error('Not implemented');
                    // }

                    // let filters = context_query.filters.filter((filter) => filter != context_filter);
                    // let sub_query = cloneDeep(context_query);
                    // sub_query.base_api_type_id = context_filter.vo_type;
                    // sub_query.filters = filters;
                    // sub_query.fields = [];
                    // sub_query.field(
                    //     context_filter.field_name, null, context_filter.vo_type,
                    //     VarConfVO.ARRAY_AGG_AGGREGATOR,
                    //     context_filter.text_ignore_case ? ContextQueryFieldVO.FIELD_MODIFIER_LOWER : ContextQueryFieldVO.FIELD_MODIFIER_NONE);
                    // let sub_query_str = await ContextQueryServerController.build_select_query(sub_query);

                    // if ((!sub_query_str) || (!sub_query_str.query)) {
                    //     throw new Error('Invalid query');
                    // }

                    // let string_array = '';
                    // if (context_filter.text_ignore_case) {
                    //     string_array = context_filter.param_textarray.map((t) => t ? t.toLowerCase() : t).join("', '");
                    // } else {
                    //     string_array = context_filter.param_textarray.join("', '");
                    // }

                    // where_conditions.push('(' + sub_query_str + ") @> Array['" + string_array + "']");

                    // break;


                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:

                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:

                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_string_array:
                    case ModuleTableFieldVO.FIELD_TYPE_html_array:
                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_TEXT_INCLUDES_ANY:
                switch (field_type) {

                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:
                        let text_TYPE_TEXT_INCLUDES_ANY = null;
                        if (context_filter.param_numeric != null) {
                            text_TYPE_TEXT_INCLUDES_ANY = context_filter.param_numeric.toString();
                        } else if (context_filter.param_text != null) {
                            text_TYPE_TEXT_INCLUDES_ANY = context_filter.param_text;
                        } else {
                            throw new Error('Not Implemented');
                        }

                        if (context_filter.text_ignore_case) {
                            where_conditions.push(field_name + "::text ILIKE " + pgPromise.as.format('$1', ["%" + text_TYPE_TEXT_INCLUDES_ANY + "%"]));
                        } else {
                            where_conditions.push(field_name + "::text LIKE " + pgPromise.as.format('$1', ["%" + text_TYPE_TEXT_INCLUDES_ANY + "%"]));
                        }

                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_password:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_string:
                    case ModuleTableFieldVO.FIELD_TYPE_html:
                    case ModuleTableFieldVO.FIELD_TYPE_file_field:
                    case ModuleTableFieldVO.FIELD_TYPE_textarea:
                    case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
                    case ModuleTableFieldVO.FIELD_TYPE_email:
                        if (context_filter.param_text != null) {
                            const text = context_filter.param_text;

                            if (context_filter.text_ignore_case) {
                                where_conditions.push(field_name + " ILIKE " + pgPromise.as.format('$1', ["%" + text + "%"]));
                            } else {
                                where_conditions.push(field_name + " LIKE " + pgPromise.as.format('$1', ["%" + text + "%"]));
                            }
                        } else if (context_filter.param_textarray != null) {
                            if (context_filter.param_textarray.length == 0) {
                                where_conditions.push("false");
                                break;
                            }

                            const like_array = [];
                            for (const i in context_filter.param_textarray) {
                                const text = context_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }

                                like_array.push(pgPromise.as.format('$1', ["%" + text + "%"]));
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }

                            if (context_filter.text_ignore_case) {
                                where_conditions.push(field_name + " ILIKE ANY(ARRAY[" + like_array.join(',') + "])");
                            } else {
                                where_conditions.push(field_name + " LIKE ANY(ARRAY[" + like_array.join(',') + "])");
                            }
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_string_array:
                    case ModuleTableFieldVO.FIELD_TYPE_html_array:
                        if (context_filter.param_text != null) {
                            const text = context_filter.param_text;

                            if (context_filter.text_ignore_case) {

                                where_conditions.push(
                                    'EXISTS ( ' +
                                    '  select 1' +
                                    '  from unnest(' + tables_aliases_by_type[context_filter.vo_type] + '.' + field.field_name + ') as a' +
                                    '  where a ILIKE ' + pgPromise.as.format('$1', ["%" + text + "%"]) +
                                    '  )');
                            } else {

                                where_conditions.push(
                                    'EXISTS ( ' +
                                    '  select 1' +
                                    '  from unnest(' + tables_aliases_by_type[context_filter.vo_type] + '.' + field.field_name + ') as a' +
                                    '  where a LIKE ' + pgPromise.as.format('$1', ["%" + text + "%"]) +
                                    '  )');
                            }
                        } else if (context_filter.param_textarray != null) {
                            const like_array = [];
                            for (const i in context_filter.param_textarray) {
                                const text = context_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }

                                if (context_filter.text_ignore_case) {

                                    where_conditions.push(
                                        'EXISTS ( ' +
                                        '  select 1' +
                                        '  from unnest(' + tables_aliases_by_type[context_filter.vo_type] + '.' + field.field_name + ') as a' +
                                        '  where a ILIKE ANY(ARRAY[' + like_array.join(',') + '])' +
                                        '  )');
                                } else {

                                    where_conditions.push(
                                        'EXISTS ( ' +
                                        '  select 1' +
                                        '  from unnest(' + tables_aliases_by_type[context_filter.vo_type] + '.' + field.field_name + ') as a' +
                                        '  where a LIKE ANY(ARRAY[' + like_array.join(',') + '])' +
                                        '  )');
                                }
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
                switch (field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:

                        if (context_filter.param_alias != null) {
                            /**
                             * Check injection ok : field_name check ok et param_alias checké aussi
                             */
                            where_conditions.push(field_name + " = " + context_filter.param_alias);
                            break;
                        }

                        if (context_filter.param_tsranges != null) {
                            /**
                             * On devrait renommer en equals_all, et donc si on a un cardinal de tsranges > 1, on a forcément aucun résultat
                             */
                            if (RangeHandler.getCardinalFromArray(context_filter.param_tsranges) != 1) {
                                where_conditions.push("false");
                                break;
                            }
                            ContextQueryInjectionCheckHandler.assert_integer(context_filter.param_tsranges[0].min);
                            where_conditions.push(field_name + " = " + context_filter.param_tsranges[0].min);
                            break;
                        }

                        if (context_filter.param_numeric_array != null) {

                            context_filter.param_numeric_array = context_filter.param_numeric_array.filter((v) => v != undefined);

                            if (context_filter.param_numeric_array.length == 0) {
                                where_conditions.push("false");
                                break;
                            }

                            for (const i in context_filter.param_numeric_array) {
                                const value = context_filter.param_numeric_array[i];

                                if (value === null || value === undefined) {
                                    continue;
                                }

                                ContextQueryInjectionCheckHandler.assert_numeric(value);
                            }

                            // Si on demande sur plusieurs numerics c'est qu'on cherche une valeur dans le lot
                            // FIXME séparer comme pour tous les autres en ANY et ALL ? (pour le moment on fait un ANY)
                            where_conditions.push(field_name + " = ANY(ARRAY[" + context_filter.param_numeric_array.join(',') + '])');
                            break;
                        } else if (context_filter.param_numeric != null) {

                            ContextQueryInjectionCheckHandler.assert_numeric(context_filter.param_numeric);
                            where_conditions.push(field_name + " = " + context_filter.param_numeric);
                            break;
                        }

                        if ((context_filter.param_alias == null) && (context_filter.param_numeric == null)) {

                            /**
                             * Par défaut si num et alias sont null, on est en train de dire qu'on cherche une valeur nulle
                             */
                            where_conditions.push(field_name + " is NULL");
                            break;
                        }

                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:

                        if (context_filter.param_tsranges && context_filter.param_tsranges.length) {

                            /**
                             * Check injection ok : get_normalized_ranges ok
                             */
                            let ranges_clause = null;
                            ranges_clause = "'" + MatroidIndexHandler.get_normalized_ranges(context_filter.param_tsranges) + "'";
                            where_conditions.push(ranges_clause + " = " + field.field_name + '_ndx');

                            break;
                        } else {
                            throw new Error('Not Implemented');
                        }

                    default:
                        throw new Error('Not Implemented');
                }
                break;


            case ContextFilterVO.TYPE_TEXT_EQUALS_ALL:
                switch (field_type) {

                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:

                        if (context_filter.param_alias != null) {
                            where_conditions.push(field_name + " = " + context_filter.param_alias);
                            break;
                        }

                        if (context_filter.param_numeric != null) {
                            ContextQueryInjectionCheckHandler.assert_numeric(context_filter.param_numeric);
                            where_conditions.push(field_name + " = " + context_filter.param_numeric);
                            break;
                        }

                        if (context_filter.param_text != null) {
                            const param_text = parseFloat(context_filter.param_text);
                            ContextQueryInjectionCheckHandler.assert_numeric(param_text);
                            where_conditions.push(field_name + " = " + param_text);
                            break;
                        }

                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_password:
                        if (context_filter.param_alias != null) {
                            where_conditions.push(
                                field_name +
                                " = " +
                                context_filter.param_alias);

                            break;
                        }

                        if (context_filter.param_text != null) {
                            const text = (context_filter.param_text && context_filter.text_ignore_case) ? context_filter.param_text.toLowerCase() : context_filter.param_text;
                            where_conditions.push(field_name + " = crypt(" + pgPromise.as.format('$1', [text]) + ", " + field_name + ")");
                        } else if (context_filter.param_textarray != null) {
                            const like_array = [];
                            for (const i in context_filter.param_textarray) {
                                const param_text = context_filter.param_textarray[i];
                                const text = (param_text && context_filter.text_ignore_case) ? param_text.toLowerCase() : param_text;
                                if (!text) {
                                    continue;
                                }

                                like_array.push("crypt(" + pgPromise.as.format('$1', [text]) + ", " + field_name + ")");
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            // TODO on peut aussi identifie qu'on a plusieurs chaines différentes et fuir la requete (si on doit être = à TOUS il vaut mieux en avoir qu'un...)
                            where_conditions.push(field_name + " = ALL(ARRAY[" + like_array.join(',') + "])");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_string:
                    case ModuleTableFieldVO.FIELD_TYPE_html:
                    case ModuleTableFieldVO.FIELD_TYPE_file_field:
                    case ModuleTableFieldVO.FIELD_TYPE_textarea:
                    case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
                    case ModuleTableFieldVO.FIELD_TYPE_email:
                        if (context_filter.param_alias != null) {
                            where_conditions.push(
                                (context_filter.text_ignore_case ? 'LOWER(' : '') + field_name + (context_filter.text_ignore_case ? ')' : '') +
                                " = " +
                                (context_filter.text_ignore_case ? 'LOWER(' : '') + context_filter.param_alias + (context_filter.text_ignore_case ? ')' : ''));

                            break;
                        }

                        if (context_filter.param_text != null) {
                            const text = (context_filter.param_text && context_filter.text_ignore_case) ? context_filter.param_text.toLowerCase() : context_filter.param_text;
                            where_conditions.push((context_filter.text_ignore_case ? 'LOWER(' : '') + field_name + (context_filter.text_ignore_case ? ')' : '') + " = " + pgPromise.as.format('$1', [text]));
                        } else if (context_filter.param_textarray != null) {
                            const like_array = [];
                            for (const i in context_filter.param_textarray) {
                                const param_text = context_filter.param_textarray[i];
                                const text = (param_text && context_filter.text_ignore_case) ? param_text.toLowerCase() : param_text;
                                if (!text) {
                                    continue;
                                }

                                like_array.push(pgPromise.as.format('$1', [text]));
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            // TODO on peut aussi identifie qu'on a plusieurs chaines différentes et fuir la requete (si on doit être = à TOUS il vaut mieux en avoir qu'un...)
                            where_conditions.push((context_filter.text_ignore_case ? 'LOWER(' : '') + field_name + (context_filter.text_ignore_case ? ')' : '') + " = ALL(ARRAY[" + like_array.join(',') + "])");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_string_array:
                    case ModuleTableFieldVO.FIELD_TYPE_html_array:

                        /**
                         * TODO FIXME le ignore_case est pas pris en compte sur les tableaux par ce que c'est le merdier à faire :
                         *  https://stackoverflow.com/questions/65488634/error-function-lowertext-does-not-exist
                         */
                        if (context_filter.param_text != null) {

                            const text = context_filter.param_text;
                            where_conditions.push(pgPromise.as.format('$1', [text]) + " = ALL(" + field_name + ")");

                        } else if (context_filter.param_textarray != null) {

                            const like_array = [];
                            for (const i in context_filter.param_textarray) {
                                // let param_text = context_filter.param_textarray[i];
                                // let text = (param_text && context_filter.text_ignore_case) ? param_text.toLowerCase() : param_text;
                                const text = context_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }

                                like_array.push(pgPromise.as.format('$1', [text]));
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push("['" + like_array.join("','") + "'] <@ " + field_name +
                                " AND ['" + like_array.join("','") + "'] @> " + field_name);
                            // where_conditions.push("['" + like_array.join("','") + "'] <@ " + (context_filter.text_ignore_case ? 'LOWER(' : '') + field_name + (context_filter.text_ignore_case ? ')' : '') +
                            //     " AND ['" + like_array.join("','") + "'] @> " + (context_filter.text_ignore_case ? 'LOWER(' : '') + field_name + (context_filter.text_ignore_case ? ')' : ''));
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_TEXT_EQUALS_ANY:
                switch (field_type) {

                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:

                        if (context_filter.param_alias != null) {
                            where_conditions.push(field_name + " = " + context_filter.param_alias);
                            break;
                        }

                        if (context_filter.param_numeric != null) {
                            ContextQueryInjectionCheckHandler.assert_numeric(context_filter.param_numeric);
                            where_conditions.push(field_name + " = " + context_filter.param_numeric);
                            break;
                        }

                        if (context_filter.param_text != null) {
                            const param_text = parseFloat(context_filter.param_text);
                            ContextQueryInjectionCheckHandler.assert_numeric(param_text);
                            where_conditions.push(field_name + " = " + param_text);
                            break;
                        }

                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_password:
                        if (context_filter.param_alias != null) {
                            where_conditions.push(
                                field_name +
                                " = " +
                                context_filter.param_alias);

                            break;
                        }

                        if (context_filter.param_text != null) {
                            const text = (context_filter.param_text && context_filter.text_ignore_case) ? context_filter.param_text.toLowerCase() : context_filter.param_text;

                            where_conditions.push(field_name + " = crypt(" + pgPromise.as.format('$1', [text]) + ", " + field_name + ")");
                        } else if (context_filter.param_textarray != null) {

                            if (context_filter.param_textarray.length == 0) {
                                where_conditions.push("false");
                                break;
                            }

                            const like_array = [];
                            for (const i in context_filter.param_textarray) {
                                const param_text = context_filter.param_textarray[i];
                                const text = (param_text && context_filter.text_ignore_case) ? param_text.toLowerCase() : param_text;
                                if (!text) {
                                    continue;
                                }

                                like_array.push("crypt(" + pgPromise.as.format('$1', [text]) + ", " + field_name + ")");
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push(field_name + " = ANY(ARRAY[" + like_array.join(',') + "])");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_string:
                    case ModuleTableFieldVO.FIELD_TYPE_html:
                    case ModuleTableFieldVO.FIELD_TYPE_file_field:
                    case ModuleTableFieldVO.FIELD_TYPE_textarea:
                    case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
                    case ModuleTableFieldVO.FIELD_TYPE_email:
                        if (context_filter.param_alias != null) {
                            where_conditions.push(
                                (context_filter.text_ignore_case ? 'LOWER(' : '') + field_name + (context_filter.text_ignore_case ? ')' : '') +
                                " = " +
                                (context_filter.text_ignore_case ? 'LOWER(' : '') + context_filter.param_alias + (context_filter.text_ignore_case ? ')' : ''));

                            break;
                        }

                        if (context_filter.param_text != null) {
                            const text = (context_filter.param_text && context_filter.text_ignore_case) ? context_filter.param_text.toLowerCase() : context_filter.param_text;

                            where_conditions.push((context_filter.text_ignore_case ? 'LOWER(' : '') + field_name + (context_filter.text_ignore_case ? ')' : '') + " = " + pgPromise.as.format('$1', [text]));
                        } else if (context_filter.param_textarray != null) {

                            if (context_filter.param_textarray.length == 0) {
                                where_conditions.push("false");
                                break;
                            }

                            const like_array = [];
                            for (const i in context_filter.param_textarray) {
                                const param_text = context_filter.param_textarray[i];
                                const text = (param_text && context_filter.text_ignore_case) ? param_text.toLowerCase() : param_text;
                                if (!text) {
                                    continue;
                                }

                                like_array.push(pgPromise.as.format('$1', [text]));
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push((context_filter.text_ignore_case ? 'LOWER(' : '') + field_name + (context_filter.text_ignore_case ? ')' : '') + " = ANY(ARRAY[" + like_array.join(',') + "])");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_string_array:
                    case ModuleTableFieldVO.FIELD_TYPE_html_array:
                        /**
                         * TODO FIXME le ignore_case est pas pris en compte sur les tableaux par ce que c'est le merdier à faire :
                         *  https://stackoverflow.com/questions/65488634/error-function-lowertext-does-not-exist
                         */

                        if (context_filter.param_text != null) {
                            const text = context_filter.param_text;
                            where_conditions.push(pgPromise.as.format('$1', [text]) + " = ANY(" + field_name + ")");

                        } else if (context_filter.param_textarray != null) {
                            const like_array = [];
                            for (const i in context_filter.param_textarray) {
                                // let param_text = context_filter.param_textarray[i];
                                // let text = (param_text && context_filter.text_ignore_case) ? param_text.toLowerCase() : param_text;
                                const text = context_filter.param_textarray[i];

                                if (!text) {
                                    continue;
                                }

                                like_array.push(pgPromise.as.format('$1', [text]) + " = ANY(" + field_name + ')');

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
                switch (field_type) {

                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:
                        if (context_filter.param_numeric != null) {
                            const text = context_filter.param_numeric.toString();

                            if (context_filter.text_ignore_case) {
                                where_conditions.push(field_name + "::text ILIKE " + pgPromise.as.format('$1', [text + '%']));
                            } else {
                                where_conditions.push(field_name + "::text LIKE " + pgPromise.as.format('$1', [text + '%']));
                            }
                        } else if (context_filter.param_text != null) {
                            const text = context_filter.param_text;

                            if (context_filter.text_ignore_case) {
                                where_conditions.push(field_name + "::text ILIKE " + pgPromise.as.format('$1', [text + '%']));
                            } else {
                                where_conditions.push(field_name + "::text LIKE " + pgPromise.as.format('$1', [text + '%']));
                            }
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_password:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_string:
                    case ModuleTableFieldVO.FIELD_TYPE_html:
                    case ModuleTableFieldVO.FIELD_TYPE_file_field:
                    case ModuleTableFieldVO.FIELD_TYPE_textarea:
                    case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
                    case ModuleTableFieldVO.FIELD_TYPE_email:
                        if (context_filter.param_alias != null) {

                            if (context_filter.text_ignore_case) {
                                where_conditions.push(field_name + " ILIKE " + context_filter.param_alias + " || '%'");
                            } else {
                                where_conditions.push(field_name + " LIKE " + context_filter.param_alias + " || '%'");
                            }
                            break;
                        }

                        if (context_filter.param_text != null) {
                            const text = context_filter.param_text;

                            if (context_filter.text_ignore_case) {
                                where_conditions.push(field_name + " ILIKE " + pgPromise.as.format('$1', [text + '%']));
                            } else {
                                where_conditions.push(field_name + " LIKE " + pgPromise.as.format('$1', [text + '%']));
                            }
                        } else if (context_filter.param_textarray != null) {
                            if (context_filter.param_textarray.length == 0) {
                                where_conditions.push("false");
                                break;
                            }

                            const like_array = [];
                            for (const i in context_filter.param_textarray) {
                                const text = context_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }

                                like_array.push(pgPromise.as.format('$1', [text + '%']));
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }

                            if (context_filter.text_ignore_case) {
                                where_conditions.push(field_name + " ILIKE ANY(ARRAY[" + like_array.join(',') + "])");
                            } else {
                                where_conditions.push(field_name + " LIKE ANY(ARRAY[" + like_array.join(',') + "])");
                            }
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_string_array:
                    case ModuleTableFieldVO.FIELD_TYPE_html_array:

                        if (context_filter.param_text != null) {

                            const text = context_filter.param_text;
                            if (context_filter.text_ignore_case) {
                                where_conditions.push(pgPromise.as.format('$1', [text + '%']) + " ILIKE ANY(" + field_name + ')');
                            } else {
                                where_conditions.push(pgPromise.as.format('$1', [text + '%']) + " LIKE ANY(" + field_name + ')');
                            }

                        } else if (context_filter.param_textarray != null) {

                            const like_array = [];
                            for (const i in context_filter.param_textarray) {

                                const text = context_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }

                                if (context_filter.text_ignore_case) {
                                    like_array.push(pgPromise.as.format('$1', [text + '%']) + " ILIKE ANY(" + field_name + ')');
                                } else {
                                    like_array.push(pgPromise.as.format('$1', [text + '%']) + " LIKE ANY(" + field_name + ')');
                                }
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
                switch (field_type) {

                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:
                        if (context_filter.param_numeric != null) {
                            const text = context_filter.param_numeric.toString();

                            if (context_filter.text_ignore_case) {
                                where_conditions.push(field_name + "::text ILIKE " + pgPromise.as.format('$1', ['%' + text]));
                            } else {
                                where_conditions.push(field_name + "::text LIKE " + pgPromise.as.format('$1', ['%' + text]));
                            }
                        } else if (context_filter.param_text != null) {
                            const text = context_filter.param_text;

                            if (context_filter.text_ignore_case) {
                                where_conditions.push(field_name + "::text ILIKE " + pgPromise.as.format('$1', ['%' + text]));
                            } else {
                                where_conditions.push(field_name + "::text LIKE " + pgPromise.as.format('$1', ['%' + text]));
                            }
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_password:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_string:
                    case ModuleTableFieldVO.FIELD_TYPE_html:
                    case ModuleTableFieldVO.FIELD_TYPE_file_field:
                    case ModuleTableFieldVO.FIELD_TYPE_textarea:
                    case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
                    case ModuleTableFieldVO.FIELD_TYPE_email:
                        if (context_filter.param_alias != null) {

                            if (context_filter.text_ignore_case) {
                                where_conditions.push(field_name + " ILIKE '%' || " + context_filter.param_alias);
                            } else {
                                where_conditions.push(field_name + " LIKE '%' || " + context_filter.param_alias);
                            }
                            break;
                        }

                        if (context_filter.param_text != null) {

                            const text = context_filter.param_text;
                            if (context_filter.text_ignore_case) {
                                where_conditions.push(field_name + " ILIKE " + pgPromise.as.format('$1', ['%' + text]));
                            } else {
                                where_conditions.push(field_name + " LIKE " + pgPromise.as.format('$1', ['%' + text]));
                            }

                        } else if (context_filter.param_textarray != null) {
                            if (context_filter.param_textarray.length == 0) {
                                where_conditions.push("false");
                                break;
                            }

                            const like_array = [];
                            for (const i in context_filter.param_textarray) {
                                const text = context_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }

                                like_array.push(pgPromise.as.format('$1', ['%' + text]));
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }

                            if (context_filter.text_ignore_case) {
                                where_conditions.push(field_name + " ILIKE ANY(ARRAY[" + like_array.join(',') + "])");
                            } else {
                                where_conditions.push(field_name + " LIKE ANY(ARRAY[" + like_array.join(',') + "])");
                            }
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_string_array:
                    case ModuleTableFieldVO.FIELD_TYPE_html_array:

                        if (context_filter.param_text != null) {

                            const text = context_filter.param_text;

                            if (context_filter.text_ignore_case) {
                                where_conditions.push(pgPromise.as.format('$1', ['%' + text]) + " ILIKE ANY(" + field_name + ')');
                            } else {
                                where_conditions.push(pgPromise.as.format('$1', ['%' + text]) + " LIKE ANY(" + field_name + ')');
                            }
                        } else if (context_filter.param_textarray != null) {

                            const like_array = [];
                            for (const i in context_filter.param_textarray) {
                                const text = context_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }

                                if (context_filter.text_ignore_case) {
                                    like_array.push(pgPromise.as.format('$1', ['%' + text]) + " ILIKE ANY(" + field_name + ')');
                                } else {
                                    like_array.push(pgPromise.as.format('$1', ['%' + text]) + " LIKE ANY(" + field_name + ')');
                                }
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
                switch (field_type) {

                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:

                        if (context_filter.param_alias != null) {
                            where_conditions.push(field_name + " != " + context_filter.param_alias);
                            break;
                        }

                        if (context_filter.param_numeric != null) {
                            ContextQueryInjectionCheckHandler.assert_numeric(context_filter.param_numeric);
                            where_conditions.push(field_name + " != " + context_filter.param_numeric);
                            break;
                        }

                        if (context_filter.param_text != null) {
                            const param_text = parseFloat(context_filter.param_text);
                            ContextQueryInjectionCheckHandler.assert_numeric(param_text);
                            where_conditions.push(field_name + " != " + param_text);
                            break;
                        }

                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_password:

                        if (context_filter.param_text != null) {
                            const text = (context_filter.param_text && context_filter.text_ignore_case) ? context_filter.param_text.toLowerCase() : context_filter.param_text;

                            where_conditions.push(field_name + " != crypt(" + pgPromise.as.format('$1', [text]) + ", " + field_name + ")");

                        } else if (context_filter.param_textarray != null) {

                            const like_array = [];
                            for (const i in context_filter.param_textarray) {
                                const param_text = context_filter.param_textarray[i];
                                const text = (param_text && context_filter.text_ignore_case) ? param_text.toLowerCase() : param_text;

                                if (!text) {
                                    continue;
                                }

                                like_array.push("crypt(" + pgPromise.as.format('$1', [text]) + ", " + field_name + ")");
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push(field_name + " != ALL(ARRAY[" + like_array.join(',') + "])");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_string:
                    case ModuleTableFieldVO.FIELD_TYPE_html:
                    case ModuleTableFieldVO.FIELD_TYPE_file_field:
                    case ModuleTableFieldVO.FIELD_TYPE_textarea:
                    case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
                    case ModuleTableFieldVO.FIELD_TYPE_email:

                        if (context_filter.param_text != null) {
                            const text = (context_filter.param_text && context_filter.text_ignore_case) ? context_filter.param_text.toLowerCase() : context_filter.param_text;

                            where_conditions.push((context_filter.text_ignore_case ? 'LOWER(' : '') + field_name + (context_filter.text_ignore_case ? ')' : '') + " != " + pgPromise.as.format('$1', [text]));

                        } else if (context_filter.param_textarray != null) {

                            const like_array = [];
                            for (const i in context_filter.param_textarray) {
                                const param_text = context_filter.param_textarray[i];
                                const text = (param_text && context_filter.text_ignore_case) ? param_text.toLowerCase() : param_text;

                                if (!text) {
                                    continue;
                                }

                                like_array.push(pgPromise.as.format('$1', [text]));
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push((context_filter.text_ignore_case ? 'LOWER(' : '') + field_name + (context_filter.text_ignore_case ? ')' : '') + " != ALL(ARRAY[" + like_array.join(',') + "])");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_string_array:
                    case ModuleTableFieldVO.FIELD_TYPE_html_array:

                        /**
                         * TODO FIXME le ignore_case est pas pris en compte sur les tableaux par ce que c'est le merdier à faire :
                         *  https://stackoverflow.com/questions/65488634/error-function-lowertext-does-not-exist
                         */

                        if (context_filter.param_text != null) {
                            const text = context_filter.param_text;

                            where_conditions.push(pgPromise.as.format('$1', [text]) + " != ALL(" + field_name + ")");
                        } else if (context_filter.param_textarray != null) {
                            const like_array = [];
                            for (const i in context_filter.param_textarray) {
                                const text = context_filter.param_textarray[i];

                                if (!text) {
                                    continue;
                                }

                                like_array.push(pgPromise.as.format('$1', [text]) + " != ALL(" + field_name + ')');
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
                switch (field_type) {

                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:

                        if (context_filter.param_alias != null) {
                            where_conditions.push(field_name + " != " + context_filter.param_alias);
                            break;
                        }

                        if (context_filter.param_numeric != null) {
                            ContextQueryInjectionCheckHandler.assert_numeric(context_filter.param_numeric);
                            where_conditions.push(field_name + " != " + context_filter.param_numeric);
                            break;
                        }

                        if (context_filter.param_text != null) {
                            const param_text = parseFloat(context_filter.param_text);
                            ContextQueryInjectionCheckHandler.assert_numeric(param_text);
                            where_conditions.push(field_name + " != " + param_text);
                            break;
                        }

                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:
                        if (context_filter.param_numeric != null) {
                            const text = context_filter.param_numeric.toString();

                            if (context_filter.text_ignore_case) {
                                where_conditions.push(field_name + "::text NOT ILIKE " + pgPromise.as.format('$1', ['%' + text + '%']));
                            } else {
                                where_conditions.push(field_name + "::text NOT LIKE " + pgPromise.as.format('$1', ['%' + text + '%']));
                            }
                        } else if (context_filter.param_text != null) {
                            const text = context_filter.param_text;

                            if (context_filter.text_ignore_case) {
                                where_conditions.push(field_name + "::text NOT ILIKE " + pgPromise.as.format('$1', ['%' + text + '%']));
                            } else {
                                where_conditions.push(field_name + "::text NOT LIKE " + pgPromise.as.format('$1', ['%' + text + '%']));
                            }
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_password:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_string:
                    case ModuleTableFieldVO.FIELD_TYPE_html:
                    case ModuleTableFieldVO.FIELD_TYPE_file_field:
                    case ModuleTableFieldVO.FIELD_TYPE_textarea:
                    case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
                    case ModuleTableFieldVO.FIELD_TYPE_email:
                        if (context_filter.param_text != null) {
                            const text = context_filter.param_text;
                            if (context_filter.text_ignore_case) {
                                where_conditions.push(field_name + " NOT ILIKE " + pgPromise.as.format('$1', ['%' + text + '%']));
                            } else {
                                where_conditions.push(field_name + " NOT LIKE " + pgPromise.as.format('$1', ['%' + text + '%']));
                            }
                        } else if (context_filter.param_textarray != null) {
                            const like_array = [];
                            for (const i in context_filter.param_textarray) {
                                const text = context_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }

                                like_array.push(pgPromise.as.format('$1', ['%' + text + '%']));
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }

                            if (context_filter.text_ignore_case) {
                                where_conditions.push(field_name + " NOT ILIKE ALL(ARRAY[" + like_array.join(',') + "])");
                            } else {
                                where_conditions.push(field_name + " NOT LIKE ALL(ARRAY[" + like_array.join(',') + "])");
                            }
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_string_array:
                    case ModuleTableFieldVO.FIELD_TYPE_html_array:
                        if (context_filter.param_text != null) {
                            const text = context_filter.param_text;

                            if (context_filter.text_ignore_case) {
                                where_conditions.push(pgPromise.as.format('$1', ['%' + text + '%']) + " NOT ILIKE ALL(" + field_name + ')');
                            } else {
                                where_conditions.push(pgPromise.as.format('$1', ['%' + text + '%']) + " NOT LIKE ALL(" + field_name + ')');
                            }
                        } else if (context_filter.param_textarray != null) {
                            const like_array = [];
                            for (const i in context_filter.param_textarray) {
                                const text = context_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }

                                if (context_filter.text_ignore_case) {
                                    like_array.push(pgPromise.as.format('$1', ['%' + text + '%']) + " NOT ILIKE ALL(" + field_name + ')');
                                } else {
                                    like_array.push(pgPromise.as.format('$1', ['%' + text + '%']) + " NOT LIKE ALL(" + field_name + ')');
                                }
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
                switch (field_type) {

                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:
                        if (context_filter.param_numeric != null) {
                            const text = context_filter.param_numeric.toString();

                            if (context_filter.text_ignore_case) {
                                where_conditions.push(field_name + "::text NOT ILIKE " + pgPromise.as.format('$1', [text + '%']));
                            } else {
                                where_conditions.push(field_name + "::text NOT LIKE " + pgPromise.as.format('$1', [text + '%']));
                            }
                        } else if (context_filter.param_text != null) {
                            const text = context_filter.param_text;

                            if (context_filter.text_ignore_case) {
                                where_conditions.push(field_name + "::text NOT ILIKE " + pgPromise.as.format('$1', [text + '%']));
                            } else {
                                where_conditions.push(field_name + "::text NOT LIKE " + pgPromise.as.format('$1', [text + '%']));
                            }
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_password:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_string:
                    case ModuleTableFieldVO.FIELD_TYPE_html:
                    case ModuleTableFieldVO.FIELD_TYPE_file_field:
                    case ModuleTableFieldVO.FIELD_TYPE_textarea:
                    case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
                    case ModuleTableFieldVO.FIELD_TYPE_email:
                        if (context_filter.param_text != null) {
                            const text = context_filter.param_text;

                            if (context_filter.text_ignore_case) {
                                where_conditions.push(field_name + " NOT ILIKE " + pgPromise.as.format('$1', [text + '%']));
                            } else {
                                where_conditions.push(field_name + " NOT LIKE " + pgPromise.as.format('$1', [text + '%']));
                            }
                        } else if (context_filter.param_textarray != null) {
                            const like_array = [];
                            for (const i in context_filter.param_textarray) {
                                const text = context_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }

                                like_array.push(pgPromise.as.format('$1', [text + '%']));
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }

                            if (context_filter.text_ignore_case) {
                                where_conditions.push(field_name + " NOT ILIKE ALL(ARRAY[" + like_array.join(',') + "])");
                            } else {
                                where_conditions.push(field_name + " NOT LIKE ALL(ARRAY[" + like_array.join(',') + "])");
                            }
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_string_array:
                    case ModuleTableFieldVO.FIELD_TYPE_html_array:

                        if (context_filter.param_text != null) {

                            const text = context_filter.param_text;

                            if (context_filter.text_ignore_case) {
                                where_conditions.push(pgPromise.as.format('$1', [text + '%']) + " NOT ILIKE ALL(" + field_name + ')');
                            } else {
                                where_conditions.push(pgPromise.as.format('$1', [text + '%']) + " NOT LIKE ALL(" + field_name + ')');
                            }

                        } else if (context_filter.param_textarray != null) {

                            const like_array = [];
                            for (const i in context_filter.param_textarray) {
                                const text = context_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }

                                if (context_filter.text_ignore_case) {
                                    like_array.push(pgPromise.as.format('$1', [text + '%']) + " NOT ILIKE ALL(" + field_name + ')');
                                } else {
                                    like_array.push(pgPromise.as.format('$1', [text + '%']) + " NOT LIKE ALL(" + field_name + ')');
                                }
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
                switch (field_type) {

                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:

                        if (context_filter.param_numeric != null) {

                            const text = context_filter.param_numeric.toString();

                            if (context_filter.text_ignore_case) {
                                where_conditions.push(field_name + "::text NOT ILIKE " + pgPromise.as.format('$1', [text + '%']));
                            } else {
                                where_conditions.push(field_name + "::text NOT LIKE " + pgPromise.as.format('$1', [text + '%']));
                            }

                        } else if (context_filter.param_text != null) {

                            const text = context_filter.param_text;

                            if (context_filter.text_ignore_case) {
                                where_conditions.push(field_name + "::text NOT ILIKE " + pgPromise.as.format('$1', [text + '%']));
                            } else {
                                where_conditions.push(field_name + "::text NOT LIKE " + pgPromise.as.format('$1', [text + '%']));
                            }
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_password:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_string:
                    case ModuleTableFieldVO.FIELD_TYPE_html:
                    case ModuleTableFieldVO.FIELD_TYPE_file_field:
                    case ModuleTableFieldVO.FIELD_TYPE_textarea:
                    case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
                    case ModuleTableFieldVO.FIELD_TYPE_email:

                        if (context_filter.param_text != null) {

                            const text = context_filter.param_text;

                            if (context_filter.text_ignore_case) {
                                where_conditions.push(field_name + " NOT ILIKE " + pgPromise.as.format('$1', ['%' + text]));
                            } else {
                                where_conditions.push(field_name + " NOT LIKE " + pgPromise.as.format('$1', ['%' + text]));
                            }

                        } else if (context_filter.param_textarray != null) {

                            const like_array = [];
                            for (const i in context_filter.param_textarray) {
                                const text = context_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }

                                like_array.push(pgPromise.as.format('$1', ['%' + text]));
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }

                            if (context_filter.text_ignore_case) {
                                where_conditions.push(field_name + " NOT ILIKE ALL(ARRAY[" + like_array.join(',') + "])");
                            } else {
                                where_conditions.push(field_name + " NOT LIKE ALL(ARRAY[" + like_array.join(',') + "])");
                            }
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_string_array:
                    case ModuleTableFieldVO.FIELD_TYPE_html_array:

                        if (context_filter.param_text != null) {

                            const text = context_filter.param_text;

                            if (context_filter.text_ignore_case) {
                                where_conditions.push(pgPromise.as.format('$1', ['%' + text]) + " NOT ILIKE ALL(" + field_name + ')');
                            } else {
                                where_conditions.push(pgPromise.as.format('$1', ['%' + text]) + " NOT LIKE ALL(" + field_name + ')');
                            }
                        } else if (context_filter.param_textarray != null) {

                            const like_array = [];
                            for (const i in context_filter.param_textarray) {
                                const text = context_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }

                                if (context_filter.text_ignore_case) {
                                    like_array.push(pgPromise.as.format('$1', ['%' + text]) + " NOT ILIKE ALL(" + field_name + ')');
                                } else {
                                    like_array.push(pgPromise.as.format('$1', ['%' + text]) + " NOT LIKE ALL(" + field_name + ')');
                                }
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
                switch (field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:
                        if (context_filter.param_numeric_array != null) {

                            context_filter.param_numeric_array = context_filter.param_numeric_array.filter((v) => v != undefined);

                            if (context_filter.param_numeric_array.length == 0) {
                                // where_conditions.push("false");
                                break;
                            }

                            for (const i in context_filter.param_numeric_array) {
                                const value = context_filter.param_numeric_array[i];

                                if (value === null || value === undefined) {
                                    continue;
                                }

                                ContextQueryInjectionCheckHandler.assert_numeric(value);
                            }

                            where_conditions.push(field_name + " <= ALL(ARRAY[" + context_filter.param_numeric_array.join(',') + '])');
                        } else if (context_filter.param_numeric != null) {
                            ContextQueryInjectionCheckHandler.assert_numeric(context_filter.param_numeric);
                            where_conditions.push(field_name + " <= " + context_filter.param_numeric);
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_NUMERIC_INFEQ_ANY:
                switch (field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:
                        if (context_filter.param_numeric_array != null) {

                            context_filter.param_numeric_array = context_filter.param_numeric_array.filter((v) => v != undefined);

                            if (context_filter.param_numeric_array.length == 0) {
                                where_conditions.push("false");
                                break;
                            }

                            for (const i in context_filter.param_numeric_array) {
                                const value = context_filter.param_numeric_array[i];

                                if (value === null || value === undefined) {
                                    continue;
                                }

                                ContextQueryInjectionCheckHandler.assert_numeric(value);
                            }

                            where_conditions.push(field_name + " <= ANY(ARRAY[" + context_filter.param_numeric_array.join(',') + '])');
                        } else if (context_filter.param_numeric != null) {
                            ContextQueryInjectionCheckHandler.assert_numeric(context_filter.param_numeric);
                            where_conditions.push(field_name + " <= " + context_filter.param_numeric);
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_NUMERIC_INF_ALL:
                switch (field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:
                        if (context_filter.param_numeric_array != null) {

                            context_filter.param_numeric_array = context_filter.param_numeric_array.filter((v) => v != undefined);

                            if (context_filter.param_numeric_array.length == 0) {
                                // where_conditions.push("false");
                                break;
                            }

                            for (const i in context_filter.param_numeric_array) {
                                const value = context_filter.param_numeric_array[i];

                                if (value === null || value === undefined) {
                                    continue;
                                }

                                ContextQueryInjectionCheckHandler.assert_numeric(value);
                            }

                            where_conditions.push(field_name + " < ALL(ARRAY[" + context_filter.param_numeric_array.join(',') + '])');
                        } else if (context_filter.param_numeric != null) {
                            ContextQueryInjectionCheckHandler.assert_numeric(context_filter.param_numeric);
                            where_conditions.push(field_name + " < " + context_filter.param_numeric);
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_NUMERIC_INF_ANY:
                switch (field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:
                        if (context_filter.param_numeric_array != null) {

                            context_filter.param_numeric_array = context_filter.param_numeric_array.filter((v) => v != undefined);

                            if (context_filter.param_numeric_array.length == 0) {
                                where_conditions.push("false");
                                break;
                            }

                            for (const i in context_filter.param_numeric_array) {
                                const value = context_filter.param_numeric_array[i];

                                if (value === null || value === undefined) {
                                    continue;
                                }

                                ContextQueryInjectionCheckHandler.assert_numeric(value);
                            }

                            where_conditions.push(field_name + " < ANY(ARRAY[" + context_filter.param_numeric_array.join(',') + '])');
                        } else if (context_filter.param_numeric != null) {
                            ContextQueryInjectionCheckHandler.assert_numeric(context_filter.param_numeric);
                            where_conditions.push(field_name + " < " + context_filter.param_numeric);
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_NUMERIC_SUP_ALL:
                switch (field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:
                        if (context_filter.param_numeric_array != null) {

                            context_filter.param_numeric_array = context_filter.param_numeric_array.filter((v) => v != undefined);

                            if (context_filter.param_numeric_array.length == 0) {
                                // where_conditions.push("false");
                                break;
                            }

                            for (const i in context_filter.param_numeric_array) {
                                const value = context_filter.param_numeric_array[i];

                                if (value === null || value === undefined) {
                                    continue;
                                }

                                ContextQueryInjectionCheckHandler.assert_numeric(value);
                            }

                            where_conditions.push(field_name + " > ALL(ARRAY[" + context_filter.param_numeric_array.join(',') + '])');
                        } else if (context_filter.param_numeric != null) {
                            ContextQueryInjectionCheckHandler.assert_numeric(context_filter.param_numeric);
                            where_conditions.push(field_name + " > " + context_filter.param_numeric);
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_NUMERIC_SUP_ANY:
                switch (field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:
                        if (context_filter.param_numeric_array != null) {

                            context_filter.param_numeric_array = context_filter.param_numeric_array.filter((v) => v != undefined);

                            if (context_filter.param_numeric_array.length == 0) {
                                where_conditions.push("false");
                                break;
                            }

                            for (const i in context_filter.param_numeric_array) {
                                const value = context_filter.param_numeric_array[i];

                                if (value === null || value === undefined) {
                                    continue;
                                }

                                ContextQueryInjectionCheckHandler.assert_numeric(value);
                            }

                            where_conditions.push(field_name + " > ANY(ARRAY[" + context_filter.param_numeric_array.join(',') + '])');
                        } else if (context_filter.param_numeric != null) {
                            ContextQueryInjectionCheckHandler.assert_numeric(context_filter.param_numeric);
                            where_conditions.push(field_name + " > " + context_filter.param_numeric);
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_NUMERIC_SUPEQ_ALL:
                switch (field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:
                        if (context_filter.param_numeric_array != null) {

                            context_filter.param_numeric_array = context_filter.param_numeric_array.filter((v) => v != undefined);

                            if (context_filter.param_numeric_array.length == 0) {
                                // where_conditions.push("false");
                                break;
                            }

                            for (const i in context_filter.param_numeric_array) {
                                const value = context_filter.param_numeric_array[i];

                                if (value === null || value === undefined) {
                                    continue;
                                }

                                ContextQueryInjectionCheckHandler.assert_numeric(value);
                            }

                            where_conditions.push(field_name + " >= ALL(ARRAY[" + context_filter.param_numeric_array.join(',') + '])');
                        } else if (context_filter.param_numeric != null) {
                            ContextQueryInjectionCheckHandler.assert_numeric(context_filter.param_numeric);
                            where_conditions.push(field_name + " >= " + context_filter.param_numeric);
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_NUMERIC_SUPEQ_ANY:
                switch (field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:
                        if (context_filter.param_numeric_array != null) {

                            context_filter.param_numeric_array = context_filter.param_numeric_array.filter((v) => v != undefined);

                            if (context_filter.param_numeric_array.length == 0) {
                                where_conditions.push("false");
                                break;
                            }

                            for (const i in context_filter.param_numeric_array) {
                                const value = context_filter.param_numeric_array[i];

                                if (value === null || value === undefined) {
                                    continue;
                                }

                                ContextQueryInjectionCheckHandler.assert_numeric(value);
                            }

                            where_conditions.push(field_name + " >= ANY(ARRAY[" + context_filter.param_numeric_array.join(',') + '])');
                        } else if (context_filter.param_numeric != null) {
                            ContextQueryInjectionCheckHandler.assert_numeric(context_filter.param_numeric);
                            where_conditions.push(field_name + " >= " + context_filter.param_numeric);
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_NUMERIC_NOT_EQUALS:
                switch (field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:

                        if (context_filter.param_alias != null) {
                            where_conditions.push(field_name + " != " + context_filter.param_alias);
                            break;
                        }

                        if (context_filter.param_numeric_array != null) {

                            context_filter.param_numeric_array = context_filter.param_numeric_array.filter((v) => v != undefined);

                            if (context_filter.param_numeric_array.length == 0) {
                                // where_conditions.push("false");
                                break;
                            }

                            for (const i in context_filter.param_numeric_array) {
                                const value = context_filter.param_numeric_array[i];

                                if (value === null || value === undefined) {
                                    continue;
                                }

                                ContextQueryInjectionCheckHandler.assert_numeric(value);
                            }

                            where_conditions.push(field_name + " != ALL(ARRAY[" + context_filter.param_numeric_array.join(',') + '])');
                        }

                        if (context_filter.param_numeric != null) {
                            ContextQueryInjectionCheckHandler.assert_numeric(context_filter.param_numeric);
                            where_conditions.push(field_name + " != " + context_filter.param_numeric);
                            break;
                        }

                        if (context_filter.param_numranges) {
                            RangeHandler.foreach_ranges_sync(context_filter.param_numranges, (num: number) => {
                                ContextQueryInjectionCheckHandler.assert_numeric(num);
                                where_conditions.push(field_name + " != " + num);
                            });
                        }

                        if ((context_filter.param_alias == null) && (context_filter.param_numeric == null)) {
                            /**
                             * Par défaut si num et alias sont null, on est en train de dire qu'on cherche une valeur nulle
                             */
                            where_conditions.push(field_name + " is not NULL");
                            break;
                        }
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_NUMERIC_EQUALS_ANY:
                switch (field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:

                        if (context_filter.param_alias != null) {
                            // WARNING le TYPE_NUMERIC_EQUALS_ANY considère qu'on doit donc avoir un alias qui fait référence à un tableau,
                            //  alors que le TYPE_NUMERIC_EQUALS_ALL considère qu'on doit avoir un alias qui fait référence à un nombre
                            where_conditions.push(field_name + " = ANY(" + context_filter.param_alias + ")");
                            break;
                        }

                        if (context_filter.param_numeric != null) {
                            ContextQueryInjectionCheckHandler.assert_numeric(context_filter.param_numeric);
                            where_conditions.push(field_name + " = " + context_filter.param_numeric);
                            break;
                        }

                        if (context_filter.param_numeric_array != null) {

                            context_filter.param_numeric_array = context_filter.param_numeric_array.filter((v) => v != undefined);

                            if (context_filter.param_numeric_array.length == 0) {
                                where_conditions.push("false");
                                break;
                            }

                            for (const i in context_filter.param_numeric_array) {
                                const value = context_filter.param_numeric_array[i];

                                if (value === null || value === undefined) {
                                    continue;
                                }

                                ContextQueryInjectionCheckHandler.assert_numeric(value);
                            }

                            where_conditions.push(field_name + " = ANY(ARRAY[" + context_filter.param_numeric_array.join(',') + '])');
                            break;
                        }

                        if ((context_filter.param_alias == null) && (context_filter.param_numeric == null)) {

                            /**
                             * Par défaut si num et alias sont null, on est en train de dire qu'on cherche une valeur nulle
                             */
                            where_conditions.push(field_name + " is NULL");
                            break;
                        }

                        throw new Error('Not Implemented');


                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:

                        // if (context_filter.param_alias != null) {
                        // TODO FIXME il y a une ambiguité sur le tpye array ou pas du field alias... il faut séparer les cas, ou préciser par ailleurs, ....
                        // where_conditions.push(context_filter.param_alias + " = ANY(" + field_name + ")");
                        // break;
                        // }

                        if (context_filter.param_numeric != null) {
                            ContextQueryInjectionCheckHandler.assert_numeric(context_filter.param_numeric);
                            where_conditions.push(context_filter.param_numeric + " = ANY(" + field_name + ")");
                            break;
                        }

                        if (context_filter.param_numeric_array != null) {

                            context_filter.param_numeric_array = context_filter.param_numeric_array.filter((v) => v != undefined);

                            if (context_filter.param_numeric_array.length == 0) {
                                where_conditions.push("false");
                                break;
                            }

                            let force_cast: string = '';

                            if ((field_type == ModuleTableFieldVO.FIELD_TYPE_int_array) || (field_type == ModuleTableFieldVO.FIELD_TYPE_tstz_array)) {
                                force_cast = '::bigint[]';
                            }
                            for (const i in context_filter.param_numeric_array) {
                                const value = context_filter.param_numeric_array[i];

                                if (value === null || value === undefined) {
                                    continue;
                                }

                                ContextQueryInjectionCheckHandler.assert_numeric(value);
                            }

                            where_conditions.push(field_name + " && ARRAY[" + context_filter.param_numeric_array.join(',') + ']' + force_cast);
                            break;
                        }
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:

                        if (context_filter.param_numranges && context_filter.param_numranges.length) {

                            let ranges_clause = null;
                            ranges_clause = "'" + MatroidIndexHandler.get_normalized_ranges(context_filter.param_numranges) + "'";
                            where_conditions.push(ranges_clause + " = " + field.field_name + '_ndx');

                            break;
                        } else {
                            throw new Error('Not Implemented');
                        }

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_NUMERIC_EQUALS_ALL:
                switch (field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:

                        if (context_filter.param_alias != null) {
                            // WARNING le TYPE_NUMERIC_EQUALS_ANY considère qu'on doit donc avoir un alias qui fait référence à un tableau,
                            //  alors que le TYPE_NUMERIC_EQUALS_ALL considère qu'on doit avoir un alias qui fait référence à un nombre
                            where_conditions.push(field_name + " = " + context_filter.param_alias);
                            break;
                        }

                        if (context_filter.param_numeric != null) {
                            ContextQueryInjectionCheckHandler.assert_numeric(context_filter.param_numeric);
                            where_conditions.push(field_name + " = " + context_filter.param_numeric);
                            break;
                        }

                        if (context_filter.param_numeric_array != null) {

                            context_filter.param_numeric_array = context_filter.param_numeric_array.filter((v) => v != undefined);

                            if (context_filter.param_numeric_array.length == 0) {
                                // where_conditions.push("false");
                                break;
                            }

                            for (const i in context_filter.param_numeric_array) {
                                const value = context_filter.param_numeric_array[i];

                                if (value === null || value === undefined) {
                                    continue;
                                }

                                ContextQueryInjectionCheckHandler.assert_numeric(value);
                            }

                            where_conditions.push(field_name + " = ALL(ARRAY[" + context_filter.param_numeric_array.join(',') + '])');
                            break;
                        }

                        if ((context_filter.param_alias == null) && (context_filter.param_numeric == null)) {

                            /**
                             * Par défaut si num et alias sont null, on est en train de dire qu'on cherche une valeur nulle
                             */
                            where_conditions.push(field_name + " is NULL");
                            break;
                        }

                        throw new Error('Not Implemented');


                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:

                        if (context_filter.param_numranges && context_filter.param_numranges.length) {

                            let ranges_clause = null;
                            ranges_clause = "'" + MatroidIndexHandler.get_normalized_ranges(context_filter.param_numranges) + "'";
                            where_conditions.push(ranges_clause + " = " + field.field_name + '_ndx');

                            break;
                        } else if (context_filter.param_numeric != null) {
                            let ranges_clause = null;
                            ranges_clause = "'" + MatroidIndexHandler.get_normalized_ranges(RangeHandler.get_ids_ranges_from_list([context_filter.param_numeric])) + "'";
                            where_conditions.push(ranges_clause + " = " + field.field_name + '_ndx');

                            break;
                        } else if (context_filter.param_numeric_array && context_filter.param_numeric_array.length) {
                            let ranges_clause = null;
                            ranges_clause = "'" + MatroidIndexHandler.get_normalized_ranges(RangeHandler.get_ids_ranges_from_list(context_filter.param_numeric_array)) + "'";
                            where_conditions.push(ranges_clause + " = " + field.field_name + '_ndx');

                            break;
                        } else {
                            throw new Error('Not Implemented');
                        }

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_NUMERIC_INTERSECTS:
                switch (field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:

                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:

                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:

                        let where_clause: string = '';

                        for (const j in context_filter.param_numranges) {
                            const field_range: NumRange = context_filter.param_numranges[j];

                            where_clause += (where_clause == '') ? "(" : ") OR (";

                            where_clause += DAOServerController.getClauseWhereRangeIntersectsField(
                                field_type, field_name, field_range);
                        }

                        if (where_clause && (where_clause != '')) {
                            where_conditions.push(where_clause + ')');
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_NULL_ALL:
                switch (field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:
                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                    default:
                        where_conditions.push(field_name + " is NULL");
                }
                break;


            case ContextFilterVO.TYPE_FILTER_OR:
                const conditions_OR_left: string[] = [];
                await ContextFilterServerController.update_where_conditions(context_query, query_result, conditions_OR_left, context_filter.left_hook, tables_aliases_by_type);
                const conditions_OR_right: string[] = [];
                await ContextFilterServerController.update_where_conditions(context_query, query_result, conditions_OR_right, context_filter.right_hook, tables_aliases_by_type);
                where_conditions.push(' ((' + conditions_OR_left[0] + ') OR (' + conditions_OR_right[0] + ')) ');
                break;

            case ContextFilterVO.TYPE_FILTER_AND:
                const conditions_AND_left: string[] = [];
                await ContextFilterServerController.update_where_conditions(context_query, query_result, conditions_AND_left, context_filter.left_hook, tables_aliases_by_type);
                const conditions_AND_right: string[] = [];
                await ContextFilterServerController.update_where_conditions(context_query, query_result, conditions_AND_right, context_filter.right_hook, tables_aliases_by_type);
                where_conditions.push(' ((' + conditions_AND_left[0] + ') AND (' + conditions_AND_right[0] + ')) ');
                break;

            case ContextFilterVO.TYPE_FILTER_NOT:
                // Marche pas comme ça le NOT...
                throw new Error('Not Implemented');

            // let conditions_NOT: string[] = [];
            // await ContextFilterServerController.update_where_conditions(context_query, conditions_NOT, context_filter.left_hook, tables_aliases_by_type);
            // where_conditions.push(' (NOT (' + conditions_NOT[0] + ')) ');
            // break;


            case ContextFilterVO.TYPE_NULL_ANY:
                switch (field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:
                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                    default:
                        where_conditions.push(field_name + " is NULL");
                        break;


                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                        where_conditions.push("ANY(" + field_name + ") is NULL");
                        break;
                }
                break;

            case ContextFilterVO.TYPE_NULL_NONE:
                switch (field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:
                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                    default:
                        where_conditions.push(field_name + " is NOT NULL");
                        break;


                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                        where_conditions.push("ALL(" + field_name + ") is NOT NULL");
                        break;
                }
                break;

            case ContextFilterVO.TYPE_DATE_DOW:
                switch (field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_tstz:
                        let where_clause: string = '';

                        if (context_filter.param_numranges && context_filter.param_numranges.length) {
                            const dows: number[] = [];

                            RangeHandler.foreach_ranges_sync(context_filter.param_numranges, (dow) => {
                                dows.push(dow);
                            });
                            if ((!dows) || (!dows.length)) {
                                break;
                            }

                            where_clause = 'extract(isodow from to_timestamp(' + field_name + ')::date) in (' + dows.join(',') + ')';
                            where_conditions.push(where_clause);
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_DATE_YEAR:
                switch (field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:

                        let where_clause_tstzrange_array: string = '';

                        if (context_filter.param_numranges && context_filter.param_numranges.length) {
                            const years: number[] = [];

                            RangeHandler.foreach_ranges_sync(context_filter.param_numranges, (year) => {
                                years.push(year);
                            });

                            if ((!years) || (!years.length)) {
                                break;
                            }

                            for (const i in years) {
                                const year: number = years[i];
                                const year_start: number = Dates.year(Dates.dayOfYear(Dates.hours(Dates.minutes(Dates.second(Dates.now(), 0), 0), 0), 1), year);
                                const year_end_excl: number = Dates.year(Dates.dayOfYear(Dates.hours(Dates.minutes(Dates.second(Dates.now(), 0), 0), 0), 1), year + 1);

                                if (where_clause_tstzrange_array !== '') {
                                    where_clause_tstzrange_array += ' OR ';
                                }
                                where_clause_tstzrange_array += "('[" + year_start + "," + year_end_excl + ")'::numrange && ANY (" + field_name + "::numrange[]))";
                            }
                            where_conditions.push("(" + where_clause_tstzrange_array + ")");
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                        let where_clause_tsrange: string = '';

                        if (context_filter.param_numranges && context_filter.param_numranges.length) {
                            const years: number[] = [];

                            RangeHandler.foreach_ranges_sync(context_filter.param_numranges, (year) => {
                                years.push(year);
                            });

                            if ((!years) || (!years.length)) {
                                break;
                            }

                            for (const i in years) {
                                const year: number = years[i];
                                const year_start: number = Dates.year(Dates.dayOfYear(Dates.hours(Dates.minutes(Dates.second(Dates.now(), 0), 0), 0), 1), year);
                                const year_end_excl: number = Dates.year(Dates.dayOfYear(Dates.hours(Dates.minutes(Dates.second(Dates.now(), 0), 0), 0), 1), year + 1);

                                if (where_clause_tsrange !== '') {
                                    where_clause_tsrange += ' OR ';
                                }
                                where_clause_tsrange += '(' + field_name + " && '[" + year_start + "," + year_end_excl + ")'::numrange)";
                            }
                            where_conditions.push("(" + where_clause_tsrange + ")");
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_tstz:
                        let where_clause: string = '';

                        if (context_filter.param_numranges && context_filter.param_numranges.length) {
                            const years: number[] = [];

                            RangeHandler.foreach_ranges_sync(context_filter.param_numranges, (year) => {
                                years.push(year);
                            });

                            if ((!years) || (!years.length)) {
                                break;
                            }

                            where_clause = 'extract(year from to_timestamp(' + field_name + ')::date) in (' + years.join(',') + ')';
                            where_conditions.push(where_clause);
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_DATE_MONTH:
                switch (field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableFieldVO.FIELD_TYPE_tstz:
                        let where_clause: string = '';

                        if (context_filter.param_numranges && context_filter.param_numranges.length) {
                            const months: number[] = [];

                            RangeHandler.foreach_ranges_sync(context_filter.param_numranges, (month) => {
                                months.push(month);
                            });

                            if ((!months) || (!months.length)) {
                                break;
                            }

                            where_clause = 'extract(month from to_timestamp(' + field_name + ')::date) in (' + months.join(',') + ')';
                            where_conditions.push(where_clause);
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_DATE_INTERSECTS:
                if ((!context_filter.param_tsranges) || (!context_filter.param_tsranges.length)) {
                    throw new Error('Not Implemented');
                }

                let where_clause_date_intersects = null;
                context_filter.param_tsranges.forEach((tsrange) => {
                    if (!tsrange) {
                        ConsoleHandler.error('ERROR : tsrange null on field_name ' + field_name
                            + ' :: param_tsranges : ' + JSON.stringify(context_filter.param_tsranges)
                            + ' : contextQuery : ' + JSON.stringify(context_query));
                    }

                    where_clause_date_intersects = (where_clause_date_intersects ? where_clause_date_intersects + ' OR ' : '');

                    ContextQueryInjectionCheckHandler.assert_integer(tsrange.min);
                    ContextQueryInjectionCheckHandler.assert_integer(tsrange.max);

                    switch (field_type) {
                        case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                            where_clause_date_intersects += "('[" + tsrange.min + "," + tsrange.max + ")'::numrange && ANY (" + field_name + "::numrange[]))";
                            break;

                        case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                            where_clause_date_intersects += '(' + field_name + " && '[" + tsrange.min + "," + tsrange.max + ")'::numrange)";
                            break;

                        case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                            where_clause_date_intersects += "('[" + tsrange.min + "," + tsrange.max + ")'::numrange && ANY (" + field_name + "::numeric[]))";
                            break;

                        case ModuleTableFieldVO.FIELD_TYPE_tstz:
                            where_clause_date_intersects += '((' + field_name + " >= " + tsrange.min + ") and (" + field_name + " < " + tsrange.max + '))';
                            break;

                        default:
                            throw new Error('Not Implemented');
                    }
                });

                if (where_clause_date_intersects && (where_clause_date_intersects != '')) {
                    where_conditions.push(where_clause_date_intersects);
                }
                break;

            case ContextFilterVO.TYPE_IN:
                if (!context_filter.sub_query) {
                    throw new Error('Not Implemented');
                }

                const qr_TYPE_IN = await ContextQueryServerController.build_select_query(context_filter.sub_query);

                if (((!qr_TYPE_IN) || (!qr_TYPE_IN.query)) && (!qr_TYPE_IN.is_segmented_non_existing_table)) {
                    ConsoleHandler.error('Invalid query:TYPE_IN:INFOS context_query:' + (qr_TYPE_IN ? (qr_TYPE_IN.query ? qr_TYPE_IN.is_segmented_non_existing_table : 'NO QUERY') : 'NO QUERY RESULT'));
                    context_query.log(true);
                    throw new Error('Invalid query:TYPE_IN');
                }

                if (qr_TYPE_IN.is_segmented_non_existing_table) {
                    // Si la table segmentée n'existe pas, on ne peut pas trouver une valeur dedans, donc on doit retourner false
                    where_conditions.push('FALSE');
                    break;
                }

                if (qr_TYPE_IN.params && qr_TYPE_IN.params.length) {
                    query_result.params = query_result.params.concat(qr_TYPE_IN.params);
                }

                /**
                 * Cas particulier pour les champs de type range_array qu'on veut déployer avant de tester le IN
                 */
                switch (field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:
                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                    case ModuleTableFieldVO.FIELD_TYPE_string:
                    case ModuleTableFieldVO.FIELD_TYPE_html:
                    case ModuleTableFieldVO.FIELD_TYPE_file_field:
                    case ModuleTableFieldVO.FIELD_TYPE_textarea:
                    case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
                    case ModuleTableFieldVO.FIELD_TYPE_email:
                    case ModuleTableFieldVO.FIELD_TYPE_password:
                    default:
                        break;


                    case ModuleTableFieldVO.FIELD_TYPE_string_array:
                    case ModuleTableFieldVO.FIELD_TYPE_html_array:
                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');
                }

                where_conditions.push(field_name + ' IN (' + qr_TYPE_IN.query + ')');

                break;

            case ContextFilterVO.TYPE_NOT_IN:
                if (!context_filter.sub_query) {
                    throw new Error('Not Implemented');
                }

                const qr_TYPE_NOT_IN = await ContextQueryServerController.build_select_query(context_filter.sub_query);

                if (((!qr_TYPE_NOT_IN) || (!qr_TYPE_NOT_IN.query)) && (!qr_TYPE_NOT_IN.is_segmented_non_existing_table)) {
                    ConsoleHandler.error('Invalid query:TYPE_NOT_IN:INFOS context_query:' + (qr_TYPE_NOT_IN ? (qr_TYPE_NOT_IN.query ? qr_TYPE_NOT_IN.is_segmented_non_existing_table : 'NO QUERY') : 'NO QUERY RESULT'));
                    context_query.log(true);
                    throw new Error('Invalid query:TYPE_NOT_IN');
                }

                if (qr_TYPE_NOT_IN.is_segmented_non_existing_table) {
                    // Si on a une table segmentée qui n'existe pas, on ne fait rien
                    break;
                }

                if (qr_TYPE_NOT_IN.params && qr_TYPE_NOT_IN.params.length) {
                    query_result.params = query_result.params.concat(qr_TYPE_NOT_IN.params);
                }

                where_conditions.push(field_name + ' NOT IN (' + qr_TYPE_NOT_IN.query + ')');

                break;

            case ContextFilterVO.TYPE_NOT_EXISTS:
                if (!context_filter.sub_query) {
                    throw new Error('Not Implemented');
                }

                const qr_TYPE_NOT_EXISTS = await ContextQueryServerController.build_select_query(context_filter.sub_query);

                if (((!qr_TYPE_NOT_EXISTS) || (!qr_TYPE_NOT_EXISTS.query)) && (!qr_TYPE_NOT_EXISTS.is_segmented_non_existing_table)) {
                    ConsoleHandler.error('Invalid query:TYPE_NOT_EXISTS:INFOS context_query:' + (qr_TYPE_NOT_EXISTS ? (qr_TYPE_NOT_EXISTS.query ? qr_TYPE_NOT_EXISTS.is_segmented_non_existing_table : 'NO QUERY') : 'NO QUERY RESULT'));
                    context_query.log(true);
                    throw new Error('Invalid query:TYPE_NOT_EXISTS');
                }

                if (qr_TYPE_NOT_EXISTS.is_segmented_non_existing_table) {
                    // Si on a une table segmentée qui n'existe pas, on ne fait rien
                    break;
                }

                if (qr_TYPE_NOT_EXISTS.params && qr_TYPE_NOT_EXISTS.params.length) {
                    query_result.params = query_result.params.concat(qr_TYPE_NOT_EXISTS.params);
                }

                where_conditions.push('NOT EXISTS (' + qr_TYPE_NOT_EXISTS.query + ')');

                break;

            case ContextFilterVO.TYPE_EXISTS:
                if (!context_filter.sub_query) {
                    throw new Error('Not Implemented');
                }

                const qr_TYPE_EXISTS = await ContextQueryServerController.build_select_query(context_filter.sub_query);

                if (((!qr_TYPE_EXISTS) || (!qr_TYPE_EXISTS.query)) && (!qr_TYPE_EXISTS.is_segmented_non_existing_table)) {
                    ConsoleHandler.error('Invalid query:TYPE_EXISTS:INFOS context_query:' + (qr_TYPE_EXISTS ? (qr_TYPE_EXISTS.query ? qr_TYPE_EXISTS.is_segmented_non_existing_table : 'NO QUERY') : 'NO QUERY RESULT'));
                    context_query.log(true);
                    throw new Error('Invalid query:TYPE_EXISTS');
                }

                if (qr_TYPE_EXISTS.is_segmented_non_existing_table) {
                    // Si la table segmentée n'existe pas, on ne peut pas trouver une valeur dedans, donc on doit retourner false
                    where_conditions.push('FALSE');
                    break;
                }

                if (qr_TYPE_EXISTS.params && qr_TYPE_EXISTS.params.length) {
                    query_result.params = query_result.params.concat(qr_TYPE_EXISTS.params);
                }

                where_conditions.push('EXISTS (' + qr_TYPE_EXISTS.query + ')');

                break;

            case ContextFilterVO.TYPE_EMPTY:
                switch (field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:
                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                    case ModuleTableFieldVO.FIELD_TYPE_string:
                    case ModuleTableFieldVO.FIELD_TYPE_html:
                    case ModuleTableFieldVO.FIELD_TYPE_file_field:
                    case ModuleTableFieldVO.FIELD_TYPE_textarea:
                    case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
                    case ModuleTableFieldVO.FIELD_TYPE_email:
                    case ModuleTableFieldVO.FIELD_TYPE_password:
                    default:
                        where_conditions.push(field_name + " = ''");
                        break;


                    case ModuleTableFieldVO.FIELD_TYPE_string_array:
                    case ModuleTableFieldVO.FIELD_TYPE_html_array:
                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                        where_conditions.push("array_length(" + field_name + ", 1) = 0");
                        break;
                }
                break;

            case ContextFilterVO.TYPE_NULL_OR_EMPTY:
                switch (field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:
                    case ModuleTableFieldVO.FIELD_TYPE_boolean:
                        where_conditions.push(field_name + " is null");
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                    case ModuleTableFieldVO.FIELD_TYPE_string:
                    case ModuleTableFieldVO.FIELD_TYPE_html:
                    case ModuleTableFieldVO.FIELD_TYPE_file_field:
                    case ModuleTableFieldVO.FIELD_TYPE_textarea:
                    case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
                    case ModuleTableFieldVO.FIELD_TYPE_email:
                    case ModuleTableFieldVO.FIELD_TYPE_password:
                    default:
                        where_conditions.push("(" + field_name + " <> '') is not TRUE");
                        break;


                    case ModuleTableFieldVO.FIELD_TYPE_string_array:
                    case ModuleTableFieldVO.FIELD_TYPE_html_array:
                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                        where_conditions.push("((" + field_name + " is NULL) OR (array_length(" + field_name + ", 1) = 0))");
                        break;
                }
                break;

            case ContextFilterVO.TYPE_NUMERIC_IS_INCLUDED_IN:
                switch (field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:

                        if (context_filter.param_numranges && context_filter.param_numranges.length) {

                            const range_to_db = DAOServerController.get_ranges_translated_to_bdd_queryable_ranges(
                                context_filter.param_numranges, field, field.field_type
                            );

                            if (!range_to_db) {
                                throw new Error('Error should not filter on empty range array TYPE_NUMERIC_IS_INCLUDED_IN');
                            }

                            const table = ModuleTableController.module_tables_by_vo_type[context_filter.vo_type];
                            const table_name = table.full_name.split('.')[1];
                            const ranges_query = 'ANY(' + range_to_db + ')';

                            where_conditions.push(
                                '(' +
                                '  select count(1)' +
                                '  from (' +
                                '   select unnest(tempo2.' + field.field_name + ') a' +
                                '  from ' + table.full_name + ' tempo2' +
                                '  where tempo2.id = ' + tables_aliases_by_type[context_filter.vo_type] + '.id) tempo1' +
                                '  where tempo1.a <@ ' + ranges_query +
                                '  ) = array_length(' + tables_aliases_by_type[context_filter.vo_type] + '.' + field.field_name + ',1) ');
                            break;
                        }

                        if (context_filter.param_tsranges && context_filter.param_tsranges.length) {

                            const range_to_db = DAOServerController.get_ranges_translated_to_bdd_queryable_ranges(
                                context_filter.param_tsranges, field, field.field_type
                            );

                            if (!range_to_db) {
                                throw new Error('Error should not filter on empty range array TYPE_NUMERIC_IS_INCLUDED_IN');
                            }

                            const table = ModuleTableController.module_tables_by_vo_type[context_filter.vo_type];
                            const table_name = table.full_name.split('.')[1];
                            const ranges_query = 'ANY(' + range_to_db + ')';

                            where_conditions.push(
                                '(' +
                                '  select count(1)' +
                                '  from (' +
                                '   select unnest(tempo2.' + field.field_name + ') a' +
                                '  from ' + table.full_name + ' tempo2' +
                                '  where tempo2.id = ' + tables_aliases_by_type[context_filter.vo_type] + '.id) tempo1' +
                                '  where tempo1.a <@ ' + ranges_query +
                                '  ) = array_length(' + tables_aliases_by_type[context_filter.vo_type] + '.' + field.field_name + ',1) ');
                            break;
                        }

                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:

                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_NUMERIC_CONTAINS:
                switch (field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:

                        if (context_filter.param_numranges && context_filter.param_numranges.length) {

                            const range_to_db = DAOServerController.get_ranges_translated_to_bdd_queryable_ranges(
                                context_filter.param_numranges, field, field.field_type
                            );

                            if (!range_to_db) {
                                throw new Error('Error should not filter on empty range array TYPE_NUMERIC_CONTAINS');
                            }

                            const nb_values: number = RangeHandler.get_all_segmented_elements_from_ranges(context_filter.param_numranges).length;

                            const table = ModuleTableController.module_tables_by_vo_type[context_filter.vo_type];
                            const table_name = table.full_name.split('.')[1];
                            const ranges_query = 'ANY(' + range_to_db + ')';

                            where_conditions.push(
                                '(' +
                                '  select count(1)' +
                                '  from (' +
                                '   select unnest(tempo2.' + field.field_name + ') a' +
                                '  from ' + table.full_name + ' tempo2' +
                                '  where tempo2.id = ' + tables_aliases_by_type[context_filter.vo_type] + '.id) tempo1' +
                                '  where tempo1.a <@ ' + ranges_query +
                                '  ) >= ' + nb_values + ' ');
                            break;
                        }

                        if (context_filter.param_tsranges && context_filter.param_tsranges.length) {

                            const range_to_db = DAOServerController.get_ranges_translated_to_bdd_queryable_ranges(
                                context_filter.param_tsranges, field, field.field_type
                            );

                            if (!range_to_db) {
                                throw new Error('Error should not filter on empty range array TYPE_NUMERIC_CONTAINS');
                            }

                            const nb_values: number = RangeHandler.get_all_segmented_elements_from_ranges(context_filter.param_tsranges).length;

                            const table = ModuleTableController.module_tables_by_vo_type[context_filter.vo_type];
                            const table_name = table.full_name.split('.')[1];
                            const ranges_query = 'ANY(' + range_to_db + ')';

                            where_conditions.push(
                                '(' +
                                '  select count(1)' +
                                '  from (' +
                                '   select unnest(tempo2.' + field.field_name + ') a' +
                                '  from ' + table.full_name + ' tempo2' +
                                '  where tempo2.id = ' + tables_aliases_by_type[context_filter.vo_type] + '.id) tempo1' +
                                '  where tempo1.a <@ ' + ranges_query +
                                '  ) >= ' + nb_values + ' ');
                            break;
                        }

                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:

                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_DATE_IS_INCLUDED_IN:
                switch (field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:

                        if (context_filter.param_numranges && context_filter.param_numranges.length) {

                            const range_to_db = DAOServerController.get_ranges_translated_to_bdd_queryable_ranges(
                                context_filter.param_numranges, field, field.field_type
                            );

                            if (!range_to_db) {
                                throw new Error('Error should not filter on empty range array TYPE_DATE_IS_INCLUDED_IN');
                            }

                            const table = ModuleTableController.module_tables_by_vo_type[context_filter.vo_type];
                            const table_name = table.full_name.split('.')[1];
                            const ranges_query = 'ANY(' + range_to_db + ')';

                            where_conditions.push(
                                '(' +
                                '  select count(1)' +
                                '  from (' +
                                '   select unnest(tempo2.' + field.field_name + ') a' +
                                '  from ' + table.full_name + ' tempo2' +
                                '  where tempo2.id = ' + tables_aliases_by_type[context_filter.vo_type] + '.id) tempo1' +
                                '  where tempo1.a <@ ' + ranges_query +
                                '  ) = array_length(' + tables_aliases_by_type[context_filter.vo_type] + '.' + field.field_name + ',1) ');
                            break;
                        }

                        if (context_filter.param_tsranges && context_filter.param_tsranges.length) {

                            const range_to_db = DAOServerController.get_ranges_translated_to_bdd_queryable_ranges(
                                context_filter.param_tsranges, field, field.field_type
                            );

                            if (!range_to_db) {
                                throw new Error('Error should not filter on empty range array TYPE_DATE_IS_INCLUDED_IN');
                            }

                            const table = ModuleTableController.module_tables_by_vo_type[context_filter.vo_type];
                            const table_name = table.full_name.split('.')[1];
                            const ranges_query = 'ANY(' + range_to_db + ')';

                            where_conditions.push(
                                '(' +
                                '  select count(1)' +
                                '  from (' +
                                '   select unnest(tempo2.' + field.field_name + ') a' +
                                '  from ' + table.full_name + ' tempo2' +
                                '  where tempo2.id = ' + tables_aliases_by_type[context_filter.vo_type] + '.id) tempo1' +
                                '  where tempo1.a <@ ' + ranges_query +
                                '  ) = array_length(' + tables_aliases_by_type[context_filter.vo_type] + '.' + field.field_name + ',1) ');
                            break;
                        }

                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:

                    case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    case ModuleTableFieldVO.FIELD_TYPE_int_array:
                    case ModuleTableFieldVO.FIELD_TYPE_float_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:

                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_ID_INTERSECTS:
            case ContextFilterVO.TYPE_ID_EQUALS:
            case ContextFilterVO.TYPE_ID_INCLUDES:
            case ContextFilterVO.TYPE_FILTER_XOR:
            case ContextFilterVO.TYPE_NUMERIC_INCLUDES:
            case ContextFilterVO.TYPE_ID_IS_INCLUDED_IN:
            case ContextFilterVO.TYPE_HOUR_INTERSECTS:
            case ContextFilterVO.TYPE_HOUR_EQUALS:
            case ContextFilterVO.TYPE_HOUR_INCLUDES:
            case ContextFilterVO.TYPE_HOUR_IS_INCLUDED_IN:
            case ContextFilterVO.TYPE_DATE_INCLUDES:
            case ContextFilterVO.TYPE_TEXT_INCLUDES_ALL:
            case ContextFilterVO.TYPE_TEXT_STARTSWITH_ALL:
            case ContextFilterVO.TYPE_TEXT_ENDSWITH_ALL:

            case ContextFilterVO.TYPE_MINUTE_INTERSECTS:
            case ContextFilterVO.TYPE_MINUTE_EQUALS:
            case ContextFilterVO.TYPE_MINUTE_INCLUDES:
            case ContextFilterVO.TYPE_MINUTE_IS_INCLUDED_IN:
            case ContextFilterVO.TYPE_SECOND_INTERSECTS:
            case ContextFilterVO.TYPE_SECOND_EQUALS:
            case ContextFilterVO.TYPE_SECOND_INCLUDES:
            case ContextFilterVO.TYPE_SECOND_IS_INCLUDED_IN:

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
     *              On doit faire un join path_i.field.target_moduletable m on m.id = alias[path_i.field.moduletable].[path_i.field.field_name]
     *      Sinon (donc onetomany)
     *          Si path_i.field.moduletable pas encore aliasé (et donc pas joined)
     *              Ajouter un alias sur le path_i.field.moduletable => m
     *              On doit faire un join path_i.field.moduletable m on m.[path_i.field.field_name] = alias[path_i.field.target_moduletable].id
     *
     * Par ailleurs tout dépend du type de champs qui fait la jointure. sur un ref_ranges il faut utiliser id::numeric <@ ANY(ref_ranges_field)
     *
     * Check Injection OK : Aucun insère de données depuis la query(pas en param) ou les filtres
     */
    public static async updates_jointures(
        context_query: ContextQueryVO,
        query_tables_prefix: string,
        jointures: string[],
        filters: ContextFilterVO[],
        joined_tables_by_vo_type: { [vo_type: string]: ModuleTableVO },
        tables_aliases_by_type: { [vo_type: string]: string },
        path: FieldPathWrapper[],
        aliases_n: number
    ): Promise<number> {

        if ((!path) || (!path.length)) {
            return aliases_n;
        }

        for (const i in path) {
            const path_i = path[i];

            if (path_i.is_manytoone) {

                if (!tables_aliases_by_type[path_i.field.manyToOne_target_moduletable.vo_type]) {

                    const api_type_id = path_i.field.manyToOne_target_moduletable.vo_type;
                    tables_aliases_by_type[api_type_id] = (query_tables_prefix ?
                        (query_tables_prefix + '_t' + (aliases_n++)) :
                        ('t' + (aliases_n++))
                    );
                    joined_tables_by_vo_type[api_type_id] = path_i.field.manyToOne_target_moduletable;
                    let jointure_table_ref: string = null;
                    const table = joined_tables_by_vo_type[api_type_id];

                    if (table.is_segmented) {

                        const ids: number[] = await ContextQueryServerController.get_valid_segmentations(table, context_query);

                        if ((!ids) || (!ids.length)) {
                            // Pour le coup sur une table segmentée qu'on essaie de join, si on a pas de données, c'est un gros problème.
                            //  On ne peut pas faire de jointure, donc on ne peut pas faire de query
                            ConsoleHandler.error('ERROR : no segmentation found for segmented table ' + table.full_name + ' on context_query :' + context_query.log(true));
                            return aliases_n;
                        }

                        const tables: string[] = [];
                        for (const j in ids) {
                            const id = ids[j];
                            const full_name = table.get_segmented_full_name(id);

                            /**
                             * Cas du segmented table dont la table n'existe pas, donc on select null en somme (c'est pas une erreur en soit, juste il n'y a pas de données)
                             *  normalement ça devrait pas arriver sur une jointure
                             */
                            if (!full_name) {
                                return aliases_n;
                            }

                            tables.push(full_name);
                        }

                        if ((!tables) || (!tables.length)) {
                            return aliases_n;
                        }

                        if (tables.length == 1) {
                            jointure_table_ref = tables[0];
                        } else {
                            // WARN select * does not garanty the order of the fields, we should use a select with the fields in the right order
                            let fields: string = 'id';

                            // Add all fields by default
                            const table_fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[table.vo_type];
                            for (const j in table_fields) {
                                const field = table_fields[j];

                                fields += ', ' + field.field_name;
                            }

                            jointure_table_ref = '(SELECT ' + fields + ' FROM ' + tables.join(' UNION ALL SELECT ' + fields + ' FROM ') + ')';
                        }
                    } else {

                        const full_name = await ContextFilterServerController.get_table_full_name(context_query, joined_tables_by_vo_type[api_type_id], filters);
                        if (!full_name) {
                            throw new Error('Table not found');
                        }

                        jointure_table_ref = full_name;
                    }

                    switch (path_i.field.field_type) {
                        case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                        case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                        case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                            jointures.push(
                                jointure_table_ref + ' ' + tables_aliases_by_type[api_type_id] +
                                ' on ' +
                                tables_aliases_by_type[api_type_id] + '.id = ' +
                                tables_aliases_by_type[path_i.field.module_table.vo_type] + '.' + path_i.field.field_name
                            );
                            break;
                        case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                        case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                            jointures.push(
                                jointure_table_ref + ' ' + tables_aliases_by_type[api_type_id] +
                                ' on ' +
                                tables_aliases_by_type[api_type_id] + '.id::numeric <@ ANY(' +
                                tables_aliases_by_type[path_i.field.module_table.vo_type] + '.' + path_i.field.field_name + ')'
                            );
                            break;
                        default:
                            throw new Error('Not Implemented');
                    }
                }
            } else {
                if (!tables_aliases_by_type[path_i.field.module_table.vo_type]) {

                    const api_type_id = path_i.field.module_table.vo_type;
                    tables_aliases_by_type[api_type_id] = (query_tables_prefix ?
                        (query_tables_prefix + '_t' + (aliases_n++)) :
                        ('t' + (aliases_n++))
                    );
                    joined_tables_by_vo_type[api_type_id] = path_i.field.module_table;
                    let jointure_table_ref: string = null;
                    const table = joined_tables_by_vo_type[api_type_id];

                    if (table.is_segmented) {

                        const ids: number[] = await ContextQueryServerController.get_valid_segmentations(table, context_query);

                        if ((!ids) || (!ids.length)) {
                            return aliases_n;
                        }

                        const tables: string[] = [];
                        for (const j in ids) {
                            const id = ids[j];
                            const full_name = table.get_segmented_full_name(id);

                            /**
                             * Cas du segmented table dont la table n'existe pas, donc on select null en somme (c'est pas une erreur en soit, juste il n'y a pas de données)
                             *  normalement ça devrait pas arriver sur une jointure
                             */
                            if (!full_name) {
                                return aliases_n;
                            }

                            tables.push(full_name);
                        }

                        if ((!tables) || (!tables.length)) {
                            return aliases_n;
                        }

                        if (tables.length == 1) {
                            jointure_table_ref = tables[0];
                        } else {
                            // WARN select * does not garanty the order of the fields, we should use a select with the fields in the right order
                            let fields: string = 'id';

                            // Add all fields by default
                            const table_fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[table.vo_type];
                            for (const j in table_fields) {
                                const field = table_fields[j];

                                fields += ', ' + field.field_name;
                            }

                            jointure_table_ref = '(SELECT ' + fields + ' FROM ' + tables.join(' UNION ALL SELECT ' + fields + ' FROM ') + ')';
                        }
                    } else {

                        const full_name = await ContextFilterServerController.get_table_full_name(context_query, joined_tables_by_vo_type[api_type_id], filters);
                        if (!full_name) {
                            throw new Error('Table not found');
                        }

                        jointure_table_ref = full_name;
                    }

                    switch (path_i.field.field_type) {
                        case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                        case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                        case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                            jointures.push(
                                jointure_table_ref + ' ' + tables_aliases_by_type[api_type_id] +
                                ' on ' +
                                tables_aliases_by_type[api_type_id] + '.' + path_i.field.field_name + ' = ' +
                                tables_aliases_by_type[path_i.field.manyToOne_target_moduletable.vo_type] + '.id'
                            );
                            break;
                        case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                        case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                            jointures.push(
                                jointure_table_ref + ' ' + tables_aliases_by_type[api_type_id] +
                                ' on ' +
                                tables_aliases_by_type[path_i.field.manyToOne_target_moduletable.vo_type] + '.id::numeric <@ ANY(' +
                                tables_aliases_by_type[api_type_id] + '.' + path_i.field.field_name + ')'
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

    public static async updates_cross_jointures(
        context_query: ContextQueryVO,
        query_tables_prefix: string,
        api_type_id: string,
        cross_jointures: string[],
        filters: ContextFilterVO[],
        joined_tables_by_vo_type: { [vo_type: string]: ModuleTableVO },
        tables_aliases_by_type: { [vo_type: string]: string },
        aliases_n: number
    ): Promise<number> {

        if (!api_type_id) {
            return aliases_n;
        }

        if (!tables_aliases_by_type[api_type_id]) {

            tables_aliases_by_type[api_type_id] = (query_tables_prefix ?
                (query_tables_prefix + '_t' + (aliases_n++)) :
                ('t' + (aliases_n++))
            );
            joined_tables_by_vo_type[api_type_id] = ModuleTableController.module_tables_by_vo_type[api_type_id];

            let cross_jointure_table_ref: string = null;
            const table = joined_tables_by_vo_type[api_type_id];

            if (table.is_segmented) {

                const ids: number[] = await ContextQueryServerController.get_valid_segmentations(table, context_query);

                if ((!ids) || (!ids.length)) {
                    return aliases_n;
                }

                const tables: string[] = [];
                for (const i in ids) {
                    const id = ids[i];
                    const full_name = table.get_segmented_full_name(id);

                    /**
                     * Cas du segmented table dont la table n'existe pas, donc on select null en somme (c'est pas une erreur en soit, juste il n'y a pas de données)
                     *  normalement ça devrait pas arriver sur une jointure
                     */
                    if (!full_name) {
                        return aliases_n;
                    }

                    tables.push(full_name);
                }

                if ((!tables) || (!tables.length)) {
                    return aliases_n;
                }

                if (tables.length == 1) {
                    cross_jointure_table_ref = tables[0];
                } else {
                    // WARN select * does not garanty the order of the fields, we should use a select with the fields in the right order
                    let fields: string = 'id';

                    // Add all fields by default
                    const table_fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[table.vo_type];
                    for (const j in table_fields) {
                        const field = table_fields[j];

                        fields += ', ' + field.field_name;
                    }

                    cross_jointure_table_ref = '(SELECT ' + fields + ' FROM ' + tables.join(' UNION ALL SELECT ' + fields + ' FROM ') + ')';
                }
            } else {

                const full_name = await ContextFilterServerController.get_table_full_name(context_query, joined_tables_by_vo_type[api_type_id], filters);
                if (!full_name) {
                    throw new Error('Table not found');
                }

                cross_jointure_table_ref = full_name;
            }

            cross_jointures.push(cross_jointure_table_ref + ' ' + tables_aliases_by_type[api_type_id]);
        }

        return aliases_n;
    }

    /**
     * Fonction qui cherche à renvoyer un table full_name, même quand la table est segmentée
     *  Faire évoluer vers un tableau de full_names et gérer le tableau dans le context filter pour
     *  faire des requetes de context filter sur tables segmentées
     *
     * Check injection OK : get_segmented_full_name est ok et est le seul risque identifié
     */
    public static async get_table_full_name(
        context_query: ContextQueryVO,
        moduletable: ModuleTableVO,
        filters: ContextFilterVO[]): Promise<string> {

        let full_name = moduletable.full_name;

        /**
         * FIXME Les tables segmentées sont peu compatibles pour le moment
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

            // Cas champ segmenté exacte - on filtre directement sur l'id du champs de segmentation, par exemple sur pdv_id
            //  de la facture (vo_type c'est la ligne de facturation et donc on veut le filtre exacte sur le champs pdv_id)
            const simple_filter = ContextFilterVOHandler.get_simple_filter_by_vo_type_and_field_name(
                filters, moduletable.vo_type, moduletable.table_segmented_field.field_name);
            if (simple_filter) {

                if ((simple_filter.filter_type == ContextFilterVO.TYPE_NUMERIC_EQUALS_ALL) &&
                    (simple_filter.param_numeric != null)) {

                    /**
                     * On check que la table existe, si la table existe pas, ça veut dire qu'on a pas de données à requêter mais
                     *  pas qu'on est pas implémenté
                     */
                    if (!DAOServerController.has_segmented_known_database(moduletable, simple_filter.param_numeric)) {
                        return null;
                    }
                    is_implemented = true;
                    full_name = moduletable.get_segmented_full_name(simple_filter.param_numeric);
                }
            }

            /**
             * Cas champ unique du vo_type sur lequel on segmente (par exemple 1 pdv ciblé par d'autres filtres,
             *  ce qui implique qu'un vo segmenté sur pdv_id on peut résoudre finalement)
             *  donc on prend tous les filtres simple liés au type de segmentation (pdv dans l'exemple des lignes de factu)
             *  et on requête les pdvs qui réponde à ça. on pourrait commencer par requêter le count d'ailleurs mais ça fait 2 requêtes...
             */
            if ((!is_implemented) && !!moduletable.table_segmented_field.many_to_one_target_moduletable_name) {
                const linked_segment_table = ModuleTableController.module_tables_by_vo_type[moduletable.table_segmented_field.many_to_one_target_moduletable_name];

                const simple_filters = ContextFilterVOHandler.get_simple_filters_by_vo_type(
                    filters, linked_segment_table.vo_type);

                if (simple_filters && simple_filters.length) {

                    const linked_query = query(linked_segment_table.vo_type).add_filters(simple_filters);

                    // Si le context_query est admin, on doit faire la requete en admin
                    if (context_query.is_server) {
                        linked_query.exec_as_server();
                    }

                    const query_res: any[] = await ContextQueryServerController.select_vos(linked_query);

                    if (query_res && query_res.length) {

                        const unique_segment_vos = context_query.is_server ? query_res : await DAOServerController.filterVOsAccess(linked_segment_table, ModuleDAO.DAO_ACCESS_TYPE_READ, query_res);

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
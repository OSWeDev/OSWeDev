import * as moment from 'moment';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleContextFilter from '../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVO from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import DataFilterOption from '../../../shared/modules/DataRender/vos/DataFilterOption';
import ModuleTable from '../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ConversionHandler from '../../../shared/tools/ConversionHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleServerBase from '../ModuleServerBase';
import TypesPathElt from './vos/TypesPathElt';

export default class ModuleContextFilterServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleContextFilterServer.instance) {
            ModuleContextFilterServer.instance = new ModuleContextFilterServer();
        }
        return ModuleContextFilterServer.instance;
    }

    private static instance: ModuleContextFilterServer = null;

    private constructor() {
        super(ModuleContextFilter.getInstance().name);
    }

    public async configure() {
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleContextFilter.APINAME_get_filter_visible_options, this.get_filter_visible_options.bind(this));
    }

    private async get_filter_visible_options(
        api_type_id: string,
        field_id: string,
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        actual_query: string,
        limit: number,
        offset: number): Promise<DataFilterOption[]> {

        let res: DataFilterOption[] = [];

        if ((!api_type_id) || (!field_id)) {
            return res;
        }

        /**
         * on ignore le filtre sur ce champs par défaut, et par contre on considère le acutal_query comme un filtrage en text_contient
         */
        if (get_active_field_filters && get_active_field_filters[api_type_id] && get_active_field_filters[api_type_id][field_id]) {
            delete get_active_field_filters[api_type_id][field_id];
        }

        if (actual_query) {
            let actual_filter = new ContextFilterVO();
            actual_filter.field_id = field_id;
            actual_filter.vo_type = api_type_id;
            actual_filter.filter_type = ContextFilterVO.TYPE_TEXT_INCLUDES_ANY;
            actual_filter.param_text = actual_query;
            get_active_field_filters[api_type_id][field_id] = actual_filter;
        }

        let res_field_alias: string = 'query_res';
        let request: string = this.build_request_from_active_field_filters(
            api_type_id,
            field_id,
            get_active_field_filters,
            limit,
            offset,
            res_field_alias
        );

        if (!request) {
            return res;
        }

        let query_res: any[] = await ModuleDAOServer.getInstance().query(request);
        if ((!query_res) || (!query_res.length)) {
            return res;
        }

        for (let i in query_res) {
            let line_res = query_res[i];

            if (line_res == null) {
                continue;
            }

            let res_field = line_res[res_field_alias];
            let line_option = this.translate_db_res_to_dataoption(api_type_id, field_id, res_field);

            if (line_option) {
                res.push(line_option);
            }
        }

        return res;
    }

    private translate_db_res_to_dataoption(
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
            case ModuleTableField.FIELD_TYPE_file_field:
            case ModuleTableField.FIELD_TYPE_file_ref:
            case ModuleTableField.FIELD_TYPE_image_field:
            case ModuleTableField.FIELD_TYPE_image_ref:
            case ModuleTableField.FIELD_TYPE_enum:
            case ModuleTableField.FIELD_TYPE_int:
            case ModuleTableField.FIELD_TYPE_geopoint:
            case ModuleTableField.FIELD_TYPE_float:
            case ModuleTableField.FIELD_TYPE_amount:
            case ModuleTableField.FIELD_TYPE_foreign_key:
            case ModuleTableField.FIELD_TYPE_isoweekdays:
            case ModuleTableField.FIELD_TYPE_prct:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes:
            case ModuleTableField.FIELD_TYPE_hour:
                res.numeric_value = ConversionHandler.getInstance().forceNumber(db_res);
                break;

            case ModuleTableField.FIELD_TYPE_tstz:
                res.tstz_value = moment(parseInt(db_res.toString()) * 1000).utc();
                break;


            case ModuleTableField.FIELD_TYPE_email:
                if (db_res && db_res.trim) {
                    res.string_value = db_res.trim();
                }

            case ModuleTableField.FIELD_TYPE_html:
            case ModuleTableField.FIELD_TYPE_password:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_textarea:
            case ModuleTableField.FIELD_TYPE_translatable_text:

            case ModuleTableField.FIELD_TYPE_html_array:

            case ModuleTableField.FIELD_TYPE_boolean:
                res.string_value = db_res;
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
                throw new Error('Not Implemented');

            case ModuleTableField.FIELD_TYPE_date:
            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_month:
                res.tstz_value = moment(db_res).utc(true);
                break;

            case ModuleTableField.FIELD_TYPE_timestamp:
            case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                throw new Error('Not Implemented');
        }

        res.init_text_uid();
        return res;
    }

    private build_request_from_active_field_filters(
        api_type_id: string,
        field_id: string,
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        limit: number,
        offset: number,
        res_field_alias: string
    ): string {

        /**
         * Par mesure de sécu on check que les éléments proposés existent en base
         */
        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];
        if ((!moduletable) || (!moduletable.get_field_by_id(field_id))) {
            return null;
        }

        let aliases_n: number = 0;
        let tables_aliases_by_type: { [vo_type: string]: string } = {
            [api_type_id]: 't' + (aliases_n++)
        };
        let res: string = "SELECT DISTINCT " + tables_aliases_by_type[api_type_id] + "." + field_id + " as " + res_field_alias +
            " FROM " + moduletable.full_name + " " + tables_aliases_by_type[api_type_id];

        /**
         * C'est là que le fun prend place, on doit créer la requête pour chaque context_filter et combiner tout ensemble
         */
        let jointures: string[] = [];
        let joined_tables_by_vo_type: { [vo_type: string]: ModuleTable<any> } = {};

        let where_conditions: string[] = [];

        for (let api_type_id_i in get_active_field_filters) {
            let active_field_filters_by_fields = get_active_field_filters[api_type_id_i];

            for (let field_id_i in active_field_filters_by_fields) {
                let active_field_filter: ContextFilterVO = active_field_filters_by_fields[field_id_i];

                if (!active_field_filter) {
                    continue;
                }

                if (!joined_tables_by_vo_type[api_type_id_i]) {

                    /**
                     * On doit identifier le chemin le plus court pour rejoindre les 2 types de données
                     */
                    let path: Array<ModuleTableField<any>> = this.get_path_between_types(Object.keys(tables_aliases_by_type), api_type_id_i);
                    if (!path) {
                        // pas d'impact de ce filtrage puisqu'on a pas de chemin jusqu'au type cible
                        continue;
                    }
                    aliases_n = this.updates_jointures(jointures, api_type_id, joined_tables_by_vo_type, tables_aliases_by_type, path, aliases_n);
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

        if (limit) {
            res += ' LIMIT ' + limit;

            if (offset) {
                res += ' OFFSET ' + offset;
            }
        }

        return res;
    }

    private update_where_conditions(
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
                        if (active_field_filter.param_text) {
                            where_conditions.push(field_id + " LIKE '%" + active_field_filter.param_text + "%'");
                        } else if (active_field_filter.param_textarray) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                like_array.push("'%" + text + "%'");
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push(field_id + " LIKE ANY(ARRAY[" + like_array.join(',') + "])");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_string_array:
                    case ModuleTableField.FIELD_TYPE_html_array:
                        if (active_field_filter.param_text) {
                            where_conditions.push("'%" + active_field_filter.param_text + "%' LIKE ANY " + field_id);
                        } else if (active_field_filter.param_textarray) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                like_array.push("'%" + text + "%' LIKE ANY " + field_id);
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push("(" + like_array.join(') OR (') + ")");
                        } else {
                            throw new Error('Not Implemented');
                        }

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_FILTER_NOT:
            case ContextFilterVO.TYPE_FILTER_AND:
            case ContextFilterVO.TYPE_FILTER_OR:
            case ContextFilterVO.TYPE_FILTER_XOR:
            case ContextFilterVO.TYPE_NULL_ALL:
            case ContextFilterVO.TYPE_NULL_ANY:
            case ContextFilterVO.TYPE_NULL_NONE:

            case ContextFilterVO.TYPE_NUMERIC_INTERSECTS:
            case ContextFilterVO.TYPE_NUMERIC_EQUALS:
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
            case ContextFilterVO.TYPE_DATE_EQUALS:
            case ContextFilterVO.TYPE_DATE_INCLUDES:
            case ContextFilterVO.TYPE_DATE_IS_INCLUDED_IN:
            case ContextFilterVO.TYPE_TEXT_EQUALS_ALL:
            case ContextFilterVO.TYPE_TEXT_EQUALS_ANY:
            case ContextFilterVO.TYPE_TEXT_INCLUDES_ALL:
            case ContextFilterVO.TYPE_TEXT_STARTSWITH_ALL:
            case ContextFilterVO.TYPE_TEXT_STARTSWITH_ANY:
            case ContextFilterVO.TYPE_TEXT_ENDSWITH_ALL:
            case ContextFilterVO.TYPE_TEXT_ENDSWITH_ANY:
                throw new Error('Not Implemented');
        }
    }

    private updates_jointures(
        jointures: string[],
        targeted_type: string,
        joined_tables_by_vo_type: { [vo_type: string]: ModuleTable<any> },
        tables_aliases_by_type: { [vo_type: string]: string },
        path: Array<ModuleTableField<any>>,
        aliases_n: number
    ): number {
        if ((!path) || (!path.length)) {
            return aliases_n;
        }

        /**
         * On reverse le path pour faire les jointures du plus proche de la cible au plus loin
         */
        let field: ModuleTableField<any> = path.pop();
        while (field) {

            /**
             * Soit on est sur un manyToOne soit sur un oneToMany.
             *  On teste d'abord le oneToMany potentiel
             */
            if ((!joined_tables_by_vo_type[field.manyToOne_target_moduletable.vo_type]) && (field.manyToOne_target_moduletable.vo_type != targeted_type)) {

                // On est a priori sur un oneToMany qui nécessite un join
                joined_tables_by_vo_type[field.manyToOne_target_moduletable.vo_type] = field.manyToOne_target_moduletable;

                if (!tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type]) {
                    tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] = 't' + (aliases_n++);
                }

                if (!tables_aliases_by_type[field.module_table.vo_type]) {
                    tables_aliases_by_type[field.module_table.vo_type] = 't' + (aliases_n++);
                }

                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_file_field:
                    case ModuleTableField.FIELD_TYPE_file_ref:
                    case ModuleTableField.FIELD_TYPE_image_field:
                    case ModuleTableField.FIELD_TYPE_image_ref:
                    case ModuleTableField.FIELD_TYPE_int:
                    case ModuleTableField.FIELD_TYPE_foreign_key:
                        jointures.push(
                            field.manyToOne_target_moduletable.full_name + ' ' + tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + ' ON ' +
                            tables_aliases_by_type[field.module_table.vo_type] + '.' + field.field_id + ' = ' +
                            tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + '.id'
                        );
                        break;
                    case ModuleTableField.FIELD_TYPE_numrange:
                        // jointures.push(
                        // field.manyToOne_target_moduletable.full_name + ' ' + tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + ' ON ' +
                        //     tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + '.id::numeric <@ ' +
                        //     tables_aliases_by_type[field.module_table.vo_type] + '.' + field.field_id
                        // );
                        throw new Error('Not Implemented');

                        break;
                    case ModuleTableField.FIELD_TYPE_numrange_array:
                    case ModuleTableField.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');
                        // jointures.push(
                        // field.manyToOne_target_moduletable.full_name + ' ' + tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + ' ON ' +
                        //     tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + '.id::numeric <@ ' +
                        //     tables_aliases_by_type[field.module_table.vo_type] + '.' + field.field_id
                        // );
                        break;
                    case ModuleTableField.FIELD_TYPE_int_array:
                        jointures.push(
                            field.manyToOne_target_moduletable.full_name + ' ' + tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + ' ON ' +
                            tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + '.id in ' +
                            tables_aliases_by_type[field.module_table.vo_type] + '.' + field.field_id
                        );
                        break;
                }
            } else if ((!joined_tables_by_vo_type[field.module_table.vo_type]) && (field.module_table.vo_type != targeted_type)) {

                joined_tables_by_vo_type[field.module_table.vo_type] = field.module_table;

                if (!tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type]) {
                    tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] = 't' + (aliases_n++);
                }

                if (!tables_aliases_by_type[field.module_table.vo_type]) {
                    tables_aliases_by_type[field.module_table.vo_type] = 't' + (aliases_n++);
                }

                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_file_field:
                    case ModuleTableField.FIELD_TYPE_file_ref:
                    case ModuleTableField.FIELD_TYPE_image_field:
                    case ModuleTableField.FIELD_TYPE_image_ref:
                    case ModuleTableField.FIELD_TYPE_int:
                    case ModuleTableField.FIELD_TYPE_foreign_key:
                        jointures.push(
                            field.module_table.full_name + ' ' + tables_aliases_by_type[field.module_table.vo_type] + ' ON ' +
                            tables_aliases_by_type[field.module_table.vo_type] + '.' + field.field_id + ' = ' +
                            tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + '.id'
                        );
                        break;
                    case ModuleTableField.FIELD_TYPE_numrange:
                        // jointures.push(
                        //     field.module_table.full_name + ' ' + tables_aliases_by_type[field.module_table.vo_type] + ' ON ' +
                        //     tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + '.id::numeric <@ ' +
                        //     tables_aliases_by_type[field.module_table.vo_type] + '.' + field.field_id
                        // );
                        throw new Error('Not Implemented');

                        break;
                    case ModuleTableField.FIELD_TYPE_numrange_array:
                    case ModuleTableField.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');
                        // jointures.push(
                        //     field.module_table.full_name + ' ' + tables_aliases_by_type[field.module_table.vo_type] + ' ON ' +
                        //     tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + '.id::numeric <@ ' +
                        //     tables_aliases_by_type[field.module_table.vo_type] + '.' + field.field_id
                        // );
                        break;
                    case ModuleTableField.FIELD_TYPE_int_array:
                        jointures.push(
                            field.module_table.full_name + ' ' + tables_aliases_by_type[field.module_table.vo_type] + ' ON ' +
                            tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + '.id in ' +
                            tables_aliases_by_type[field.module_table.vo_type] + '.' + field.field_id
                        );
                        break;
                }
            }

            field = path.pop();
        }

        return aliases_n;
    }

    private get_path_between_types(from_types: string[], to_type: string): Array<ModuleTableField<any>> {
        /**
         * On avance sur tous les fronts en même temps et on veut associer à chaque chemin un poids qui correspond à la distance
         *  Une relation N/N compte pour 1 en poids et non 2 même si on a 2 vo_type_id à passer, on ignore directement la table intermédiaire
         */
        let reverse_paths: { [api_type_id: string]: { [field_id: string]: TypesPathElt } } = null;
        let new_paths: { [api_type_id: string]: { [field_id: string]: TypesPathElt } } = null;
        let deployed_deps_from: { [api_type_id: string]: boolean } = {};

        let isBlocked: boolean = false;
        let starting_path_elt: TypesPathElt = null;
        while ((!isBlocked) && (!starting_path_elt)) {

            if (new_paths) {
                starting_path_elt = this.get_starting_point(from_types, to_type, new_paths);
                if (starting_path_elt) {
                    break;
                }
            }

            isBlocked = true;
            let this_turn_new_paths: { [api_type_id: string]: { [field_id: string]: TypesPathElt } } = new_paths;
            new_paths = null;

            if (!reverse_paths) {
                reverse_paths = {};

                let references: Array<ModuleTableField<any>> = VOsTypesManager.getInstance().get_type_references(to_type);

                if (!deployed_deps_from[to_type]) {
                    deployed_deps_from[to_type] = true;

                    let fields = VOsTypesManager.getInstance().getManyToOneFields(to_type, Object.keys(deployed_deps_from));
                    for (let i in fields) {
                        let field = fields[i];

                        if (!references) {
                            references = [];
                        }
                        references.push(field);
                    }
                }

                if ((!references) || (!references.length)) {
                    return null;
                }
                new_paths = this.merge_references(
                    references,
                    reverse_paths,
                    from_types,
                    null
                );
                isBlocked = (new_paths == null);
                continue;
            }

            for (let api_type_id_i in this_turn_new_paths) {
                let this_turn_new_paths_fields = this_turn_new_paths[api_type_id_i];

                for (let field_i in this_turn_new_paths_fields) {
                    let new_path = this_turn_new_paths_fields[field_i];

                    let references: Array<ModuleTableField<any>> = VOsTypesManager.getInstance().get_type_references(new_path.from_api_type_id);

                    if (!deployed_deps_from[new_path.from_api_type_id]) {
                        deployed_deps_from[new_path.from_api_type_id] = true;

                        let fields = VOsTypesManager.getInstance().getManyToOneFields(new_path.from_api_type_id, Object.keys(deployed_deps_from));
                        for (let i in fields) {
                            let field = fields[i];

                            if (!references) {
                                references = [];
                            }
                            references.push(field);
                        }
                    }

                    if ((!references) || (!references.length)) {
                        continue;
                    }
                    let local_new_paths = this.merge_references(
                        references,
                        reverse_paths,
                        from_types,
                        new_path
                    );
                    isBlocked = isBlocked && (local_new_paths == null);

                    if (!!local_new_paths) {
                        if (!new_paths) {
                            new_paths = local_new_paths;
                            continue;
                        }

                        this.merge_new_paths(local_new_paths, new_paths);
                    }

                    continue;
                }
            }
        }

        if (isBlocked || !starting_path_elt) {
            return null;
        }

        return this.get_fields_path_from_path_elts(starting_path_elt);
    }

    private get_starting_point(
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

    private get_fields_path_from_path_elts(
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

    private merge_new_paths(
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
    private merge_references(
        references: Array<ModuleTableField<any>>,
        reverse_paths: { [api_type_id: string]: { [field_id: string]: TypesPathElt } },
        targeted_types: string[],
        actual_path: TypesPathElt = null): { [api_type_id: string]: { [field_id: string]: TypesPathElt } } {

        let new_paths: { [api_type_id: string]: { [field_id: string]: TypesPathElt } } = null;

        for (let i in references) {
            let reference = references[i];

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
}
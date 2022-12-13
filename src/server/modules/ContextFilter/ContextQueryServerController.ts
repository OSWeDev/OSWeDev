import { cloneDeep } from 'lodash';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ContextFilterHandler from '../../../shared/modules/ContextFilter/ContextFilterHandler';
import ContextFilterVO from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryFieldVO from '../../../shared/modules/ContextFilter/vos/ContextQueryFieldVO';
import ContextQueryVO, { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../shared/modules/ContextFilter/vos/SortByVO';
import IUserData from '../../../shared/modules/DAO/interface/IUserData';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import DataFilterOption from '../../../shared/modules/DataRender/vos/DataFilterOption';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import TSRange from '../../../shared/modules/DataRender/vos/TSRange';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import VarConfVO from '../../../shared/modules/Var/vos/VarConfVO';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../shared/tools/PromiseTools';
import RangeHandler from '../../../shared/tools/RangeHandler';
import ServerBase from '../../ServerBase';
import StackContext from '../../StackContext';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ServerAnonymizationController from '../Anonymization/ServerAnonymizationController';
import DAOServerController from '../DAO/DAOServerController';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ContextAccessServerController from './ContextAccessServerController';
import ContextFieldPathServerController from './ContextFieldPathServerController';
import ContextFilterServerController from './ContextFilterServerController';
import ContextQueryFieldServerController from './ContextQueryFieldServerController';
import ContextQueryInjectionCheckHandler from './ContextQueryInjectionCheckHandler';
import FieldPathWrapper from './vos/FieldPathWrapper';
import ParameterizedQueryWrapper from './vos/ParameterizedQueryWrapper';
import ParameterizedQueryWrapperField from './vos/ParameterizedQueryWrapperField';

export default class ContextQueryServerController {

    public static getInstance() {
        if (!ContextQueryServerController.instance) {
            ContextQueryServerController.instance = new ContextQueryServerController();
        }
        return ContextQueryServerController.instance;
    }

    private static instance: ContextQueryServerController = null;

    private constructor() { }

    public async configure() {
    }

    /**
     * Filtrer des vos avec les context filters
     * @param context_query le champs fields doit être null pour demander des vos complets
     */
    public async select_vos<T extends IDistantVOBase>(context_query: ContextQueryVO): Promise<T[]> {

        if (!context_query) {
            throw new Error('Invalid context_query param');
        }

        context_query.query_distinct = false;

        let query_wrapper = await this.build_select_query(context_query);
        if ((!query_wrapper) || (!query_wrapper.query)) {
            throw new Error('Invalid query');
        }

        if (query_wrapper.is_segmented_non_existing_table) {
            // Si on a une table segmentée qui n'existe pas, on ne fait rien
            return [];
        }

        let query_res = null;
        if (context_query.throttle_query_select && context_query.fields && context_query.fields.length) {
            query_res = await ModuleDAOServer.getInstance().throttle_select_query(query_wrapper.query, query_wrapper.params, query_wrapper.fields, context_query);
        } else {
            query_res = await ModuleDAOServer.getInstance().query(query_wrapper.query, query_wrapper.params);
        }

        if ((!query_res) || (!query_res.length)) {
            return [];
        }

        let moduletable = VOsTypesManager.moduleTables_by_voType[context_query.base_api_type_id];

        // On devrait plus avoir besoin de faire ça ici, on doit le faire dans la requête directement et sur tous les types rencontrés
        // return await ModuleDAOServer.getInstance().filterVOsAccess(moduletable, ModuleDAO.DAO_ACCESS_TYPE_READ, moduletable.forceNumerics(query_res));

        // Anonymisation
        let uid = await StackContext.get('UID');
        if (context_query.fields) {
            await ServerAnonymizationController.getInstance().anonymise_context_filtered_rows(query_res, context_query.fields, uid);
        } else {
            for (let j in query_res) {
                let row = query_res[j];

                let fields = moduletable.get_fields();
                for (let i in fields) {
                    let field = fields[i];

                    await ServerAnonymizationController.getInstance().anonymise_row_field(row, moduletable.vo_type, field.field_id, field.field_id, uid);
                }
            }
        }

        return moduletable.forceNumerics(query_res);
    }

    /**
     * Compter les résultats
     * @param context_query description de la requête, sans fields si on compte les vos, avec fields si on veut un datatable
     */
    public async select_count(context_query: ContextQueryVO): Promise<number> {

        context_query.do_count_results = true;
        let query_wrapper = await this.build_select_query(context_query);

        if (!query_wrapper) {
            throw new Error('Invalid context_query param');
        }

        if (query_wrapper.is_segmented_non_existing_table) {
            // Si on a une table segmentée qui n'existe pas, on ne fait rien
            return 0;
        }

        let query_res = null;

        if (context_query.throttle_query_select && context_query.fields && context_query.fields.length) {
            query_res = await ModuleDAOServer.getInstance().throttle_select_query(query_wrapper.query, query_wrapper.params, query_wrapper.fields, context_query);
        } else {
            query_res = await ModuleDAOServer.getInstance().query(query_wrapper.query, query_wrapper.params);
        }

        let c = (query_res && (query_res.length == 1) && (typeof query_res[0]['c'] != 'undefined') && (query_res[0]['c'] !== null)) ? query_res[0]['c'] : null;
        c = c ? parseInt(c.toString()) : 0;
        return c;
    }

    public async select(context_query: ContextQueryVO): Promise<any[]> {

        if (!context_query) {
            throw new Error('Invalid context_query param');
        }

        let query_wrapper = await this.build_select_query(context_query);
        if ((!query_wrapper) || (!query_wrapper.query)) {
            throw new Error('Invalid query');
        }

        if (query_wrapper.is_segmented_non_existing_table) {
            // Si on a une table segmentée qui n'existe pas, on ne fait rien
            return [];
        }

        let query_res = null;
        if (context_query.throttle_query_select && context_query.fields && context_query.fields.length) {
            query_res = await ModuleDAOServer.getInstance().throttle_select_query(query_wrapper.query, query_wrapper.params, query_wrapper.fields, context_query);
        } else {
            query_res = await ModuleDAOServer.getInstance().query(query_wrapper.query, query_wrapper.params);
        }

        if ((!query_res) || (!query_res.length)) {
            return [];
        }

        // Anonymisation
        let uid = await StackContext.get('UID');
        if (context_query.fields) {
            await ServerAnonymizationController.getInstance().anonymise_context_filtered_rows(query_res, context_query.fields, uid);
        } else {
            throw new Error('Invalid anon');
        }

        return query_res;
    }

    /**
     * Filtrer des infos avec les context filters, en indiquant obligatoirement les champs ciblés, qui peuvent appartenir à des tables différentes
     *  Compatibilité avec l'alias 'label' qui est un mot réservé en bdd
     * @param context_query le champs fields doit être rempli avec les champs ciblés par la requête (et avec les alias voulus)
     */
    public async select_datatable_rows(context_query: ContextQueryVO): Promise<any[]> {

        if (!context_query) {
            throw new Error('Invalid context_query param');
        }

        /**
         * Compatibilité avec l'alias 'label' qui est un mot réservé en bdd
         */
        let label_replacement = '___internal___label___rplcmt____';
        for (let i in context_query.fields) {
            let field = context_query.fields[i];
            if (field.alias == 'label') {
                field.alias = label_replacement;
            }
        }

        for (let i in context_query.sort_by) {
            let sort_by = context_query.sort_by[i];
            if (sort_by.alias == 'label') {
                sort_by.alias = label_replacement;
            }
        }

        for (let i in context_query.filters) {
            let filter = context_query.filters[i];
            if (filter.param_alias == 'label') {
                filter.param_alias = label_replacement;
            }
        }

        // On force des résultats distincts sur un datatable row
        context_query.query_distinct = true;
        let query_wrapper = await this.build_select_query(context_query);
        if ((!query_wrapper) || (!query_wrapper.query)) {
            throw new Error('Invalid query');
        }

        if (query_wrapper.is_segmented_non_existing_table) {
            // Si on a une table segmentée qui n'existe pas, on ne fait rien
            return [];
        }

        let query_res = null;
        if (context_query.throttle_query_select && context_query.fields && context_query.fields.length) {
            query_res = await ModuleDAOServer.getInstance().throttle_select_query(query_wrapper.query, query_wrapper.params, query_wrapper.fields, context_query);
        } else {
            query_res = await ModuleDAOServer.getInstance().query(query_wrapper.query, query_wrapper.params);
        }

        if ((!query_res) || (!query_res.length)) {
            return [];
        }

        // Anonymisation
        let uid = await StackContext.get('UID');
        if (context_query.fields) {
            await ServerAnonymizationController.getInstance().anonymise_context_filtered_rows(query_res, context_query.fields, uid);
        } else {
            throw new Error('Invalid anon');
        }

        /**
         * Traitement des champs
         */
        for (let i in query_res) {
            let row = query_res[i];

            if (row && row[label_replacement]) {
                row['label'] = row[label_replacement];
                delete row[label_replacement];
            }

            for (let j in context_query.fields) {
                let field = context_query.fields[j];

                if (field.field_id == 'id') {
                    continue;
                }
                let field_id = field.alias ? field.alias : field.field_id;

                let module_table = VOsTypesManager.moduleTables_by_voType[field.api_type_id];
                let module_field = module_table.getFieldFromId(field.field_id);

                switch (module_field.field_type) {
                    case ModuleTableField.FIELD_TYPE_tsrange:
                        row[field_id] = RangeHandler.parseRangeBDD(
                            TSRange.RANGE_TYPE, row[field_id], (module_field.segmentation_type ? module_field.segmentation_type : TimeSegment.TYPE_SECOND));
                        break;
                    default:
                        break;
                }
            }
        }

        /**
         * Remise du field 'label'
         */
        for (let j in context_query.fields) {
            let field = context_query.fields[j];
            if (field.alias == label_replacement) {
                field.alias = 'label';
            }
        }

        return query_res;
    }

    /**
     * Filtrer des datafilteroption (pour les filtrages type multiselect) avec les context filters, en indiquant obligatoirement le champs ciblé
     * @param context_query le champs fields doit être rempli avec un seul champs, celui qui correspond au filtrage du multiselect, et l'alias "label" a priori
     */
    public async select_filter_visible_options(
        context_query: ContextQueryVO,
        actual_query: string
    ): Promise<DataFilterOption[]> {

        if (!context_query) {
            throw new Error('Invalid context_query param');
        }

        let res: DataFilterOption[] = [];

        if (!context_query.base_api_type_id) {
            throw new Error('Invalid context_query param');
        }

        /**
         * On doit avoir qu'un seul champs en cible
         */
        if ((!context_query.fields) || (context_query.fields.length != 1)) {
            throw new Error('Invalid context_query param');
        }
        let field = context_query.fields[0];
        let get_active_field_filters = ContextFilterHandler.getInstance().get_active_field_filters(context_query.filters);

        /**
         * on ignore le filtre sur ce champs par défaut, et par contre on considère le acutal_query comme un filtrage en text_contient
         */
        if (get_active_field_filters && get_active_field_filters[field.api_type_id] && get_active_field_filters[field.api_type_id][field.field_id]) {
            // Je supprime le filtre du champ si je ne cherche pas à exclure de données
            switch (get_active_field_filters[field.api_type_id][field.field_id].filter_type) {
                case ContextFilterVO.TYPE_TEXT_EQUALS_NONE:
                case ContextFilterVO.TYPE_TEXT_INCLUDES_NONE:
                case ContextFilterVO.TYPE_TEXT_STARTSWITH_NONE:
                case ContextFilterVO.TYPE_TEXT_ENDSWITH_NONE:
                case ContextFilterVO.TYPE_NUMERIC_NOT_EQUALS:
                    break;

                default:
                    delete get_active_field_filters[field.api_type_id][field.field_id];
                    break;
            }
        }

        if (actual_query) {
            let actual_filter = new ContextFilterVO();
            actual_filter.field_id = field.field_id;
            actual_filter.vo_type = field.api_type_id;
            actual_filter.filter_type = ContextFilterVO.TYPE_TEXT_INCLUDES_ANY;
            actual_filter.param_text = actual_query;

            if (!get_active_field_filters[field.api_type_id]) {
                get_active_field_filters[field.api_type_id] = {};
            }
            get_active_field_filters[field.api_type_id][field.field_id] = actual_filter;
        }

        context_query.filters = ContextFilterHandler.getInstance().get_filters_from_active_field_filters(get_active_field_filters);

        let query_res: any[] = await this.select_datatable_rows(context_query);
        if ((!query_res) || (!query_res.length)) {
            return res;
        }

        // Anonymisation déjà faite par le select_datatable_rows

        for (let i in query_res) {
            let res_field = query_res[i] ? query_res[i][field.alias] : null;
            let line_option = ContextQueryFieldServerController.getInstance().translate_db_res_to_dataoption(field, res_field);

            if (line_option) {
                res.push(line_option);
            }
        }

        return res;
    }

    // /**
    //  * TODO JNE ou pas, le seul endroit où je voulais utiliser ça, en fait c'est pas compatible par ce qu'on passe pas par des fields .....
    //  * On prend toutes les requetes et on les fait en une seule requete via un UNION ALL
    //  *  ça nécessite que tous les fields soient identiques entre les requetes (même alias / nom) et même type de données
    //  * On vérifie aussi que ce ne sont que des selects
    //  * On renvoie les résultats dans l'ordre des requetes
    //  * @param context_queries les requetes à union
    //  * @returns {Promise<any[]>}
    //  */
    // public async union_all(context_queries: ContextQueryVO[]): Promise<any[]> {

    //     if (!context_query) {
    //         throw new Error('Invalid context_query param');
    //     }

    // }

    /**
     * Construit la requête pour un select count(1) from context_filters
     */
    public async build_query_count(context_query: ContextQueryVO): Promise<ParameterizedQueryWrapper> {

        if (!context_query) {
            throw new Error('Invalid context_query param');
        }


        let query_wrapper = await this.build_select_query_not_count(context_query);
        if ((!query_wrapper) || (!query_wrapper.query)) {
            throw new Error('Invalid query');
        }

        query_wrapper.query = 'SELECT COUNT(1) c FROM (' +
            query_wrapper.query +
            ') as tocount';

        return query_wrapper;
    }

    /**
     * Update des vos en appliquant les filtres
     *  1 à un (enfin en paquet de 100) pour appeler les triggers => rien de comparable à un update qui serait faire directement
     *  en bdd côté perf, on pourrait vouloir ajouter cette option mais attention aux triggers qui
     *  ne seraient pas exécutés dans ce cas...
     * @param update_field_id En cas d'update, le nom du champs cible (sur le base_api_type_id)
     * @param new_api_translated_value En cas d'update, la valeur api_translated (par exemple issue de moduletable.default_get_field_api_version)
     *  qu'on va mettre en remplacement de la valeur actuelle
     */
    public async update_vos(
        context_query: ContextQueryVO, update_field_id: string, new_api_translated_value: any): Promise<void> {

        /**
         * On a besoin d'utiliser les limit / offset et sortBy donc on refuse ces infos en amont
         */
        if (context_query.query_limit || context_query.query_offset || context_query.sort_by) {
            throw new Error('Invalid context_query param');
        }

        /**
         * On se fixe des paquets de 100 vos à updater
         * et on sort by id desc pour éviter que l'ordre change pendant le process
         * au pire si on a des nouvelles lignes, elles nous forcerons à remodifier des lignes déjà updatées. probablement pas très grave
         */
        context_query.query_offset = 0;
        context_query.query_limit = 100;
        let might_have_more: boolean = true;
        context_query.set_sort(new SortByVO(context_query.base_api_type_id, 'id', false));
        let moduletable = VOsTypesManager.moduleTables_by_voType[context_query.base_api_type_id];
        let field = moduletable.get_field_by_id(update_field_id);
        let get_active_field_filters = ContextFilterHandler.getInstance().get_active_field_filters(context_query.filters);

        // Si le champs modifié impact un filtrage, on doit pas faire évoluer l'offset
        let change_offset = true;
        for (let field_id in get_active_field_filters[context_query.base_api_type_id]) {
            if (field_id == update_field_id) {
                change_offset = false;
                break;
            }
        }

        if (!field.is_readonly) {
            while (might_have_more) {

                let vos = await this.select_vos(context_query);

                if ((!vos) || (!vos.length)) {
                    break;
                }

                vos.forEach((vo) => {
                    vo[field.field_id] = moduletable.default_get_field_api_version(new_api_translated_value, field);
                });
                await ModuleDAOServer.getInstance().insertOrUpdateVOsMulticonnections(vos);

                might_have_more = (vos.length >= context_query.query_limit);
                context_query.query_offset += change_offset ? context_query.query_limit : 0;
            }
        }
    }

    /**
     * Delete des vos en appliquant les filtres
     *  1 à un (enfin en paquet de 100) pour appeler les triggers => rien de comparable à un delete qui serait faire directement
     *  en bdd côté perf, on pourrait vouloir ajouter cette option mais attention aux triggers qui
     *  ne seraient pas exécutés dans ce cas...
     */
    public async delete_vos(context_query: ContextQueryVO): Promise<void> {

        /**
         * On a besoin d'utiliser les limit / offset et sortBy donc on refuse ces infos en amont
         */
        if (context_query.query_limit || context_query.query_offset || context_query.sort_by) {
            throw new Error('Invalid context_query param');
        }

        /**
         * On se fixe des paquets de 100 vos à delete
         */
        context_query.query_offset = 0;
        context_query.query_limit = 100;
        let might_have_more: boolean = true;

        while (might_have_more) {

            let vos = await this.select_vos(context_query);

            if ((!vos) || (!vos.length)) {
                break;
            }

            await ModuleDAO.getInstance().deleteVOs(vos);

            might_have_more = (vos.length >= context_query.query_limit);
        }
    }

    public async build_select_query(context_query: ContextQueryVO): Promise<ParameterizedQueryWrapper> {

        if (context_query.do_count_results) {
            return await this.build_query_count(context_query);
        }
        return await this.build_select_query_not_count(context_query);
    }

    public async get_valid_segmentations(moduletable: ModuleTable<any>, context_query: ContextQueryVO): Promise<number[]> {
        let segmentation_field: ModuleTableField<any> = moduletable.table_segmented_field;
        switch (segmentation_field.field_type) {
            case ModuleTableField.FIELD_TYPE_foreign_key:

                if (!segmentation_field.manyToOne_target_moduletable.vo_type) {
                    throw new Error('Invalid segmentation_moduletable');
                }

                let ids_map: IDistantVOBase[] = await this.configure_query_for_segmented_table_segment_listing(query(segmentation_field.manyToOne_target_moduletable.vo_type).field('id'), moduletable, context_query.filters).select_vos();
                let ids: number[] = ids_map ? ids_map.map((id_map) => id_map.id) : null;

                if (!ids || !ids.length) {
                    throw new Error('Invalid segmentations');
                }

                /**
                 * On est dans le cadre d'un select donc on check l'existence des ids sinon on les retire
                 */
                ids = ids.filter((id) => {
                    return (!!DAOServerController.segmented_known_databases[moduletable.database]) &&
                        (id == DAOServerController.segmented_known_databases[moduletable.database][moduletable.get_segmented_name(id)]);
                });

                return ids && ids.length ? ids : null;
            default:
                throw new Error('Invalid segmentation_moduletable');
        }
    }

    public async count_valid_segmentations(api_type_id: string, context_query: ContextQueryVO, ignore_self_filter: boolean = true): Promise<number> {

        if (ignore_self_filter) {
            let field = context_query.fields[0];
            let get_active_field_filters = ContextFilterHandler.getInstance().get_active_field_filters(context_query.filters);

            /**
             * on ignore le filtre sur ce champs par défaut, et par contre on considère le acutal_query comme un filtrage en text_contient
             */
            if (get_active_field_filters && get_active_field_filters[field.api_type_id] && get_active_field_filters[field.api_type_id][field.field_id]) {
                // Je supprime le filtre du champ si je ne cherche pas à exclure de données
                switch (get_active_field_filters[field.api_type_id][field.field_id].filter_type) {
                    case ContextFilterVO.TYPE_TEXT_EQUALS_NONE:
                    case ContextFilterVO.TYPE_TEXT_INCLUDES_NONE:
                    case ContextFilterVO.TYPE_TEXT_STARTSWITH_NONE:
                    case ContextFilterVO.TYPE_TEXT_ENDSWITH_NONE:
                    case ContextFilterVO.TYPE_NUMERIC_NOT_EQUALS:
                        break;

                    default:
                        delete get_active_field_filters[field.api_type_id][field.field_id];
                        context_query.filters = ContextFilterHandler.getInstance().get_filters_from_active_field_filters(get_active_field_filters);
                        break;
                }
            }
        }

        let moduletable = VOsTypesManager.moduleTables_by_voType[api_type_id];
        let segmentation_field: ModuleTableField<any> = moduletable.table_segmented_field;
        switch (segmentation_field.field_type) {
            case ModuleTableField.FIELD_TYPE_foreign_key:

                if (!segmentation_field.manyToOne_target_moduletable.vo_type) {
                    throw new Error('Invalid segmentation_moduletable');
                }

                return await this.configure_query_for_segmented_table_segment_listing(query(segmentation_field.manyToOne_target_moduletable.vo_type).field('id'), moduletable, context_query.filters).select_count();
            default:
                throw new Error('Invalid segmentation_moduletable');
        }
    }

    /**
     * Fonction qui génère la requête select demandée, que ce soit sur les vos directement ou
     *  sur les fields passées dans le context_query
     */
    public async build_select_query_not_count(context_query: ContextQueryVO): Promise<ParameterizedQueryWrapper> {

        if (!context_query) {
            throw new Error('Invalid query param');
        }

        let access_type: string = ModuleDAO.DAO_ACCESS_TYPE_READ;

        try {

            /**
             * Par mesure de sécu on check que les éléments proposés existent en base
             */
            if (!context_query.base_api_type_id) {
                return null;
            }

            /**
             * Check injection : Checker le format du context_query.base_api_type_id qui soit bien que des lettres/chiffres sans espace
             */
            ContextQueryInjectionCheckHandler.assert_api_type_id_format(context_query.base_api_type_id);

            /**
             * Check injection : Checker le format du context_query.query_tables_prefix qui soit bien que des lettres/chiffres sans espace
             */
            ContextQueryInjectionCheckHandler.assert_postgresql_name_format(context_query.query_tables_prefix);

            if (!ContextAccessServerController.getInstance().check_access_to_api_type_ids_field_ids(context_query.base_api_type_id, context_query.fields, access_type)) {
                return null;
            }

            let base_moduletable = VOsTypesManager.moduleTables_by_voType[context_query.base_api_type_id];

            if (!base_moduletable) {
                return null;
            }

            /**
             * Check injection OK : get_table_full_name is OK
             */

            /**
             * Si on est segmentés on charge tous les num de segmentations compatibles avec ce context_query et on union all toutes les requetes
             *  sinon on fait la requete sur la table simplement
             */
            if (base_moduletable.is_segmented) {

                let query_result: ParameterizedQueryWrapper = new ParameterizedQueryWrapper(null, [], null);
                let ids: number[] = await this.get_valid_segmentations(base_moduletable, context_query);
                if ((!ids) || (!ids.length)) {
                    query_result.mark_as_is_segmented_non_existing_table();
                    return query_result;
                }

                let queries: string[] = [];

                for (let i in ids) {
                    let id: number = ids[i];

                    let context_query_segmented: ContextQueryVO = cloneDeep(context_query).filter_by_id(id, base_moduletable.table_segmented_field.manyToOne_target_moduletable.vo_type);
                    let query_segmented: ParameterizedQueryWrapper = await this.build_select_query_not_count_segment(
                        context_query_segmented,
                        access_type,
                        base_moduletable,
                        base_moduletable.vo_type,
                        true,
                        id);
                    if ((!!query_segmented) && query_segmented.query && !query_segmented.is_segmented_non_existing_table) {

                        if (!query_result.fields) {
                            query_result.fields = query_segmented.fields;
                        }
                        queries.push(query_segmented.query);
                    }
                }

                if (!queries.length) {
                    query_result.mark_as_is_segmented_non_existing_table();
                    return query_result;
                }

                query_result.set_query('(' + queries.join(') UNION ALL (') + ')');
                return query_result;
            } else {
                return await this.build_select_query_not_count_segment(
                    context_query,
                    access_type,
                    base_moduletable,
                    base_moduletable.vo_type);
            }
        } catch (error) {
            ConsoleHandler.error(error);
            return null;
        }
    }

    /**
     * Fonction qui génère la requête select demandée, que ce soit sur les vos directement ou
     *  sur les fields passées dans le context_query
     */
    private async build_select_query_not_count_segment(
        context_query: ContextQueryVO,
        access_type: string,
        base_moduletable: ModuleTable<any>,
        base_api_type_id: string,
        is_segmented: boolean = false,
        segmented_value: number = null): Promise<ParameterizedQueryWrapper> {

        if (!base_api_type_id) {
            throw new Error('base_api_type_id is required');
        }

        let parameterizedQueryWrapperFields: ParameterizedQueryWrapperField[] = [];
        let query_result: ParameterizedQueryWrapper = new ParameterizedQueryWrapper(null, [], parameterizedQueryWrapperFields);

        let FROM: string = null;


        let aliases_n: number = 0;

        /**
         * Check injection OK : context_query.base_api_type_id & context_query.query_tables_prefix checked
         */
        let tables_aliases_by_type: { [vo_type: string]: string } = {
            [context_query.base_api_type_id]: (context_query.query_tables_prefix ?
                (context_query.query_tables_prefix + '_t' + (aliases_n++)) :
                ('t' + (aliases_n++))
            )
        };

        /**
         * On prend arbitrairement la première table comme FROM, on join vers elle par la suite.
         */
        let jointures: string[] = [];
        let cross_joins: string[] = [];
        let joined_tables_by_vo_type: { [vo_type: string]: ModuleTable<any> } = {};

        this.add_activated_many_to_many(context_query);


        /**
         * Cas du segmented table dont la table n'existe pas, donc on select null en somme (c'est pas une erreur en soit, juste il n'y a pas de données)
         *  - mais on peut pas select null, ça génère un résultat non vide, dont le premier élément est une colonne null (dont le nom est ?column?)
         */
        let full_name: string = is_segmented ? base_moduletable.get_segmented_full_name(segmented_value) : base_moduletable.full_name;
        if (!full_name) {
            query_result.query = 'SELECT null';
            return query_result.mark_as_is_segmented_non_existing_table();
        }

        FROM = " FROM " + full_name + " " + tables_aliases_by_type[context_query.base_api_type_id];

        joined_tables_by_vo_type[context_query.base_api_type_id] = base_moduletable;

        if (!context_query.fields) {

            if (context_query.query_distinct) {
                /**
                 * Aucun sens en fait de sélectionner des vos distincts
                 */
                throw new Error('Incompatible options:distinct & !fields');
            }

            context_query.field('id');

            let fields = base_moduletable.get_fields();
            for (let i in fields) {
                let field = fields[i];

                context_query.field(field.field_id);
            }
        }

        let SELECT = "SELECT ";
        let first = true;

        /**
         * Ajout du request_id dans la requête pour le cas des UNION ALL typiquement
         */
        if (!!context_query.request_id) {
            SELECT += context_query.request_id + " as request_id";
            first = false;
        }

        let force_query_distinct: boolean = false;

        for (let i in context_query.fields) {
            let context_field = context_query.fields[i];

            let moduletable = VOsTypesManager.moduleTables_by_voType[context_field.api_type_id];
            if ((!moduletable) || ((!!context_field.field_id) && (context_field.field_id != 'id') && (!moduletable.get_field_by_id(context_field.field_id)))) {
                return null;
            }

            /**
             * Checker le format des champs qui sont bien que des lettres/chiffres sans espace
             */
            ContextQueryInjectionCheckHandler.assert_api_type_id_format(context_field.api_type_id);
            ContextQueryInjectionCheckHandler.assert_postgresql_name_format(context_field.alias);
            ContextQueryInjectionCheckHandler.assert_postgresql_name_format(context_field.field_id);

            /**
             * Si on découvre, et qu'on est pas sur la première table, on passe sur un join à mettre en place
             */
            if (!tables_aliases_by_type[context_field.api_type_id]) {

                aliases_n = await this.join_api_type_id(
                    context_query,
                    aliases_n,
                    context_field.api_type_id,
                    jointures,
                    cross_joins,
                    joined_tables_by_vo_type,
                    tables_aliases_by_type,
                    access_type,
                    context_field
                );
            }

            if (!first) {
                SELECT += ', ';
            }
            first = false;


            let parameterizedQueryWrapperField: ParameterizedQueryWrapperField = new ParameterizedQueryWrapperField(
                context_field.api_type_id, context_field.field_id, context_field.aggregator, context_field.alias ? context_field.alias : context_field.field_id);
            let field_full_name = tables_aliases_by_type[context_field.api_type_id] + "." + context_field.field_id;
            let aggregator_prefix = '';
            let aggregator_suffix = '';
            let field_alias = (context_field.alias ? " as " + context_field.alias : '');

            switch (context_field.aggregator) {
                case VarConfVO.IS_NULLABLE_AGGREGATOR:
                case VarConfVO.NO_AGGREGATOR:
                    break;

                case VarConfVO.ARRAY_AGG_AND_IS_NULLABLE_AGGREGATOR:
                case VarConfVO.ARRAY_AGG_AGGREGATOR:
                    aggregator_prefix = 'ARRAY_AGG(';
                    aggregator_suffix = ')';
                    force_query_distinct = true;
                    break;
                case VarConfVO.COUNT_AGGREGATOR:
                    aggregator_prefix = 'COUNT(';
                    aggregator_suffix = ')';
                    force_query_distinct = true;
                    break;
                case VarConfVO.MAX_AGGREGATOR:
                    aggregator_prefix = 'MAX(';
                    aggregator_suffix = ')';
                    force_query_distinct = true;
                    break;
                case VarConfVO.MIN_AGGREGATOR:
                    aggregator_prefix = 'MIN(';
                    aggregator_suffix = ')';
                    force_query_distinct = true;
                    break;
                case VarConfVO.SUM_AGGREGATOR:
                    aggregator_prefix = 'SUM(';
                    aggregator_suffix = ')';
                    force_query_distinct = true;
                    break;

                case VarConfVO.OR_AGGREGATOR:
                case VarConfVO.AND_AGGREGATOR:
                case VarConfVO.TIMES_AGGREGATOR:
                case VarConfVO.XOR_AGGREGATOR:

                default:
                    throw new Error('Not Implemented');
            }

            /**
             * Check injection OK :
             *  - aggregator_prefix && aggregator_suffix: rempli par le serveur et si infos étranges, throw
             *  - field_full_name && field_alias: on a checké le format pur texte de context_field.api_type_id, context_field.alias, context_field.field_id
             */
            SELECT += aggregator_prefix + ContextQueryFieldServerController.getInstance().apply_modifier(context_field, field_full_name) + aggregator_suffix + field_alias + ' ';
            parameterizedQueryWrapperFields.push(parameterizedQueryWrapperField);
        }

        /**
         * On join tous les types demandés dans les sorts dans la requête
         */
        for (let i in context_query.sort_by) {
            let sort_by = context_query.sort_by[i];
            let active_api_type_id = sort_by.vo_type;

            if (!active_api_type_id) {
                continue;
            }
            if (tables_aliases_by_type[active_api_type_id]) {
                continue;
            }

            let moduletable = VOsTypesManager.moduleTables_by_voType[active_api_type_id];
            if (!moduletable) {
                return null;
            }

            /**
             * Checker le format des types
             */
            ContextQueryInjectionCheckHandler.assert_api_type_id_format(active_api_type_id);

            /**
             * Si on découvre, et qu'on est pas sur la première table, on passe sur un join à mettre en place
             */
            aliases_n = await this.join_api_type_id(
                context_query,
                aliases_n,
                active_api_type_id,
                jointures,
                cross_joins,
                joined_tables_by_vo_type,
                tables_aliases_by_type,
                access_type
            );
        }

        /**
         * C'est là que le fun prend place, on doit créer la requête pour chaque context_filter et combiner tout ensemble
         */
        let where_conditions: string[] = [];

        for (let i in context_query.filters) {
            let filter = context_query.filters[i];

            aliases_n = await this.updates_jointures_from_filter(
                filter,
                context_query,
                jointures,
                joined_tables_by_vo_type,
                tables_aliases_by_type,
                aliases_n
            );

            /**
             * Check injection : OK
             */
            await ContextFilterServerController.getInstance().update_where_conditions(query_result, where_conditions, filter, tables_aliases_by_type);
        }

        let tables_aliases_by_type_for_access_hooks = cloneDeep(tables_aliases_by_type);
        if (!context_query.is_access_hook_def) {
            /**
             * Check injection : OK
             */
            await this.add_context_access_hooks(context_query, query_result, tables_aliases_by_type_for_access_hooks, where_conditions);
        }

        let WHERE = '';
        if (where_conditions && where_conditions.length) {
            WHERE += ' WHERE (' + where_conditions.join(') AND (') + ')';
        }


        let GROUP_BY = ' ';
        if (context_query.query_distinct || force_query_distinct) {

            GROUP_BY = ' GROUP BY ';
            let group_bys = [];
            for (let i in context_query.fields) {
                let context_field = context_query.fields[i];

                // On ne rajoute pas dans le group by si on utilise un aggregateur
                if (context_field.aggregator != VarConfVO.NO_AGGREGATOR) {
                    continue;
                }

                ContextQueryInjectionCheckHandler.assert_postgresql_name_format(context_field.field_id);
                ContextQueryInjectionCheckHandler.assert_postgresql_name_format(context_field.alias);

                group_bys.push(context_field.alias ?
                    context_field.alias :
                    tables_aliases_by_type[context_field.api_type_id] + '.' + context_field.field_id);
            }
            GROUP_BY += group_bys.join(', ');

            if (GROUP_BY == ' GROUP BY ') {
                GROUP_BY = ' ';
            }
        }

        let SORT_BY = '';
        if (context_query.sort_by && context_query.sort_by.length) {

            SORT_BY += ' ORDER BY ';
            let first_sort_by = true;

            for (let sort_byi in context_query.sort_by) {
                let sort_by = context_query.sort_by[sort_byi];

                /**
                 * Check injection : context_query.sort_by ok puisqu'on ne l'insère jamais tel quel, mais
                 *  context_query.sort_by.field_id && context_query.sort_by.vo_type doivent être testés
                 */
                ContextQueryInjectionCheckHandler.assert_postgresql_name_format(sort_by.vo_type);
                ContextQueryInjectionCheckHandler.assert_postgresql_name_format(sort_by.field_id);

                /**
                 * Si on utilise un alias, on considère que le field existe forcément
                 *  et si on a un vo_type / field_id, on doit vérifier que le field est sélect et si oui, on copie l'alias si il y en a un de def
                 */
                let is_selected_field = !!sort_by.alias;
                if (!is_selected_field) {

                    for (let i in context_query.fields) {
                        let context_field = context_query.fields[i];

                        if (context_field.api_type_id != sort_by.vo_type) {
                            continue;
                        }
                        if (context_field.field_id != sort_by.field_id) {
                            continue;
                        }

                        if (!!context_field.alias) {
                            sort_by.alias = context_field.alias;
                        }
                        is_selected_field = true;
                    }
                }

                if (!first_sort_by) {
                    SORT_BY += ', ';
                }
                first_sort_by = false;

                let modifier_start = '';
                let modifier_end = '';
                switch (sort_by.modifier) {
                    case SortByVO.MODIFIER_LOWER:
                        modifier_start = 'LOWER(';
                        modifier_end = ')';
                        break;

                    case SortByVO.MODIFIER_UPPER:
                        modifier_start = 'UPPER(';
                        modifier_end = ')';
                        break;
                }

                if (is_selected_field || !context_query.query_distinct) {

                    if (!!sort_by.alias) {
                        SORT_BY += modifier_start + sort_by.alias + modifier_end +
                            (sort_by.sort_asc ? ' ASC ' : ' DESC ');
                    } else {
                        SORT_BY += modifier_start + tables_aliases_by_type[sort_by.vo_type] + '.' + sort_by.field_id + modifier_end +
                            (sort_by.sort_asc ? ' ASC ' : ' DESC ');
                    }
                } else {

                    let sort_alias = 'sort_alias_' + Math.ceil(Math.random() * 100);
                    SORT_BY += modifier_start + sort_alias + modifier_end + (sort_by.sort_asc ? ' ASC ' : ' DESC ');

                    if (!tables_aliases_by_type[sort_by.vo_type]) {
                        aliases_n = await this.join_api_type_id(
                            context_query,
                            aliases_n,
                            sort_by.vo_type,
                            jointures,
                            cross_joins,
                            joined_tables_by_vo_type,
                            tables_aliases_by_type,
                            access_type
                        );
                    }

                    SELECT += ', ' + (sort_by.sort_asc ? 'MIN' : 'MAX') + '(' +
                        tables_aliases_by_type[sort_by.vo_type] + '.' + sort_by.field_id
                        + ') as ' + sort_alias;
                    let parameterizedQueryWrapperField: ParameterizedQueryWrapperField = new ParameterizedQueryWrapperField(
                        sort_by.vo_type, sort_by.field_id, (sort_by.sort_asc ? VarConfVO.MIN_AGGREGATOR : VarConfVO.MAX_AGGREGATOR), sort_alias);
                    parameterizedQueryWrapperFields.push(parameterizedQueryWrapperField);
                }
            }
        }

        let JOINTURES = this.get_ordered_jointures(context_query, jointures, cross_joins);
        let LIMIT = this.get_limit(context_query);

        /**
         * Check injection : OK
         *  - SELECT : Check OK
         *  - FROM : Check OK
         *  - JOINTURES : Check OK
         *  - WHERE : Check OK
         *  - GROUP_BY : Check OK
         *  - SORT_BY : Check OK
         *  - LIMIT : Check OK
         */
        return query_result.set_query(SELECT + FROM + JOINTURES + WHERE + GROUP_BY + SORT_BY + LIMIT);
    }

    /**
     * Check injection OK : Seul risque identifié updates_jointures > get_table_full_name, dont le check est OK
     *
     * @param context_query
     * @param aliases_n
     * @param api_type_id
     * @param jointures
     * @param joined_tables_by_vo_type
     * @param tables_aliases_by_type
     * @param access_type
     * @param selected_field Cas d'une demande de jointure depuis un champs dont l'api_type_id n'a aucun lien avec les vos actuellement en requetes.
     *  Dans ce cas, on doit faire la jointure malgré le manque de chemin, ce qu'on ne fait ps s'il s'agit d'un filtrage ou d'un sort by
     *  (qui n'aurait aucun impact positif sur le résultat de la requête)
     * @returns
     */
    private async join_api_type_id(
        context_query: ContextQueryVO,
        aliases_n: number,
        api_type_id: string,
        jointures: string[],
        cross_joins: string[],
        joined_tables_by_vo_type: { [vo_type: string]: ModuleTable<any> },
        tables_aliases_by_type: { [vo_type: string]: string },
        access_type: string,
        selected_field: ContextQueryFieldVO = null
    ): Promise<number> {

        /**
         * On doit identifier le chemin le plus court pour rejoindre les 2 types de données
         */
        let path: FieldPathWrapper[] = ContextFieldPathServerController.getInstance().get_path_between_types(
            context_query.discarded_field_paths,
            context_query.use_technical_field_versioning,
            context_query.active_api_type_ids,
            Object.keys(joined_tables_by_vo_type),
            api_type_id);
        if (!path) {

            if (selected_field) {

                /**
                 * On doit faire la jointure malgré le manque de chemin, ce qu'on ne fait ps s'il s'agit d'un filtrage ou d'un sort by
                 */
                if (!await ContextAccessServerController.getInstance().check_access_to_field_retrieve_roles(selected_field.api_type_id, selected_field.field_id, access_type)) {
                    ConsoleHandler.warn('join_api_type_id:check_access_to_field_retrieve_roles:Access denied to field ' + selected_field.field_id + ' of type ' + selected_field.api_type_id + ' for access_type ' + access_type);
                    return aliases_n;
                }

                return await ContextFilterServerController.getInstance().updates_cross_jointures(
                    context_query,
                    context_query.query_tables_prefix,
                    selected_field.api_type_id,
                    cross_joins,
                    context_query.filters,
                    joined_tables_by_vo_type,
                    tables_aliases_by_type,
                    aliases_n);
            } else {
                // pas d'impact de ce filtrage puisqu'on a pas de chemin jusqu'au type cible
                return aliases_n;
            }
        }

        /**
         * On doit checker le trajet complet
         */
        if (!ContextAccessServerController.getInstance().check_access_to_fields(path, access_type)) {
            return aliases_n;
        }

        return await ContextFilterServerController.getInstance().updates_jointures(
            context_query, context_query.query_tables_prefix, jointures, context_query.filters, joined_tables_by_vo_type, tables_aliases_by_type, path, aliases_n);
    }

    /**
     * Check injection OK : Pas de risque identifié
     *
     * @param filter
     * @param context_query
     * @param jointures
     * @param joined_tables_by_vo_type
     * @param tables_aliases_by_type
     * @param aliases_n
     * @returns
     */
    private async updates_jointures_from_filter(
        filter: ContextFilterVO,
        context_query: ContextQueryVO,
        jointures: string[],
        joined_tables_by_vo_type: { [vo_type: string]: ModuleTable<any> },
        tables_aliases_by_type: { [vo_type: string]: string },
        aliases_n: number): Promise<number> {

        if (!filter) {
            return aliases_n;
        }

        if (filter.vo_type && (filter.vo_type != context_query.base_api_type_id) && !joined_tables_by_vo_type[filter.vo_type]) {

            /**
             * On doit identifier le chemin le plus court pour rejoindre les 2 types de données
             */
            let path: FieldPathWrapper[] = ContextFieldPathServerController.getInstance().get_path_between_types(
                context_query.discarded_field_paths,
                context_query.use_technical_field_versioning,
                context_query.active_api_type_ids,
                Object.keys(tables_aliases_by_type),
                filter.vo_type);
            if (!path) {
                // pas d'impact de ce filtrage puisqu'on a pas de chemin jusqu'au type cible
                return aliases_n;
            }
            aliases_n = await ContextFilterServerController.getInstance().updates_jointures(
                context_query, context_query.query_tables_prefix, jointures, context_query.filters, joined_tables_by_vo_type, tables_aliases_by_type, path, aliases_n);
            // joined_tables_by_vo_type[api_type_id_i] = VOsTypesManager.moduleTables_by_voType[api_type_id_i];
        }

        if (!!filter.left_hook) {
            aliases_n = await this.updates_jointures_from_filter(
                filter.left_hook,
                context_query,
                jointures,
                joined_tables_by_vo_type,
                tables_aliases_by_type,
                aliases_n
            );
        }

        if (!!filter.right_hook) {
            aliases_n = await this.updates_jointures_from_filter(
                filter.right_hook,
                context_query,
                jointures,
                joined_tables_by_vo_type,
                tables_aliases_by_type,
                aliases_n
            );
        }

        return aliases_n;
    }

    /**
     * On prend tous les types utilisés pour réaliser la requête (donc référencés dans tables_aliases_by_type)
     *  et pour chacun si on a un context_access_hook on rajoute la condition associée à la requête
     *
     * Check injection OK : Pas de risque identifié
     *
     * @param context_query le contexte de requête actuel
     * @param tables_aliases_by_type les tables utilisées et donc à vérifier
     * @param where_conditions les conditions actuelles et que l'on va amender
     */
    private async add_context_access_hooks(
        context_query: ContextQueryVO,
        query_result: ParameterizedQueryWrapper,
        tables_aliases_by_type: { [vo_type: string]: string },
        where_conditions: string[]) {

        /**
         * Si on est serveur, on ignore cette étape
         */
        if (!StackContext.get('IS_CLIENT')) {
            return;
        }

        let context_access_hooks: { [alias: string]: ContextQueryVO[] } = {};
        let uid: number = null;
        let user_data: IUserData = null;
        let user: UserVO = null;
        let user_roles_by_role_id: { [role_id: number]: RoleVO } = null;
        let user_roles: RoleVO[] = null;
        let loaded = false;

        for (let vo_type in tables_aliases_by_type) {

            // Si pas de hook, osef
            if (!DAOServerController.getInstance().context_access_hooks[vo_type]) {
                continue;
            }

            let alias = tables_aliases_by_type[vo_type];
            let module_table = VOsTypesManager.moduleTables_by_voType[vo_type];

            if (!loaded) {
                loaded = true;
                uid = StackContext.get('UID');
                user_data = uid ? await ServerBase.getInstance().getUserData(uid) : null;
                user = await ModuleAccessPolicyServer.getInstance().getSelfUser();
                user_roles_by_role_id = AccessPolicyServerController.getInstance().getUsersRoles(true, uid);
                user_roles = ObjectHandler.getInstance().hasAtLeastOneAttribute(user_roles_by_role_id) ? Object.values(user_roles_by_role_id) : null;
            }

            let promises = [];
            let hook_cbs = DAOServerController.getInstance().context_access_hooks[vo_type];
            for (let j in hook_cbs) {
                let hook_cb = hook_cbs[j];

                promises.push((async () => {
                    let query_ = await hook_cb(module_table, uid, user, user_data, user_roles);

                    if (!query_) {
                        return;
                    }

                    if (!context_access_hooks[alias]) {
                        context_access_hooks[alias] = [];
                    }
                    context_access_hooks[alias].push(query_);
                })());
            }

            await all_promises(promises);
        }

        let context_query_fields_by_api_type_id: { [api_type_id: string]: ContextQueryFieldVO[] } = {};

        for (let i in context_query.fields) {
            let field = context_query.fields[i];

            if (!context_query_fields_by_api_type_id[field.api_type_id]) {
                context_query_fields_by_api_type_id[field.api_type_id] = [];
            }

            context_query_fields_by_api_type_id[field.api_type_id].push(field);
        }

        for (let alias in context_access_hooks) {
            let querys = context_access_hooks[alias];

            for (let j in querys) {
                let query_ = querys[j];

                let query_wrapper = await this.build_select_query(query_);
                if ((!query_wrapper) || (!query_wrapper.query)) {
                    throw new Error('Invalid query');
                }

                if (query_wrapper.is_segmented_non_existing_table) {
                    // Si on a une table segmentée qui n'existe pas, on ne fait rien
                    continue;
                }

                let WHERE: string[] = [alias + '.id in (' + query_wrapper.query + ')'];

                let is_nullable_aggregator: boolean = false;

                if (query_ && query_.fields && (query_.fields.length > 0)) {
                    for (let k in query_.fields) {
                        let cq_fields: ContextQueryFieldVO[] = null;

                        if (context_query_fields_by_api_type_id[query_.fields[k].api_type_id] &&
                            (context_query_fields_by_api_type_id[query_.fields[k].api_type_id].length > 0)) {
                            cq_fields = context_query_fields_by_api_type_id[query_.fields[k].api_type_id];
                        }

                        if (cq_fields && (cq_fields.length > 0)) {
                            for (let l in cq_fields) {
                                if ((cq_fields[l].aggregator == VarConfVO.IS_NULLABLE_AGGREGATOR) || (cq_fields[l].aggregator == VarConfVO.ARRAY_AGG_AND_IS_NULLABLE_AGGREGATOR)) {
                                    is_nullable_aggregator = true;
                                    break;
                                }
                            }

                            if (is_nullable_aggregator) {
                                break;
                            }
                        }
                    }
                }

                if (is_nullable_aggregator) {
                    WHERE.push(alias + '.id IS NULL');
                }

                where_conditions.push("(" + WHERE.join(') OR (') + ")");

                if (query_wrapper.params && query_wrapper.params.length) {
                    query_result.params = query_result.params.concat(query_wrapper.params);
                }
            }
        }
    }

    /**
     * Ordonner les jointures, pour ne pas référencer des aliases pas encore déclarés
     */
    private get_ordered_jointures(context_query: ContextQueryVO, jointures: string[], cross_joins: string[]): string {
        let res = '';

        if (cross_joins && cross_joins.length) {
            res += ' CROSS JOIN ' + cross_joins.join(' CROSS JOIN ');
        }

        if (jointures && jointures.length) {

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
            res += ' LEFT JOIN ' + jointures.join(' LEFT JOIN ');
        }

        return res;
    }

    /**
     * On agrémente la liste des active_api_type_ids par les relations N/N dont les types liés sont actifs
     */
    private add_activated_many_to_many(context_query: ContextQueryVO) {

        let nn_tables = VOsTypesManager.get_manyToManyModuleTables();
        for (let i in nn_tables) {
            let nn_table = nn_tables[i];

            if (context_query.active_api_type_ids.indexOf(nn_table.vo_type) >= 0) {
                continue;
            }

            let nnfields = nn_table.get_fields();
            let has_inactive_relation = false;
            for (let j in nnfields) {
                let nnfield = nnfields[j];

                if (context_query.active_api_type_ids.indexOf(nnfield.manyToOne_target_moduletable.vo_type) < 0) {
                    has_inactive_relation = true;
                    break;
                }
            }

            if (!has_inactive_relation) {
                context_query.active_api_type_ids.push(nn_table.vo_type);
            }
        }
    }

    /**
     * Check injection OK :
     *  - query_limit && query_offset: on a checké le format pur nombre entier de context_field.query_limit, context_field.query_offset
     */
    private get_limit(context_query: ContextQueryVO): string {

        if (!context_query) {
            return '';
        }

        let res = '';
        if (context_query.query_limit) {

            ContextQueryInjectionCheckHandler.assert_integer(context_query.query_limit);
            res += ' LIMIT ' + context_query.query_limit;

            if (context_query.query_offset) {

                ContextQueryInjectionCheckHandler.assert_integer(context_query.query_offset);
                res += ' OFFSET ' + context_query.query_offset;
            }
        }

        return res;
    }

    /**
     * Le plan est de supprimer toute référence à la table segmentée, sinon on tourne en rond
     */
    private configure_query_for_segmented_table_segment_listing(context_query: ContextQueryVO, segmented_table: ModuleTable<any>, filters: ContextFilterVO[]): ContextQueryVO {

        let forbidden_api_type_id = segmented_table.vo_type;
        let forbidden_fields: Array<ModuleTableField<any>> = segmented_table.get_fields().filter((field) => field.field_type == ModuleTableField.FIELD_TYPE_foreign_key);

        /**
         * On peut pas référencer une table segmentée donc on s'intéresse que aux liaisons issues de la table segmentée
         */
        for (let i in forbidden_fields) {
            let field = forbidden_fields[i];

            context_query.discard_field_path(forbidden_api_type_id, field.field_id);
        }

        for (let i in filters) {
            let filter = filters[i];

            if (filter.vo_type == forbidden_api_type_id) {
                continue;
            }

            context_query.add_filters([filter]);
        }

        return context_query;
    }
}
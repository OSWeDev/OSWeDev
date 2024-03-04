import { cloneDeep } from 'lodash';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ContextQueryInjectionCheckHandler from '../../../shared/modules/ContextFilter/ContextQueryInjectionCheckHandler';
import ContextFilterVOHandler from '../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextFilterVOManager from '../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import ContextFilterVO from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryFieldVO from '../../../shared/modules/ContextFilter/vos/ContextQueryFieldVO';
import ContextQueryJoinOnFieldVO from '../../../shared/modules/ContextFilter/vos/ContextQueryJoinOnFieldVO';
import ContextQueryJoinVO from '../../../shared/modules/ContextFilter/vos/ContextQueryJoinVO';
import ContextQueryVO, { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import FieldPathWrapper from '../../../shared/modules/ContextFilter/vos/FieldPathWrapper';
import ParameterizedQueryWrapper from '../../../shared/modules/ContextFilter/vos/ParameterizedQueryWrapper';
import ParameterizedQueryWrapperField from '../../../shared/modules/ContextFilter/vos/ParameterizedQueryWrapperField';
import SortByVO from '../../../shared/modules/ContextFilter/vos/SortByVO';
import DAOController from '../../../shared/modules/DAO/DAOController';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleTableController from '../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldController from '../../../shared/modules/DAO/ModuleTableFieldController';
import IUserData from '../../../shared/modules/DAO/interface/IUserData';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleTableFieldVO from '../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../../../shared/modules/DAO/vos/ModuleTableVO';
import DatatableField from '../../../shared/modules/DAO/vos/datatable/DatatableField';
import TableColumnDescVO from '../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import DataFilterOption from '../../../shared/modules/DataRender/vos/DataFilterOption';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import StatsController from '../../../shared/modules/Stats/StatsController';
import VOsTypesManager from '../../../shared/modules/VO/manager/VOsTypesManager';
import VarConfVO from '../../../shared/modules/Var/vos/VarConfVO';
import VocusInfoVO from '../../../shared/modules/Vocus/vos/VocusInfoVO';
import ArrayHandler from '../../../shared/tools/ArrayHandler';
import BooleanHandler from '../../../shared/tools/BooleanHandler';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler, { field_names } from '../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import { all_promises } from '../../../shared/tools/PromiseTools';
import RangeHandler from '../../../shared/tools/RangeHandler';
import StackContext from '../../StackContext';
import ConfigurationService from '../../env/ConfigurationService';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ServerAnonymizationController from '../Anonymization/ServerAnonymizationController';
import DAOServerController from '../DAO/DAOServerController';
import LogDBPerfServerController from '../DAO/LogDBPerfServerController';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleTableFieldServerController from '../DAO/ModuleTableFieldServerController';
import ModuleTableServerController from '../DAO/ModuleTableServerController';
import ThrottledQueryServerController from '../DAO/ThrottledQueryServerController';
import ThrottledRefuseServerController from '../DAO/ThrottledRefuseServerController';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ModuleServiceBase from '../ModuleServiceBase';
import ModuleVocusServer from '../Vocus/ModuleVocusServer';
import ContextAccessServerController from './ContextAccessServerController';
import ContextFieldPathServerController from './ContextFieldPathServerController';
import ContextFilterServerController from './ContextFilterServerController';
import ContextQueryFieldServerController from './ContextQueryFieldServerController';

export default class ContextQueryServerController {

    // istanbul ignore next: cannot test configure
    public static async configure() {
    }

    /**
     * Filtrer des vos avec les context filters
     * On peut passer le query_wrapper pour éviter de le reconstruire si ça a été fait avant (pour récupérer la requete construite par exemple pour un cache local)
     * @param context_query le champs fields doit être null pour demander des vos complets
     */
    public static async select_vos<T extends IDistantVOBase>(context_query: ContextQueryVO, query_wrapper: ParameterizedQueryWrapper = null): Promise<T[]> {

        if (!context_query) {
            throw new Error('Invalid context_query param');
        }

        context_query.query_distinct = true;
        // if ((!context_query.fields) || (!context_query.fields.length)) {
        //     /**
        //      * Si on a pas de fields, on demande des vos complets et le distinct n'a pas de sens (a priori ?)
        //      */
        //     context_query.query_distinct = false;
        // }

        /**
         * Le contexte client est utilisé pour builder la requête, pas pour la réaliser en base,
         * donc on a pas de problème à throttle le select en base, en revanche le build doit se faire sans throttle ou il faut gérer
         * une save du contexte client. Idem pour l'anonymisation post requete. D'ailleurs ça sous-entend qu'en l'état
         * l'anonymisation ne peut pas fonctionner en bdd puisque le contexte client est perdu. Sauf à ce que la requête soit impactée pour
         * indiquer d'utiliser l'anonymisation en bdd, et que la requête n'ai pas besoin de connaitre le contexte client.
         */
        if (!query_wrapper) {
            query_wrapper = await ContextQueryServerController.build_select_query(context_query);
        }

        //Requête
        if ((!query_wrapper) || (!query_wrapper.query && !query_wrapper.is_segmented_non_existing_table)) {
            ConsoleHandler.error('Invalid query:select_vos:INFOS context_query:' + (query_wrapper ? (query_wrapper.query ? query_wrapper.is_segmented_non_existing_table : 'NO QUERY') : 'NO QUERY RESULT'));
            context_query.log(true);
            throw new Error('Invalid query:select_vos');
        }

        if (query_wrapper.is_segmented_non_existing_table) {
            // Si on a une table segmentée qui n'existe pas, on ne fait rien
            return [];
        }

        /**
         * à ce stade on a des fields, puisque le build_select_query déploie les fields dans tous les cas
         */

        let query_res = null;
        if (context_query.throttle_query_select) {
            query_res = await ThrottledQueryServerController.throttle_select_query(
                query_wrapper.query,
                query_wrapper.params,
                query_wrapper.fields,
                context_query
            );
        } else {
            query_res = await ModuleDAOServer.getInstance().query(
                query_wrapper.query,
                query_wrapper.params
            );
        }

        if (!(query_res?.length > 0)) {
            return [];
        }

        /**
         * query_res est immutable potentiellement à ce stade, on le copie dans ce cas
         */
        if (Object.isFrozen(query_res)) {
            query_res = ObjectHandler.clone_vos(query_res);
        }

        const moduletable = ModuleTableController.module_tables_by_vo_type[context_query.base_api_type_id];

        // Case when union_query => we need to take care of each res vo_type
        // (as we should have _explicit_api_type_id)
        for (const i in query_res) {
            const data = query_res[i];

            data._type = moduletable.vo_type;

            if (data._explicit_api_type_id) {
                data._type = data._explicit_api_type_id;
            }
        }

        // Anonymisation
        const uid = await StackContext.get('UID');

        await ServerAnonymizationController.anonymise_context_filtered_rows(
            query_res,
            context_query.fields,
            uid
        );

        return ModuleTableServerController.translate_vos_from_db(query_res);
    }

    /**
     * Compter les résultats
     * @param context_query description de la requête, sans fields si on compte les vos, avec fields si on veut un datatable
     */
    public static async select_count(context_query: ContextQueryVO): Promise<number> {

        context_query.do_count_results = true;
        const query_wrapper = await ContextQueryServerController.build_select_query(context_query);

        if (!query_wrapper) {
            throw new Error('Invalid context_query param');
        }

        if (query_wrapper.is_segmented_non_existing_table) {
            // Si on a une table segmentée qui n'existe pas, on ne fait rien
            return 0;
        }

        let query_res = null;

        if (context_query.throttle_query_select && context_query.fields && context_query.fields.length) {
            query_res = await ThrottledQueryServerController.throttle_select_query(query_wrapper.query, query_wrapper.params, query_wrapper.fields, context_query);
        } else {
            query_res = await ModuleDAOServer.getInstance().query(query_wrapper.query, query_wrapper.params);
        }

        let c = (query_res && (query_res.length == 1) && (typeof query_res[0]['c'] != 'undefined') && (query_res[0]['c'] !== null)) ? query_res[0]['c'] : null;
        c = c ? parseInt(c.toString()) : 0;
        return c;
    }

    public static async select(context_query: ContextQueryVO, query_wrapper: ParameterizedQueryWrapper = null): Promise<any[]> {

        if (!context_query) {
            throw new Error('Invalid context_query param');
        }

        query_wrapper = query_wrapper ? query_wrapper : await ContextQueryServerController.build_select_query(context_query);
        if ((!query_wrapper || !query_wrapper.query) && (!query_wrapper.is_segmented_non_existing_table)) {
            ConsoleHandler.error('Invalid query:select:INFOS context_query:' + (query_wrapper ? (query_wrapper.query ? query_wrapper.is_segmented_non_existing_table : 'NO QUERY') : 'NO QUERY RESULT'));
            context_query.log(true);
            throw new Error('Invalid query:select');
        }

        if (query_wrapper.is_segmented_non_existing_table) {
            // Si on a une table segmentée qui n'existe pas, on ne fait rien
            return [];
        }

        /**
         * à ce stade on a des fields, puisque le build_select_query déploie les fields dans tous les cas
         */

        let query_res = null;
        if (context_query.throttle_query_select) {
            query_res = await ThrottledQueryServerController.throttle_select_query(query_wrapper.query, query_wrapper.params, query_wrapper.fields, context_query);
        } else {
            query_res = await ModuleDAOServer.getInstance().query(query_wrapper.query, query_wrapper.params);
        }

        if ((!query_res) || (!query_res.length)) {
            return [];
        }

        /**
         * query_res est immutable potentiellement à ce stade, on le copie dans ce cas
         */
        if (Object.isFrozen(query_res)) {
            query_res = ObjectHandler.clone_vos(query_res);
        }

        // Anonymisation
        const uid = await StackContext.get('UID');
        await ServerAnonymizationController.anonymise_context_filtered_rows(query_res, context_query.fields, uid);

        return query_res;
    }

    /**
     * Filtrer des infos avec les context filters, en indiquant obligatoirement les champs ciblés, qui peuvent appartenir à des tables différentes
     *  Compatibilité avec l'alias 'label' qui est un mot réservé en bdd
     * @param context_query le champs fields doit être rempli avec les champs ciblés par la requête (et avec les alias voulus)
     */
    public static async select_datatable_rows(
        context_query: ContextQueryVO,
        columns_by_field_name: { [datatable_field_uid: string]: TableColumnDescVO },
        fields: { [datatable_field_uid: string]: DatatableField<any, any> }
    ): Promise<any[]> {

        if (!context_query) {
            throw new Error('Invalid context_query param');
        }

        /**
         * Compatibilité avec l'alias 'label' qui est un mot réservé en bdd
         */
        const label_replacement = '___internal___label___rplcmt____';
        for (const i in context_query.fields) {
            const field = context_query.fields[i];
            if (field.alias == 'label') {
                field.alias = label_replacement;
            }
        }

        for (const i in context_query.sort_by) {
            const sort_by = context_query.sort_by[i];
            if (sort_by.alias == 'label') {
                sort_by.alias = label_replacement;
            }
        }

        for (const i in context_query.filters) {
            const filter = context_query.filters[i];
            if (filter.param_alias == 'label') {
                filter.param_alias = label_replacement;
            }
        }

        // On force des résultats distincts sur un datatable row
        context_query.query_distinct = true;
        const query_wrapper = await ContextQueryServerController.build_select_query(context_query);
        if ((!query_wrapper || !query_wrapper.query) && (!query_wrapper.is_segmented_non_existing_table)) {
            ConsoleHandler.error('Invalid query:select_datatable_rows:INFOS context_query:' + (query_wrapper ? (query_wrapper.query ? query_wrapper.is_segmented_non_existing_table : 'NO QUERY') : 'NO QUERY RESULT'));
            context_query.log(true);
            throw new Error('Invalid query:select_datatable_rows');
        }

        if (query_wrapper.is_segmented_non_existing_table) {
            // Si on a une table segmentée qui n'existe pas, on ne fait rien
            return [];
        }

        /**
         * à ce stade on a des fields, puisque le build_select_query déploie les fields dans tous les cas
         */

        let query_res = null;
        if (context_query.throttle_query_select) {
            query_res = await ThrottledQueryServerController.throttle_select_query(query_wrapper.query, query_wrapper.params, query_wrapper.fields, context_query);
        } else {
            query_res = await ModuleDAOServer.getInstance().query(query_wrapper.query, query_wrapper.params);
        }


        if ((!query_res) || (!query_res.length)) {
            return [];
        }

        if (ConfigurationService.node_configuration.DEBUG_SELECT_DATATABLE_ROWS_query_res) {
            for (const i in query_res) {
                ConsoleHandler.log('DEBUG_SELECT_DATATABLE_ROWS_query_res:data_i:' + i + ':' + JSON.stringify(query_res[i]));
            }
        }

        /**
         * query_res est immutable potentiellement à ce stade, on le copie dans ce cas
         */
        if (Object.isFrozen(query_res)) {
            query_res = ObjectHandler.clone_vos(query_res);
        }

        // Anonymisation
        const uid = await StackContext.get('UID');
        await ServerAnonymizationController.anonymise_context_filtered_rows(query_res, context_query.fields, uid);

        /**
         * Traitement des champs. on met dans + '__raw' les valeurs brutes, et on met dans le champ lui même la valeur formatée
         */
        const limit = ConfigurationService.node_configuration.MAX_POOL / 2;
        const promise_pipeline = new PromisePipeline(limit, 'ContextQueryServerController.select_datatable_rows');
        for (const i in query_res) {
            const row = query_res[i];

            if (row && row[label_replacement]) {
                row['label'] = row[label_replacement];
                row['label' + '__raw'] = row[label_replacement];
                delete row[label_replacement];
            }

            for (const j in context_query.fields) {
                let field = context_query.fields[j];

                if (field.field_name == 'id') {
                    // row['id' + '__raw'] = row['id'];
                    continue;
                }
                const field_name = field.alias ? field.alias : field.field_name;

                let module_table = ModuleTableController.module_tables_by_vo_type[field.api_type_id];

                if (!module_table) {
                    // On est sur un champs issu d'une subquery très probablement
                    const joined_query = context_query.joined_context_queries.find((joinedcq) => joinedcq.joined_table_alias == field.api_type_id)?.joined_context_query;
                    const joined_field = joined_query?.fields.find((jf) => jf.alias == field.alias);

                    if (!joined_field) {
                        throw new Error('select_datatable_rows: joined_field not found for field ' + field.field_name + ' of type ' + field.api_type_id);
                    }

                    module_table = ModuleTableController.module_tables_by_vo_type[joined_field.api_type_id];
                    field = joined_field;
                }

                if (field.field_name == 'id') {
                    continue;
                }
                const module_field = module_table.getFieldFromId(field.field_name);

                // switch (module_field.field_type) {
                //     case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                //         row[field_name] = RangeHandler.parseRangeBDD(
                //             TSRange.RANGE_TYPE, row[field_name], (module_field.segmentation_type ? module_field.segmentation_type : TimeSegment.TYPE_SECOND));
                //         break;
                //     default:
                //         break;
                // }

                const forced_numeric_field = {};
                ModuleTableFieldServerController.translate_field_from_db(module_field, row, forced_numeric_field, field_name);
                row[field_name + '__raw'] = forced_numeric_field[field_name];

                // si on est en édition on laisse la data raw
                if (
                    columns_by_field_name &&
                    fields &&
                    fields[field_name] &&
                    (fields[field_name] instanceof DatatableField) &&
                    (
                        !(columns_by_field_name[field_name]) ||
                        columns_by_field_name[field_name].readonly
                    )
                ) {
                    await promise_pipeline.push(async () => {
                        query_res[i] = await ContextFilterVOHandler.get_datatable_row_field_data_async(
                            row,
                            row,
                            fields[field_name],
                            field
                        );
                    });
                }
            }
        }

        await promise_pipeline.end();

        /**
         * Remise du field 'label'
         */
        for (const j in context_query.fields) {
            const field = context_query.fields[j];
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
    public static async select_filter_visible_options(
        context_query: ContextQueryVO,
        actual_query: string
    ): Promise<DataFilterOption[]> {

        if (!context_query) {
            throw new Error('Invalid context_query param');
        }

        const res: DataFilterOption[] = [];

        if (!context_query.base_api_type_id) {
            throw new Error('Invalid context_query param');
        }

        /**
         * On doit avoir qu'un seul champs en cible
         */
        if ((!context_query.fields) || (context_query.fields.length != 1)) {
            throw new Error('Invalid context_query param');
        }
        const field = context_query.fields[0];
        const get_active_field_filters = ContextFilterVOHandler.get_active_field_filters(context_query.filters);

        /**
         * on ignore le filtre sur ce champs par défaut, et par contre on considère le acutal_query comme un filtrage en text_contient
         */
        if (get_active_field_filters && get_active_field_filters[field.api_type_id] && get_active_field_filters[field.api_type_id][field.field_name]) {
            // Je supprime le filtre du champ si je ne cherche pas à exclure de données
            switch (get_active_field_filters[field.api_type_id][field.field_name].filter_type) {
                case ContextFilterVO.TYPE_TEXT_EQUALS_NONE:
                case ContextFilterVO.TYPE_TEXT_INCLUDES_NONE:
                case ContextFilterVO.TYPE_TEXT_STARTSWITH_NONE:
                case ContextFilterVO.TYPE_TEXT_ENDSWITH_NONE:
                case ContextFilterVO.TYPE_NUMERIC_NOT_EQUALS:
                    break;

                default:
                    delete get_active_field_filters[field.api_type_id][field.field_name];
                    break;
            }
        }

        if (actual_query) {
            const actual_filter = new ContextFilterVO();
            actual_filter.field_name = field.field_name;
            actual_filter.vo_type = field.api_type_id;
            actual_filter.filter_type = ContextFilterVO.TYPE_TEXT_INCLUDES_ANY;
            actual_filter.param_text = actual_query;

            if (!get_active_field_filters[field.api_type_id]) {
                get_active_field_filters[field.api_type_id] = {};
            }
            get_active_field_filters[field.api_type_id][field.field_name] = actual_filter;
        }

        context_query.filters = ContextFilterVOManager.get_context_filters_from_active_field_filters(get_active_field_filters);

        const query_res: any[] = await ContextQueryServerController.select_datatable_rows(context_query, null, null);
        if ((!query_res) || (!query_res.length)) {
            return res;
        }

        // Anonymisation déjà faite par le select_datatable_rows

        for (const i in query_res) {
            const res_field = query_res[i] ? query_res[i][field.alias] : null;
            const line_options: DataFilterOption[] = ContextQueryFieldServerController.translate_db_res_to_dataoption(field, res_field);

            if (line_options) {
                res.push(...line_options);
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
    // public static async union_all(context_queries: ContextQueryVO[]): Promise<any[]> {

    //     if (!context_query) {
    //         throw new Error('Invalid context_query param');
    //     }

    // }

    /**
     * Construit la requête pour un select count(1) from context_filters
     */
    public static async build_query_count(context_query: ContextQueryVO): Promise<ParameterizedQueryWrapper> {

        if (!context_query) {
            throw new Error('Invalid context_query param');
        }

        context_query.do_count_results = true;
        context_query.query_offset = null;
        context_query.query_limit = null;

        const query_wrapper = await ContextQueryServerController.build_select_query_not_count(context_query);
        if ((!query_wrapper) || (!query_wrapper.query && !query_wrapper.is_segmented_non_existing_table)) {
            ConsoleHandler.error('Invalid query:build_query_count:INFOS context_query:' + (query_wrapper ? (query_wrapper.query ? query_wrapper.is_segmented_non_existing_table : 'NO QUERY') : 'NO QUERY RESULT'));
            context_query.log(true);
            throw new Error('Invalid query:build_query_count');
        }

        if (query_wrapper?.is_segmented_non_existing_table) {
            // Si on a une table segmentée qui n'existe pas, on ne fait rien
            query_wrapper.query = 'SELECT 0 c';
            return query_wrapper;
        }

        query_wrapper.query = 'SELECT COUNT(1) c FROM (' +
            query_wrapper.query +
            ') as tocount';

        return query_wrapper;
    }

    /**
     * Update des vos en appliquant les filtres
     *  1 à un (enfin en paquet de 100) pour appeler les triggers => rien de comparable à un update qui serait fait directement
     *  en bdd côté perf, on pourrait vouloir ajouter cette option mais attention aux triggers qui
     *  ne seraient pas exécutés dans ce cas...
     * @param update_field_name En cas d'update, le nom du champs cible (sur le base_api_type_id)
     * @param new_api_translated_value En cas d'update, la valeur api_translated (par exemple issue de moduletable.default_get_field_api_version)
     *  qu'on va mettre en remplacement de la valeur actuelle
     */
    public static async update_vos<T extends IDistantVOBase>(
        context_query: ContextQueryVO, new_api_translated_values: { [update_field_name in keyof T]?: any }): Promise<InsertOrDeleteQueryResult[]> {

        const time_in = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'update_vos', 'IN');

        /**
         * On a besoin d'utiliser les limit / offset et sortBy donc on refuse ces infos en amont
         */
        if (context_query.query_limit || context_query.query_offset || context_query.sort_by) {
            StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'update_vos', 'Invalid_context_query_param');
            throw new Error('Invalid context_query param');
        }

        if (DAOServerController.GLOBAL_UPDATE_BLOCKER) {
            const uid: number = StackContext.get('UID');
            const CLIENT_TAB_ID: string = StackContext.get('CLIENT_TAB_ID');
            if (uid && CLIENT_TAB_ID) {
                ThrottledRefuseServerController.throttled_refuse({ [uid]: { [CLIENT_TAB_ID]: true } });
            }
            StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'update_vos', 'global_update_blocker');
            return null;
        }

        // On vérifie qu'on peut faire un update
        if ((!context_query.is_server) && !AccessPolicyServerController.checkAccessSync(DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, context_query.base_api_type_id))) {
            StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'update_vos', 'failed_checkAccessSync');
            ConsoleHandler.error('WARNING: update_vos without access and not as server: ' + JSON.stringify(new_api_translated_values));
            context_query.log(true);
            return null;
        }

        // On vérifie qu'il y a un filtrage au minimum, sinon on log un WARNING
        if ((!context_query.filters) || (!context_query.filters.length)) {
            ConsoleHandler.warn('WARNING: update_vos without filters:' + JSON.stringify(context_query));
            StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'update_vos', 'no_filters');
        }

        /**
         * On se fixe des paquets de 100 vos à updater
         * et on sort by id desc pour éviter que l'ordre change pendant le process
         * au pire si on a des nouvelles lignes, elles nous forcerons à remodifier des lignes déjà updatées. probablement pas très grave
         */
        context_query.query_offset = 0;
        context_query.query_limit = await ModuleParams.getInstance().getParamValueAsInt(ModuleDAO.PARAM_NAME_MAX_UPDATE_PER_QUERY, 1000, 600000);

        let might_have_more: boolean = true;
        context_query.set_sort(new SortByVO(context_query.base_api_type_id, 'id', false));
        const moduletable = ModuleTableController.module_tables_by_vo_type[context_query.base_api_type_id];
        const get_active_field_filters = ContextFilterVOHandler.get_active_field_filters(context_query.filters);

        // Si le champs modifié impact un filtrage, on doit pas faire évoluer l'offset
        // FIXME : on est bien sûr de ça ? Typiquement il se passe quoi si on demande de modifier un champs, mais qu'on lui réaffecte la même valeur ... ? On tourne en rond non ?
        //      on doit pouvoir mettre à jour le offset dans ce cas en identifiant qu'on charge toujours les mêmes ids.
        const already_treated_ids: { [id: number]: boolean } = {};

        let change_offset = true;
        for (const field_name in get_active_field_filters[context_query.base_api_type_id]) {
            if (new_api_translated_values[field_name]) {
                change_offset = false;
                break;
            }
        }

        const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[moduletable.vo_type];
        const fields_by_id: { [id: string]: ModuleTableFieldVO } = {};

        for (const i in fields) {
            const field = fields[i];

            if (!field) {
                continue;
            }

            if (field.is_readonly) {
                // intéret de la stat sur tous les fields readonly tout le temps ? StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'update_vos', 'readonly_field');
                continue;
            }

            fields_by_id[field.field_name] = field;
        }

        // // Problème des triggers, qui modifient des champs, et on prend pas en compte ces champs si on limite aux new_api_translated_values
        // let fields_by_id: { [id: string]: ModuleTableFieldVO } = {};
        // for (let field_name in new_api_translated_values) {
        //     let field = moduletable.getFieldFromId(field_name);

        //     if (!field) {
        //         continue;
        //     }

        //     if (field.is_readonly) {
        //         StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'update_vos', 'readonly_field');
        //         continue;
        //     }

        //     fields_by_id[field_name] = field;
        // }

        const moduleTable: ModuleTableVO = ModuleTableController.module_tables_by_vo_type[context_query.base_api_type_id];
        if (!moduleTable) {
            StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'update_vos', 'no_moduletable');
            return null;
        }

        const res: InsertOrDeleteQueryResult[] = [];
        /**
         * FIXME Faudra creuser comment on peut faire du FASTTRACK pour pas faire les updates 1 par 1 si on a pas besoin
         */

        if (ObjectHandler.hasAtLeastOneAttribute(fields_by_id)) {
            while (might_have_more) {

                const while_time_in = Dates.now_ms();
                const preupdate_vos: T[] = await ContextQueryServerController.select_vos<T>(context_query);
                const preupdate_vos_by_ids: { [id: number]: T } = VOsTypesManager.vosArray_to_vosByIds(preupdate_vos);
                const preupdate_vos_by_ids_length = preupdate_vos ? preupdate_vos.length : 0;
                StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'update_vos', 'select_vos');
                StatsController.register_stat_DUREE('ContextQueryServerController', 'update_vos', 'select_vos', Dates.now_ms() - while_time_in);

                might_have_more = (preupdate_vos_by_ids_length >= context_query.query_limit);
                context_query.query_offset += change_offset ? context_query.query_limit : 0;

                if (!preupdate_vos_by_ids_length) {
                    break;
                }
                StatsController.register_stat_QUANTITE('ContextQueryServerController', 'update_vos', 'select_vos', preupdate_vos_by_ids_length);

                /**
                 * Si les vos sont segmentés, on check en amont l'existence des tables segmentées
                 *  car on ne peut pas les créer en parallèle. Du coup on les crée en amont si besoin
                 */
                await ModuleDAOServer.getInstance().confirm_segmented_tables_existence(preupdate_vos);

                let vos_to_update: IDistantVOBase[] = ObjectHandler.clone_vos(preupdate_vos);

                vos_to_update.forEach((vo) => {
                    if (already_treated_ids[vo.id]) {
                        // Cas particulier où on a déjà sélectionné ce vo précédemment et donc l'offset n'a pas été incrémenté suffisamment pour l'éviter
                        context_query.query_offset++;
                        return;
                    }
                    already_treated_ids[vo.id] = true;

                    for (const field_name in new_api_translated_values as IDistantVOBase) {

                        // Si le champs est filtré (readonly par exemple) on ne le met pas à jour
                        if (!fields_by_id[field_name]) {
                            continue;
                        }

                        const new_api_translated_value = new_api_translated_values[field_name];

                        vo[field_name] = ModuleTableFieldController.translate_field_from_api(new_api_translated_value, fields_by_id[field_name]);
                    }
                });

                // On check les foreign keys avant d'essayer d'enregistrer les vos
                if (ModuleDAOServer.getInstance().check_foreign_keys) {
                    vos_to_update = await ModuleDAOServer.getInstance().filterByForeignKeys(vos_to_update);

                    if (!vos_to_update?.length) {
                        StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'update_vos', 'filteredByForeignKeys');
                        continue;
                    }
                }

                const promise_pipeline = new PromisePipeline(Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2)), 'ContextQueryServerController.update_vos');

                for (const i in vos_to_update) {
                    const vo_to_update = vos_to_update[i];
                    const preupdate_vo = preupdate_vos_by_ids[vo_to_update.id];

                    await promise_pipeline.push(async () => {

                        const sql: string = await ModuleDAOServer.getInstance().getqueryfor_insertOrUpdateVO(vo_to_update, preupdate_vo, context_query.is_server);

                        if (!sql) {
                            ConsoleHandler.warn('Est-ce bien normal ? update_vos :(!sql):' + JSON.stringify(vo_to_update));
                            StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'update_vos', 'no_sql');
                            return null;
                        }
                        let failed: boolean = false;

                        const bdd_version = ModuleTableServerController.translate_vos_to_db(vo_to_update);
                        const query_uid = LogDBPerfServerController.log_db_query_perf_start('update_vos', 'type:' + vo_to_update._type);
                        const db_result = await ModuleServiceBase.db.oneOrNone(sql, bdd_version).catch((reason) => {
                            ConsoleHandler.error('update_vos :' + reason);
                            failed = true;
                        });
                        LogDBPerfServerController.log_db_query_perf_end(query_uid, 'update_vos', 'type:' + vo_to_update._type);

                        const this_res: InsertOrDeleteQueryResult = new InsertOrDeleteQueryResult((db_result && db_result.id) ? parseInt(db_result.id.toString()) : null);

                        if (failed || (!this_res) || (!this_res.id)) {
                            StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'update_vos', 'failed');
                            return null;
                        }

                        await DAOServerController.post_update_trigger_hook.trigger(vo_to_update._type, new DAOUpdateVOHolder(preupdate_vo, vo_to_update), context_query.is_server);

                        StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'update_vos', 'OK');
                        StatsController.register_stat_DUREE('ContextQueryServerController', 'update_vos', 'OK', Dates.now_ms() - time_in);
                        res.push(this_res);
                    });
                }

                await promise_pipeline.end();
            }
        }

        return res;
    }

    /**
     * Delete des vos en appliquant les filtres
     *  1 à un (enfin en paquet de 100) pour appeler les triggers => rien de comparable à un delete qui serait faire directement
     *  en bdd côté perf, on pourrait vouloir ajouter cette option mais attention aux triggers qui
     *  ne seraient pas exécutés dans ce cas...
     */
    public static async delete_vos(context_query: ContextQueryVO): Promise<InsertOrDeleteQueryResult[]> {

        const time_in = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'delete_vos', 'IN');

        /**
         * On a besoin d'utiliser les limit / offset et sortBy donc on refuse ces infos en amont
         */
        if (context_query.query_limit || context_query.query_offset || context_query.sort_by) {
            StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'delete_vos', 'Invalid_context_query_param');
            throw new Error('Invalid context_query param');
        }

        /**
         * Il faut savoir si on a besoin de faire appel à des triggers
         */

        if (DAOServerController.GLOBAL_UPDATE_BLOCKER) {
            const uid: number = StackContext.get('UID');
            const CLIENT_TAB_ID: string = StackContext.get('CLIENT_TAB_ID');
            if (uid && CLIENT_TAB_ID) {
                ThrottledRefuseServerController.throttled_refuse({ [uid]: { [CLIENT_TAB_ID]: true } });
            }
            StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'delete_vos', 'global_update_blocker');
            return null;
        }

        // On vérifie qu'on peut faire un delete
        if ((!context_query.is_server) && !AccessPolicyServerController.checkAccessSync(DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_DELETE, context_query.base_api_type_id))) {
            StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'delete_vos', 'failed_checkAccessSync');
            ConsoleHandler.warn('WARNING: selete_vos without access and not as server:' + JSON.stringify(context_query));
            return null;
        }

        // On commence par charger les vos à supprimer pour pouvoir réaliser les triggers
        const moduletable: ModuleTableVO = ModuleTableController.module_tables_by_vo_type[context_query.base_api_type_id];
        let vos_to_delete: IDistantVOBase[] = null;
        const deleted_vos_by_id: { [id: number]: IDistantVOBase } = {};
        let has_more_to_delete: boolean = true;
        const queries: string[] = [];
        const res: InsertOrDeleteQueryResult[] = [];
        const has_trigger_pre_delete: boolean = DAOServerController.pre_delete_trigger_hook.has_trigger(context_query.base_api_type_id);
        const has_trigger_post_delete: boolean = DAOServerController.post_delete_trigger_hook.has_trigger(context_query.base_api_type_id);

        // if (has_trigger_pre_delete || has_trigger_post_delete || has_deps) { FIXME Faudrait pouvoir avoir un FastTrack si on a pas de trigger et pas de deps
        //  pour éviter au max ce select_vos()... mais très compliqué de gérer les deps  avec les blocages de suppression à mi-chemin + les triggers. ça se
        //  fait maintenant avec le contextquery en récursif mais là c'est pas le moment.... à creuser pour les perfs on doit pouvoir booster énormément cette
        //  partie là

        context_query.query_offset = 0;
        context_query.query_limit = await ModuleParams.getInstance().getParamValueAsInt(ModuleDAO.PARAM_NAME_MAX_DELETE_PER_QUERY, 1000, 600000);
        const InsertOrDeleteQueryResults: InsertOrDeleteQueryResult[] = [];

        while (has_more_to_delete) {
            const while_time_in = Dates.now_ms();
            vos_to_delete = await context_query.select_vos();
            StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'delete_vos', 'select_vos');
            StatsController.register_stat_DUREE('ContextQueryServerController', 'delete_vos', 'select_vos', Dates.now_ms() - while_time_in);

            if ((!vos_to_delete) || (!vos_to_delete.length)) {
                return res;
            }
            StatsController.register_stat_QUANTITE('ContextQueryServerController', 'delete_vos', 'select_vos', vos_to_delete.length);
            has_more_to_delete = (vos_to_delete.length >= context_query.query_limit);

            const deleted_vos_promise_pipeline = new PromisePipeline(ConfigurationService.node_configuration.MAX_POOL / 3, 'ContextQueryServerController.delete_vos');
            for (const i in vos_to_delete) {
                const vo_to_delete = vos_to_delete[i];

                await deleted_vos_promise_pipeline.push(async () => {

                    if (has_trigger_pre_delete) {
                        // Ajout des triggers, avant et après suppression.
                        //  Attention si un des output est false avant suppression, on annule la suppression
                        const preDeleteTrigger_res: boolean[] = await DAOServerController.pre_delete_trigger_hook.trigger(context_query.base_api_type_id, vo_to_delete, context_query.is_server);
                        if (!BooleanHandler.AND(preDeleteTrigger_res, true)) {
                            StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'delete_vos', 'pre_delete_trigger_hook_rejection');
                            return;
                        }
                    }

                    /**
                     * AJOUT de la suppression Dep by Dep => on ne laisse plus la BDD fait marcher les triggers de suppression, on gère
                     *  ça directement applicativement => attention à l'impact sur les perfs. L'objectif est surtout de s'assurer qu'on
                     *  appelle bien tous les triggers et entre autre les droits de suppression des dépendances
                     */
                    const deps: VocusInfoVO[] = await ModuleVocusServer.getInstance().getVosRefsById(vo_to_delete._type, vo_to_delete.id, null, null, true);

                    // Si on a une interdiction de supprimer un item à mi-chemin, il faudrait restaurer tout ceux qui ont été supprimés
                    //  c'est pas le cas du tout en l'état puisqu'au mieux on peut restaurer ceux visible sur ce niveau de deps, mais leurs
                    //  deps sont définitivement perdues...
                    const deps_to_delete: IDistantVOBase[] = [];
                    const deps_promise_pipeline = new PromisePipeline(ConfigurationService.node_configuration.MAX_POOL / 3, 'ContextQueryServerController.delete_vos_deps');

                    for (const dep_i in deps) {
                        const dep = deps[dep_i];

                        if (!dep.is_cascade) {
                            continue;
                        }

                        let is_ok = false;
                        await deps_promise_pipeline.push(async () => {
                            try {
                                const count_links: number = await query(dep.linked_type)
                                    .filter_by_id(dep.linked_id)
                                    .exec_as_server(context_query.is_server)
                                    .select_count();

                                if (!count_links) {
                                    is_ok = true;
                                    return;
                                }

                                const deleted_links: InsertOrDeleteQueryResult[] = await query(dep.linked_type).filter_by_id(dep.linked_id).exec_as_server(context_query.is_server).delete_vos();
                                if ((!deleted_links) || (deleted_links.length != count_links)) {
                                    StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'delete_vos', 'failed_delete_links');
                                    ConsoleHandler.error('FAILED DELETE DEPS :' + dep.linked_type + ':' + dep.linked_id + ':ABORT DELETION:' + JSON.stringify(vo_to_delete));
                                    return;
                                }
                                is_ok = true;
                            } catch (error) {
                                StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'delete_vos', 'error_deleting_links');
                                ConsoleHandler.error(error);
                            }
                        });

                        if (!is_ok) {
                            continue;
                        }
                    }

                    await deps_promise_pipeline.end();

                    let full_name = null;

                    if (moduletable.is_segmented) {
                        // Si on est sur une table segmentée on adapte le comportement
                        full_name = moduletable.get_segmented_full_name_from_vo(vo_to_delete);
                    } else {
                        full_name = moduletable.full_name;
                    }

                    ContextQueryInjectionCheckHandler.assert_numeric(vo_to_delete.id);
                    const sql = "DELETE FROM " + full_name + " where id = " + vo_to_delete.id + " RETURNING id";
                    if (ConfigurationService.node_configuration.DEBUG_DELETEVOS) {
                        ConsoleHandler.log('DELETEVOS:oneOrNone:' + sql + ':' + JSON.stringify(vo_to_delete));
                    }

                    queries.push(sql);
                    deleted_vos_by_id[vo_to_delete.id] = vo_to_delete;
                });
            }
            await deleted_vos_promise_pipeline.end();

            if ((!queries) || (!queries.length)) {
                StatsController.register_stat_DUREE('ContextQueryServerController', 'delete_vos', 'deleted_vos_promise_pipeline_end_empty', Dates.now_ms() - while_time_in);
                StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'delete_vos', 'nothing_to_delete');
                return null;
            }
            StatsController.register_stat_DUREE('ContextQueryServerController', 'delete_vos', 'deleted_vos_promise_pipeline_end', Dates.now_ms() - while_time_in);
            StatsController.register_stat_QUANTITE('ContextQueryServerController', 'delete_vos', 'deleted_vos', queries.length);

            const db_time_in = Dates.now_ms();

            await ModuleServiceBase.db.tx(async (t) => {

                const qs = [];
                for (const i in queries) {
                    const sql = queries[i];
                    qs.push(t.oneOrNone(sql));
                }
                return t.batch(qs);
            }).then(async (value: any) => {

                StatsController.register_stat_DUREE('ContextQueryServerController', 'delete_vos', 'WHILE_IN_TO_DB_OUT', Dates.now_ms() - while_time_in);
                StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'delete_vos', 'DB_OUT');
                StatsController.register_stat_DUREE('ContextQueryServerController', 'delete_vos', 'DB', Dates.now_ms() - db_time_in);

                const really_deleted_vos: IDistantVOBase[] = [];
                if (value && value.length) {
                    StatsController.register_stat_QUANTITE('ContextQueryServerController', 'delete_vos', 'DB_deleted_vos', value.length);
                    for (const i in value) {
                        const result = value[i];
                        const result_id = (result && result.id) ? parseInt(result.id.toString()) : null;
                        InsertOrDeleteQueryResults.push(new InsertOrDeleteQueryResult(result_id));
                        if (result_id && deleted_vos_by_id[result_id]) {
                            really_deleted_vos.push(deleted_vos_by_id[result_id]);
                        }
                    }
                    const expected_nb_deleted_vos = Object.keys(deleted_vos_by_id).length;
                    if (value.length != expected_nb_deleted_vos) {
                        StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'delete_vos', 'DIFF_NB_VOS_DELETED');
                        StatsController.register_stat_QUANTITE('ContextQueryServerController', 'delete_vos', 'DIFF_NB_VOS_DELETED', expected_nb_deleted_vos - value.length);
                    }
                }

                StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'delete_vos', 'DB_OUT');
                if (has_trigger_post_delete || ConfigurationService.node_configuration.DEBUG_DELETEVOS) {
                    for (const i in really_deleted_vos) {
                        const deleted_vo = really_deleted_vos[i];
                        if (ConfigurationService.node_configuration.DEBUG_DELETEVOS) {
                            ConsoleHandler.log('DELETEVOS:post_delete_trigger_hook:deleted_vo:' + JSON.stringify(deleted_vo));
                        }

                        await DAOServerController.post_delete_trigger_hook.trigger(deleted_vo._type, deleted_vo, context_query.is_server);
                    }
                }
                return value;
            });
        }
        StatsController.register_stat_DUREE('ContextQueryServerController', 'delete_vos', 'OUT', Dates.now_ms() - time_in);
        StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'delete_vos', 'OUT');
        return InsertOrDeleteQueryResults;
    }

    public static async build_select_query(context_query: ContextQueryVO): Promise<ParameterizedQueryWrapper> {

        if (context_query.do_count_results) {
            return await ContextQueryServerController.build_query_count(context_query);
        }

        return await ContextQueryServerController.build_select_query_not_count(context_query);
    }

    public static async get_valid_segmentations(moduletable: ModuleTableVO, context_query: ContextQueryVO): Promise<number[]> {
        const segmentation_field: ModuleTableFieldVO = moduletable.table_segmented_field;

        switch (segmentation_field.field_type) {
            case ModuleTableFieldVO.FIELD_TYPE_foreign_key:

                if (!segmentation_field.foreign_ref_vo_type) {
                    throw new Error('Invalid segmentation_moduletable');
                }

                /**
                 * Si la requete principale est admin, la requete de segmentation doit l'être aussi
                 */
                let seg_query = query(segmentation_field.foreign_ref_vo_type)
                    .field(field_names<IDistantVOBase>().id)
                    .set_query_distinct()
                    .exec_as_server(context_query.is_server);
                seg_query = ContextQueryServerController.configure_query_for_segmented_table_segment_listing(seg_query, moduletable, context_query);

                // On ajoute des fasttracks pour ne pas avoir besoin de faire en base une requête dont le résultat est évident
                // Typiquement si on construit une requete de type select id from t0 where t0.id = 10, la réponse est 10 dans ce contexte
                //  car le 10 n'a pas pu être inventé, il estdonc existant en base. et la requête est executée en tant que serveur donc on ne peut pas le rater
                let ids: number[] = ContextQueryServerController.get_fasttracks_ids(seg_query);

                if (!ids) {
                    const ids_map: IDistantVOBase[] = await seg_query.select_vos();
                    ids = ids_map ? ids_map.map((id_map) => id_map.id) : null;
                }

                if (!ids || !ids.length) {
                    return null;
                    // EDIT : je vois pas pourquoi ça serait un problème en fait, on a juste pas de résultats de segmentation ça semble pas grave en soit... throw new Error('Invalid segmentations');
                }

                /**
                 * On est dans le cadre d'un select donc on check l'existence des ids sinon on les retire
                 */
                ids = ids.filter((id) => {
                    return (!!DAOServerController.segmented_known_databases[moduletable.database]) &&
                        (id == DAOServerController.segmented_known_databases[moduletable.database][moduletable.get_segmented_name(id)]);
                });

                return (ids?.length > 0) ? ids : null;
            default:
                throw new Error('Invalid segmentation_moduletable');
        }
    }

    public static async count_valid_segmentations(api_type_id: string, context_query: ContextQueryVO, ignore_self_filter: boolean = true): Promise<number> {

        if (ignore_self_filter) {
            const field = context_query.fields[0];
            const get_active_field_filters = ContextFilterVOHandler.get_active_field_filters(context_query.filters);

            /**
             * on ignore le filtre sur ce champs par défaut, et par contre on considère le acutal_query comme un filtrage en text_contient
             */
            if (get_active_field_filters && get_active_field_filters[field.api_type_id] && get_active_field_filters[field.api_type_id][field.field_name]) {
                // Je supprime le filtre du champ si je ne cherche pas à exclure de données
                switch (get_active_field_filters[field.api_type_id][field.field_name].filter_type) {
                    case ContextFilterVO.TYPE_TEXT_EQUALS_NONE:
                    case ContextFilterVO.TYPE_TEXT_INCLUDES_NONE:
                    case ContextFilterVO.TYPE_TEXT_STARTSWITH_NONE:
                    case ContextFilterVO.TYPE_TEXT_ENDSWITH_NONE:
                    case ContextFilterVO.TYPE_NUMERIC_NOT_EQUALS:
                        break;

                    default:
                        delete get_active_field_filters[field.api_type_id][field.field_name];
                        context_query.filters = ContextFilterVOManager.get_context_filters_from_active_field_filters(get_active_field_filters);
                        break;
                }
            }
        }

        const moduletable = ModuleTableController.module_tables_by_vo_type[api_type_id];
        const segmentation_field: ModuleTableFieldVO = moduletable.table_segmented_field;
        switch (segmentation_field.field_type) {
            case ModuleTableFieldVO.FIELD_TYPE_foreign_key:

                if (!segmentation_field.foreign_ref_vo_type) {
                    throw new Error('Invalid segmentation_moduletable');
                }

                /**
                 * Si la requete principale est admin, la requete de segmentation doit l'être aussi
                 */
                const seg_query = query(segmentation_field.foreign_ref_vo_type).field(field_names<IDistantVOBase>().id).set_query_distinct().exec_as_server(context_query.is_server);

                // On ajoute des fasttracks pour ne pas avoir besoin de faire en base une requête dont le résultat est évident
                // Typiquement si on construit une requete de type select id from t0 where t0.id = 10, la réponse est 10 dans ce contexte
                //  car le 10 n'a pas pu être inventé, il estdonc existant en base. et la requête est executée en tant que serveur donc on ne peut pas le rater
                const ids: number[] = ContextQueryServerController.get_fasttracks_ids(seg_query);
                let nb = 0;

                if (!ids) {
                    nb = await ContextQueryServerController.configure_query_for_segmented_table_segment_listing(seg_query, moduletable, context_query).select_count();
                } else {
                    nb = ids.length;
                }

                return nb;
            default:
                throw new Error('Invalid segmentation_moduletable');
        }
    }

    /**
     * Fonction qui génère la requête select demandée, que ce soit sur les vos directement ou
     *  sur les fields passées dans le context_query
     */
    public static async build_select_query_not_count(context_query: ContextQueryVO): Promise<ParameterizedQueryWrapper> {

        const time_in = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'build_select_query_not_count', 'IN');

        if (!context_query) {
            ConsoleHandler.error('Invalid query:build_select_query_not_count:!context_query:INFOS context_query');
            context_query.log(true);
            StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'build_select_query_not_count', 'OUT_context_query_empty');
            throw new Error('Invalid query param:!context_query');
        }

        /**
         * On rajoute un check sur les filtres, si on a une arbo en ET, on transforme en tableau de filtres
         */
        ContextQueryServerController.check_filters_arbo_ET(context_query);

        const main_query_wrapper: ParameterizedQueryWrapper = new ParameterizedQueryWrapper(null, [], null);
        const access_type: string = ModuleDAO.DAO_ACCESS_TYPE_READ;
        let res = null;

        try {

            /**
             * Par mesure de sécu on check que les éléments proposés existent en base
             */
            if (!context_query.base_api_type_id) {
                ConsoleHandler.error('Invalid query:build_select_query_not_count:!base_api_type_id:INFOS context_query');
                context_query.log(true);
                StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'build_select_query_not_count', 'OUT_base_api_type_id_empty');
                throw new Error('Invalid query param:!base_api_type_id');
            }

            /**
             * Check injection : Checker le format du context_query.base_api_type_id qui soit bien que des lettres/chiffres sans espace
             */
            ContextQueryInjectionCheckHandler.assert_api_type_id_format(context_query.base_api_type_id);

            /**
             * Check injection : Checker le format du context_query.query_tables_prefix qui soit bien que des lettres/chiffres sans espace
             */
            ContextQueryInjectionCheckHandler.assert_postgresql_name_format(context_query.query_tables_prefix);

            // Si on ignore_access_hook, on ignore les droits aussi
            if ((!context_query.is_server) && !ContextAccessServerController.check_access_to_api_type_ids_fields(context_query, context_query.base_api_type_id, context_query.fields, access_type)) {
                StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'build_select_query_not_count', 'OUT_check_access_failed');
                return null;
            }

            const base_moduletable = ModuleTableController.module_tables_by_vo_type[context_query.base_api_type_id];

            if (!base_moduletable) {
                ConsoleHandler.error('Invalid query:build_select_query_not_count:!base_moduletable:INFOS context_query');
                context_query.log(true);
                StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'build_select_query_not_count', 'OUT_not_found_base_moduletable');
                throw new Error('Invalid query param:!base_moduletable');
            }

            /**
             * Check injection OK : get_table_full_name is OK
             */

            /**
             * Si on est segmentés on charge tous les num de segmentations compatibles avec ce context_query et on union all toutes les requetes
             *  sinon on fait la requete sur la table simplement
             */
            if (base_moduletable.is_segmented || context_query.union_queries?.length > 0) {

                let queries: string[] = [];

                if (!(context_query.union_queries?.length > 0) && base_moduletable.is_segmented) {
                    const { queries: select_queries } = await ContextQueryServerController.build_segmented_moduletable_select_query(
                        context_query,
                        main_query_wrapper,
                        queries,
                        access_type,
                    );

                    if (select_queries?.length > 0) {
                        queries = queries.concat(select_queries);
                    }
                }

                await ContextQueryServerController.handle_context_query_union_queries(
                    context_query,
                    main_query_wrapper,
                    queries,
                    access_type
                );

                /**
                 * WARN :: Un check complémentaire suite observation en prod, mais sans comprendre pourquoi on a besoin de le faire
                 *  On cleans les doublons de requête, sinon on peut avoir 2 résultats identiques à la fin
                 */
                queries = ArrayHandler.removeDuplicateStrings(queries);

                if (!queries.length) {
                    main_query_wrapper.mark_as_is_segmented_non_existing_table();

                    StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'build_select_query_not_count', 'OUT_is_segmented_non_existing_table');
                    StatsController.register_stat_DUREE('ContextQueryServerController', 'build_select_query_not_count', 'OUT_is_segmented_non_existing_table', Dates.now_ms() - time_in);
                    return main_query_wrapper;
                }

                res = await ContextQueryServerController.handle_queries_union_all(
                    context_query,
                    main_query_wrapper,
                    queries,
                    access_type
                );
            } else {
                res = await ContextQueryServerController.build_select_query_not_count_segment(
                    context_query,
                    access_type,
                    base_moduletable,
                    base_moduletable.vo_type
                );
            }
        } catch (error) {
            ConsoleHandler.error(error);
            context_query.log(true);
            StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'build_select_query_not_count', 'OUT_ERROR');
            return main_query_wrapper;
        }

        StatsController.register_stat_COMPTEUR('ContextQueryServerController', 'build_select_query_not_count', 'OUT');
        StatsController.register_stat_DUREE('ContextQueryServerController', 'build_select_query_not_count', 'OUT', Dates.now_ms() - time_in);

        if (ConfigurationService.node_configuration.DEBUG_CONTEXT_QUERY_build_select_query_not_count) {
            ConsoleHandler.log('build_select_query_not_count:' + res.query);
        }

        return res;
    }

    private static SORT_ALIAS_UID: number = 0;

    private static INTERNAL_LABEL_REMPLACEMENT: string = '___internal___label___rplcmt____';

    private static async handle_context_query_union_queries(
        context_query: ContextQueryVO,
        main_query_wrapper: ParameterizedQueryWrapper,
        queries: string[],
        access_type: string
    ) {

        // Loop on union_queries
        if (context_query.union_queries?.length > 0) {
            const root_context_query = cloneDeep(context_query);

            const union_context_queries: ContextQueryVO[] = context_query.union_queries;

            root_context_query.query_distinct = false;
            root_context_query.union_queries = null;

            union_context_queries.push(root_context_query);

            // We should get the moduletable from each union query
            // We should get the fields from each union query
            // - The given fields shall help to force cast to the right postgresql type
            const { all_distinct_fields } = ContextQueryServerController.get_common_fields_from_union_context_query(
                context_query
            );

            // Build sub-query for the final db request to union
            // Select offset fields as null for each moduletable
            // Each union_query may be segmented
            for (const key in union_context_queries) {
                const union_context_query = context_query.union_queries[key];

                const has_access_api_type_id = ContextAccessServerController.check_access_to_api_type_ids_fields(
                    union_context_query,
                    union_context_query.base_api_type_id,
                    union_context_query.fields,
                    access_type
                );

                if (!has_access_api_type_id) {
                    continue;
                }

                const moduletable = ModuleTableController.module_tables_by_vo_type[context_query.base_api_type_id];

                if (moduletable.is_segmented) {

                    const { queries: segmented_queries } = await ContextQueryServerController.build_segmented_moduletable_select_query(
                        context_query,
                        main_query_wrapper,
                        queries,
                        access_type,
                    );

                    if (segmented_queries?.length > 0) {
                        queries = queries.concat(segmented_queries);
                    }

                } else {
                    const parameterized_query_wrapper = await ContextQueryServerController.build_moduletable_select_query(
                        union_context_query,
                        access_type,
                        null,
                        false,
                        null,
                        all_distinct_fields,
                    );

                    if (!!(parameterized_query_wrapper?.query?.length > 0) && !parameterized_query_wrapper?.is_segmented_non_existing_table) {

                        if (!main_query_wrapper.fields) {
                            main_query_wrapper.fields = parameterized_query_wrapper.fields;
                        }

                        queries.push(parameterized_query_wrapper.query);
                    }
                }

                /**
                 * Dans le cas des segmented, on remonte pas auto l'ajout des fields si on en avait pas dans la requete initiale, contrairement aux queries non segmentées, ce qui empeche le throttle
                 */
                if (!(context_query.fields?.length > 0) && (union_context_query.fields?.length > 0)) {
                    context_query.fields = union_context_query.fields;
                }
            }
        }
    }

    private static async handle_queries_union_all(
        context_query: ContextQueryVO,
        main_query_wrapper: ParameterizedQueryWrapper,
        queries: string[],
        access_type: string
    ): Promise<ParameterizedQueryWrapper> {

        const aliases_n: number = 0;

        let union_query = 'SELECT * FROM ((' + queries.join(') UNION ALL (') + ')) as t_union_' + (aliases_n);

        if (context_query.union_queries?.length > 0) {
            // We should Apply Filters clauses on the union_query
            // We should Keep the api_type_id for each union_query
            // Must build the query_wrapper clause for the union_queries, shall be the root context_query

            const union_context_query = cloneDeep(context_query);

            union_context_query.sort_by = union_context_query.sort_by?.map((sort_by) => {
                const alias = sort_by.alias ? sort_by.alias : sort_by.field_name;

                sort_by.alias = `t_union_${aliases_n}.` + alias;

                return sort_by;
            });

            union_context_query.fields = union_context_query.fields?.map((field) => {
                const alias = field.alias ? field.alias : field.field_name;

                field.alias = `t_union_${aliases_n}.` + alias;

                return field;
            });

            const GROUP_BY = await ContextQueryServerController.build_query_wrapper_group_by_clause(
                union_context_query,
                main_query_wrapper,
                false,
            );

            const { SORT_BY, QUERY } = await ContextQueryServerController.build_query_wrapper_sort_by_clause(
                union_context_query,
                main_query_wrapper,
                aliases_n,
                access_type,
                union_query
            );

            // Limit
            let LIMIT = "";

            if (!union_context_query.do_count_results) {
                LIMIT = ContextQueryServerController.get_limit(union_context_query);
            }

            union_query = QUERY + GROUP_BY + SORT_BY + LIMIT;
        }

        main_query_wrapper.set_query(union_query);
        return main_query_wrapper;
    }

    private static async build_segmented_moduletable_select_query(
        context_query: ContextQueryVO,
        query_wrapper: ParameterizedQueryWrapper,
        queries: string[],
        access_type: string,
    ): Promise<{ context_query: ContextQueryVO, query_wrapper: ParameterizedQueryWrapper, queries: string[] }> {

        const moduletable = ModuleTableController.module_tables_by_vo_type[context_query.base_api_type_id];
        let ids: number[] = null;

        if (!moduletable.is_segmented) {
            return null;
        }

        ids = await ContextQueryServerController.get_valid_segmentations(moduletable, context_query);

        if (!(ids?.length > 0)) {
            query_wrapper.mark_as_is_segmented_non_existing_table();

            return { context_query, query_wrapper, queries };
        }

        for (const i in ids) {
            const id: number = ids[i];

            const context_query_segmented: ContextQueryVO = cloneDeep(context_query);

            context_query_segmented.filter_by_id(
                id,
                moduletable.table_segmented_field.foreign_ref_vo_type
            );

            // Build sub-query for the final db request to union
            const parameterized_query_wrapper = await ContextQueryServerController.build_moduletable_select_query(
                context_query_segmented,
                access_type,
                moduletable,
                true,
                id
            );

            if (!!(parameterized_query_wrapper?.query?.length > 0) && !parameterized_query_wrapper.is_segmented_non_existing_table) {

                if (!query_wrapper.fields) {
                    query_wrapper.fields = parameterized_query_wrapper.fields;
                }

                queries.push(parameterized_query_wrapper.query);
            }

            /**
             * Dans le cas des segmented, on remonte pas auto l'ajout des fields si on en avait pas dans
             * la requete initiale, contrairement aux queries non segmentées, ce qui empeche le throttle
             */
            if (!(context_query.fields?.length > 0) && (context_query_segmented.fields)) {
                context_query.fields = context_query_segmented.fields;
            }
        }

        return { context_query, query_wrapper, queries };
    }

    /**
     * Build moduletable select query
     *
     * @param context_query
     * @param access_type
     * @param base_moduletable
     * @param is_for_segmented_table
     * @param segmented_table_field_name
     * @returns Promise<ParameterizedQueryWrapper>
     */
    private static async build_moduletable_select_query(
        context_query: ContextQueryVO,
        access_type: string,
        base_moduletable: ModuleTableVO = null, // If we are in a segmented table, we need to pass the base moduletable
        is_for_segmented_table: boolean = false,   // We can be either in segmented (manyToOne) table mode or in union queries mode
        segmented_table_field_name: number = null,
        all_required_fields: ModuleTableFieldVO[] = null,
    ): Promise<ParameterizedQueryWrapper> {
        let moduletable = base_moduletable;

        if (!is_for_segmented_table) {
            moduletable = ModuleTableController.module_tables_by_vo_type[context_query.base_api_type_id];
        }

        const parameterized_query_wrapper: ParameterizedQueryWrapper = await ContextQueryServerController.build_select_query_not_count_segment(
            context_query,
            access_type,
            moduletable,
            moduletable.vo_type,
            is_for_segmented_table,
            segmented_table_field_name,
            all_required_fields,
        );

        return parameterized_query_wrapper;
    }

    /**
     * Find the fields intersection between each vo_type
     *
     * @param {ContextQueryVO} context_query
     * @returns {{ fields_intersection: string[], all_field_names: string[] }}
     */
    private static get_common_fields_from_union_context_query(
        context_query: ContextQueryVO
    ): { fields_intersection: ModuleTableFieldVO[], all_distinct_fields: ModuleTableFieldVO[] } {

        // Whole unique field ids set
        const all_field_names_set = new Set<string>();

        let all_distinct_fields: ModuleTableFieldVO[] = [];
        let fields_intersection: ModuleTableFieldVO[] = [];

        // We should get the moduletable fields from each vo_type
        const fields_by_vo_type: { [vo_type: string]: ModuleTableFieldVO[] } = {};

        // We should keep the fields of the vo_type of the root context_query
        // We should keep fields intersection between each vo_type

        const base_fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[context_query.base_api_type_id];
        fields_by_vo_type[context_query.base_api_type_id] = Object.values(base_fields);

        all_distinct_fields = Array.from(new Set([...all_distinct_fields, ...fields_by_vo_type[context_query.base_api_type_id]]));

        if (!(context_query.union_queries?.length > 0)) {
            return { fields_intersection, all_distinct_fields };
        }

        for (const key in context_query.union_queries) {
            const union_context_query = context_query.union_queries[key];

            const union_fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[context_query.base_api_type_id];
            fields_by_vo_type[union_context_query.base_api_type_id] = Object.values(union_fields);
        }

        // Add all existing fields to the set
        Object.values(fields_by_vo_type).map((fields) => fields.map((field) =>
            all_field_names_set.add(field.field_name)
        ));

        fields_intersection = Object.values(fields_by_vo_type).reduce(
            // Accumulator shall keep all fields of previous iteration that are also in currentVal
            // And remove the one that are not in currentVal
            (accumulator: ModuleTableFieldVO[], currentVal: ModuleTableFieldVO[]) => {
                return accumulator.filter((field: ModuleTableFieldVO) => currentVal.find(
                    (currentField) => currentField.field_name === field.field_name)
                );
            }
        );

        all_distinct_fields = Object.values(fields_by_vo_type).reduce(
            (accumulator: ModuleTableFieldVO[], currentVal: ModuleTableFieldVO[]) => {
                // Accumulator shall keep all distinct fields of each iteration
                return accumulator.concat(
                    currentVal.filter(
                        // Add all fields that are not in accumulator (by field_name)
                        (field: ModuleTableFieldVO) => !accumulator.find(
                            (acc_field) => acc_field.field_name === field.field_name
                        )
                    )
                );
            }
        );

        return { fields_intersection, all_distinct_fields };
    }

    /**
     * Fonction qui génère la requête select demandée, que ce soit sur les vos directement ou
     *  sur les fields passées dans le context_query
     */
    private static async build_select_query_not_count_segment(
        context_query: ContextQueryVO,
        access_type: string,
        base_moduletable: ModuleTableVO,
        base_api_type_id: string,
        is_segmented: boolean = false,
        segmented_value: number = null,
        all_required_fields: ModuleTableFieldVO[] = null,
    ): Promise<ParameterizedQueryWrapper> {

        if (!base_api_type_id) {
            throw new Error('base_api_type_id is required');
        }

        if (all_required_fields?.length > 0) {
            all_required_fields = cloneDeep(all_required_fields);
        }

        let aliases_n: number = 0;
        let FROM: string = null;

        const query_wrapper: ParameterizedQueryWrapper = new ParameterizedQueryWrapper(null, [], [], {
            [context_query.base_api_type_id]: (context_query.query_tables_prefix ?
                (context_query.query_tables_prefix + '_t' + (aliases_n++)) :
                ('t' + (aliases_n++))
            )
        });

        ContextQueryServerController.add_activated_many_to_many(context_query);

        /**
         * Cas du segmented table dont la table n'existe pas, donc on select null en somme (c'est pas une erreur en soit, juste il n'y a pas de données)
         *  - mais on peut pas select null, ça génère un résultat non vide, dont le premier élément est une colonne null (dont le nom est ?column?)
         */
        const full_name: string = is_segmented ? base_moduletable.get_segmented_full_name(segmented_value) : base_moduletable.full_name;
        if (!full_name) {
            query_wrapper.query = 'SELECT null';

            return query_wrapper.mark_as_is_segmented_non_existing_table();
        }

        FROM = " FROM " + full_name + " " + query_wrapper.tables_aliases_by_type[context_query.base_api_type_id];

        query_wrapper.joined_tables_by_vo_type[context_query.base_api_type_id] = base_moduletable;

        const base_moduletable_fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[context_query.base_api_type_id];

        // Set all base_moduletable_fields by default
        if (!(context_query.fields?.length > 0)) {

            context_query.field(field_names<IDistantVOBase>().id);

            // Add all fields by default
            for (const i in base_moduletable_fields) {
                const field = base_moduletable_fields[i];
                context_query.add_field(field.field_name);
            }
        }

        // Case when we need all_required_fields (the overflows fields shall be sets as null)
        if (all_required_fields?.length > 0) {
            // We should stick to the given fields_for_query (if any without overflow fields)
            const fields_for_query = context_query.fields;

            const base_moduletable_fields_as_array = Object.values(base_moduletable_fields);

            // When it is all_default_fields, we should add all_required_fields
            const have_all_default_fields = base_moduletable_fields_as_array.every(
                (moduletable_field) => fields_for_query.find(
                    (field) => field.field_name === moduletable_field.field_name
                )
            );

            // Fields which are in the in the all_required_fields
            // But not in moduletable_fields
            const field_names_to_add: string[] = all_required_fields?.filter(
                (required_field) => !base_moduletable_fields_as_array.find(
                    (f) => f.field_name === required_field.field_name
                )
            ).map((field) => field.field_name);

            // Case when base_moduletable does not have field_to_add set select as null
            for (const i in field_names_to_add) {
                const field_name_to_add = field_names_to_add[i];

                let should_add_field_for_query = false;

                // We should only add fields that are in the fields_for_query
                // If fields_for_query is empty, we should add all fields
                if (fields_for_query?.length > 0) {

                    const fields_for_query_in_field_to_add = fields_for_query.find(
                        (field) => field.field_name === field_name_to_add
                    ) != null;

                    should_add_field_for_query = have_all_default_fields || fields_for_query_in_field_to_add;
                }

                if (!should_add_field_for_query) {
                    continue;
                }

                const field_to_add = all_required_fields.find(
                    (field) => field.field_name === field_name_to_add
                );

                let cast_with = 'text';

                if (typeof field_to_add?.getPGSqlFieldType === 'function') {
                    cast_with = field_to_add.getPGSqlFieldType();
                }

                const has_field = context_query.has_field(field_name_to_add);

                if (has_field) {
                    context_query.replace_field(
                        field_name_to_add,
                        null,
                        null,
                        VarConfVO.NO_AGGREGATOR,
                        ContextQueryFieldVO.FIELD_MODIFIER_NULL_IF_NO_COLUMN,
                        cast_with
                    );
                } else {
                    context_query.add_field(
                        field_name_to_add,
                        null,
                        null,
                        VarConfVO.NO_AGGREGATOR,
                        ContextQueryFieldVO.FIELD_MODIFIER_NULL_IF_NO_COLUMN,
                        cast_with
                    );
                }
            }

            // We should set the api_type_id explicitly for the given context_query
            if (have_all_default_fields) {

                // We should order all fields in the same way of the given all_required_fields
                all_required_fields.push({ field_name: '_explicit_api_type_id' } as ModuleTableFieldVO);

                // We should also add|specify _explicit_api_type_id field to retrieve it later
                context_query.add_field(
                    '_explicit_api_type_id',
                    null,
                    null,
                    VarConfVO.NO_AGGREGATOR,
                    ContextQueryFieldVO.FIELD_MODIFIER_FIELD_AS_EXPLICIT_API_TYPE_ID,
                );
            }

            // We should order all fields in the same way of the given all_required_fields
            context_query.fields = context_query.fields.sort((field_a: ContextQueryFieldVO, field_b: ContextQueryFieldVO) => {
                const all_required_field_names = all_required_fields.map(
                    (field) => field.field_name
                );

                return all_required_field_names.indexOf(field_a.field_name) - all_required_field_names.indexOf(field_b.field_name);
            });
        }

        let SELECT = "SELECT ";
        let first = true;

        /**
         * Ajout du request_id dans la requête pour le cas des UNION ALL typiquement
         */
        if (context_query.request_id) {
            SELECT += context_query.request_id + " as request_id";
            first = false;
        }

        let force_query_distinct: boolean = false;

        for (const i in context_query.fields) {
            const context_field = context_query.fields[i];

            const moduletable = ModuleTableController.module_tables_by_vo_type[context_field.api_type_id];

            if ((!!moduletable) && context_field.field_name) {
                const all_required_field_names = all_required_fields?.map((field) => field.field_name);

                if (
                    (!moduletable) ||
                    (
                        (context_field?.field_name != 'id') &&
                        (!moduletable.get_field_by_id(context_field.field_name))
                    ) &&
                    (
                        // Case when we need all_required_fields (the overflows fields shall be sets as null)
                        (all_required_field_names?.length > 0) &&
                        (!all_required_field_names.find((required_field) => required_field === context_field.field_name))
                    )
                ) {
                    return null;
                }
            }

            /**
             * Checker le format des champs qui sont bien que des lettres/chiffres sans espace
             */
            ContextQueryInjectionCheckHandler.assert_api_type_id_format(context_field.api_type_id);
            ContextQueryInjectionCheckHandler.assert_postgresql_name_format(context_field.alias);
            if (context_field.field_name) {
                ContextQueryInjectionCheckHandler.assert_postgresql_name_format(context_field.field_name);
            }

            /**
             * Si on découvre, et qu'on est pas sur la première table, on passe sur un join à mettre en place
             *
             * Dans le cas d'un join entre contextquery, on arrive aussi ici a condition d'avoir un field issue du join
             */
            if (!query_wrapper.tables_aliases_by_type[context_field.api_type_id]) {

                aliases_n = await ContextQueryServerController.join_api_type_id(
                    context_query,
                    aliases_n,
                    context_field.api_type_id,
                    query_wrapper.jointures,
                    query_wrapper.cross_joins,
                    query_wrapper.joined_tables_by_vo_type,
                    query_wrapper.tables_aliases_by_type,
                    access_type,
                    context_field
                );
            }

            if (!first) {
                SELECT += ', ';
            }
            first = false;

            const parameterizedQueryWrapperField: ParameterizedQueryWrapperField = new ParameterizedQueryWrapperField(
                context_field.api_type_id,
                context_field.field_name,
                context_field.aggregator,
                context_field.alias ?? context_field.field_name
            );

            let field_full_name = query_wrapper.tables_aliases_by_type[context_field.api_type_id] + "." + (context_field.field_name ?? context_field.alias);

            if (
                context_field.modifier === ContextQueryFieldVO.FIELD_MODIFIER_FIELD_AS_EXPLICIT_API_TYPE_ID ||
                context_field.modifier === ContextQueryFieldVO.FIELD_MODIFIER_NULL_IF_NO_COLUMN
            ) {
                field_full_name = context_field.field_name ?? context_field.alias;
            }

            let aggregator_prefix = '';
            let aggregator_suffix = '';

            let alias = context_field.alias;

            if (alias == 'label') {
                alias = ContextQueryServerController.INTERNAL_LABEL_REMPLACEMENT;
            }

            const field_alias = ((alias && context_field.field_name) ? " as " + alias : '');
            let handled = false;

            switch (context_field.aggregator) {
                case VarConfVO.IS_NULLABLE_AGGREGATOR:
                case VarConfVO.NO_AGGREGATOR:
                    break;

                case VarConfVO.ARRAY_AGG_AND_IS_NULLABLE_AGGREGATOR_DISTINCT:
                case VarConfVO.ARRAY_AGG_AGGREGATOR_DISTINCT:
                    aggregator_prefix = 'ARRAY_AGG(DISTINCT ';
                    aggregator_suffix = ')';
                    force_query_distinct = true;
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
                case VarConfVO.AVG_AGGREGATOR:
                    aggregator_prefix = 'AVG(';
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
             *  - field_full_name && field_alias: on a checké le format pur texte de context_field.api_type_id, context_field.alias, context_field.field_name
             */
            if (!handled) {
                SELECT += aggregator_prefix + ContextQueryFieldServerController.apply_modifier(context_field, field_full_name) +
                    aggregator_suffix +
                    field_alias + ' ';
                handled = true;
            }

            query_wrapper.fields.push(parameterizedQueryWrapperField);
        }

        // On check qu'on a bien un sort si on a un LIMIT
        ContextQueryServerController.check_limit(context_query);

        /**
         * On join tous les types demandés dans les sorts dans la requête
         */
        for (const i in context_query.sort_by) {
            const sort_by = context_query.sort_by[i];
            const active_api_type_id = sort_by.vo_type;

            if (!active_api_type_id) {
                continue;
            }

            if (query_wrapper.tables_aliases_by_type[active_api_type_id]) {
                continue;
            }

            const moduletable = ModuleTableController.module_tables_by_vo_type[active_api_type_id];
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
            aliases_n = await ContextQueryServerController.join_api_type_id(
                context_query,
                aliases_n,
                active_api_type_id,
                query_wrapper.jointures,
                query_wrapper.cross_joins,
                query_wrapper.joined_tables_by_vo_type,
                query_wrapper.tables_aliases_by_type,
                access_type
            );
        }

        /**
         * C'est là que le fun prend place, on doit créer la requête pour chaque context_filter et combiner tout ensemble
         */
        const WHERE = await ContextQueryServerController.build_query_wrapper_where_clause(
            context_query,
            query_wrapper,
            aliases_n,
        );

        const GROUP_BY = await ContextQueryServerController.build_query_wrapper_group_by_clause(
            context_query,
            query_wrapper,
            force_query_distinct
        );

        const { SORT_BY, QUERY: SELECT_QUERY } = await ContextQueryServerController.build_query_wrapper_sort_by_clause(
            context_query,
            query_wrapper,
            aliases_n,
            access_type,
            SELECT,
        );

        const JOINTURES = ContextQueryServerController.get_ordered_jointures(context_query, query_wrapper.jointures, query_wrapper.cross_joins);
        const LIMIT = ContextQueryServerController.get_limit(context_query);

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
        const QUERY = SELECT_QUERY + FROM + JOINTURES + WHERE + GROUP_BY + SORT_BY + LIMIT;

        return query_wrapper.set_query(QUERY);
    }

    private static async build_query_wrapper_where_clause(
        context_query: ContextQueryVO,
        query_wrapper: ParameterizedQueryWrapper,
        aliases_n: number = 0,
    ): Promise<string> {

        let WHERE = '';

        /**
         * C'est là que le fun prend place, on doit créer la requête pour chaque context_filter et combiner tout ensemble
         */
        const where_conditions: string[] = [];

        for (const i in context_query.filters) {
            const context_filter = context_query.filters[i];

            // We should check if the table has the field actually

            aliases_n = await ContextQueryServerController.updates_jointures_from_filter(
                context_filter,
                context_query,
                query_wrapper.jointures,
                query_wrapper.joined_tables_by_vo_type,
                query_wrapper.tables_aliases_by_type,
                aliases_n
            );

            /**
             * Check injection : OK
             */
            await ContextFilterServerController.update_where_conditions(
                context_query,
                query_wrapper,
                where_conditions,
                context_filter,
                query_wrapper.tables_aliases_by_type
            );
        }

        const tables_aliases_by_type_for_access_hooks = cloneDeep(query_wrapper.tables_aliases_by_type);
        if (!context_query.is_server) {
            /**
             * Check injection : OK
             */
            await ContextQueryServerController.add_context_access_hooks(context_query, query_wrapper, tables_aliases_by_type_for_access_hooks, where_conditions);
        }

        if (where_conditions?.length > 0) {
            WHERE += ' WHERE (' + where_conditions.join(') AND (') + ')';
        }

        return WHERE;
    }

    private static async build_query_wrapper_group_by_clause(
        context_query: ContextQueryVO,
        query_wrapper: ParameterizedQueryWrapper,
        force_query_distinct: boolean,
        access_type: string = null,
    ): Promise<string> {

        let GROUP_BY = ' ';
        if (context_query.query_distinct || force_query_distinct) {

            GROUP_BY = ' GROUP BY ';

            const group_bys = [];

            for (const i in context_query.fields) {
                const context_field = context_query.fields[i];

                // On ne rajoute pas dans le group by si on utilise un aggregateur
                if ((context_field.aggregator != VarConfVO.NO_AGGREGATOR) && (context_field.aggregator != VarConfVO.IS_NULLABLE_AGGREGATOR)) {
                    continue;
                }

                ContextQueryInjectionCheckHandler.assert_postgresql_name_format(context_field.field_name);
                ContextQueryInjectionCheckHandler.assert_postgresql_name_format(context_field.alias);

                let alias = context_field.alias;

                if (alias == 'label') {
                    alias = ContextQueryServerController.INTERNAL_LABEL_REMPLACEMENT;
                }

                if (
                    context_field.modifier === ContextQueryFieldVO.FIELD_MODIFIER_FIELD_AS_EXPLICIT_API_TYPE_ID ||
                    context_field.modifier === ContextQueryFieldVO.FIELD_MODIFIER_NULL_IF_NO_COLUMN
                ) {
                    alias = context_field.field_name;
                }

                group_bys.push(alias ?
                    alias :
                    query_wrapper.tables_aliases_by_type[context_field.api_type_id] + '.' + context_field.field_name);
            }

            GROUP_BY += group_bys.join(', ');

            if (GROUP_BY == ' GROUP BY ') {
                GROUP_BY = ' ';
            }
        }

        return GROUP_BY;
    }

    private static async build_query_wrapper_sort_by_clause(
        context_query: ContextQueryVO,
        query_wrapper: ParameterizedQueryWrapper,
        aliases_n: number,
        access_type: string,
        QUERY: string,
    ): Promise<{ query_wrapper: ParameterizedQueryWrapper, SORT_BY: string, QUERY: string, aliases_n: number, }> {

        let SORT_BY = '';

        // On check qu'on a bien un sort si on a un LIMIT
        ContextQueryServerController.check_limit(context_query);

        if (context_query.sort_by?.length > 0) {

            let previous_sort_by = SORT_BY;
            let first_sort_by = true;

            SORT_BY += ' ORDER BY ';

            for (const sort_byi in context_query.sort_by) {
                const sort_by = context_query.sort_by[sort_byi];

                if (!first_sort_by) {
                    previous_sort_by = SORT_BY;
                }

                /**
                 * Check injection : context_query.sort_by ok puisqu'on ne l'insère jamais tel quel, mais
                 *  context_query.sort_by.field_name && context_query.sort_by.vo_type doiven²t être testés
                 */
                ContextQueryInjectionCheckHandler.assert_postgresql_name_format(sort_by.vo_type);
                ContextQueryInjectionCheckHandler.assert_postgresql_name_format(sort_by.field_name);

                /**
                 * Si on utilise un alias, on considère que le field existe forcément
                 *  et si on a un vo_type / field_name, on doit vérifier que le field est sélect et si oui, on copie l'alias si il y en a un de def
                 */
                let is_selected_field = !!sort_by.alias;
                if (!is_selected_field) {

                    for (const i in context_query.fields) {
                        const context_field = context_query.fields[i];

                        if (context_field.api_type_id != sort_by.vo_type) {
                            continue;
                        }

                        if (context_field.field_name != sort_by.field_name) {
                            continue;
                        }

                        if (context_field.alias) {
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

                    if (sort_by.alias) {

                        let alias = sort_by.alias;

                        if (alias == 'label') {
                            alias = ContextQueryServerController.INTERNAL_LABEL_REMPLACEMENT;
                        }

                        SORT_BY += modifier_start + alias + modifier_end +
                            (sort_by.sort_asc ? ' ASC ' : ' DESC ');

                    } else {
                        SORT_BY += modifier_start + query_wrapper.tables_aliases_by_type[sort_by.vo_type] + '.' + sort_by.field_name + modifier_end +
                            (sort_by.sort_asc ? ' ASC ' : ' DESC ');
                    }
                } else {

                    const sort_alias = 'sort_alias_' + (ContextQueryServerController.SORT_ALIAS_UID++);

                    SORT_BY += modifier_start + sort_alias + modifier_end + (sort_by.sort_asc ? ' ASC ' : ' DESC ');

                    if (!query_wrapper.tables_aliases_by_type[sort_by.vo_type]) {
                        aliases_n = await ContextQueryServerController.join_api_type_id(
                            context_query,
                            aliases_n,
                            sort_by.vo_type,
                            query_wrapper.jointures,
                            query_wrapper.cross_joins,
                            query_wrapper.joined_tables_by_vo_type,
                            query_wrapper.tables_aliases_by_type,
                            access_type
                        );
                    }

                    /**
                     * Si on a aucun lien avec la requête, on ne peut pas faire de sort
                     */
                    if (query_wrapper.tables_aliases_by_type[sort_by.vo_type]) {

                        QUERY += `, ${sort_by.sort_asc ? 'MIN' : 'MAX'}` +
                            `(${query_wrapper.tables_aliases_by_type[sort_by.vo_type]}.${sort_by.field_name}) as ` +
                            `${sort_alias}`;

                        const parameterizedQueryWrapperField: ParameterizedQueryWrapperField = new ParameterizedQueryWrapperField(
                            sort_by.vo_type, sort_by.field_name, (sort_by.sort_asc ? VarConfVO.MIN_AGGREGATOR : VarConfVO.MAX_AGGREGATOR), sort_alias);

                        query_wrapper.fields.push(parameterizedQueryWrapperField);

                    } else {
                        SORT_BY = previous_sort_by;
                        continue;
                    }
                }
            }
        }

        return { SORT_BY, QUERY, aliases_n, query_wrapper };
    }

    private static async handle_join_context_query(
        context_query_join: ContextQueryJoinVO,
        jointures: string[],
        tables_aliases_by_type: { [vo_type: string]: string }
    ): Promise<number> {

        if (!context_query_join) {
            return;
        }

        const join_on_fields: string[] = [];
        if (!tables_aliases_by_type[context_query_join.joined_table_alias]) {
            tables_aliases_by_type[context_query_join.joined_table_alias] = context_query_join.joined_table_alias;
        }

        for (const i in context_query_join.join_on_fields) {
            const join_on_field: ContextQueryJoinOnFieldVO = context_query_join.join_on_fields[i];

            // On doit adapter le type de join à l'aggrégateur utilisé sur le field originel
            //  Si on a une aggrégation sur le champs de jointure, on doit faire un check sur ANY l'aggrégat
            let source_joined_field = null;
            for (const j in context_query_join.joined_context_query.fields) {
                const joined_field = context_query_join.joined_context_query.fields[j];
                if ((joined_field.field_name == join_on_field.joined_table_field_alias) || (joined_field.alias == join_on_field.joined_table_field_alias)) {
                    source_joined_field = joined_field;
                    break;
                }
            }

            if (!source_joined_field) {
                throw new Error('ContextQueryServerController.handle_join_context_query:source_joined_field:source_joined_field is null');
            }
            const is_aggregate = ((source_joined_field.aggregator == VarConfVO.ARRAY_AGG_AGGREGATOR) || (source_joined_field.aggregator == VarConfVO.ARRAY_AGG_AGGREGATOR_DISTINCT));

            // On doit checker l'égalite et ajouter le cas d'un null de part et d'autre
            if (!is_aggregate) {

                join_on_fields.push(
                    '((' +
                    tables_aliases_by_type[context_query_join.joined_table_alias] + '.' + join_on_field.joined_table_field_alias + ' = ' +
                    tables_aliases_by_type[join_on_field.initial_context_query_api_type_id] + '.' + join_on_field.initial_context_query_field_name_or_alias + ') OR ((' +
                    tables_aliases_by_type[context_query_join.joined_table_alias] + '.' + join_on_field.joined_table_field_alias + ' IS NULL) AND (' +
                    tables_aliases_by_type[join_on_field.initial_context_query_api_type_id] + '.' + join_on_field.initial_context_query_field_name_or_alias + ' IS NULL)))'
                );
            } else {

                join_on_fields.push(
                    '((' +
                    tables_aliases_by_type[join_on_field.initial_context_query_api_type_id] + '.' + join_on_field.initial_context_query_field_name_or_alias + ' = ANY(' +
                    tables_aliases_by_type[context_query_join.joined_table_alias] + '.' + join_on_field.joined_table_field_alias + ')) OR ((' +
                    tables_aliases_by_type[context_query_join.joined_table_alias] + '.' + join_on_field.joined_table_field_alias + ' IS NULL) AND (' +
                    tables_aliases_by_type[join_on_field.initial_context_query_api_type_id] + '.' + join_on_field.initial_context_query_field_name_or_alias + ' IS NULL)))'
                );
            }
        }

        const joined_query_str: string = await context_query_join.joined_context_query.get_select_query_str();
        jointures.push(
            '(' + joined_query_str + ') ' + context_query_join.joined_table_alias +
            ' ON ' + join_on_fields.join(' AND ')
        );
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
    private static async join_api_type_id(
        context_query: ContextQueryVO,
        aliases_n: number,
        api_type_id: string,
        jointures: string[],
        cross_joins: string[],
        joined_tables_by_vo_type: { [vo_type: string]: ModuleTableVO },
        tables_aliases_by_type: { [vo_type: string]: string },
        access_type: string,
        selected_field: ContextQueryFieldVO = null
    ): Promise<number> {

        /**
         * Cas spécifique d'un api_type_id join qui serait en fait issu d'un join de contextquery
         */
        if (context_query.joined_context_queries) {
            const context_query_join = context_query.joined_context_queries.find((joined_context_query) => joined_context_query.joined_table_alias == api_type_id);

            if (context_query_join) {
                return await ContextQueryServerController.handle_join_context_query(context_query_join, jointures, tables_aliases_by_type);
            }
        }

        /**
         * On doit identifier le chemin le plus court pour rejoindre les 2 types de données
         */
        const path: FieldPathWrapper[] = ContextFieldPathServerController.get_path_between_types(
            context_query.discarded_field_paths,
            context_query.use_technical_field_versioning,
            context_query.active_api_type_ids,
            Object.keys(joined_tables_by_vo_type),
            api_type_id
        );
        if (!path) {

            if (selected_field) {

                /**
                 * On doit faire la jointure malgré le manque de chemin, ce qu'on ne fait ps s'il s'agit d'un filtrage ou d'un sort by
                 */
                if ((!context_query.is_server) && !await ContextAccessServerController.check_access_to_field_retrieve_roles(context_query, selected_field.api_type_id, selected_field.field_name, access_type)) {
                    ConsoleHandler.warn('join_api_type_id:check_access_to_field_retrieve_roles:Access denied to field ' + selected_field.field_name + ' of type ' + selected_field.api_type_id + ' for access_type ' + access_type);
                    return aliases_n;
                }

                return await ContextFilterServerController.updates_cross_jointures(
                    context_query,
                    context_query.query_tables_prefix,
                    selected_field.api_type_id,
                    cross_joins,
                    context_query.filters,
                    joined_tables_by_vo_type,
                    tables_aliases_by_type,
                    aliases_n
                );
            } else {
                // pas d'impact de ce filtrage puisqu'on a pas de chemin jusqu'au type cible
                return aliases_n;
            }
        }

        /**
         * On doit checker le trajet complet
         */
        if ((!context_query.is_server) && !ContextAccessServerController.check_access_to_fields(context_query, path, access_type)) {
            return aliases_n;
        }

        return await ContextFilterServerController.updates_jointures(
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
    private static async updates_jointures_from_filter(
        filter: ContextFilterVO,
        context_query: ContextQueryVO,
        jointures: string[],
        joined_tables_by_vo_type: { [vo_type: string]: ModuleTableVO },
        tables_aliases_by_type: { [vo_type: string]: string },
        aliases_n: number
    ): Promise<number> {

        if (!filter) {
            return aliases_n;
        }

        if (filter.vo_type && (filter.vo_type != context_query.base_api_type_id) && !joined_tables_by_vo_type[filter.vo_type]) {

            /**
             * On doit identifier le chemin le plus court pour rejoindre les 2 types de données
             */
            const path: FieldPathWrapper[] = ContextFieldPathServerController.get_path_between_types(
                context_query.discarded_field_paths,
                context_query.use_technical_field_versioning,
                context_query.active_api_type_ids,
                Object.keys(tables_aliases_by_type),
                filter.vo_type
            );

            if (!path) {
                // pas d'impact de ce filtrage puisqu'on a pas de chemin jusqu'au type cible
                return aliases_n;
            }
            aliases_n = await ContextFilterServerController.updates_jointures(
                context_query, context_query.query_tables_prefix, jointures, context_query.filters, joined_tables_by_vo_type, tables_aliases_by_type, path, aliases_n);
            // joined_tables_by_vo_type[api_type_id_i] = ModuleTableController.module_tables_by_vo_type[api_type_id_i];
        }

        if (filter.left_hook) {
            aliases_n = await ContextQueryServerController.updates_jointures_from_filter(
                filter.left_hook,
                context_query,
                jointures,
                joined_tables_by_vo_type,
                tables_aliases_by_type,
                aliases_n
            );
        }

        if (filter.right_hook) {
            aliases_n = await ContextQueryServerController.updates_jointures_from_filter(
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
    private static async add_context_access_hooks(
        context_query: ContextQueryVO,
        query_result: ParameterizedQueryWrapper,
        tables_aliases_by_type: { [vo_type: string]: string },
        where_conditions: string[]) {

        /**
         * Si on est serveur, on ignore cette étape
         */
        if (context_query.is_server || !StackContext.get('IS_CLIENT')) {
            return;
        }

        const context_access_hooks: { [alias: string]: ContextQueryVO[] } = {};
        let uid: number = null;
        const user_data: IUserData = null;
        let user: UserVO = null;
        let user_roles_by_role_id: { [role_id: number]: RoleVO } = null;
        let user_roles: RoleVO[] = null;
        let loaded = false;

        for (const vo_type in tables_aliases_by_type) {

            // Si pas de hook, osef
            if (!DAOServerController.context_access_hooks[vo_type]) {
                continue;
            }

            const alias = tables_aliases_by_type[vo_type];
            const module_table = ModuleTableController.module_tables_by_vo_type[vo_type];

            if (!loaded) {
                loaded = true;

                uid = StackContext.get('UID');
                user = await ModuleAccessPolicyServer.getSelfUser();
                user_roles_by_role_id = AccessPolicyServerController.getUsersRoles(true, uid);
                user_roles = ObjectHandler.hasAtLeastOneAttribute(user_roles_by_role_id) ? Object.values(user_roles_by_role_id) : null;
            }

            const promises = [];
            const hook_cbs = DAOServerController.context_access_hooks[vo_type];
            for (const j in hook_cbs) {
                const hook_cb = hook_cbs[j];

                promises.push((async () => {
                    const query_ = await hook_cb(module_table, uid, user, null, user_roles);

                    if (!query_) {
                        return;
                    }

                    if (!context_access_hooks[alias]) {
                        context_access_hooks[alias] = [];
                    }
                    context_access_hooks[alias].push(query_.set_query_distinct());
                })());
            }

            await all_promises(promises);
        }

        const context_query_fields_by_api_type_id: { [api_type_id: string]: ContextQueryFieldVO[] } = {};

        for (const i in context_query.fields) {
            const field = context_query.fields[i];

            if (!context_query_fields_by_api_type_id[field.api_type_id]) {
                context_query_fields_by_api_type_id[field.api_type_id] = [];
            }

            context_query_fields_by_api_type_id[field.api_type_id].push(field);
        }

        for (const alias in context_access_hooks) {
            const querys = context_access_hooks[alias];

            for (const j in querys) {
                const query_ = querys[j];

                const query_wrapper = await ContextQueryServerController.build_select_query(query_.set_query_distinct());
                if ((!query_wrapper) || (!query_wrapper.query && !query_wrapper.is_segmented_non_existing_table)) {
                    ConsoleHandler.error('Invalid query:add_context_access_hooks:INFOS context_query:' + (query_wrapper ? (query_wrapper.query ? query_wrapper.is_segmented_non_existing_table : 'NO QUERY') : 'NO QUERY RESULT'));
                    context_query.log(true);
                    throw new Error('Invalid query:add_context_access_hooks');
                }

                if (query_wrapper.is_segmented_non_existing_table) {
                    // Si on a une table segmentée qui n'existe pas, on ne fait rien
                    continue;
                }

                const WHERE: string[] = [alias + '.id in (' + query_wrapper.query + ')'];

                let is_nullable_aggregator: boolean = false;

                if (query_ && query_.fields && (query_.fields.length > 0)) {
                    for (const k in query_.fields) {
                        let cq_fields: ContextQueryFieldVO[] = null;

                        if (context_query_fields_by_api_type_id[query_.fields[k].api_type_id] &&
                            (context_query_fields_by_api_type_id[query_.fields[k].api_type_id].length > 0)) {
                            cq_fields = context_query_fields_by_api_type_id[query_.fields[k].api_type_id];
                        }

                        if (cq_fields && (cq_fields.length > 0)) {
                            for (const l in cq_fields) {
                                if ((cq_fields[l].aggregator == VarConfVO.IS_NULLABLE_AGGREGATOR) ||
                                    (cq_fields[l].aggregator == VarConfVO.ARRAY_AGG_AND_IS_NULLABLE_AGGREGATOR) ||
                                    (cq_fields[l].aggregator == VarConfVO.ARRAY_AGG_AND_IS_NULLABLE_AGGREGATOR_DISTINCT)) {
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
    private static get_ordered_jointures(context_query: ContextQueryVO, jointures: string[], cross_joins: string[]): string {
        let res = '';

        if (cross_joins && cross_joins.length) {
            res += ' CROSS JOIN ' + cross_joins.join(' CROSS JOIN ');
        }

        if (jointures && jointures.length) {

            jointures.sort((jointurea: string, jointureb: string) => {
                // Si on cite un alias dans a qui est déclaré dans b, on doit être après b, sinon
                //  soit l'inverse soit osef
                const alias_a = jointurea.split(' ')[1];
                const alias_b = jointureb.split(' ')[1];

                const citation_1_a = jointurea.split(' ')[3].split('.')[0];
                const citation_2_a = jointurea.split(' ')[5].split('.')[0];

                const citation_1_b = jointureb.split(' ')[3].split('.')[0];
                const citation_2_b = jointureb.split(' ')[5].split('.')[0];

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
     * WARN : JNE : je commence à me demander si c'est vraiment une bonne idée de permettre l'ajout auto de liaisons
     *  qui n'ont pas été explicitement citées lors de la construction de la requête. On commence par logguer les ajouts et on avisera
     */
    private static add_activated_many_to_many(context_query: ContextQueryVO) {

        const nn_tables = VOsTypesManager.get_manyToManyModuleTables();
        for (const i in nn_tables) {
            const nn_table = nn_tables[i];

            if (context_query.active_api_type_ids.indexOf(nn_table.vo_type) >= 0) {
                continue;
            }

            const nnfields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[nn_table.vo_type];
            let has_inactive_relation = false;
            for (const j in nnfields) {
                const nnfield = nnfields[j];

                if ((context_query.active_api_type_ids.indexOf(nnfield.foreign_ref_vo_type) < 0) ||
                    (context_query.discarded_field_paths && context_query.discarded_field_paths[nn_table.vo_type] && context_query.discarded_field_paths[nn_table.vo_type][nnfield.field_name])) {
                    has_inactive_relation = true;
                    break;
                }
            }

            if (!has_inactive_relation) {
                context_query.active_api_type_ids.push(nn_table.vo_type);

                if (ConfigurationService.node_configuration.DEBUG_DB_QUERY_add_activated_many_to_many) {
                    ConsoleHandler.warn('add_activated_many_to_many:Ajout de :' + nn_table.vo_type + ': à la requête :');
                    context_query.log();
                }
            }
        }
    }

    /**
     * Check injection OK :
     *  - query_limit && query_offset: on a checké le format pur nombre entier de context_field.query_limit, context_field.query_offset
     */
    private static get_limit(context_query: ContextQueryVO): string {

        if (!context_query) {
            return '';
        }

        let res = '';
        if (context_query.query_limit) {

            // Si on a une limite, mais pas de sort à ce stade il faut alerter
            if ((context_query.query_limit > 1) && ((!context_query.sort_by || !context_query.sort_by.length))) {
                ConsoleHandler.error('get_limit:No sort_by, but query_limit:' + context_query.query_limit + ':SORT IS MANDATORY WHEN LIMIT IS SET: cf https://www.postgresql.org/docs/16/queries-limit.html : ' +
                    'When using LIMIT, it is important to use an ORDER BY clause that constrains the result rows into a unique order.Otherwise you will get an unpredictable subset of the query\'s rows. ' +
                    'You might be asking for the tenth through twentieth rows, but tenth through twentieth in what ordering ? The ordering is unknown, unless you specified ORDER BY.');
            }

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
     * Objectif : résoudre le fait qu'un sort est obligatoire si on utilise LIMIT pour assurer des résultats cohérents
     * cf https://www.postgresql.org/docs/16/queries-limit.html
     * When using LIMIT, it is important to use an ORDER BY clause that constrains the result rows into a unique order.
     * Otherwise you will get an unpredictable subset of the query's rows.
     * You might be asking for the tenth through twentieth rows, but tenth through twentieth in what ordering ?
     * The ordering is unknown, unless you specified ORDER BY.
     *
     * Check injection OK : pas d'usage d'un param strict
     */
    private static check_limit(context_query: ContextQueryVO): void {

        if (!context_query) {
            return;
        }

        // >1 pour éviter le cas du select_one
        if (context_query.query_limit > 1) {

            // Si on a une limite, mais pas de sort à ce stade il faut alerter
            if (!context_query.sort_by || !context_query.sort_by.length) {
                ConsoleHandler.warn('check_limit:No sort_by, but query_limit: AUTO SETTING ORDER TO FIRST COL :' + context_query.query_limit + ':SORT IS MANDATORY WHEN LIMIT IS SET: cf https://www.postgresql.org/docs/16/queries-limit.html : ' +
                    'When using LIMIT, it is important to use an ORDER BY clause that constrains the result rows into a unique order.Otherwise you will get an unpredictable subset of the query\'s rows. ' +
                    'You might be asking for the tenth through twentieth rows, but tenth through twentieth in what ordering ? The ordering is unknown, unless you specified ORDER BY.');

                if ((!context_query.fields) || (!context_query.fields.length)) {
                    ConsoleHandler.error('check_limit:No sort_by, but query_limit: NO FIELD :' + context_query.query_limit + ':SORT IS MANDATORY WHEN LIMIT IS SET: cf https://www.postgresql.org/docs/16/queries-limit.html : ' +
                        'When using LIMIT, it is important to use an ORDER BY clause that constrains the result rows into a unique order.Otherwise you will get an unpredictable subset of the query\'s rows. ' +
                        'You might be asking for the tenth through twentieth rows, but tenth through twentieth in what ordering ? The ordering is unknown, unless you specified ORDER BY.');
                    return;
                }

                context_query.set_sort(new SortByVO(context_query.fields[0].api_type_id, context_query.fields[0].field_name, true));
            }
        }
    }

    /**
     * Le plan est de supprimer toute référence à la table segmentée, sinon on tourne en rond
     */
    private static configure_query_for_segmented_table_segment_listing(context_query: ContextQueryVO, segmented_table: ModuleTableVO, src_context_query: ContextQueryVO): ContextQueryVO {

        const filters: ContextFilterVO[] = src_context_query.filters;
        const forbidden_api_type_id = segmented_table.vo_type;
        const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[segmented_table.vo_type];
        const forbidden_fields: ModuleTableFieldVO[] = [];

        for (const i in fields) {
            const field = fields[i];

            if (field.field_type == ModuleTableFieldVO.FIELD_TYPE_foreign_key) {
                forbidden_fields.push(field);
            }
        }

        /**
         * On peut pas référencer une table segmentée donc on s'intéresse que aux liaisons issues de la table segmentée
         */
        for (const i in forbidden_fields) {
            const field = forbidden_fields[i];

            context_query.set_discarded_field_path(forbidden_api_type_id, field.field_name);
        }

        /**
         * On ajoute aussi les chemins invalidés sur la requête source
         */
        for (const api_type_id in src_context_query.discarded_field_paths) {
            const discard_field_path = src_context_query.discarded_field_paths[api_type_id];

            for (const field_name in discard_field_path) {
                context_query.set_discarded_field_path(api_type_id, field_name);
            }
        }

        for (const i in filters) {
            let f = filters[i];

            /**
             * FIXME TODO : incompatible sur les arborescences de ET et OU pour le moment
             */
            if ((f.filter_type == ContextFilterVO.TYPE_FILTER_AND) || (f.filter_type == ContextFilterVO.TYPE_FILTER_OR)) {
                ConsoleHandler.warn('ContextQueryController.configure_query_for_segmented_table_segment_listing : incompatible sur les arborescences de ET et OU pour le moment');
                continue;
            }

            if (f.vo_type == forbidden_api_type_id) {

                /**
                 * Si on est sur un filtre sur une ref de table externe, on traduit le filtre du champs en filtre de l'id de la table ciblée par le lien
                 *  par exemple si on a un filtre de ldf.pdv_id et ldf est segmentée, alors on remplace par un filtre équivalent sur pdv.id
                 */
                //TODO FIXME handle refranges
                const field = ModuleTableController.module_tables_by_vo_type[f.vo_type].getFieldFromId(f.field_name);
                if (field && (field.field_type == ModuleTableFieldVO.FIELD_TYPE_foreign_key)) {
                    /**
                     * On doit créer un nouveau filtre sur l'id de la table ciblée par le lien
                     */
                    const new_filter = new ContextFilterVO();
                    new_filter.field_name = 'id';
                    new_filter.filter_type = f.filter_type;
                    new_filter.id = f.id;
                    new_filter.left_hook = f.left_hook;
                    new_filter.param_alias = f.param_alias;
                    new_filter.param_hourranges = f.param_hourranges;
                    new_filter.param_numeric = f.param_numeric;
                    new_filter.param_numeric_array = f.param_numeric_array;
                    new_filter.param_numranges = f.param_numranges;
                    new_filter.param_text = f.param_text;
                    new_filter.param_textarray = f.param_textarray;
                    new_filter.right_hook = f.right_hook;
                    new_filter.vo_type = field.foreign_ref_vo_type;
                    new_filter.param_tsranges = f.param_tsranges;
                    new_filter.sub_query = f.sub_query;
                    new_filter.text_ignore_case = f.text_ignore_case;

                    f = new_filter;
                } else {
                    continue;
                }
            }

            context_query.add_filters([f]);
        }

        return context_query;
    }

    /**
     * Si on a une arbo de ET, on va la remplacer par un tableau de filtres
     * @param context_query
     * @returns
     */
    private static check_filters_arbo_ET(context_query: ContextQueryVO) {

        if (!context_query || !context_query.filters) {
            return;
        }

        /**
         *  on regarde si on a une arbo de ET
         */
        const new_filters: ContextFilterVO[] = [];
        for (const i in context_query.filters) {
            let f = context_query.filters[i];

            const arbo_ET = ContextQueryServerController.get_arbo_ET(f);

            if (!arbo_ET) {
                new_filters.push(f);
                continue;
            }

            /**
             * On a une arbo de ET, on va la remplacer par un tableau de filtres
             */
            for (const j in arbo_ET) {
                const go_left = arbo_ET[j];

                if (go_left) {
                    new_filters.push(f.right_hook);
                    f = f.left_hook;
                } else {
                    new_filters.push(f.left_hook);
                    f = f.right_hook;
                }
            }

            new_filters.push(f.left_hook);
            new_filters.push(f.right_hook);
        }

        context_query.filters = new_filters;
    }

    /**
     * On construit un chemin en indiquant si on prend à gauche (true) ou à droite (false) à chaque étape, et si on trouve un chemin valide on le retourne
     * @param context_filter
     * @returns
     */
    private static get_arbo_ET(context_filter: ContextFilterVO): boolean[] {

        if (context_filter.filter_type == ContextFilterVO.TYPE_FILTER_AND) {

            if (!context_filter.left_hook || !context_filter.right_hook) {
                ConsoleHandler.error('ContextQueryController.get_arbo_ET : Un chemin est null');
                return null;
            }

            if (context_filter.left_hook.filter_type == ContextFilterVO.TYPE_FILTER_AND) {
                const res_left = ContextQueryServerController.get_arbo_ET(context_filter.left_hook);
                if (res_left) {
                    res_left.unshift(true);
                    return res_left;
                } else {
                    return [];
                }
            }

            if (context_filter.right_hook.filter_type == ContextFilterVO.TYPE_FILTER_AND) {
                const res_right = ContextQueryServerController.get_arbo_ET(context_filter.right_hook);
                if (res_right) {
                    res_right.unshift(false);
                    return res_right;
                } else {
                    return [];
                }
            }

            return [];
        }

        return null;
    }

    /**
     * On veut gérer sans requete des cas très simple et obligatoirement simples
     * On est en exec_as_server donc ya aucun filtre sur les ids à trouver en base
     * On a un champs id uniquement dans la requête
     * On a un filtre en id_has ou id_eq et uniquement ça, sur le type principal de la query
     * Dans ce cas on retourne le contenu du filtre
     * @param context_query
     * @returns null if not simple case, else the ids list
     */
    private static get_fasttracks_ids(context_query: ContextQueryVO): number[] {

        const res: number[] = [];

        if (!context_query || !context_query.filters) {
            return null;
        }

        if (!context_query.is_server) {
            return null;
        }

        if ((!!context_query.query_limit) || (!!context_query.query_offset)) {
            return null;
        }

        if (context_query.fields.length != 1) {
            return null;
        }

        if (context_query.fields[0].field_name != 'id') {
            return null;
        }

        if (context_query.fields[0].api_type_id != context_query.base_api_type_id) {
            return null;
        }

        const id_filter = ContextQueryServerController.get_id_valid_filter(context_query);
        if (!id_filter) {
            return null;
        }

        if ((id_filter.filter_type != ContextFilterVO.TYPE_NUMERIC_INTERSECTS) && (id_filter.filter_type != ContextFilterVO.TYPE_NUMERIC_EQUALS_ALL) && (id_filter.filter_type != ContextFilterVO.TYPE_NUMERIC_EQUALS_ANY)) {
            return null;
        }

        if (id_filter.param_numeric_array) {
            return Array.from(id_filter.param_numeric_array);
        }

        if (id_filter.param_numranges) {
            RangeHandler.foreach_ranges_sync(id_filter.param_numranges, (id: number) => {
                res.push(id);
            });
            return res;
        }

        return [id_filter.param_numeric];
    }

    /**
     * On veut confirmer le plus rapidement possible qu'il n'y a qu'un filtre id valide sur l'api_type en param, tous les autres
     * doivent être inapplicables (pas de chemin)
     * @returns le filtre id valide, ou null sinon
     */
    private static get_id_valid_filter(context_query: ContextQueryVO): ContextFilterVO {

        if (!context_query || !context_query.filters) {
            return null;
        }

        let id_filter = null;

        for (const i in context_query.filters) {
            const filter = context_query.filters[i];

            if (filter.vo_type != context_query.base_api_type_id) {
                // On doit checker les chemins
                const path_between_types = ContextFieldPathServerController.get_path_between_types(
                    context_query.discarded_field_paths,
                    context_query.use_technical_field_versioning,
                    context_query.active_api_type_ids,
                    [context_query.base_api_type_id],
                    filter.vo_type
                );
                if (!path_between_types) {
                    // pas de chemin
                    continue;
                }

                return null;
            }

            if (filter.field_name != 'id') {
                // pas valid
                return null;
            }

            if (id_filter) {
                return null;
            }

            id_filter = filter;
        }

        return id_filter;
    }
}
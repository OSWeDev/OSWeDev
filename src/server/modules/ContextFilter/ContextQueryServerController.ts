import { cloneDeep } from 'lodash';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ContextQueryInjectionCheckHandler from '../../../shared/modules/ContextFilter/ContextQueryInjectionCheckHandler';
import ContextFilterVOHandler from '../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextFilterVOManager from '../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import ContextFilterVO from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryFieldVO from '../../../shared/modules/ContextFilter/vos/ContextQueryFieldVO';
import ContextQueryVO, { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import FieldPathWrapper from '../../../shared/modules/ContextFilter/vos/FieldPathWrapper';
import ParameterizedQueryWrapper from '../../../shared/modules/ContextFilter/vos/ParameterizedQueryWrapper';
import ParameterizedQueryWrapperField from '../../../shared/modules/ContextFilter/vos/ParameterizedQueryWrapperField';
import SortByVO from '../../../shared/modules/ContextFilter/vos/SortByVO';
import IUserData from '../../../shared/modules/DAO/interface/IUserData';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import DatatableField from '../../../shared/modules/DAO/vos/datatable/DatatableField';
import TableColumnDescVO from '../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import DataFilterOption from '../../../shared/modules/DataRender/vos/DataFilterOption';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import VarConfVO from '../../../shared/modules/Var/vos/VarConfVO';
import VOsTypesManager from '../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import { all_promises } from '../../../shared/tools/PromiseTools';
import ConfigurationService from '../../env/ConfigurationService';
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

export default class ContextQueryServerController {

    public static getInstance() {
        if (!ContextQueryServerController.instance) {
            ContextQueryServerController.instance = new ContextQueryServerController();
        }
        return ContextQueryServerController.instance;
    }

    private static instance: ContextQueryServerController = null;

    private static SORT_ALIAS_UID: number = 0;

    private static INTERNAL_LABEL_REMPLACEMENT: string = '___internal___label___rplcmt____';

    private constructor() { }

    public async configure() {
    }

    /**
     * Filtrer des vos avec les context filters
     * On peut passer le query_wrapper pour éviter de le reconstruire si ça a été fait avant (pour récupérer la requete construite par exemple pour un cache local)
     * @param context_query le champs fields doit être null pour demander des vos complets
     */
    public async select_vos<T extends IDistantVOBase>(context_query: ContextQueryVO, query_wrapper: ParameterizedQueryWrapper = null): Promise<T[]> {

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
            query_wrapper = await this.build_select_query(context_query);
        }

        //Requête
        if (!query_wrapper || (!query_wrapper.query && !query_wrapper.is_segmented_non_existing_table)) {
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
            query_res = await ModuleDAOServer.getInstance().throttle_select_query(
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
            query_res = cloneDeep(query_res);
        }

        let moduletable = VOsTypesManager.moduleTables_by_voType[context_query.base_api_type_id];

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
        let uid = await StackContext.get('UID');

        await ServerAnonymizationController.getInstance().anonymise_context_filtered_rows(
            query_res,
            context_query.fields,
            uid
        );

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

    public async select(context_query: ContextQueryVO, query_wrapper: ParameterizedQueryWrapper = null): Promise<any[]> {

        if (!context_query) {
            throw new Error('Invalid context_query param');
        }

        query_wrapper = query_wrapper ? query_wrapper : await this.build_select_query(context_query);
        if ((!query_wrapper) || ((!query_wrapper.query)) && (!query_wrapper.is_segmented_non_existing_table)) {
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
            query_res = await ModuleDAOServer.getInstance().throttle_select_query(query_wrapper.query, query_wrapper.params, query_wrapper.fields, context_query);
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
            query_res = cloneDeep(query_res);
        }

        // Anonymisation
        let uid = await StackContext.get('UID');
        await ServerAnonymizationController.getInstance().anonymise_context_filtered_rows(query_res, context_query.fields, uid);

        return query_res;
    }

    /**
     * Filtrer des infos avec les context filters, en indiquant obligatoirement les champs ciblés, qui peuvent appartenir à des tables différentes
     *  Compatibilité avec l'alias 'label' qui est un mot réservé en bdd
     * @param context_query le champs fields doit être rempli avec les champs ciblés par la requête (et avec les alias voulus)
     */
    public async select_datatable_rows(
        context_query: ContextQueryVO,
        columns_by_field_id: { [datatable_field_uid: string]: TableColumnDescVO },
        fields: { [datatable_field_uid: string]: DatatableField<any, any> }
    ): Promise<any[]> {

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
        if ((!query_wrapper) || ((!query_wrapper.query)) && (!query_wrapper.is_segmented_non_existing_table)) {
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
            query_res = await ModuleDAOServer.getInstance().throttle_select_query(query_wrapper.query, query_wrapper.params, query_wrapper.fields, context_query);
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
            query_res = cloneDeep(query_res);
        }

        // Anonymisation
        let uid = await StackContext.get('UID');
        await ServerAnonymizationController.getInstance().anonymise_context_filtered_rows(query_res, context_query.fields, uid);

        /**
         * Traitement des champs. on met dans + '__raw' les valeurs brutes, et on met dans le champ lui même la valeur formatée
         */
        let limit = ConfigurationService.node_configuration.MAX_POOL / 2;
        let promise_pipeline = new PromisePipeline(limit);
        for (let i in query_res) {
            let row = query_res[i];

            if (row && row[label_replacement]) {
                row['label'] = row[label_replacement];
                row['label' + '__raw'] = row[label_replacement];
                delete row[label_replacement];
            }

            for (let j in context_query.fields) {
                let field = context_query.fields[j];

                if (field.field_id == 'id') {
                    // row['id' + '__raw'] = row['id'];
                    continue;
                }
                let field_id = field.alias ? field.alias : field.field_id;

                let module_table = VOsTypesManager.moduleTables_by_voType[field.api_type_id];
                let module_field = module_table.getFieldFromId(field.field_id);

                // switch (module_field.field_type) {
                //     case ModuleTableField.FIELD_TYPE_tsrange:
                //         row[field_id] = RangeHandler.parseRangeBDD(
                //             TSRange.RANGE_TYPE, row[field_id], (module_field.segmentation_type ? module_field.segmentation_type : TimeSegment.TYPE_SECOND));
                //         break;
                //     default:
                //         break;
                // }

                let forced_numeric_field = {};
                module_table.force_numeric_field(module_field, row, forced_numeric_field, field_id);
                row[field_id + '__raw'] = forced_numeric_field[field_id];

                // si on est en édition on laisse la data raw
                if (
                    columns_by_field_id &&
                    fields &&
                    fields[field_id] &&
                    (fields[field_id] instanceof DatatableField) && (
                        (!columns_by_field_id[field_id]) ||
                        columns_by_field_id[field_id].readonly)
                ) {
                    await promise_pipeline.push(async () => {
                        await ContextFilterVOHandler.getInstance().get_datatable_row_field_data_async(row, row, fields[field_id]);
                    });
                }
            }
        }

        await promise_pipeline.end();

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
        let get_active_field_filters = ContextFilterVOHandler.getInstance().get_active_field_filters(context_query.filters);

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

        context_query.filters = ContextFilterVOManager.get_context_filters_from_active_field_filters(get_active_field_filters);

        let query_res: any[] = await this.select_datatable_rows(context_query, null, null);
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

        context_query.do_count_results = true;
        context_query.query_offset = null;
        context_query.query_limit = null;

        let query_wrapper = await this.build_select_query_not_count(context_query);

        if ((!query_wrapper) || ((!query_wrapper.query)) && (!query_wrapper.is_segmented_non_existing_table)) {
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
        let get_active_field_filters = ContextFilterVOHandler.getInstance().get_active_field_filters(context_query.filters);

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

                // Find all ids related to the segmentation (relation manyToOne)
                let ids_map: IDistantVOBase[] = await this.configure_query_for_segmented_table_segment_listing(
                    query(segmentation_field.manyToOne_target_moduletable.vo_type)
                        .field('id')
                        .set_query_distinct(), moduletable, context_query.filters)
                    .select_vos();

                let ids: number[] = ids_map ? ids_map.map((id_map) => id_map.id) : null;

                if (!(ids?.length > 0)) {
                    throw new Error('Invalid segmentations');
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

    public async count_valid_segmentations(api_type_id: string, context_query: ContextQueryVO, ignore_self_filter: boolean = true): Promise<number> {

        if (ignore_self_filter) {
            let field = context_query.fields[0];
            let get_active_field_filters = ContextFilterVOHandler.getInstance().get_active_field_filters(context_query.filters);

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
                        context_query.filters = ContextFilterVOManager.get_context_filters_from_active_field_filters(get_active_field_filters);
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

                return await this.configure_query_for_segmented_table_segment_listing(
                    query(segmentation_field.manyToOne_target_moduletable.vo_type)
                        .field('id')
                        .set_query_distinct(),
                    moduletable,
                    context_query.filters
                ).select_count();
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
            ConsoleHandler.error('Invalid query:build_select_query_not_count:INFOS context_query');
            context_query.log(true);
            throw new Error('Invalid query param:build_select_query_not_count');
        }

        let main_query_wrapper: ParameterizedQueryWrapper = new ParameterizedQueryWrapper(null, [], null);
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

            const has_access = ContextAccessServerController.getInstance().check_access_to_api_type_ids_field_ids(
                context_query.base_api_type_id,
                context_query.fields,
                access_type
            );

            if (!has_access) {
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
            if (base_moduletable.is_segmented || context_query.union_queries?.length > 0) {

                let queries: string[] = [];

                if (!(context_query.union_queries?.length > 0) && base_moduletable.is_segmented) {
                    let { queries: select_queries } = await this.build_segmented_moduletable_select_query(
                        context_query,
                        main_query_wrapper,
                        queries,
                        access_type,
                    );

                    if (select_queries?.length > 0) {
                        queries = queries.concat(select_queries);
                    }
                }

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
                    const { all_distinct_fields } = this.get_common_fields_from_union_context_query(
                        context_query
                    );

                    // Build sub-query for the final db request to union
                    // Select offset fields as null for each moduletable
                    // Each union_query may be segmented
                    for (const key in union_context_queries) {
                        const union_context_query = context_query.union_queries[key];

                        const has_access_api_type_id = ContextAccessServerController.getInstance().check_access_to_api_type_ids_field_ids(
                            union_context_query.base_api_type_id,
                            union_context_query.fields,
                            access_type
                        );

                        if (!has_access_api_type_id) {
                            continue;
                        }

                        const moduletable = VOsTypesManager.moduleTables_by_voType[context_query.base_api_type_id];

                        if (moduletable.is_segmented) {

                            let { queries: segmented_queries } = await this.build_segmented_moduletable_select_query(
                                context_query,
                                main_query_wrapper,
                                queries,
                                access_type,
                            );

                            if (segmented_queries?.length > 0) {
                                queries = queries.concat(segmented_queries);
                            }

                        } else {
                            const parameterized_query_wrapper = await this.build_moduletable_select_query(
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

                if (!queries.length) {
                    main_query_wrapper.mark_as_is_segmented_non_existing_table();

                    return main_query_wrapper;
                }

                let aliases_n: number = 0;

                let union_query = 'SELECT * FROM ((' + queries.join(') UNION ALL (') + ')) as t_union_' + (aliases_n);

                if (context_query.union_queries?.length > 0) {
                    // We should Apply Filters clauses on the union_query
                    // We should Keep the api_type_id for each union_query
                    // Must build the query_wrapper clause for the union_queries, shall be the root context_query

                    const union_context_query = cloneDeep(context_query);

                    union_context_query.sort_by = union_context_query.sort_by?.map((sort_by) => {
                        let alias = sort_by.alias ? sort_by.alias : sort_by.field_id;

                        sort_by.alias = `t_union_${aliases_n}.` + alias;

                        return sort_by;
                    });

                    union_context_query.fields = union_context_query.fields?.map((field) => {
                        let alias = field.alias ? field.alias : field.field_id;

                        field.alias = `t_union_${aliases_n}.` + alias;

                        return field;
                    });

                    let GROUP_BY = await this.build_query_wrapper_group_by_clause(
                        union_context_query,
                        main_query_wrapper,
                        false,
                    );

                    let { SORT_BY, QUERY } = await this.build_query_wrapper_sort_by_clause(
                        union_context_query,
                        main_query_wrapper,
                        aliases_n,
                        access_type,
                        union_query
                    );

                    // Limit
                    let LIMIT = "";

                    if (!union_context_query.do_count_results) {
                        LIMIT = this.get_limit(union_context_query);
                    }

                    union_query = QUERY + GROUP_BY + SORT_BY + LIMIT;
                }

                main_query_wrapper.set_query(union_query);

                return main_query_wrapper;
            } else {
                main_query_wrapper = await this.build_select_query_not_count_segment(
                    context_query,
                    access_type,
                    base_moduletable,
                    base_moduletable.vo_type
                );

                return main_query_wrapper;
            }
        } catch (error) {
            ConsoleHandler.error(error);
            return main_query_wrapper;
        }
    }

    private async build_segmented_moduletable_select_query(
        context_query: ContextQueryVO,
        query_wrapper: ParameterizedQueryWrapper,
        queries: string[],
        access_type: string,
    ): Promise<{ context_query: ContextQueryVO, query_wrapper: ParameterizedQueryWrapper, queries: string[] }> {

        const moduletable = VOsTypesManager.moduleTables_by_voType[context_query.base_api_type_id];
        let ids: number[] = null;

        if (!moduletable.is_segmented) {
            return null;
        }

        ids = await this.get_valid_segmentations(moduletable, context_query);

        if (!(ids?.length > 0)) {
            query_wrapper.mark_as_is_segmented_non_existing_table();

            return { context_query, query_wrapper, queries };
        }

        for (const i in ids) {
            const id: number = ids[i];

            const context_query_segmented: ContextQueryVO = cloneDeep(context_query)
                .filter_by_id(
                    id,
                    moduletable.table_segmented_field.manyToOne_target_moduletable.vo_type
                );


            // Build sub-query for the final db request to union
            const parameterized_query_wrapper = await this.build_moduletable_select_query(
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
     * @param segmented_table_field_id
     * @returns Promise<ParameterizedQueryWrapper>
     */
    private async build_moduletable_select_query(
        context_query: ContextQueryVO,
        access_type: string,
        base_moduletable: ModuleTable<any> = null, // If we are in a segmented table, we need to pass the base moduletable
        is_for_segmented_table: boolean = false,   // We can be either in segmented (manyToOne) table mode or in union queries mode
        segmented_table_field_id: number = null,
        all_required_fields: Array<ModuleTableField<any>> = null,
    ): Promise<ParameterizedQueryWrapper> {
        let moduletable = base_moduletable;

        if (!is_for_segmented_table) {
            moduletable = VOsTypesManager.moduleTables_by_voType[context_query.base_api_type_id];
        }

        const parameterized_query_wrapper: ParameterizedQueryWrapper = await this.build_select_query_not_count_segment(
            context_query,
            access_type,
            moduletable,
            moduletable.vo_type,
            is_for_segmented_table,
            segmented_table_field_id,
            all_required_fields,
        );

        return parameterized_query_wrapper;
    }

    /**
     * Find the fields intersection between each vo_type
     *
     * @param {ContextQueryVO} context_query
     * @returns {{ fields_intersection: string[], all_field_ids: string[] }}
     */
    private get_common_fields_from_union_context_query(
        context_query: ContextQueryVO
    ): { fields_intersection: Array<ModuleTableField<any>>, all_distinct_fields: Array<ModuleTableField<any>> } {

        // Whole unique field ids set
        const all_field_ids_set = new Set<string>();

        let all_distinct_fields: Array<ModuleTableField<any>> = [];
        let fields_intersection: Array<ModuleTableField<any>> = [];

        // We should get the moduletable fields from each vo_type
        const fields_by_vo_type: { [vo_type: string]: Array<ModuleTableField<any>> } = {};

        // We should keep the fields of the vo_type of the root context_query
        // We should keep fields intersection between each vo_type

        const base_moduletable = VOsTypesManager.moduleTables_by_voType[context_query.base_api_type_id];

        fields_by_vo_type[context_query.base_api_type_id] = base_moduletable.get_fields();

        all_distinct_fields = Array.from(new Set([...all_distinct_fields, ...fields_by_vo_type[context_query.base_api_type_id]]));

        if (!(context_query.union_queries?.length > 0)) {
            return { fields_intersection, all_distinct_fields };
        }

        for (const key in context_query.union_queries) {
            const union_context_query = context_query.union_queries[key];

            const union_moduletable = VOsTypesManager.moduleTables_by_voType[union_context_query.base_api_type_id];

            fields_by_vo_type[union_context_query.base_api_type_id] = union_moduletable.get_fields();
        }

        // Add all existing fields to the set
        Object.values(fields_by_vo_type).map((fields) => fields.map((field) => all_field_ids_set.add(field.field_id)));

        fields_intersection = Object.values(fields_by_vo_type).reduce(
            // Accumulator shall keep all fields of previous iteration that are also in currentVal
            // And remove the one that are not in currentVal
            (accumulator: Array<ModuleTableField<any>>, currentVal: Array<ModuleTableField<any>>) => {
                return accumulator.filter((field: ModuleTableField<any>) => currentVal.find(
                    (currentField) => currentField.field_id === field.field_id)
                );
            }
        );

        all_distinct_fields = Object.values(fields_by_vo_type).reduce(
            (accumulator: Array<ModuleTableField<any>>, currentVal: Array<ModuleTableField<any>>) => {
                // Accumulator shall keep all distinct fields of each iteration
                return accumulator.concat(
                    currentVal.filter(
                        // Add all fields that are not in accumulator (by field_id)
                        (field: ModuleTableField<any>) => !accumulator.find(
                            (acc_field) => acc_field.field_id === field.field_id
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
    private async build_select_query_not_count_segment(
        context_query: ContextQueryVO,
        access_type: string,
        base_moduletable: ModuleTable<any>,
        base_api_type_id: string,
        is_segmented: boolean = false,
        segmented_value: number = null,
        all_required_fields: Array<ModuleTableField<any>> = null,
    ): Promise<ParameterizedQueryWrapper> {

        if (!base_api_type_id) {
            throw new Error('base_api_type_id is required');
        }

        if (all_required_fields?.length > 0) {
            all_required_fields = cloneDeep(all_required_fields);
        }

        let aliases_n: number = 0;
        let FROM: string = null;

        let query_wrapper: ParameterizedQueryWrapper = new ParameterizedQueryWrapper(null, [], [], {
            [context_query.base_api_type_id]: (context_query.query_tables_prefix ?
                (context_query.query_tables_prefix + '_t' + (aliases_n++)) :
                ('t' + (aliases_n++))
            )
        });

        this.add_activated_many_to_many(context_query);

        /**
         * Cas du segmented table dont la table n'existe pas, donc on select null en somme (c'est pas une erreur en soit, juste il n'y a pas de données)
         *  - mais on peut pas select null, ça génère un résultat non vide, dont le premier élément est une colonne null (dont le nom est ?column?)
         */
        let full_name: string = is_segmented ? base_moduletable.get_segmented_full_name(segmented_value) : base_moduletable.full_name;
        if (!full_name) {
            query_wrapper.query = 'SELECT null';

            return query_wrapper.mark_as_is_segmented_non_existing_table();
        }

        FROM = " FROM " + full_name + " " + query_wrapper.tables_aliases_by_type[context_query.base_api_type_id];

        query_wrapper.joined_tables_by_vo_type[context_query.base_api_type_id] = base_moduletable;

        if (!(context_query.fields?.length > 0)) {

            // if (context_query.query_distinct) {
            //     /**
            //      * Aucun sens en fait de sélectionner des vos distincts
            //      */
            //     throw new Error('Incompatible options:distinct & !fields');
            // }

            context_query.field('id');

            let fields = base_moduletable.get_fields();

            for (const i in fields) {
                const field = fields[i];
                context_query.add_field(field.field_id);
            }

            // Fields which are in the in the all_required_fields
            // But not in moduletable.get_fields()
            const field_ids_to_add: string[] = all_required_fields?.filter(
                (required_field) => !fields.find(
                    (f) => f.field_id === required_field.field_id
                )
            ).map((field) => field.field_id);

            // Set all fields by default
            // Case when base_moduletable does not have field_to_add set select as null
            for (const i in field_ids_to_add) {
                const field_id = field_ids_to_add[i];

                const field_to_add = all_required_fields.find(
                    (field) => field.field_id === field_id
                );

                let cast_with = 'text';

                if (typeof field_to_add?.getPGSqlFieldType === 'function') {
                    cast_with = field_to_add.getPGSqlFieldType();
                }

                context_query.add_field(
                    field_id,
                    null,
                    null,
                    VarConfVO.NO_AGGREGATOR,
                    ContextQueryFieldVO.FIELD_MODIFIER_NULL_IF_NO_COLUMN,
                    cast_with
                );
            }

            // We should order all fields in the same way of the given all_required_fields
            if (all_required_fields?.length > 0) {
                all_required_fields.push({ field_id: '_explicit_api_type_id' } as ModuleTableField<any>);

                // We should also add|specify _explicit_api_type_id field to retrieve it later
                context_query.add_field(
                    '_explicit_api_type_id',
                    null,
                    null,
                    VarConfVO.NO_AGGREGATOR,
                    ContextQueryFieldVO.FIELD_MODIFIER_FIELD_AS_EXPLICIT_API_TYPE_ID,
                );

                // We should order all fields in the same way of the given all_required_fields
                context_query.fields = context_query.fields.sort((field_a: ContextQueryFieldVO, field_b: ContextQueryFieldVO) => {
                    const all_required_field_ids = all_required_fields.map((field) => field.field_id);

                    return all_required_field_ids.indexOf(field_a.field_id) - all_required_field_ids.indexOf(field_b.field_id);
                });
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

            const all_required_field_ids = all_required_fields?.map((field) => field.field_id);

            if (
                (!moduletable) ||
                (
                    (context_field?.field_id != 'id') &&
                    (!moduletable.get_field_by_id(context_field.field_id))
                ) &&
                (
                    // Case when we need all_required_fields (the overflows fields shall be sets as null)
                    (all_required_field_ids?.length > 0) &&
                    (!all_required_field_ids.find((required_field) => required_field === context_field.field_id))
                )
            ) {
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
            if (!query_wrapper.tables_aliases_by_type[context_field.api_type_id]) {

                aliases_n = await this.join_api_type_id(
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

            let parameterizedQueryWrapperField: ParameterizedQueryWrapperField = new ParameterizedQueryWrapperField(
                context_field.api_type_id,
                context_field.field_id,
                context_field.aggregator,
                context_field.alias ?? context_field.field_id
            );

            let field_full_name = query_wrapper.tables_aliases_by_type[context_field.api_type_id] + "." + context_field.field_id;

            if (
                context_field.modifier === ContextQueryFieldVO.FIELD_MODIFIER_FIELD_AS_EXPLICIT_API_TYPE_ID ||
                context_field.modifier === ContextQueryFieldVO.FIELD_MODIFIER_NULL_IF_NO_COLUMN
            ) {
                field_full_name = context_field.field_id;
            }


            let aggregator_prefix = '';
            let aggregator_suffix = '';

            let alias = context_field.alias;

            if (alias == 'label') {
                alias = ContextQueryServerController.INTERNAL_LABEL_REMPLACEMENT;
            }

            let field_alias = (alias ? " as " + alias : '');

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
            SELECT += aggregator_prefix + ContextQueryFieldServerController.getInstance()
                .apply_modifier(context_field, field_full_name) +
                aggregator_suffix +
                field_alias + ' ';

            query_wrapper.fields.push(parameterizedQueryWrapperField);
        }

        /**
         * On join tous les types demandés dans les sorts dans la requête
         */
        for (const i in context_query.sort_by) {
            let sort_by = context_query.sort_by[i];
            let active_api_type_id = sort_by.vo_type;

            if (!active_api_type_id) {
                continue;
            }

            if (query_wrapper.tables_aliases_by_type[active_api_type_id]) {
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
                query_wrapper.jointures,
                query_wrapper.cross_joins,
                query_wrapper.joined_tables_by_vo_type,
                query_wrapper.tables_aliases_by_type,
                access_type
            );
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
            if (query_wrapper.tables_aliases_by_type[active_api_type_id]) {
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
        let WHERE = await this.build_query_wrapper_where_clause(
            context_query,
            query_wrapper,
            aliases_n,
        );

        let GROUP_BY = await this.build_query_wrapper_group_by_clause(
            context_query,
            query_wrapper,
            force_query_distinct
        );

        let { SORT_BY, QUERY: SELECT_QUERY } = await this.build_query_wrapper_sort_by_clause(
            context_query,
            query_wrapper,
            aliases_n,
            access_type,
            SELECT,
        );

        let JOINTURES = this.get_ordered_jointures(context_query, query_wrapper.jointures, query_wrapper.cross_joins);
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
        const QUERY = SELECT_QUERY + FROM + JOINTURES + WHERE + GROUP_BY + SORT_BY + LIMIT;

        return query_wrapper.set_query(QUERY);
    }

    private async build_query_wrapper_where_clause(
        context_query: ContextQueryVO,
        query_wrapper: ParameterizedQueryWrapper,
        aliases_n: number = 0,
    ): Promise<string> {

        let WHERE = '';

        /**
         * C'est là que le fun prend place, on doit créer la requête pour chaque context_filter et combiner tout ensemble
         */
        let where_conditions: string[] = [];

        for (let i in context_query.filters) {
            let context_filter = context_query.filters[i];

            // We should check if the table has the field actually

            aliases_n = await this.updates_jointures_from_filter(
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
            await ContextFilterServerController.getInstance()
                .update_where_conditions(
                    context_query,
                    query_wrapper,
                    where_conditions,
                    context_filter,
                    query_wrapper.tables_aliases_by_type
                );
        }

        let tables_aliases_by_type_for_access_hooks = cloneDeep(query_wrapper.tables_aliases_by_type);
        if (!context_query.is_access_hook_def) {
            /**
             * Check injection : OK
             */
            await this.add_context_access_hooks(context_query, query_wrapper, tables_aliases_by_type_for_access_hooks, where_conditions);
        }

        if (where_conditions?.length > 0) {
            WHERE += ' WHERE (' + where_conditions.join(') AND (') + ')';
        }

        return WHERE;
    }

    private async build_query_wrapper_group_by_clause(
        context_query: ContextQueryVO,
        query_wrapper: ParameterizedQueryWrapper,
        force_query_distinct: boolean,
        access_type: string = null,
    ): Promise<string> {

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

                let alias = context_field.alias;

                if (alias == 'label') {
                    alias = ContextQueryServerController.INTERNAL_LABEL_REMPLACEMENT;
                }

                group_bys.push(alias ?
                    alias :
                    query_wrapper.tables_aliases_by_type[context_field.api_type_id] + '.' + context_field.field_id);
            }

            GROUP_BY += group_bys.join(', ');

            if (GROUP_BY == ' GROUP BY ') {
                GROUP_BY = ' ';
            }
        }

        return GROUP_BY;
    }

    private async build_query_wrapper_sort_by_clause(
        context_query: ContextQueryVO,
        query_wrapper: ParameterizedQueryWrapper,
        aliases_n: number,
        access_type: string,
        QUERY: string,
    ): Promise<{ query_wrapper: ParameterizedQueryWrapper, SORT_BY: string, QUERY: string, aliases_n: number, }> {

        let SORT_BY = '';

        if (context_query.sort_by?.length > 0) {

            let previous_sort_by = SORT_BY;
            let first_sort_by = true;

            SORT_BY += ' ORDER BY ';

            for (let sort_byi in context_query.sort_by) {
                let sort_by = context_query.sort_by[sort_byi];

                if (!first_sort_by) {
                    previous_sort_by = SORT_BY;
                }

                /**
                 * Check injection : context_query.sort_by ok puisqu'on ne l'insère jamais tel quel, mais
                 *  context_query.sort_by.field_id && context_query.sort_by.vo_type doiven²t être testés
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

                        let alias = sort_by.alias;

                        if (alias == 'label') {
                            alias = ContextQueryServerController.INTERNAL_LABEL_REMPLACEMENT;
                        }

                        SORT_BY += modifier_start + alias + modifier_end +
                            (sort_by.sort_asc ? ' ASC ' : ' DESC ');

                    } else {
                        SORT_BY += modifier_start + query_wrapper.tables_aliases_by_type[sort_by.vo_type] + '.' + sort_by.field_id + modifier_end +
                            (sort_by.sort_asc ? ' ASC ' : ' DESC ');
                    }
                } else {

                    let sort_alias = 'sort_alias_' + (ContextQueryServerController.SORT_ALIAS_UID++);

                    SORT_BY += modifier_start + sort_alias + modifier_end + (sort_by.sort_asc ? ' ASC ' : ' DESC ');

                    if (!query_wrapper.tables_aliases_by_type[sort_by.vo_type]) {
                        aliases_n = await this.join_api_type_id(
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
                    if (!!query_wrapper.tables_aliases_by_type[sort_by.vo_type]) {

                        QUERY += `, ${sort_by.sort_asc ? 'MIN' : 'MAX'}` +
                            `(${query_wrapper.tables_aliases_by_type[sort_by.vo_type]}.${sort_by.field_id}) as ` +
                            `${sort_alias}`;

                        let parameterizedQueryWrapperField: ParameterizedQueryWrapperField = new ParameterizedQueryWrapperField(
                            sort_by.vo_type, sort_by.field_id, (sort_by.sort_asc ? VarConfVO.MIN_AGGREGATOR : VarConfVO.MAX_AGGREGATOR), sort_alias);

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
            api_type_id
        );
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
                user = await ModuleAccessPolicyServer.getInstance().getSelfUser();
                user_roles_by_role_id = AccessPolicyServerController.getInstance().getUsersRoles(true, uid);
                user_roles = ObjectHandler.getInstance().hasAtLeastOneAttribute(user_roles_by_role_id) ? Object.values(user_roles_by_role_id) : null;
            }

            let promises = [];
            let hook_cbs = DAOServerController.getInstance().context_access_hooks[vo_type];
            for (let j in hook_cbs) {
                let hook_cb = hook_cbs[j];

                promises.push((async () => {
                    let query_ = await hook_cb(module_table, uid, user, null, user_roles);

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

                let query_wrapper = await this.build_select_query(query_.set_query_distinct());
                if (((!query_wrapper) || (!query_wrapper.query)) && !query_wrapper.is_segmented_non_existing_table) {
                    ConsoleHandler.error('Invalid query:add_context_access_hooks:INFOS context_query:' + (query_wrapper ? (query_wrapper.query ? query_wrapper.is_segmented_non_existing_table : 'NO QUERY') : 'NO QUERY RESULT'));
                    context_query.log(true);
                    throw new Error('Invalid query:add_context_access_hooks');
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
        let forbidden_fields: Array<ModuleTableField<any>> = segmented_table.get_fields().filter(
            (field) => field.field_type == ModuleTableField.FIELD_TYPE_foreign_key
        );

        /**
         * On peut pas référencer une table segmentée donc on s'intéresse que aux liaisons issues de la table segmentée
         */
        for (let i in forbidden_fields) {
            let field = forbidden_fields[i];

            context_query.discard_field_path(forbidden_api_type_id, field.field_id);
        }

        for (let i in filters) {
            let f = filters[i];

            if (f.vo_type == forbidden_api_type_id) {

                /**
                 * Si on est sur un filtre sur une ref de table externe, on traduit le filtre du champs en filtre de l'id de la table ciblée par le lien
                 *  par exemple si on a un filtre de ldf.pdv_id et ldf est segmentée, alors on remplace par un filtre équivalent sur pdv.id
                 */
                //TODO FIXME handle refranges
                let field = VOsTypesManager.moduleTables_by_voType[f.vo_type].getFieldFromId(f.field_id);
                if (field && (field.field_type == ModuleTableField.FIELD_TYPE_foreign_key)) {
                    f.vo_type = field.manyToOne_target_moduletable.vo_type;
                    f.field_id = 'id';
                } else {
                    continue;
                }
            }

            context_query.add_filters([f]);
        }

        return context_query;
    }
}
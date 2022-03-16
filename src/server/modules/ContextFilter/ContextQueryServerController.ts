import ContextFilterHandler from '../../../shared/modules/ContextFilter/ContextFilterHandler';
import ContextFilterVO from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryVO from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import DataFilterOption from '../../../shared/modules/DataRender/vos/DataFilterOption';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../shared/modules/ModuleTable';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ContextAccessServerController from './ContextAccessServerController';
import ContextFieldPathServerController from './ContextFieldPathServerController';
import ContextFilterServerController from './ContextFilterServerController';
import ContextQueryFieldServerController from './ContextQueryFieldServerController';
import FieldPathWrapper from './vos/FieldPathWrapper';
import moment = require('moment');
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import DAOServerController from '../DAO/DAOServerController';
import StackContext from '../../StackContext';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import ServerBase from '../../ServerBase';
import IUserData from '../../../shared/modules/DAO/interface/IUserData';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import { cloneDeep } from 'lodash';

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
     * Compter les résultats
     * @param context_query description de la requête, sans fields si on compte les vos, avec fields si on veut un datatable
     */
    public async select_count(context_query: ContextQueryVO): Promise<number> {

        let query_str = await this.build_query_count(context_query);

        if (!query_str) {
            throw new Error('Invalid context_query param');
        }

        let query_res = await ModuleDAOServer.getInstance().query(query_str);
        let c = (query_res && (query_res.length == 1) && (typeof query_res[0]['c'] != 'undefined') && (query_res[0]['c'] !== null)) ? query_res[0]['c'] : null;
        c = c ? parseInt(c.toString()) : 0;
        return c;
    }

    /**
     * Filtrer des vos avec les context filters
     * @param context_query le champs fields doit être null pour demander des vos complets
     */
    public async select_vos<T extends IDistantVOBase>(context_query: ContextQueryVO): Promise<T[]> {

        if (!context_query) {
            throw new Error('Invalid context_query param');
        }

        if (context_query.fields && context_query.fields.length) {
            throw new Error('Invalid context_query.fields param');
        }

        let query = await this.build_select_query(context_query);
        if (!query) {
            throw new Error('Invalid query');
        }

        let query_res = await ModuleDAOServer.getInstance().query();
        if ((!query_res) || (!query_res.length)) {
            return null;
        }

        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[context_query.base_api_type_id];

        // On devrait plus avoir besoin de faire ça ici, on doit le faire dans la requête directement et sur tous les types rencontrés
        // return await ModuleDAOServer.getInstance().filterVOsAccess(moduletable, ModuleDAO.DAO_ACCESS_TYPE_READ, moduletable.forceNumerics(query_res));

        return moduletable.forceNumerics(query_res);
    }

    /**
     * Filtrer des infos avec les context filters, en indiquant obligatoirement les champs ciblés, qui peuvent appartenir à des tables différentes
     * @param context_query le champs fields doit être rempli avec les champs ciblés par la requête (et avec les alias voulus)
     */
    public async select_datatable_rows(context_query: ContextQueryVO): Promise<any[]> {

        if (!context_query) {
            throw new Error('Invalid context_query param');
        }

        if ((!context_query.fields) || !context_query.fields.length) {
            throw new Error('Invalid context_query.fields param');
        }

        let query = await this.build_select_query(context_query);
        if (!query) {
            throw new Error('Invalid query');
        }

        let query_res = await ModuleDAOServer.getInstance().query();
        if ((!query_res) || (!query_res.length)) {
            return null;
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
            delete get_active_field_filters[field.api_type_id][field.field_id];
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

        for (let i in query_res) {
            let res_field = query_res[i];
            let line_option = ContextQueryFieldServerController.getInstance().translate_db_res_to_dataoption(field, res_field);

            if (line_option) {
                res.push(line_option);
            }
        }

        return res;
    }

    /**
     * Construit la requête pour un select count(*) from context_filters
     */
    public async build_query_count(context_query: ContextQueryVO): Promise<string> {

        if (!context_query) {
            throw new Error('Invalid context_query param');
        }

        let query = await this.build_select_query(context_query);
        if (!query) {
            throw new Error('Invalid query');
        }

        query = 'SELECT COUNT(*) c FROM (' +
            query +
            ') as tocount';

        return query;
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
        if (context_query.limit || context_query.offset || context_query.sort_by) {
            throw new Error('Invalid context_query param');
        }

        /**
         * On se fixe des paquets de 100 vos à updater
         * et on sort by id desc pour éviter que l'ordre change pendant le process
         * au pire si on a des nouvelles lignes, elles nous forcerons à remodifier des lignes déjà updatées. probablement pas très grave
         */
        context_query.offset = 0;
        context_query.limit = 100;
        let might_have_more: boolean = true;
        context_query.sort_by = new SortByVO(context_query.base_api_type_id, 'id', false);
        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[context_query.base_api_type_id];
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
                await ModuleDAO.getInstance().insertOrUpdateVOs(vos);

                might_have_more = (vos.length >= context_query.limit);
                context_query.offset += change_offset ? context_query.limit : 0;
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
        if (context_query.limit || context_query.offset || context_query.sort_by) {
            throw new Error('Invalid context_query param');
        }

        /**
         * On se fixe des paquets de 100 vos à delete
         */
        context_query.offset = 0;
        context_query.limit = 100;
        let might_have_more: boolean = true;

        while (might_have_more) {

            let vos = await this.select_vos(context_query);

            if ((!vos) || (!vos.length)) {
                break;
            }

            await ModuleDAO.getInstance().deleteVOs(vos);

            might_have_more = (vos.length >= context_query.limit);
        }
    }

    /**
     * Fonction qui génère la requête select demandée, que ce soit sur les vos directement ou
     *  sur les fields passées dans le context_query
     */
    public async build_select_query(context_query: ContextQueryVO): Promise<string> {

        if (!context_query) {
            throw new Error('Invalid query param');
        }

        let access_type: string = ModuleDAO.DAO_ACCESS_TYPE_READ;

        let res: string = null;
        let FROM: string = null;

        try {

            /**
             * Par mesure de sécu on check que les éléments proposés existent en base
             */
            if (!context_query.base_api_type_id) {
                return null;
            }

            if (!ContextAccessServerController.getInstance().check_access_to_api_type_ids_field_ids(context_query.base_api_type_id, context_query.fields, access_type)) {
                return null;
            }

            let aliases_n: number = 0;
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
            let joined_tables_by_vo_type: { [vo_type: string]: ModuleTable<any> } = {};

            this.add_activated_many_to_many(context_query);

            let base_moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[context_query.base_api_type_id];

            if (!base_moduletable) {
                return null;
            }

            let full_name = await ContextFilterServerController.getInstance().get_table_full_name(base_moduletable, context_query.filters);
            FROM = " FROM " + full_name + " " + tables_aliases_by_type[context_query.base_api_type_id];
            joined_tables_by_vo_type[context_query.base_api_type_id] = base_moduletable;

            if (!context_query.fields) {
                res = "SELECT " + tables_aliases_by_type[context_query.base_api_type_id] + ".* ";
            } else {

                res = "SELECT DISTINCT ";
                let first = true;

                for (let i in context_query.fields) {
                    let context_field = context_query.fields[i];

                    let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[context_field.api_type_id];
                    if ((!moduletable) || ((!!context_field.field_id) && (context_field.field_id != 'id') && (!moduletable.get_field_by_id(context_field.field_id)))) {
                        return null;
                    }

                    /**
                     * Si on découvre, et qu'on est pas sur la première table, on passe sur un join à mettre en place
                     */
                    if (!tables_aliases_by_type[context_field.api_type_id]) {

                        /**
                         * On doit identifier le chemin le plus court pour rejoindre les 2 types de données
                         */
                        let path: FieldPathWrapper[] = ContextFieldPathServerController.getInstance().get_path_between_types(
                            context_query.active_api_type_ids, Object.keys(joined_tables_by_vo_type), context_field.api_type_id);
                        if (!path) {
                            // pas d'impact de ce filtrage puisqu'on a pas de chemin jusqu'au type cible
                            continue;
                        }

                        /**
                         * On doit checker le trajet complet
                         */
                        if (!ContextAccessServerController.getInstance().check_access_to_fields(path, access_type)) {
                            return null;
                        }

                        aliases_n = await ContextFilterServerController.getInstance().updates_jointures(
                            jointures, context_field.api_type_id, context_query.filters, joined_tables_by_vo_type, tables_aliases_by_type, path, aliases_n);
                        // joined_tables_by_vo_type[api_type_id_i] = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id_i];
                    }

                    if (!first) {
                        res += ', ';
                    }
                    first = false;

                    res += tables_aliases_by_type[context_field.api_type_id] + "." + context_field.field_id +
                        (context_field.alias ? " as " + context_field.alias : '') + ' ';
                }
            }

            res += FROM;

            /**
             * C'est là que le fun prend place, on doit créer la requête pour chaque context_filter et combiner tout ensemble
             */
            let where_conditions: string[] = [];

            for (let i in context_query.filters) {
                let filter = context_query.filters[i];

                if (!filter) {
                    continue;
                }

                if (filter.vo_type && (filter.vo_type != context_query.base_api_type_id) && !joined_tables_by_vo_type[filter.vo_type]) {

                    /**
                     * On doit identifier le chemin le plus court pour rejoindre les 2 types de données
                     */
                    let path: FieldPathWrapper[] = ContextFieldPathServerController.getInstance().get_path_between_types(
                        context_query.active_api_type_ids, Object.keys(tables_aliases_by_type), filter.vo_type);
                    if (!path) {
                        // pas d'impact de ce filtrage puisqu'on a pas de chemin jusqu'au type cible
                        continue;
                    }
                    aliases_n = await ContextFilterServerController.getInstance().updates_jointures(
                        jointures, context_query.base_api_type_id, context_query.filters, joined_tables_by_vo_type, tables_aliases_by_type, path, aliases_n);
                    // joined_tables_by_vo_type[api_type_id_i] = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id_i];
                }

                await ContextFilterServerController.getInstance().update_where_conditions(where_conditions, filter, tables_aliases_by_type);
            }

            res += this.get_ordered_jointures(context_query, jointures);

            let tables_aliases_by_type_for_access_hooks = cloneDeep(tables_aliases_by_type);
            if (context_query.is_access_hook_def) {
                delete tables_aliases_by_type_for_access_hooks[context_query.base_api_type_id];
            }
            await this.add_context_access_hooks(context_query, tables_aliases_by_type_for_access_hooks, where_conditions);

            if (where_conditions && where_conditions.length) {
                res += ' WHERE (' + where_conditions.join(') AND (') + ')';
            }

            if (context_query.sort_by) {

                res += ' ORDER BY ' + tables_aliases_by_type[context_query.sort_by.vo_type] + '.' + context_query.sort_by.field_id +
                    (context_query.sort_by.sort_asc ? ' ASC ' : ' DESC ');
            }

            res = this.add_limit(context_query, res);

            return res;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            return null;
        }
    }

    /**
     * On prend tous les types utilisés pour réaliser la requête (donc référencés dans tables_aliases_by_type)
     *  et pour chacun si on a un context_access_hook on rajoute la condition associée à la requête
     * @param context_query le contexte de requête actuel
     * @param tables_aliases_by_type les tables utilisées et donc à vérifier
     * @param where_conditions les conditions actuelles et que l'on va amender
     */
    private async add_context_access_hooks(context_query: ContextQueryVO, tables_aliases_by_type: { [vo_type: string]: string }, where_conditions: string[]) {

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
            let module_table = VOsTypesManager.getInstance().moduleTables_by_voType[vo_type];

            if (!loaded) {
                loaded = true;
                uid = StackContext.getInstance().get('UID');
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
                    let query = await hook_cb(module_table, uid, user, user_data, user_roles);

                    if (!query) {
                        return;
                    }

                    if (!context_access_hooks[alias]) {
                        context_access_hooks[alias] = [];
                    }
                    context_access_hooks[alias].push(query);
                })());
            }

            await Promise.all(promises);
        }

        for (let alias in context_access_hooks) {
            let querys = context_access_hooks[alias];

            for (let j in querys) {
                let query = querys[j];

                where_conditions.push(alias + '.id in (' + await this.build_select_query(query) + ')');
            }
        }
    }

    /**
     * Ordonner les jointures, pour ne pas référencer des aliases pas encore déclarés
     */
    private get_ordered_jointures(context_query: ContextQueryVO, jointures: string[]): string {
        let res = '';

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

        let nn_tables = VOsTypesManager.getInstance().get_manyToManyModuleTables();
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

    private add_limit(context_query: ContextQueryVO, query_str: string): string {

        if ((!query_str) || (!context_query)) {
            return query_str;
        }

        if (context_query.limit) {
            query_str += ' LIMIT ' + context_query.limit;

            if (context_query.offset) {
                query_str += ' OFFSET ' + context_query.offset;
            }
        }

        return query_str;
    }
}
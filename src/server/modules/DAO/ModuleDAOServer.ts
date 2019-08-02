import { Moment } from 'moment';
import INamedVO from '../../../shared/interfaces/INamedVO';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import RolePolicyVO from '../../../shared/modules/AccessPolicy/vos/RolePolicyVO';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserRoleVO from '../../../shared/modules/AccessPolicy/vos/UserRoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import StringParamVO from '../../../shared/modules/API/vos/apis/StringParamVO';
import { IHookFilterVos } from '../../../shared/modules/DAO/interface/IHookFilterVos';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import APIDAOIdsRangesParamsVO from '../../../shared/modules/DAO/vos/APIDAOIdsRangesParamsVO';
import APIDAONamedParamVO from '../../../shared/modules/DAO/vos/APIDAONamedParamVO';
import APIDAOParamsVO from '../../../shared/modules/DAO/vos/APIDAOParamsVO';
import APIDAOParamVO from '../../../shared/modules/DAO/vos/APIDAOParamVO';
import APIDAORangesParamsVO from '../../../shared/modules/DAO/vos/APIDAORangesParamsVO';
import APIDAORefFieldParamsVO from '../../../shared/modules/DAO/vos/APIDAORefFieldParamsVO';
import APIDAORefFieldsAndFieldsStringParamsVO from '../../../shared/modules/DAO/vos/APIDAORefFieldsAndFieldsStringParamsVO';
import APIDAORefFieldsParamsVO from '../../../shared/modules/DAO/vos/APIDAORefFieldsParamsVO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import FieldRange from '../../../shared/modules/DataRender/vos/FieldRange';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import BooleanHandler from '../../../shared/tools/BooleanHandler';
import DateHandler from '../../../shared/tools/DateHandler';
import ConfigurationService from '../../env/ConfigurationService';
import ServerBase from '../../ServerBase';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModuleServiceBase from '../ModuleServiceBase';
import ModulesManagerServer from '../ModulesManagerServer';
import DAOTriggerHook from './triggers/DAOTriggerHook';
import ModuleVO from '../../../shared/modules/ModuleVO';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import IRange from '../../../shared/modules/DataRender/interfaces/IRange';
import RangeHandler from '../../../shared/tools/RangeHandler';
import APIDAOApiTypeAndMatroidsParamsVO from '../../../shared/modules/DAO/vos/APIDAOApiTypeAndMatroidsParamsVO';
import APIDAOApiTypeAndFieldRangesParamsVO from '../../../shared/modules/DAO/vos/APIDAOApiTypeAndFieldRangesParamsVO';
import IMatroid from '../../../shared/modules/Matroid/interfaces/IMatroid';

export default class ModuleDAOServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleDAOServer.instance) {
            ModuleDAOServer.instance = new ModuleDAOServer();
        }
        return ModuleDAOServer.instance;
    }

    private static instance: ModuleDAOServer = null;

    // On expose des hooks pour les modules qui veulent gérer le filtrage des vos suivant l'utilisateur connecté
    private access_hooks: { [api_type_id: string]: { [access_type: string]: IHookFilterVos<IDistantVOBase> } } = {};

    // private pre_read_trigger_hook: DAOTriggerHook;
    private pre_update_trigger_hook: DAOTriggerHook;
    private pre_create_trigger_hook: DAOTriggerHook;
    private pre_delete_trigger_hook: DAOTriggerHook;

    // private post_read_trigger_hook: DAOTriggerHook;
    private post_update_trigger_hook: DAOTriggerHook;
    private post_create_trigger_hook: DAOTriggerHook;
    // private post_delete_trigger_hook: DAOTriggerHook;

    private constructor() {
        super(ModuleDAO.getInstance().name);
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group_overall: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group_overall.translatable_name = ModuleDAO.POLICY_GROUP_OVERALL;
        group_overall = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group_overall, new DefaultTranslation({
            fr: '!!! Accès à toutes les tables'
        }));

        let group_datas: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group_datas.translatable_name = ModuleDAO.POLICY_GROUP_DATAS;
        group_datas = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group_datas, new DefaultTranslation({
            fr: 'Données'
        }));

        let group_modules_conf: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group_modules_conf.translatable_name = ModuleDAO.POLICY_GROUP_MODULES_CONF;
        group_modules_conf = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group_modules_conf, new DefaultTranslation({
            fr: 'Paramètres des modules'
        }));

        // On déclare un droit global d'accès qui déclenche tous les autres
        let global_access: AccessPolicyVO = new AccessPolicyVO();
        global_access.group_id = group_overall.id;
        global_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        global_access.translatable_name = ModuleDAO.POLICY_GROUP_OVERALL + '.' + ModuleDAO.DAO_ACCESS_TYPE_LIST_LABELS + "." + "___GLOBAL_ACCESS___";
        global_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(global_access, new DefaultTranslation({
            fr: 'Outrepasser les droits d\'accès'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        // On doit déclarer les access policies de tous les VO
        let lang: LangVO = await ModuleTranslation.getInstance().getLang(DefaultTranslation.DEFAULT_LANG_DEFAULT_TRANSLATION);
        for (let i in VOsTypesManager.getInstance().moduleTables_by_voType) {
            let moduleTable: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[i];
            let vo_type: string = moduleTable.vo_type;

            // Uniquement si le module est actif, mais là encore est-ce une erreur ? ...
            if (moduleTable.module && !moduleTable.module.actif) {
                continue;
            }

            // On a besoin de la trad de ce vo_type, si possible celle en base, sinon celle en default translation si elle existe, sinon on reste sur le vo_type
            let vo_translation: string = vo_type;
            let vo_type_translatable_code: string = VOsTypesManager.getInstance().moduleTables_by_voType[vo_type].label ? VOsTypesManager.getInstance().moduleTables_by_voType[vo_type].label.code_text : null;
            let translatable: TranslatableTextVO = vo_type_translatable_code ? await ModuleTranslation.getInstance().getTranslatableText(vo_type_translatable_code) : null;
            let translation_from_bdd: TranslationVO = (lang && translatable) ? await ModuleTranslation.getInstance().getTranslation(lang.id, translatable.id) : null;
            if (translation_from_bdd && (translation_from_bdd.translated != "")) {
                vo_translation = translation_from_bdd.translated;
            } else {
                if (DefaultTranslationManager.getInstance().registered_default_translations[vo_type_translatable_code]) {
                    let default_translation: string = DefaultTranslationManager.getInstance().registered_default_translations[vo_type_translatable_code].default_translations[DefaultTranslation.DEFAULT_LANG_DEFAULT_TRANSLATION];
                    vo_translation = (default_translation && (default_translation != "")) ? default_translation : vo_translation;
                }
            }

            // Si on lit les droits, on peut tout lire, mais pas modifier évidemment
            let isAccessConfVoType: boolean = false;
            if ((vo_type == AccessPolicyVO.API_TYPE_ID) ||
                (vo_type == RolePolicyVO.API_TYPE_ID) ||
                (vo_type == RoleVO.API_TYPE_ID) ||
                (vo_type == PolicyDependencyVO.API_TYPE_ID) ||
                (vo_type == AccessPolicyGroupVO.API_TYPE_ID) ||
                (vo_type == UserRoleVO.API_TYPE_ID)) {
                isAccessConfVoType = true;
            }

            let group = moduleTable.isModuleParamTable ? group_modules_conf : group_datas;

            // On déclare les 4 policies et leurs dépendances
            let vo_list: AccessPolicyVO = new AccessPolicyVO();
            vo_list.group_id = group.id;
            vo_list.default_behaviour = isAccessConfVoType ? AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE : AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
            vo_list.translatable_name = ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_LIST_LABELS, vo_type);
            vo_list = await ModuleAccessPolicyServer.getInstance().registerPolicy(
                vo_list,
                (vo_translation && (vo_translation != "")) ? new DefaultTranslation({ fr: 'Lister les données de type "' + vo_translation + '"' }) : null,
                await ModulesManagerServer.getInstance().getModuleVOByName(moduleTable.module ? moduleTable.module.name : null));
            let global_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
            global_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED;
            global_access_dependency.src_pol_id = vo_list.id;
            global_access_dependency.depends_on_pol_id = global_access.id;
            global_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(global_access_dependency);


            let vo_read: AccessPolicyVO = new AccessPolicyVO();
            vo_read.group_id = group.id;
            vo_read.default_behaviour = isAccessConfVoType ? AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE : AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
            vo_read.translatable_name = ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, vo_type);
            vo_read = await ModuleAccessPolicyServer.getInstance().registerPolicy(
                vo_read,
                (vo_translation && (vo_translation != "")) ? new DefaultTranslation({ fr: 'Consulter les données de type "' + vo_translation + '"' }) : null,
                await ModulesManagerServer.getInstance().getModuleVOByName(moduleTable.module ? moduleTable.module.name : null));
            let dependency: PolicyDependencyVO = new PolicyDependencyVO();
            dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
            dependency.src_pol_id = vo_read.id;
            dependency.depends_on_pol_id = vo_list.id;
            dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(dependency);
            global_access_dependency = new PolicyDependencyVO();
            global_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED;
            global_access_dependency.src_pol_id = vo_read.id;
            global_access_dependency.depends_on_pol_id = global_access.id;
            global_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(global_access_dependency);

            let vo_insert_or_update: AccessPolicyVO = new AccessPolicyVO();
            vo_insert_or_update.group_id = group.id;
            vo_insert_or_update.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
            vo_insert_or_update.translatable_name = ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, vo_type);
            vo_insert_or_update = await ModuleAccessPolicyServer.getInstance().registerPolicy(
                vo_insert_or_update,
                (vo_translation && (vo_translation != "")) ? new DefaultTranslation({ fr: 'Ajouter ou modifier des données de type "' + vo_translation + '"' }) : null,
                await ModulesManagerServer.getInstance().getModuleVOByName(moduleTable.module ? moduleTable.module.name : null));
            dependency = new PolicyDependencyVO();
            dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
            dependency.src_pol_id = vo_insert_or_update.id;
            dependency.depends_on_pol_id = vo_read.id;
            dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(dependency);
            global_access_dependency = new PolicyDependencyVO();
            global_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED;
            global_access_dependency.src_pol_id = vo_insert_or_update.id;
            global_access_dependency.depends_on_pol_id = global_access.id;
            global_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(global_access_dependency);

            let vo_delete: AccessPolicyVO = new AccessPolicyVO();
            vo_delete.group_id = group.id;
            vo_delete.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
            vo_delete.translatable_name = ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_DELETE, vo_type);
            vo_delete = await ModuleAccessPolicyServer.getInstance().registerPolicy(
                vo_delete,
                (vo_translation && (vo_translation != "")) ? new DefaultTranslation({ fr: 'Supprimer des données de type "' + vo_translation + '"' }) : null,
                await ModulesManagerServer.getInstance().getModuleVOByName(moduleTable.module ? moduleTable.module.name : null));
            dependency = new PolicyDependencyVO();
            dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
            dependency.src_pol_id = vo_delete.id;
            dependency.depends_on_pol_id = vo_read.id;
            dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(dependency);
            global_access_dependency = new PolicyDependencyVO();
            global_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED;
            global_access_dependency.src_pol_id = vo_delete.id;
            global_access_dependency.depends_on_pol_id = global_access.id;
            global_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(global_access_dependency);
        }
    }

    public async configure() {
        // this.pre_read_trigger_hook = new DAOTriggerHook(DAOTriggerHook.DAO_PRE_READ_TRIGGER);
        this.pre_update_trigger_hook = new DAOTriggerHook(DAOTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        ModuleTrigger.getInstance().registerTriggerHook(this.pre_update_trigger_hook);
        this.pre_create_trigger_hook = new DAOTriggerHook(DAOTriggerHook.DAO_PRE_CREATE_TRIGGER);
        ModuleTrigger.getInstance().registerTriggerHook(this.pre_create_trigger_hook);
        this.pre_delete_trigger_hook = new DAOTriggerHook(DAOTriggerHook.DAO_PRE_DELETE_TRIGGER);
        ModuleTrigger.getInstance().registerTriggerHook(this.pre_delete_trigger_hook);

        // this.post_read_trigger_hook = new DAOTriggerHook(DAOTriggerHook.DAO_POST_READ_TRIGGER);

        this.post_update_trigger_hook = new DAOTriggerHook(DAOTriggerHook.DAO_POST_UPDATE_TRIGGER);
        ModuleTrigger.getInstance().registerTriggerHook(this.post_update_trigger_hook);
        this.post_create_trigger_hook = new DAOTriggerHook(DAOTriggerHook.DAO_POST_CREATE_TRIGGER);
        ModuleTrigger.getInstance().registerTriggerHook(this.post_create_trigger_hook);
        // this.post_delete_trigger_hook = new DAOTriggerHook(DAOTriggerHook.DAO_POST_DELETE_TRIGGER);
        // ModuleTrigger.getInstance().registerTriggerHook(this.post_delete_trigger_hook);
    }

    public registerAccessHook<T extends IDistantVOBase>(API_TYPE_ID: string, access_type: string, hook: IHookFilterVos<T>) {
        if (!this.access_hooks[API_TYPE_ID]) {
            this.access_hooks[API_TYPE_ID] = {};
        }
        this.access_hooks[API_TYPE_ID][access_type] = hook;
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_DELETE_VOS, this.deleteVOs.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_INSERT_OR_UPDATE_VOS, this.insertOrUpdateVOs.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_INSERT_OR_UPDATE_VO, this.insertOrUpdateVO.bind(this));

        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_GET_VO_BY_ID, this.getVoById.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_GET_VOS, this.getVos.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_GET_VOS_BY_IDS, this.getVosByIds.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_GET_VOS_BY_IDS_RANGES, this.getVosByIdsRanges.bind(this));

        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_FILTER_VOS_BY_FIELD_RANGES, this.filterVosByFieldRanges.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_FILTER_VOS_BY_FIELD_RANGES_INTERSECTIONS, this.filterVosByFieldRangesIntersections.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_GET_VOS_BY_EXACT_FIELD_RANGE, this.getVosByExactFieldRange.bind(this));

        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_FILTER_VOS_BY_MATROIDS, this.filterVosByMatroids.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_FILTER_VOS_BY_MATROIDS_INTERSECTIONS, this.filterVosByMatroidsIntersections.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_GET_VOS_BY_EXACT_MATROIDS, this.getVosByExactMatroid.bind(this));

        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_GET_VOS_BY_REFFIELD_IDS, this.getVosByRefFieldIds.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_GET_VOS_BY_REFFIELDS_IDS, this.getVosByRefFieldsIds.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_GET_VOS_BY_REFFIELDS_IDS_AND_FIELDS_STRING, this.getVosByRefFieldsIdsAndFieldsString.bind(this));

        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_GET_NAMED_VO_BY_NAME, this.getNamedVoByName.bind(this));

        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_GET_BASE_URL, this.getBaseUrl.bind(this));
    }

    public async truncate(api_type_id: string) {
        let datatable: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];

        if (!datatable) {
            console.error("Impossible de trouver le datatable ! " + api_type_id);
            return null;
        }

        await ModuleServiceBase.getInstance().db.none("TRUNCATE " + datatable.full_name + ";");
    }


    public async selectAll<T extends IDistantVOBase>(API_TYPE_ID: string, query: string = null, queryParams: any[] = null, depends_on_api_type_ids: string[] = null): Promise<T[]> {
        let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[API_TYPE_ID];

        // On vérifie qu'on peut faire un select
        if (!await this.checkAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        let res: T[] = datatable.forceNumerics(await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + datatable.full_name + " t " + (query ? query : ''), queryParams ? queryParams : []) as T[]);

        // On filtre les res suivant les droits d'accès
        return await this.filterVOsAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ, res);
    }

    public async selectOne<T extends IDistantVOBase>(API_TYPE_ID: string, query: string = null, queryParams: any[] = null, depends_on_api_type_ids: string[] = null): Promise<T> {
        let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[API_TYPE_ID];

        // On vérifie qu'on peut faire un select
        if (!await this.checkAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        let vo: T = datatable.forceNumeric(await ModuleServiceBase.getInstance().db.oneOrNone("SELECT t.* FROM " + datatable.full_name + " t " + (query ? query : '') + ";", queryParams ? queryParams : []) as T);

        // On filtre suivant les droits d'accès
        return await this.filterVOAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ, vo);
    }

    /**
     * DONT USE : N'utiliser que en cas de force majeure => exemple upgrade de format de BDD
     * @param query
     */
    public async query(query: string = null): Promise<any> {

        // On vérifie qu'on peut faire des modifs de table modules
        if (!await this.checkAccess(VOsTypesManager.getInstance().moduleTables_by_voType[ModuleVO.API_TYPE_ID], ModuleDAO.DAO_ACCESS_TYPE_DELETE)) {
            return null;
        }

        return await ModuleServiceBase.getInstance().db.query(query);
    }

    /**
     * Cas très spécifique de la connexion où l'on a évidemment pas le droit de lister les comptes, mais il faut tout de même pouvoir se connecter...
     */
    public async selectOneUser(login: string, password: string): Promise<UserVO> {
        let datatable: ModuleTable<UserVO> = VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID];

        let vo: UserVO = datatable.forceNumeric(await ModuleServiceBase.getInstance().db.oneOrNone("SELECT t.* FROM " + datatable.full_name + " t " + "WHERE (name = $1 OR email = $1) AND password = crypt($2, password)", [login, password]) as UserVO);
        return vo;
    }

    private async insertOrUpdateVOs(vos: IDistantVOBase[]): Promise<InsertOrDeleteQueryResult[]> {

        // On vérifie qu'on peut faire un insert ou update
        if ((!vos) || (!vos.length) || (!vos[0]) || (!vos[0]._type) || (!VOsTypesManager.getInstance().moduleTables_by_voType[vos[0]._type])) {
            return null;
        }
        if (!await this.checkAccess(VOsTypesManager.getInstance().moduleTables_by_voType[vos[0]._type], ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE)) {
            return null;
        }

        return new Promise<InsertOrDeleteQueryResult[]>(async (resolve, reject) => {

            let isUpdates: boolean[] = [];
            let results: InsertOrDeleteQueryResult[] = await ModuleServiceBase.getInstance().db.tx(async (t) => {

                let queries: any[] = [];

                for (let i in vos) {
                    let vo: IDistantVOBase = vos[i];

                    let moduleTable: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[vo._type];

                    if (!moduleTable) {
                        return null;
                    }

                    isUpdates[i] = vo.id ? true : false;
                    let sql: string = await this.getqueryfor_insertOrUpdateVO(vo);

                    if (!sql) {
                        continue;
                    }

                    queries.push(t.oneOrNone(sql, moduleTable.get_bdd_version(vo)));
                }

                return t.batch(queries);
            }).catch((reason) => {
                resolve(null);
            });

            if (results && isUpdates && (isUpdates.length == results.length) && vos && (vos.length == results.length)) {
                for (let i in results) {

                    if (isUpdates[i]) {
                        await this.post_update_trigger_hook.trigger(vos[i]._type, vos[i]);
                    } else {
                        vos[i].id = parseInt(results[i].id.toString());
                        await this.post_create_trigger_hook.trigger(vos[i]._type, vos[i]);
                    }
                }
            }

            resolve(results);
        });
    }

    private async insertOrUpdateVO(vo: IDistantVOBase): Promise<InsertOrDeleteQueryResult> {

        // On vérifie qu'on peut faire un insert ou update
        if ((!vo) || (!vo._type) || (!VOsTypesManager.getInstance().moduleTables_by_voType[vo._type])) {
            return null;
        }
        if (!await this.checkAccess(VOsTypesManager.getInstance().moduleTables_by_voType[vo._type], ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE)) {
            return null;
        }

        return new Promise<InsertOrDeleteQueryResult>(async (resolve, reject) => {

            let isUpdate: boolean = vo.id ? true : false;

            let moduleTable: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[vo._type];

            if (!moduleTable) {
                return null;
            }

            let sql: string = await this.getqueryfor_insertOrUpdateVO(vo);

            if (!sql) {
                resolve(null);
            }

            let result: InsertOrDeleteQueryResult = await ModuleServiceBase.getInstance().db.oneOrNone(sql, moduleTable.get_bdd_version(vo)).catch((reason) => {
                resolve(null);
            });

            if (result && vo) {
                if (isUpdate) {
                    await this.post_update_trigger_hook.trigger(vo._type, vo);
                } else {
                    vo.id = parseInt(result.id.toString());
                    await this.post_create_trigger_hook.trigger(vo._type, vo);
                }
            }

            resolve(result);
        });
    }

    private async deleteVOs(vos: IDistantVOBase[]): Promise<any[]> {

        // On vérifie qu'on peut faire un delete
        if ((!vos) || (!vos.length) || (!vos[0]) || (!vos[0]._type) || (!VOsTypesManager.getInstance().moduleTables_by_voType[vos[0]._type])) {
            return null;
        }
        if (!await this.checkAccess(VOsTypesManager.getInstance().moduleTables_by_voType[vos[0]._type], ModuleDAO.DAO_ACCESS_TYPE_DELETE)) {
            return null;
        }

        let results: any[] = await ModuleServiceBase.getInstance().db.tx(async (t) => {

            let queries: any[] = [];

            for (let i in vos) {
                let vo = vos[i];

                if (!vo._type) {
                    console.error("Un VO sans _type dans le DAO ! " + JSON.stringify(vo));
                    continue;
                }

                let datatable: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[vo._type];

                if (!datatable) {
                    console.error("Impossible de trouver le datatable de ce _type ! " + JSON.stringify(vo));
                    continue;
                }

                // Ajout des triggers, avant et après suppression.
                //  Attention si un des output est false avant suppression, on annule la suppression
                let res: boolean[] = await this.pre_delete_trigger_hook.trigger(vo._type, vo);
                if (!BooleanHandler.getInstance().AND(res, true)) {
                    continue;
                }

                const sql = "DELETE FROM " + datatable.full_name + " where id = ${id} RETURNING id";
                queries.push(t.oneOrNone(sql, vo)/*posttrigger pas si simple : .then(async (data) => {
                    await this.post_delete_trigger_hook.trigger(vo._type, vo);
                })*/);
            }

            return t.batch(queries);
        });

        return results;
    }

    private async getqueryfor_insertOrUpdateVO(vo: IDistantVOBase): Promise<string> {

        if (!vo._type) {
            console.error("Un VO sans _type dans le DAO ! " + JSON.stringify(vo));
            return null;
        }

        let datatable: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[vo._type];

        if (!datatable) {
            console.error("Impossible de trouver le datatable de ce _type ! " + JSON.stringify(vo));
            return null;
        }

        let sql: string = null;

        if (vo.id) {

            // Ajout des triggers, avant et après modification.
            //  Attention si un des output est false avant modification, on annule la modification
            let res: boolean[] = await this.pre_update_trigger_hook.trigger(vo._type, vo);
            if (!BooleanHandler.getInstance().AND(res, true)) {
                return null;
            }

            const setters = [];
            for (const f in datatable.fields) {

                if (typeof vo[datatable.fields[f].field_id] == "undefined") {
                    continue;
                }

                setters.push(datatable.fields[f].field_id + ' = ${' + datatable.fields[f].field_id + '}');
            }

            sql = "UPDATE " + datatable.full_name + " SET " + setters.join(', ') + " WHERE id = ${id} RETURNING ID";

        } else {

            // Ajout des triggers, avant et après modification.
            //  Attention si un des output est false avant modification, on annule la modification
            let res: boolean[] = await this.pre_create_trigger_hook.trigger(vo._type, vo);
            if (!BooleanHandler.getInstance().AND(res, true)) {
                return null;
            }

            const tableFields = [];
            const placeHolders = [];
            for (const f in datatable.fields) {
                if (typeof vo[datatable.fields[f].field_id] == "undefined") {
                    continue;
                }

                tableFields.push(datatable.fields[f].field_id);
                placeHolders.push('${' + datatable.fields[f].field_id + '}');
            }

            sql = "INSERT INTO " + datatable.full_name + " (" + tableFields.join(', ') + ") VALUES (" + placeHolders.join(', ') + ") RETURNING id";
        }

        return sql;
    }

    private async checkAccess<T extends IDistantVOBase>(datatable: ModuleTable<T>, access_type: string): Promise<boolean> {

        if (!ModuleAccessPolicy.getInstance().actif) {
            return true;
        }

        // On applique les accès au global sur le droit de faire un SELECT
        return await ModuleAccessPolicy.getInstance().checkAccess(ModuleDAO.getInstance().getAccessPolicyName(access_type, datatable.vo_type));
    }

    private async filterVOsAccess<T extends IDistantVOBase>(datatable: ModuleTable<T>, access_type: string, vos: T[]): Promise<T[]> {

        if (!ModuleAccessPolicy.getInstance().actif) {
            return vos;
        }

        // Suivant le type de contenu et le type d'accès, on peut avoir un hook enregistré sur le ModuleDAO pour filtrer les vos
        let hook = this.access_hooks[datatable.vo_type] && this.access_hooks[datatable.vo_type][access_type] ? this.access_hooks[datatable.vo_type][access_type] : null;
        if (hook) {
            let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
            if ((!httpContext) || (!httpContext.get('IS_CLIENT'))) {
                // Server
                return vos;
            }

            let uid: number = httpContext ? httpContext.get('UID') : null;
            let user_data = httpContext ? httpContext.get('USER_DATA') : null;
            vos = await hook(datatable, vos, uid, user_data) as T[];
        }

        if (vos && vos.length && !await this.checkAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            // a priori on a accès en list labels, mais pas en read. Donc on va filtrer tous les champs, sauf le label et id et _type

            for (let j in vos) {
                let vo: IDistantVOBase = vos[j];

                for (let i in datatable.fields) {
                    let field: ModuleTableField<any> = datatable.fields[i];

                    if (datatable.default_label_field &&
                        (field.field_id == datatable.default_label_field.field_id)) {
                        continue;
                    }

                    if (datatable.table_label_function_field_ids_deps && datatable.table_label_function_field_ids_deps.length &&
                        (datatable.table_label_function_field_ids_deps.indexOf(field.field_id) > 0)) {
                        continue;
                    }

                    delete vo[field.field_id];
                }
            }
        }

        return vos;
    }

    private async filterVOAccess<T extends IDistantVOBase>(datatable: ModuleTable<T>, access_type: string, vo: T): Promise<T> {

        if (!ModuleAccessPolicy.getInstance().actif) {
            return vo;
        }

        // Suivant le type de contenu et le type d'accès, on peut avoir un hook enregistré sur le ModuleDAO pour filtrer les vos
        let hook = this.access_hooks[datatable.vo_type] && this.access_hooks[datatable.vo_type][access_type] ? this.access_hooks[datatable.vo_type][access_type] : null;
        if (hook) {
            let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;

            if ((!httpContext) || (!httpContext.get('IS_CLIENT'))) {
                // Server
                return vo;
            }

            let uid: number = httpContext ? httpContext.get('UID') : null;
            let user_data = httpContext ? httpContext.get('USER_DATA') : null;
            let filtered: T[] = await hook(datatable, (((typeof vo != 'undefined') && (vo != null)) ? [vo] : null), uid, user_data) as T[];

            if ((!filtered) || (!filtered.length)) {
                return null;
            }
        }

        if (vo && !await this.checkAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            // a priori on a accès en list labels, mais pas en read. Donc on va filtrer tous les champs, sauf le label et id et _type
            for (let i in datatable.fields) {
                let field: ModuleTableField<any> = datatable.fields[i];

                if (datatable.default_label_field &&
                    (field.field_id == datatable.default_label_field.field_id)) {
                    continue;
                }

                if (datatable.table_label_function_field_ids_deps && datatable.table_label_function_field_ids_deps.length &&
                    (datatable.table_label_function_field_ids_deps.indexOf(field.field_id) > 0)) {
                    continue;
                }

                delete vo[field.field_id];
            }
        }

        return vo;
    }

    private async getVoById<T extends IDistantVOBase>(apiDAOParamVO: APIDAOParamVO): Promise<T> {

        let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[apiDAOParamVO.API_TYPE_ID];

        // On vérifie qu'on peut faire a minima un listage
        if (!await this.checkAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_LIST_LABELS)) {
            return null;
        }

        let vo: T = datatable.forceNumeric(await ModuleServiceBase.getInstance().db.oneOrNone("SELECT t.* FROM " + datatable.full_name + " t WHERE id=" + apiDAOParamVO.id + ";") as T);

        if (!vo) {
            return vo;
        }

        // On filtre suivant les droits d'accès
        return await this.filterVOAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ, vo);
    }

    private async getBaseUrl(): Promise<string> {
        return ConfigurationService.getInstance().getNodeConfiguration().BASE_URL;
    }

    private async getVosByRefFieldIds<T extends IDistantVOBase>(apiDAOParamsVO: APIDAORefFieldParamsVO): Promise<T[]> {

        let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[apiDAOParamsVO.API_TYPE_ID];

        // On vérifie qu'on peut faire un select
        if (!await this.checkAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        // On check le field_name par rapport à la liste des fields, et au fait qu'il doit être un manyToOne (pour sécuriser)
        if ((!datatable) || (!datatable.getFieldFromId(apiDAOParamsVO.field_name)) || (!datatable.getFieldFromId(apiDAOParamsVO.field_name).field_id)) {
            return null;
        }

        if ((!apiDAOParamsVO.ids) || (!apiDAOParamsVO.ids.length)) {
            return null;
        }

        let vos: T[] = datatable.forceNumerics(await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + datatable.full_name + " t WHERE " + datatable.getFieldFromId(apiDAOParamsVO.field_name).field_id + " in (" + apiDAOParamsVO.ids + ");") as T[]);

        // On filtre suivant les droits d'accès
        return await this.filterVOsAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);
    }

    private async getVosByRefFieldsIds<T extends IDistantVOBase>(apiDAOParamsVO: APIDAORefFieldsParamsVO): Promise<T[]> {

        let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[apiDAOParamsVO.API_TYPE_ID];

        // On vérifie qu'on peut faire un select
        if (!await this.checkAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        // On check le field_name par rapport à la liste des fields, et au fait qu'il doit être un manyToOne (pour sécuriser)
        if ((!datatable) || (!datatable.getFieldFromId(apiDAOParamsVO.field_name1)) || (!datatable.getFieldFromId(apiDAOParamsVO.field_name1).field_id)) {
            return null;
        }

        if (apiDAOParamsVO.field_name2 && ((!datatable.getFieldFromId(apiDAOParamsVO.field_name2)) || (!datatable.getFieldFromId(apiDAOParamsVO.field_name2).field_id))) {
            return null;
        }

        if (apiDAOParamsVO.field_name3 && ((!datatable.getFieldFromId(apiDAOParamsVO.field_name3)) || (!datatable.getFieldFromId(apiDAOParamsVO.field_name3).field_id))) {
            return null;
        }

        if ((!apiDAOParamsVO.ids1) || (!apiDAOParamsVO.ids1.length)) {
            return null;
        }

        let request: string = "SELECT t.* FROM " + datatable.full_name + " t WHERE " +
            datatable.getFieldFromId(apiDAOParamsVO.field_name1).field_id + " in (" + apiDAOParamsVO.ids1 + ")";
        if (apiDAOParamsVO.field_name2 && ((!!apiDAOParamsVO.ids2) && (apiDAOParamsVO.ids2.length > 0))) {
            request += " AND " + datatable.getFieldFromId(apiDAOParamsVO.field_name2).field_id + " in (" + apiDAOParamsVO.ids2 + ")";
        }
        if (apiDAOParamsVO.field_name3 && ((!!apiDAOParamsVO.ids3) && (apiDAOParamsVO.ids3.length > 0))) {
            request += " AND " + datatable.getFieldFromId(apiDAOParamsVO.field_name3).field_id + " in (" + apiDAOParamsVO.ids3 + ")";
        }

        let vos: T[] = datatable.forceNumerics(await ModuleServiceBase.getInstance().db.query(request + ";") as T[]);

        // On filtre suivant les droits d'accès
        return await this.filterVOsAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);
    }

    private async getVosByRefFieldsIdsAndFieldsString<T extends IDistantVOBase>(apiDAOParamsVO: APIDAORefFieldsAndFieldsStringParamsVO): Promise<T[]> {

        let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[apiDAOParamsVO.API_TYPE_ID];

        // On vérifie qu'on peut faire un select
        if (!await this.checkAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        if ((!apiDAOParamsVO.field_name1) && (!apiDAOParamsVO.field_name2) && (!apiDAOParamsVO.field_name3)) {
            return null;
        }

        if (!datatable) {
            return null;
        }

        // On check le field_name par rapport à la liste des fields, et au fait qu'il doit être un manyToOne (pour sécuriser)
        if (apiDAOParamsVO.field_name1 && ((!datatable.getFieldFromId(apiDAOParamsVO.field_name1)) || (!datatable.getFieldFromId(apiDAOParamsVO.field_name1).field_id))) {
            return null;
        }

        if (apiDAOParamsVO.field_name2 && ((!datatable.getFieldFromId(apiDAOParamsVO.field_name2)) || (!datatable.getFieldFromId(apiDAOParamsVO.field_name2).field_id))) {
            return null;
        }

        if (apiDAOParamsVO.field_name3 && ((!datatable.getFieldFromId(apiDAOParamsVO.field_name3)) || (!datatable.getFieldFromId(apiDAOParamsVO.field_name3).field_id))) {
            return null;
        }

        let request: string = "SELECT t.* FROM " + datatable.full_name + " t WHERE ";
        let first: boolean = true;
        if (apiDAOParamsVO.field_name1 && ((!!apiDAOParamsVO.ids1) && (apiDAOParamsVO.ids1.length > 0))) {
            request += datatable.getFieldFromId(apiDAOParamsVO.field_name1).field_id + " in (" + apiDAOParamsVO.ids1 + ")";
            first = false;
        }
        if (apiDAOParamsVO.field_name2 && ((!!apiDAOParamsVO.values2) && (apiDAOParamsVO.values2.length > 0))) {
            request += ((!first) ? " AND " : "") + datatable.getFieldFromId(apiDAOParamsVO.field_name2).field_id + " in ('" + apiDAOParamsVO.values2.join("','") + "')";
            first = false;
        }
        if (apiDAOParamsVO.field_name3 && ((!!apiDAOParamsVO.values3) && (apiDAOParamsVO.values3.length > 0))) {
            request += ((!first) ? " AND " : "") + datatable.getFieldFromId(apiDAOParamsVO.field_name3).field_id + " in ('" + apiDAOParamsVO.values3.join("','") + "')";
            first = false;
        }

        let vos: T[] = datatable.forceNumerics(await ModuleServiceBase.getInstance().db.query(request + ";") as T[]);

        // On filtre suivant les droits d'accès
        return await this.filterVOsAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);
    }

    private async getVosByIds<T extends IDistantVOBase>(apiDAOParamsVO: APIDAOParamsVO): Promise<T[]> {

        if ((!apiDAOParamsVO) || (!apiDAOParamsVO.ids) || (!apiDAOParamsVO.ids.length)) {
            return null;
        }

        let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[apiDAOParamsVO.API_TYPE_ID];

        // On vérifie qu'on peut faire un select
        if (!await this.checkAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        let vos: T[] = datatable.forceNumerics(await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + datatable.full_name + " t WHERE id in (" + apiDAOParamsVO.ids + ");") as T[]);

        // On filtre suivant les droits d'accès
        return await this.filterVOsAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);
    }

    private async filterVosByFieldRanges<T extends IDistantVOBase>(param: APIDAOApiTypeAndFieldRangesParamsVO): Promise<T[]> {
        let field_ranges = param ? param.ranges : null;

        if ((!field_ranges) || (!field_ranges.length)) {
            return null;
        }

        let api_type_id: string = field_ranges[0].api_type_id;

        let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];

        if (!datatable) {
            return null;
        }

        // On vérifie qu'on peut faire un select
        if (!await this.checkAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        let where_clause: string = "";

        // On filtre par field et par range par field. Sur un même field les ranges sont des unions, mais les fields sont une intersection
        let ranges_by_field_id: { [field_id: string]: Array<FieldRange<any>> } = {};
        for (let i in field_ranges) {
            let field_range = field_ranges[i];

            if ((!field_range) || (api_type_id != field_range.api_type_id) || (!field_range.field_id) || (!datatable.getFieldFromId(field_range.field_id))) {
                console.error('Champs introuvable ou incompatible :' + api_type_id + ':' + (field_range ? field_range.api_type_id : null) + ':' + (field_range ? field_range.field_id : null) + ':');
                return null;
            }

            if (!ranges_by_field_id[field_range.field_id]) {
                ranges_by_field_id[field_range.field_id] = [];
            }
            ranges_by_field_id[field_range.field_id].push(field_range);
        }


        let first = true;
        for (let i in ranges_by_field_id) {
            let ranges = ranges_by_field_id[i];

            where_clause += first ? "(" : ") AND (";
            let first_in_clause = true;

            for (let j in ranges) {
                let field_range = ranges[j];

                if ((!field_range) || (api_type_id != field_range.api_type_id) || (!field_range.field_id) || (!datatable.getFieldFromId(field_range.field_id))) {
                    continue;
                }

                let field = datatable.getFieldFromId(field_range.field_id);

                where_clause += first_in_clause ? "" : " OR ";

                first = false;
                first_in_clause = false;

                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_amount:
                    case ModuleTableField.FIELD_TYPE_enum:
                    case ModuleTableField.FIELD_TYPE_file_ref:
                    case ModuleTableField.FIELD_TYPE_float:
                    case ModuleTableField.FIELD_TYPE_foreign_key:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableField.FIELD_TYPE_image_ref:
                    case ModuleTableField.FIELD_TYPE_int:
                    case ModuleTableField.FIELD_TYPE_prct:
                    case ModuleTableField.FIELD_TYPE_tstz:
                        where_clause += field.field_id + "::numeric <@ '" + (field_range.min_inclusiv ? "[" : "(") + field_range.min + "," + field_range.max + (field_range.max_inclusiv ? "]" : ")") + "'::numrange";
                        break;

                    case ModuleTableField.FIELD_TYPE_int_array:
                        where_clause += "'" + (field_range.min_inclusiv ? "[" : "(") + field_range.min + "," + field_range.max + (field_range.max_inclusiv ? "]" : ")") + "'::numrange @> ANY (" + field.field_id + "::numeric[])";
                        break;

                    case ModuleTableField.FIELD_TYPE_numrange_array:
                        where_clause += "'" + (field_range.min_inclusiv ? "[" : "(") + field_range.min + "," + field_range.max + (field_range.max_inclusiv ? "]" : ")") + "'::numrange @> ANY (" + field.field_id + "::numrange[])";
                        break;

                    case ModuleTableField.FIELD_TYPE_date:
                    case ModuleTableField.FIELD_TYPE_day:
                    case ModuleTableField.FIELD_TYPE_month:
                        where_clause += field.field_id + "::date <@ '" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(field_range.min) + "," + DateHandler.getInstance().formatDayForIndex(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "'::daterange";
                        break;

                    case ModuleTableField.FIELD_TYPE_unix_timestamp:
                        where_clause += field.field_id + "::numeric <@ '" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().getUnixForBDD(field_range.min) + "," + DateHandler.getInstance().getUnixForBDD(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "'::numrange";
                        break;

                    case ModuleTableField.FIELD_TYPE_timestamp:
                    case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                        // TODO FIXME
                        break;

                    case ModuleTableField.FIELD_TYPE_daterange:
                        where_clause += field.field_id + " <@ '" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(field_range.min) + "," + DateHandler.getInstance().formatDayForIndex(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "'::daterange";
                        break;

                    case ModuleTableField.FIELD_TYPE_tsrange:
                        where_clause += field.field_id + " <@ '" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDateTimeForBDD(field_range.min) + "," + DateHandler.getInstance().formatDateTimeForBDD(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "'::tstzrange";
                        break;

                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                        where_clause += "'" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().getUnixForBDD(field_range.min) + "," + DateHandler.getInstance().getUnixForBDD(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "'::numrange @> ANY (" + field.field_id + "::numrange[])";
                        break;

                    // case ModuleTableField.FIELD_TYPE_daterange_array:
                    //     where_clause += "'" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(field_range.min) + "," + DateHandler.getInstance().formatDayForIndex(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "'::daterange @> ANY (" + field.field_id + "::daterange[])";
                    //     break;
                }
            }
        }
        where_clause += ")";

        if (first) {
            return null;
        }

        let vos: T[] = datatable.forceNumerics(await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + datatable.full_name + " t WHERE " + where_clause + ";") as T[]);

        // On filtre suivant les droits d'accès
        return await this.filterVOsAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);
    }


    private async filterVosByFieldRangesIntersections<T extends IDistantVOBase>(param: APIDAOApiTypeAndFieldRangesParamsVO): Promise<T[]> {
        let field_ranges = param ? param.ranges : null;

        if ((!field_ranges) || (!field_ranges.length)) {
            return null;
        }

        let api_type_id: string = field_ranges[0].api_type_id;

        let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];

        if (!datatable) {
            return null;
        }

        // On vérifie qu'on peut faire un select
        if (!await this.checkAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        let where_clause: string = "";

        // On filtre par field et par range par field. Sur un même field les ranges sont des unions, mais les fields sont une intersection
        let ranges_by_field_id: { [field_id: string]: Array<FieldRange<any>> } = {};
        for (let i in field_ranges) {
            let field_range = field_ranges[i];

            if ((!field_range) || (api_type_id != field_range.api_type_id) || (!field_range.field_id) || (!datatable.getFieldFromId(field_range.field_id))) {
                console.error('Champs introuvable ou incompatible :' + api_type_id + ':' + (field_range ? field_range.api_type_id : null) + ':' + (field_range ? field_range.field_id : null) + ':');
                return null;
            }

            if (!ranges_by_field_id[field_range.field_id]) {
                ranges_by_field_id[field_range.field_id] = [];
            }
            ranges_by_field_id[field_range.field_id].push(field_range);
        }

        let first = true;
        for (let i in ranges_by_field_id) {
            let ranges = ranges_by_field_id[i];

            where_clause += first ? "(" : ") AND (";
            let first_in_clause = true;

            for (let j in ranges) {
                let field_range = ranges[j];

                if ((!field_range) || (api_type_id != field_range.api_type_id) || (!field_range.field_id) || (!datatable.getFieldFromId(field_range.field_id))) {
                    continue;
                }

                let field = datatable.getFieldFromId(field_range.field_id);

                where_clause += first_in_clause ? "" : " OR ";

                first = false;
                first_in_clause = false;

                switch (field.field_type) {

                    case ModuleTableField.FIELD_TYPE_string:
                        if (datatable.getFieldFromId(field_range.field_id).field_type == ModuleTableField.FIELD_TYPE_tstzrange_array) {
                            where_clause += field.field_id + "::timestamp with time zone <@ '" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(field_range.min) + "," + DateHandler.getInstance().formatDayForIndex(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "'::tstzrange";
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_amount:
                    case ModuleTableField.FIELD_TYPE_enum:
                    case ModuleTableField.FIELD_TYPE_file_ref:
                    case ModuleTableField.FIELD_TYPE_float:
                    case ModuleTableField.FIELD_TYPE_foreign_key:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableField.FIELD_TYPE_image_ref:
                    case ModuleTableField.FIELD_TYPE_int:
                    case ModuleTableField.FIELD_TYPE_prct:
                    case ModuleTableField.FIELD_TYPE_tstz:
                        where_clause += field.field_id + "::numeric <@ '" + (field_range.min_inclusiv ? "[" : "(") + field_range.min + "," + field_range.max + (field_range.max_inclusiv ? "]" : ")") + "'::numrange";
                        break;

                    case ModuleTableField.FIELD_TYPE_int_array:
                        where_clause += "'" + (field_range.min_inclusiv ? "[" : "(") + field_range.min + "," + field_range.max + (field_range.max_inclusiv ? "]" : ")") + "'::numrange && ANY (" + field.field_id + "::numeric[])";
                        break;

                    case ModuleTableField.FIELD_TYPE_numrange_array:
                        where_clause += "'" + (field_range.min_inclusiv ? "[" : "(") + field_range.min + "," + field_range.max + (field_range.max_inclusiv ? "]" : ")") + "'::numrange && ANY (" + field.field_id + "::numrange[])";
                        break;

                    case ModuleTableField.FIELD_TYPE_date:
                    case ModuleTableField.FIELD_TYPE_day:
                    case ModuleTableField.FIELD_TYPE_month:
                        where_clause += field.field_id + "::date <@ '" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(field_range.min) + "," + DateHandler.getInstance().formatDayForIndex(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "'::daterange";
                        break;

                    case ModuleTableField.FIELD_TYPE_unix_timestamp:
                        where_clause += field.field_id + "::numeric <@ '" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().getUnixForBDD(field_range.min) + "," + DateHandler.getInstance().getUnixForBDD(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "'::numrange";
                        break;

                    case ModuleTableField.FIELD_TYPE_timestamp:
                    case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                        // TODO FIXME
                        break;

                    case ModuleTableField.FIELD_TYPE_daterange:
                        where_clause += field.field_id + " && '" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(field_range.min) + "," + DateHandler.getInstance().formatDayForIndex(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "'::daterange";
                        break;

                    case ModuleTableField.FIELD_TYPE_tsrange:
                        where_clause += field.field_id + " && '" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDateTimeForBDD(field_range.min) + "," + DateHandler.getInstance().formatDateTimeForBDD(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "'::tstzrange";
                        break;

                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                        where_clause += "'" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().getUnixForBDD(field_range.min) + "," + DateHandler.getInstance().getUnixForBDD(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "'::numrange && ANY (" + field.field_id + "::numrange[])";
                        break;

                    // case ModuleTableField.FIELD_TYPE_daterange_array:
                    //     where_clause += "'" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(field_range.min) + "," + DateHandler.getInstance().formatDayForIndex(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "'::daterange @> ANY (" + field.field_id + "::daterange[])";
                    //     break;
                }
            }
        }
        where_clause += ")";

        if (first) {
            return null;
        }

        let vos: T[] = datatable.forceNumerics(await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + datatable.full_name + " t WHERE " + where_clause + ";") as T[]);

        // On filtre suivant les droits d'accès
        return await this.filterVOsAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);
    }

    private async getVosByExactFieldRange<T extends IDistantVOBase>(param: APIDAOApiTypeAndFieldRangesParamsVO): Promise<T[]> {
        let field_ranges = param ? param.ranges : null;

        if ((!field_ranges) || (!field_ranges.length)) {
            return null;
        }

        let api_type_id: string = field_ranges[0].api_type_id;

        let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];

        if (!datatable) {
            return null;
        }

        // On vérifie qu'on peut faire un select
        if (!await this.checkAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        let where_clause: string = "";

        // On filtre par field et par range par field. Sur un même field les ranges sont des unions, mais les fields sont une intersection
        let ranges_by_field_id: { [field_id: string]: Array<FieldRange<any>> } = {};
        for (let i in field_ranges) {
            let field_range = field_ranges[i];

            if ((!field_range) || (api_type_id != field_range.api_type_id) || (!field_range.field_id) || (!datatable.getFieldFromId(field_range.field_id))) {
                console.error('Champs introuvable ou incompatible :' + api_type_id + ':' + (field_range ? field_range.api_type_id : null) + ':' + (field_range ? field_range.field_id : null) + ':');
                return null;
            }


            if (!ranges_by_field_id[field_range.field_id]) {
                ranges_by_field_id[field_range.field_id] = [];
            } else {
                console.error('cannot getVosByExactFieldRanges with non multiple ranges');
                return null;
            }
            ranges_by_field_id[field_range.field_id].push(field_range);
        }


        let first = true;
        for (let i in ranges_by_field_id) {
            let ranges = ranges_by_field_id[i];

            where_clause += first ? "" : " OR ";

            for (let j in ranges) {
                let field_range = ranges[j];

                if ((!field_range) || (api_type_id != field_range.api_type_id) || (!field_range.field_id) || (!datatable.getFieldFromId(field_range.field_id))) {
                    continue;
                }

                let field = datatable.getFieldFromId(field_range.field_id);

                first = false;

                switch (field.field_type) {

                    case ModuleTableField.FIELD_TYPE_numrange_array:
                        where_clause += "'{\"" + (field_range.min_inclusiv ? "[" : "(") + field_range.min + "," + field_range.max + (field_range.max_inclusiv ? "]" : ")") + "\"}' = " + field.field_id + "";
                        break;

                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                        where_clause += "'{\"" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().getUnixForBDD(field_range.min) + "," + DateHandler.getInstance().getUnixForBDD(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "\"}' = " + field.field_id + "";
                        break;

                    default:
                        console.error('cannot getVosByExactFieldRanges with non range array fields');
                        return null;
                }
            }
        }
        where_clause += ")";

        if (first) {
            return null;
        }

        let vos: T[] = datatable.forceNumerics(await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + datatable.full_name + " t WHERE " + where_clause + ";") as T[]);

        // On filtre suivant les droits d'accès
        return await this.filterVOsAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);
    }

    private async  getVosByIdsRanges<T extends IDistantVOBase>(apiDAOIdsRangesParamsVO: APIDAOIdsRangesParamsVO): Promise<T[]> {

        if ((!apiDAOIdsRangesParamsVO) || (!apiDAOIdsRangesParamsVO.ranges) || (!apiDAOIdsRangesParamsVO.ranges.length)) {
            return null;
        }

        let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[apiDAOIdsRangesParamsVO.API_TYPE_ID];

        // On vérifie qu'on peut faire un select
        if (!await this.checkAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        let where_clause: string = "";

        for (let i in apiDAOIdsRangesParamsVO.ranges) {
            let range = apiDAOIdsRangesParamsVO.ranges[i];

            if ((!range) || (!range.max) || (!range.min)) {
                continue;
            }

            where_clause += (where_clause == "") ? "" : " OR ";

            where_clause += "id::numeric <@ '" + (range.min_inclusiv ? "[" : "(") + range.min + "," + range.max + (range.max_inclusiv ? "]" : ")") + "'::numrange";
        }

        if (where_clause == "") {
            return null;
        }

        let vos: T[] = datatable.forceNumerics(await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + datatable.full_name + " t WHERE " + where_clause + ";") as T[]);

        // On filtre suivant les droits d'accès
        return await this.filterVOsAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);
    }

    private async getVos<T extends IDistantVOBase>(API_TYPE_ID: StringParamVO): Promise<T[]> {

        // On filtre les res suivant les droits d'accès
        // return await this.selectAll(apiDAOParamVOs);
        return await this.selectAll<T>(API_TYPE_ID.text);
    }

    private async getNamedVoByName<U extends INamedVO>(param: APIDAONamedParamVO): Promise<U> {
        // On définit des limites pour les noms de vos nommes, qui ne doivent contenir que les caractères suivants :
        //  [a-z0-9A-Z-_ ./:,]
        if ((!param) || (!/^[a-z0-9A-Z-_ ./:,]+$/.test(param.name))) {
            return null;
        }
        return await this.selectOne<U>(param.API_TYPE_ID, "where LOWER(name) = LOWER($1)", [param.name]);
    }





    private async filterVosByMatroids<T extends IDistantVOBase>(param: APIDAOApiTypeAndMatroidsParamsVO): Promise<T[]> {
        let matroids: IMatroid[] = param ? param.matroids : null;
        let api_type_id: string = param ? param.API_TYPE_ID : null;
        let fields_ids_mapper: { [matroid_field_id: string]: string } = param ? param.fields_ids_mapper : null;

        if ((!matroids) || (!matroids.length)) {
            return null;
        }

        let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];

        if (!datatable) {
            return null;
        }

        // On vérifie qu'on peut faire un select
        if (!await this.checkAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        let where_clause: string = "";

        let first_matroid = true;
        for (let matroid_i in matroids) {
            let matroid = matroids[matroid_i];

            if (!matroid) {
                console.error('Matroid vide:' + api_type_id + ':' + (matroid ? matroid._type : null) + ':');
                return null;
            }

            where_clause += first_matroid ? "(" : ") OR (";

            let matroid_fields = MatroidController.getInstance().getMatroidFields(matroid._type);

            let first = true;
            for (let i in matroid_fields) {
                let matroid_field = matroid_fields[i];
                let ranges: Array<IRange<any>> = matroid[matroid_field.field_id];
                let field = datatable.getFieldFromId((fields_ids_mapper && fields_ids_mapper[matroid_field.field_id]) ? fields_ids_mapper[matroid_field.field_id] : matroid_field.field_id);

                if (!field) {
                    continue;
                }

                if ((!ranges) || (!ranges.length)) {
                    console.error('Matroid field vide ou inexistant:' + api_type_id + ':' + matroid_fields[i].field_id + ':');
                    return null;
                }

                where_clause += first ? "(" : ") AND (";
                let first_in_clause = true;

                for (let j in ranges) {
                    let field_range: IRange<any> = ranges[j];

                    if (!RangeHandler.isValid(field_range)) {
                        console.error('field_range invalid:' + api_type_id + ':' + JSON.stringify(field_range) + ':');
                        return null;
                    }

                    where_clause += first_in_clause ? "" : " OR ";

                    first = false;
                    first_in_clause = false;
                    first_matroid = false;

                    switch (field.field_type) {

                        case ModuleTableField.FIELD_TYPE_string:
                            if (matroid_field.field_type == ModuleTableField.FIELD_TYPE_tsrange) {
                                where_clause += field.field_id + "::timestamp with time zone <@ '" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(field_range.min) + "," + DateHandler.getInstance().formatDayForIndex(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "'::tstzrange";
                                break;
                            }

                        case ModuleTableField.FIELD_TYPE_amount:
                        case ModuleTableField.FIELD_TYPE_enum:
                        case ModuleTableField.FIELD_TYPE_file_ref:
                        case ModuleTableField.FIELD_TYPE_float:
                        case ModuleTableField.FIELD_TYPE_foreign_key:
                        case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                        case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                        case ModuleTableField.FIELD_TYPE_image_ref:
                        case ModuleTableField.FIELD_TYPE_int:
                        case ModuleTableField.FIELD_TYPE_prct:
                        case ModuleTableField.FIELD_TYPE_tstz:
                            where_clause += field.field_id + "::numeric <@ '" + (field_range.min_inclusiv ? "[" : "(") + field_range.min + "," + field_range.max + (field_range.max_inclusiv ? "]" : ")") + "'::numrange";
                            break;

                        case ModuleTableField.FIELD_TYPE_int_array:
                            where_clause += "'" + (field_range.min_inclusiv ? "[" : "(") + field_range.min + "," + field_range.max + (field_range.max_inclusiv ? "]" : ")") + "'::numrange @> ANY (" + field.field_id + "::numeric[])";
                            break;

                        case ModuleTableField.FIELD_TYPE_numrange_array:
                            where_clause += "'" + (field_range.min_inclusiv ? "[" : "(") + field_range.min + "," + field_range.max + (field_range.max_inclusiv ? "]" : ")") + "'::numrange @> ANY (" + field.field_id + "::numrange[])";
                            break;

                        case ModuleTableField.FIELD_TYPE_date:
                        case ModuleTableField.FIELD_TYPE_day:
                        case ModuleTableField.FIELD_TYPE_month:
                            where_clause += field.field_id + "::date <@ '" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(field_range.min) + "," + DateHandler.getInstance().formatDayForIndex(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "'::daterange";
                            break;

                        case ModuleTableField.FIELD_TYPE_unix_timestamp:
                            where_clause += field.field_id + "::numeric <@ '" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().getUnixForBDD(field_range.min) + "," + DateHandler.getInstance().getUnixForBDD(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "'::numrange";
                            break;

                        case ModuleTableField.FIELD_TYPE_timestamp:
                        case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                            // TODO FIXME
                            break;

                        case ModuleTableField.FIELD_TYPE_daterange:
                            where_clause += field.field_id + " <@ '" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(field_range.min) + "," + DateHandler.getInstance().formatDayForIndex(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "'::daterange";
                            break;

                        case ModuleTableField.FIELD_TYPE_tsrange:
                            where_clause += field.field_id + " <@ '" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDateTimeForBDD(field_range.min) + "," + DateHandler.getInstance().formatDateTimeForBDD(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "'::tstzrange";
                            break;

                        case ModuleTableField.FIELD_TYPE_tstzrange_array:
                            where_clause += "'" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().getUnixForBDD(field_range.min) + "," + DateHandler.getInstance().getUnixForBDD(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "'::numrange @> ANY (" + field.field_id + "::numrange[])";
                            break;

                        // case ModuleTableField.FIELD_TYPE_daterange_array:
                        //     where_clause += "'" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(field_range.min) + "," + DateHandler.getInstance().formatDayForIndex(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "'::daterange @> ANY (" + field.field_id + "::daterange[])";
                        //     break;
                    }
                }
            }
            if (first) {
                return null;
            }
            where_clause += ")";

        }
        where_clause += ")";

        if (first_matroid) {
            return null;
        }

        let vos: T[] = datatable.forceNumerics(await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + datatable.full_name + " t WHERE " + where_clause + ";") as T[]);

        // On filtre suivant les droits d'accès
        return await this.filterVOsAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);
    }


    private async filterVosByMatroidsIntersections<T extends IDistantVOBase>(param: APIDAOApiTypeAndMatroidsParamsVO): Promise<T[]> {
        let matroids: IMatroid[] = param ? param.matroids : null;
        let api_type_id: string = param ? param.API_TYPE_ID : null;
        let fields_ids_mapper: { [matroid_field_id: string]: string } = param ? param.fields_ids_mapper : null;

        if ((!matroids) || (!matroids.length)) {
            return null;
        }

        let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];

        if (!datatable) {
            return null;
        }

        // On vérifie qu'on peut faire un select
        if (!await this.checkAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        let where_clause: string = "";

        let first_matroid = true;
        for (let matroid_i in matroids) {
            let matroid = matroids[matroid_i];

            if (!matroid) {
                console.error('Matroid vide:' + api_type_id + ':' + (matroid ? matroid._type : null) + ':');
                return null;
            }

            where_clause += first_matroid ? "(" : ") OR (";

            let matroid_fields = MatroidController.getInstance().getMatroidFields(matroid._type);

            let first = true;
            for (let i in matroid_fields) {
                let matroid_field = matroid_fields[i];
                let ranges: Array<IRange<any>> = matroid[matroid_field.field_id];
                let field = datatable.getFieldFromId((fields_ids_mapper && fields_ids_mapper[matroid_field.field_id]) ? fields_ids_mapper[matroid_field.field_id] : matroid_field.field_id);

                if (!field) {
                    continue;
                }

                if ((!ranges) || (!ranges.length)) {
                    console.error('Matroid field vide ou inexistant:' + api_type_id + ':' + matroid_fields[i].field_id + ':');
                    return null;
                }

                where_clause += first ? "(" : ") AND (";
                let first_in_clause = true;

                for (let j in ranges) {
                    let field_range: IRange<any> = ranges[j];

                    if (!RangeHandler.isValid(field_range)) {
                        console.error('field_range invalid:' + api_type_id + ':' + JSON.stringify(field_range) + ':');
                        return null;
                    }

                    where_clause += first_in_clause ? "" : " OR ";

                    first = false;
                    first_in_clause = false;
                    first_matroid = false;

                    switch (field.field_type) {

                        case ModuleTableField.FIELD_TYPE_string:
                            if (matroid_field.field_type == ModuleTableField.FIELD_TYPE_tstzrange_array) {
                                where_clause += field.field_id + "::timestamp with time zone <@ '" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(field_range.min) + "," + DateHandler.getInstance().formatDayForIndex(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "'::tstzrange";
                            }
                            break;

                        case ModuleTableField.FIELD_TYPE_amount:
                        case ModuleTableField.FIELD_TYPE_enum:
                        case ModuleTableField.FIELD_TYPE_file_ref:
                        case ModuleTableField.FIELD_TYPE_float:
                        case ModuleTableField.FIELD_TYPE_foreign_key:
                        case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                        case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                        case ModuleTableField.FIELD_TYPE_image_ref:
                        case ModuleTableField.FIELD_TYPE_int:
                        case ModuleTableField.FIELD_TYPE_prct:
                        case ModuleTableField.FIELD_TYPE_tstz:
                            where_clause += field.field_id + "::numeric <@ '" + (field_range.min_inclusiv ? "[" : "(") + field_range.min + "," + field_range.max + (field_range.max_inclusiv ? "]" : ")") + "'::numrange";
                            break;

                        case ModuleTableField.FIELD_TYPE_int_array:
                            where_clause += "'" + (field_range.min_inclusiv ? "[" : "(") + field_range.min + "," + field_range.max + (field_range.max_inclusiv ? "]" : ")") + "'::numrange && ANY (" + field.field_id + "::numeric[])";
                            break;

                        case ModuleTableField.FIELD_TYPE_numrange_array:
                            where_clause += "'" + (field_range.min_inclusiv ? "[" : "(") + field_range.min + "," + field_range.max + (field_range.max_inclusiv ? "]" : ")") + "'::numrange && ANY (" + field.field_id + "::numrange[])";
                            break;

                        case ModuleTableField.FIELD_TYPE_date:
                        case ModuleTableField.FIELD_TYPE_day:
                        case ModuleTableField.FIELD_TYPE_month:
                            where_clause += field.field_id + "::date <@ '" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(field_range.min) + "," + DateHandler.getInstance().formatDayForIndex(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "'::daterange";
                            break;

                        case ModuleTableField.FIELD_TYPE_unix_timestamp:
                            where_clause += field.field_id + "::numeric <@ '" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().getUnixForBDD(field_range.min) + "," + DateHandler.getInstance().getUnixForBDD(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "'::numrange";
                            break;

                        case ModuleTableField.FIELD_TYPE_timestamp:
                        case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                            // TODO FIXME
                            break;

                        case ModuleTableField.FIELD_TYPE_daterange:
                            where_clause += field.field_id + " && '" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(field_range.min) + "," + DateHandler.getInstance().formatDayForIndex(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "'::daterange";
                            break;

                        case ModuleTableField.FIELD_TYPE_tsrange:
                            where_clause += field.field_id + " && '" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDateTimeForBDD(field_range.min) + "," + DateHandler.getInstance().formatDateTimeForBDD(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "'::tstzrange";
                            break;

                        case ModuleTableField.FIELD_TYPE_tstzrange_array:
                            where_clause += "'" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().getUnixForBDD(field_range.min) + "," + DateHandler.getInstance().getUnixForBDD(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "'::numrange && ANY (" + field.field_id + "::numrange[])";
                            break;

                        // case ModuleTableField.FIELD_TYPE_daterange_array:
                        //     where_clause += "'" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(field_range.min) + "," + DateHandler.getInstance().formatDayForIndex(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "'::daterange @> ANY (" + field.field_id + "::daterange[])";
                        //     break;
                    }
                }
            }
            if (first) {
                return null;
            }
            where_clause += ")";

        }
        where_clause += ")";

        if (first_matroid) {
            return null;
        }

        let vos: T[] = datatable.forceNumerics(await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + datatable.full_name + " t WHERE " + where_clause + ";") as T[]);

        // On filtre suivant les droits d'accès
        return await this.filterVOsAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);
    }

    private async getVosByExactMatroid<T extends IDistantVOBase>(param: APIDAOApiTypeAndMatroidsParamsVO): Promise<T[]> {
        let matroids: IMatroid[] = param ? param.matroids : null;
        let api_type_id: string = param ? param.API_TYPE_ID : null;
        let fields_ids_mapper: { [matroid_field_id: string]: string } = param ? param.fields_ids_mapper : null;

        if ((!matroids) || (!matroids.length)) {
            return null;
        }

        let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];

        if (!datatable) {
            return null;
        }

        // On vérifie qu'on peut faire un select
        if (!await this.checkAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        let where_clause: string = "";

        let first_matroid = true;
        for (let matroid_i in matroids) {
            let matroid = matroids[matroid_i];

            if (!matroid) {
                console.error('Matroid vide:' + api_type_id + ':' + (matroid ? matroid._type : null) + ':');
                return null;
            }

            where_clause += first_matroid ? "(" : ") OR (";

            let matroid_fields = MatroidController.getInstance().getMatroidFields(matroid._type);

            let first = true;
            for (let i in matroid_fields) {
                let matroid_field = matroid_fields[i];
                let ranges: Array<IRange<any>> = matroid[matroid_field.field_id];
                let field = datatable.getFieldFromId((fields_ids_mapper && fields_ids_mapper[matroid_field.field_id]) ? fields_ids_mapper[matroid_field.field_id] : matroid_field.field_id);

                if (!field) {
                    continue;
                }

                if ((!ranges) || (!ranges.length)) {
                    console.error('Matroid field vide ou inexistant:' + api_type_id + ':' + matroid_fields[i].field_id + ':');
                    return null;
                }

                where_clause += first ? "(" : ") AND (";

                for (let j in ranges) {
                    let field_range: IRange<any> = ranges[j];

                    if (!RangeHandler.isValid(field_range)) {
                        console.error('field_range invalid:' + api_type_id + ':' + JSON.stringify(field_range) + ':');
                        return null;
                    }

                    first = false;
                    first_matroid = false;

                    switch (field.field_type) {

                        case ModuleTableField.FIELD_TYPE_numrange_array:
                            where_clause += "'{\"" + (field_range.min_inclusiv ? "[" : "(") + field_range.min + "," + field_range.max + (field_range.max_inclusiv ? "]" : ")") + "\"}' = " + field.field_id + "";
                            break;

                        case ModuleTableField.FIELD_TYPE_tstzrange_array:
                            where_clause += "'{\"" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().getUnixForBDD(field_range.min) + "," + DateHandler.getInstance().getUnixForBDD(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "\"}' = " + field.field_id + "";
                            break;

                        default:
                            console.error('cannot getVosByExactFieldRanges with non range array fields');
                            return null;
                    }
                }
            }
            if (first) {
                return null;
            }
            where_clause += ")";

        }
        where_clause += ")";

        if (first_matroid) {
            return null;
        }

        let vos: T[] = datatable.forceNumerics(await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + datatable.full_name + " t WHERE " + where_clause + ";") as T[]);

        // On filtre suivant les droits d'accès
        return await this.filterVOsAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);
    }
}
import { Duration, Moment } from 'moment';
import INamedVO from '../../../shared/interfaces/INamedVO';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import RolePolicyVO from '../../../shared/modules/AccessPolicy/vos/RolePolicyVO';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserRoleVO from '../../../shared/modules/AccessPolicy/vos/UserRoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import { IHookFilterVos } from '../../../shared/modules/DAO/interface/IHookFilterVos';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import IRange from '../../../shared/modules/DataRender/interfaces/IRange';
import NumRange from '../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../shared/modules/DataRender/vos/NumSegment';
import TSRange from '../../../shared/modules/DataRender/vos/TSRange';
import FeedbackVO from '../../../shared/modules/Feedback/vos/FeedbackVO';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import MaintenanceVO from '../../../shared/modules/Maintenance/vos/MaintenanceVO';
import IMatroid from '../../../shared/modules/Matroid/interfaces/IMatroid';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import ModuleTable from '../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import ParamVO from '../../../shared/modules/Params/vos/ParamVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import ModuleVocus from '../../../shared/modules/Vocus/ModuleVocus';
import VocusInfoVO from '../../../shared/modules/Vocus/vos/VocusInfoVO';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import BooleanHandler from '../../../shared/tools/BooleanHandler';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import DateHandler from '../../../shared/tools/DateHandler';
import RangeHandler from '../../../shared/tools/RangeHandler';
import ThrottleHelper from '../../../shared/tools/ThrottleHelper';
import ConfigurationService from '../../env/ConfigurationService';
import ServerBase from '../../ServerBase';
import StackContext from '../../StackContext';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModuleServiceBase from '../ModuleServiceBase';
import ModulesManagerServer from '../ModulesManagerServer';
import ModuleTableDBService from '../ModuleTableDBService';
import PushDataServerController from '../PushData/PushDataServerController';
import ModuleVocusServer from '../Vocus/ModuleVocusServer';
import DAOCronWorkersHandler from './DAOCronWorkersHandler';
import DAOServerController from './DAOServerController';
import DAOPostCreateTriggerHook from './triggers/DAOPostCreateTriggerHook';
import DAOPostDeleteTriggerHook from './triggers/DAOPostDeleteTriggerHook';
import DAOPostUpdateTriggerHook from './triggers/DAOPostUpdateTriggerHook';
import DAOPreCreateTriggerHook from './triggers/DAOPreCreateTriggerHook';
import DAOPreDeleteTriggerHook from './triggers/DAOPreDeleteTriggerHook';
import DAOPreUpdateTriggerHook from './triggers/DAOPreUpdateTriggerHook';
import DAOUpdateVOHolder from './vos/DAOUpdateVOHolder';

export default class ModuleDAOServer extends ModuleServerBase {

    public static TASK_NAME_add_segmented_known_databases: string = ModuleDAO.getInstance().name + ".add_segmented_known_databases";

    public static getInstance() {
        if (!ModuleDAOServer.instance) {
            ModuleDAOServer.instance = new ModuleDAOServer();
        }
        return ModuleDAOServer.instance;
    }

    private static instance: ModuleDAOServer = null;

    public global_update_blocker: boolean = false;
    private throttled_refuse = ThrottleHelper.getInstance().declare_throttle_with_mappable_args(this.refuse.bind(this), 1000, { leading: false });

    private constructor() {
        super(ModuleDAO.getInstance().name);
    }

    public get_all_ranges_from_segmented_table(moduleTable: ModuleTable<any>): NumRange[] {
        let segmentations: { [table_name: string]: number } = DAOServerController.getInstance().segmented_known_databases[moduleTable.database];
        if (!segmentations) {
            return null;
        }

        let ranges: NumRange[] = [];

        for (let i in segmentations) {
            let segment = segmentations[i];

            ranges.push(RangeHandler.getInstance().create_single_elt_NumRange(segment, moduleTable.table_segmented_field_segment_type));
        }

        return ranges;
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

        // On déclare un droit permettant de faire appel à la fonction query du module dao server
        let query_access: AccessPolicyVO = new AccessPolicyVO();
        query_access.group_id = group_overall.id;
        query_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        query_access.translatable_name = ModuleDAO.DAO_ACCESS_QUERY;
        query_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(query_access, new DefaultTranslation({
            fr: 'Utiliser la fonction QUERY'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

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
                (vo_type == FeedbackVO.API_TYPE_ID) ||
                (vo_type == ParamVO.API_TYPE_ID) ||
                (vo_type == TranslationVO.API_TYPE_ID) ||
                (vo_type == TranslatableTextVO.API_TYPE_ID) ||
                (vo_type == LangVO.API_TYPE_ID) ||
                (vo_type == MaintenanceVO.API_TYPE_ID) ||
                (vo_type == PolicyDependencyVO.API_TYPE_ID) ||
                (vo_type == AccessPolicyGroupVO.API_TYPE_ID) ||
                (vo_type == UserRoleVO.API_TYPE_ID)) {
                isAccessConfVoType = true;
            }

            let group = moduleTable.isModuleParamTable ? group_modules_conf : group_datas;

            // On déclare les 4 policies et leurs dépendances

            /**
             * LIST
             */
            let vo_list: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
                ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_LIST_LABELS, vo_type),
                group, isAccessConfVoType, AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE);
            vo_list = await ModuleAccessPolicyServer.getInstance().registerPolicy(
                vo_list,
                (vo_translation && (vo_translation != "")) ? new DefaultTranslation({ fr: 'Lister les données de type "' + vo_translation + '"' }) : null,
                await ModulesManagerServer.getInstance().getModuleVOByName(moduleTable.module ? moduleTable.module.name : null));

            await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                DAOServerController.getInstance().get_dao_dependency_default_granted(vo_list, global_access));

            await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                DAOServerController.getInstance().get_dao_dependency_default_granted(
                    vo_list,
                    DAOServerController.getInstance().get_inherited_right(
                        ModuleDAO.DAO_ACCESS_TYPE_LIST_LABELS, moduleTable.inherit_rights_from_vo_type)));

            /**
             * READ
             */
            let vo_read: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
                ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, vo_type),
                group, isAccessConfVoType, AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE);
            vo_read = await ModuleAccessPolicyServer.getInstance().registerPolicy(
                vo_read,
                (vo_translation && (vo_translation != "")) ? new DefaultTranslation({ fr: 'Consulter les données de type "' + vo_translation + '"' }) : null,
                await ModulesManagerServer.getInstance().getModuleVOByName(moduleTable.module ? moduleTable.module.name : null));

            await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                DAOServerController.getInstance().get_dao_dependency_default_denied(vo_read, vo_list));

            await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                DAOServerController.getInstance().get_dao_dependency_default_granted(vo_read, global_access));

            await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                DAOServerController.getInstance().get_dao_dependency_default_granted(
                    vo_read,
                    DAOServerController.getInstance().get_inherited_right(
                        ModuleDAO.DAO_ACCESS_TYPE_READ, moduleTable.inherit_rights_from_vo_type)));

            /**
             * INSERT OR UPDATE
             */
            let vo_insert_or_update: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
                ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, vo_type),
                group, isAccessConfVoType, AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN);
            vo_insert_or_update = await ModuleAccessPolicyServer.getInstance().registerPolicy(
                vo_insert_or_update,
                (vo_translation && (vo_translation != "")) ? new DefaultTranslation({ fr: 'Ajouter ou modifier des données de type "' + vo_translation + '"' }) : null,
                await ModulesManagerServer.getInstance().getModuleVOByName(moduleTable.module ? moduleTable.module.name : null));

            await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                DAOServerController.getInstance().get_dao_dependency_default_denied(vo_insert_or_update, vo_read));

            await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                DAOServerController.getInstance().get_dao_dependency_default_granted(vo_insert_or_update, global_access));

            await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                DAOServerController.getInstance().get_dao_dependency_default_granted(
                    vo_insert_or_update,
                    DAOServerController.getInstance().get_inherited_right(
                        ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, moduleTable.inherit_rights_from_vo_type)));

            /**
             * DELETE
             */
            let vo_delete: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
                ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_DELETE, vo_type),
                group, isAccessConfVoType, AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN);
            vo_delete = await ModuleAccessPolicyServer.getInstance().registerPolicy(
                vo_delete,
                (vo_translation && (vo_translation != "")) ? new DefaultTranslation({ fr: 'Supprimer des données de type "' + vo_translation + '"' }) : null,
                await ModulesManagerServer.getInstance().getModuleVOByName(moduleTable.module ? moduleTable.module.name : null));

            await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                DAOServerController.getInstance().get_dao_dependency_default_denied(vo_delete, vo_read));

            await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                DAOServerController.getInstance().get_dao_dependency_default_granted(vo_delete, global_access));

            await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                DAOServerController.getInstance().get_dao_dependency_default_granted(
                    vo_delete,
                    DAOServerController.getInstance().get_inherited_right(
                        ModuleDAO.DAO_ACCESS_TYPE_DELETE, moduleTable.inherit_rights_from_vo_type)));
        }
    }

    public async configure() {

        DAOServerController.getInstance().pre_update_trigger_hook = new DAOPreUpdateTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        ModuleTrigger.getInstance().registerTriggerHook(DAOServerController.getInstance().pre_update_trigger_hook);
        DAOServerController.getInstance().pre_create_trigger_hook = new DAOPreCreateTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        ModuleTrigger.getInstance().registerTriggerHook(DAOServerController.getInstance().pre_create_trigger_hook);
        DAOServerController.getInstance().pre_delete_trigger_hook = new DAOPreDeleteTriggerHook(DAOPreDeleteTriggerHook.DAO_PRE_DELETE_TRIGGER);
        ModuleTrigger.getInstance().registerTriggerHook(DAOServerController.getInstance().pre_delete_trigger_hook);

        DAOServerController.getInstance().post_update_trigger_hook = new DAOPostUpdateTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);
        ModuleTrigger.getInstance().registerTriggerHook(DAOServerController.getInstance().post_update_trigger_hook);
        DAOServerController.getInstance().post_create_trigger_hook = new DAOPostCreateTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        ModuleTrigger.getInstance().registerTriggerHook(DAOServerController.getInstance().post_create_trigger_hook);
        DAOServerController.getInstance().post_delete_trigger_hook = new DAOPostDeleteTriggerHook(DAOPostDeleteTriggerHook.DAO_POST_DELETE_TRIGGER);
        ModuleTrigger.getInstance().registerTriggerHook(DAOServerController.getInstance().post_delete_trigger_hook);

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Modifier'
        }, 'editable_page_switch.edit.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Consulter'
        }, 'editable_page_switch.read.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Annuler les modifications en cours ?'
        }, 'crud.inline_input_mode_semaphore.confirm.body.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Des modifications sont en cours'
        }, 'crud.inline_input_mode_semaphore.confirm.title.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Demande refusée : Le système est en lecture seule'
        }, 'dao.global_update_blocker.actif'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Suppression impossible, consulter les logs du serveur'
        }, 'dao.truncate.error'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Enregistrement...'
        }, 'EditablePageController.save.start.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Erreur lors de l\'enregistrement'
        }, 'EditablePageController.save.error.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Enregistrement terminé'
        }, 'EditablePageController.save.success.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Afficher / masquer les {ranges_length} elts...'
        }, 'ranges.limited.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Toutes les dates'
        }, 'tsrange.max_range.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Toutes les heures'
        }, 'hourrange.max_range.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Tous/Toutes'
        }, 'numrange.max_range.___LABEL___'));
    }

    public registerCrons(): void {
        DAOCronWorkersHandler.getInstance();
    }

    public registerAccessHook<T extends IDistantVOBase>(API_TYPE_ID: string, access_type: string, hook: IHookFilterVos<T>) {
        if (!DAOServerController.getInstance().access_hooks[API_TYPE_ID]) {
            DAOServerController.getInstance().access_hooks[API_TYPE_ID] = {};
        }
        if (!DAOServerController.getInstance().access_hooks[API_TYPE_ID][access_type]) {
            DAOServerController.getInstance().access_hooks[API_TYPE_ID][access_type] = [];
        }
        DAOServerController.getInstance().access_hooks[API_TYPE_ID][access_type].push(hook);
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDAO.APINAME_DELETE_VOS, this.deleteVOs.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDAO.APINAME_DELETE_VOS_BY_IDS, this.deleteVOsByIds.bind(this));

        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDAO.APINAME_INSERT_OR_UPDATE_VOS, this.insertOrUpdateVOs.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDAO.APINAME_INSERT_OR_UPDATE_VO, this.insertOrUpdateVO.bind(this));

        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDAO.APINAME_GET_VO_BY_ID, this.getVoById.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDAO.APINAME_GET_VOS, this.getVos.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDAO.APINAME_GET_VOS_BY_IDS, this.getVosByIds.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDAO.APINAME_GET_VOS_BY_IDS_RANGES, this.getVosByIdsRanges.bind(this));

        // APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDAO.APINAME_FILTER_VOS_BY_FIELD_RANGES, this.filterVosByFieldRanges.bind(this));
        // APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDAO.APINAME_FILTER_VOS_BY_FIELD_RANGES_INTERSECTIONS, this.filterVosByFieldRangesIntersections.bind(this));
        // APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDAO.APINAME_GET_VOS_BY_EXACT_FIELD_RANGE, this.getVosByExactFieldRange.bind(this));

        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDAO.APINAME_getVarImportsByMatroidParams, this.getVarImportsByMatroidParams.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDAO.APINAME_FILTER_VOS_BY_MATROIDS, this.filterVosByMatroids.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDAO.APINAME_FILTER_VOS_BY_MATROIDS_INTERSECTIONS, this.filterVosByMatroidsIntersections.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDAO.APINAME_GET_VOS_BY_EXACT_MATROIDS, this.getVosByExactMatroid.bind(this));

        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDAO.APINAME_GET_VOS_BY_REFFIELD_IDS, this.getVosByRefFieldIds.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDAO.APINAME_GET_VOS_BY_REFFIELDS_IDS, this.getVosByRefFieldsIds.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDAO.APINAME_GET_VOS_BY_REFFIELDS_IDS_AND_FIELDS_STRING, this.getVosByRefFieldsIdsAndFieldsString.bind(this));

        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDAO.APINAME_GET_NAMED_VO_BY_NAME, this.getNamedVoByName.bind(this));

        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDAO.APINAME_GET_BASE_URL, this.getBaseUrl.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDAO.APINAME_truncate, this.truncate_api.bind(this));

    }

    public checkAccessSync<T extends IDistantVOBase>(datatable: ModuleTable<T>, access_type: string): boolean {

        if (!datatable) {
            ConsoleHandler.getInstance().error('checkAccessSync:!datatable');
            return false;
        }

        if (!ModuleAccessPolicy.getInstance().actif) {
            return true;
        }

        // On applique les accès au global sur le droit de faire un SELECT
        return ModuleAccessPolicyServer.getInstance().checkAccessSync(ModuleDAO.getInstance().getAccessPolicyName(access_type, datatable.vo_type));
    }

    public async preload_segmented_known_database(t: ModuleTable<any>) {
        let segments_by_segmented_value: { [segmented_value: number]: string } = await ModuleTableDBService.getInstance(null).get_existing_segmentations_tables_of_moduletable(t);

        for (let i in segments_by_segmented_value) {
            let table_name = segments_by_segmented_value[i];

            DAOServerController.getInstance().add_segmented_known_databases(t.database, table_name, parseInt(i.toString()));
        }
    }

    public has_segmented_known_database(t: ModuleTable<any>, segment_value: number): boolean {
        if ((!DAOServerController.getInstance().segmented_known_databases[t.database]) || (!DAOServerController.getInstance().segmented_known_databases[t.database][t.get_segmented_name(segment_value)])) {
            return false;
        }
        return true;
    }

    public async getSumFieldFilterByMatroids(
        api_type_id: string,
        field_id: string,
        matroids: IMatroid[],
        fields_ids_mapper: { [matroid_field_id: string]: string }): Promise<number> {

        if ((!matroids) || (!matroids.length)) {
            return null;
        }

        let moduleTable: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];

        if (!moduleTable) {
            return null;
        }

        // On vérifie qu'on peut faire un select
        if (!this.checkAccessSync(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        let value: number = 0;
        for (let matroid_i in matroids) {
            let matroid: VarDataBaseVO = matroids[matroid_i] as VarDataBaseVO;

            if (!matroid) {
                ConsoleHandler.getInstance().error('Matroid vide:getSumFieldFilterByMatroids:' + api_type_id + ':' + (matroid ? matroid._type : null) + ':');
                continue;
            }

            let filter_by_matroid_clause: string = ModuleDAOServer.getInstance().getWhereClauseForFilterByMatroid(api_type_id, matroid, fields_ids_mapper, 't', moduleTable.full_name);

            if (!filter_by_matroid_clause) {
                continue;
            }

            let res = await ModuleServiceBase.getInstance().db.query("SELECT sum(t." + field_id + ") res FROM " + moduleTable.full_name + " t WHERE  " +
                filter_by_matroid_clause + ";");

            if ((!res) || (!res[0]) || (res[0]['res'] == null) || (typeof res[0]['res'] == 'undefined')) {
            } else {
                value += parseFloat(res[0]['res']);
            }
        }

        return value;
    }

    /**
     * Objectif : Renvoyer la partie de la requête à intégrer dans le where pour faire un filter by matroid (inclusif, pas intersect)
     * Return null si on a pas de filtre
     * @param api_type_id
     * @param matroid
     * @param fields_ids_mapper
     */
    public getWhereClauseForFilterByMatroid<T extends IDistantVOBase>(
        api_type_id: string,
        matroid: IMatroid,
        fields_ids_mapper: { [matroid_field_id: string]: string },
        table_name: string = 't',
        full_name: string,
        exact_search_for_these_fields: { [matroid_field_id: string]: number } = {}): string {

        if (!matroid) {
            return null;
        }

        if (!api_type_id) {
            return null;
        }

        // Si le mapper est null, on veut tout, donc on renvoie true
        //  et si le mapper est undefined on veut pas remapper les champs tout simplement
        if (fields_ids_mapper === null) {
            return 'true';
        }

        if (!fields_ids_mapper) {
            fields_ids_mapper = {};
        }

        let moduleTable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];

        if (!moduleTable) {
            return null;
        }

        // Sur chaque base, on doit faire un regroupement, une union des ranges avant de faire la requête
        //  On veut pour chaque base les éléments qui sont FOREACH (ranges_bdd) => range_bdd <@ ANY ranges_requete
        //  On doit identifier les bases qui (une fois groupées) sont de cardinal 1 et les autres
        //  Si une base est de cardinal 1, on peut faire la requete en range_requete @> ALL(ranges_bdd)
        //  Pour les cardinaux sup 1 :
        // https://stackoverflow.com/questions/59576059/postgresql-alla-anyb/59576985#59576985
        /**
         * select *
         *    from ref.module_var_crescendo_day_dr t1
         *    where (
         *        select count(1)
         *        from (
         *            select unnest(marque_id_ranges) a
         *            from ref.module_var_crescendo_day_dr t2
         *            where t2.id=t1.id
         *        ) t
         *        where t.a <@ ANY(ARRAY['[1,2)'::numrange])) = array_length(marque_id_ranges,1);
         */

        // On stocke les ranges par field cible en bdd
        let matroid_fields_ranges_by_datatable_field_id: { [field_id: string]: Array<IRange<any>> } = this.get_matroid_fields_ranges_by_datatable_field_id(matroid, moduleTable, fields_ids_mapper);

        if (!matroid_fields_ranges_by_datatable_field_id) {
            return null;
        }

        // On calcul les unions
        // ATTENTION c'est extrêment important pour la partie cardinal > 1
        //  Par contre il faut surtout pas le faire pour les fields combinatoires :)
        for (let field_id in matroid_fields_ranges_by_datatable_field_id) {

            if (exact_search_for_these_fields && (exact_search_for_these_fields[field_id] != null) && (typeof exact_search_for_these_fields[field_id] != 'undefined')) {
                continue;
            }

            matroid_fields_ranges_by_datatable_field_id[field_id] = RangeHandler.getInstance().getRangesUnion(matroid_fields_ranges_by_datatable_field_id[field_id]) as Array<IRange<any>>;
        }

        // On stock l'info du type (cardinal 1 ou n pour chaque field du param)
        let field_is_cardinal_supp_1: { [field_id: string]: boolean } = {};
        for (let field_id in matroid_fields_ranges_by_datatable_field_id) {
            let matroid_field_range_by_datatable_field_id = matroid_fields_ranges_by_datatable_field_id[field_id];

            field_is_cardinal_supp_1[field_id] = !((!!matroid_field_range_by_datatable_field_id) && (matroid_field_range_by_datatable_field_id.length == 1));
        }

        let matroid_fields: Array<ModuleTableField<any>> = MatroidController.getInstance().getMatroidFields(matroid._type);
        let matroid_fields_by_ids: { [field_id: string]: ModuleTableField<any> } = {};

        for (let i in matroid_fields) {
            let matroid_field = matroid_fields[i];

            matroid_fields_by_ids[matroid_field.field_id] = matroid_field;
        }

        // On veut la matrice inverse
        let fields_ids_mapper_inverted: { [datatable_field_id: string]: string } = {};
        for (let matroid_field_id in fields_ids_mapper) {
            if (!fields_ids_mapper[matroid_field_id]) {
                continue;
            }
            fields_ids_mapper_inverted[fields_ids_mapper[matroid_field_id]] = matroid_field_id;
        }

        let where_clause: string = '';

        // On ajoute un segment dédié à la gestion des vars pour faciliter le fonctionnement
        // Si on a un param de type varparam ou vardata, et une cible de type vardata, on ajoute un filtrage sur le var_id, si il existe dans le param
        if (!!(matroid as VarDataBaseVO).var_id) {

            if (!!moduleTable.getFieldFromId('var_id')) {
                where_clause += '(var_id = ' + (matroid as VarDataBaseVO).var_id + ') AND ';
            }
        }

        let first = true;
        for (let field_id in matroid_fields_ranges_by_datatable_field_id) {

            // Si le mapping est undefined, on prend le champ avec le mêeme nom, si lee mapping est nul, on prend rien
            if (fields_ids_mapper_inverted[field_id] === null) {
                continue;
            }

            let matroid_field = matroid_fields_by_ids[fields_ids_mapper_inverted[field_id] ? fields_ids_mapper_inverted[field_id] : field_id];
            let field_ranges: Array<IRange<any>> = matroid_fields_ranges_by_datatable_field_id[field_id];
            let field = moduleTable.getFieldFromId(field_id);

            if ((!field) || (!field_ranges) || (!field_ranges.length)) {
                ConsoleHandler.getInstance().error('((!field) || (!field_ranges)) on filterVosByMatroid should not happen');
                continue;
            }

            where_clause += first ? "(" : ") AND (";

            first = false;

            if (exact_search_for_these_fields && (exact_search_for_these_fields[matroid_field.field_id] != null) && (typeof exact_search_for_these_fields[matroid_field.field_id] != 'undefined')) {
                where_clause += this.get_ranges_query_exact_search(field, matroid_field.field_type, field_ranges, table_name);
                continue;
            }

            if (field_is_cardinal_supp_1[field.field_id]) {
                where_clause += this.get_ranges_query_cardinal_supp_1(field, matroid_field.field_type, field_ranges, table_name, full_name);
            } else {
                where_clause += this.get_ranges_query_cardinal_1(field, matroid_field.field_type, field_ranges[0], table_name);
            }
        }
        if (first) {
            return null;
        }

        where_clause += ')';

        return where_clause;
    }

    /**
     * TODO : A relire, c'est un copie rapide de filtervoby matroid intersection
     */
    public getWhereClauseForFilterByMatroidIntersection<T extends IDistantVOBase>(
        api_type_id: string,
        matroid: IMatroid,
        fields_ids_mapper: { [matroid_field_id: string]: string }): string {

        if (!matroid) {
            ConsoleHandler.getInstance().error('Matroid vide:' + api_type_id + ':' + (matroid ? matroid._type : null) + ':');
            return null;
        }

        let moduleTable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];

        if (!moduleTable) {
            return null;
        }

        let first_matroid = true;

        let where_clause: string = "";

        // On ajoute un segment dédié à la gestion des vars pour faciliter le fonctionnement
        // Si on a un param de type varparam ou vardata, et une cible de type vardata, on ajoute un filtrage sur le var_id, si il existe dans le param
        if (!!(matroid as VarDataBaseVO).var_id) {

            if (!!moduleTable.getFieldFromId('var_id')) {
                where_clause += '(var_id = ' + (matroid as VarDataBaseVO).var_id + ') AND ';
            }
        }

        let matroid_fields = MatroidController.getInstance().getMatroidFields(matroid._type);

        let first = true;
        for (let i in matroid_fields) {
            let matroid_field = matroid_fields[i];
            let ranges: Array<IRange<any>> = matroid[matroid_field.field_id];
            let field = moduleTable.getFieldFromId((fields_ids_mapper && fields_ids_mapper[matroid_field.field_id]) ? fields_ids_mapper[matroid_field.field_id] : matroid_field.field_id);

            if (!field) {
                continue;
            }

            if (moduleTable.is_segmented && (field.field_id == moduleTable.table_segmented_field.field_id)) {
                continue;
            }

            if ((!ranges) || (!ranges.length)) {
                ConsoleHandler.getInstance().error('Matroid field vide ou inexistant:' + api_type_id + ':' + matroid_fields[i].field_id + ':');
                return null;
            }

            where_clause += first ? "(" : ") AND (";
            let first_in_clause = true;

            for (let j in ranges) {
                let field_range: IRange<any> = ranges[j];

                if (!RangeHandler.getInstance().isValid(field_range)) {
                    ConsoleHandler.getInstance().error('field_range invalid:' + api_type_id + ':' + JSON.stringify(field_range) + ':');
                    return null;
                }

                where_clause += first_in_clause ? "" : " OR ";

                first = false;
                first_in_clause = false;
                first_matroid = false;

                where_clause += this.getClauseWhereRangeIntersectsField(field, field_range);
            }
        }
        if (first) {
            return null;
        }
        where_clause += ")";

        if (first_matroid) {
            return null;
        }

        return where_clause;
    }

    public async truncate_api(api_type_id: string) {
        await this.truncate(api_type_id);
    }


    public async truncate(api_type_id: string, ranges: Array<IRange<any>> = null) {

        if (this.global_update_blocker) {
            let uid: number = StackContext.getInstance().get('UID');
            let CLIENT_TAB_ID: string = StackContext.getInstance().get('CLIENT_TAB_ID');
            if (uid && CLIENT_TAB_ID) {
                this.throttled_refuse({ [uid]: { [CLIENT_TAB_ID]: true } });
            }
            return null;
        }

        let datatable: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];

        if (!datatable) {
            ConsoleHandler.getInstance().error("Impossible de trouver le datatable ! " + api_type_id);
            return null;
        }

        try {

            if (datatable.is_segmented) {

                if (!ranges) {
                    ranges = this.get_all_ranges_from_segmented_table(datatable);
                }

                if ((!ranges) || (RangeHandler.getInstance().getCardinalFromArray(ranges) < 1)) {
                    return null;
                }

                let self = this;
                await RangeHandler.getInstance().foreach_ranges(ranges, async (segment_value) => {

                    if (!self.has_segmented_known_database(datatable, segment_value)) {
                        return;
                    }
                    await ModuleServiceBase.getInstance().db.none("TRUNCATE " + datatable.get_segmented_full_name(segment_value) + " CASCADE;");

                }, datatable.table_segmented_field_segment_type);
            } else {
                await ModuleServiceBase.getInstance().db.none("TRUNCATE " + datatable.full_name + " CASCADE;");
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            let uid: number = StackContext.getInstance().get('UID');
            let CLIENT_TAB_ID: string = StackContext.getInstance().get('CLIENT_TAB_ID');
            await PushDataServerController.getInstance().notifySimpleERROR(uid, CLIENT_TAB_ID, 'dao.truncate.error', true);
        }
    }


    public async selectAll<T extends IDistantVOBase>(
        API_TYPE_ID: string, query: string = null, queryParams: any[] = null, depends_on_api_type_ids: string[] = null,
        distinct: boolean = false, ranges: Array<IRange<any>> = null, limit: number = 0, offset: number = 0): Promise<T[]> {

        let moduleTable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[API_TYPE_ID];

        // On vérifie qu'on peut faire un select
        if (!this.checkAccessSync(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        if (moduleTable.is_segmented) {

            // Si on est sur une table segmentée on adapte le comportement
            if (!ranges) {
                ranges = this.get_all_ranges_from_segmented_table(moduleTable);
            }

            if ((!ranges) || (RangeHandler.getInstance().getCardinalFromArray(ranges) < 1)) {
                return null;
            }

            let segmented_res: T[] = [];

            let self = this;
            await RangeHandler.getInstance().foreach_ranges(ranges, async (segment_value) => {

                // UNION ALL plutôt que x requetes non ? => attention dans ce cas la query doit surtout pas avoir un ;
                //  Grosse blague TODO FIXME : quid d'un limit ???? il se lance à chaque requête... résultat on a bcp plus de res que la limit
                // OFFSET complètement invalide sur une table segmentée ....

                if (!self.has_segmented_known_database(moduleTable, segment_value)) {
                    return;
                }

                let segment_res = moduleTable.forceNumerics(await ModuleServiceBase.getInstance().db.query(
                    "SELECT " + (distinct ? 'distinct' : '') + " t.* FROM " + moduleTable.get_segmented_full_name(segment_value) + " t " +
                    (query ? query : '') + (limit ? ' limit ' + limit : ''), queryParams ? queryParams : []) as T[]);
                for (let i in segment_res) {
                    segmented_res.push(segment_res[i]);
                }
            }, moduleTable.table_segmented_field_segment_type);

            if (limit) {
                segmented_res.splice(limit, segmented_res.length - limit);
            }

            // On filtre les res suivant les droits d'accès
            return await this.filterVOsAccess(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ, segmented_res);
        }

        let res: T[] = moduleTable.forceNumerics(await ModuleServiceBase.getInstance().db.query(
            "SELECT " + (distinct ? 'distinct' : '') + " t.* FROM " + moduleTable.full_name + " t " +
            (query ? query : '') + (limit ? ' limit ' + limit : '') + (offset ? ' offset ' + offset : ''), queryParams ? queryParams : []) as T[]);

        // On filtre les res suivant les droits d'accès
        return await this.filterVOsAccess(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ, res);
    }

    public async selectOne<T extends IDistantVOBase>(API_TYPE_ID: string, query: string = null, queryParams: any[] = null, depends_on_api_type_ids: string[] = null, ranges: Array<IRange<any>> = null): Promise<T> {
        let moduleTable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[API_TYPE_ID];

        // On vérifie qu'on peut faire un select
        if (!this.checkAccessSync(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        if (moduleTable.is_segmented) {

            // Si on est sur une table segmentée on adapte le comportement
            if (!ranges) {
                ranges = this.get_all_ranges_from_segmented_table(moduleTable);
            }

            if ((!ranges) || (RangeHandler.getInstance().getCardinalFromArray(ranges) < 1)) {
                return null;
            }

            let segmented_vo: T = null;
            let error: boolean = false;
            let self = this;
            await RangeHandler.getInstance().foreach_ranges(ranges, async (segment_value) => {

                if (!self.has_segmented_known_database(moduleTable, segment_value)) {
                    return;
                }

                let segment_vo: T = await ModuleServiceBase.getInstance().db.oneOrNone("SELECT t.* FROM " + moduleTable.get_segmented_full_name(segment_value) + " t " + (query ? query : '') + ";", queryParams ? queryParams : []) as T;

                if ((!!segmented_vo) && (!!segment_vo)) {
                    ConsoleHandler.getInstance().error('More than one result on selectOne on segmented table :' + moduleTable.get_segmented_full_name(segment_value) + ';');
                    error = true;
                }

                if (!!segment_vo) {
                    segmented_vo = segment_vo;
                }
            }, moduleTable.table_segmented_field_segment_type);

            if (error) {
                return null;
            }

            segmented_vo = moduleTable.forceNumeric(segmented_vo);

            // On filtre les vo suivant les droits d'accès
            return await this.filterVOAccess(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ, segmented_vo);
        }

        let vo: T = await ModuleServiceBase.getInstance().db.oneOrNone("SELECT t.* FROM " + moduleTable.full_name + " t " + (query ? query : '') + ";", queryParams ? queryParams : []) as T;
        vo = moduleTable.forceNumeric(vo);

        // On filtre suivant les droits d'accès
        return await this.filterVOAccess(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ, vo);
    }

    /**
     * DONT USE : N'utiliser que en cas de force majeure => exemple upgrade de format de BDD
     * @param query
     */
    public async query(query: string = null, values: any = null): Promise<any> {

        if (this.global_update_blocker) {
            let uid: number = StackContext.getInstance().get('UID');
            let CLIENT_TAB_ID: string = StackContext.getInstance().get('CLIENT_TAB_ID');
            if (uid && CLIENT_TAB_ID) {
                this.throttled_refuse({ [uid]: { [CLIENT_TAB_ID]: true } });
            }
            return null;
        }

        // On vérifie qu'on peut faire des modifs de table modules
        if (!ModuleAccessPolicyServer.getInstance().checkAccessSync(ModuleDAO.DAO_ACCESS_QUERY)) {
            return null;
        }

        if (!!values) {

            return await ModuleServiceBase.getInstance().db.query(query, values);
        } else {
            return await ModuleServiceBase.getInstance().db.query(query);
        }
    }

    /**
     * Cas très spécifique de la connexion où l'on a évidemment pas le droit de lister les comptes, mais il faut tout de même pouvoir se connecter...
     */
    public async selectOneUser(login: string, password: string): Promise<UserVO> {
        let datatable: ModuleTable<UserVO> = VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID];

        try {
            let vo: UserVO = await ModuleServiceBase.getInstance().db.oneOrNone("SELECT t.* FROM " + datatable.full_name + " t " + "WHERE (TRIM(LOWER(name)) = $1 OR TRIM(LOWER(email)) = $1 or TRIM(LOWER(phone)) = $1) AND password = crypt($2, password)", [login.toLowerCase().trim(), password]) as UserVO;
            vo = datatable.forceNumeric(vo);
            return vo;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        return null;
    }

    /**
     * Cas très spécifique du check d'unicité
     */
    public async selectUsersForCheckUnicity(name: string, email: string, phone: string, user_id: number): Promise<boolean> {
        let datatable: ModuleTable<UserVO> = VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID];

        try {
            let vos: UserVO[] = await ModuleServiceBase.getInstance().db.query(
                "SELECT t.* FROM " + datatable.full_name + " t " +
                " WHERE " +
                " (TRIM(LOWER(name)) = $1 OR TRIM(LOWER(email)) = $1 or TRIM(LOWER(phone)) = $1) " + " OR " +
                " (TRIM(LOWER(name)) = $2 OR TRIM(LOWER(email)) = $2 or TRIM(LOWER(phone)) = $2) " + (phone ? (" OR " +
                    " (TRIM(LOWER(name)) = $3 OR TRIM(LOWER(email)) = $3 or TRIM(LOWER(phone)) = $3);") : ";"),
                [name.toLowerCase().trim(), email.toLowerCase().trim(), phone ? phone.toLowerCase().trim() : null]) as UserVO[];
            vos = datatable.forceNumerics(vos);

            if ((!vos) || (!vos[0])) {
                return true;
            }

            if (vos.length > 1) {
                return false;
            }

            if (vos[0].id != user_id) {
                return false;
            }

            return true;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        return false;
    }

    /**
     * Cas très spécifique du recover de MDP => attention cette fonction ne doit jamais être utiliser en dehors sinon on offre le listage des users à tous (c'est pas le but...)
     */
    public async selectOneUserForRecovery(login: string): Promise<UserVO> {
        let datatable: ModuleTable<UserVO> = VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID];

        try {
            let vo: UserVO = await ModuleServiceBase.getInstance().db.oneOrNone("SELECT t.* FROM " + datatable.full_name + " t " + "WHERE (TRIM(LOWER(name)) = $1 OR TRIM(LOWER(email)) = $1 or TRIM(LOWER(phone)) = $1) and blocked = false", [login.toLowerCase().trim()]) as UserVO;
            vo = datatable.forceNumeric(vo);
            return vo;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        return null;
    }

    /**
     * Cas très spécifique du recover de MDP => attention cette fonction ne doit jamais être utiliser en dehors sinon on offre le listage des users à tous (c'est pas le but...)
     */
    public async selectOneUserForRecoveryUID(uid: number): Promise<UserVO> {
        let datatable: ModuleTable<UserVO> = VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID];

        let vo: UserVO = await ModuleServiceBase.getInstance().db.oneOrNone("SELECT t.* FROM " + datatable.full_name + " t " + "WHERE id = $1 and blocked = false", [uid]) as UserVO;
        vo = datatable.forceNumeric(vo);
        return vo;
    }

    public getClauseWhereRangeIntersectsField(field: ModuleTableField<any>, intersector_range: IRange<any>): string {
        switch (field.field_type) {

            case ModuleTableField.FIELD_TYPE_email:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_translatable_text:
            case ModuleTableField.FIELD_TYPE_textarea:
                if (intersector_range.range_type == TSRange.RANGE_TYPE) {
                    return field.field_id + "::timestamp with time zone <@ '" + (intersector_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(intersector_range.min) + "," + DateHandler.getInstance().formatDayForIndex(intersector_range.max) + (intersector_range.max_inclusiv ? "]" : ")") + "'::tstzrange";
                }
                break;

            case ModuleTableField.FIELD_TYPE_int:
            case ModuleTableField.FIELD_TYPE_enum:
            case ModuleTableField.FIELD_TYPE_image_ref:
            case ModuleTableField.FIELD_TYPE_file_ref:
            case ModuleTableField.FIELD_TYPE_foreign_key:
                // Si on vise un type int, on sait que si le max = min + 1 et segment type du range = int et max exclusiv on est cool, on peut passer par un = directement.
                // Sinon on fait comme pour les float et autres, on prend >= ou > et <= ou < suivant inclusive ou inclusive
                if ((intersector_range.segment_type == NumSegment.TYPE_INT) && (intersector_range.min_inclusiv && !intersector_range.max_inclusiv) && (intersector_range.min == (intersector_range.max - 1))) {
                    // TODO : généraliser le concept, là on spécifie un truc très particulier pour faire vite et efficace, mais ya d'autres cas qu'on peut optimiser de la sorte
                    return field.field_id + " = " + intersector_range.min;
                }

            case ModuleTableField.FIELD_TYPE_amount:
            case ModuleTableField.FIELD_TYPE_float:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
            case ModuleTableField.FIELD_TYPE_prct:
                return field.field_id + " >" + (intersector_range.min_inclusiv ? "=" : "") + " " + intersector_range.min + " and " + field.field_id + " <" + (intersector_range.max_inclusiv ? "=" : "") + " " + intersector_range.max;

            case ModuleTableField.FIELD_TYPE_tstz:
                return field.field_id + " >" + (intersector_range.min_inclusiv ? "=" : "") + " " + DateHandler.getInstance().getUnixForBDD(intersector_range.min) + " and " + field.field_id + " <" + (intersector_range.max_inclusiv ? "=" : "") + " " + DateHandler.getInstance().getUnixForBDD(intersector_range.max);

            case ModuleTableField.FIELD_TYPE_tstz_array:
                return "'" + (intersector_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().getUnixForBDD(intersector_range.min) + "," + DateHandler.getInstance().getUnixForBDD(intersector_range.max) + (intersector_range.max_inclusiv ? "]" : ")") + "'::numrange && ANY (" + field.field_id + "::numeric[])";

            case ModuleTableField.FIELD_TYPE_int_array:
                return "'" + (intersector_range.min_inclusiv ? "[" : "(") + intersector_range.min + "," + intersector_range.max + (intersector_range.max_inclusiv ? "]" : ")") + "'::numrange && ANY (" + field.field_id + "::numeric[])";

            case ModuleTableField.FIELD_TYPE_isoweekdays:
            case ModuleTableField.FIELD_TYPE_refrange_array:
            case ModuleTableField.FIELD_TYPE_numrange_array:
                return "'" + (intersector_range.min_inclusiv ? "[" : "(") + intersector_range.min + "," + intersector_range.max + (intersector_range.max_inclusiv ? "]" : ")") + "'::numrange && ANY (" + field.field_id + "::numrange[])";

            case ModuleTableField.FIELD_TYPE_date:
            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_month:
                return field.field_id + "::date <@ '" + (intersector_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(intersector_range.min) + "," + DateHandler.getInstance().formatDayForIndex(intersector_range.max) + (intersector_range.max_inclusiv ? "]" : ")") + "'::daterange";

            case ModuleTableField.FIELD_TYPE_timestamp:
            case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                // TODO FIXME
                break;

            case ModuleTableField.FIELD_TYPE_daterange:
                return field.field_id + " && '" + (intersector_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(intersector_range.min) + "," + DateHandler.getInstance().formatDayForIndex(intersector_range.max) + (intersector_range.max_inclusiv ? "]" : ")") + "'::daterange";

            case ModuleTableField.FIELD_TYPE_tsrange:
                return field.field_id + " && '" + (intersector_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().getUnixForBDD(intersector_range.min) + "," + DateHandler.getInstance().getUnixForBDD(intersector_range.max) + (intersector_range.max_inclusiv ? "]" : ")") + "'::numrange";

            case ModuleTableField.FIELD_TYPE_numrange:
                return field.field_id + " && '" + (intersector_range.min_inclusiv ? "[" : "(") + intersector_range.min + "," + intersector_range.max + (intersector_range.max_inclusiv ? "]" : ")") + "'::numrange";

            case ModuleTableField.FIELD_TYPE_tstzrange_array:
                return "'" + (intersector_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().getUnixForBDD(intersector_range.min) + "," + DateHandler.getInstance().getUnixForBDD(intersector_range.max) + (intersector_range.max_inclusiv ? "]" : ")") + "'::numrange && ANY (" + field.field_id + "::numrange[])";

            case ModuleTableField.FIELD_TYPE_hourrange:
                return field.field_id + " && '" + (intersector_range.min_inclusiv ? "[" : "(") + (intersector_range.min as Duration).asMilliseconds() + "," + (intersector_range.max as Duration).asMilliseconds() + (intersector_range.max_inclusiv ? "]" : ")") + "'::numrange";

            case ModuleTableField.FIELD_TYPE_hourrange_array:
                return "'" + (intersector_range.min_inclusiv ? "[" : "(") + (intersector_range.min as Duration).asMilliseconds() + "," + (intersector_range.max as Duration).asMilliseconds() + (intersector_range.max_inclusiv ? "]" : ")") + "'::numrange && ANY (" + field.field_id + "::numrange[])";

            case ModuleTableField.FIELD_TYPE_geopoint:
            default:
                return null;
        }
    }

    /**
     * Fonction qui vérifie chaque champ de foreign ref et qui si la bdd ne gère pas la foreign key le fait (vérifie
     * que l'id ciblé existe bien, sinon on refuse l'insertion)
     */
    private async filterByForeignKeys<T extends IDistantVOBase>(vos: T[]): Promise<T[]> {
        let res: T[] = [];

        for (let i in vos) {
            let vo = vos[i];

            let moduleTable: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[vo._type];

            if (!moduleTable) {
                return null;
            }

            let fields = moduleTable.get_fields();
            let refuse: boolean = false;
            for (let j in fields) {
                let field = fields[j];

                if ((!field.has_relation) || field.has_single_relation) {
                    // géré par la bdd directement
                    continue;
                }

                if (!vo[field.field_id]) {
                    // champs vide, inutile de checker
                    continue;
                }

                refuse = true;
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_refrange_array:
                    case ModuleTableField.FIELD_TYPE_numrange_array:

                        if (!(vo[field.field_id] as any[]).length) {
                            // champs vide, inutile de checker
                            break;
                        }

                        let targets: IDistantVOBase[] = await this.getVosByIdsRanges(field.manyToOne_target_moduletable.vo_type, vo[field.field_id]);
                        if (targets.length == RangeHandler.getInstance().getCardinalFromArray(vo[field.field_id])) {
                            refuse = false;
                        }
                        break;
                    default:
                }

                if (refuse) {
                    break;
                }
            }

            if (!refuse) {
                res.push(vo);
            }
        }

        return res;
    }

    private async insertOrUpdateVOs<T extends IDistantVOBase>(vos: T[]): Promise<InsertOrDeleteQueryResult[]> {

        if (this.global_update_blocker) {
            let uid: number = StackContext.getInstance().get('UID');
            let CLIENT_TAB_ID: string = StackContext.getInstance().get('CLIENT_TAB_ID');
            if (uid && CLIENT_TAB_ID) {
                this.throttled_refuse({ [uid]: { [CLIENT_TAB_ID]: true } });
            }
            return null;
        }

        // On vérifie qu'on peut faire un insert ou update
        if ((!vos) || (!vos.length) || (!vos[0]) || (!vos[0]._type) || (!VOsTypesManager.getInstance().moduleTables_by_voType[vos[0]._type])) {
            return null;
        }
        if (!this.checkAccessSync(VOsTypesManager.getInstance().moduleTables_by_voType[vos[0]._type], ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE)) {
            return null;
        }

        // On ajoute un filtrage via hook
        let tmp_vos = [];
        for (let i in vos) {
            let vo = vos[i];
            let tmp_vo = await this.filterVOAccess(VOsTypesManager.getInstance().moduleTables_by_voType[vo._type], ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, vo);

            if (!!tmp_vo) {
                tmp_vos.push(tmp_vo);
            }
        }
        if ((!tmp_vos) || (!tmp_vos.length)) {
            return null;
        }
        vos = tmp_vos;

        vos = await this.filterByForeignKeys(vos);
        if ((!vos) || (!vos.length)) {
            return null;
        }

        let self = this;

        return new Promise<any[]>(async (resolve, reject) => {

            let isUpdates: boolean[] = [];
            let preUpdates: IDistantVOBase[] = [];

            let sqls = [];
            let bdd_versions = [];
            for (let i in vos) {
                let vo: IDistantVOBase = vos[i];

                let moduleTable: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[vo._type];

                if (!moduleTable) {
                    return null;
                }

                /**
                 * Si on a des fields de type unique, et pas de id fourni, on veut tester de charger depuis la bdd un objet avec
                 *  la même valeur de champ unique. si on trouve on passe en update au lieu d'insert
                 */
                if (!vo.id) {

                    let fields = moduleTable.get_fields();
                    for (let fieldi in fields) {
                        let field = fields[fieldi];

                        if (field.is_unique && !!vo[field.field_id]) {

                            let check_this_uniq_field =
                                'select * from ' + moduleTable.full_name + ' t where ' +
                                self.get_simple_field_query(field, vo[field.field_id]);

                            try {
                                let uniq_refs = moduleTable.forceNumerics(await self.query(check_this_uniq_field)) as T[];
                                if (uniq_refs && (uniq_refs.length == 1)) {
                                    vo.id = uniq_refs[0].id;
                                    break;
                                }
                            } catch (error) {
                                ConsoleHandler.getInstance().error(error);
                            }
                        }
                    }
                }

                isUpdates[i] = vo.id ? true : false;
                preUpdates[i] = null;

                /**
                 * Si on est sur un update et si on a des triggers de mise à jour on veut récupérer le vo en base avant de l'écraser pour le passer aux triggers
                 */
                if (vo.id) {

                    if (DAOServerController.getInstance().pre_update_trigger_hook.has_trigger(vo._type) || DAOServerController.getInstance().post_update_trigger_hook.has_trigger(vo._type)) {
                        preUpdates[i] = await ModuleDAO.getInstance().getVoById<any>(vo._type, vo.id);
                    }
                }

                let sql: string = await this.getqueryfor_insertOrUpdateVO(vo, preUpdates[i]);

                if (!sql) {
                    continue;
                }

                sqls.push(sql);
                bdd_versions.push(moduleTable.get_bdd_version(vo));
            }

            let results: InsertOrDeleteQueryResult[] = null;

            if (sqls.length > 0) {
                results = await ModuleServiceBase.getInstance().db.tx(async (t) => {

                    let queries: any[] = [];

                    for (let i in sqls) {
                        let sql: string = sqls[i];
                        let vo = bdd_versions[i];

                        queries.push(t.oneOrNone(sql, vo));
                    }

                    return t.batch(queries);
                }).catch((reason) => {
                    ConsoleHandler.getInstance().error('insertOrUpdateVOs :' + reason);
                    resolve(null);
                });
            }

            if (results && isUpdates && (isUpdates.length == results.length) && vos && (vos.length == results.length)) {
                for (let i in results) {

                    if (isUpdates[i]) {
                        await DAOServerController.getInstance().post_update_trigger_hook.trigger(vos[i]._type, new DAOUpdateVOHolder(preUpdates[i], vos[i]));
                    } else {
                        vos[i].id = parseInt(results[i].id.toString());
                        await DAOServerController.getInstance().post_create_trigger_hook.trigger(vos[i]._type, vos[i]);
                    }
                }
            }

            let InsertOrDeleteQueryResults: InsertOrDeleteQueryResult[] = [];
            if (results && results.length) {
                for (let i in results) {
                    let result = results[i];
                    InsertOrDeleteQueryResults.push(new InsertOrDeleteQueryResult((result && result.id) ? parseInt(result.id.toString()) : null));
                }
            }

            resolve(InsertOrDeleteQueryResults);
        });
    }

    private async insertOrUpdateVO(vo: IDistantVOBase): Promise<InsertOrDeleteQueryResult> {

        if (this.global_update_blocker) {
            let uid: number = StackContext.getInstance().get('UID');
            let CLIENT_TAB_ID: string = StackContext.getInstance().get('CLIENT_TAB_ID');
            if (uid && CLIENT_TAB_ID) {
                this.throttled_refuse({ [uid]: { [CLIENT_TAB_ID]: true } });
            }
            return null;
        }

        // On vérifie qu'on peut faire un insert ou update
        if ((!vo) || (!vo._type) || (!VOsTypesManager.getInstance().moduleTables_by_voType[vo._type])) {
            return null;
        }
        if (!this.checkAccessSync(VOsTypesManager.getInstance().moduleTables_by_voType[vo._type], ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE)) {
            return null;
        }

        // On ajoute un filtrage via hook
        let tmp_vo = await this.filterVOAccess(VOsTypesManager.getInstance().moduleTables_by_voType[vo._type], ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, vo);

        if (!tmp_vo) {
            return null;
        }
        vo = tmp_vo;

        let vos = await this.filterByForeignKeys([vo]);

        if ((!vos) || (vos.length != 1)) {
            return null;
        }

        let self = this;

        return new Promise<InsertOrDeleteQueryResult>(async (resolve, reject) => {

            let isUpdate: boolean = vo.id ? true : false;
            let preUpdate: IDistantVOBase = null;

            let moduleTable: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[vo._type];

            if (!moduleTable) {
                resolve(null);
                return null;
            }

            /**
             * Si on a des fields de type unique, et pas de id fourni, on veut tester de charger depuis la bdd un objet avec
             *  la même valeur de champ unique. si on trouve on passe en update au lieu d'insert
             */
            if (!vo.id) {

                let fields = moduleTable.get_fields();
                for (let fieldi in fields) {
                    let field = fields[fieldi];

                    if (field.is_unique && !!vo[field.field_id]) {

                        let check_this_uniq_field =
                            'select * from ' + moduleTable.full_name + ' t where ' +
                            self.get_simple_field_query(field, vo[field.field_id]);

                        try {
                            let uniq_refs = moduleTable.forceNumerics(await self.query(check_this_uniq_field));
                            if (uniq_refs && (uniq_refs.length == 1)) {
                                vo.id = uniq_refs[0].id;
                                break;
                            }
                        } catch (error) {
                            ConsoleHandler.getInstance().error(error);
                        }
                    }
                }
            }

            /**
             * Si on est sur un update et si on a des triggers de mise à jour on veut récupérer le vo en base avant de l'écraser pour le passer aux triggers
             */
            if (vo.id) {

                if (DAOServerController.getInstance().pre_update_trigger_hook.has_trigger(vo._type) || DAOServerController.getInstance().post_update_trigger_hook.has_trigger(vo._type)) {
                    preUpdate = await ModuleDAO.getInstance().getVoById<any>(vo._type, vo.id);

                    if (!preUpdate) {
                        // Cas d'un objet en cache server ou client mais qui n'existe plus sur la BDD => on doit insérer du coup un nouveau
                        isUpdate = false;
                        vo.id = null;
                    }
                }
            }

            let sql: string = await this.getqueryfor_insertOrUpdateVO(vo, preUpdate);
            let failed: boolean = false;

            if (!sql) {
                ConsoleHandler.getInstance().warn('Est-ce bien normal ? insertOrUpdateVO :(!sql):' + JSON.stringify(vo));
                resolve(null);
                return null;
            }

            let db_result = await ModuleServiceBase.getInstance().db.oneOrNone(sql, moduleTable.get_bdd_version(vo)).catch((reason) => {
                ConsoleHandler.getInstance().error('insertOrUpdateVO :' + reason);
                failed = true;
            });

            let res: InsertOrDeleteQueryResult = new InsertOrDeleteQueryResult((db_result && db_result.id) ? parseInt(db_result.id.toString()) : null);

            if (failed) {
                resolve(null);
                return null;
            }

            if (res && vo) {
                if (isUpdate) {
                    await DAOServerController.getInstance().post_update_trigger_hook.trigger(vo._type, new DAOUpdateVOHolder(preUpdate, vo));
                } else {
                    vo.id = res.id;
                    await DAOServerController.getInstance().post_create_trigger_hook.trigger(vo._type, vo);
                }
            }

            resolve(res);
        });
    }

    private async deleteVOs(vos: IDistantVOBase[]): Promise<InsertOrDeleteQueryResult[]> {

        if (this.global_update_blocker) {
            let uid: number = StackContext.getInstance().get('UID');
            let CLIENT_TAB_ID: string = StackContext.getInstance().get('CLIENT_TAB_ID');
            if (uid && CLIENT_TAB_ID) {
                this.throttled_refuse({ [uid]: { [CLIENT_TAB_ID]: true } });
            }
            return null;
        }

        // On vérifie qu'on peut faire un delete
        if ((!vos) || (!vos.length) || (!vos[0]) || (!vos[0]._type) || (!VOsTypesManager.getInstance().moduleTables_by_voType[vos[0]._type])) {
            return null;
        }
        if (!this.checkAccessSync(VOsTypesManager.getInstance().moduleTables_by_voType[vos[0]._type], ModuleDAO.DAO_ACCESS_TYPE_DELETE)) {
            return null;
        }

        // On ajoute un filtrage via hook
        let tmp_vos = [];
        for (let i in vos) {
            let vo = vos[i];
            let tmp_vo = await this.filterVOAccess(VOsTypesManager.getInstance().moduleTables_by_voType[vo._type], ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, vo);

            if (!!tmp_vo) {
                tmp_vos.push(tmp_vo);
            }
        }
        if ((!tmp_vos) || (!tmp_vos.length)) {
            return null;
        }
        vos = tmp_vos;

        let deleted_vos: IDistantVOBase[] = [];

        let results: any[] = await ModuleServiceBase.getInstance().db.tx(async (t) => {

            let queries: any[] = [];

            for (let i in vos) {
                let vo = vos[i];

                if (!vo._type) {
                    ConsoleHandler.getInstance().error("Un VO sans _type dans le DAO ! " + JSON.stringify(vo));
                    continue;
                }

                let moduletable: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[vo._type];

                if (!moduletable) {
                    ConsoleHandler.getInstance().error("Impossible de trouver le datatable de ce _type ! " + JSON.stringify(vo));
                    continue;
                }

                // Ajout des triggers, avant et après suppression.
                //  Attention si un des output est false avant suppression, on annule la suppression
                let res: boolean[] = await DAOServerController.getInstance().pre_delete_trigger_hook.trigger(vo._type, vo);
                if (!BooleanHandler.getInstance().AND(res, true)) {
                    continue;
                }

                /**
                 * AJOUT de la suppression Dep by Dep => on ne laisse plus la BDD fait marcher les triggers de suppression, on gère
                 *  ça directement applicativement => attention à l'impact sur les perfs. L'objectif est surtout de s'assurer qu'on
                 *  appelle bien tous les triggers et entre autre les droits de suppression des dépendances
                 */
                let deps: VocusInfoVO[] = await ModuleVocusServer.getInstance().getVosRefsById(vo._type, vo.id, null, null);

                // Si on a une interdiction de supprimer un item à mi-chemin, il faudrait restaurer tout ceux qui ont été supprimés
                //  c'est pas le cas du tout en l'état puisqu'au mieux on peut restaurer ceux visible sur ce niveau de deps, mais leurs
                //  deps sont définitivement perdues...
                let deps_to_delete: IDistantVOBase[] = [];
                for (let dep_i in deps) {
                    let dep = deps[dep_i];

                    if (!dep.is_cascade) {
                        continue;
                    }
                    deps_to_delete.push(await ModuleDAO.getInstance().getVoById(dep.linked_type, dep.linked_id));
                }

                if (deps_to_delete && deps_to_delete.length) {
                    let dep_ires: InsertOrDeleteQueryResult[] = await ModuleDAO.getInstance().deleteVOs(deps_to_delete);

                    if ((!dep_ires) || (dep_ires.length != deps_to_delete.length)) {
                        ConsoleHandler.getInstance().error('FAILED DELETE DEPS :' + vo._type + ':' + vo.id + ':ABORT DELETION:');
                        continue;
                    }
                }


                let full_name = null;

                if (moduletable.is_segmented) {
                    // Si on est sur une table segmentée on adapte le comportement
                    full_name = moduletable.get_segmented_full_name_from_vo(vo);
                } else {
                    full_name = moduletable.full_name;
                }

                const sql = "DELETE FROM " + full_name + " where id = ${id} RETURNING id";
                deleted_vos.push(vo);
                queries.push(t.oneOrNone(sql, vo)/*posttrigger pas si simple : .then(async (data) => {
                    await this.post_delete_trigger_hook.trigger(vo._type, vo);
                })*/);
            }

            return t.batch(queries);
        }).then(async (value: any) => {

            for (let i in deleted_vos) {
                let deleted_vo = deleted_vos[i];
                await DAOServerController.getInstance().post_delete_trigger_hook.trigger(deleted_vo._type, deleted_vo);
            }
            return value;
        });

        let InsertOrDeleteQueryResults: InsertOrDeleteQueryResult[] = [];
        if (results && results.length) {
            for (let i in results) {
                let result = results[i];
                InsertOrDeleteQueryResults.push(new InsertOrDeleteQueryResult((result && result.id) ? parseInt(result.id.toString()) : null));
            }
        }

        return InsertOrDeleteQueryResults;
    }

    private async deleteVOsByIds(API_TYPE_ID: string, ids: number[]): Promise<any[]> {

        if (this.global_update_blocker) {
            let uid: number = StackContext.getInstance().get('UID');
            let CLIENT_TAB_ID: string = StackContext.getInstance().get('CLIENT_TAB_ID');
            if (uid && CLIENT_TAB_ID) {
                this.throttled_refuse({ [uid]: { [CLIENT_TAB_ID]: true } });
            }
            return null;
        }

        // On vérifie qu'on peut faire un delete
        if ((!API_TYPE_ID) || (!ids) || (!ids.length)) {
            return null;
        }

        // En fait avec les triggers qui prennent en param le vo, on est obligé de faire une requete sur le vo avant d'en demander la suppression...
        let vos: IDistantVOBase[] = await this.getVosByIds(API_TYPE_ID, ids);

        // On ajoute un filtrage via hook
        let tmp_vos = [];
        for (let i in vos) {
            let vo = vos[i];
            let tmp_vo = await this.filterVOAccess(VOsTypesManager.getInstance().moduleTables_by_voType[vo._type], ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, vo);

            if (!!tmp_vo) {
                tmp_vos.push(tmp_vo);
            }
        }
        if ((!tmp_vos) || (!tmp_vos.length)) {
            return null;
        }
        vos = tmp_vos;

        return await this.deleteVOs(vos);
    }

    private async getqueryfor_insertOrUpdateVO(vo: IDistantVOBase, pre_update_vo: IDistantVOBase): Promise<string> {

        if (!vo._type) {
            ConsoleHandler.getInstance().error("Un VO sans _type dans le DAO ! " + JSON.stringify(vo));
            return null;
        }

        let moduleTable: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[vo._type];

        if (!moduleTable) {
            ConsoleHandler.getInstance().error("Impossible de trouver le moduleTable de ce _type ! " + JSON.stringify(vo));
            return null;
        }

        let sql: string = null;

        if (vo.id) {

            // Ajout des triggers, avant et après modification.
            //  Attention si un des output est false avant modification, on annule la modification
            let res: boolean[] = await DAOServerController.getInstance().pre_update_trigger_hook.trigger(vo._type, new DAOUpdateVOHolder(pre_update_vo, vo));
            if (!BooleanHandler.getInstance().AND(res, true)) {
                return null;
            }

            const setters = [];
            for (const f in moduleTable.get_fields()) {
                let field: ModuleTableField<any> = moduleTable.get_fields()[f];

                if (typeof vo[field.field_id] == "undefined") {
                    if (!field.has_default || typeof field.field_default == 'undefined') {
                        continue;
                    }

                    vo[field.field_id] = field.field_default;
                }

                setters.push(field.field_id + ' = ${' + field.field_id + '}');
            }

            let full_name = null;

            if (moduleTable.is_segmented) {
                // Si on est sur une table segmentée on adapte le comportement
                full_name = moduleTable.get_segmented_full_name_from_vo(vo);
            } else {
                full_name = moduleTable.full_name;
            }

            sql = "UPDATE " + full_name + " SET " + setters.join(', ') + " WHERE id = ${id} RETURNING ID";

        } else {

            // Ajout des triggers, avant et après modification.
            //  Attention si un des output est false avant modification, on annule la modification
            let res: boolean[] = await DAOServerController.getInstance().pre_create_trigger_hook.trigger(vo._type, vo);
            if (!BooleanHandler.getInstance().AND(res, true)) {
                return null;
            }

            const tableFields = [];
            const placeHolders = [];
            for (const f in moduleTable.get_fields()) {
                let field: ModuleTableField<any> = moduleTable.get_fields()[f];

                if (typeof vo[field.field_id] == "undefined") {
                    if (!field.has_default || typeof field.field_default == 'undefined') {
                        continue;
                    }

                    vo[field.field_id] = field.field_default;
                }

                tableFields.push(field.field_id);
                placeHolders.push('${' + field.field_id + '}');
            }

            let full_name = null;

            if (moduleTable.is_segmented) {
                // Si on est sur une table segmentée on adapte le comportement
                let name = moduleTable.get_segmented_name_from_vo(vo);
                full_name = moduleTable.get_segmented_full_name_from_vo(vo);

                // Si on est sur du segmented en insert on doit vérifier l'existence de la table, sinon il faut la créer avant d'insérer la première donnée
                if ((!DAOServerController.getInstance().segmented_known_databases[moduleTable.database]) || (!DAOServerController.getInstance().segmented_known_databases[moduleTable.database][name])) {

                    await ModuleTableDBService.getInstance(null).create_or_update_datatable(
                        moduleTable,
                        [RangeHandler.getInstance().create_single_elt_range(moduleTable.table_segmented_field_range_type, moduleTable.get_segmented_field_value_from_vo(vo), moduleTable.table_segmented_field_segment_type)]);
                }
            } else {
                full_name = moduleTable.full_name;
            }

            sql = "INSERT INTO " + full_name + " (" + tableFields.join(', ') + ") VALUES (" + placeHolders.join(', ') + ") RETURNING id";
        }

        return sql;
    }

    private async filterVOsAccess<T extends IDistantVOBase>(datatable: ModuleTable<T>, access_type: string, vos: T[]): Promise<T[]> {

        if (!ModuleAccessPolicy.getInstance().actif) {
            return vos;
        }

        // Suivant le type de contenu et le type d'accès, on peut avoir un hook enregistré sur le ModuleDAO pour filtrer les vos
        let hooks = DAOServerController.getInstance().access_hooks[datatable.vo_type] && DAOServerController.getInstance().access_hooks[datatable.vo_type][access_type] ? DAOServerController.getInstance().access_hooks[datatable.vo_type][access_type] : [];
        if (!StackContext.getInstance().get('IS_CLIENT')) {
            // Server
            return vos;
        }

        for (let i in hooks) {
            let hook = hooks[i];

            let uid: number = StackContext.getInstance().get('UID');
            let user_data = uid ? await ServerBase.getInstance().getUserData(uid) : null;
            vos = await hook(datatable, vos, uid, user_data) as T[];
        }

        if (vos && vos.length && !this.checkAccessSync(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            // a priori on a accès en list labels, mais pas en read. Donc on va filtrer tous les champs, sauf le label et id et _type

            for (let j in vos) {
                let vo: IDistantVOBase = vos[j];

                for (let i in datatable.get_fields()) {
                    let field: ModuleTableField<any> = datatable.get_fields()[i];

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
        let hooks = DAOServerController.getInstance().access_hooks[datatable.vo_type] && DAOServerController.getInstance().access_hooks[datatable.vo_type][access_type] ? DAOServerController.getInstance().access_hooks[datatable.vo_type][access_type] : [];
        if (!StackContext.getInstance().get('IS_CLIENT')) {
            // Server
            return vo;
        }

        for (let i in hooks) {
            let hook = hooks[i];

            let uid: number = StackContext.getInstance().get('UID');
            let user_data = uid ? await ServerBase.getInstance().getUserData(uid) : null;
            let filtered: T[] = await hook(datatable, (((typeof vo != 'undefined') && (vo != null)) ? [vo] : null), uid, user_data) as T[];

            if ((!filtered) || (!filtered.length)) {
                return null;
            }
        }

        if (vo && !this.checkAccessSync(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            // a priori on a accès en list labels, mais pas en read. Donc on va filtrer tous les champs, sauf le label et id et _type
            for (let i in datatable.get_fields()) {
                let field: ModuleTableField<any> = datatable.get_fields()[i];

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

    private async getVoById<T extends IDistantVOBase>(
        API_TYPE_ID: string,
        id: number,
        segmentation_ranges: Array<IRange<any>> = null
    ): Promise<T> {

        let moduleTable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[API_TYPE_ID];

        // On vérifie qu'on peut faire a minima un listage
        if (!this.checkAccessSync(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_LIST_LABELS)) {
            return null;
        }

        /**
         * Si on est segmenté, ici, on se retrouve à chercher partout. c'est vraiment pas opti. Donc on peut imaginer une table commune avec uniquement un lien entre id et table cible
         *  ou alors il faut s'assurer que les ids soient autoporteurs de l'info de la table (et ça c'est clairement pas le cas en l'état...)
         * Pour le moment on fait naïvement mais à remplacer certainement rapidement et de toutes manières éviter d'utiliser un getvobyid sur un segmented
         */
        let vo: T = null;

        if (moduleTable.is_segmented) {

            let request = null;
            let segmentations: { [table_name: string]: number } = {};

            if (segmentation_ranges && segmentation_ranges.length) {

                let self = this;
                await RangeHandler.getInstance().foreach_ranges(segmentation_ranges, (segmented_value) => {

                    if (!self.has_segmented_known_database(moduleTable, segmented_value)) {
                        return;
                    }

                    let table_name = moduleTable.get_segmented_name(segmented_value);
                    segmentations[table_name] = segmented_value;
                });
            } else {
                segmentations = DAOServerController.getInstance().segmented_known_databases[moduleTable.database];
            }

            for (let segmentation_table in segmentations) {

                if (!request) {
                    request = '';
                } else {
                    request += ' UNION ALL ';
                }
                request += 'select * from ' + moduleTable.database + '.' + segmentation_table + ' t where id = ' + id + ' ';
            }

            /**
             * Attention en cas de segmentation on peut très bien ne pas avoir de table du tout ! Donc la requête plante complètement et ça veut juste dire 0 résultats
             */
            vo = null;
            try {
                vo = request ? await ModuleServiceBase.getInstance().db.oneOrNone(request + ';') as T : null;
            } catch (error) {
            }

        } else {
            vo = await ModuleServiceBase.getInstance().db.oneOrNone("SELECT t.* FROM " + moduleTable.full_name + " t WHERE id=" + id + ";") as T;
        }

        vo = moduleTable.forceNumeric(vo);

        if (!vo) {
            return vo;
        }

        // On filtre suivant les droits d'accès
        return await this.filterVOAccess(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ, vo);
    }

    private async getBaseUrl(): Promise<string> {
        return ConfigurationService.getInstance().getNodeConfiguration().BASE_URL;
    }

    private async getVosByRefFieldIds<T extends IDistantVOBase>(API_TYPE_ID: string, field_name: string, ids: number[]): Promise<T[]> {

        let moduleTable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[API_TYPE_ID];

        // On vérifie qu'on peut faire un select
        if (!this.checkAccessSync(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        // On check le field_name par rapport à la liste des fields, et au fait qu'il doit être un manyToOne (pour sécuriser)
        if ((!moduleTable) || (!moduleTable.getFieldFromId(field_name)) || (!moduleTable.getFieldFromId(field_name).field_id)) {
            return null;
        }

        if ((!ids) || (!ids.length)) {
            return null;
        }

        let has_null: boolean = false;
        for (let i in ids) {
            if (ids[i] == null) {
                has_null = true;
                break;
            }
        }


        let matroid_fields: Array<ModuleTableField<any>> = MatroidController.getInstance().getMatroidFields(API_TYPE_ID);
        let matroid_fields_by_ids: { [field_id: string]: ModuleTableField<any> } = {};

        for (let i in matroid_fields) {
            let matroid_field = matroid_fields[i];

            matroid_fields_by_ids[matroid_field.field_id] = matroid_field;
        }

        let field = moduleTable.getFieldFromId(field_name);

        let request = " t WHERE ";

        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_refrange_array:
            case ModuleTableField.FIELD_TYPE_numrange_array:

                let numrange_ids: NumRange[] = [];

                for (let i in ids) {
                    let id: number = ids[i];

                    numrange_ids.push(RangeHandler.getInstance().create_single_elt_NumRange(id, NumSegment.TYPE_INT));
                }

                let where_clause: string = '';

                for (let j in numrange_ids) {
                    let field_range: NumRange = numrange_ids[j];

                    where_clause += (where_clause == '') ? "" : " OR ";

                    where_clause += this.getClauseWhereRangeIntersectsField(field, field_range);
                }

                if (has_null && (ids.length == 1)) {
                    request += field.field_id + ' is null;';
                } else if (has_null) {
                    let temp = ids.filter((v) => v != null);
                    request += " is null OR " + where_clause;
                } else {
                    request += " " + where_clause;
                }
                break;
            default:
                request += field.field_id;
                if (has_null && (ids.length == 1)) {
                    request += ' is null;';
                } else if (has_null) {
                    let temp = ids.filter((v) => v != null);
                    request += " is null or in (" + temp.join(',') + ");";
                } else {
                    request += " in (" + ids.join(',') + ");";
                }
                break;
        }

        let vos: T[] = [];
        if (moduleTable.is_segmented) {

            /**
             * 2 options:
             *  On questionne le champs segmenté
             *  On questionne un autre champs
             */

            let isrefchampssegment: boolean = moduleTable.table_segmented_field.field_id == moduleTable.getFieldFromId(field_name).field_id;

            if (isrefchampssegment) {
                // si on cherche sur le champs segmenté, ça revient à faire un select all sur ces tables segmentées
                for (let i in ids) {
                    let id = ids[i];

                    if (!this.has_segmented_known_database(moduleTable, id)) {
                        continue;
                    }

                    if (!id) {
                        continue;
                    }

                    let tmp_vos = moduleTable.forceNumerics(await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + moduleTable.get_segmented_full_name(id) + request) as T[]);
                    if ((!!tmp_vos) && (tmp_vos.length)) {
                        vos = vos.concat(tmp_vos);
                    }
                }
            } else {
                // si on cherche sur un autre champs, ça revient à faire la requete sur chaque segment
                let segments: { [table_name: string]: number } = DAOServerController.getInstance().segmented_known_databases[moduleTable.database];
                for (let i in segments) {
                    let segment: number = segments[i];

                    if (!segment) {
                        continue;
                    }

                    let tmp_vos = moduleTable.forceNumerics(await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + moduleTable.get_segmented_full_name(segment) + request) as T[]);
                    if ((!!tmp_vos) && (tmp_vos.length)) {
                        vos = vos.concat(tmp_vos);
                    }
                }
            }
        } else {
            vos = moduleTable.forceNumerics(await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + moduleTable.full_name + request) as T[]);
        }

        // On filtre suivant les droits d'accès
        return await this.filterVOsAccess(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);
    }

    private async getVosByRefFieldsIds<T extends IDistantVOBase>(
        API_TYPE_ID: string,
        field_name1: string,
        ids1: number[],
        field_name2: string,
        ids2: number[],
        field_name3: string,
        ids3: number[]): Promise<T[]> {

        let moduleTable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[API_TYPE_ID];

        // On vérifie qu'on peut faire un select
        if (!this.checkAccessSync(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        // On check le field_name par rapport à la liste des fields, et au fait qu'il doit être un manyToOne (pour sécuriser)
        if ((!moduleTable) || (!moduleTable.getFieldFromId(field_name1)) || (!moduleTable.getFieldFromId(field_name1).field_id)) {
            return null;
        }

        if (field_name2 && ((!moduleTable.getFieldFromId(field_name2)) || (!moduleTable.getFieldFromId(field_name2).field_id))) {
            return null;
        }

        if (field_name3 && ((!moduleTable.getFieldFromId(field_name3)) || (!moduleTable.getFieldFromId(field_name3).field_id))) {
            return null;
        }

        if ((!ids1) || (!ids1.length)) {
            return null;
        }

        if (moduleTable.is_segmented) {
            // TODO FIXME segmented moduletable
            throw new Error('Not Implemented');
        }

        let request: string = "SELECT t.* FROM " + moduleTable.full_name + " t WHERE " +
            moduleTable.getFieldFromId(field_name1).field_id + " in (" + ids1 + ")";
        if (field_name2 && ((!!ids2) && (ids2.length > 0))) {
            request += " AND " + moduleTable.getFieldFromId(field_name2).field_id + " in (" + ids2 + ")";
        }
        if (field_name3 && ((!!ids3) && (ids3.length > 0))) {
            request += " AND " + moduleTable.getFieldFromId(field_name3).field_id + " in (" + ids3 + ")";
        }

        let vos: T[] = moduleTable.forceNumerics(await ModuleServiceBase.getInstance().db.query(request + ";") as T[]);

        // On filtre suivant les droits d'accès
        return await this.filterVOsAccess(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);
    }

    private async getVosByRefFieldsIdsAndFieldsString<T extends IDistantVOBase>(
        API_TYPE_ID: string,
        field_name1: string,
        ids1: number[],
        field_name2: string = null,
        values2: string[] = null,
        field_name3: string = null,
        values3: string[] = null,
        segmentation_ranges: Array<IRange<any>> = null
    ): Promise<T[]> {

        let moduleTable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[API_TYPE_ID];

        // On vérifie qu'on peut faire un select
        if (!this.checkAccessSync(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        // if ((!field_name1) && (!field_name2) && (!field_name3)) {
        //     return null;
        // }

        if (!moduleTable) {
            return null;
        }

        // On check le field_name par rapport à la liste des fields, et au fait qu'il doit être un manyToOne (pour sécuriser)
        if (field_name1 && ((!moduleTable.getFieldFromId(field_name1)) || (!moduleTable.getFieldFromId(field_name1).field_id))) {
            return null;
        }

        if (field_name2 && ((!moduleTable.getFieldFromId(field_name2)) || (!moduleTable.getFieldFromId(field_name2).field_id))) {
            return null;
        }

        if (field_name3 && ((!moduleTable.getFieldFromId(field_name3)) || (!moduleTable.getFieldFromId(field_name3).field_id))) {
            return null;
        }

        if (moduleTable.is_segmented && (!segmentation_ranges)) {
            // TODO FIXME segmented moduletable
            throw new Error('Not Implemented');
        }

        if (moduleTable.is_segmented) {

            // ATTENTION ne pas utiliser le MAX range en param
            let vos: T[] = [];
            await RangeHandler.getInstance().foreach_ranges(segmentation_ranges, async (segmentation: number) => {
                let temp = await this.get_request_for_getVosByRefFieldsIdsAndFieldsString(
                    field_name1,
                    ids1,
                    field_name2,
                    values2,
                    field_name3,
                    values3,
                    moduleTable,
                    segmentation
                );
                vos = vos.concat(temp);
            }, NumSegment.TYPE_INT);

            return vos;
        }

        return await this.get_request_for_getVosByRefFieldsIdsAndFieldsString(
            field_name1,
            ids1,
            field_name2,
            values2,
            field_name3,
            values3,
            moduleTable
        );
    }

    private async get_request_for_getVosByRefFieldsIdsAndFieldsString<T extends IDistantVOBase>(
        field_name1: string,
        ids1: number[],
        field_name2: string,
        values2: string[],
        field_name3: string,
        values3: string[],
        moduleTable: ModuleTable<T>,
        segmentation: number = null,
    ): Promise<T[]> {

        let request: string;

        if (!!segmentation) {
            request = "SELECT t.* FROM " + moduleTable.get_segmented_full_name(segmentation) + " t WHERE ";
        } else {
            request = "SELECT t.* FROM " + moduleTable.full_name + " t WHERE ";
        }

        let first: boolean = true;
        let request_params = [];
        if (field_name1 && ((!!ids1) && (ids1.length > 0))) {
            request += moduleTable.getFieldFromId(field_name1).field_id + " in (";
            let first_param: boolean = true;
            for (let i in ids1) {
                let id1 = ids1[i];
                request_params.push(id1);
                request += (first_param ? '' : ',') + "$" + request_params.length;
                first_param = false;
            }
            request += ")";
            first = false;
        }
        if (field_name2 && ((!!values2) && (values2.length > 0))) {
            request += ((!first) ? " AND " : "") + moduleTable.getFieldFromId(field_name2).field_id + " in (";
            let first_param: boolean = true;
            for (let i in values2) {
                let value2 = values2[i];
                request_params.push(value2);
                request += (first_param ? '' : ',') + "$" + request_params.length;
                first_param = false;
            }
            request += ")";
            first = false;
        }
        if (field_name3 && ((!!values3) && (values3.length > 0))) {
            request += ((!first) ? " AND " : "") + moduleTable.getFieldFromId(field_name3).field_id + " in (";
            let first_param: boolean = true;
            for (let i in values3) {
                let value3 = values3[i];
                request_params.push(value3);
                request += (first_param ? '' : ',') + "$" + request_params.length;
                first_param = false;
            }
            request += ")";
            first = false;
        }

        let vos: T[] = moduleTable.forceNumerics(await ModuleServiceBase.getInstance().db.query(request + ";", request_params) as T[]);

        // On filtre suivant les droits d'accès
        return await this.filterVOsAccess(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);
    }

    private async getVosByIds<T extends IDistantVOBase>(API_TYPE_ID: string, ids: number[]): Promise<T[]> {

        if ((!ids) || (!ids.length)) {
            return null;
        }

        let moduleTable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[API_TYPE_ID];

        // On vérifie qu'on peut faire un select
        if (!this.checkAccessSync(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        /**
         * Si on est segmenté, ici, on se retrouve à chercher partout. c'est vraiment pas opti. Donc on peut imaginer une table commune avec uniquement un lien entre id et table cible
         *  ou alors il faut s'assurer que les ids soient autoporteurs de l'info de la table (et ça c'est clairement pas le cas en l'état...)
         * Pour le moment on fait naïvement mais à remplacer certainement rapidement et de toutes manières éviter d'utiliser un getvobyid sur un segmented
         */
        let vos: T[] = null;

        if (moduleTable.is_segmented) {

            // TODO FIXME comme pour le by id on doit pouvoir passer un ranges en param

            let segmentations: { [table_name: string]: number } = DAOServerController.getInstance().segmented_known_databases[moduleTable.database];
            let request = null;

            for (let segmentation_table in segmentations) {

                if (!request) {
                    request = '';
                } else {
                    request += ' UNION ALL ';
                }
                request += 'select * from ' + moduleTable.database + '.' + segmentation_table + ' t WHERE id in (' + ids + ') ';
            }

            /**
             * Attention en cas de segmentation on peut très bien ne pas avoir de table du tout ! Donc la requête plante complètement et ça veut juste dire 0 résultats
             */
            vos = null;
            try {
                vos = request ? await ModuleServiceBase.getInstance().db.query(request + ';') as T[] : null;
            } catch (error) {
            }

        } else {
            vos = await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + moduleTable.full_name + " t WHERE id in (" + ids + ");") as T[];
        }

        vos = moduleTable.forceNumerics(vos);

        // On filtre suivant les droits d'accès
        return await this.filterVOsAccess(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);
    }

    private async getVosByIdsRanges<T extends IDistantVOBase>(API_TYPE_ID: string, ranges: NumRange[]): Promise<T[]> {

        if ((!ranges) || (!ranges.length)) {
            return null;
        }

        let moduleTable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[API_TYPE_ID];

        // On vérifie qu'on peut faire un select
        if (!this.checkAccessSync(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        if (moduleTable.is_segmented) {
            // TODO FIXME segmented moduletable
            throw new Error('Not Implemented');
        }

        let where_clause: string = "";

        for (let i in ranges) {
            let range = ranges[i];

            if ((!range) || (!range.max) || (!range.min)) {
                continue;
            }

            where_clause += (where_clause == "") ? "" : " OR ";

            where_clause += "id::numeric <@ '" + (range.min_inclusiv ? "[" : "(") + range.min + "," + range.max + (range.max_inclusiv ? "]" : ")") + "'::numrange";
        }

        if (where_clause == "") {
            return null;
        }

        let vos: T[] = moduleTable.forceNumerics(await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + moduleTable.full_name + " t WHERE " + where_clause + ";") as T[]);

        // On filtre suivant les droits d'accès
        return await this.filterVOsAccess(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);
    }

    private async getVos<T extends IDistantVOBase>(text: string, limit: number = 0, offset: number = 0): Promise<T[]> {

        // On filtre les res suivant les droits d'accès
        // return await this.selectAll(apiDAOParamVOs);
        return await this.selectAll<T>(text, null, null, null, false, null, limit, offset);
    }

    private async getNamedVoByName<U extends INamedVO>(API_TYPE_ID: string, name: string): Promise<U> {

        let moduleTable: ModuleTable<U> = VOsTypesManager.getInstance().moduleTables_by_voType[API_TYPE_ID];
        if (moduleTable.is_segmented) {
            // TODO FIXME segmented moduletable
            throw new Error('Not Implemented');
        }

        return await this.selectOne<U>(API_TYPE_ID, "where LOWER(name) = LOWER($1)", [name]);
    }



    private async getVarImportsByMatroidParams<T extends IDistantVOBase>(
        api_type_id: string,
        matroids: IMatroid[],
        fields_ids_mapper: { [matroid_field_id: string]: string } = null
    ): Promise<T[]> {

        if ((!matroids) || (!matroids.length)) {
            return null;
        }

        let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];

        if (!datatable) {
            return null;
        }

        // On vérifie qu'on peut faire un select
        if (!this.checkAccessSync(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        let vos: T[] = [];
        for (let matroid_i in matroids) {
            let matroid: IMatroid = matroids[matroid_i];

            if (!matroid) {
                ConsoleHandler.getInstance().error('Matroid vide:' + api_type_id + ':' + (matroid ? matroid._type : null) + ':');
                return null;
            }

            let tmp = await this.getVarImportsByMatroidParam<T>(api_type_id, matroid, fields_ids_mapper);

            if ((!!tmp) && (tmp.length)) {
                vos = vos.concat(tmp);
            }
        }

        // On filtre suivant les droits d'accès
        return await this.filterVOsAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);
    }

    private async filterVosByMatroids<T extends IDistantVOBase>(
        api_type_id: string,
        matroids: IMatroid[],
        fields_ids_mapper: { [matroid_field_id: string]: string } = null
    ): Promise<T[]> {

        if ((!matroids) || (!matroids.length)) {
            return null;
        }

        let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];

        if (!datatable) {
            return null;
        }

        // On vérifie qu'on peut faire un select
        if (!this.checkAccessSync(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        let vos: T[] = [];
        for (let matroid_i in matroids) {
            let matroid: IMatroid = matroids[matroid_i];

            if (!matroid) {
                ConsoleHandler.getInstance().error('Matroid vide:' + api_type_id + ':' + (matroid ? matroid._type : null) + ':');
                return null;
            }

            let tmp = await this.filterVosByMatroid<T>(api_type_id, matroid, fields_ids_mapper);

            if ((!!tmp) && (tmp.length)) {
                vos = vos.concat(tmp);
            }
        }

        // On filtre suivant les droits d'accès
        return await this.filterVOsAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);
    }

    private async getDAOsByMatroid<T extends IDistantVOBase>(api_type_id: string, matroid: IMatroid, fields_ids_mapper: { [matroid_field_id: string]: string }, additional_condition: string): Promise<T[]> {
        if (!matroid) {
            return null;
        }

        if (!api_type_id) {
            return null;
        }

        if (!fields_ids_mapper) {
            fields_ids_mapper = {};
        }

        let moduleTable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];

        if (!moduleTable) {
            return null;
        }

        if (moduleTable.is_segmented) {

            let request = null;
            let segmentations_tables: { [table_name: string]: number } = {};

            // On cherche dans le matroid le field qui est la segmentation. Si on a pas, on info qu'on peut éviter de faire une recherche en masse peut-être
            let segmented_matroid_filed_id = moduleTable.table_segmented_field.field_id;
            for (let matroid_field_id in fields_ids_mapper) {
                let field_id = fields_ids_mapper[matroid_field_id];

                if (field_id == moduleTable.table_segmented_field.field_id) {
                    segmented_matroid_filed_id = matroid_field_id;
                    break;
                }
            }

            let segmentations: Array<IRange<any>> = [];
            if ((!segmented_matroid_filed_id) || (!matroid[segmented_matroid_filed_id]) || (!matroid[segmented_matroid_filed_id].length)) {
                ConsoleHandler.getInstance().log('filterVosByMatroid sur table segmentée - ' + moduleTable.full_name + ' - sans info de segment sur le matroid');
                segmentations_tables = DAOServerController.getInstance().segmented_known_databases[moduleTable.database];
            } else {
                segmentations = matroid[segmented_matroid_filed_id];

                // Si c'est un matroid on devrait avoir un cas simple de ranges directement mais on pourrait adapter à tous les types de field matroid
                // let matroid_moduleTable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[matroid._type];
                // let matroid_field = matroid_moduleTable.getFieldFromId(segmented_matroid_filed_id);

                // switch (matroid_field.field_type) {
                // }

                let self = this;
                await RangeHandler.getInstance().foreach_ranges(segmentations, (segmented_value) => {

                    if (!self.has_segmented_known_database(moduleTable, segmented_value)) {
                        return;
                    }

                    let table_name = moduleTable.get_segmented_name(segmented_value);
                    segmentations_tables[table_name] = segmented_value;
                });
            }

            for (let segmentation_table in segmentations_tables) {

                if (!request) {
                    request = '';
                } else {
                    request += ' UNION ALL ';
                }

                let db_full_name = moduleTable.database + '.' + segmentation_table;

                let filter_by_matroid_clause: string = this.getWhereClauseForFilterByMatroid(api_type_id, matroid, fields_ids_mapper, 't', db_full_name);

                if (!filter_by_matroid_clause) {
                    return null;
                }

                request += 'select * from ' + db_full_name + ' t where ' + filter_by_matroid_clause + (additional_condition ? additional_condition : '');
            }

            if (!request) {
                return null;
            }

            let vos = await ModuleServiceBase.getInstance().db.query(request + ';') as T[];

            return moduleTable.forceNumerics(vos);
        } else {
            let filter_by_matroid_clause: string = this.getWhereClauseForFilterByMatroid(api_type_id, matroid, fields_ids_mapper, 't', moduleTable.full_name);

            if (!filter_by_matroid_clause) {
                return null;
            }

            return moduleTable.forceNumerics(await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + moduleTable.full_name + " t WHERE " + filter_by_matroid_clause + (additional_condition ? additional_condition : '') + ';') as T[]);
        }
    }

    private async getVarImportsByMatroidParam<T extends IDistantVOBase>(api_type_id: string, matroid: IMatroid, fields_ids_mapper: { [matroid_field_id: string]: string }): Promise<T[]> {
        return await this.getDAOsByMatroid(api_type_id, matroid, fields_ids_mapper, ' and value_type = 0');
    }

    private async filterVosByMatroid<T extends IDistantVOBase>(api_type_id: string, matroid: IMatroid, fields_ids_mapper: { [matroid_field_id: string]: string }): Promise<T[]> {
        return await this.getDAOsByMatroid(api_type_id, matroid, fields_ids_mapper, null);
    }

    private get_matroid_fields_ranges_by_datatable_field_id(matroid: IMatroid, moduleTable: ModuleTable<any>, fields_ids_mapper: { [matroid_field_id: string]: string }): { [field_id: string]: Array<IRange<any>> } {

        let matroid_fields = MatroidController.getInstance().getMatroidFields(matroid._type);
        let matroid_fields_ranges_by_datatable_field_id: { [field_id: string]: Array<IRange<any>> } = {};
        for (let i in matroid_fields) {
            let matroid_field = matroid_fields[i];
            let ranges: Array<IRange<any>> = matroid[matroid_field.field_id];
            let field = moduleTable.getFieldFromId((fields_ids_mapper && fields_ids_mapper[matroid_field.field_id]) ? fields_ids_mapper[matroid_field.field_id] : matroid_field.field_id);

            if (!field) {
                continue;
            }

            if (moduleTable.is_segmented) {
                // Si la table est segmentée et que le field est celui de la segmentation, on a pas besoin de filtrer sur ce champs, puisqu'on va sélectionner les tables adéquates directement
                if (moduleTable.table_segmented_field.field_id == field.field_id) {
                    continue;
                }
            }

            if ((!ranges) || (!ranges.length)) {
                ConsoleHandler.getInstance().error('Matroid field vide ou inexistant:' + moduleTable.vo_type + ':' + matroid_fields[i].field_id + ':');
                return null;
            }

            // FIXME TODO : est-ce qu'on est obligé de faire une copie à chaque fois ???
            matroid_fields_ranges_by_datatable_field_id[field.field_id] = RangeHandler.getInstance().cloneArrayFrom(ranges);
        }

        return matroid_fields_ranges_by_datatable_field_id;
    }

    private async filterVosByMatroidsIntersections<T extends IDistantVOBase>(
        api_type_id: string,
        matroids: IMatroid[],
        fields_ids_mapper: { [matroid_field_id: string]: string } = null
    ): Promise<T[]> {

        if ((!matroids) || (!matroids.length)) {
            return null;
        }

        let moduleTable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];

        if (!moduleTable) {
            return null;
        }

        // On vérifie qu'on peut faire un select
        if (!this.checkAccessSync(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        let vos: T[] = [];

        if (moduleTable.is_segmented) {

            let request = null;
            let segmentations_tables: { [table_name: string]: number } = {};

            // On cherche dans le matroid le field qui est la segmentation. Si on a pas, on refuse de chercher en masse
            let segmented_matroid_field_id = moduleTable.table_segmented_field.field_id;
            for (let matroid_field_id in fields_ids_mapper) {
                let field_id = fields_ids_mapper[matroid_field_id];

                if (field_id == moduleTable.table_segmented_field.field_id) {
                    segmented_matroid_field_id = matroid_field_id;
                    break;
                }
            }

            if (!segmented_matroid_field_id) {
                throw new Error('Not Implemented');
            }

            let vos_by_ids: { [id: number]: T } = {};

            for (let i in matroids) {
                let matroid = matroids[i];

                let segmentations: Array<IRange<any>> = matroid[segmented_matroid_field_id];

                // Si c'est un matroid on devrait avoir un cas simple de ranges directement mais on pourrait adapter à tous les types de field matroid
                // let matroid_moduleTable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[matroid._type];
                // let matroid_field = matroid_moduleTable.getFieldFromId(segmented_matroid_filed_id);

                // switch (matroid_field.field_type) {
                // }

                if (segmentations && segmentations.length) {

                    let self = this;
                    await RangeHandler.getInstance().foreach_ranges(segmentations, (segmented_value) => {

                        if (!self.has_segmented_known_database(moduleTable, segmented_value)) {
                            return;
                        }
                        let table_name = moduleTable.get_segmented_name(segmented_value);
                        segmentations_tables[table_name] = segmented_value;
                    });
                } else {
                    segmentations_tables = DAOServerController.getInstance().segmented_known_databases[moduleTable.database];
                }

                for (let segmentation_table in segmentations_tables) {

                    if (!request) {
                        request = '';
                    } else {
                        request += ' UNION ALL ';
                    }
                    let clause = this.getWhereClauseForFilterByMatroidIntersection(api_type_id, matroid, fields_ids_mapper);
                    if (!clause) {
                        ConsoleHandler.getInstance().error('filterVosByMatroidsIntersections:Where clause invalid :api_type_id:' + api_type_id);
                        ConsoleHandler.getInstance().error('filterVosByMatroidsIntersections:Where clause invalid :matroid:' + (matroid ? JSON.stringify(matroid) : matroid));
                        ConsoleHandler.getInstance().error('filterVosByMatroidsIntersections:Where clause invalid :api_type_id:' + (fields_ids_mapper ? JSON.stringify(fields_ids_mapper) : fields_ids_mapper));
                        throw new Error('Where clause invalid');
                    }
                    request += 'select * from ' + moduleTable.database + '.' + segmentation_table + ' t where ' + clause + ' ';
                }

                /**
                 * Attention en cas de segmentation on peut très bien ne pas avoir de table du tout ! Donc la requête plante complètement et ça veut juste dire 0 résultats
                 */
                let tmp_vos = null;
                try {
                    tmp_vos = request ? moduleTable.forceNumerics(await ModuleServiceBase.getInstance().db.query(request + ';') as T[]) : null;
                } catch (error) {
                }

                for (let k in tmp_vos) {
                    let tmp_vo = tmp_vos[k];

                    vos_by_ids[tmp_vo.id] = tmp_vo;
                }
            }

            vos = Object.values(vos_by_ids);
        } else {

            let where_clauses: string[] = [];
            for (let i in matroids) {
                if (!matroids[i]) {
                    ConsoleHandler.getInstance().error('filterVosByMatroidsIntersections:Where clause invalid :matroid null:' + JSON.stringify(matroids));
                    continue;
                }
                let clause = this.getWhereClauseForFilterByMatroidIntersection(api_type_id, matroids[i], fields_ids_mapper);
                if (!clause) {
                    ConsoleHandler.getInstance().error('filterVosByMatroidsIntersections:Where clause invalid :api_type_id:' + api_type_id);
                    ConsoleHandler.getInstance().error('filterVosByMatroidsIntersections:Where clause invalid :matroid:' + (matroids[i] ? JSON.stringify(matroids[i]) : matroids[i]));
                    ConsoleHandler.getInstance().error('filterVosByMatroidsIntersections:Where clause invalid :api_type_id:' + (fields_ids_mapper ? JSON.stringify(fields_ids_mapper) : fields_ids_mapper));
                    throw new Error('Where clause invalid');
                }
                where_clauses.push(clause);
            }
            vos = moduleTable.forceNumerics(await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + moduleTable.full_name + " t WHERE " + '(' + where_clauses.join(') OR (') + ')' + ";") as T[]);
        }

        // On filtre suivant les droits d'accès
        return await this.filterVOsAccess(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);
    }

    private async getVosByExactMatroid<T extends IDistantVOBase>(
        api_type_id: string,
        matroids: IMatroid[],
        fields_ids_mapper: { [matroid_field_id: string]: string } = null
    ): Promise<T[]> {

        if ((!matroids) || (!matroids.length)) {
            return null;
        }

        let moduleTable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];

        if (!moduleTable) {
            return null;
        }

        // On vérifie qu'on peut faire un select
        if (!this.checkAccessSync(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        /**
         * Changement de fonctionnement si on est sur un matroid de var on peut utiliser une recherche directe sur l'index
         */
        let where_clauses: string[] = [];
        if (moduleTable.isMatroidTable && (!!moduleTable.getFieldFromId('var_id'))) {
            // Cas d'un param de var

            let where_clause: string = "(_bdd_only_index in (";
            let first_matroid = true;
            for (let matroid_i in matroids) {
                let matroid = matroids[matroid_i];

                if (!matroid) {
                    ConsoleHandler.getInstance().error('Matroid vide:' + api_type_id + ':' + (matroid ? matroid._type : null) + ':');
                    return null;
                }

                where_clause += (first_matroid ? "" : ",") + "'" + (matroid as VarDataBaseVO)._bdd_only_index + "'";
                first_matroid = false;
            }

            if (first_matroid) {
                return null;
            }

            where_clause += "))";
            where_clauses.push(where_clause);
        } else {
            // Cas général

            let first_matroid = true;
            for (let matroid_i in matroids) {
                let matroid = matroids[matroid_i];

                if (!matroid) {
                    ConsoleHandler.getInstance().error('Matroid vide:' + api_type_id + ':' + (matroid ? matroid._type : null) + ':');
                    return null;
                }

                let where_clause: string = '';

                // On ajoute un segment dédié à la gestion des vars pour faciliter le fonctionnement
                // Si on a un param de type varparam ou vardata, et une cible de type vardata, on ajoute un filtrage sur le var_id, si il existe dans le param
                if (!!(matroid as VarDataBaseVO).var_id) {

                    if (!!moduleTable.getFieldFromId('var_id')) {
                        where_clause += '(var_id = ' + (matroid as VarDataBaseVO).var_id + ') AND ';
                    }
                }

                let matroid_fields = MatroidController.getInstance().getMatroidFields(matroid._type);

                let first = true;
                for (let i in matroid_fields) {
                    let matroid_field = matroid_fields[i];
                    let ranges: Array<IRange<any>> = matroid[matroid_field.field_id];
                    let field = moduleTable.getFieldFromId((fields_ids_mapper && fields_ids_mapper[matroid_field.field_id]) ? fields_ids_mapper[matroid_field.field_id] : matroid_field.field_id);

                    if (!field) {
                        continue;
                    }

                    if (moduleTable.is_segmented && (field.field_id == moduleTable.table_segmented_field.field_id)) {
                        continue;
                    }

                    if ((!ranges) || (!ranges.length)) {
                        ConsoleHandler.getInstance().error('Matroid field vide ou inexistant:' + api_type_id + ':' + matroid_fields[i].field_id + ':');
                        return null;
                    }

                    where_clause += first ? "(" : ") AND (";

                    let ranges_clause = "'{";
                    for (let j in ranges) {
                        let field_range: IRange<any> = ranges[j];

                        if (!RangeHandler.getInstance().isValid(field_range)) {
                            ConsoleHandler.getInstance().error('field_range invalid:' + api_type_id + ':' + JSON.stringify(field_range) + ':');
                            return null;
                        }

                        first = false;
                        first_matroid = false;

                        ranges_clause += (ranges_clause == "'{") ? '' : ',';

                        switch (field.field_type) {

                            case ModuleTableField.FIELD_TYPE_numrange_array:
                            case ModuleTableField.FIELD_TYPE_refrange_array:
                            case ModuleTableField.FIELD_TYPE_isoweekdays:
                                ranges_clause += "\"" + (field_range.min_inclusiv ? "[" : "(") + field_range.min + "," + field_range.max + (field_range.max_inclusiv ? "]" : ")") + "\"";
                                break;

                            case ModuleTableField.FIELD_TYPE_tstzrange_array:
                                ranges_clause += "\"" + (field_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().getUnixForBDD(field_range.min) + "," + DateHandler.getInstance().getUnixForBDD(field_range.max) + (field_range.max_inclusiv ? "]" : ")") + "\"";
                                break;

                            default:
                                ConsoleHandler.getInstance().error('cannot getVosByExactFieldRanges with non range array fields');
                                return null;
                        }
                    }
                    ranges_clause += "}'";

                    where_clause += ranges_clause + " = " + field.field_id;
                }
                if (first) {
                    return null;
                }
                where_clause += ")";

                where_clauses.push(where_clause);
            }

            if (first_matroid) {
                return null;
            }
        }

        let vos: T[] = [];

        if (moduleTable.is_segmented) {

            let request = null;
            let segmentations_tables: { [table_name: string]: number } = {};

            // On cherche dans le matroid le field qui est la segmentation. Si on a pas, on refuse de chercher en masse
            let segmented_matroid_field_id = moduleTable.table_segmented_field.field_id;

            for (let matroid_field_id in fields_ids_mapper) {
                let field_id = fields_ids_mapper[matroid_field_id];

                if (field_id == moduleTable.table_segmented_field.field_id) {
                    segmented_matroid_field_id = matroid_field_id;
                    break;
                }
            }

            if (!segmented_matroid_field_id) {
                throw new Error('Not Implemented');
            }

            let vos_by_ids: { [id: number]: T } = {};

            for (let i in matroids) {
                let where_clause = where_clauses[i];
                let matroid = matroids[i];

                let segmentations: Array<IRange<any>> = matroid[segmented_matroid_field_id];

                // Si c'est un matroid on devrait avoir un cas simple de ranges directement mais on pourrait adapter à tous les types de field matroid
                // let matroid_moduleTable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[matroid._type];
                // let matroid_field = matroid_moduleTable.getFieldFromId(segmented_matroid_filed_id);

                // switch (matroid_field.field_type) {
                // }

                if (segmentations && segmentations.length) {

                    let self = this;
                    await RangeHandler.getInstance().foreach_ranges(segmentations, (segmented_value) => {

                        if (!self.has_segmented_known_database(moduleTable, segmented_value)) {
                            return;
                        }

                        let table_name = moduleTable.get_segmented_name(segmented_value);
                        segmentations_tables[table_name] = segmented_value;
                    });
                } else {
                    throw new Error('Not Implemented');
                }

                for (let segmentation_table in segmentations_tables) {

                    if (!request) {
                        request = '';
                    } else {
                        request += ' UNION ALL ';
                    }
                    request += 'select * from ' + moduleTable.database + '.' + segmentation_table + ' t where ' + where_clause + ' ';
                }

                /**
                 * Attention en cas de segmentation on peut très bien ne pas avoir de table du tout ! Donc la requête plante complètement et ça veut juste dire 0 résultats
                 */
                let tmp_vos = null;
                try {
                    tmp_vos = request ? moduleTable.forceNumerics(await ModuleServiceBase.getInstance().db.query(request + ';') as T[]) : null;
                } catch (error) {
                }

                for (let k in tmp_vos) {
                    let tmp_vo = tmp_vos[k];

                    vos_by_ids[tmp_vo.id] = tmp_vo;
                }
            }

            vos = Object.values(vos_by_ids);
        } else {
            vos = moduleTable.forceNumerics(await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + moduleTable.full_name + " t WHERE " + '(' + where_clauses.join(') OR (') + ')' + ";") as T[]);
        }

        // On filtre suivant les droits d'accès
        return await this.filterVOsAccess(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);
    }


    private get_simple_field_query(field: ModuleTableField<any>, value: any, table_name: string = "t"): string {

        if (value == null) {
            return table_name + '.' + field.field_id + " is null";
        }

        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_email:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_translatable_text:
            case ModuleTableField.FIELD_TYPE_textarea:
                return table_name + '.' + field.field_id + " = '" + value + "'";
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
                return table_name + '.' + field.field_id + " = " + value;

            case ModuleTableField.FIELD_TYPE_tstz:
                return table_name + '.' + field.field_id + " = " + (value as Moment).unix();

            case ModuleTableField.FIELD_TYPE_tstz_array:
                throw new Error('Not implemented');

            case ModuleTableField.FIELD_TYPE_date:
            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_month:
                throw new Error('Not implemented');

            case ModuleTableField.FIELD_TYPE_timestamp: // TODO FIXME
            case ModuleTableField.FIELD_TYPE_timewithouttimezone: // TODO FIXME
                throw new Error('Not implemented');

            case ModuleTableField.FIELD_TYPE_geopoint:
                throw new Error('Not implemented');

            case ModuleTableField.FIELD_TYPE_tsrange:
            case ModuleTableField.FIELD_TYPE_numrange:
            case ModuleTableField.FIELD_TYPE_daterange: // TODO FIXME
            case ModuleTableField.FIELD_TYPE_hourrange:
                throw new Error('Not implemented');

            case ModuleTableField.FIELD_TYPE_int_array:
            case ModuleTableField.FIELD_TYPE_isoweekdays:
                throw new Error('Not implemented');

            case ModuleTableField.FIELD_TYPE_refrange_array:
            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_tstzrange_array:
            case ModuleTableField.FIELD_TYPE_hourrange_array:
            default:
                throw new Error('Not implemented');
        }
    }


    private get_ranges_query_cardinal_1(field: ModuleTableField<any>, filter_field_type: string, range: IRange<any>, table_name: string): string {

        let res: string = '';

        // Trois cas, soit on est sur une valeur unique, et un champ de type valeur (pas range et pas array)
        //  Dans ce cas on fait encore beaucoup plus simple : a = x
        // Ou sur une valeur pas unique mais donc de cardinal 1 (range pas ranges, mais entre 2 et 4 exclu par exemple) et sur un champs de type valeur
        //  dans ce cas on peut faire a >= min && a < max ce qui est bcp plus opti
        // Ou cas global on prend en vrac

        let is_champs_type_valeur: boolean = this.is_field_type_valeur(field);

        if (is_champs_type_valeur) {

            return this.get_range_check_simple_field_type_valeur(field, filter_field_type, range, table_name);
        }

        let ranges_query: string = this.get_range_translated_to_bdd_queryable_range(range, field, filter_field_type);

        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_email:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_translatable_text:
            case ModuleTableField.FIELD_TYPE_textarea:
                if (filter_field_type == ModuleTableField.FIELD_TYPE_tsrange) {
                    res += table_name + '.' + field.field_id + "::timestamp with time zone <@ " + ranges_query;
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
                res += table_name + '.' + field.field_id + "::numeric <@ " + ranges_query;
                break;
            case ModuleTableField.FIELD_TYPE_tstz_array:
                res += ranges_query + " @> ALL (" + table_name + '.' + field.field_id + "::numeric[])";
                break;
            case ModuleTableField.FIELD_TYPE_date:
            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_month:
                res += table_name + '.' + field.field_id + "::date <@ " + ranges_query;
                break;
            case ModuleTableField.FIELD_TYPE_timestamp: // TODO FIXME
            case ModuleTableField.FIELD_TYPE_timewithouttimezone: // TODO FIXME
                res += table_name + '.' + field.field_id + " <@ " + ranges_query;
                break;
            case ModuleTableField.FIELD_TYPE_geopoint:
                // TODO
                break;
            case ModuleTableField.FIELD_TYPE_tsrange:
            case ModuleTableField.FIELD_TYPE_numrange:
            case ModuleTableField.FIELD_TYPE_daterange: // TODO FIXME
            case ModuleTableField.FIELD_TYPE_hourrange:
                res += table_name + '.' + field.field_id + " <@ " + ranges_query;
                break;

            case ModuleTableField.FIELD_TYPE_int_array:
            case ModuleTableField.FIELD_TYPE_isoweekdays:
                res += ranges_query + " @> ALL (" + table_name + '.' + field.field_id + "::numeric[])";
                break;

            case ModuleTableField.FIELD_TYPE_refrange_array:
            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_tstzrange_array:
            case ModuleTableField.FIELD_TYPE_hourrange_array:
            default:
                res += ranges_query + " @> ALL (" + table_name + '.' + field.field_id + "::numrange[])";
                break;
        }

        return res;
    }

    private is_field_type_valeur(field: ModuleTableField<any>): boolean {
        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_email:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_translatable_text:
            case ModuleTableField.FIELD_TYPE_textarea:
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
            case ModuleTableField.FIELD_TYPE_date:
            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_month:
            case ModuleTableField.FIELD_TYPE_timestamp:
            case ModuleTableField.FIELD_TYPE_timewithouttimezone:
            case ModuleTableField.FIELD_TYPE_geopoint:
                return true;

            case ModuleTableField.FIELD_TYPE_tstz_array:
            case ModuleTableField.FIELD_TYPE_daterange:
            case ModuleTableField.FIELD_TYPE_int_array:
            case ModuleTableField.FIELD_TYPE_isoweekdays:
            case ModuleTableField.FIELD_TYPE_refrange_array:
            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_tstzrange_array:
            case ModuleTableField.FIELD_TYPE_tsrange:
            case ModuleTableField.FIELD_TYPE_numrange:
            case ModuleTableField.FIELD_TYPE_hourrange:
            case ModuleTableField.FIELD_TYPE_hourrange_array:
            default:
                return false;
        }
    }

    private get_ranges_query_exact_search(field: ModuleTableField<any>, filter_field_type: string, field_ranges: Array<IRange<any>>, table_name: string): string {

        let res: string = '';

        let ranges_query: string = this.get_ranges_translated_to_bdd_queryable_ranges(field_ranges, field, filter_field_type);

        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_email:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_translatable_text:
            case ModuleTableField.FIELD_TYPE_textarea:
                if (filter_field_type == ModuleTableField.FIELD_TYPE_tsrange) {
                    res += 'ARRAY[' + table_name + '.' + field.field_id + "::timestamp with time zone" + "] = " + ranges_query;
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
                res += 'ARRAY[' + table_name + '.' + field.field_id + "::numeric" + "] = " + ranges_query;
                break;
            case ModuleTableField.FIELD_TYPE_date:
            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_month:
                res += 'ARRAY[' + table_name + '.' + field.field_id + "::date" + "] = " + ranges_query;
                break;
            case ModuleTableField.FIELD_TYPE_daterange: // TODO FIXME
            case ModuleTableField.FIELD_TYPE_timestamp: // TODO FIXME
            case ModuleTableField.FIELD_TYPE_timewithouttimezone: // TODO FIXME
                res += 'ARRAY[' + table_name + '.' + field.field_id + "] = " + ranges_query;
                break;
            case ModuleTableField.FIELD_TYPE_geopoint:
                // TODO
                break;
            case ModuleTableField.FIELD_TYPE_tstz_array:
            case ModuleTableField.FIELD_TYPE_int_array:
            case ModuleTableField.FIELD_TYPE_isoweekdays:
            case ModuleTableField.FIELD_TYPE_refrange_array:
            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_tstzrange_array:
            case ModuleTableField.FIELD_TYPE_tsrange: // vraiment ?
            case ModuleTableField.FIELD_TYPE_numrange: // vraiment ?
            case ModuleTableField.FIELD_TYPE_hourrange: // vraiment ?
            case ModuleTableField.FIELD_TYPE_hourrange_array:
            default:
                res += ranges_query + " = " + table_name + '.' + field.field_id;
                break;
        }

        return res;
    }

    private get_range_check_simple_field_type_valeur(field: ModuleTableField<any>, filter_field_type: string, range: IRange<any>, table_name: string): string {
        if (RangeHandler.getInstance().getCardinal(range) == 1) {
            return table_name + '.' + field.field_id + ' = ' + this.get_range_segment_value_to_bdd(field, filter_field_type, RangeHandler.getInstance().getSegmentedMin(range)) + ' ';
        } else {
            let segmented_min = RangeHandler.getInstance().getSegmentedMin(range);
            let segmented_max = RangeHandler.getInstance().getSegmentedMax(range, range.segment_type, 1);

            return table_name + '.' + field.field_id + ' >= ' + this.get_range_segment_value_to_bdd(field, filter_field_type, segmented_min) + ' and ' +
                table_name + '.' + field.field_id + ' < ' + this.get_range_segment_value_to_bdd(field, filter_field_type, segmented_max) + ' ';
        }
    }

    private get_ranges_query_cardinal_supp_1(field: ModuleTableField<any>, filter_field_type: string, field_ranges: Array<IRange<any>>, table_name: string, full_name: string): string {

        let res: string = '';

        // On est sur un array de ranges, mais si on cible un champs simple de type valeur (ni array ni range) on peut faire très simplement :
        //  ((a >= range1_min) && (a < range1_max_exclusif)) || ((a >= range2_min) && (a < range2_max_exclusif)) || ...

        let is_champs_type_valeur: boolean = this.is_field_type_valeur(field);

        if (is_champs_type_valeur) {

            res = '(';
            let first: boolean = true;
            for (let i in field_ranges) {
                let range = field_ranges[i];

                if (!first) {
                    res += ' OR ';
                }
                first = false;

                res += '(' + this.get_range_check_simple_field_type_valeur(field, filter_field_type, range, table_name) + ')';
            }
            res += ')';

            return res;
        }

        /**
         * Dans le cas d'un champs de type range[]
         * (
         *   select count(1)
         *   from (
         *     select unnest(A) a
         *     from dt.t t2
         *     where t2.id=t1.id
         *   ) t
         *   where t.a <@ ANY(ARRAY['[1,2)'::numrange])
         * ) = array_length(A,1);
         *
         * Dans le cas d'un field non ARRAY
         * A <@ ANY(ARRAY['[1,2)'::numrange])
         */

        let ranges_query = 'ANY(' + this.get_ranges_translated_to_bdd_queryable_ranges(field_ranges, field, filter_field_type) + ')';

        /**
         * Dans le cas d'un champs de type range[]
         * (
         *   select count(1)
         *   from (
         *     select unnest(A) a
         *     from dt.t t2
         *     where t2.id=t1.id
         *   ) t
         *   where t.a <@ ANY(ARRAY['[1,2)'::numrange])
         * ) = array_length(A,1);
         *
         * Dans le cas d'un field non ARRAY
         * A <@ ANY(ARRAY['[1,2)'::numrange])
         */

        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_email:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_translatable_text:
            case ModuleTableField.FIELD_TYPE_textarea:
                if (filter_field_type == ModuleTableField.FIELD_TYPE_tsrange) {
                    res += table_name + '.' + field.field_id + "::timestamp with time zone <@ " + ranges_query;
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
                res += table_name + '.' + field.field_id + "::numeric <@ " + ranges_query;
                break;
            case ModuleTableField.FIELD_TYPE_date:
            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_month:
                res += table_name + '.' + field.field_id + "::date <@ " + ranges_query;
                break;
            case ModuleTableField.FIELD_TYPE_numrange:
            case ModuleTableField.FIELD_TYPE_tsrange:
            case ModuleTableField.FIELD_TYPE_hourrange:
            case ModuleTableField.FIELD_TYPE_daterange:
            case ModuleTableField.FIELD_TYPE_timestamp:
            case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                res += table_name + '.' + field.field_id + " <@ " + ranges_query;
                break;
            case ModuleTableField.FIELD_TYPE_geopoint:
                // TODO
                break;

            case ModuleTableField.FIELD_TYPE_tstz_array:
            case ModuleTableField.FIELD_TYPE_int_array:
            case ModuleTableField.FIELD_TYPE_isoweekdays:
            case ModuleTableField.FIELD_TYPE_refrange_array:
            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_tstzrange_array:
            case ModuleTableField.FIELD_TYPE_hourrange_array:
            default:
                /**
                 * Dans le cas d'un champs de type []
                 * (
                 *   select count(1)
                 *   from (
                 *     select unnest(A) a
                 *     from dt.t t2
                 *     where t2.id=t1.id
                 *   ) t
                 *   where t.a <@ ANY(ARRAY['[1,2)'::numrange])
                 * ) = array_length(A,1);
                 *
                 * Dans le cas d'un field non ARRAY
                 * A <@ ANY(ARRAY['[1,2)'::numrange])
                 */

                res +=
                    '(' +
                    '  select count(1)' +
                    '  from (' +
                    '   select unnest(' + table_name + '.' + field.field_id + ') a' +
                    '  from ' + full_name + ' t2' +
                    '  where t2.id = t.id) t1' +
                    '  where t1.a <@ ' + ranges_query +
                    '  ) = array_length(' + table_name + '.' + field.field_id + ',1) ';
                break;
        }

        return res;
    }

    private get_ranges_translated_to_bdd_queryable_ranges(ranges: Array<IRange<any>>, field: ModuleTableField<any>, filter_field_type: string): string {
        let ranges_query: string = 'ARRAY[';

        let first_range: boolean = true;

        for (let i in ranges) {
            let range = ranges[i];

            if (!first_range) {
                ranges_query += ',';
            }

            first_range = false;

            ranges_query += this.get_range_translated_to_bdd_queryable_range(range, field, filter_field_type);
        }

        ranges_query += ']';

        return ranges_query;
    }


    private get_range_translated_to_bdd_queryable_range(range: IRange<any>, field: ModuleTableField<any>, filter_field_type: string): string {

        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_email:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_translatable_text:
            case ModuleTableField.FIELD_TYPE_textarea:
                if (filter_field_type == ModuleTableField.FIELD_TYPE_tsrange) {
                    return '\'' + (range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(range.min) + "," + DateHandler.getInstance().formatDayForIndex(range.max) + (range.max_inclusiv ? "]" : ")") + '\'' + '::tsrange';
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
            case ModuleTableField.FIELD_TYPE_int_array:
            case ModuleTableField.FIELD_TYPE_refrange_array:
            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_isoweekdays:
                if ((filter_field_type == ModuleTableField.FIELD_TYPE_refrange_array) || (filter_field_type == ModuleTableField.FIELD_TYPE_numrange_array) || (filter_field_type == ModuleTableField.FIELD_TYPE_isoweekdays)) {
                    return '\'' + (range.min_inclusiv ? "[" : "(") + range.min + "," + range.max + (range.max_inclusiv ? "]" : ")") + '\'' + '::numrange';
                } else if (filter_field_type == ModuleTableField.FIELD_TYPE_hourrange_array) {
                    return '\'' + (range.min_inclusiv ? "[" : "(") + (range.min as Duration).asMilliseconds() + "," + (range.max as Duration).asMilliseconds() + (range.max_inclusiv ? "]" : ")") + '\'' + '::numrange';
                }
                break;
            case ModuleTableField.FIELD_TYPE_hourrange_array:
            case ModuleTableField.FIELD_TYPE_hourrange:
                if (filter_field_type == ModuleTableField.FIELD_TYPE_hourrange_array) {
                    return '\'' + (range.min_inclusiv ? "[" : "(") + (range.min as Duration).asMilliseconds() + "," + (range.max as Duration).asMilliseconds() + (range.max_inclusiv ? "]" : ")") + '\'' + '::int8range';
                }
                break;
            case ModuleTableField.FIELD_TYPE_date:
            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_month:
                return '\'' + (range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(range.min) + "," + DateHandler.getInstance().formatDayForIndex(range.max) + (range.max_inclusiv ? "]" : ")") + '\'' + '::daterange';
            case ModuleTableField.FIELD_TYPE_tstzrange_array:
            case ModuleTableField.FIELD_TYPE_tstz_array:
            case ModuleTableField.FIELD_TYPE_tstz:
                return '\'' + (range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().getUnixForBDD(range.min) + "," + DateHandler.getInstance().getUnixForBDD(range.max) + (range.max_inclusiv ? "]" : ")") + '\'' + '::numrange';
            case ModuleTableField.FIELD_TYPE_timestamp:
            case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                // TODO FIXME
                break;
            case ModuleTableField.FIELD_TYPE_daterange:
                return '\'' + (range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(range.min) + "," + DateHandler.getInstance().formatDayForIndex(range.max) + (range.max_inclusiv ? "]" : ")") + '\'' + '::daterange';
            case ModuleTableField.FIELD_TYPE_tsrange:
                return '\'' + (range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().getUnixForBDD(range.min) + "," + DateHandler.getInstance().getUnixForBDD(range.max) + (range.max_inclusiv ? "]" : ")") + '\'' + '::numrange';
            case ModuleTableField.FIELD_TYPE_numrange:
                return '\'' + (range.min_inclusiv ? "[" : "(") + range.min.toString() + "," + range.max.toString() + (range.max_inclusiv ? "]" : ")") + '\'' + '::numrange';

            case ModuleTableField.FIELD_TYPE_geopoint:
                // TODO
                break;
        }

        return null;
    }

    private get_range_segment_value_to_bdd(field: ModuleTableField<any>, filter_field_type: string, segmented_value: any): string {

        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_email:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_translatable_text:
            case ModuleTableField.FIELD_TYPE_textarea:
                if (filter_field_type == ModuleTableField.FIELD_TYPE_tsrange) {
                    return DateHandler.getInstance().formatDayForIndex(segmented_value);
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
            case ModuleTableField.FIELD_TYPE_int_array:
            case ModuleTableField.FIELD_TYPE_refrange_array:
            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_isoweekdays:
                if ((filter_field_type == ModuleTableField.FIELD_TYPE_refrange_array) || (filter_field_type == ModuleTableField.FIELD_TYPE_numrange_array) || (filter_field_type == ModuleTableField.FIELD_TYPE_isoweekdays)) {
                    return segmented_value;
                } else if (filter_field_type == ModuleTableField.FIELD_TYPE_hourrange_array) {
                    return (segmented_value as Duration).asMilliseconds().toString();
                }
                break;
            case ModuleTableField.FIELD_TYPE_hourrange_array:
            case ModuleTableField.FIELD_TYPE_hourrange:
                if (filter_field_type == ModuleTableField.FIELD_TYPE_hourrange_array) {
                    return (segmented_value as Duration).asMilliseconds().toString();
                }
                break;
            case ModuleTableField.FIELD_TYPE_date:
            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_month:
                return DateHandler.getInstance().formatDayForIndex(segmented_value);
            case ModuleTableField.FIELD_TYPE_tstzrange_array:
            case ModuleTableField.FIELD_TYPE_tstz_array:
            case ModuleTableField.FIELD_TYPE_tstz:
                return DateHandler.getInstance().getUnixForBDD(segmented_value).toString();
            case ModuleTableField.FIELD_TYPE_timestamp:
            case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                // TODO FIXME
                break;
            case ModuleTableField.FIELD_TYPE_daterange:
                return DateHandler.getInstance().formatDayForIndex(segmented_value);
            case ModuleTableField.FIELD_TYPE_tsrange:
                return DateHandler.getInstance().getUnixForBDD(segmented_value).toString();
            case ModuleTableField.FIELD_TYPE_numrange:
                return segmented_value.toString();

            case ModuleTableField.FIELD_TYPE_geopoint:
                // TODO
                break;
        }

        return null;
    }

    private async refuse(params: { [uid: number]: { [CLIENT_TAB_ID: string]: boolean } }) {

        for (let uid_s in params) {
            let uid: number = parseInt(uid_s.toString());
            for (let CLIENT_TAB_ID in params[uid]) {
                await PushDataServerController.getInstance().notifySimpleERROR(uid, CLIENT_TAB_ID, 'dao.global_update_blocker.actif', true);
            }
        }
        ConsoleHandler.getInstance().warn("global_update_blocker actif");
    }
}
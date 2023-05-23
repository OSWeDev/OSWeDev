import { DatabaseError, Pool } from 'pg';
import { from as copyFrom } from 'pg-copy-streams';
import pgPromise from 'pg-promise';
import { Readable } from 'stream';
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
import ContextQueryInjectionCheckHandler from '../../../shared/modules/ContextFilter/ContextQueryInjectionCheckHandler';
import ModuleContextFilter from '../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVO, { filter } from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryVO, { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ParameterizedQueryWrapperField from '../../../shared/modules/ContextFilter/vos/ParameterizedQueryWrapperField';
import DAOController from '../../../shared/modules/DAO/DAOController';
import { IContextHookFilterVos } from '../../../shared/modules/DAO/interface/IContextHookFilterVos';
import { IHookFilterVos } from '../../../shared/modules/DAO/interface/IHookFilterVos';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import IRange from '../../../shared/modules/DataRender/interfaces/IRange';
import NumRange from '../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../shared/modules/DataRender/vos/NumSegment';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import TSRange from '../../../shared/modules/DataRender/vos/TSRange';
import FeedbackVO from '../../../shared/modules/Feedback/vos/FeedbackVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import MaintenanceVO from '../../../shared/modules/Maintenance/vos/MaintenanceVO';
import IMatroid from '../../../shared/modules/Matroid/interfaces/IMatroid';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import ModuleTable from '../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ParamVO from '../../../shared/modules/Params/vos/ParamVO';
import StatsController from '../../../shared/modules/Stats/StatsController';
import StatsTypeVO from '../../../shared/modules/Stats/vos/StatsTypeVO';
import StatVO from '../../../shared/modules/Stats/vos/StatVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VOsTypesManager from '../../../shared/modules/VO/manager/VOsTypesManager';
import VocusInfoVO from '../../../shared/modules/Vocus/vos/VocusInfoVO';
import BooleanHandler from '../../../shared/tools/BooleanHandler';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import DateHandler from '../../../shared/tools/DateHandler';
import MatroidIndexHandler from '../../../shared/tools/MatroidIndexHandler';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import { all_promises } from '../../../shared/tools/PromiseTools';
import RangeHandler from '../../../shared/tools/RangeHandler';
import ThrottleHelper from '../../../shared/tools/ThrottleHelper';
import ConfigurationService from '../../env/ConfigurationService';
import StackContext from '../../StackContext';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ServerAnonymizationController from '../Anonymization/ServerAnonymizationController';
import ModuleDBService from '../ModuleDBService';
import ModuleServerBase from '../ModuleServerBase';
import ModuleServiceBase from '../ModuleServiceBase';
import ModulesManagerServer from '../ModulesManagerServer';
import ModuleTableDBService from '../ModuleTableDBService';
import PushDataServerController from '../PushData/PushDataServerController';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';
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
import ThrottledSelectQueryParam from './vos/ThrottledSelectQueryParam';

export default class ModuleDAOServer extends ModuleServerBase {

    public static PARAM_NAME_insert_without_triggers_using_COPY: string = 'ModuleDAOServer.insert_without_triggers_using_COPY';
    public static PARAM_NAME_throttled_select_query_size_ms: string = 'ModuleDAOServer.throttled_select_query_size_ms';

    public static TASK_NAME_add_segmented_known_databases: string = ModuleDAO.getInstance().name + ".add_segmented_known_databases";

    public static getInstance() {
        if (!ModuleDAOServer.instance) {
            ModuleDAOServer.instance = new ModuleDAOServer();
        }
        return ModuleDAOServer.instance;
    }

    private static instance: ModuleDAOServer = null;

    public check_foreign_keys: boolean = true;

    public throttled_refuse = ThrottleHelper.getInstance().declare_throttle_with_mappable_args(this.refuse.bind(this), 1000, { leading: false, trailing: true });

    private copy_dedicated_pool = null;
    private log_db_query_perf_uid: number = 0;

    /**
     * Le nombre de ms pour le throttle des select queries
     */
    private throttled_select_query_size_ms: number = 10;
    /**
     * Le throttle actuellement en place. Si on le change via les params il faut bien le reconstruire avec le throttle helper
     */
    private current_throttled_select_query_size_ms: number = 10;
    /**
     * Les params du throttled_select_query
     */
    private throttled_select_query_params: ThrottledSelectQueryParam[] = [];
    /**
     * Derniere vérif du param throttled_select_query_size
     */
    private throttled_select_query_size_ms_param_last_update: number = Dates.now();

    private log_db_query_perf_start_by_uid: { [uid: number]: number } = {};

    private throttled_select_query_ = ThrottleHelper.getInstance().declare_throttle_with_mappable_args(this.throttled_select_query.bind(this), 1, { leading: false, trailing: true });

    private constructor() {
        super(ModuleDAO.getInstance().name);
    }

    public get_all_ranges_from_segmented_table(moduleTable: ModuleTable<any>): NumRange[] {
        let segmentations: { [table_name: string]: number } = DAOServerController.segmented_known_databases[moduleTable.database];
        if (!segmentations) {
            return null;
        }

        let ranges: NumRange[] = [];

        for (let i in segmentations) {
            let segment = segmentations[i];

            ranges.push(RangeHandler.create_single_elt_NumRange(segment, moduleTable.table_segmented_field_segment_type));
        }

        return ranges;
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let promises = [];
        let group_overall: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        promises.push((async () => {
            group_overall.translatable_name = ModuleDAO.POLICY_GROUP_OVERALL;
            group_overall = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group_overall, new DefaultTranslation({
                'fr-fr': '!!! Accès à toutes les tables'
            }));
        })());

        let group_datas: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        promises.push((async () => {
            group_datas.translatable_name = ModuleDAO.POLICY_GROUP_DATAS;
            group_datas = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group_datas, new DefaultTranslation({
                'fr-fr': 'Données'
            }));
        })());

        let group_modules_conf: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        promises.push((async () => {
            group_modules_conf.translatable_name = ModuleDAO.POLICY_GROUP_MODULES_CONF;
            group_modules_conf = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group_modules_conf, new DefaultTranslation({
                'fr-fr': 'Paramètres des modules'
            }));
        })());

        await Promise.all(promises);
        promises = [];

        promises.push((async () => {
            let POLICY_CAN_EDIT_REMOVED_CRUD_FIELDS: AccessPolicyVO = new AccessPolicyVO();
            POLICY_CAN_EDIT_REMOVED_CRUD_FIELDS.group_id = group_overall.id;
            POLICY_CAN_EDIT_REMOVED_CRUD_FIELDS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
            POLICY_CAN_EDIT_REMOVED_CRUD_FIELDS.translatable_name = ModuleDAO.POLICY_CAN_EDIT_REMOVED_CRUD_FIELDS;
            POLICY_CAN_EDIT_REMOVED_CRUD_FIELDS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_CAN_EDIT_REMOVED_CRUD_FIELDS, new DefaultTranslation({
                'fr-fr': 'Configurer les champs masqués des CRUD'
            }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        })());

        promises.push((async () => {
            // On déclare un droit permettant de faire appel à la fonction query du module dao server
            let query_access: AccessPolicyVO = new AccessPolicyVO();
            query_access.group_id = group_overall.id;
            query_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
            query_access.translatable_name = ModuleDAO.DAO_ACCESS_QUERY;
            query_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(query_access, new DefaultTranslation({
                'fr-fr': 'Utiliser la fonction QUERY'
            }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        })());

        let global_access: AccessPolicyVO = new AccessPolicyVO();
        promises.push((async () => {
            // On déclare un droit global d'accès qui déclenche tous les autres
            global_access.group_id = group_overall.id;
            global_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
            global_access.translatable_name = ModuleDAO.POLICY_GROUP_OVERALL + '.' + ModuleDAO.DAO_ACCESS_TYPE_LIST_LABELS + "." + "___GLOBAL_ACCESS___";
            global_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(global_access, new DefaultTranslation({
                'fr-fr': 'Outrepasser les droits d\'accès'
            }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        })());

        await Promise.all(promises);
        promises = [];

        // On doit déclarer les access policies de tous les VO
        let lang: LangVO = await ModuleTranslation.getInstance().getLang(DefaultTranslation.DEFAULT_LANG_DEFAULT_TRANSLATION);
        for (let i in VOsTypesManager.moduleTables_by_voType) {
            let moduleTable: ModuleTable<any> = VOsTypesManager.moduleTables_by_voType[i];
            let vo_type: string = moduleTable.vo_type;

            // Uniquement si le module est actif, mais là encore est-ce une erreur ? ...
            if (moduleTable.module && !moduleTable.module.actif) {
                continue;
            }

            promises.push((async () => {
                // On a besoin de la trad de ce vo_type, si possible celle en base, sinon celle en default translation si elle existe, sinon on reste sur le vo_type
                let vo_translation: string = vo_type;
                let vo_type_translatable_code: string = VOsTypesManager.moduleTables_by_voType[vo_type].label ? VOsTypesManager.moduleTables_by_voType[vo_type].label.code_text : null;
                let translation_from_bdd: TranslationVO = (lang && vo_type_translatable_code) ? await query(TranslationVO.API_TYPE_ID)
                    .filter_by_id(lang.id, LangVO.API_TYPE_ID)
                    .filter_by_text_eq('code_text', vo_type_translatable_code, TranslatableTextVO.API_TYPE_ID)
                    .select_vo<TranslationVO>() : null;
                if (translation_from_bdd && (translation_from_bdd.translated != "")) {
                    vo_translation = translation_from_bdd.translated;
                } else {
                    if (DefaultTranslationManager.registered_default_translations[vo_type_translatable_code]) {
                        let default_translation: string = DefaultTranslationManager.registered_default_translations[vo_type_translatable_code].default_translations[DefaultTranslation.DEFAULT_LANG_DEFAULT_TRANSLATION];
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
                let module_ = await ModulesManagerServer.getInstance().getModuleVOByName(moduleTable.module ? moduleTable.module.name : null);

                // On déclare les 4 policies et leurs dépendances

                /**
                 * LIST
                 */
                let vo_list: AccessPolicyVO = null;

                /**
                 * READ
                 */
                let vo_read: AccessPolicyVO = null;

                /**
                 * INSERT OR UPDATE
                 */
                let vo_insert_or_update: AccessPolicyVO = null;

                /**
                 * DELETE
                 */
                let vo_delete: AccessPolicyVO = null;

                await all_promises([
                    (async () => {
                        vo_list = await ModuleAccessPolicyServer.getInstance().registerPolicy(
                            DAOServerController.getInstance().get_dao_policy(
                                DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_LIST_LABELS, vo_type),
                                group, isAccessConfVoType, AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE),
                            (vo_translation && (vo_translation != "")) ? new DefaultTranslation({ 'fr-fr': 'Lister les données de type "' + vo_translation + '"' }) : null,
                            module_);
                    })(),
                    (async () => {
                        vo_read = await ModuleAccessPolicyServer.getInstance().registerPolicy(
                            DAOServerController.getInstance().get_dao_policy(
                                DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, vo_type),
                                group, isAccessConfVoType, AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE),
                            (vo_translation && (vo_translation != "")) ? new DefaultTranslation({ 'fr-fr': 'Consulter les données de type "' + vo_translation + '"' }) : null,
                            module_);
                    })(),
                    (async () => {
                        vo_insert_or_update = await ModuleAccessPolicyServer.getInstance().registerPolicy(
                            DAOServerController.getInstance().get_dao_policy(
                                DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, vo_type),
                                group, isAccessConfVoType, AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN),
                            (vo_translation && (vo_translation != "")) ? new DefaultTranslation({ 'fr-fr': 'Ajouter ou modifier des données de type "' + vo_translation + '"' }) : null,
                            module_);
                    })(),
                    (async () => {
                        vo_delete = await ModuleAccessPolicyServer.getInstance().registerPolicy(
                            DAOServerController.getInstance().get_dao_policy(
                                DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_DELETE, vo_type),
                                group, isAccessConfVoType, AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN),
                            (vo_translation && (vo_translation != "")) ? new DefaultTranslation({ 'fr-fr': 'Supprimer des données de type "' + vo_translation + '"' }) : null,
                            module_);
                    })(),
                ]);

                await all_promises([
                    ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                        DAOServerController.getInstance().get_dao_dependency_default_granted(vo_list, global_access)),
                    ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                        DAOServerController.getInstance().get_dao_dependency_default_granted(
                            vo_list,
                            DAOServerController.getInstance().get_inherited_right(
                                ModuleDAO.DAO_ACCESS_TYPE_LIST_LABELS, moduleTable.inherit_rights_from_vo_type))),

                    ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                        DAOServerController.getInstance().get_dao_dependency_default_denied(vo_read, vo_list)),
                    ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                        DAOServerController.getInstance().get_dao_dependency_default_granted(vo_read, global_access)),
                    ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                        DAOServerController.getInstance().get_dao_dependency_default_granted(
                            vo_read,
                            DAOServerController.getInstance().get_inherited_right(
                                ModuleDAO.DAO_ACCESS_TYPE_READ, moduleTable.inherit_rights_from_vo_type))),

                    ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                        DAOServerController.getInstance().get_dao_dependency_default_denied(vo_insert_or_update, vo_read)),
                    ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                        DAOServerController.getInstance().get_dao_dependency_default_granted(vo_insert_or_update, global_access)),
                    ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                        DAOServerController.getInstance().get_dao_dependency_default_granted(
                            vo_insert_or_update,
                            DAOServerController.getInstance().get_inherited_right(
                                ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, moduleTable.inherit_rights_from_vo_type))),

                    ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                        DAOServerController.getInstance().get_dao_dependency_default_denied(vo_delete, vo_read)),
                    ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                        DAOServerController.getInstance().get_dao_dependency_default_granted(vo_delete, global_access)),
                    ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                        DAOServerController.getInstance().get_dao_dependency_default_granted(
                            vo_delete,
                            DAOServerController.getInstance().get_inherited_right(
                                ModuleDAO.DAO_ACCESS_TYPE_DELETE, moduleTable.inherit_rights_from_vo_type)))
                ]);
            })());
        }

        if (promises && promises.length) {
            await all_promises(promises);
        }
    }

    public async late_configuration() {
        await ModuleDAO.getInstance().late_configuration();
    }

    public async getqueryfor_insertOrUpdateVO(vo: IDistantVOBase, pre_update_vo: IDistantVOBase): Promise<string> {

        if (!vo._type) {
            ConsoleHandler.error("Un VO sans _type dans le DAO ! " + JSON.stringify(vo));
            return null;
        }

        let moduleTable: ModuleTable<any> = VOsTypesManager.moduleTables_by_voType[vo._type];

        if (!moduleTable) {
            ConsoleHandler.error("Impossible de trouver le moduleTable de ce _type ! " + JSON.stringify(vo));
            return null;
        }

        let sql: string = null;

        if (vo.id) {

            if (DAOServerController.getInstance().pre_update_trigger_hook.has_trigger(vo._type)) {

                // Ajout des triggers, avant et après modification.
                //  Attention si un des output est false avant modification, on annule la modification
                let res: boolean[] = await DAOServerController.getInstance().pre_update_trigger_hook.trigger(vo._type, new DAOUpdateVOHolder(pre_update_vo, vo));
                if (!BooleanHandler.getInstance().AND(res, true)) {
                    StatsController.register_stat_COMPTEUR('dao', 'insertOrUpdateVO', 'pre_update_trigger_hook_rejection');
                    return null;
                }
            }

            const setters = [];
            let fields = moduleTable.get_fields();
            for (let i in fields) {
                let field: ModuleTableField<any> = fields[i];

                if (typeof vo[field.field_id] == "undefined") {
                    if (!field.has_default || typeof field.field_default == 'undefined') {
                        continue;
                    }

                    vo[field.field_id] = field.field_default;
                }

                setters.push(field.field_id + ' = ${' + field.field_id + '}');

                /**
                 * Cas des ranges
                 */
                if ((field.field_type == ModuleTableField.FIELD_TYPE_numrange) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_tsrange) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_hourrange) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_numrange_array) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_refrange_array) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_isoweekdays) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_tstzrange_array) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_hourrange_array)) {

                    setters.push(field.field_id + '_ndx = ${' + field.field_id + '_ndx}');
                }
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

            if (DAOServerController.getInstance().pre_create_trigger_hook.has_trigger(vo._type)) {

                // Ajout des triggers, avant et après modification.
                //  Attention si un des output est false avant modification, on annule la modification
                let res: boolean[] = await DAOServerController.getInstance().pre_create_trigger_hook.trigger(vo._type, vo);
                if (!BooleanHandler.getInstance().AND(res, true)) {
                    StatsController.register_stat_COMPTEUR('dao', 'insertOrUpdateVO', 'pre_create_trigger_hook_rejection');
                    return null;
                }
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

                /**
                 * Cas des ranges
                 */
                if ((field.field_type == ModuleTableField.FIELD_TYPE_numrange) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_tsrange) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_hourrange) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_numrange_array) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_refrange_array) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_isoweekdays) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_tstzrange_array) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_hourrange_array)) {

                    tableFields.push(field.field_id + '_ndx');
                    placeHolders.push('${' + field.field_id + '_ndx}');
                }
            }

            let full_name = null;

            if (moduleTable.is_segmented) {
                // Si on est sur une table segmentée on adapte le comportement
                let name = moduleTable.get_segmented_name_from_vo(vo);
                full_name = moduleTable.get_segmented_full_name_from_vo(vo);

                // Si on est sur du segmented en insert on doit vérifier l'existence de la table, sinon il faut la créer avant d'insérer la première donnée
                if ((!DAOServerController.segmented_known_databases[moduleTable.database]) || (!DAOServerController.segmented_known_databases[moduleTable.database][name])) {

                    await ModuleTableDBService.getInstance(null).create_or_update_datatable(
                        moduleTable,
                        [RangeHandler.create_single_elt_range(moduleTable.table_segmented_field_range_type, moduleTable.get_segmented_field_value_from_vo(vo), moduleTable.table_segmented_field_segment_type)]);
                }
            } else {
                full_name = moduleTable.full_name;
            }

            sql = "INSERT INTO " + full_name + " (" + tableFields.join(', ') + ") VALUES (" + placeHolders.join(', ') + ") RETURNING id";
        }

        return sql;
    }

    public async confirm_segmented_tables_existence(vos: IDistantVOBase[]) {
        let segment_ok_by_type_and_segment_value: { [api_type_id: string]: { [segment: number]: boolean } } = {};
        let is_segmented_type: { [api_type_id: string]: boolean } = {};

        let tables_to_create_numranges: { [api_type_id: string]: NumRange[] } = {};

        for (let i in vos) {
            let vo = vos[i];

            if (is_segmented_type[vo._type] == null) {
                is_segmented_type[vo._type] = VOsTypesManager.moduleTables_by_voType[vo._type].is_segmented;
            }

            if (!is_segmented_type[vo._type]) {
                continue;
            }

            if (!segment_ok_by_type_and_segment_value[vo._type]) {
                segment_ok_by_type_and_segment_value[vo._type] = [];
            }

            let moduletable = VOsTypesManager.moduleTables_by_voType[vo._type];
            let segment_value = moduletable.get_segmented_field_value_from_vo(vo);
            let table_name = moduletable.get_segmented_name_from_vo(vo);

            if (segment_ok_by_type_and_segment_value[vo._type][segment_value] == null) {
                if ((DAOServerController.segmented_known_databases[moduletable.database] == null) || (DAOServerController.segmented_known_databases[moduletable.database][table_name] == null)) {
                    // La table n'existe pas on la crée tout de suite
                    // ATTENTION : ne pas mettre en tableau de promises, et ne pas utiliser dans un promise pipeline par exemple. On ne doit pas paralléliser la création de tables segmentées
                    if (!tables_to_create_numranges[vo._type]) {
                        tables_to_create_numranges[vo._type] = [];
                    }
                    tables_to_create_numranges[vo._type].push(RangeHandler.create_single_elt_NumRange(segment_value, NumSegment.TYPE_INT));
                }
                segment_ok_by_type_and_segment_value[vo._type][segment_value] = true;
            }
        }

        // ATTENTION : ne pas mettre en tableau de promises, et ne pas utiliser dans un promise pipeline par exemple. On ne doit pas paralléliser la création de tables segmentées
        for (let vo_type in tables_to_create_numranges) {
            let numranges = tables_to_create_numranges[vo_type];
            let moduletable = VOsTypesManager.moduleTables_by_voType[vo_type];

            if (!numranges || (numranges.length == 0)) {
                continue;
            }

            await ModuleTableDBService.getInstance(null).create_or_update_datatable(moduletable, numranges);
        }
    }

    public async configure() {

        await this.create_or_replace_function_ref_get_user();

        DAOServerController.getInstance().pre_update_trigger_hook = new DAOPreUpdateTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        ModuleTriggerServer.getInstance().registerTriggerHook(DAOServerController.getInstance().pre_update_trigger_hook);
        DAOServerController.getInstance().pre_create_trigger_hook = new DAOPreCreateTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        ModuleTriggerServer.getInstance().registerTriggerHook(DAOServerController.getInstance().pre_create_trigger_hook);
        DAOServerController.getInstance().pre_delete_trigger_hook = new DAOPreDeleteTriggerHook(DAOPreDeleteTriggerHook.DAO_PRE_DELETE_TRIGGER);
        ModuleTriggerServer.getInstance().registerTriggerHook(DAOServerController.getInstance().pre_delete_trigger_hook);

        DAOServerController.getInstance().post_update_trigger_hook = new DAOPostUpdateTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);
        ModuleTriggerServer.getInstance().registerTriggerHook(DAOServerController.getInstance().post_update_trigger_hook);
        DAOServerController.getInstance().post_create_trigger_hook = new DAOPostCreateTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        ModuleTriggerServer.getInstance().registerTriggerHook(DAOServerController.getInstance().post_create_trigger_hook);
        DAOServerController.getInstance().post_delete_trigger_hook = new DAOPostDeleteTriggerHook(DAOPostDeleteTriggerHook.DAO_POST_DELETE_TRIGGER);
        ModuleTriggerServer.getInstance().registerTriggerHook(DAOServerController.getInstance().post_delete_trigger_hook);

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Modifier'
        }, 'editable_page_switch.edit.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Consulter'
        }, 'editable_page_switch.read.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Annuler les modifications en cours ?'
        }, 'crud.inline_input_mode_semaphore.confirm.body.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Des modifications sont en cours'
        }, 'crud.inline_input_mode_semaphore.confirm.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Modifications annulées'
        }, 'crud.inline_input_mode_semaphore.canceled.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Demande refusée : Le système est en lecture seule'
        }, 'dao.global_update_blocker.actif'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Suppression impossible, consulter les logs du serveur'
        }, 'dao.truncate.error'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Enregistrement...'
        }, 'EditablePageController.save.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Erreur lors de l\'enregistrement'
        }, 'EditablePageController.save.error.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Enregistrement terminé'
        }, 'EditablePageController.save.success.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Afficher / masquer les {ranges_length} elts...'
        }, 'ranges.limited.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Toutes les dates'
        }, 'tsrange.max_range.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Toutes les heures'
        }, 'hourrange.max_range.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Tous/Toutes'
        }, 'numrange.max_range.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Impossible d'enregistrer les données"
        }, 'dao.check_uniq_indexes.error.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Gérer les champs cachés"
        }, 'crud_update_form_body.edit_removed_crud_fields.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Masquer les champs cachés"
        }, 'crud_update_form_body.donot_edit_removed_crud_fields.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Afficher le champs {field_id}"
        }, 'crud_update_form_body.delete_removed_crud_field_id.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Masquer le champs {field_id}"
        }, 'crud_update_form_body.add_removed_crud_field_id.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Modification en cours..."
        }, 'crud_update_form_body_delete_removed_crud_field_id.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Modification terminée. Recharger pour voir les changements"
        }, 'crud_update_form_body_delete_removed_crud_field_id.ok.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Modification échouée. Veuillez réessayer"
        }, 'crud_update_form_body_delete_removed_crud_field_id.failed.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Modification en cours..."
        }, 'crud_update_form_body_add_removed_crud_field_id.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Modification terminée"
        }, 'crud_update_form_body_add_removed_crud_field_id.ok.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Modification échouée. Veuillez réessayer"
        }, 'crud_update_form_body_add_removed_crud_field_id.failed.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Gérer les champs cachés"
        }, 'crud_create_form_body.edit_removed_crud_fields.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Masquer les champs cachés"
        }, 'crud_create_form_body.donot_edit_removed_crud_fields.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Afficher le champs {field_id}"
        }, 'crud_create_form_body.delete_removed_crud_field_id.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Masquer le champs {field_id}"
        }, 'crud_create_form_body.add_removed_crud_field_id.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Modification en cours..."
        }, 'crud_create_form_body_delete_removed_crud_field_id.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Modification terminée. Recharger pour voir les changements"
        }, 'crud_create_form_body_delete_removed_crud_field_id.ok.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Modification échouée. Veuillez réessayer"
        }, 'crud_create_form_body_delete_removed_crud_field_id.failed.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Modification en cours..."
        }, 'crud_create_form_body_add_removed_crud_field_id.start.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Modification terminée"
        }, 'crud_create_form_body_add_removed_crud_field_id.ok.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Modification échouée. Veuillez réessayer"
        }, 'crud_create_form_body_add_removed_crud_field_id.failed.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Format incorrect"
        }, 'crud.field_error_format.___LABEL___'));
    }

    public registerCrons(): void {
        DAOCronWorkersHandler.getInstance();
    }

    /**
     * @deprecated préférer l'usage des contextAccessHook sauf pour les hooks de type UPDATE ou DELETE pour le moment
     *  En fait pour le moment les deux se complètent, mais à terme on voudra migrer sur les context filters pour le READ
     *  et vers des fonctions dédiées pour les update, create et delete. Le create peut à la limite rester applicatif
     *  mais les update et delete devraient devenir petit à petit des flitres contextualisés aussi pour éviter de
     *  filtrer une première fois via le read en context, puis applicativement chaque vo chargé de la bdd... autant
     *  charger directement les vos que l'on peut réellement update ou delete dès le départ
     */
    public registerAccessHook<T extends IDistantVOBase>(API_TYPE_ID: string, access_type: string, handler_bind_this: any, hook: IHookFilterVos<T>) {
        if (!DAOServerController.getInstance().access_hooks[API_TYPE_ID]) {
            DAOServerController.getInstance().access_hooks[API_TYPE_ID] = {};
        }
        if (!DAOServerController.getInstance().access_hooks[API_TYPE_ID][access_type]) {
            DAOServerController.getInstance().access_hooks[API_TYPE_ID][access_type] = [];
        }
        DAOServerController.getInstance().access_hooks[API_TYPE_ID][access_type].push(hook.bind(handler_bind_this));
    }

    /**
     * Enregistrer un nouveau context access hook qui sera exécuté quand une requête est passée au module context filter
     *  Si on a plusieurs context query pour un même type, on les enchaînera dans la requête avec un ET (l'id de l'objet
     *  fitré devra se trouver dans les résultats de toutes les contextQuery)
     */
    public registerContextAccessHook<T extends IDistantVOBase>(API_TYPE_ID: string, handler_bind_this: any, hook: IContextHookFilterVos<T>) {
        if (!DAOServerController.getInstance().context_access_hooks[API_TYPE_ID]) {
            DAOServerController.getInstance().context_access_hooks[API_TYPE_ID] = [];
        }
        DAOServerController.getInstance().context_access_hooks[API_TYPE_ID].push(hook.bind(handler_bind_this));
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_selectUsersForCheckUnicity, this.selectUsersForCheckUnicity.bind(this));

        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_DELETE_VOS, this.deleteVOs.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_DELETE_VOS_BY_IDS, this.deleteVOsByIds.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_DELETE_VOS_MULTICONNECTIONS, this.deleteVOsMulticonnections.bind(this));

        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_INSERT_OR_UPDATE_VOS, this.insertOrUpdateVOs.bind(this));
        // APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_INSERT_OR_UPDATE_VOS_MULTICONNECTIONS, this.insertOrUpdateVOsMulticonnections.bind(this));

        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_INSERT_OR_UPDATE_VO, this.insertOrUpdateVO.bind(this));

        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_GET_VO_BY_ID, this.getVoById.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_GET_VOS, this.getVos.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_GET_VOS_BY_IDS, this.getVosByIds.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_GET_VOS_BY_IDS_RANGES, this.getVosByIdsRanges.bind(this));

        // APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_FILTER_VOS_BY_FIELD_RANGES, this.filterVosByFieldRanges.bind(this));
        // APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_FILTER_VOS_BY_FIELD_RANGES_INTERSECTIONS, this.filterVosByFieldRangesIntersections.bind(this));
        // APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_GET_VOS_BY_EXACT_FIELD_RANGE, this.getVosByExactFieldRange.bind(this));

        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_getVarImportsByMatroidParams, this.getVarImportsByMatroidParams.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_FILTER_VOS_BY_MATROIDS, this.filterVosByMatroids.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_FILTER_VOS_BY_MATROIDS_INTERSECTIONS, this.filterVosByMatroidsIntersections.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_GET_VOS_BY_EXACT_MATROIDS, this.getVosByExactMatroid.bind(this));

        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_GET_VOS_BY_REFFIELD_IDS, this.getVosByRefFieldIds.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_GET_VOS_BY_REFFIELDS_IDS, this.getVosByRefFieldsIds.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_GET_VOS_BY_REFFIELDS_IDS_AND_FIELDS_STRING, this.getVosByRefFieldsIdsAndFieldsString.bind(this));

        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_GET_NAMED_VO_BY_NAME, this.getNamedVoByName.bind(this));

        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_GET_BASE_URL, this.getBaseUrl.bind(this));

        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_truncate, this.truncate_api.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_delete_all_vos_triggers_ok, this.delete_all_vos_triggers_ok.bind(this));
    }

    public checkAccessSync<T extends IDistantVOBase>(datatable: ModuleTable<T>, access_type: string): boolean {

        if (!datatable) {
            ConsoleHandler.error('checkAccessSync:!datatable');
            return false;
        }

        if (!ModuleAccessPolicy.getInstance().actif) {
            return true;
        }

        // On applique les accès au global sur le droit de faire un SELECT
        return ModuleAccessPolicyServer.getInstance().checkAccessSync(DAOController.getAccessPolicyName(access_type, datatable.vo_type));
    }

    public async preload_segmented_known_database(t: ModuleTable<any>) {
        let segments_by_segmented_value: { [segmented_value: number]: string } = await ModuleTableDBService.getInstance(null).get_existing_segmentations_tables_of_moduletable(t);

        for (let i in segments_by_segmented_value) {
            let table_name = segments_by_segmented_value[i];

            DAOServerController.getInstance().add_segmented_known_databases(t.database, table_name, parseInt(i.toString()));
        }
    }

    public has_segmented_known_database(t: ModuleTable<any>, segment_value: number): boolean {
        if ((!DAOServerController.segmented_known_databases[t.database]) || (!DAOServerController.segmented_known_databases[t.database][t.get_segmented_name(segment_value)])) {
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

        let moduleTable: ModuleTable<any> = VOsTypesManager.moduleTables_by_voType[api_type_id];

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
                ConsoleHandler.error('Matroid vide:getSumFieldFilterByMatroids:' + api_type_id + ':' + (matroid ? matroid._type : null) + ':');
                continue;
            }

            let filter_by_matroid_clause: string = ModuleDAOServer.getInstance().getWhereClauseForFilterByMatroid(api_type_id, matroid, fields_ids_mapper, 't', moduleTable.full_name);

            if (!filter_by_matroid_clause) {
                continue;
            }

            let uid = this.log_db_query_perf_start('getSumFieldFilterByMatroids', "SELECT sum(t." + field_id + ") res FROM " + moduleTable.full_name);
            let res = await ModuleServiceBase.getInstance().db.query("SELECT sum(t." + field_id + ") res FROM " + moduleTable.full_name + " t WHERE  " +
                filter_by_matroid_clause + ";");
            this.log_db_query_perf_end(uid, 'getSumFieldFilterByMatroids', "SELECT sum(t." + field_id + ") res FROM " + moduleTable.full_name);

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

        let moduleTable: ModuleTable<T> = VOsTypesManager.moduleTables_by_voType[api_type_id];

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
        let matroid_fields_ranges_by_datatable_field_id: { [field_id: string]: IRange[] } = this.get_matroid_fields_ranges_by_datatable_field_id(matroid, moduleTable, fields_ids_mapper);

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

            matroid_fields_ranges_by_datatable_field_id[field_id] = RangeHandler.getRangesUnion(matroid_fields_ranges_by_datatable_field_id[field_id]) as IRange[];
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
            let field_ranges: IRange[] = matroid_fields_ranges_by_datatable_field_id[field_id];
            let field = moduleTable.getFieldFromId(field_id);

            if ((!field) || (!field_ranges) || (!field_ranges.length)) {
                ConsoleHandler.error('((!field) || (!field_ranges)) on filterVosByMatroid should not happen');
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
     * TODO : A confirmer que cela fonctionne avec des matroids
     */
    public getWhereClauseForFilterByMatroidIntersection<T extends IDistantVOBase>(
        api_type_id: string,
        matroid: IMatroid,
        fields_ids_mapper: { [matroid_field_id: string]: string }): string {

        if (!matroid) {
            ConsoleHandler.error('Matroid vide:' + api_type_id + ':' + (matroid ? matroid._type : null) + ':');
            return null;
        }

        let moduleTable: ModuleTable<T> = VOsTypesManager.moduleTables_by_voType[api_type_id];

        if (!moduleTable) {
            return null;
        }

        let first_matroid = true;

        let where_clause_params: string[] = [];
        // let where_clause: string = "";

        // On ajoute un segment dédié à la gestion des vars pour faciliter le fonctionnement
        // Si on a un param de type varparam ou vardata, et une cible de type vardata, on ajoute un filtrage sur le var_id, si il existe dans le param
        if (!!(matroid as VarDataBaseVO).var_id) {

            if (!!moduleTable.getFieldFromId('var_id')) {
                where_clause_params.push('(var_id = ' + (matroid as VarDataBaseVO).var_id + ') ');
            }
        }

        let matroid_fields = MatroidController.getInstance().getMatroidFields(matroid._type);

        let first = true;
        for (let i in matroid_fields) {
            let matroid_field = matroid_fields[i];
            let ranges: IRange[] = matroid[matroid_field.field_id];
            let field = moduleTable.getFieldFromId((fields_ids_mapper && fields_ids_mapper[matroid_field.field_id]) ? fields_ids_mapper[matroid_field.field_id] : matroid_field.field_id);

            if (!field) {
                continue;
            }

            if (moduleTable.is_segmented && (field.field_id == moduleTable.table_segmented_field.field_id)) {
                continue;
            }

            if ((!ranges) || (!ranges.length)) {
                ConsoleHandler.error('getWhereClauseForFilterByMatroidIntersection :: Matroid field vide ou inexistant:' + api_type_id + ':' + matroid_fields[i].field_id + ':');
                return null;
            }

            let where_clause_ranges: string = this.getWhereClauseForRangeArray(api_type_id, field, ranges);
            if (where_clause_ranges == null) {
                return null;
            }
            where_clause_params.push(where_clause_ranges);
            first = false;
            first_matroid = false;

        }
        if (first) {
            return null;
        }

        if (first_matroid) {
            return null;
        }

        return where_clause_params.join(" AND ");
    }

    public getWhereClauseForRangeArray(
        api_type_id: string,
        field: ModuleTableField<any>,
        ranges: IRange[],
    ): string {
        if (!field) {
            return null;
        }

        let where_clause_params: string[] = [];

        for (let j in ranges) {
            let field_range: IRange = ranges[j];

            if (!RangeHandler.isValid(field_range)) {
                ConsoleHandler.error('field_range invalid:' + api_type_id + ':' + JSON.stringify(field_range) + ':');
                return null;
            }

            where_clause_params.push(this.getClauseWhereRangeIntersectsField(field.field_type, field.field_id, field_range));
        }
        return " (" + where_clause_params.join(" OR ") + ") ";
    }

    public async deleteVOsMulticonnections<T extends IDistantVOBase>(vos: T[], max_connections_to_use: number = 0): Promise<InsertOrDeleteQueryResult[]> {

        // max_connections_to_use = max_connections_to_use || Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL));
        max_connections_to_use = max_connections_to_use || Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL - 1));
        let promise_pipeline = new PromisePipeline(max_connections_to_use);

        let res: InsertOrDeleteQueryResult[] = [];
        for (let i in vos) {
            let vo = vos[i];

            await promise_pipeline.push(async () => {
                let delete_res = await this.deleteVOs([vo]);
                if (delete_res && delete_res.length == 1) {
                    res.push(delete_res[0]);
                }
            });
        }

        await promise_pipeline.end();

        return res;
    }

    public async insertOrUpdateVOsMulticonnections<T extends IDistantVOBase>(vos: T[], max_connections_to_use: number = 0): Promise<InsertOrDeleteQueryResult[]> {

        // max_connections_to_use = max_connections_to_use || Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL));
        max_connections_to_use = max_connections_to_use || Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL - 1));
        let promise_pipeline = new PromisePipeline(max_connections_to_use);

        /**
         * Si les vos sont segmentés, on check en amont l'existence des tables segmentées
         *  car on ne peut pas les créer en parallèle. Du coup on les crée en amont si besoin
         */
        await this.confirm_segmented_tables_existence(vos);

        let res: InsertOrDeleteQueryResult[] = [];
        for (let i in vos) {
            let vo = vos[i];

            await promise_pipeline.push(async () => {
                res.push(await this.insertOrUpdateVO(vo));
            });
        }

        await promise_pipeline.end();

        return res;
    }

    /**
     * Seul version de delete_all/truncate qui appel les triggers appli + base
     */
    public async delete_all_vos_triggers_ok(api_type_id: string) {

        await ModuleContextFilter.getInstance().delete_vos(query(api_type_id));
    }

    /**
     * Attention, on appel aucun triggers de l'appli en faisant ça...
     */
    public async delete_all_vos(api_type_id: string) {

        let datatable = VOsTypesManager.moduleTables_by_voType[api_type_id];
        if (datatable.is_segmented) {

            let ranges = this.get_all_ranges_from_segmented_table(datatable);

            if ((!ranges) || (RangeHandler.getCardinalFromArray(ranges) < 1)) {
                return null;
            }

            let self = this;
            await RangeHandler.foreach_ranges(ranges, async (segment_value) => {

                if (!self.has_segmented_known_database(datatable, segment_value)) {
                    return;
                }

                let query_string = "DELETE FROM " + datatable.get_segmented_full_name(segment_value);
                let uid = this.log_db_query_perf_start('delete_all_vos', query_string, 'is_segmented');
                await ModuleServiceBase.getInstance().db.none(query_string + ";");
                this.log_db_query_perf_end(uid, 'delete_all_vos', query_string, 'is_segmented');

            }, datatable.table_segmented_field_segment_type);
        } else {
            let query_string = "DELETE FROM " + datatable.full_name;
            let uid = this.log_db_query_perf_start('delete_all_vos', query_string, '!is_segmented');
            await ModuleServiceBase.getInstance().db.none(query_string + ";");
            this.log_db_query_perf_end(uid, 'delete_all_vos', query_string, '!is_segmented');
        }
    }

    /**
     * Attention, on appel aucun triggers de l'appli en faisant ça...
     */
    public async insertOrUpdateVOs_without_triggers(vos: IDistantVOBase[], max_connections_to_use: number = 0): Promise<InsertOrDeleteQueryResult[]> {
        if (DAOServerController.GLOBAL_UPDATE_BLOCKER) {
            let uid: number = StackContext.get('UID');
            let CLIENT_TAB_ID: string = StackContext.get('CLIENT_TAB_ID');
            if (uid && CLIENT_TAB_ID) {
                this.throttled_refuse({ [uid]: { [CLIENT_TAB_ID]: true } });
            }
            return null;
        }

        // On vérifie qu'on peut faire un insert ou update
        if ((!vos) || (!vos.length)) {
            return null;
        }

        vos = vos.filter((vo) =>
            (!!vo) && vo._type && VOsTypesManager.moduleTables_by_voType[vo._type] &&
            this.checkAccessSync(VOsTypesManager.moduleTables_by_voType[vo._type], ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE));

        if ((!vos) || (!vos.length)) {
            return null;
        }

        // On ajoute un filtrage via hook
        let tmp_vos = [];
        for (let i in vos) {
            let vo = vos[i];
            let tmp_vo = await this.filterVOAccess(VOsTypesManager.moduleTables_by_voType[vo._type], ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, vo);

            if (!!tmp_vo) {
                tmp_vos.push(tmp_vo);
            }
        }
        if ((!tmp_vos) || (!tmp_vos.length)) {
            return null;
        }
        vos = tmp_vos;

        if (this.check_foreign_keys) {
            vos = await this.filterByForeignKeys(vos);
            if ((!vos) || (!vos.length)) {
                return null;
            }
        }

        let vos_by_vo_tablename_and_ids: { [tablename: string]: { moduletable: ModuleTable<any>, vos: { [id: number]: IDistantVOBase[] } } } = {};

        max_connections_to_use = max_connections_to_use || Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL - 1));

        let promise_pipeline = new PromisePipeline(max_connections_to_use);

        for (let i in vos) {
            let vo: IDistantVOBase = vos[i];

            let moduleTable: ModuleTable<any> = VOsTypesManager.moduleTables_by_voType[vo._type];
            let tablename: string = moduleTable.is_segmented ? moduleTable.get_segmented_full_name_from_vo(vo) : moduleTable.full_name;

            if (!vos_by_vo_tablename_and_ids[tablename]) {
                vos_by_vo_tablename_and_ids[tablename] = {
                    moduletable: moduleTable,
                    vos: {}
                };
            }

            await promise_pipeline.push(async () => {
                let vo_id: number = !!vo.id ? vo.id : 0;

                if (!vo_id) {
                    try {
                        vo.id = await this.check_uniq_indexes(vo, moduleTable);
                    } catch (err) {
                        return null;
                    }

                    vo_id = vo.id;
                }

                if (!vos_by_vo_tablename_and_ids[tablename].vos[vo_id]) {
                    vos_by_vo_tablename_and_ids[tablename].vos[vo_id] = [];
                }

                vos_by_vo_tablename_and_ids[tablename].vos[vo_id].push(vo);
            });
        }

        await promise_pipeline.end();
        promise_pipeline = new PromisePipeline(max_connections_to_use);

        let res: InsertOrDeleteQueryResult[] = [];
        let reste_a_faire = [];

        for (let tablename in vos_by_vo_tablename_and_ids) {
            let tableFields: string[] = [];

            let moduleTable: ModuleTable<any> = vos_by_vo_tablename_and_ids[tablename].moduletable;

            for (const f in moduleTable.get_fields()) {
                let field: ModuleTableField<any> = moduleTable.get_fields()[f];

                tableFields.push(field.field_id);

                /**
                 * Cas des ranges
                 */
                if ((field.field_type == ModuleTableField.FIELD_TYPE_numrange) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_tsrange) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_hourrange) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_numrange_array) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_refrange_array) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_isoweekdays) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_tstzrange_array) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_hourrange_array)) {

                    tableFields.push(field.field_id + '_ndx');
                }
            }

            let updated_vo_id = null;
            let vos_by_ids = vos_by_vo_tablename_and_ids[tablename].vos;
            for (let vo_id in vos_by_ids) {

                if (vo_id == 'null') {
                    vo_id = null;
                }

                let vos_values = [];
                let setters: any[] = [];
                let is_update: boolean = false;

                if ((!!vo_id) && (!!vos_by_ids[vo_id]) && (vos_by_ids[vo_id].length > 1)) {

                    // On a de multiples updates sur un même id, on prend le dernier mais on log tout
                    let length = vos_by_ids[vo_id].length;
                    vos_by_ids[vo_id].forEach((vo) => {
                        ConsoleHandler.warn('Multiple updates (' + length + ') on the same id, we take the last one but you should check your code :' + vo._type + ':' + vo.id + ':' + JSON.stringify(vo));

                    });

                    vos_by_ids[vo_id] = [vos_by_ids[vo_id][length - 1]];
                }

                for (let i in vos_by_ids[vo_id]) {
                    let vo: IDistantVOBase = moduleTable.get_bdd_version(vos_by_ids[vo_id][i]);
                    let is_valid: boolean = true;

                    let vo_values: any[] = [];

                    for (const f in moduleTable.get_fields()) {
                        let field: ModuleTableField<any> = moduleTable.get_fields()[f];

                        let fieldValue = vo[field.field_id];

                        if (typeof fieldValue == "undefined") {
                            if (field.has_default && typeof field.field_default == 'undefined') {
                                fieldValue = field.field_default;
                            } else {
                                fieldValue = null;
                            }
                        }

                        if ((fieldValue == null) && field.field_required) {
                            ConsoleHandler.error("Champ requis sans valeur, on essaye pas d'enregistrer le VO :field_id: " + field.field_id + ' :table:' + tablename + ' :vo:' + JSON.stringify(vo));
                            is_valid = false;
                            break;
                        }

                        let securized_fieldValue = pgPromise.as.format('$1', [fieldValue]);

                        setters.push(field.field_id + ' = ' + securized_fieldValue);
                        // cpt_field_vo++;

                        vo_values.push(securized_fieldValue);

                        /**
                         * Cas des ranges
                         */
                        if ((field.field_type == ModuleTableField.FIELD_TYPE_numrange) ||
                            (field.field_type == ModuleTableField.FIELD_TYPE_tsrange) ||
                            (field.field_type == ModuleTableField.FIELD_TYPE_hourrange) ||
                            (field.field_type == ModuleTableField.FIELD_TYPE_numrange_array) ||
                            (field.field_type == ModuleTableField.FIELD_TYPE_refrange_array) ||
                            (field.field_type == ModuleTableField.FIELD_TYPE_isoweekdays) ||
                            (field.field_type == ModuleTableField.FIELD_TYPE_tstzrange_array) ||
                            (field.field_type == ModuleTableField.FIELD_TYPE_hourrange_array)) {

                            securized_fieldValue = pgPromise.as.format('$1', [vo[field.field_id + '_ndx']]);
                            setters.push(field.field_id + '_ndx = ' + securized_fieldValue);
                            vo_values.push(securized_fieldValue);

                            // cpt_field_vo++;
                        }
                    }

                    if (!is_valid) {
                        continue;
                    }

                    // Si on est sur un update, on va avoir que 1 vo à mettre à jour et on fait un traitement particulier
                    if (!!vo.id) {
                        is_update = true;
                        updated_vo_id = vo.id;
                    }

                    if (vo_values.length > 0) {
                        vos_values.push(vo_values);
                    }
                }


                let sql: string = null;

                if (is_update) {
                    sql = "UPDATE " + tablename + " SET " + setters.join(', ') + " WHERE id = " + updated_vo_id + " RETURNING ID;";
                } else {
                    sql = "INSERT INTO " + tablename + " (" + tableFields.join(', ') + ") VALUES ";

                    let sql_values: string = '';

                    for (let i in vos_values) {
                        if (sql_values != '') {
                            sql_values += ",";
                        }

                        sql_values += "(";
                        let sub_sql: string = '';

                        for (let j in vos_values[i]) {
                            if (sub_sql != '') {
                                sub_sql += ',';
                            }

                            sub_sql += pgPromise.as.format('$1', [vos_values[i][j]]);
                        }

                        sql_values += sub_sql;

                        sql_values += ")";
                    }

                    sql += sql_values;

                    sql += " RETURNING ID;";
                }

                await promise_pipeline.push(async () => {
                    let uid = this.log_db_query_perf_start('insertOrUpdateVOs_without_triggers', sql);
                    let results = await ModuleServiceBase.getInstance().db.query(sql);
                    this.log_db_query_perf_end(uid, 'insertOrUpdateVOs_without_triggers', sql);

                    for (let i in results) {
                        let result = results[i];

                        let res_id: number = result?.id ? parseInt(result.id.toString()) : null;

                        if (!res_id) {
                            ConsoleHandler.error('insertOrUpdateVOs_without_triggers : no id returned for query : ' + sql);
                        }

                        res.push(new InsertOrDeleteQueryResult(res_id));
                    }
                });
            }
        }

        await promise_pipeline.end();

        if (reste_a_faire && reste_a_faire.length) {
            let reste_a_faire_res = await this.insertOrUpdateVOs_without_triggers(reste_a_faire, max_connections_to_use);
            if (reste_a_faire_res && reste_a_faire_res.length) {
                res = res.concat(reste_a_faire_res);
            }
        }

        return res;
    }

    /**
     * Insert de masse sans trigger / sans check de cohérence, en utilisant la fonction COPY => un fichier qui contient les inserts à faire
     * On ne renvoie rien
     *
     * Attention :
     *  - on utilise donc aucun trigger,
     *  - on ne check pas les foreign keys non plus,
     *  - on ne check pas les doublons non plus,
     *  - on considère que les vos sont tous du même type,
     *  - on ne check pas les vos qui ont déjà un id ou une clé unique en base (un index déjà en base par exemple),
     *  - on ne fait que des inserts, pas d'update avec un COPY
     *  - on ne gère pas les segmentations
     */
    public async insert_without_triggers_using_COPY(vos: IDistantVOBase[], segmented_value: number = null): Promise<boolean> {
        if (DAOServerController.GLOBAL_UPDATE_BLOCKER) {
            let uid: number = StackContext.get('UID');
            let CLIENT_TAB_ID: string = StackContext.get('CLIENT_TAB_ID');
            if (uid && CLIENT_TAB_ID) {
                this.throttled_refuse({ [uid]: { [CLIENT_TAB_ID]: true } });
            }
            return false;
        }

        // On vérifie qu'on peut faire un insert ou update
        if ((!vos) || (!vos.length)) {
            return true;
        }

        vos = vos.filter((vo) =>
            (!!vo) && vo._type && VOsTypesManager.moduleTables_by_voType[vo._type] &&
            this.checkAccessSync(VOsTypesManager.moduleTables_by_voType[vo._type], ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE));

        if ((!vos) || (!vos.length)) {
            return true;
        }

        // On ajoute un filtrage via hook
        let tmp_vos = [];
        for (let i in vos) {
            let vo = vos[i];
            let tmp_vo = await this.filterVOAccess(VOsTypesManager.moduleTables_by_voType[vo._type], ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, vo);

            if (!!tmp_vo) {
                tmp_vos.push(tmp_vo);
            }
        }
        if ((!tmp_vos) || (!tmp_vos.length)) {
            return true;
        }
        vos = tmp_vos;

        /**
         * On check aussi que l'on a pas des updates à faire et uniquement des inserts, sinon on fait un update des vos concernés avant de faire les inserts (on pourrait le faire en // mais c'est plus compliqué)
         */
        let update_vos: IDistantVOBase[] = [];
        let check_pixel_update_vos_by_type: { [vo_type: string]: VarDataBaseVO[] } = {};
        let insert_vos: IDistantVOBase[] = [];

        for (let i in vos) {
            let vo = vos[i];

            if (!!vo.id) {

                /**
                 * Si on est sur du pixel && never_delete, on doit pas avoir un update sauf changement de valeur ou de type de valeur, le reste osef
                 *  et comme on a un bug visiblement en amont qui essaie d'insérer ce type de valeur, on rajoute un contrôle ici qui sera toujours plus rapide que de faire un update
                 */
                if (VOsTypesManager.moduleTables_by_voType[vo._type].isMatroidTable) {
                    let conf = VarsController.getInstance().var_conf_by_id[vo['var_id']];
                    if (conf && conf.pixel_activated && conf.pixel_never_delete) {

                        if (!check_pixel_update_vos_by_type[vo._type]) {
                            check_pixel_update_vos_by_type[vo._type] = [];
                        }
                        check_pixel_update_vos_by_type[vo._type].push(vo as VarDataBaseVO);
                        continue;
                    }
                }

                update_vos.push(vo);
            } else {
                insert_vos.push(vo);
            }
        }


        for (let api_type in check_pixel_update_vos_by_type) {
            let check_pixel_update_vos = check_pixel_update_vos_by_type[api_type];

            if ((!check_pixel_update_vos) || (!check_pixel_update_vos.length)) {
                continue;
            }

            let db_check_pixel_update_vos: VarDataBaseVO[] = await query(api_type).filter_by_ids(check_pixel_update_vos.map((vo) => vo.id)).select_vos();

            let db_check_pixel_update_vos_by_id: { [id: number]: VarDataBaseVO } = VOsTypesManager.vosArray_to_vosByIds(db_check_pixel_update_vos);

            for (let j in check_pixel_update_vos) {
                let vo = check_pixel_update_vos[j];
                let db_vo = db_check_pixel_update_vos_by_id[vo.id];

                if (db_vo && (db_vo.value == vo.value) && (db_vo.value_type == vo.value_type)) {
                    ConsoleHandler.error('On a un insert/update de pixel alors que le pixel existe déjà en base avec la même valeur et le même type. On ne fait rien mais on ne devrait pas arriver ici.DB:' + JSON.stringify(db_vo) + ':app:' + JSON.stringify(vo));
                    continue;
                }
                update_vos.push(vo);
            }
        }

        if (!!update_vos.length) {
            await this.insertOrUpdateVOs_without_triggers(update_vos);
        }

        if (!insert_vos.length) {
            return true;
        }

        vos = insert_vos;

        let moduleTable: ModuleTable<any> = VOsTypesManager.moduleTables_by_voType[vos[0]._type];

        if (moduleTable.is_segmented && !segmented_value) {
            throw new Error('Not implemented');
        }
        let table_name: string = moduleTable.is_segmented ? moduleTable.get_segmented_full_name(segmented_value) : moduleTable.full_name;

        let debug_insert_without_triggers_using_COPY = await ModuleParams.getInstance().getParamValueAsBoolean(ModuleDAOServer.PARAM_NAME_insert_without_triggers_using_COPY, false, 180000);

        if (debug_insert_without_triggers_using_COPY) {
            ConsoleHandler.log('insert_without_triggers_using_COPY:start');
        }

        let tableFields: string[] = [];
        let fields = moduleTable.get_fields();

        for (let i in fields) {
            let field: ModuleTableField<any> = fields[i];

            tableFields.push(field.field_id);

            /**
             * Cas des ranges
             */
            if ((field.field_type == ModuleTableField.FIELD_TYPE_numrange) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_tsrange) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_hourrange) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_numrange_array) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_refrange_array) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_isoweekdays) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_tstzrange_array) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_hourrange_array)) {

                tableFields.push(field.field_id + '_ndx');
            }
        }

        let lines: string[] = [];
        for (let i in vos) {
            let vo: IDistantVOBase = moduleTable.get_bdd_version(vos[i]);

            let setters: any[] = [];
            let is_valid: boolean = true;

            for (let f in fields) {
                let field: ModuleTableField<any> = fields[f];

                let fieldValue = vo[field.field_id];

                /**
                 * Cas des undefined
                 */
                if (typeof fieldValue == "undefined") {
                    if (field.has_default && typeof field.field_default != 'undefined') {
                        fieldValue = field.field_default;
                    } else {
                        fieldValue = null;
                    }
                }

                if ((fieldValue == null) && field.field_required) {
                    ConsoleHandler.error("Champ requis sans valeur et !has_default, on essaye pas d'enregistrer le VO :field_id: " + field.field_id + ' :table:' + table_name + ' :vo:' + JSON.stringify(vo));
                    is_valid = false;
                    break;
                }

                /**
                 * Cas des strings
                 */
                let stringified = (Number.isNaN(fieldValue) || (fieldValue == null)) ? '' : JSON.stringify(fieldValue);
                if ((!!stringified) && (typeof fieldValue == 'string')) {
                    if (stringified.length == 2) {
                        stringified = "''";
                    } else {
                        stringified = "'" + stringified.substring(1, stringified.length - 1).replace(/\\"/g, '"').replace(/'/g, "''") + "'";
                    }
                }

                /**
                 * Cas des arrays
                 */
                if (Array.isArray(fieldValue) &&
                    ((field.field_type == ModuleTableField.FIELD_TYPE_html_array) ||
                        (field.field_type == ModuleTableField.FIELD_TYPE_string_array))) {

                    let string_array = (fieldValue as string[]);
                    string_array = string_array.map((str) => {
                        return str.replace(/'/g, "\\''");
                    });

                    stringified = (string_array.length == 0) ? '{}' :
                        "'{''" + string_array.join("'',''") + "''}'";
                } else if (Array.isArray(fieldValue) &&
                    ((field.field_type == ModuleTableField.FIELD_TYPE_int_array) ||
                        (field.field_type == ModuleTableField.FIELD_TYPE_tstz_array) ||
                        (field.field_type == ModuleTableField.FIELD_TYPE_float_array))) {

                    let num_array = (fieldValue as number[]);
                    let string_array = num_array.map((str) => {
                        return str.toString();
                    });

                    stringified = (string_array.length == 0) ? '{}' :
                        "'{" + string_array.join(",") + "}'";
                }
                setters.push(stringified);

                /**
                 * Cas des ranges
                 */
                if ((field.field_type == ModuleTableField.FIELD_TYPE_numrange) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_tsrange) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_hourrange) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_numrange_array) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_refrange_array) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_isoweekdays) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_tstzrange_array) ||
                    (field.field_type == ModuleTableField.FIELD_TYPE_hourrange_array)) {

                    let fieldValue_ndx = vo[field.field_id + '_ndx'];

                    stringified = (fieldValue_ndx == null) ? '' : JSON.stringify(fieldValue_ndx);
                    if ((!!stringified) && (typeof fieldValue_ndx == 'string')) {
                        if (stringified.length == 2) {
                            stringified = "''";
                        } else {
                            stringified = "'" + stringified.substring(1, stringified.length - 1).replace(/\\"/g, '"').replace(/'/g, "''") + "'";
                        }
                    }
                    setters.push(stringified);
                }
            }

            if (!is_valid) {
                continue;
            }


            let line = setters.join(';');
            if (debug_insert_without_triggers_using_COPY) {
                ConsoleHandler.log('insert_without_triggers_using_COPY:line:' + line);
            }
            lines.push(line);
        }

        if ((!lines) || (!lines.length)) {
            if (debug_insert_without_triggers_using_COPY) {
                ConsoleHandler.log('insert_without_triggers_using_COPY:end');
            }
            return true;
        }

        // if (!this.copy_dedicated_pool) {
        //     this.copy_dedicated_pool = new Pool({
        //         connectionString: ConfigurationService.node_configuration.CONNECTION_STRING,
        //         max: 10,
        //     });
        // }

        let copy_dedicated_pool: any = new Pool({
            connectionString: ConfigurationService.node_configuration.CONNECTION_STRING,
            max: 1,
        });

        let result = true;
        let self = this;
        return new Promise(async (resolve, reject) => {

            // self.copy_dedicated_pool.connect(function (err, client, done) {
            copy_dedicated_pool.connect(function (err, client, done) {

                let cb = async () => {
                    if (debug_insert_without_triggers_using_COPY) {
                        ConsoleHandler.log('insert_without_triggers_using_COPY:end');
                    }
                    await done();
                    client.end();
                    await resolve(result);
                };

                let query_string = "COPY " + table_name + " (" + tableFields.join(", ") + ") FROM STDIN WITH (FORMAT csv, DELIMITER ';', QUOTE '''')";
                if (debug_insert_without_triggers_using_COPY) {
                    ConsoleHandler.log('insert_without_triggers_using_COPY:query_string:' + query_string);
                }
                var stream = client.query(copyFrom(query_string));
                var rs = new Readable();

                for (let i in lines) {
                    let line: string = lines[i];
                    rs.push(line + "\n");
                }
                rs.push(null);
                rs.on('error', cb);

                rs.pipe(stream).on('finish', cb).on('error', async (error: DatabaseError) => {
                    result = false;
                    ConsoleHandler.error('insert_without_triggers_using_COPY:' + error);

                    if (error && error.message && error.message.startsWith('duplicate key value violates unique constraint') && error.message.endsWith('__bdd_only_index_key"')) {
                        ConsoleHandler.error('insert_without_triggers_using_COPY:Erreur de duplication d\'index, on tente de retrouver les vars impliquées et de corriger automatiquement');

                        let duplicates: VarDataBaseVO[] = await query(moduleTable.vo_type).filter_by_text_has('_bdd_only_index', vos.map((vo: VarDataBaseVO) => vo._bdd_only_index)).select_vos();
                        if (duplicates && duplicates.length) {
                            ConsoleHandler.error('insert_without_triggers_using_COPY:Erreur de duplication d\'index: on a trouvé des doublons (' + duplicates.length + '), on les mets à jour plutôt');

                            let duplicates_id_by_index: { [index: string]: number } = {};
                            for (let i in duplicates) {
                                let duplicate: VarDataBaseVO = duplicates[i];
                                duplicates_id_by_index[duplicate._bdd_only_index] = duplicate.id;
                            }

                            for (let i in vos) {
                                let vo: VarDataBaseVO = vos[i] as VarDataBaseVO;
                                if (duplicates_id_by_index[vo._bdd_only_index]) {
                                    vo.id = duplicates_id_by_index[vo._bdd_only_index];
                                }
                            }

                            ConsoleHandler.error('insert_without_triggers_using_COPY:Erreur de duplication d\'index: on relance la copy avec les correctifs');
                            result = await self.insert_without_triggers_using_COPY(vos, segmented_value);
                            ConsoleHandler.error('insert_without_triggers_using_COPY:Erreur de duplication d\'index: résultat copy avec correctifs:' + result);
                        } else {
                            let get_select_query_str = await query(moduleTable.vo_type).filter_by_text_has('_bdd_only_index', vos.map((vo: VarDataBaseVO) => vo._bdd_only_index)).get_select_query_str();
                            ConsoleHandler.error('insert_without_triggers_using_COPY:Erreur de duplication d\'index: on a pas trouvé de doublons ce qui ne devrait jamais arriver');
                            ConsoleHandler.error('insert_without_triggers_using_COPY:Erreur de duplication d\'index: \n' + lines.join('\n'));
                            ConsoleHandler.error('insert_without_triggers_using_COPY:Erreur de duplication d\'index: ' + get_select_query_str.query);
                        }
                    } else if (error && error.message) {
                        ConsoleHandler.error('insert_without_triggers_using_COPY:Erreur, on tente une insertion classique mais sans triggers');

                        try {
                            let query_res = await self.insertOrUpdateVOs_without_triggers(vos);
                            result = (!!query_res) && (query_res.length == vos.length);
                        } catch (error) {
                            ConsoleHandler.error('insert_without_triggers_using_COPY:' + error);
                            result = false;
                        }
                    }

                    await cb();
                });
            });
        });
    }

    public async truncate_api(api_type_id: string) {
        await this.truncate(api_type_id);
    }

    /**
     * ATTENTION truncate ne fait pas du tout un delete * en base, c'est très différent, par exemple sur les triggers en base
     */
    public async truncate(api_type_id: string, ranges: IRange[] = null) {

        if (DAOServerController.GLOBAL_UPDATE_BLOCKER) {
            let uid: number = StackContext.get('UID');
            let CLIENT_TAB_ID: string = StackContext.get('CLIENT_TAB_ID');
            if (uid && CLIENT_TAB_ID) {
                this.throttled_refuse({ [uid]: { [CLIENT_TAB_ID]: true } });
            }
            return null;
        }

        let datatable: ModuleTable<any> = VOsTypesManager.moduleTables_by_voType[api_type_id];

        if (!datatable) {
            ConsoleHandler.error("Impossible de trouver le datatable ! " + api_type_id);
            return null;
        }

        try {

            if (datatable.is_segmented) {

                if (!ranges) {
                    ranges = this.get_all_ranges_from_segmented_table(datatable);
                }

                if ((!ranges) || (RangeHandler.getCardinalFromArray(ranges) < 1)) {
                    return null;
                }

                let self = this;
                await RangeHandler.foreach_ranges(ranges, async (segment_value) => {

                    if (!self.has_segmented_known_database(datatable, segment_value)) {
                        return;
                    }
                    let query_string = "TRUNCATE " + datatable.get_segmented_full_name(segment_value);
                    let uid = this.log_db_query_perf_start('truncate', query_string, 'is_segmented');
                    await ModuleServiceBase.getInstance().db.none(query_string + ";");
                    this.log_db_query_perf_end(uid, 'truncate', query_string, 'is_segmented');

                }, datatable.table_segmented_field_segment_type);
            } else {
                let query_string = "TRUNCATE " + datatable.full_name;
                let uid = this.log_db_query_perf_start('truncate', query_string, '!is_segmented');
                await ModuleServiceBase.getInstance().db.none(query_string + ";");
                this.log_db_query_perf_end(uid, 'truncate', query_string, '!is_segmented');
            }
        } catch (error) {
            ConsoleHandler.error(error);
            let uid: number = StackContext.get('UID');
            let CLIENT_TAB_ID: string = StackContext.get('CLIENT_TAB_ID');
            await PushDataServerController.getInstance().notifySimpleERROR(uid, CLIENT_TAB_ID, 'dao.truncate.error', true);
        }
    }


    /**
     * @deprecated  use context queries - will be deleted soon [utiliser la version contextquery query(API_TYPE_ID).select_vos<T>();]
     */
    public async selectAll<T extends IDistantVOBase>(
        API_TYPE_ID: string, query_: string = null, queryParams: any[] = null, depends_on_api_type_ids: string[] = null,
        distinct: boolean = false, ranges: IRange[] = null, limit: number = 0, offset: number = 0): Promise<T[]> {

        let moduleTable: ModuleTable<T> = VOsTypesManager.moduleTables_by_voType[API_TYPE_ID];

        // On vérifie qu'on peut faire un select
        if (!this.checkAccessSync(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        let res: T[] = null;

        if (moduleTable.is_segmented) {

            // Si on est sur une table segmentée on adapte le comportement
            if (!ranges) {
                ranges = this.get_all_ranges_from_segmented_table(moduleTable);
            }

            if ((!ranges) || (RangeHandler.getCardinalFromArray(ranges) < 1)) {
                return null;
            }

            let segmentations_tables: { [table_name: string]: number } = {};

            RangeHandler.foreach_ranges_sync(ranges, (segment_value) => {

                if (!this.has_segmented_known_database(moduleTable, segment_value)) {
                    return;
                }

                let table_name = moduleTable.get_segmented_full_name(segment_value);
                segmentations_tables[table_name] = segment_value;
            }, moduleTable.table_segmented_field_segment_type);

            let request: string = null;

            let fields_select: string = 't.id';
            let fields = moduleTable.get_fields();
            for (let i in fields) {
                let field = fields[i];

                fields_select += ',t.' + field.field_id;
            }

            for (let segmentation_table in segmentations_tables) {

                if (!request) {
                    request = '';
                } else {
                    request += ' UNION ALL ';
                }

                request += "SELECT " + (distinct ? 'distinct' : '') + " " + fields_select + " ";
                request += " FROM " + segmentation_table + ' t ';
                request += (query_ ? query_.replace(/;/g, '') : '');
            }

            if (!request) {
                return null;
            }

            request += (limit ? ' limit ' + limit : '');
            request += (offset ? ' offset ' + offset : '');

            let query_uid = this.log_db_query_perf_start('selectAll', request, 'is_segmented');
            let vos: T[] = await ModuleServiceBase.getInstance().db.query(request + ';', queryParams ? queryParams : []);
            this.log_db_query_perf_end(query_uid, 'selectAll', request, 'is_segmented');

            for (let i in vos) {
                let data = vos[i];
                data._type = moduleTable.vo_type;
            }

            res = moduleTable.forceNumerics(vos);
        } else {
            let query_string = "SELECT " + (distinct ? 'distinct' : '') + " t.* FROM " + moduleTable.full_name + " t " +
                (query_ ? query_ : '') + (limit ? ' limit ' + limit : '') + (offset ? ' offset ' + offset : '');
            let query_uid = this.log_db_query_perf_start('selectAll', query_string, '!is_segmented');

            let vos = await ModuleServiceBase.getInstance().db.query(
                query_string, queryParams ? queryParams : []) as T[];
            for (let i in vos) {
                let data = vos[i];
                data._type = moduleTable.vo_type;
            }
            res = moduleTable.forceNumerics(vos);

            this.log_db_query_perf_end(query_uid, 'selectAll', query_string, '!is_segmented');
        }

        // On filtre les res suivant les droits d'accès
        res = await this.filterVOsAccess(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ, res);

        if (!res) {
            return null;
        }

        let uid = await StackContext.get('UID');
        if (uid) {
            await ServerAnonymizationController.getInstance().anonymise(moduleTable, res, uid, null);
        }

        return res;
    }

    /**
     * @deprecated use context queries - will be deleted soon [utiliser la version contextquery query(API_TYPE_ID).select_vo<T>();]
     */
    public async selectOne<T extends IDistantVOBase>(API_TYPE_ID: string, query_: string = null, queryParams: any[] = null, depends_on_api_type_ids: string[] = null, ranges: IRange[] = null): Promise<T> {
        let moduleTable: ModuleTable<T> = VOsTypesManager.moduleTables_by_voType[API_TYPE_ID];

        // On vérifie qu'on peut faire un select
        if (!this.checkAccessSync(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        let vo: T = null;
        if (moduleTable.is_segmented) {

            // Si on est sur une table segmentée on adapte le comportement
            if (!ranges) {
                ranges = this.get_all_ranges_from_segmented_table(moduleTable);
            }

            if ((!ranges) || (RangeHandler.getCardinalFromArray(ranges) < 1)) {
                return null;
            }

            let segmented_vo: T = null;
            let error: boolean = false;
            let self = this;
            await RangeHandler.foreach_ranges(ranges, async (segment_value) => {

                if (!self.has_segmented_known_database(moduleTable, segment_value)) {
                    return;
                }

                let query_string = "SELECT t.* FROM " + moduleTable.get_segmented_full_name(segment_value) + " t " + (query_ ? query_ : '');
                let query_uid = this.log_db_query_perf_start('selectOne', query_string, 'is_segmented');
                let segment_vo: T = await ModuleServiceBase.getInstance().db.oneOrNone(query_string + ";", queryParams ? queryParams : []) as T;
                this.log_db_query_perf_end(query_uid, 'selectOne', query_string, 'is_segmented');

                if ((!!segmented_vo) && (!!segment_vo)) {
                    ConsoleHandler.error('More than one result on selectOne on segmented table :' + moduleTable.get_segmented_full_name(segment_value) + ';');
                    error = true;
                }

                if (!!segment_vo) {
                    segmented_vo = segment_vo;
                }
            }, moduleTable.table_segmented_field_segment_type);

            if (error) {
                return null;
            }

            if (!!segmented_vo) {

                segmented_vo['_type'] = moduleTable.vo_type;
                segmented_vo = moduleTable.forceNumeric(segmented_vo);
            }

            // On filtre les vo suivant les droits d'accès
            vo = segmented_vo;
        } else {
            let query_string = "SELECT t.* FROM " + moduleTable.full_name + " t " + (query_ ? query_ : '');
            let query_uid = this.log_db_query_perf_start('selectOne', query_string, '!is_segmented');
            vo = await ModuleServiceBase.getInstance().db.oneOrNone(query_string + ";", queryParams ? queryParams : []) as T;
            this.log_db_query_perf_end(query_uid, 'selectOne', query_string, '!is_segmented');
            if (!!vo) {
                vo['_type'] = moduleTable.vo_type;
                vo = moduleTable.forceNumeric(vo);
            }
        }

        // On filtre suivant les droits d'accès
        vo = await this.filterVOAccess(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ, vo);

        if (!vo) {
            return null;
        }

        let uid = await StackContext.get('UID');
        if (uid) {
            await ServerAnonymizationController.getInstance().anonymise(moduleTable, [vo], uid, null);
        }

        return vo;
    }

    /**
     * DONT USE : N'utiliser que en cas de force majeure => exemple upgrade de format de BDD
     * @param query_
     */
    public async query(query_: string = null, values: any = null): Promise<any> {
        if (DAOServerController.GLOBAL_UPDATE_BLOCKER && !/^select /i.test(query_)) {
            let uid: number = StackContext.get('UID');
            let CLIENT_TAB_ID: string = StackContext.get('CLIENT_TAB_ID');
            if (uid && CLIENT_TAB_ID) {
                this.throttled_refuse({ [uid]: { [CLIENT_TAB_ID]: true } });
            }
            return null;
        }

        // On vérifie qu'on peut faire des modifs de table modules
        if (!ModuleAccessPolicyServer.getInstance().checkAccessSync(ModuleDAO.DAO_ACCESS_QUERY)) {
            return null;
        }

        let res = null;

        let query_uid = this.log_db_query_perf_start('query', query_);
        if (!!values) {
            res = await ModuleServiceBase.getInstance().db.query(query_, values);
        } else {
            res = await ModuleServiceBase.getInstance().db.query(query_);
        }
        this.log_db_query_perf_end(query_uid, 'query', query_);

        return res;
    }


    /**
     * Throttle select queries group every 10ms (parametrable)
     * ATTENTION : le résultat de cette méthode peut être immutable ! donc toujours prévoir une copie de la data si elle a vocation à être modifiée par la suite
     * @returns {Promise<any>} résultat potentiellement freeze à tester avec Object.isFrozen
     */
    public async throttle_select_query(query_: string = null, values: any = null, parameterizedQueryWrapperFields: ParameterizedQueryWrapperField[], context_query: ContextQueryVO): Promise<any> {
        await this.check_throttled_select_query_size_ms();
        let self = this;

        return new Promise(async (resolve, reject) => {

            let param = new ThrottledSelectQueryParam([resolve], context_query, parameterizedQueryWrapperFields, query_, values);

            if (ConfigurationService.node_configuration.DEBUG_THROTTLED_SELECT) {
                ConsoleHandler.log('throttle_select_query:' + param.parameterized_full_query);
            }

            try {
                self.throttled_select_query_params.push(param);
                await self.throttled_select_query_({
                    [param.index]: param
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    public async throttled_select_query() {
        if (this.throttled_select_query_params && this.throttled_select_query_params.length) {

            let moduleTables_by_voType = VOsTypesManager.moduleTables_by_voType;

            /**
             * On libère la liste des params pour un prochain appel
             */
            let batch_throttled_select_query_params = this.throttled_select_query_params;
            this.throttled_select_query_params = [];

            /**
             * On doit d'abord regrouper les requêtes par liste de fields (et même de fields label dans la query)
             *  donc si on a pas de fields, il faudrait ressortir les fields du moduletable (mais il faut le faire en amont je pense)
             *  pour le moment je gère pas ce cas (et je log un warning)
             */
            let throttled_select_query_params_by_fields_labels_by_index: { [fields_labels: string]: { [index: number]: ThrottledSelectQueryParam } } = {};

            /**
             * On essaie aussi d'identifier des requêtes parfaitement identiques pour pas les refaire 10 fois
             *  donc où on a la même query et les mêmes values
             * Si on en trouve plusieurs, on stocke les cbs, mais on oublie la seconde requete
             */
            let throttled_select_query_params_by_parameterized_full_query: { [parameterized_full_query: string]: ThrottledSelectQueryParam } = {};

            /**
             * On se fait aussi une list par index de requete pour alléger les recherches par la suite
             */
            let throttled_select_query_params_by_index: { [index: number]: ThrottledSelectQueryParam } = {};

            if (ConfigurationService.node_configuration.DEBUG_THROTTLED_SELECT) {
                ConsoleHandler.log('throttled_select_query:IN:' + this.throttled_select_query_params.length);
            }

            let promises = [];
            for (let i in batch_throttled_select_query_params) {
                let throttled_select_query_param: ThrottledSelectQueryParam = batch_throttled_select_query_params[i];

                /**
                 * Unicité des requêtes
                 */
                if (throttled_select_query_params_by_parameterized_full_query[throttled_select_query_param.parameterized_full_query]) {

                    throttled_select_query_params_by_parameterized_full_query[throttled_select_query_param.parameterized_full_query].cbs.push(...throttled_select_query_param.cbs);
                    if (ConfigurationService.node_configuration.DEBUG_THROTTLED_SELECT) {
                        ConsoleHandler.log('throttled_select_query:found duplicated query:' + throttled_select_query_param.parameterized_full_query + ':' + throttled_select_query_params_by_parameterized_full_query[throttled_select_query_param.parameterized_full_query].cbs.length + 'x (counting cbs)');
                    }

                    continue;
                }
                throttled_select_query_params_by_parameterized_full_query[throttled_select_query_param.parameterized_full_query] = throttled_select_query_param;
                throttled_select_query_params_by_index[throttled_select_query_param.index] = throttled_select_query_param;

                let fields = throttled_select_query_param.parameterizedQueryWrapperFields;
                let fields_labels: string = null;

                fields_labels = throttled_select_query_param.context_query.do_count_results ? 'number,c' : null;

                if (!fields_labels) {
                    fields_labels = fields ? fields.map((field) => {

                        // On a besoin du type du champs et de l'alias
                        let table_field_type = 'N/A';

                        try {
                            table_field_type = ((field.field_id == 'id') ? ModuleTableField.FIELD_TYPE_int :
                                moduleTables_by_voType[field.api_type_id].getFieldFromId(field.field_id).field_type);
                        } catch (error) {
                            ConsoleHandler.error('throttled_select_query : error while getting field type for field ' + field.field_id + ' of type ' + field.api_type_id);
                        }

                        return table_field_type + ',' + field.row_col_alias;

                    }).join(';') : null;
                }

                if (!fields_labels) {
                    ConsoleHandler.warn('Throttled select query without fields, not supported yet');
                    promises.push((async () => {
                        let res = await this.query(throttled_select_query_param.parameterized_full_query);

                        let pms = [];
                        for (let cbi in throttled_select_query_param.cbs) {
                            let cb = throttled_select_query_param.cbs[cbi];

                            pms.push(cb(res));
                        }
                        await all_promises(pms);
                    })());
                    continue;
                }

                if (!throttled_select_query_params_by_fields_labels_by_index[fields_labels]) {
                    throttled_select_query_params_by_fields_labels_by_index[fields_labels] = {};
                }

                throttled_select_query_params_by_fields_labels_by_index[fields_labels][throttled_select_query_param.index] = throttled_select_query_param;
            }

            for (let i in throttled_select_query_params_by_fields_labels_by_index) {
                let throttled_select_query_params: { [index: number]: ThrottledSelectQueryParam } = throttled_select_query_params_by_fields_labels_by_index[i];

                promises.push((async () => {

                    let request: string = "";
                    if (ConfigurationService.node_configuration.DEBUG_THROTTLED_SELECT) {
                        ConsoleHandler.log('throttled_select_query:do_throttled_select_query:PREPARE:' + i);
                    }
                    for (let j in throttled_select_query_params) {
                        let param = throttled_select_query_params[j];

                        if (param.semaphore) {
                            continue;
                        }
                        param.semaphore = true;

                        /**
                         * On ne doit avoir que des select
                         */
                        if (!/^\(?select /i.test(param.parameterized_full_query)) {
                            ConsoleHandler.error('Only select queries are allowed in throttled_select_query:' + param.parameterized_full_query);
                            continue;
                        }

                        if (request != "") {
                            request += " UNION ALL ";
                        }

                        let this_query = "(SELECT " + param.index + " as ___throttled_select_query___index, ___throttled_select_query___query.* from (" + param.parameterized_full_query + ") ___throttled_select_query___query)";
                        if (ConfigurationService.node_configuration.DEBUG_THROTTLED_SELECT) {
                            ConsoleHandler.log('throttled_select_query:do_throttled_select_query:this_query:' + this_query);
                        }
                        request += this_query;
                    }

                    if (request != "") {
                        if (ConfigurationService.node_configuration.DEBUG_THROTTLED_SELECT) {
                            ConsoleHandler.log('throttled_select_query:do_throttled_select_query:START:' + i);
                        }
                        await this.do_throttled_select_query(request, null, throttled_select_query_params);
                        if (ConfigurationService.node_configuration.DEBUG_THROTTLED_SELECT) {
                            ConsoleHandler.log('throttled_select_query:do_throttled_select_query:END:' + i);
                        }
                    }
                })());
            }
            await Promise.all(promises);
        }
    }

    /**
     * Cas très spécifique de la connexion où l'on a évidemment pas le droit de lister les comptes, mais il faut tout de même pouvoir se connecter...
     */
    public async selectOneUser(login: string, password: string, check_pwd: boolean = true): Promise<UserVO> {
        let datatable: ModuleTable<UserVO> = VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID];

        try {


            let query_string = "select * from ref.get_user(" + login.toLowerCase().trim() + ", $1, $1, $2, $3);";
            let query_uid = this.log_db_query_perf_start('selectOneUser', query_string);
            let vo: UserVO = await ModuleServiceBase.getInstance().db.oneOrNone(
                "select * from ref.get_user($1, $1, $1, $2, $3);", [login.toLowerCase().trim(), password, check_pwd]) as UserVO;
            this.log_db_query_perf_end(query_uid, 'selectOneUser', query_string);

            vo = (vo && vo.id) ? vo : null;
            if (!!vo) {
                vo['_type'] = UserVO.API_TYPE_ID;
                vo = datatable.forceNumeric(vo);
            }
            return vo;
        } catch (error) {
            ConsoleHandler.error(error);
        }
        return null;
    }

    /**
     * Cas très spécifique du check d'unicité
     * @returns true if uniq
     */
    public async selectUsersForCheckUnicity(name: string, email: string, phone: string, user_id: number): Promise<boolean> {
        let datatable: ModuleTable<UserVO> = VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID];

        try {

            let query_string = "select * from ref.get_user(" + name.toLowerCase().trim() + ", " + email.toLowerCase().trim() + ", " + (phone ? phone.toLowerCase().trim() : null) + ", $2, $3);";
            let query_uid = this.log_db_query_perf_start('selectUsersForCheckUnicity', query_string);
            let vo: UserVO = await ModuleServiceBase.getInstance().db.oneOrNone(
                "select * from ref.get_user($1, $2, $3, null, false);", [name.toLowerCase().trim(), email.toLowerCase().trim(), phone ? phone.toLowerCase().trim() : null]) as UserVO;
            this.log_db_query_perf_end(query_uid, 'selectUsersForCheckUnicity', query_string);

            vo = (vo && vo.id) ? vo : null;
            if (!!vo) {
                vo['_type'] = UserVO.API_TYPE_ID;
                vo = datatable.forceNumeric(vo);
            }

            if (!vo) {
                return true;
            }

            return vo.id == user_id;
        } catch (error) {
            ConsoleHandler.error(error);
        }
        return false;
    }

    /**
     * Cas très spécifique du recover de MDP => attention cette fonction ne doit jamais être utiliser en dehors sinon on offre le listage des users à tous (c'est pas le but...)
     */
    public async selectOneUserForRecovery(login: string): Promise<UserVO> {
        let datatable: ModuleTable<UserVO> = VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID];

        try {
            let query_string = "SELECT t.* FROM " + datatable.full_name + " t " + "WHERE (TRIM(LOWER(" + login.toLowerCase().trim();
            let query_uid = this.log_db_query_perf_start('selectOneUserForRecovery', query_string);
            let vo: UserVO = await ModuleServiceBase.getInstance().db.oneOrNone("SELECT t.* FROM " + datatable.full_name + " t " + "WHERE (TRIM(LOWER(name)) = $1 OR TRIM(LOWER(email)) = $1 or TRIM(LOWER(phone)) = $1) and blocked = false", [login.toLowerCase().trim()]) as UserVO;
            this.log_db_query_perf_end(query_uid, 'selectOneUserForRecovery', query_string);

            if (!!vo) {
                vo['_type'] = UserVO.API_TYPE_ID;
                vo = datatable.forceNumeric(vo);
            }
            return vo;
        } catch (error) {
            ConsoleHandler.error(error);
        }
        return null;
    }

    /**
     * Cas très spécifique du recover de MDP => attention cette fonction ne doit jamais être utiliser en dehors sinon on offre le listage des users à tous (c'est pas le but...)
     */
    public async selectOneUserForRecoveryUID(uid: number): Promise<UserVO> {
        let datatable: ModuleTable<UserVO> = VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID];

        let query_string = "SELECT t.* FROM " + datatable.full_name + " t " + "WHERE id = " + uid + " and blocked = false";
        let query_uid = this.log_db_query_perf_start('selectOneUserForRecoveryUID', query_string);
        let vo: UserVO = await ModuleServiceBase.getInstance().db.oneOrNone("SELECT t.* FROM " + datatable.full_name + " t " + "WHERE id = $1 and blocked = false", [uid]) as UserVO;
        this.log_db_query_perf_end(query_uid, 'selectOneUserForRecoveryUID', query_string);

        if (!!vo) {
            vo['_type'] = UserVO.API_TYPE_ID;
            vo = datatable.forceNumeric(vo);
        }
        return vo;
    }

    /**
     * @depracated do not use anymore, use context queries instead - will be deleted soon
     */
    public async filterVOsAccess<T extends IDistantVOBase>(datatable: ModuleTable<T>, access_type: string, vos: T[]): Promise<T[]> {

        if (!ModuleAccessPolicy.getInstance().actif) {
            return vos;
        }

        // Suivant le type de contenu et le type d'accès, on peut avoir un hook enregistré sur le ModuleDAO pour filtrer les vos
        let hooks = DAOServerController.getInstance().access_hooks[datatable.vo_type] && DAOServerController.getInstance().access_hooks[datatable.vo_type][access_type] ? DAOServerController.getInstance().access_hooks[datatable.vo_type][access_type] : [];
        if (!StackContext.get('IS_CLIENT')) {
            // Server
            return vos;
        }

        for (let i in hooks) {
            let hook = hooks[i];

            let uid: number = StackContext.get('UID');
            vos = await hook(datatable, vos, uid, null) as T[];
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

    /**
     * Check injection OK
     * @param field_type
     * @param field_id
     * @param intersector_range
     * @returns
     */
    public getClauseWhereRangeIntersectsField(field_type: string, field_id: string, intersector_range: IRange): string {

        ContextQueryInjectionCheckHandler.assert_integer(intersector_range.min);
        ContextQueryInjectionCheckHandler.assert_integer(intersector_range.max);

        switch (field_type) {

            case ModuleTableField.FIELD_TYPE_email:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_translatable_text:
            case ModuleTableField.FIELD_TYPE_textarea:
                if (intersector_range.range_type == TSRange.RANGE_TYPE) {
                    return field_id + "::timestamp with time zone <@ '" + (intersector_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(intersector_range.min) + "," + DateHandler.getInstance().formatDayForIndex(intersector_range.max) + (intersector_range.max_inclusiv ? "]" : ")") + "'::tstzrange";
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
                    return field_id + " = " + intersector_range.min;
                }

            case ModuleTableField.FIELD_TYPE_amount:
            case ModuleTableField.FIELD_TYPE_float:
            case ModuleTableField.FIELD_TYPE_decimal_full_precision:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
            case ModuleTableField.FIELD_TYPE_prct:
                return field_id + " >" + (intersector_range.min_inclusiv ? "=" : "") + " " + intersector_range.min + " and " + field_id + " <" + (intersector_range.max_inclusiv ? "=" : "") + " " + intersector_range.max;

            case ModuleTableField.FIELD_TYPE_tstz:
                return field_id + " >" + (intersector_range.min_inclusiv ? "=" : "") + " " + intersector_range.min + " and " + field_id + " <" + (intersector_range.max_inclusiv ? "=" : "") + " " + intersector_range.max;

            case ModuleTableField.FIELD_TYPE_tstz_array:
                return "'" + (intersector_range.min_inclusiv ? "[" : "(") + intersector_range.min + "," + intersector_range.max + (intersector_range.max_inclusiv ? "]" : ")") + "'::numrange && ANY (" + field_id + "::numeric[])";

            case ModuleTableField.FIELD_TYPE_int_array:
                return "'" + (intersector_range.min_inclusiv ? "[" : "(") + intersector_range.min + "," + intersector_range.max + (intersector_range.max_inclusiv ? "]" : ")") + "'::numrange && ANY (" + field_id + "::numeric[])";

            case ModuleTableField.FIELD_TYPE_float_array:
                return "'" + (intersector_range.min_inclusiv ? "[" : "(") + intersector_range.min + "," + intersector_range.max + (intersector_range.max_inclusiv ? "]" : ")") + "'::numrange && ANY (" + field_id + "::numeric[])";

            case ModuleTableField.FIELD_TYPE_isoweekdays:
            case ModuleTableField.FIELD_TYPE_refrange_array:
            case ModuleTableField.FIELD_TYPE_numrange_array:
                return "'" + (intersector_range.min_inclusiv ? "[" : "(") + intersector_range.min + "," + intersector_range.max + (intersector_range.max_inclusiv ? "]" : ")") + "'::numrange && ANY (" + field_id + "::numrange[])";

            case ModuleTableField.FIELD_TYPE_date:
            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_month:
                return field_id + "::date <@ '" + (intersector_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(intersector_range.min) + "," + DateHandler.getInstance().formatDayForIndex(intersector_range.max) + (intersector_range.max_inclusiv ? "]" : ")") + "'::daterange";

            case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                // TODO FIXME
                break;

            case ModuleTableField.FIELD_TYPE_daterange:
                return field_id + " && '" + (intersector_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(intersector_range.min) + "," + DateHandler.getInstance().formatDayForIndex(intersector_range.max) + (intersector_range.max_inclusiv ? "]" : ")") + "'::daterange";

            case ModuleTableField.FIELD_TYPE_tsrange:
                return field_id + " && '" + (intersector_range.min_inclusiv ? "[" : "(") + intersector_range.min + "," + intersector_range.max + (intersector_range.max_inclusiv ? "]" : ")") + "'::numrange";

            case ModuleTableField.FIELD_TYPE_numrange:
                return field_id + " && '" + (intersector_range.min_inclusiv ? "[" : "(") + intersector_range.min + "," + intersector_range.max + (intersector_range.max_inclusiv ? "]" : ")") + "'::numrange";

            case ModuleTableField.FIELD_TYPE_tstzrange_array:
                return "'" + (intersector_range.min_inclusiv ? "[" : "(") + intersector_range.min + "," + intersector_range.max + (intersector_range.max_inclusiv ? "]" : ")") + "'::numrange && ANY (" + field_id + "::numrange[])";

            case ModuleTableField.FIELD_TYPE_hourrange:
                return field_id + " && '" + (intersector_range.min_inclusiv ? "[" : "(") + intersector_range.min + "," + intersector_range.max + (intersector_range.max_inclusiv ? "]" : ")") + "'::numrange";

            case ModuleTableField.FIELD_TYPE_hourrange_array:
                return "'" + (intersector_range.min_inclusiv ? "[" : "(") + intersector_range.min + "," + intersector_range.max + (intersector_range.max_inclusiv ? "]" : ")") + "'::numrange && ANY (" + field_id + "::numrange[])";

            case ModuleTableField.FIELD_TYPE_geopoint:
            case ModuleTableField.FIELD_TYPE_plain_vo_obj:
            default:
                return null;
        }
    }

    /**
     * Fonction qui vérifie chaque champ de foreign ref et qui si la bdd ne gère pas la foreign key le fait (vérifie
     * que l'id ciblé existe bien, sinon on refuse l'insertion)
     */
    public async filterByForeignKeys<T extends IDistantVOBase>(vos: T[]): Promise<T[]> {

        StatsController.register_stat_COMPTEUR('ModuleDAOServer', 'filterByForeignKeys', 'IN');

        if (!vos || !vos.length) {
            StatsController.register_stat_COMPTEUR('ModuleDAOServer', 'filterByForeignKeys', 'USELESS');
            return null;
        }

        let time_in = Dates.now_ms();

        let res: T[] = [];

        let max = Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2));
        let promise_pipeline = new PromisePipeline(max);

        for (let i in vos) {
            let vo = vos[i];

            await promise_pipeline.push(async () => {
                let refuse: boolean = await this.refuseVOByForeignKeys(vo);

                if (!refuse) {
                    res.push(vo);
                }
            });
        }

        await promise_pipeline.end();

        StatsController.register_stat_QUANTITE('ModuleDAOServer', 'filterByForeignKeys', '-', vos.length);
        StatsController.register_stat_DUREE('ModuleDAOServer', 'filterByForeignKeys', '-', Dates.now_ms() - time_in);

        return res;
    }

    private async refuseVOByForeignKeys<T extends IDistantVOBase>(vo: T): Promise<boolean> {

        let time_in = Dates.now_ms();

        StatsController.register_stat_COMPTEUR('ModuleDAOServer', 'refuseVOByForeignKeys', 'IN');
        let moduleTable: ModuleTable<any> = VOsTypesManager.moduleTables_by_voType[vo._type];

        if (!moduleTable) {
            StatsController.register_stat_COMPTEUR('ModuleDAOServer', 'refuseVOByForeignKeys', 'USELESS');
            return true;
        }

        let fields = moduleTable.get_fields();
        let refuse: boolean = false;
        let promises = [];

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

            switch (field.field_type) {
                case ModuleTableField.FIELD_TYPE_refrange_array:
                case ModuleTableField.FIELD_TYPE_numrange_array:

                    if (!(vo[field.field_id] as any[]).length) {
                        // champs vide, inutile de checker
                        break;
                    }

                    promises.push((async () => {
                        try {
                            let nb: number = await this.countVosByIdsRanges(field.manyToOne_target_moduletable.vo_type, vo[field.field_id]);
                            if (nb != RangeHandler.getCardinalFromArray(vo[field.field_id])) {
                                refuse = true;
                            }
                        } catch (error) {
                            ConsoleHandler.error(error);
                            refuse = true;
                        }
                    })());
                    break;
                default:
                    StatsController.register_stat_COMPTEUR('ModuleDAOServer', 'refuseVOByForeignKeys', 'FILTERED_FIELD_TYPE');
                    return true;
            }
        }

        await all_promises(promises);
        StatsController.register_stat_DUREE('ModuleDAOServer', 'refuseVOByForeignKeys', '-', Dates.now_ms() - time_in);

        return refuse;
    }

    private async insertOrUpdateVOs<T extends IDistantVOBase>(vos: T[]): Promise<InsertOrDeleteQueryResult[]> {

        if (DAOServerController.GLOBAL_UPDATE_BLOCKER) {
            let uid: number = StackContext.get('UID');
            let CLIENT_TAB_ID: string = StackContext.get('CLIENT_TAB_ID');
            if (uid && CLIENT_TAB_ID) {
                this.throttled_refuse({ [uid]: { [CLIENT_TAB_ID]: true } });
            }
            return null;
        }

        // On vérifie qu'on peut faire un insert ou update
        if ((!vos) || (!vos.length)) {
            return null;
        }

        vos = vos.filter((vo) =>
            (!!vo) && vo._type && VOsTypesManager.moduleTables_by_voType[vo._type] &&
            this.checkAccessSync(VOsTypesManager.moduleTables_by_voType[vo._type], ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE));

        if ((!vos) || (!vos.length)) {
            return null;
        }

        // On ajoute un filtrage via hook
        let tmp_vos = [];
        let limit = ConfigurationService.node_configuration.MAX_POOL / 2;
        let promises_pipeline = new PromisePipeline(limit);
        for (let i in vos) {
            let vo = vos[i];

            await promises_pipeline.push(async () => {
                let tmp_vo = await this.filterVOAccess(VOsTypesManager.moduleTables_by_voType[vo._type], ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, vo);

                if (!!tmp_vo) {
                    tmp_vos.push(tmp_vo);
                }
            });
        }
        await promises_pipeline.end();

        if ((!tmp_vos) || (!tmp_vos.length)) {
            return null;
        }
        vos = tmp_vos;

        if (this.check_foreign_keys) {
            vos = await this.filterByForeignKeys(vos);
            if ((!vos) || (!vos.length)) {
                return null;
            }
        }

        return new Promise<any[]>(async (resolve, reject) => {

            let isUpdates: boolean[] = [];
            let preUpdates: IDistantVOBase[] = [];

            let sqls = [];
            let bdd_versions = [];
            for (let i in vos) {
                let vo: IDistantVOBase = vos[i];

                let moduleTable: ModuleTable<any> = VOsTypesManager.moduleTables_by_voType[vo._type];

                if (!moduleTable) {
                    return null;
                }

                /**
                 * Si on a des fields de type unique, et pas de id fourni, on veut tester de charger depuis la bdd un objet avec
                 *  la même valeur de champ unique. si on trouve on passe en update au lieu d'insert
                 */
                if (!vo.id) {
                    try {
                        vo.id = await this.check_uniq_indexes(vo, moduleTable);
                    } catch (err) {
                        continue;
                    }
                }

                isUpdates[i] = vo.id ? true : false;
                preUpdates[i] = null;

                /**
                 * Si on est sur un update et si on a des triggers de mise à jour on veut récupérer le vo en base avant de l'écraser pour le passer aux triggers
                 */
                if (vo.id) {

                    if (DAOServerController.getInstance().pre_update_trigger_hook.has_trigger(vo._type) || DAOServerController.getInstance().post_update_trigger_hook.has_trigger(vo._type)) {

                        let query_ = query(vo._type).filter_by_id(vo.id);
                        if (moduleTable.is_segmented && moduleTable.table_segmented_field && (vo[moduleTable.table_segmented_field.field_id] != null)) {
                            query_.filter_by_num_eq(moduleTable.table_segmented_field.field_id, moduleTable.get_segmented_field_value_from_vo(vo));
                        }
                        preUpdates[i] = await query_.select_vo();

                        if (!preUpdates[i]) {
                            // Cas d'un objet en cache server ou client mais qui n'existe plus sur la BDD => on doit insérer du coup un nouveau
                            isUpdates[i] = false;
                            vo.id = null;
                        }
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
            let resolved = false;

            if (sqls.length > 0) {
                let query_uid = this.log_db_query_perf_start('insertOrUpdateVOs');
                results = await ModuleServiceBase.getInstance().db.tx(async (t) => {

                    let queries: any[] = [];

                    for (let i in sqls) {
                        let sql: string = sqls[i];
                        let vo = bdd_versions[i];

                        queries.push(t.oneOrNone(sql, vo));
                    }

                    return t.batch(queries);
                }).catch((reason) => {
                    ConsoleHandler.error('insertOrUpdateVOs :' + reason);
                    this.log_db_query_perf_end(query_uid, 'insertOrUpdateVOs');
                    resolve(null);
                    resolved = true;
                });
                this.log_db_query_perf_end(query_uid, 'insertOrUpdateVOs');
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

            if (!resolved) {
                resolve(InsertOrDeleteQueryResults);
            }
        });
    }

    /**
     * On checke les indexs uniques, et si on trouve que l'objet existe, on renvoie l'id de l'objet identifié
     */
    private async check_uniq_indexes(vo: IDistantVOBase, moduleTable: ModuleTable<any>): Promise<number> {
        if (moduleTable.uniq_indexes && moduleTable.uniq_indexes.length) {
            for (let j in moduleTable.uniq_indexes) {
                let uniq_index = moduleTable.uniq_indexes[j];

                let replace_if_unique_field_id: { [field_id: string]: boolean } = {};

                let filters = [];

                for (let k in uniq_index) {
                    let field = uniq_index[k];

                    replace_if_unique_field_id[field.field_id] = field.replace_if_unique;

                    // Si la valeur est null dans le vo ça sert à rien de tester
                    if (vo[field.field_id] == null) {
                        continue;
                    }

                    if (field.replace_if_unique) {
                        return null;
                    }

                    let filter_: ContextFilterVO = null;

                    switch (field.field_type) {
                        case ModuleTableField.FIELD_TYPE_string:
                        case ModuleTableField.FIELD_TYPE_email:
                        case ModuleTableField.FIELD_TYPE_html:
                        case ModuleTableField.FIELD_TYPE_password:
                        case ModuleTableField.FIELD_TYPE_textarea:
                            filter_ = filter(moduleTable.vo_type, field.field_id).by_text_has(vo[field.field_id]);
                            break;
                        case ModuleTableField.FIELD_TYPE_amount:
                        case ModuleTableField.FIELD_TYPE_date:
                        case ModuleTableField.FIELD_TYPE_enum:
                        case ModuleTableField.FIELD_TYPE_file_ref:
                        case ModuleTableField.FIELD_TYPE_float:
                        case ModuleTableField.FIELD_TYPE_geopoint:
                        case ModuleTableField.FIELD_TYPE_image_ref:
                        case ModuleTableField.FIELD_TYPE_int:
                        case ModuleTableField.FIELD_TYPE_isoweekdays:
                        case ModuleTableField.FIELD_TYPE_month:
                        case ModuleTableField.FIELD_TYPE_month:
                        case ModuleTableField.FIELD_TYPE_prct:
                        case ModuleTableField.FIELD_TYPE_tstz:
                        case ModuleTableField.FIELD_TYPE_foreign_key:
                            filter_ = filter(moduleTable.vo_type, field.field_id).by_num_eq(vo[field.field_id]); // pas has ?
                            break;
                        default:
                            throw new Error('Not Implemented');
                    }

                    filters.push(filter_);
                }

                if ((!filters) || (!filters.length)) {
                    continue;
                }

                let query_: ContextQueryVO = query(vo._type).add_filters(filters).set_limit(1, 0);

                /**
                 * On doit absolument ignorer tout access hook à ce niveau sinon on risque de rater l'élément en base
                 */
                query_.exec_as_admin();

                let uniquevos: IDistantVOBase[] = null;

                StatsController.register_stat_COMPTEUR('dao', 'check_uniq_indexes', 'query');

                await StackContext.runPromise({ IS_CLIENT: false }, async () => {
                    uniquevos = await ModuleContextFilter.getInstance().select_vos(query_);
                });

                if (uniquevos && uniquevos[0] && uniquevos[0].id) {
                    /**
                     * JNE :Est-ce que c'est pas un code inaccessible depuis l'ajout de if (field.replace_if_unique) { return null; } dans la boucle au dessus ?
                     */
                    for (let field_id in replace_if_unique_field_id) {
                        // Si on a la même valeur et qu'on ne peut pas remplacer, on throw une erreur
                        if ((vo[field_id] != null) && (vo[field_id] == uniquevos[0][field_id]) && !replace_if_unique_field_id[field_id]) {
                            let uid: number = StackContext.get('UID');
                            let CLIENT_TAB_ID: string = StackContext.get('CLIENT_TAB_ID');

                            if (uid && CLIENT_TAB_ID) {
                                await PushDataServerController.getInstance().notifySimpleERROR(uid, CLIENT_TAB_ID, 'dao.check_uniq_indexes.error' + DefaultTranslation.DEFAULT_LABEL_EXTENSION, true);
                            }
                            StatsController.register_stat_COMPTEUR('dao', 'check_uniq_indexes', 'error');

                            let msg: string = "Ajout impossible car un élément existe déjà avec les mêmes valeurs sur le champ : " + field_id + " : " + JSON.stringify(vo);
                            ConsoleHandler.error(msg);
                            throw new Error(msg);
                        }
                    }

                    return uniquevos[0].id;
                }
            }
        }
        return null;
    }

    private async insertOrUpdateVO(vo: IDistantVOBase): Promise<InsertOrDeleteQueryResult> {

        let time_in = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('dao', 'insertOrUpdateVO', 'in');

        if (DAOServerController.GLOBAL_UPDATE_BLOCKER) {
            let uid: number = StackContext.get('UID');
            let CLIENT_TAB_ID: string = StackContext.get('CLIENT_TAB_ID');
            if (uid && CLIENT_TAB_ID) {
                this.throttled_refuse({ [uid]: { [CLIENT_TAB_ID]: true } });
            }
            StatsController.register_stat_COMPTEUR('dao', 'insertOrUpdateVO', 'global_update_blocker');
            return null;
        }

        // On vérifie qu'on peut faire un insert ou update
        if ((!vo) || (!vo._type) || (!VOsTypesManager.moduleTables_by_voType[vo._type])) {
            StatsController.register_stat_COMPTEUR('dao', 'insertOrUpdateVO', 'invalid_vo');
            return null;
        }
        if (!this.checkAccessSync(VOsTypesManager.moduleTables_by_voType[vo._type], ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE)) {
            StatsController.register_stat_COMPTEUR('dao', 'insertOrUpdateVO', 'failed_checkAccessSync');
            return null;
        }

        // On ajoute un filtrage via hook
        let tmp_vo = await this.filterVOAccess(VOsTypesManager.moduleTables_by_voType[vo._type], ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, vo);

        if (!tmp_vo) {
            StatsController.register_stat_COMPTEUR('dao', 'insertOrUpdateVO', 'failed_filterVOAccess');
            return null;
        }
        vo = tmp_vo;

        let vos = [vo];

        if (this.check_foreign_keys) {
            vos = await this.filterByForeignKeys([vo]);

            if ((!vos) || (vos.length != 1)) {
                StatsController.register_stat_COMPTEUR('dao', 'insertOrUpdateVO', 'filterByForeignKeys');
                return null;
            }
        }

        let self = this;

        return new Promise<InsertOrDeleteQueryResult>(async (resolve, reject) => {

            let isUpdate: boolean = vo.id ? true : false;
            let preUpdate: IDistantVOBase = null;

            let moduleTable: ModuleTable<any> = VOsTypesManager.moduleTables_by_voType[vo._type];

            if (!moduleTable) {
                StatsController.register_stat_COMPTEUR('dao', 'insertOrUpdateVO', 'no_moduletable');
                resolve(null);
                return null;
            }

            /**
             * Si on a des fields de type unique, et pas de id fourni, on veut tester de charger depuis la bdd un objet avec
             *  la même valeur de champ unique. si on trouve on passe en update au lieu d'insert
             */
            if (!vo.id) {
                try {
                    vo.id = await this.check_uniq_indexes(vo, moduleTable);
                } catch (err) {
                    StatsController.register_stat_COMPTEUR('dao', 'insertOrUpdateVO', 'failed_check_uniq_indexes');
                    return null;
                }
            }

            /**
             * Si on est sur un update et si on a des triggers de mise à jour on veut récupérer le vo en base avant de l'écraser pour le passer aux triggers
             */
            if (vo.id) {

                if (DAOServerController.getInstance().pre_update_trigger_hook.has_trigger(vo._type) || DAOServerController.getInstance().post_update_trigger_hook.has_trigger(vo._type)) {

                    let query_ = query(vo._type).filter_by_id(vo.id);
                    if (moduleTable.is_segmented && moduleTable.table_segmented_field && (vo[moduleTable.table_segmented_field.field_id] != null)) {
                        query_.filter_by_num_eq(moduleTable.table_segmented_field.field_id, moduleTable.get_segmented_field_value_from_vo(vo));
                    }
                    preUpdate = await query_.select_vo();

                    if (!preUpdate) {
                        StatsController.register_stat_COMPTEUR('dao', 'insertOrUpdateVO', 'update_autochange_to_insert');
                        // Cas d'un objet en cache server ou client mais qui n'existe plus sur la BDD => on doit insérer du coup un nouveau
                        isUpdate = false;
                        vo.id = null;
                    }
                }
            }

            let sql: string = await this.getqueryfor_insertOrUpdateVO(vo, preUpdate);
            let failed: boolean = false;

            if (!sql) {
                ConsoleHandler.warn('Est-ce bien normal ? insertOrUpdateVO :(!sql):' + JSON.stringify(vo));
                StatsController.register_stat_COMPTEUR('dao', 'insertOrUpdateVO', 'no_sql');
                resolve(null);
                return null;
            }

            let bdd_version = moduleTable.get_bdd_version(vo);
            let query_uid = this.log_db_query_perf_start('insertOrUpdateVO', 'type:' + vo._type);
            let db_result = await ModuleServiceBase.getInstance().db.oneOrNone(sql, bdd_version).catch((reason) => {
                ConsoleHandler.error('insertOrUpdateVO :' + reason);
                failed = true;
            });
            this.log_db_query_perf_end(query_uid, 'insertOrUpdateVO', 'type:' + vo._type);

            let res: InsertOrDeleteQueryResult = new InsertOrDeleteQueryResult((db_result && db_result.id) ? parseInt(db_result.id.toString()) : null);

            if (failed) {
                StatsController.register_stat_COMPTEUR('dao', 'insertOrUpdateVO', 'failed');
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

            StatsController.register_stat_COMPTEUR('dao', 'insertOrUpdateVO', 'ok');
            let time_out = Dates.now_ms();
            StatsController.register_stat_DUREE('dao', 'insertOrUpdateVO', 'ok_time', time_out - time_in);
            resolve(res);
        });
    }

    private async deleteVOs(vos: IDistantVOBase[]): Promise<InsertOrDeleteQueryResult[]> {

        let time_in = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('dao', 'deleteVOs', 'in');

        if (DAOServerController.GLOBAL_UPDATE_BLOCKER) {
            let uid: number = StackContext.get('UID');
            let CLIENT_TAB_ID: string = StackContext.get('CLIENT_TAB_ID');
            if (uid && CLIENT_TAB_ID) {
                this.throttled_refuse({ [uid]: { [CLIENT_TAB_ID]: true } });
            }
            StatsController.register_stat_COMPTEUR('dao', 'deleteVOs', 'global_update_blocker');
            return null;
        }

        // On vérifie qu'on peut faire un delete
        if ((!vos) || (!vos.length) || (!vos[0]) || (!vos[0]._type) || (!VOsTypesManager.moduleTables_by_voType[vos[0]._type])) {
            StatsController.register_stat_COMPTEUR('dao', 'deleteVOs', 'invalid_vo');
            return null;
        }
        if (!this.checkAccessSync(VOsTypesManager.moduleTables_by_voType[vos[0]._type], ModuleDAO.DAO_ACCESS_TYPE_DELETE)) {
            StatsController.register_stat_COMPTEUR('dao', 'deleteVOs', 'failed_checkAccessSync');
            return null;
        }

        // On ajoute un filtrage via hook
        let tmp_vos = [];
        for (let i in vos) {
            let vo = vos[i];
            let tmp_vo = await this.filterVOAccess(VOsTypesManager.moduleTables_by_voType[vo._type], ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, vo);

            if (!!tmp_vo) {
                tmp_vos.push(tmp_vo);
            }
        }
        if ((!tmp_vos) || (!tmp_vos.length)) {
            StatsController.register_stat_COMPTEUR('dao', 'deleteVOs', 'failed_filterVOAccess');
            return null;
        }
        vos = tmp_vos;

        let deleted_vos: IDistantVOBase[] = [];

        let query_uid = this.log_db_query_perf_start('deleteVOs');
        let results: any[] = await ModuleServiceBase.getInstance().db.tx(async (t) => {

            this.log_db_query_perf_end(query_uid, 'deleteVOs');
            let queries: any[] = [];

            for (let i in vos) {
                let vo = vos[i];

                if (!vo._type) {
                    StatsController.register_stat_COMPTEUR('dao', 'deleteVOs', 'no_vo_type');
                    ConsoleHandler.error("Un VO sans _type dans le DAO ! " + JSON.stringify(vo));
                    continue;
                }

                let moduletable: ModuleTable<any> = VOsTypesManager.moduleTables_by_voType[vo._type];

                if (!moduletable) {
                    StatsController.register_stat_COMPTEUR('dao', 'deleteVOs', 'no_moduletable');
                    ConsoleHandler.error("Impossible de trouver le datatable de ce _type ! " + JSON.stringify(vo));
                    continue;
                }

                // Ajout des triggers, avant et après suppression.
                //  Attention si un des output est false avant suppression, on annule la suppression
                let res: boolean[] = await DAOServerController.getInstance().pre_delete_trigger_hook.trigger(vo._type, vo);
                if (!BooleanHandler.getInstance().AND(res, true)) {
                    StatsController.register_stat_COMPTEUR('dao', 'deleteVOs', 'pre_delete_trigger_hook_rejection');
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
                let DEBUG_deps_types_to_delete: string = null;

                for (let dep_i in deps) {
                    let dep = deps[dep_i];

                    if (!dep.is_cascade) {
                        continue;
                    }
                    let depVO = await query(dep.linked_type).filter_by_id(dep.linked_id).select_vo();
                    deps_to_delete.push(await query(dep.linked_type).filter_by_id(dep.linked_id).select_vo());
                    if (!DEBUG_deps_types_to_delete) {
                        DEBUG_deps_types_to_delete = depVO._type;
                    } else {
                        DEBUG_deps_types_to_delete += ', ' + depVO._type;
                    }
                }

                if (deps_to_delete && deps_to_delete.length) {
                    let dep_ires: InsertOrDeleteQueryResult[] = await ModuleDAO.getInstance().deleteVOs(deps_to_delete);

                    if ((!dep_ires) || (dep_ires.length != deps_to_delete.length)) {
                        ConsoleHandler.error('FAILED DELETE DEPS :' + vo._type + ':' + vo.id + ':ABORT DELETION: DEPS_TYPES:' + DEBUG_deps_types_to_delete);
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
                if (ConfigurationService.node_configuration.DEBUG_DELETEVOS) {
                    ConsoleHandler.log('DELETEVOS:oneOrNone:' + sql + ':' + JSON.stringify(vo));
                }

                deleted_vos.push(vo);
                queries.push(t.oneOrNone(sql, vo)/*posttrigger pas si simple : .then(async (data) => {
                    await this.post_delete_trigger_hook.trigger(vo._type, vo);
                })*/);
            }

            return t.batch(queries);
        }).then(async (value: any) => {

            this.log_db_query_perf_end(query_uid, 'deleteVOs');

            for (let i in deleted_vos) {
                let deleted_vo = deleted_vos[i];
                if (ConfigurationService.node_configuration.DEBUG_DELETEVOS) {
                    ConsoleHandler.log('DELETEVOS:post_delete_trigger_hook:deleted_vo:' + JSON.stringify(deleted_vo));
                }

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

        let time_out = Dates.now_ms();
        StatsController.register_stat_DUREE('dao', 'deleteVOs', 'time', time_out - time_in);
        StatsController.register_stat_COMPTEUR('dao', 'deleteVOs', 'out');
        return InsertOrDeleteQueryResults;
    }

    private async deleteVOsByIds(API_TYPE_ID: string, ids: number[]): Promise<any[]> {

        if (DAOServerController.GLOBAL_UPDATE_BLOCKER) {
            let uid: number = StackContext.get('UID');
            let CLIENT_TAB_ID: string = StackContext.get('CLIENT_TAB_ID');
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
        let vos: IDistantVOBase[] = await query(API_TYPE_ID).filter_by_ids(ids).select_vos();

        // On ajoute un filtrage via hook
        let tmp_vos = [];
        for (let i in vos) {
            let vo = vos[i];
            let tmp_vo = await this.filterVOAccess(VOsTypesManager.moduleTables_by_voType[vo._type], ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, vo);

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

    /**
     * @depracated do not use anymore, use context queries instead - will be deleted soon
     */
    private async filterVOAccess<T extends IDistantVOBase>(datatable: ModuleTable<T>, access_type: string, vo: T): Promise<T> {

        if (!ModuleAccessPolicy.getInstance().actif) {
            return vo;
        }

        // Suivant le type de contenu et le type d'accès, on peut avoir un hook enregistré sur le ModuleDAO pour filtrer les vos
        let hooks = DAOServerController.getInstance().access_hooks[datatable.vo_type] && DAOServerController.getInstance().access_hooks[datatable.vo_type][access_type] ? DAOServerController.getInstance().access_hooks[datatable.vo_type][access_type] : [];
        if (!StackContext.get('IS_CLIENT')) {
            // Server
            return vo;
        }

        for (let i in hooks) {
            let hook = hooks[i];

            let uid: number = StackContext.get('UID');
            let filtered: T[] = await hook(datatable, (((typeof vo != 'undefined') && (vo != null)) ? [vo] : null), uid, null) as T[];

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

    /**
     * @deprecated use context queries - will be deleted soon
     * @param API_TYPE_ID
     * @param id
     * @param segmentation_ranges
     * @returns
     */
    private async getVoById<T extends IDistantVOBase>(
        API_TYPE_ID: string,
        id: number,
        segmentation_ranges: IRange[] = null
    ): Promise<T> {

        let moduleTable: ModuleTable<T> = VOsTypesManager.moduleTables_by_voType[API_TYPE_ID];

        // On vérifie qu'on peut faire a minima un listage
        if (!this.checkAccessSync(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_LIST_LABELS)) {
            ConsoleHandler.warn('getVoById:checkAccessSync:!DAO_ACCESS_TYPE_LIST_LABELS');
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
                RangeHandler.foreach_ranges_sync(segmentation_ranges, (segmented_value) => {

                    if (!self.has_segmented_known_database(moduleTable, segmented_value)) {
                        return;
                    }

                    let table_name = moduleTable.get_segmented_name(segmented_value);
                    segmentations[table_name] = segmented_value;
                });
            } else {
                segmentations = DAOServerController.segmented_known_databases[moduleTable.database];
            }

            let fields_select: string = 't.id';
            let fields = moduleTable.get_fields();
            for (let i in fields) {
                let field = fields[i];

                fields_select += ',t.' + field.field_id;
            }

            for (let segmentation_table in segmentations) {

                if (!request) {
                    request = '';
                } else {
                    request += ' UNION ALL ';
                }
                request += 'select ' + fields_select + ' from ' + moduleTable.database + '.' + segmentation_table + ' t where id = ' + id + ' ';
            }

            /**
             * Attention en cas de segmentation on peut très bien ne pas avoir de table du tout ! Donc la requête plante complètement et ça veut juste dire 0 résultats
             */
            vo = null;
            try {
                let query_uid = this.log_db_query_perf_start('getVoById', request, 'is_segmented');
                vo = request ? await ModuleServiceBase.getInstance().db.oneOrNone(request + ';') as T : null;
                this.log_db_query_perf_end(query_uid, 'getVoById', request, 'is_segmented');
            } catch (error) {
            }

        } else {
            let query_uid = this.log_db_query_perf_start('getVoById', "SELECT t.* FROM " + moduleTable.full_name + " t WHERE id=" + id, '!is_segmented');
            vo = await ModuleServiceBase.getInstance().db.oneOrNone("SELECT t.* FROM " + moduleTable.full_name + " t WHERE id=" + id + ";") as T;
            this.log_db_query_perf_end(query_uid, 'getVoById', "SELECT t.* FROM " + moduleTable.full_name + " t WHERE id=" + id, '!is_segmented');
        }

        if (!!vo) {
            vo['_type'] = moduleTable.vo_type;
            vo = moduleTable.forceNumeric(vo);
        }

        if (!vo) {
            return vo;
        }

        // On filtre suivant les droits d'accès
        vo = await this.filterVOAccess(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ, vo);

        if (!vo) {
            return null;
        }

        let uid = await StackContext.get('UID');
        if (uid) {
            await ServerAnonymizationController.getInstance().anonymise(moduleTable, [vo], uid, null);
        }

        return vo;
    }

    private async getBaseUrl(): Promise<string> {
        return ConfigurationService.node_configuration.BASE_URL;
    }

    /**
     * @deprecated use context queries - will be deleted soon [use await query(T.API_TYPE_ID).filter_by_num_eq('field_name', ids).select_vos<T>() instead]
     */
    private async getVosByRefFieldIds<T extends IDistantVOBase>(API_TYPE_ID: string, field_name: string, ids: number[]): Promise<T[]> {

        let moduleTable: ModuleTable<T> = VOsTypesManager.moduleTables_by_voType[API_TYPE_ID];

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

                    numrange_ids.push(RangeHandler.create_single_elt_NumRange(id, NumSegment.TYPE_INT));
                }

                let where_clause: string = '';

                for (let j in numrange_ids) {
                    let field_range: NumRange = numrange_ids[j];

                    where_clause += (where_clause == '') ? "" : " OR ";

                    where_clause += this.getClauseWhereRangeIntersectsField(field.field_type, field.field_id, field_range);
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

                    let query_uid = this.log_db_query_perf_start('getVosByRefFieldIds', "SELECT t.* FROM " + moduleTable.get_segmented_full_name(id), 'is_segmented && isrefchampssegment');
                    let tmp_vos = await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + moduleTable.get_segmented_full_name(id) + request) as T[];
                    for (let j in tmp_vos) {
                        let data = tmp_vos[j];
                        data._type = moduleTable.vo_type;
                    }
                    tmp_vos = moduleTable.forceNumerics(tmp_vos);
                    this.log_db_query_perf_end(query_uid, 'getVosByRefFieldIds', "SELECT t.* FROM " + moduleTable.get_segmented_full_name(id), 'is_segmented && isrefchampssegment');

                    if ((!!tmp_vos) && (tmp_vos.length)) {
                        vos = vos.concat(tmp_vos);
                    }
                }
            } else {
                // si on cherche sur un autre champs, ça revient à faire la requete sur chaque segment
                let segments: { [table_name: string]: number } = DAOServerController.segmented_known_databases[moduleTable.database];
                for (let i in segments) {
                    let segment: number = segments[i];

                    if (!segment) {
                        continue;
                    }

                    let query_uid = this.log_db_query_perf_start('getVosByRefFieldIds', "SELECT t.* FROM " + moduleTable.get_segmented_full_name(segment), 'is_segmented && !isrefchampssegment');

                    let tmp_vos = await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + moduleTable.get_segmented_full_name(segment) + request) as T[];
                    for (let j in tmp_vos) {
                        let data = tmp_vos[j];
                        data._type = moduleTable.vo_type;
                    }
                    tmp_vos = moduleTable.forceNumerics(tmp_vos);
                    this.log_db_query_perf_end(query_uid, 'getVosByRefFieldIds', "SELECT t.* FROM " + moduleTable.get_segmented_full_name(segment), 'is_segmented && !isrefchampssegment');

                    if ((!!tmp_vos) && (tmp_vos.length)) {
                        vos = vos.concat(tmp_vos);
                    }
                }
            }
        } else {
            let query_uid = this.log_db_query_perf_start('getVosByRefFieldIds', "SELECT t.* FROM " + moduleTable.full_name, '!is_segmented');

            vos = await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + moduleTable.full_name + request) as T[];
            for (let j in vos) {
                let data = vos[j];
                data._type = moduleTable.vo_type;
            }
            vos = moduleTable.forceNumerics(vos);
            this.log_db_query_perf_end(query_uid, 'getVosByRefFieldIds', "SELECT t.* FROM " + moduleTable.full_name, '!is_segmented');
        }

        // On filtre suivant les droits d'accès
        let res = await this.filterVOsAccess(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);

        if (!res) {
            return null;
        }

        let uid = await StackContext.get('UID');
        if (uid) {
            await ServerAnonymizationController.getInstance().anonymise(moduleTable, res, uid, null);
        }

        return res;
    }

    /**
     * @depracated use contextqueries
     */
    private async getVosByRefFieldsIds<T extends IDistantVOBase>(
        API_TYPE_ID: string,
        field_name1: string,
        ids1: number[],
        field_name2: string,
        ids2: number[],
        field_name3: string,
        ids3: number[]): Promise<T[]> {

        let moduleTable: ModuleTable<T> = VOsTypesManager.moduleTables_by_voType[API_TYPE_ID];

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

        let query_uid = this.log_db_query_perf_start('getVosByRefFieldsIds', request);
        let vos: T[] = await ModuleServiceBase.getInstance().db.query(request + ";") as T[];
        for (let j in vos) {
            let data = vos[j];
            data._type = moduleTable.vo_type;
        }
        vos = moduleTable.forceNumerics(vos);
        this.log_db_query_perf_end(query_uid, 'getVosByRefFieldsIds', request);

        // On filtre suivant les droits d'accès
        let res = await this.filterVOsAccess(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);

        if (!res) {
            return null;
        }

        let uid = await StackContext.get('UID');
        if (uid) {
            await ServerAnonymizationController.getInstance().anonymise(moduleTable, res, uid, null);
        }

        return res;
    }

    /**
     * @deprecated use context queries - will be deleted soon
     */
    private async getVosByRefFieldsIdsAndFieldsString<T extends IDistantVOBase>(
        API_TYPE_ID: string,
        field_name1: string,
        ids1: number[],
        field_name2: string = null,
        values2: string[] = null,
        field_name3: string = null,
        values3: string[] = null,
        segmentation_ranges: IRange[] = null
    ): Promise<T[]> {

        let moduleTable: ModuleTable<T> = VOsTypesManager.moduleTables_by_voType[API_TYPE_ID];

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
            await RangeHandler.foreach_ranges(segmentation_ranges, async (segmentation: number) => {
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

    /**
     * @deprecated use context queries - will be deleted soon
     */
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

        let query_uid = this.log_db_query_perf_start('get_request_for_getVosByRefFieldsIdsAndFieldsString', request);
        let vos: T[] = await ModuleServiceBase.getInstance().db.query(request + ";", request_params) as T[];
        for (let j in vos) {
            let data = vos[j];
            data._type = moduleTable.vo_type;
        }
        vos = moduleTable.forceNumerics(vos);
        this.log_db_query_perf_end(query_uid, 'get_request_for_getVosByRefFieldsIdsAndFieldsString', request);

        // On filtre suivant les droits d'accès
        let res = await this.filterVOsAccess(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);

        if (!res) {
            return null;
        }

        let uid = await StackContext.get('UID');
        if (uid) {
            await ServerAnonymizationController.getInstance().anonymise(moduleTable, res, uid, null);
        }

        return res;
    }

    /**
     * @deprecated use context queries - will be deleted soon
     */
    private async getVosByIds<T extends IDistantVOBase>(API_TYPE_ID: string, ids: number[]): Promise<T[]> {

        if ((!ids) || (!ids.length)) {
            return null;
        }

        let moduleTable: ModuleTable<T> = VOsTypesManager.moduleTables_by_voType[API_TYPE_ID];

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

            let segmentations: { [table_name: string]: number } = DAOServerController.segmented_known_databases[moduleTable.database];
            let request = null;

            let fields_select: string = 't.id';
            let fields = moduleTable.get_fields();
            for (let i in fields) {
                let field = fields[i];

                fields_select += ',t.' + field.field_id;
            }

            for (let segmentation_table in segmentations) {

                if (!request) {
                    request = '';
                } else {
                    request += ' UNION ALL ';
                }
                request += 'select ' + fields_select + ' from ' + moduleTable.database + '.' + segmentation_table + ' t WHERE id in (' + ids + ') ';
            }

            /**
             * Attention en cas de segmentation on peut très bien ne pas avoir de table du tout ! Donc la requête plante complètement et ça veut juste dire 0 résultats
             */
            vos = null;
            try {
                let query_uid = this.log_db_query_perf_start('getVosByIds', request, 'is_segmented');
                vos = request ? await ModuleServiceBase.getInstance().db.query(request + ';') as T[] : null;
                this.log_db_query_perf_end(query_uid, 'getVosByIds', request, 'is_segmented');
            } catch (error) {
            }

        } else {
            let query_uid = this.log_db_query_perf_start('getVosByIds', "SELECT t.* FROM " + moduleTable.full_name + " t WHERE id in (" + ids + ")", '!is_segmented');
            vos = await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + moduleTable.full_name + " t WHERE id in (" + ids + ");") as T[];
            this.log_db_query_perf_end(query_uid, 'getVosByIds', "SELECT t.* FROM " + moduleTable.full_name + " t WHERE id in (" + ids + ")", '!is_segmented');
        }

        for (let j in vos) {
            let data = vos[j];
            data._type = moduleTable.vo_type;
        }
        vos = moduleTable.forceNumerics(vos);

        // On filtre suivant les droits d'accès
        let res = await this.filterVOsAccess(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);

        if (!res) {
            return null;
        }

        let uid = await StackContext.get('UID');
        if (uid) {
            await ServerAnonymizationController.getInstance().anonymise(moduleTable, res, uid, null);
        }

        return res;
    }

    /**
     * @deprecated use context queries - will be deleted soon
     */
    private async getVosByIdsRanges<T extends IDistantVOBase>(API_TYPE_ID: string, ranges: NumRange[]): Promise<T[]> {

        if ((!ranges) || (!ranges.length)) {
            return null;
        }

        let moduleTable: ModuleTable<T> = VOsTypesManager.moduleTables_by_voType[API_TYPE_ID];

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

            if ((!range) || (range.max == null) || (range.min == null)) {
                continue;
            }

            where_clause += (where_clause == "") ? "" : " OR ";

            where_clause += "id::numeric <@ '" + (range.min_inclusiv ? "[" : "(") + range.min + "," + range.max + (range.max_inclusiv ? "]" : ")") + "'::numrange";
        }

        if (where_clause == "") {
            return null;
        }

        let query_uid = this.log_db_query_perf_start('getVosByIdsRanges', "SELECT t.* FROM " + moduleTable.full_name + " t WHERE " + where_clause + ";");
        let vos: T[] = await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + moduleTable.full_name + " t WHERE " + where_clause + ";") as T[];
        for (let j in vos) {
            let data = vos[j];
            data._type = moduleTable.vo_type;
        }
        vos = moduleTable.forceNumerics(vos);
        this.log_db_query_perf_end(query_uid, 'getVosByIdsRanges', "SELECT t.* FROM " + moduleTable.full_name + " t WHERE " + where_clause + ";");

        // On filtre suivant les droits d'accès
        let res = await this.filterVOsAccess(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);

        if (!res) {
            return null;
        }

        let uid = await StackContext.get('UID');
        if (uid) {
            await ServerAnonymizationController.getInstance().anonymise(moduleTable, res, uid, null);
        }

        return res;
    }

    /**
     * ATTENTION on est admin sur cette partie le but est de vérifier que les liens sont cohérents et existent en bdd
     */
    private async countVosByIdsRanges<T extends IDistantVOBase>(API_TYPE_ID: string, ranges: NumRange[]): Promise<number> {

        if ((!ranges) || (!ranges.length)) {
            return 0;
        }

        let moduleTable: ModuleTable<T> = VOsTypesManager.moduleTables_by_voType[API_TYPE_ID];

        if (moduleTable.is_segmented) {
            StatsController.register_stat_COMPTEUR('ModuleDAOServer', 'countVosByIdsRanges', 'segmented');
            // En vrai maintenant c'est géré ... c'est juste pas efficace du tout... et on a pas envie de le faire quoi
            // throw new Error('Not Implemented');
        }

        return await query(API_TYPE_ID).filter_by_ids(ranges).exec_as_admin().select_count();
    }

    /**
     * @deprecated use context queries - will be deleted soon
     */
    private async getVos<T extends IDistantVOBase>(text: string, limit: number = 0, offset: number = 0): Promise<T[]> {

        // On filtre les res suivant les droits d'accès
        return await query(text).set_limit(limit, offset).select_vos<T>();
    }

    /**
     * @deprecated use context queries - will be deleted soon
     */
    private async getNamedVoByName<U extends INamedVO>(API_TYPE_ID: string, name: string): Promise<U> {

        return await query(API_TYPE_ID).filter_by_text_eq('name', name, API_TYPE_ID, true).select_vo<U>();
    }


    /**
     * @deprecated use context queries - will be deleted soon
     */
    private async getVarImportsByMatroidParams<T extends IDistantVOBase>(
        api_type_id: string,
        matroids: IMatroid[],
        fields_ids_mapper: { [matroid_field_id: string]: string } = null
    ): Promise<T[]> {

        if ((!matroids) || (!matroids.length)) {
            return null;
        }

        let datatable: ModuleTable<T> = VOsTypesManager.moduleTables_by_voType[api_type_id];

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
                ConsoleHandler.error('Matroid vide:' + api_type_id + ':' + (matroid ? matroid._type : null) + ':');
                return null;
            }

            let tmp = await this.getVarImportsByMatroidParam<T>(api_type_id, matroid, fields_ids_mapper);

            if ((!!tmp) && (tmp.length)) {
                vos = vos.concat(tmp);
            }
        }

        // On filtre suivant les droits d'accès
        let res = await this.filterVOsAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);

        if (!res) {
            return null;
        }

        let uid = await StackContext.get('UID');
        if (uid) {
            await ServerAnonymizationController.getInstance().anonymise(datatable, res, uid, null);
        }

        return res;
    }

    /**
     * @deprecated use context queries - will be deleted soon
     */
    private async filterVosByMatroids<T extends IDistantVOBase>(
        api_type_id: string,
        matroids: IMatroid[],
        fields_ids_mapper: { [matroid_field_id: string]: string } = null
    ): Promise<T[]> {

        if ((!matroids) || (!matroids.length)) {
            return null;
        }

        let datatable: ModuleTable<T> = VOsTypesManager.moduleTables_by_voType[api_type_id];

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
                ConsoleHandler.error('Matroid vide:' + api_type_id + ':' + (matroid ? matroid._type : null) + ':');
                return null;
            }

            let tmp = await this.filterVosByMatroid<T>(api_type_id, matroid, fields_ids_mapper);

            if ((!!tmp) && (tmp.length)) {
                vos = vos.concat(tmp);
            }
        }

        // On filtre suivant les droits d'accès
        let res = await this.filterVOsAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);

        if (!res) {
            return null;
        }

        let uid = await StackContext.get('UID');
        if (uid) {
            await ServerAnonymizationController.getInstance().anonymise(datatable, res, uid, null);
        }

        return res;
    }

    /**
     * @deprecated use context queries - will be deleted soon
     */
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

        let moduleTable: ModuleTable<T> = VOsTypesManager.moduleTables_by_voType[api_type_id];

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

            let segmentations: IRange[] = [];
            if ((!segmented_matroid_filed_id) || (!matroid[segmented_matroid_filed_id]) || (!matroid[segmented_matroid_filed_id].length)) {
                ConsoleHandler.log('filterVosByMatroid sur table segmentée - ' + moduleTable.full_name + ' - sans info de segment sur le matroid');
                segmentations_tables = DAOServerController.segmented_known_databases[moduleTable.database];
            } else {
                segmentations = matroid[segmented_matroid_filed_id];

                // Si c'est un matroid on devrait avoir un cas simple de ranges directement mais on pourrait adapter à tous les types de field matroid
                // let matroid_moduleTable: ModuleTable<T> = VOsTypesManager.moduleTables_by_voType[matroid._type];
                // let matroid_field = matroid_moduleTable.getFieldFromId(segmented_matroid_filed_id);

                // switch (matroid_field.field_type) {
                // }

                let self = this;
                RangeHandler.foreach_ranges_sync(segmentations, (segmented_value) => {

                    if (!self.has_segmented_known_database(moduleTable, segmented_value)) {
                        return;
                    }

                    let table_name = moduleTable.get_segmented_name(segmented_value);
                    segmentations_tables[table_name] = segmented_value;
                });
            }

            let fields_select: string = 't.id';
            let fields = moduleTable.get_fields();
            for (let i in fields) {
                let field = fields[i];

                fields_select += ',t.' + field.field_id;
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

                request += 'select ' + fields_select + ' from ' + db_full_name + ' t where ' + filter_by_matroid_clause + (additional_condition ? additional_condition : '');
            }

            if (!request) {
                return null;
            }

            let query_uid = this.log_db_query_perf_start('getDAOsByMatroid', request, 'is_segmented');
            let vos = await ModuleServiceBase.getInstance().db.query(request + ';') as T[];
            this.log_db_query_perf_end(query_uid, 'getDAOsByMatroid', request, 'is_segmented');

            for (let j in vos) {
                let data = vos[j];
                data._type = moduleTable.vo_type;
            }

            return moduleTable.forceNumerics(vos);
        } else {
            let filter_by_matroid_clause: string = this.getWhereClauseForFilterByMatroid(api_type_id, matroid, fields_ids_mapper, 't', moduleTable.full_name);

            if (!filter_by_matroid_clause) {
                return null;
            }

            let res = null;
            let query_uid = this.log_db_query_perf_start('getDAOsByMatroid', "SELECT t.* FROM " + moduleTable.full_name + " t WHERE " + filter_by_matroid_clause, '!is_segmented');
            res = await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + moduleTable.full_name + " t WHERE " + filter_by_matroid_clause + (additional_condition ? additional_condition : '') + ';') as T[];
            for (let j in res) {
                let data = res[j];
                data._type = moduleTable.vo_type;
            }
            res = moduleTable.forceNumerics(res);
            this.log_db_query_perf_end(query_uid, 'getDAOsByMatroid', "SELECT t.* FROM " + moduleTable.full_name + " t WHERE " + filter_by_matroid_clause, '!is_segmented');

            return res;
        }
    }

    private async getVarImportsByMatroidParam<T extends IDistantVOBase>(api_type_id: string, matroid: IMatroid, fields_ids_mapper: { [matroid_field_id: string]: string }): Promise<T[]> {
        return await query(api_type_id)
            .filter_by_matroids_inclusion([matroid], true, api_type_id, fields_ids_mapper)
            .filter_by_num_eq('value_type', VarDataBaseVO.VALUE_TYPE_IMPORT)
            .select_vos<T>();
    }

    private async filterVosByMatroid<T extends IDistantVOBase>(api_type_id: string, matroid: IMatroid, fields_ids_mapper: { [matroid_field_id: string]: string }): Promise<T[]> {
        return await query(api_type_id)
            .filter_by_matroids_inclusion([matroid], true, api_type_id, fields_ids_mapper)
            .select_vos<T>();
    }

    private get_matroid_fields_ranges_by_datatable_field_id(matroid: IMatroid, moduleTable: ModuleTable<any>, fields_ids_mapper: { [matroid_field_id: string]: string }): { [field_id: string]: IRange[] } {

        let matroid_fields = MatroidController.getInstance().getMatroidFields(matroid._type);
        let matroid_fields_ranges_by_datatable_field_id: { [field_id: string]: IRange[] } = {};
        for (let i in matroid_fields) {
            let matroid_field = matroid_fields[i];
            let ranges: IRange[] = matroid[matroid_field.field_id];
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
                ConsoleHandler.error('get_matroid_fields_ranges_by_datatable_field_id :: Matroid field vide ou inexistant:' + moduleTable.vo_type + ':' + matroid_fields[i].field_id + ':');
                return null;
            }

            // FIXME TODO : est-ce qu'on est obligé de faire une copie à chaque fois ???
            matroid_fields_ranges_by_datatable_field_id[field.field_id] = RangeHandler.cloneArrayFrom(ranges);
        }

        return matroid_fields_ranges_by_datatable_field_id;
    }

    /**
     * @deprecated use context queries - will be deleted soon
     */
    private async filterVosByMatroidsIntersections<T extends IDistantVOBase>(
        api_type_id: string,
        matroids: IMatroid[],
        fields_ids_mapper: { [matroid_field_id: string]: string } = null
    ): Promise<T[]> {

        if ((!matroids) || (!matroids.length)) {
            return null;
        }

        let moduleTable: ModuleTable<T> = VOsTypesManager.moduleTables_by_voType[api_type_id];

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

                let segmentations: IRange[] = matroid[segmented_matroid_field_id];

                // Si c'est un matroid on devrait avoir un cas simple de ranges directement mais on pourrait adapter à tous les types de field matroid
                // let matroid_moduleTable: ModuleTable<T> = VOsTypesManager.moduleTables_by_voType[matroid._type];
                // let matroid_field = matroid_moduleTable.getFieldFromId(segmented_matroid_filed_id);

                // switch (matroid_field.field_type) {
                // }

                if (segmentations && segmentations.length) {

                    let self = this;
                    RangeHandler.foreach_ranges_sync(segmentations, (segmented_value) => {

                        if (!self.has_segmented_known_database(moduleTable, segmented_value)) {
                            return;
                        }
                        let table_name = moduleTable.get_segmented_name(segmented_value);
                        segmentations_tables[table_name] = segmented_value;
                    });
                } else {
                    segmentations_tables = DAOServerController.segmented_known_databases[moduleTable.database];
                }

                let fields_select: string = 't.id';
                let fields = moduleTable.get_fields();
                for (let j in fields) {
                    let field = fields[j];

                    fields_select += ',t.' + field.field_id;
                }

                for (let segmentation_table in segmentations_tables) {

                    if (!request) {
                        request = '';
                    } else {
                        request += ' UNION ALL ';
                    }
                    let clause = this.getWhereClauseForFilterByMatroidIntersection(api_type_id, matroid, fields_ids_mapper);
                    if (!clause) {
                        ConsoleHandler.error('filterVosByMatroidsIntersections:Where clause invalid :api_type_id:' + api_type_id);
                        ConsoleHandler.error('filterVosByMatroidsIntersections:Where clause invalid :matroid:' + (matroid ? JSON.stringify(matroid) : matroid));
                        ConsoleHandler.error('filterVosByMatroidsIntersections:Where clause invalid :api_type_id:' + (fields_ids_mapper ? JSON.stringify(fields_ids_mapper) : fields_ids_mapper));
                        throw new Error('Where clause invalid');
                    }
                    request += 'select ' + fields_select + ' from ' + moduleTable.database + '.' + segmentation_table + ' t where ' + clause + ' ';
                }

                /**
                 * Attention en cas de segmentation on peut très bien ne pas avoir de table du tout ! Donc la requête plante complètement et ça veut juste dire 0 résultats
                 */
                let tmp_vos = null;
                try {
                    let query_uid = this.log_db_query_perf_start('filterVosByMatroidsIntersections', request, 'is_segmented +forceNumerics');
                    tmp_vos = request ? await ModuleServiceBase.getInstance().db.query(request + ';') as T[] : null;
                    for (let j in tmp_vos) {
                        let data = tmp_vos[j];
                        data._type = moduleTable.vo_type;
                    }
                    tmp_vos = tmp_vos ? moduleTable.forceNumerics(tmp_vos) : null;
                    this.log_db_query_perf_end(query_uid, 'filterVosByMatroidsIntersections', request, 'is_segmented +forceNumerics');
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
                    ConsoleHandler.error('filterVosByMatroidsIntersections:Where clause invalid :matroid null:' + JSON.stringify(matroids));
                    continue;
                }
                let clause = this.getWhereClauseForFilterByMatroidIntersection(api_type_id, matroids[i], fields_ids_mapper);
                if (!clause) {
                    ConsoleHandler.error('filterVosByMatroidsIntersections:Where clause invalid :api_type_id:' + api_type_id);
                    ConsoleHandler.error('filterVosByMatroidsIntersections:Where clause invalid :matroid:' + (matroids[i] ? JSON.stringify(matroids[i]) : matroids[i]));
                    ConsoleHandler.error('filterVosByMatroidsIntersections:Where clause invalid :api_type_id:' + (fields_ids_mapper ? JSON.stringify(fields_ids_mapper) : fields_ids_mapper));
                    throw new Error('Where clause invalid');
                }
                where_clauses.push(clause);
            }

            let query_uid = this.log_db_query_perf_start('filterVosByMatroidsIntersections', "SELECT t.* FROM " + moduleTable.full_name + " t WHERE " + '(' + where_clauses.join(') OR (') + ')' + ";", '!is_segmented +forceNumerics');
            vos = await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + moduleTable.full_name + " t WHERE " + '(' + where_clauses.join(') OR (') + ')' + ";") as T[];
            for (let j in vos) {
                let data = vos[j];
                data._type = moduleTable.vo_type;
            }
            vos = moduleTable.forceNumerics(vos);
            this.log_db_query_perf_end(query_uid, 'filterVosByMatroidsIntersections', "SELECT t.* FROM " + moduleTable.full_name + " t WHERE " + '(' + where_clauses.join(') OR (') + ')' + ";", '!is_segmented +forceNumerics');
        }

        // On filtre suivant les droits d'accès
        let res = await this.filterVOsAccess(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);

        if (!res) {
            return null;
        }

        let uid = await StackContext.get('UID');
        if (uid) {
            await ServerAnonymizationController.getInstance().anonymise(moduleTable, res, uid, null);
        }

        return res;
    }

    /**
     * @deprecated use context queries - will be deleted soon
     */
    private async getVosByExactMatroid<T extends IDistantVOBase>(
        api_type_id: string,
        matroids: IMatroid[],
        fields_ids_mapper: { [matroid_field_id: string]: string } = null
    ): Promise<T[]> {

        if ((!matroids) || (!matroids.length)) {
            return null;
        }

        let moduleTable: ModuleTable<T> = VOsTypesManager.moduleTables_by_voType[api_type_id];

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
                    ConsoleHandler.error('Matroid vide:' + api_type_id + ':' + (matroid ? matroid._type : null) + ':');
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
                    ConsoleHandler.error('Matroid vide:' + api_type_id + ':' + (matroid ? matroid._type : null) + ':');
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
                    let ranges: IRange[] = matroid[matroid_field.field_id];
                    let field = moduleTable.getFieldFromId((fields_ids_mapper && fields_ids_mapper[matroid_field.field_id]) ? fields_ids_mapper[matroid_field.field_id] : matroid_field.field_id);

                    if (!field) {
                        continue;
                    }

                    if (moduleTable.is_segmented && (field.field_id == moduleTable.table_segmented_field.field_id)) {
                        continue;
                    }

                    if ((!ranges) || (!ranges.length)) {
                        ConsoleHandler.error('getVosByExactMatroid :: Matroid field vide ou inexistant:' + api_type_id + ':' + matroid_fields[i].field_id + ':');
                        return null;
                    }

                    where_clause += first ? "(" : ") AND (";

                    let ranges_clause = null;

                    switch (field.field_type) {

                        case ModuleTableField.FIELD_TYPE_numrange_array:
                        case ModuleTableField.FIELD_TYPE_refrange_array:
                        case ModuleTableField.FIELD_TYPE_isoweekdays:
                        case ModuleTableField.FIELD_TYPE_tstzrange_array:
                            ranges_clause = "'" + MatroidIndexHandler.get_normalized_ranges(ranges) + "'";
                            break;

                        default:
                            ConsoleHandler.error('cannot getVosByExactFieldRanges with non range array fields');
                            return null;
                    }

                    where_clause += ranges_clause + " = " + field.field_id + '_ndx';
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

                let segmentations: IRange[] = matroid[segmented_matroid_field_id];

                // Si c'est un matroid on devrait avoir un cas simple de ranges directement mais on pourrait adapter à tous les types de field matroid
                // let matroid_moduleTable: ModuleTable<T> = VOsTypesManager.moduleTables_by_voType[matroid._type];
                // let matroid_field = matroid_moduleTable.getFieldFromId(segmented_matroid_filed_id);

                // switch (matroid_field.field_type) {
                // }

                if (segmentations && segmentations.length) {

                    let self = this;
                    RangeHandler.foreach_ranges_sync(segmentations, (segmented_value) => {

                        if (!self.has_segmented_known_database(moduleTable, segmented_value)) {
                            return;
                        }

                        let table_name = moduleTable.get_segmented_name(segmented_value);
                        segmentations_tables[table_name] = segmented_value;
                    });
                } else {
                    throw new Error('Not Implemented');
                }

                let fields_select: string = 't.id';
                let fields = moduleTable.get_fields();
                for (let j in fields) {
                    let field = fields[j];

                    fields_select += ',t.' + field.field_id;
                }

                for (let segmentation_table in segmentations_tables) {

                    if (!request) {
                        request = '';
                    } else {
                        request += ' UNION ALL ';
                    }
                    request += 'select ' + fields_select + ' from ' + moduleTable.database + '.' + segmentation_table + ' t where ' + where_clause + ' ';
                }

                /**
                 * Attention en cas de segmentation on peut très bien ne pas avoir de table du tout ! Donc la requête plante complètement et ça veut juste dire 0 résultats
                 */
                let tmp_vos = null;
                try {
                    let query_uid = this.log_db_query_perf_start('getVosByExactMatroid', request, 'is_segmented +forceNumerics');
                    tmp_vos = request ? await ModuleServiceBase.getInstance().db.query(request + ';') as T[] : null;
                    for (let j in tmp_vos) {
                        let data = tmp_vos[j];
                        data._type = moduleTable.vo_type;
                    }
                    tmp_vos = tmp_vos ? moduleTable.forceNumerics(tmp_vos) : null;
                    this.log_db_query_perf_end(query_uid, 'getVosByExactMatroid', request, 'is_segmented +forceNumerics');
                } catch (error) {
                }

                for (let k in tmp_vos) {
                    let tmp_vo = tmp_vos[k];

                    vos_by_ids[tmp_vo.id] = tmp_vo;
                }
            }

            vos = Object.values(vos_by_ids);
        } else {
            let query_uid = this.log_db_query_perf_start('getVosByExactMatroid', "SELECT t.* FROM " + moduleTable.full_name + " t WHERE " + '(' + where_clauses.join(') OR (') + ')' + ";", '!is_segmented +forceNumerics');
            vos = await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + moduleTable.full_name + " t WHERE " + '(' + where_clauses.join(') OR (') + ')' + ";") as T[];
            for (let j in vos) {
                let data = vos[j];
                data._type = moduleTable.vo_type;
            }
            vos = moduleTable.forceNumerics(vos);
            this.log_db_query_perf_end(query_uid, 'getVosByExactMatroid', "SELECT t.* FROM " + moduleTable.full_name + " t WHERE " + '(' + where_clauses.join(') OR (') + ')' + ";", '!is_segmented +forceNumerics');
        }

        // On filtre suivant les droits d'accès
        let res = await this.filterVOsAccess(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);

        if (!res) {
            return null;
        }

        let uid = await StackContext.get('UID');
        if (uid) {
            await ServerAnonymizationController.getInstance().anonymise(moduleTable, res, uid, null);
        }

        return res;
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
            case ModuleTableField.FIELD_TYPE_decimal_full_precision:
            case ModuleTableField.FIELD_TYPE_foreign_key:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
            case ModuleTableField.FIELD_TYPE_image_ref:
            case ModuleTableField.FIELD_TYPE_int:
            case ModuleTableField.FIELD_TYPE_prct:
                return table_name + '.' + field.field_id + " = " + value;

            case ModuleTableField.FIELD_TYPE_tstz:
                return table_name + '.' + field.field_id + " = " + value;

            case ModuleTableField.FIELD_TYPE_tstz_array:
                throw new Error('Not implemented');

            case ModuleTableField.FIELD_TYPE_date:
            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_month:
                throw new Error('Not implemented');

            case ModuleTableField.FIELD_TYPE_timewithouttimezone: // TODO FIXME
                throw new Error('Not implemented');

            case ModuleTableField.FIELD_TYPE_geopoint:
                throw new Error('Not implemented');

            case ModuleTableField.FIELD_TYPE_tsrange:
            case ModuleTableField.FIELD_TYPE_numrange:
            case ModuleTableField.FIELD_TYPE_daterange: // TODO FIXME
            case ModuleTableField.FIELD_TYPE_hourrange:
                throw new Error('Not implemented');

            case ModuleTableField.FIELD_TYPE_float_array:
            case ModuleTableField.FIELD_TYPE_int_array:
            case ModuleTableField.FIELD_TYPE_isoweekdays:
                throw new Error('Not implemented');

            case ModuleTableField.FIELD_TYPE_refrange_array:
            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_tstzrange_array:
            case ModuleTableField.FIELD_TYPE_hourrange_array:
            case ModuleTableField.FIELD_TYPE_plain_vo_obj:

            default:
                throw new Error('Not implemented');
        }
    }


    private get_ranges_query_cardinal_1(field: ModuleTableField<any>, filter_field_type: string, range: IRange, table_name: string): string {

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

        let ranges_query: string = DAOServerController.getInstance().get_range_translated_to_bdd_queryable_range(range, field, filter_field_type);

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
            case ModuleTableField.FIELD_TYPE_decimal_full_precision:
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

            case ModuleTableField.FIELD_TYPE_float_array:
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

            case ModuleTableField.FIELD_TYPE_plain_vo_obj:
                throw new Error('Not Implemented');
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
            case ModuleTableField.FIELD_TYPE_decimal_full_precision:
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
            case ModuleTableField.FIELD_TYPE_timewithouttimezone:
            case ModuleTableField.FIELD_TYPE_geopoint:
            case ModuleTableField.FIELD_TYPE_plain_vo_obj:
                return true;

            case ModuleTableField.FIELD_TYPE_tstz_array:
            case ModuleTableField.FIELD_TYPE_daterange:
            case ModuleTableField.FIELD_TYPE_float_array:
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

    private get_ranges_query_exact_search(field: ModuleTableField<any>, filter_field_type: string, field_ranges: IRange[], table_name: string): string {

        let res: string = '';

        let ranges_query: string = DAOServerController.getInstance().get_ranges_translated_to_bdd_queryable_ranges(field_ranges, field, filter_field_type);

        if (!ranges_query) {
            throw new Error('Error should not filter on empty range array');
        }

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
            case ModuleTableField.FIELD_TYPE_decimal_full_precision:
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
            case ModuleTableField.FIELD_TYPE_timewithouttimezone: // TODO FIXME
                res += 'ARRAY[' + table_name + '.' + field.field_id + "] = " + ranges_query;
                break;
            case ModuleTableField.FIELD_TYPE_geopoint:
                // TODO
                break;
            case ModuleTableField.FIELD_TYPE_tstz_array:
            case ModuleTableField.FIELD_TYPE_int_array:
            case ModuleTableField.FIELD_TYPE_float_array:
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

            case ModuleTableField.FIELD_TYPE_plain_vo_obj:
                throw new Error('Not implemented');
        }

        return res;
    }

    private get_range_check_simple_field_type_valeur(field: ModuleTableField<any>, filter_field_type: string, range: IRange, table_name: string): string {
        if ((field.segmentation_type == range.segment_type) && (RangeHandler.getCardinal(range) == 1)) {
            return table_name + '.' + field.field_id + ' = ' + this.get_range_segment_value_to_bdd(field, filter_field_type, RangeHandler.getSegmentedMin(range)) + ' ';
        } else {
            let segmented_min = RangeHandler.getSegmentedMin(range);
            let segmented_max = RangeHandler.getSegmentedMax(range, range.segment_type, 1);

            return table_name + '.' + field.field_id + ' >= ' + this.get_range_segment_value_to_bdd(field, filter_field_type, segmented_min) + ' and ' +
                table_name + '.' + field.field_id + ' < ' + this.get_range_segment_value_to_bdd(field, filter_field_type, segmented_max) + ' ';
        }
    }

    private get_ranges_query_cardinal_supp_1(field: ModuleTableField<any>, filter_field_type: string, field_ranges: IRange[], table_name: string, full_name: string): string {

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

        let range_to_db = DAOServerController.getInstance().get_ranges_translated_to_bdd_queryable_ranges(field_ranges, field, filter_field_type);

        if (!range_to_db) {
            throw new Error('Error should not filter on empty range array get_ranges_query_cardinal_supp_1');
        }

        let ranges_query = 'ANY(' + range_to_db + ')';

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
            case ModuleTableField.FIELD_TYPE_decimal_full_precision:
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
            case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                res += table_name + '.' + field.field_id + " <@ " + ranges_query;
                break;
            case ModuleTableField.FIELD_TYPE_geopoint:
                // TODO
                break;

            case ModuleTableField.FIELD_TYPE_tstz_array:
            case ModuleTableField.FIELD_TYPE_float_array:
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

            case ModuleTableField.FIELD_TYPE_plain_vo_obj:
                throw new Error('Not implemented');
        }

        return res;
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
            case ModuleTableField.FIELD_TYPE_decimal_full_precision:
            case ModuleTableField.FIELD_TYPE_foreign_key:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
            case ModuleTableField.FIELD_TYPE_image_ref:
            case ModuleTableField.FIELD_TYPE_int:
            case ModuleTableField.FIELD_TYPE_prct:
            case ModuleTableField.FIELD_TYPE_float_array:
            case ModuleTableField.FIELD_TYPE_int_array:
            case ModuleTableField.FIELD_TYPE_refrange_array:
            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_isoweekdays:
                if (
                    (filter_field_type == ModuleTableField.FIELD_TYPE_refrange_array) ||
                    (filter_field_type == ModuleTableField.FIELD_TYPE_hourrange_array) ||
                    (filter_field_type == ModuleTableField.FIELD_TYPE_numrange_array) ||
                    (filter_field_type == ModuleTableField.FIELD_TYPE_isoweekdays)) {
                    return segmented_value;
                }
                break;
            case ModuleTableField.FIELD_TYPE_hourrange_array:
            case ModuleTableField.FIELD_TYPE_hourrange:
                if (filter_field_type == ModuleTableField.FIELD_TYPE_hourrange_array) {
                    return segmented_value;
                }
                break;
            case ModuleTableField.FIELD_TYPE_date:
            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_month:
                return DateHandler.getInstance().formatDayForIndex(segmented_value);
            case ModuleTableField.FIELD_TYPE_tstzrange_array:
            case ModuleTableField.FIELD_TYPE_tstz_array:
            case ModuleTableField.FIELD_TYPE_tstz:
                return segmented_value.toString();
            case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                // TODO FIXME
                break;
            case ModuleTableField.FIELD_TYPE_daterange:
                return DateHandler.getInstance().formatDayForIndex(segmented_value);
            case ModuleTableField.FIELD_TYPE_tsrange:
                return segmented_value.toString();
            case ModuleTableField.FIELD_TYPE_numrange:
                return segmented_value.toString();

            case ModuleTableField.FIELD_TYPE_geopoint:
            case ModuleTableField.FIELD_TYPE_plain_vo_obj:
                throw new Error('Not implemented');
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
        ConsoleHandler.warn("global_update_blocker actif");
    }

    private async create_or_replace_function_ref_get_user() {
        await this.query(
            ' CREATE OR REPLACE FUNCTION ref.get_user(IN user_name text, IN user_email text, IN user_phone text, user_pwd text, check_pwd bool) RETURNS ref.user' +
            ' AS $$' +
            ' DECLARE' +
            ' user_found ref."user"%rowtype;' +
            ' BEGIN' +
            ' ' +
            ' for user_found IN (select * FROM ref."user" x WHERE ' +
            ' LOWER(x.name) = user_name OR LOWER(x.email) = user_name OR LOWER(x.phone) = user_name OR' +
            ' LOWER(x.name) = user_email OR LOWER(x.email) = user_email OR LOWER(x.phone) = user_email OR' +
            ' LOWER(x.name) = user_phone OR LOWER(x.email) = user_phone OR LOWER(x.phone) = user_phone' +
            ' )' +
            ' LOOP' +
            ' IF check_pwd = FALSE THEN' +
            ' return user_found;' +
            ' ELSEIF user_found.password = crypt(user_pwd, user_found.password) THEN' +
            ' return user_found;' +
            ' END IF;' +
            ' END LOOP;' +
            ' RETURN NULL;' +
            ' END;' +
            ' $$' +
            ' LANGUAGE plpgsql;');
    }

    private log_db_query_perf_start(method_name: string, query_string: string = null, step_name: string = null): number {
        if (ConfigurationService.node_configuration.DEBUG_DB_QUERY_PERF) {
            let uid = this.log_db_query_perf_uid++;
            this.log_db_query_perf_start_by_uid[uid] = Dates.now_ms();
            let query_s = (query_string ? (ConfigurationService.node_configuration.DEBUG_DB_FULL_QUERY_PERF ? query_string : query_string.substring(0, 1000)) : 'N/A');
            // query_s = (query_s ? query_s.replace(/;/g, '') : 'N/A');
            ConsoleHandler.log('log_db_query_perf_start;;ModuleDAOServer;IN;' + uid + ';' + this.log_db_query_perf_start_by_uid[uid] + ';0;' + method_name +
                ';' + (step_name ? step_name : 'N/A') +
                ';' + query_s);
            return uid;
        }

        return null;
    }

    private log_db_query_perf_end(uid: number, method_name: string, query_string: string = null, step_name: string = null) {
        if (ConfigurationService.node_configuration.DEBUG_DB_QUERY_PERF && !!this.log_db_query_perf_start_by_uid[uid]) {
            let end_ms = Dates.now_ms();
            let duration = Math.round(end_ms - this.log_db_query_perf_start_by_uid[uid]);
            let query_s = (query_string ? (ConfigurationService.node_configuration.DEBUG_DB_FULL_QUERY_PERF ? query_string : query_string.substring(0, 1000)) : 'N/A');
            // query_s = (query_s ? query_s.replace(/;/g, '') : 'N/A');

            if (ConfigurationService.node_configuration.DEBUG_SLOW_QUERIES &&
                (duration > (10 * ConfigurationService.node_configuration.DEBUG_SLOW_QUERIES_MS_LIMIT))) {
                ConsoleHandler.error('log_db_query_perf_end;VERYSLOW;ModuleDAOServer;OUT;' + uid + ';' + end_ms + ';' + duration + ';' + method_name +
                    ';' + (step_name ? step_name : 'N/A') +
                    ';' + query_string);
            } else if (ConfigurationService.node_configuration.DEBUG_SLOW_QUERIES &&
                (duration > ConfigurationService.node_configuration.DEBUG_SLOW_QUERIES_MS_LIMIT)) {
                ConsoleHandler.warn('log_db_query_perf_end;SLOW;ModuleDAOServer;OUT;' + uid + ';' + end_ms + ';' + duration + ';' + method_name +
                    ';' + (step_name ? step_name : 'N/A') +
                    ';' + query_string);
            } else {
                ConsoleHandler.log('log_db_query_perf_end;;ModuleDAOServer;OUT;' + uid + ';' + end_ms + ';' + duration + ';' + method_name +
                    ';' + (step_name ? step_name : 'N/A') +
                    ';' + query_s);
            }
        }
    }

    private async check_throttled_select_query_size_ms() {
        if ((!this.throttled_select_query_size_ms_param_last_update) || ((this.throttled_select_query_size_ms_param_last_update) + 120 < Dates.now())) {
            this.throttled_select_query_size_ms_param_last_update = Dates.now();

            let throttled_select_query_size_ms = this.throttled_select_query_size_ms;
            try {
                throttled_select_query_size_ms = await ModuleParams.getInstance().getParamValueAsInt(ModuleDAOServer.PARAM_NAME_throttled_select_query_size_ms, 1);
                this.throttled_select_query_size_ms = throttled_select_query_size_ms;
            } catch (error) {
                // Normal pendant le démarrage
            }

            if (this.throttled_select_query_size_ms != this.current_throttled_select_query_size_ms) {
                this.current_throttled_select_query_size_ms = this.throttled_select_query_size_ms;
                this.throttled_select_query_ = ThrottleHelper.getInstance().declare_throttle_with_mappable_args(this.throttled_select_query.bind(this), this.current_throttled_select_query_size_ms, { leading: false, trailing: true });
            }
        }
    }

    private async do_throttled_select_query(request: string, values: any[], throttled_select_query_params_by_index: { [index: number]: ThrottledSelectQueryParam }) {
        let results = null;

        try {
            let uid = this.log_db_query_perf_start('do_throttled_select_query', request);
            results = await ModuleServiceBase.getInstance().db.query(request, values);
            this.log_db_query_perf_end(uid, 'do_throttled_select_query', request);
        } catch (error) {
            ConsoleHandler.error('do_throttled_select_query:' + error);
        }

        /**
         * On ventile les résultats par index
         */
        let results_by_index: { [index: number]: any[] } = {};
        for (let i in results) {
            let result = results[i];

            let index = result['___throttled_select_query___index'];
            if (!results_by_index[index]) {
                results_by_index[index] = [];
            }
            delete result['___throttled_select_query___index'];
            results_by_index[index].push(result);
        }

        let promises = [];
        for (let i in throttled_select_query_params_by_index) {
            let index = parseInt(i);
            let results_of_index = results_by_index[index];
            let param = throttled_select_query_params_by_index[index];

            if (ConfigurationService.node_configuration.DEBUG_THROTTLED_SELECT) {
                ConsoleHandler.log('do_throttled_select_query:results_of_index:' + index + ':' + (results_of_index ? JSON.stringify(results_of_index) : 'null'));
            }

            for (let cbi in param.cbs) {
                let cb = param.cbs[cbi];

                /**
                 * Si on utilise plusieurs fois les mêmes datas résultantes de la query,
                 *  on clonait les résultats pour chaque cb, mais c'est très lourd.
                 *  Dont on va préférer les rendre non mutable, et on clone plus puisque la donnée ne peut plus changer
                 */
                if (results_of_index && (param.cbs.length > 1)) {
                    Object.freeze(results_of_index);
                }

                promises.push(cb(results_of_index ? results_of_index : null));
            }
        }
        await all_promises(promises);
    }
}
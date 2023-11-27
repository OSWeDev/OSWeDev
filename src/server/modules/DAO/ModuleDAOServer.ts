import { DatabaseError, Pool } from 'pg';
import { from as copyFrom } from 'pg-copy-streams';
import pgPromise from 'pg-promise';
import { Readable } from 'stream';
import INamedVO from '../../../shared/interfaces/INamedVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import RolePolicyVO from '../../../shared/modules/AccessPolicy/vos/RolePolicyVO';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserRoleVO from '../../../shared/modules/AccessPolicy/vos/UserRoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleContextFilter from '../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVO, { filter } from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryVO, { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import DAOController from '../../../shared/modules/DAO/DAOController';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import { IContextHookFilterVos } from '../../../shared/modules/DAO/interface/IContextHookFilterVos';
import { IHookFilterVos } from '../../../shared/modules/DAO/interface/IHookFilterVos';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import IRange from '../../../shared/modules/DataRender/interfaces/IRange';
import NumRange from '../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../shared/modules/DataRender/vos/NumSegment';
import FeedbackVO from '../../../shared/modules/Feedback/vos/FeedbackVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import MaintenanceVO from '../../../shared/modules/Maintenance/vos/MaintenanceVO';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import IMatroid from '../../../shared/modules/Matroid/interfaces/IMatroid';
import ModuleTable from '../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ParamVO from '../../../shared/modules/Params/vos/ParamVO';
import StatsController from '../../../shared/modules/Stats/StatsController';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import VOsTypesManager from '../../../shared/modules/VO/manager/VOsTypesManager';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VocusInfoVO from '../../../shared/modules/Vocus/vos/VocusInfoVO';
import BooleanHandler from '../../../shared/tools/BooleanHandler';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import { all_promises } from '../../../shared/tools/PromiseTools';
import RangeHandler from '../../../shared/tools/RangeHandler';
import StackContext from '../../StackContext';
import ConfigurationService from '../../env/ConfigurationService';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ServerAnonymizationController from '../Anonymization/ServerAnonymizationController';
import ModuleServerBase from '../ModuleServerBase';
import ModuleServiceBase from '../ModuleServiceBase';
import ModuleTableDBService from '../ModuleTableDBService';
import ModulesManagerServer from '../ModulesManagerServer';
import PushDataServerController from '../PushData/PushDataServerController';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';
import ModuleVarServer from '../Var/ModuleVarServer';
import ModuleVocusServer from '../Vocus/ModuleVocusServer';
import DAOCronWorkersHandler from './DAOCronWorkersHandler';
import DAOServerController from './DAOServerController';
import LogDBPerfServerController from './LogDBPerfServerController';
import ThrottledQueryServerController from './ThrottledQueryServerController';
import ThrottledRefuseServerController from './ThrottledRefuseServerController';
import DAOPostCreateTriggerHook from './triggers/DAOPostCreateTriggerHook';
import DAOPostDeleteTriggerHook from './triggers/DAOPostDeleteTriggerHook';
import DAOPostUpdateTriggerHook from './triggers/DAOPostUpdateTriggerHook';
import DAOPreCreateTriggerHook from './triggers/DAOPreCreateTriggerHook';
import DAOPreDeleteTriggerHook from './triggers/DAOPreDeleteTriggerHook';
import DAOPreUpdateTriggerHook from './triggers/DAOPreUpdateTriggerHook';
import DAOUpdateVOHolder from './vos/DAOUpdateVOHolder';

export default class ModuleDAOServer extends ModuleServerBase {

    public static PARAM_NAME_insert_without_triggers_using_COPY: string = 'ModuleDAOServer.insert_without_triggers_using_COPY';
    public static PARAM_NAME_throttled_select_query_size_ms: string = 'ModuleDAOServer.throttled_select_query_size_ms';

    public static TASK_NAME_add_segmented_known_databases: string = ModuleDAO.MODULE_NAME + ".add_segmented_known_databases";

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleDAOServer.instance) {
            ModuleDAOServer.instance = new ModuleDAOServer();
        }
        return ModuleDAOServer.instance;
    }

    private static instance: ModuleDAOServer = null;

    public check_foreign_keys: boolean = true;


    // private copy_dedicated_pool = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleDAO.getInstance().name);
        setTimeout(() => {
            ThrottledQueryServerController.shift_select_queries();
        }, 1);
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
    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(is_generator: boolean = false): Promise<void> {
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
        let lang: LangVO = is_generator ? await ModuleTranslation.getInstance().getLang(DefaultTranslation.DEFAULT_LANG_DEFAULT_TRANSLATION) : null;
        for (let i in VOsTypesManager.moduleTables_by_voType) {
            let moduleTable: ModuleTable<any> = VOsTypesManager.moduleTables_by_voType[i];
            let vo_type: string = moduleTable.vo_type;

            // Uniquement si le module est actif, mais là encore est-ce une erreur ? ...
            if (moduleTable.module && !moduleTable.module.actif) {
                continue;
            }

            promises.push((async () => {
                // On a besoin de la trad de ce vo_type, si possible celle en base, sinon celle en default translation si elle existe, sinon on reste sur le vo_type
                // Par contre si on est pas sur le générateur, on refuse de faire la requête pour la trad

                let vo_translation: string = vo_type;
                let vo_type_translatable_code: string = VOsTypesManager.moduleTables_by_voType[vo_type].label ? VOsTypesManager.moduleTables_by_voType[vo_type].label.code_text : null;
                let translation_from_bdd: TranslationVO = (is_generator && lang && vo_type_translatable_code) ? await query(TranslationVO.API_TYPE_ID)
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
                            DAOServerController.get_dao_policy(
                                DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_LIST_LABELS, vo_type),
                                group, isAccessConfVoType, AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE),
                            (vo_translation && (vo_translation != "")) ? new DefaultTranslation({ 'fr-fr': 'Lister les données de type "' + vo_translation + '"' }) : null,
                            module_);
                    })(),
                    (async () => {
                        vo_read = await ModuleAccessPolicyServer.getInstance().registerPolicy(
                            DAOServerController.get_dao_policy(
                                DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, vo_type),
                                group, isAccessConfVoType, AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE),
                            (vo_translation && (vo_translation != "")) ? new DefaultTranslation({ 'fr-fr': 'Consulter les données de type "' + vo_translation + '"' }) : null,
                            module_);
                    })(),
                    (async () => {
                        vo_insert_or_update = await ModuleAccessPolicyServer.getInstance().registerPolicy(
                            DAOServerController.get_dao_policy(
                                DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, vo_type),
                                group, isAccessConfVoType, AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN),
                            (vo_translation && (vo_translation != "")) ? new DefaultTranslation({ 'fr-fr': 'Ajouter ou modifier des données de type "' + vo_translation + '"' }) : null,
                            module_);
                    })(),
                    (async () => {
                        vo_delete = await ModuleAccessPolicyServer.getInstance().registerPolicy(
                            DAOServerController.get_dao_policy(
                                DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_DELETE, vo_type),
                                group, isAccessConfVoType, AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN),
                            (vo_translation && (vo_translation != "")) ? new DefaultTranslation({ 'fr-fr': 'Supprimer des données de type "' + vo_translation + '"' }) : null,
                            module_);
                    })(),
                ]);

                await all_promises([
                    ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                        DAOServerController.get_dao_dependency_default_granted(vo_list, global_access)),
                    ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                        DAOServerController.get_dao_dependency_default_granted(
                            vo_list,
                            DAOServerController.get_inherited_right(
                                ModuleDAO.DAO_ACCESS_TYPE_LIST_LABELS, moduleTable.inherit_rights_from_vo_type))),

                    ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                        DAOServerController.get_dao_dependency_default_denied(vo_read, vo_list)),
                    ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                        DAOServerController.get_dao_dependency_default_granted(vo_read, global_access)),
                    ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                        DAOServerController.get_dao_dependency_default_granted(
                            vo_read,
                            DAOServerController.get_inherited_right(
                                ModuleDAO.DAO_ACCESS_TYPE_READ, moduleTable.inherit_rights_from_vo_type))),

                    ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                        DAOServerController.get_dao_dependency_default_denied(vo_insert_or_update, vo_read)),
                    ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                        DAOServerController.get_dao_dependency_default_granted(vo_insert_or_update, global_access)),
                    ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                        DAOServerController.get_dao_dependency_default_granted(
                            vo_insert_or_update,
                            DAOServerController.get_inherited_right(
                                ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, moduleTable.inherit_rights_from_vo_type))),

                    ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                        DAOServerController.get_dao_dependency_default_denied(vo_delete, vo_read)),
                    ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                        DAOServerController.get_dao_dependency_default_granted(vo_delete, global_access)),
                    ModuleAccessPolicyServer.getInstance().registerPolicyDependency(
                        DAOServerController.get_dao_dependency_default_granted(
                            vo_delete,
                            DAOServerController.get_inherited_right(
                                ModuleDAO.DAO_ACCESS_TYPE_DELETE, moduleTable.inherit_rights_from_vo_type)))
                ]);
            })());
        }

        if (promises && promises.length) {
            await all_promises(promises);
        }
    }

    public async late_configuration(is_generator: boolean) {
        await ModuleDAO.getInstance().late_configuration(is_generator);
    }


    public async getqueryfor_insertOrUpdateVO(vo: IDistantVOBase, pre_update_vo: IDistantVOBase, exec_as_server: boolean = false): Promise<string> {

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

            if (DAOServerController.pre_update_trigger_hook.has_trigger(vo._type)) {

                // Ajout des triggers, avant et après modification.
                //  Attention si un des output est false avant modification, on annule la modification
                let res: boolean[] = await DAOServerController.pre_update_trigger_hook.trigger(vo._type, new DAOUpdateVOHolder(pre_update_vo, vo), exec_as_server);
                if (!BooleanHandler.AND(res, true)) {
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

            if (DAOServerController.pre_create_trigger_hook.has_trigger(vo._type)) {

                // Ajout des triggers, avant et après modification.
                //  Attention si un des output est false avant modification, on annule la modification
                let res: boolean[] = await DAOServerController.pre_create_trigger_hook.trigger(vo._type, vo, exec_as_server);
                if (!BooleanHandler.AND(res, true)) {
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

            // Grosse évol sur le insert or update, on va gérer les insert into ... on conflict ... do update
            //  Pour le moment, on gère ça uniquement pour la première clé unique déclarée sur le vo
            if (moduleTable.uniq_indexes && moduleTable.uniq_indexes.length) {
                let uniq_index = moduleTable.uniq_indexes[0];
                let uniq_index_field_names = uniq_index.map((field) => field.field_id);

                let uniq_index_fields = uniq_index_field_names.join(', ');

                let updateFields = tableFields.map((field) => `${field} = EXCLUDED.${field}`).join(', ');

                sql = `INSERT INTO ${full_name} (${tableFields.join(', ')}) VALUES (${placeHolders.join(', ')}) ON CONFLICT (${uniq_index_fields}) DO UPDATE SET ${updateFields} RETURNING id`;
            } else {
                sql = "INSERT INTO " + full_name + " (" + tableFields.join(', ') + ") VALUES (" + placeHolders.join(', ') + ") RETURNING id";
            }
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

    // istanbul ignore next: cannot test configure
    public async configure() {

        await DAOServerController.configure();
        // await this.create_or_replace_function_ref_get_user();

        DAOServerController.pre_update_trigger_hook = new DAOPreUpdateTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        ModuleTriggerServer.getInstance().registerTriggerHook(DAOServerController.pre_update_trigger_hook);
        DAOServerController.pre_create_trigger_hook = new DAOPreCreateTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        ModuleTriggerServer.getInstance().registerTriggerHook(DAOServerController.pre_create_trigger_hook);
        DAOServerController.pre_delete_trigger_hook = new DAOPreDeleteTriggerHook(DAOPreDeleteTriggerHook.DAO_PRE_DELETE_TRIGGER);
        ModuleTriggerServer.getInstance().registerTriggerHook(DAOServerController.pre_delete_trigger_hook);

        DAOServerController.post_update_trigger_hook = new DAOPostUpdateTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);
        ModuleTriggerServer.getInstance().registerTriggerHook(DAOServerController.post_update_trigger_hook);
        DAOServerController.post_create_trigger_hook = new DAOPostCreateTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        ModuleTriggerServer.getInstance().registerTriggerHook(DAOServerController.post_create_trigger_hook);
        DAOServerController.post_delete_trigger_hook = new DAOPostDeleteTriggerHook(DAOPostDeleteTriggerHook.DAO_POST_DELETE_TRIGGER);
        ModuleTriggerServer.getInstance().registerTriggerHook(DAOServerController.post_delete_trigger_hook);

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

    // istanbul ignore next: cannot test registerCrons
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
        if (!DAOServerController.access_hooks[API_TYPE_ID]) {
            DAOServerController.access_hooks[API_TYPE_ID] = {};
        }

        if (!DAOServerController.access_hooks[API_TYPE_ID][access_type]) {
            DAOServerController.access_hooks[API_TYPE_ID][access_type] = [];
        }

        DAOServerController.access_hooks[API_TYPE_ID][access_type].push(
            hook.bind(handler_bind_this)
        );
    }

    /**
     * Enregistrer un nouveau context access hook qui sera exécuté quand une requête est passée au module context filter
     *  Si on a plusieurs context query pour un même type, on les enchaînera dans la requête avec un ET (l'id de l'objet
     *  fitré devra se trouver dans les résultats de toutes les contextQuery)
     */
    public registerContextAccessHook<T extends IDistantVOBase>(API_TYPE_ID: string, handler_bind_this: any, hook: IContextHookFilterVos<T>) {
        if (!DAOServerController.context_access_hooks[API_TYPE_ID]) {
            DAOServerController.context_access_hooks[API_TYPE_ID] = [];
        }
        DAOServerController.context_access_hooks[API_TYPE_ID].push(hook.bind(handler_bind_this));
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_selectUsersForCheckUnicity, this.selectUsersForCheckUnicity.bind(this));

        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_DELETE_VOS, this.deleteVOs.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_DELETE_VOS_BY_IDS, this.deleteVOsByIds.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_DELETE_VOS_MULTICONNECTIONS, this.deleteVOsMulticonnections.bind(this));

        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_INSERT_VOS, this.insert_vos.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_INSERT_OR_UPDATE_VOS, this.insertOrUpdateVOs.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_INSERT_OR_UPDATE_VO, this.insertOrUpdateVO.bind(this));

        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_getVarImportsByMatroidParams, this.getVarImportsByMatroidParams.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_FILTER_VOS_BY_MATROIDS, this.filterVosByMatroids.bind(this));

        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_GET_NAMED_VO_BY_NAME, this.getNamedVoByName.bind(this));

        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_GET_BASE_URL, this.getBaseUrl.bind(this));

        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_truncate, this.truncate_api.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDAO.APINAME_delete_all_vos_triggers_ok, this.delete_all_vos_triggers_ok.bind(this));
    }

    public async preload_segmented_known_database(t: ModuleTable<any>) {
        let segments_by_segmented_value: { [segmented_value: number]: string } = await ModuleTableDBService.getInstance(null).get_existing_segmentations_tables_of_moduletable(t);

        for (let i in segments_by_segmented_value) {
            let table_name = segments_by_segmented_value[i];

            DAOServerController.add_segmented_known_databases(t.database, table_name, parseInt(i.toString()));
        }
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

        let matroid_fields = MatroidController.getMatroidFields(matroid._type);

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

            where_clause_params.push(DAOServerController.getClauseWhereRangeIntersectsField(field.field_type, field.field_id, field_range));
        }
        return " (" + where_clause_params.join(" OR ") + ") ";
    }

    public async deleteVOsMulticonnections<T extends IDistantVOBase>(vos: T[]): Promise<InsertOrDeleteQueryResult[]> {

        // max_connections_to_use = max_connections_to_use || Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL));
        let max_connections_to_use = Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2));
        let promise_pipeline = new PromisePipeline(max_connections_to_use, 'ModuleDAOServer.deleteVOsMulticonnections');

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

    /**
     * @deprecated [à confirmer mais a priori le nouveau insertOrUpdateVOs_as_server pourrait être plus rapide et plus safe]
     * @param vos
     * @param max_connections_to_use
     * @returns
     */
    public async insertOrUpdateVOsMulticonnections<T extends IDistantVOBase>(vos: T[], max_connections_to_use: number = 0, exec_as_server: boolean = false): Promise<InsertOrDeleteQueryResult[]> {

        // max_connections_to_use = max_connections_to_use || Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL));
        max_connections_to_use = max_connections_to_use || Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2));

        /**
         * Si les vos sont segmentés, on check en amont l'existence des tables segmentées
         *  car on ne peut pas les créer en parallèle. Du coup on les crée en amont si besoin
         */
        await this.confirm_segmented_tables_existence(vos);
        return await this.insertOrUpdateVOs_as_server(vos, exec_as_server);
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

            await RangeHandler.foreach_ranges(ranges, async (segment_value) => {

                if (!DAOServerController.has_segmented_known_database(datatable, segment_value)) {
                    return;
                }

                let query_string = "DELETE FROM " + datatable.get_segmented_full_name(segment_value);
                let uid = LogDBPerfServerController.log_db_query_perf_start('delete_all_vos', query_string, 'is_segmented');
                await ModuleServiceBase.db.none(query_string + ";");
                LogDBPerfServerController.log_db_query_perf_end(uid, 'delete_all_vos', query_string, 'is_segmented');

            }, datatable.table_segmented_field_segment_type);
        } else {
            let query_string = "DELETE FROM " + datatable.full_name;
            let uid = LogDBPerfServerController.log_db_query_perf_start('delete_all_vos', query_string, '!is_segmented');
            await ModuleServiceBase.db.none(query_string + ";");
            LogDBPerfServerController.log_db_query_perf_end(uid, 'delete_all_vos', query_string, '!is_segmented');
        }
    }

    /**
     * Attention, on appel aucun triggers de l'appli en faisant ça...
     */
    public async insertOrUpdateVOs_without_triggers(vos: IDistantVOBase[], max_connections_to_use: number = 0, exec_as_server: boolean = false): Promise<InsertOrDeleteQueryResult[]> {
        if (DAOServerController.GLOBAL_UPDATE_BLOCKER) {
            let uid: number = StackContext.get('UID');
            let CLIENT_TAB_ID: string = StackContext.get('CLIENT_TAB_ID');
            if (uid && CLIENT_TAB_ID) {
                ThrottledRefuseServerController.throttled_refuse({ [uid]: { [CLIENT_TAB_ID]: true } });
            }
            return null;
        }

        // On vérifie qu'on peut faire un insert ou update
        if ((!vos) || (!vos.length)) {
            return null;
        }

        vos = vos.filter((vo) =>
            (!!vo) && vo._type && VOsTypesManager.moduleTables_by_voType[vo._type] &&
            (exec_as_server || DAOServerController.checkAccessSync(VOsTypesManager.moduleTables_by_voType[vo._type], ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE)));

        if ((!vos) || (!vos.length)) {
            return null;
        }

        if (!exec_as_server) {
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
        }

        if (this.check_foreign_keys) {
            vos = await this.filterByForeignKeys(vos);
            if ((!vos) || (!vos.length)) {
                return null;
            }
        }

        let vos_by_vo_tablename_and_ids: { [tablename: string]: { moduletable: ModuleTable<any>, vos: { [id: number]: IDistantVOBase[] } } } = {};

        max_connections_to_use = max_connections_to_use || Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2));

        let promise_pipeline = new PromisePipeline(max_connections_to_use, 'ModuleDAOServer.insertOrUpdateVOs_without_triggers');

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

                /**
                 * MODIF MAJEURE : on retire ce comportement. On ne devrait jamais demander à insérer un objet avec un champs unique déjà défini.
                 *  on refuse l'insert dans ce cas, et charge au système qui a fait la demande en amont de mettre à jour son cache, et de refaire une demande adaptée
                 * ANCIEN COMPORTEMENT Si on a des fields de type unique, et pas de id fourni, on veut tester de charger depuis la bdd un objet avec
                 *  la même valeur de champ unique. si on trouve on passe en update au lieu d'insert
                 */
                //                 if (!vo_id) {
                //     try {
                //         vo.id = await this.check_uniq_indexes(vo, moduleTable);
                //     } catch (err) {
                //         return null;
                //     }

                //     vo_id = vo.id;
                // }

                if (!vos_by_vo_tablename_and_ids[tablename].vos[vo_id]) {
                    vos_by_vo_tablename_and_ids[tablename].vos[vo_id] = [];
                }

                vos_by_vo_tablename_and_ids[tablename].vos[vo_id].push(vo);
            });
        }

        await promise_pipeline.end();
        promise_pipeline = new PromisePipeline(max_connections_to_use, 'ModuleDAOServer.insertOrUpdateVOs_without_triggers.2');

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

                            sub_sql += vos_values[i][j];
                        }

                        sql_values += sub_sql;

                        sql_values += ")";
                    }

                    sql += sql_values;

                    sql += " RETURNING ID;";
                }

                await promise_pipeline.push(async () => {
                    let uid = LogDBPerfServerController.log_db_query_perf_start('insertOrUpdateVOs_without_triggers', sql);
                    let results = await ModuleServiceBase.db.query(sql);
                    LogDBPerfServerController.log_db_query_perf_end(uid, 'insertOrUpdateVOs_without_triggers', sql);

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
            let reste_a_faire_res = await this.insertOrUpdateVOs_without_triggers(reste_a_faire, max_connections_to_use, exec_as_server);
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
     *
     * @param exec_as_server équivalement de l'ancien IS_CLIENT: false. on ignore tous les contrôles de droits
     */
    public async insert_without_triggers_using_COPY(vos: IDistantVOBase[], segmented_value: number = null, exec_as_server: boolean = false): Promise<boolean> {
        if (DAOServerController.GLOBAL_UPDATE_BLOCKER) {
            let uid: number = StackContext.get('UID');
            let CLIENT_TAB_ID: string = StackContext.get('CLIENT_TAB_ID');
            if (uid && CLIENT_TAB_ID) {
                ThrottledRefuseServerController.throttled_refuse({ [uid]: { [CLIENT_TAB_ID]: true } });
            }
            return false;
        }

        // On vérifie qu'on peut faire un insert ou update
        if ((!vos) || (!vos.length)) {
            return true;
        }

        vos = vos.filter((vo) =>
            (!!vo) && vo._type && VOsTypesManager.moduleTables_by_voType[vo._type] &&
            (exec_as_server || DAOServerController.checkAccessSync(VOsTypesManager.moduleTables_by_voType[vo._type], ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE)));

        if ((!vos) || (!vos.length)) {
            return true;
        }

        if (!exec_as_server) {
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
        }

        /**
         * On check aussi que l'on a pas des updates à faire et uniquement des inserts, sinon on fait un update des vos concernés avant de faire les inserts (on pourrait le faire en // mais c'est plus compliqué)
         */
        let update_vos: IDistantVOBase[] = [];
        // let check_pixel_update_vos_by_type: { [vo_type: string]: VarDataBaseVO[] } = {};
        let insert_vos: IDistantVOBase[] = [];

        for (let i in vos) {
            let vo = vos[i];

            if (!!vo.id) {

                // /**
                //  * Si on est sur du pixel && never_delete, on doit pas avoir un update sauf changement de valeur ou de type de valeur, le reste osef
                //  *  et comme on a un bug visiblement en amont qui essaie d'insérer ce type de valeur, on rajoute un contrôle ici qui sera toujours plus rapide que de faire un update
                //  */
                // if (VOsTypesManager.moduleTables_by_voType[vo._type].isMatroidTable) {
                //     let conf = VarsController.var_conf_by_id[vo['var_id']];
                //     if (conf && conf.pixel_activated && conf.pixel_never_delete) {

                //         if (!check_pixel_update_vos_by_type[vo._type]) {
                //             check_pixel_update_vos_by_type[vo._type] = [];
                //         }
                //         check_pixel_update_vos_by_type[vo._type].push(vo as VarDataBaseVO);
                //         continue;
                //     }
                // }

                update_vos.push(vo);
            } else {
                insert_vos.push(vo);
            }
        }


        // for (let api_type in check_pixel_update_vos_by_type) {
        //     let check_pixel_update_vos = check_pixel_update_vos_by_type[api_type];

        //     if ((!check_pixel_update_vos) || (!check_pixel_update_vos.length)) {
        //         continue;
        //     }

        //     let db_check_pixel_update_vos: VarDataBaseVO[] = await query(api_type).filter_by_ids(check_pixel_update_vos.map((vo) => vo.id)).exec_as_server(exec_as_server).select_vos();

        //     let db_check_pixel_update_vos_by_id: { [id: number]: VarDataBaseVO } = VOsTypesManager.vosArray_to_vosByIds(db_check_pixel_update_vos);

        //     for (let j in check_pixel_update_vos) {
        //         let vo = check_pixel_update_vos[j];
        //         let db_vo = db_check_pixel_update_vos_by_id[vo.id];

        //         if (db_vo && (db_vo.value == vo.value) && (db_vo.value_type == vo.value_type)) {
        //             ConsoleHandler.error('On a un insert/update de pixel alors que le pixel existe déjà en base avec la même valeur et le même type. On ne fait rien mais on ne devrait pas arriver ici.DB:' + JSON.stringify(db_vo) + ':app:' + JSON.stringify(vo));
        //             continue;
        //         }
        //         update_vos.push(vo);
        //     }
        // }

        if (!!update_vos.length) {
            await this.insertOrUpdateVOs_without_triggers(update_vos, null, exec_as_server);
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
            copy_dedicated_pool.connect(async (err, client, done) => {

                let cb = async () => {
                    if (debug_insert_without_triggers_using_COPY) {
                        ConsoleHandler.log('insert_without_triggers_using_COPY:end');
                    }
                    await done();
                    if (!!client) {
                        client.end();
                    }
                    await resolve(result);
                };

                let query_string = "COPY " + table_name + " (" + tableFields.join(", ") + ") FROM STDIN WITH (FORMAT csv, DELIMITER ';', QUOTE '''')";
                if (debug_insert_without_triggers_using_COPY) {
                    ConsoleHandler.log('insert_without_triggers_using_COPY:query_string:' + query_string);
                }

                if (!client) {
                    let query_res = await self.insertOrUpdateVOs_without_triggers(vos, null, exec_as_server);
                    result = (!!query_res) && (query_res.length == vos.length);
                    await cb();
                    return;
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

                        let duplicates: VarDataBaseVO[] = await query(moduleTable.vo_type).filter_by_text_has('_bdd_only_index', vos.map((vo: VarDataBaseVO) => vo._bdd_only_index)).exec_as_server().select_vos();
                        if (duplicates && duplicates.length) {
                            ConsoleHandler.error('insert_without_triggers_using_COPY:Erreur de duplication d\'index: on a trouvé des doublons (' + duplicates.length + '), on les mets à jour plutôt');

                            let duplicates_by_index: { [index: string]: VarDataBaseVO } = {};
                            let filtered_not_imported_vos: VarDataBaseVO[] = [];
                            for (let i in duplicates) {
                                let duplicate: VarDataBaseVO = duplicates[i];
                                duplicates_by_index[duplicate._bdd_only_index] = duplicate;
                            }

                            for (let i in vos) {
                                let vo: VarDataBaseVO = vos[i] as VarDataBaseVO;
                                let duplicated = duplicates_by_index[vo._bdd_only_index];

                                if (duplicated) {
                                    vo.id = duplicated.id;

                                    // Correctif probablement inutile, lié à un bug en amont, à supprimer si inutile après le 2024-02-01
                                    // // On gère un cas bien spécifique : Si on fait une création d'import pendant un calcul,
                                    // //  le calcul se termine après l'import et la notif + invalidation associées, et on vient de notifier une
                                    // //  valeur qui est donc fause à ce stade. On doit refuser l'insertion de cette valeur et on doit invalider.
                                    if (duplicated.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) {

                                        //     // On invalide la valeur (en y réflechissant il est probable que l'invalidation passe en fait sans avoir à la refaire ici
                                        //     //  mais ça coute pas vraiment plus cher, et comme ça on est sûr du résultat)
                                        //     await ModuleVarServer.getInstance().invalidate_cache_intersection_and_parents([duplicated]);

                                        continue;
                                    }
                                }
                                filtered_not_imported_vos.push(vo);
                            }

                            ConsoleHandler.error('insert_without_triggers_using_COPY:Erreur de duplication d\'index: on relance la copy avec les correctifs');
                            result = await self.insert_without_triggers_using_COPY(vos, segmented_value, exec_as_server);
                            ConsoleHandler.error('insert_without_triggers_using_COPY:Erreur de duplication d\'index: résultat copy avec correctifs:' + result);
                        } else {
                            let get_select_query_str: string = await query(moduleTable.vo_type).filter_by_text_has('_bdd_only_index', vos.map((vo: VarDataBaseVO) => vo._bdd_only_index)).exec_as_server(exec_as_server).get_select_query_str();
                            ConsoleHandler.error('insert_without_triggers_using_COPY:Erreur de duplication d\'index: on a pas trouvé de doublons ce qui ne devrait jamais arriver');
                            ConsoleHandler.error('insert_without_triggers_using_COPY:Erreur de duplication d\'index: \n' + lines.join('\n'));
                            ConsoleHandler.error('insert_without_triggers_using_COPY:Erreur de duplication d\'index: ' + get_select_query_str);
                        }
                    } else if (error && error.message) {
                        ConsoleHandler.error('insert_without_triggers_using_COPY:Erreur, on tente une insertion classique mais sans triggers');

                        try {
                            let query_res = await self.insertOrUpdateVOs_without_triggers(vos, null, exec_as_server);
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
                ThrottledRefuseServerController.throttled_refuse({ [uid]: { [CLIENT_TAB_ID]: true } });
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

                await RangeHandler.foreach_ranges(ranges, async (segment_value) => {

                    if (!DAOServerController.has_segmented_known_database(datatable, segment_value)) {
                        return;
                    }
                    let query_string = "TRUNCATE " + datatable.get_segmented_full_name(segment_value);
                    let uid = LogDBPerfServerController.log_db_query_perf_start('truncate', query_string, 'is_segmented');
                    await ModuleServiceBase.db.none(query_string + ";");
                    LogDBPerfServerController.log_db_query_perf_end(uid, 'truncate', query_string, 'is_segmented');

                }, datatable.table_segmented_field_segment_type);
            } else {
                let query_string = "TRUNCATE " + datatable.full_name;
                let uid = LogDBPerfServerController.log_db_query_perf_start('truncate', query_string, '!is_segmented');
                await ModuleServiceBase.db.none(query_string + ";");
                LogDBPerfServerController.log_db_query_perf_end(uid, 'truncate', query_string, '!is_segmented');
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
        if (!DAOServerController.checkAccessSync(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
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

                if (!DAOServerController.has_segmented_known_database(moduleTable, segment_value)) {
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

            let query_uid = LogDBPerfServerController.log_db_query_perf_start('selectAll', request, 'is_segmented');
            let vos: T[] = await ModuleServiceBase.db.query(request + ';', queryParams ? queryParams : []);
            LogDBPerfServerController.log_db_query_perf_end(query_uid, 'selectAll', request, 'is_segmented');

            for (let i in vos) {
                let data = vos[i];
                data._type = moduleTable.vo_type;
            }

            res = moduleTable.forceNumerics(vos);
        } else {
            let query_string = "SELECT " + (distinct ? 'distinct' : '') + " t.* FROM " + moduleTable.full_name + " t " +
                (query_ ? query_ : '') + (limit ? ' limit ' + limit : '') + (offset ? ' offset ' + offset : '');
            let query_uid = LogDBPerfServerController.log_db_query_perf_start('selectAll', query_string, '!is_segmented');

            let vos = await ModuleServiceBase.db.query(
                query_string, queryParams ? queryParams : []) as T[];
            for (let i in vos) {
                let data = vos[i];
                data._type = moduleTable.vo_type;
            }
            res = moduleTable.forceNumerics(vos);

            LogDBPerfServerController.log_db_query_perf_end(query_uid, 'selectAll', query_string, '!is_segmented');
        }

        // On filtre les res suivant les droits d'accès
        res = await DAOServerController.filterVOsAccess(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ, res);

        if (!res) {
            return null;
        }

        let uid = await StackContext.get('UID');
        if (uid) {
            await ServerAnonymizationController.anonymise(moduleTable, res, uid, null);
        }

        return res;
    }

    /**
     * @deprecated use context queries - will be deleted soon [utiliser la version contextquery query(API_TYPE_ID).select_vo<T>();]
     */
    public async selectOne<T extends IDistantVOBase>(API_TYPE_ID: string, query_: string = null, queryParams: any[] = null, depends_on_api_type_ids: string[] = null, ranges: IRange[] = null): Promise<T> {
        let moduleTable: ModuleTable<T> = VOsTypesManager.moduleTables_by_voType[API_TYPE_ID];

        // On vérifie qu'on peut faire un select
        if (!DAOServerController.checkAccessSync(moduleTable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
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
            await RangeHandler.foreach_ranges(ranges, async (segment_value) => {

                if (!DAOServerController.has_segmented_known_database(moduleTable, segment_value)) {
                    return;
                }

                let query_string = "SELECT t.* FROM " + moduleTable.get_segmented_full_name(segment_value) + " t " + (query_ ? query_ : '');
                let query_uid = LogDBPerfServerController.log_db_query_perf_start('selectOne', query_string, 'is_segmented');
                let segment_vo: T = await ModuleServiceBase.db.oneOrNone(query_string + ";", queryParams ? queryParams : []) as T;
                LogDBPerfServerController.log_db_query_perf_end(query_uid, 'selectOne', query_string, 'is_segmented');

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
            let query_uid = LogDBPerfServerController.log_db_query_perf_start('selectOne', query_string, '!is_segmented');
            vo = await ModuleServiceBase.db.oneOrNone(query_string + ";", queryParams ? queryParams : []) as T;
            LogDBPerfServerController.log_db_query_perf_end(query_uid, 'selectOne', query_string, '!is_segmented');
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
            await ServerAnonymizationController.anonymise(moduleTable, [vo], uid, null);
        }

        return vo;
    }

    /**
     * DONT USE : N'utiliser que en cas de force majeure => exemple upgrade de format de BDD
     * N'utilise PAS le throttle et donc l'aggrégation et les optimisations liées...
     * @param query_
     */
    public async query(query_: string = null, values: any = null): Promise<any> {
        if (DAOServerController.GLOBAL_UPDATE_BLOCKER && !/^select /i.test(query_)) {
            let uid: number = StackContext.get('UID');
            let CLIENT_TAB_ID: string = StackContext.get('CLIENT_TAB_ID');
            if (uid && CLIENT_TAB_ID) {
                ThrottledRefuseServerController.throttled_refuse({ [uid]: { [CLIENT_TAB_ID]: true } });
            }
            return null;
        }

        // On vérifie qu'on peut faire des modifs de table modules
        if (!AccessPolicyServerController.checkAccessSync(ModuleDAO.DAO_ACCESS_QUERY)) {
            return null;
        }

        let res = null;

        let query_uid = LogDBPerfServerController.log_db_query_perf_start('query', query_);
        if (!!values) {
            res = await ModuleServiceBase.db.query(query_, values);
        } else {
            res = await ModuleServiceBase.db.query(query_);
        }
        LogDBPerfServerController.log_db_query_perf_end(query_uid, 'query', query_);

        return res;
    }


    /**
     * Cas très spécifique de la connexion où l'on a évidemment pas le droit de lister les comptes, mais il faut tout de même pouvoir se connecter...
     */
    public async selectOneUser(login: string, password: string, check_pwd: boolean = true): Promise<UserVO> {
        // let datatable: ModuleTable<UserVO> = VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID];

        try {

            if (!login || !password) {
                throw new Error('Login or password empty');
            }

            /**
             * Refonte de la version query, par ce que bizarrement avec 2k elements en base, un filter name+email+phone => 200ms, un filter name+email+phone+pwd => 10s, un filter pwd => 200ms ...
             */
            let user: UserVO = await query(UserVO.API_TYPE_ID).add_filters([
                ContextFilterVO.or([
                    filter(UserVO.API_TYPE_ID, field_names<UserVO>().name).by_text_eq(login, true),
                    filter(UserVO.API_TYPE_ID, field_names<UserVO>().email).by_text_eq(login, true),
                    filter(UserVO.API_TYPE_ID, field_names<UserVO>().phone).by_text_eq(login, true),
                ]),
            ])
                .exec_as_server()
                .select_vo<UserVO>();

            if ((!user) || (!user.id)) {
                return null;
            }

            if (check_pwd) {
                return await query(UserVO.API_TYPE_ID).filter_by_id(user.id).filter_by_text_eq(field_names<UserVO>().password, password).exec_as_server().select_vo<UserVO>();
            }

            return user;

            // let query_string = "select * from ref.get_user('" + login.toLowerCase().trim() + "', '" + login.toLowerCase().trim() + "', '" + login.toLowerCase().trim() + "', PWD, " + (check_pwd ? 'true' : 'false') + ");";
            // let query_uid = LogDBPerfServerController.log_db_query_perf_start('selectOneUser', query_string);
            // let vo: UserVO = await ModuleServiceBase.db.oneOrNone(
            //     "select * from ref.get_user($1, $1, $1, $2, $3);", [login.toLowerCase().trim(), password, check_pwd]) as UserVO;
            // LogDBPerfServerController.log_db_query_perf_end(query_uid, 'selectOneUser', query_string);

            // vo = (vo && vo.id) ? vo : null;
            // if (!!vo) {
            //     vo['_type'] = UserVO.API_TYPE_ID;
            //     vo = datatable.forceNumeric(vo);
            // }
            // return vo;
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
        // let datatable: ModuleTable<UserVO> = VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID];

        try {

            if (!name || !email) {
                throw new Error('selectUsersForCheckUnicity: name and email must be defined');
            }

            let filters = [
                filter(UserVO.API_TYPE_ID, field_names<UserVO>().name).by_text_eq(name, true),
                filter(UserVO.API_TYPE_ID, field_names<UserVO>().email).by_text_eq(name, true),
                filter(UserVO.API_TYPE_ID, field_names<UserVO>().phone).by_text_eq(name, true),
                filter(UserVO.API_TYPE_ID, field_names<UserVO>().name).by_text_eq(email, true),
                filter(UserVO.API_TYPE_ID, field_names<UserVO>().email).by_text_eq(email, true),
                filter(UserVO.API_TYPE_ID, field_names<UserVO>().phone).by_text_eq(email, true)
            ];
            if (!!phone) {
                filters.push(filter(UserVO.API_TYPE_ID, field_names<UserVO>().name).by_text_eq(phone, true));
                filters.push(filter(UserVO.API_TYPE_ID, field_names<UserVO>().email).by_text_eq(phone, true));
                filters.push(filter(UserVO.API_TYPE_ID, field_names<UserVO>().phone).by_text_eq(phone, true));
            }
            // NEW method with query
            return await query(UserVO.API_TYPE_ID)
                .exec_as_server()

                .add_filters([
                    ContextFilterVO.or(filters),
                    filter(UserVO.API_TYPE_ID, field_names<UserVO>().id).by_num_not_eq(user_id),
                ])

                .select_count() == 0;

            //     // OLD
            //     let query_string = "select * from ref.get_user(" + name.toLowerCase().trim() + ", " + email.toLowerCase().trim() + ", " + (phone ? phone.toLowerCase().trim() : null) + ", $2, $3);";
            // let query_uid = LogDBPerfServerController.log_db_query_perf_start('selectUsersForCheckUnicity', query_string);
            // let vo: UserVO = await ModuleServiceBase.db.oneOrNone(
            //     "select * from ref.get_user($1, $2, $3, null, false);", [name.toLowerCase().trim(), email.toLowerCase().trim(), phone ? phone.toLowerCase().trim() : null]) as UserVO;
            // LogDBPerfServerController.log_db_query_perf_end(query_uid, 'selectUsersForCheckUnicity', query_string);

            // vo = (vo && vo.id) ? vo : null;
            // if (!!vo) {
            //     vo['_type'] = UserVO.API_TYPE_ID;
            //     vo = datatable.forceNumeric(vo);
            // }

            // if (!vo) {
            //     return true;
            // }

            // return vo.id == user_id;
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
            let query_uid = LogDBPerfServerController.log_db_query_perf_start('selectOneUserForRecovery', query_string);
            let vo: UserVO = await ModuleServiceBase.db.oneOrNone("SELECT t.* FROM " + datatable.full_name + " t " + "WHERE (TRIM(LOWER(name)) = $1 OR TRIM(LOWER(email)) = $1 or TRIM(LOWER(phone)) = $1) and blocked = false", [login.toLowerCase().trim()]) as UserVO;
            LogDBPerfServerController.log_db_query_perf_end(query_uid, 'selectOneUserForRecovery', query_string);

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
        let query_uid = LogDBPerfServerController.log_db_query_perf_start('selectOneUserForRecoveryUID', query_string);
        let vo: UserVO = await ModuleServiceBase.db.oneOrNone("SELECT t.* FROM " + datatable.full_name + " t " + "WHERE id = $1 and blocked = false", [uid]) as UserVO;
        LogDBPerfServerController.log_db_query_perf_end(query_uid, 'selectOneUserForRecoveryUID', query_string);

        if (!!vo) {
            vo['_type'] = UserVO.API_TYPE_ID;
            vo = datatable.forceNumeric(vo);
        }
        return vo;
    }


    public async insertOrUpdateVO_as_server(vo: IDistantVOBase, exec_as_server: boolean = true): Promise<InsertOrDeleteQueryResult> {

        return await this._insertOrUpdateVO(vo, exec_as_server);
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
        let promise_pipeline = new PromisePipeline(max, 'ModuleDAOServer.filterByForeignKeys');

        for (let i in vos) {
            let vo = vos[i];

            // On ne check pas pour les varsdatas pour des raisons de perfs évidentes
            if (vo &&
                (!!vo[field_names<VarDataBaseVO>()._bdd_only_index]) &&
                (!!vo[field_names<VarDataBaseVO>()._var_id]) &&
                (!!vo[field_names<VarDataBaseVO>().value_ts])) {
                res.push(vo);
                continue;
            }

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

    public async insertOrUpdateVOs_as_server<T extends IDistantVOBase>(vos: T[], exec_as_server: boolean = true): Promise<InsertOrDeleteQueryResult[]> {

        return await this._insertOrUpdateVOs(vos, exec_as_server);
    }

    public async deleteVOs_as_server(vos: IDistantVOBase[], exec_as_server: boolean = true): Promise<InsertOrDeleteQueryResult[]> {
        return await this._deleteVOs(vos, exec_as_server);
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

    /**
     * @param vos
     * @returns
     */
    private async insertOrUpdateVOs<T extends IDistantVOBase>(vos: T[]): Promise<InsertOrDeleteQueryResult[]> {

        return await this._insertOrUpdateVOs(vos, false);
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
                query_.exec_as_server();

                let uniquevos: IDistantVOBase[] = null;

                StatsController.register_stat_COMPTEUR('dao', 'check_uniq_indexes', 'query');

                uniquevos = await query_.select_vos();

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

        return await this._insertOrUpdateVO(vo, false);
    }

    private async deleteVOs(vos: IDistantVOBase[]): Promise<InsertOrDeleteQueryResult[]> {
        return await this._deleteVOs(vos, false);
    }

    private async _deleteVOs(vos: IDistantVOBase[], exec_as_server: boolean = false): Promise<InsertOrDeleteQueryResult[]> {
        let time_in = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('dao', 'deleteVOs', 'in');

        if (DAOServerController.GLOBAL_UPDATE_BLOCKER) {
            let uid: number = StackContext.get('UID');
            let CLIENT_TAB_ID: string = StackContext.get('CLIENT_TAB_ID');
            if (uid && CLIENT_TAB_ID) {
                ThrottledRefuseServerController.throttled_refuse({ [uid]: { [CLIENT_TAB_ID]: true } });
            }
            StatsController.register_stat_COMPTEUR('dao', 'deleteVOs', 'global_update_blocker');
            return null;
        }

        // On vérifie qu'on peut faire un delete
        if ((!vos) || (!vos.length) || (!vos[0]) || (!vos[0]._type) || (!VOsTypesManager.moduleTables_by_voType[vos[0]._type])) {
            StatsController.register_stat_COMPTEUR('dao', 'deleteVOs', 'invalid_vo');
            return null;
        }
        if (!DAOServerController.checkAccessSync(VOsTypesManager.moduleTables_by_voType[vos[0]._type], ModuleDAO.DAO_ACCESS_TYPE_DELETE)) {
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

        let query_uid = LogDBPerfServerController.log_db_query_perf_start('deleteVOs');
        let results: any[] = await ModuleServiceBase.db.tx(async (t) => {

            LogDBPerfServerController.log_db_query_perf_end(query_uid, 'deleteVOs');
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
                let res: boolean[] = await DAOServerController.pre_delete_trigger_hook.trigger(vo._type, vo, exec_as_server);
                if (!BooleanHandler.AND(res, true)) {
                    StatsController.register_stat_COMPTEUR('dao', 'deleteVOs', 'pre_delete_trigger_hook_rejection');
                    continue;
                }

                /**
                 * AJOUT de la suppression Dep by Dep => on ne laisse plus la BDD fait marcher les triggers de suppression, on gère
                 *  ça directement applicativement => attention à l'impact sur les perfs. L'objectif est surtout de s'assurer qu'on
                 *  appelle bien tous les triggers et entre autre les droits de suppression des dépendances
                 */
                let deps: VocusInfoVO[] = await ModuleVocusServer.getInstance().getVosRefsById(vo._type, vo.id, null, null, true);

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
                    let dep_ires: InsertOrDeleteQueryResult[] = await ModuleDAOServer.getInstance().deleteVOs_as_server(deps_to_delete, exec_as_server);

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
                    await this.post_delete_trigger_hook.trigger(vo._type, vo, exec_as_server);
                })*/);
            }

            return t.batch(queries);
        }).then(async (value: any) => {

            LogDBPerfServerController.log_db_query_perf_end(query_uid, 'deleteVOs');

            for (let i in deleted_vos) {
                let deleted_vo = deleted_vos[i];
                if (ConfigurationService.node_configuration.DEBUG_DELETEVOS) {
                    ConsoleHandler.log('DELETEVOS:post_delete_trigger_hook:deleted_vo:' + JSON.stringify(deleted_vo));
                }

                await DAOServerController.post_delete_trigger_hook.trigger(deleted_vo._type, deleted_vo, exec_as_server);
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
                ThrottledRefuseServerController.throttled_refuse({ [uid]: { [CLIENT_TAB_ID]: true } });
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
        let hooks = DAOServerController.access_hooks[datatable.vo_type] && DAOServerController.access_hooks[datatable.vo_type][access_type] ? DAOServerController.access_hooks[datatable.vo_type][access_type] : [];
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

        if (vo && !DAOServerController.checkAccessSync(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
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

    private async getBaseUrl(): Promise<string> {
        return ConfigurationService.node_configuration.BASE_URL;
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

        return await query(API_TYPE_ID).filter_by_ids(ranges).exec_as_server().select_count();
    }

    private async getNamedVoByName<U extends INamedVO>(API_TYPE_ID: string, name: string): Promise<U> {

        return await query(API_TYPE_ID).filter_by_text_eq('name', name, API_TYPE_ID, true).select_vo<U>();
    }

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
        if (!DAOServerController.checkAccessSync(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
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
        let res = await DAOServerController.filterVOsAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);

        if (!res) {
            return null;
        }

        let uid = await StackContext.get('UID');
        if (uid) {
            await ServerAnonymizationController.anonymise(datatable, res, uid, null);
        }

        return res;
    }

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
        if (!DAOServerController.checkAccessSync(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
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
        let res = await DAOServerController.filterVOsAccess(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ, vos);

        if (!res) {
            return null;
        }

        let uid = await StackContext.get('UID');
        if (uid) {
            await ServerAnonymizationController.anonymise(datatable, res, uid, null);
        }

        return res;
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

    /**
     * Insère les vos, et met l'id retourné par la bdd dans le vo et le retourne également en InsertOrDeleteQueryResult
     *  Version dédiée à l'api pour ne pas avoir le param exec_as_admin
     */
    private async insert_vos<T extends IDistantVOBase>(vos: T[]): Promise<InsertOrDeleteQueryResult[]> {
        return await this._insert_vos(vos, false);
    }

    /**
     * Insère les vos, et met l'id retourné par la bdd dans le vo et le retourne également en InsertOrDeleteQueryResult
     * @param exec_as_server si true, on ne vérifie pas les droits d'accès - Utilisable uniquement côté serveur, ne passe pas par l'API
     */
    private async _insert_vos<T extends IDistantVOBase>(vos: T[], exec_as_server: boolean = false): Promise<InsertOrDeleteQueryResult[]> {

        let time_in = Dates.now_ms();

        StatsController.register_stat_COMPTEUR('ModuleDAOServer', 'insert_vos', 'IN');
        if (DAOServerController.GLOBAL_UPDATE_BLOCKER) {
            let uid: number = StackContext.get('UID');
            let CLIENT_TAB_ID: string = StackContext.get('CLIENT_TAB_ID');
            if (uid && CLIENT_TAB_ID) {
                ThrottledRefuseServerController.throttled_refuse({ [uid]: { [CLIENT_TAB_ID]: true } });
            }
            StatsController.register_stat_COMPTEUR('ModuleDAOServer', 'insert_vos', 'GLOBAL_UPDATE_BLOCKER');
            return null;
        }

        // On vérifie qu'on peut faire un insert ou update
        if ((!vos) || (!vos.length)) {
            StatsController.register_stat_COMPTEUR('ModuleDAOServer', 'insert_vos', 'USELESS');
            return null;
        }

        vos = vos.filter((vo) =>
            (!!vo) && (!vo.id) && vo._type && VOsTypesManager.moduleTables_by_voType[vo._type] &&
            (exec_as_server || DAOServerController.checkAccessSync(VOsTypesManager.moduleTables_by_voType[vo._type], ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE)));

        if ((!vos) || (!vos.length)) {
            StatsController.register_stat_COMPTEUR('ModuleDAOServer', 'insert_vos', 'NOTHING_TO_DO');
            return null;
        }

        // On ajoute un filtrage via hook
        if (!exec_as_server) {
            let tmp_vos = [];
            let limit = ConfigurationService.node_configuration.MAX_POOL / 2;
            let promises_pipeline = new PromisePipeline(limit, 'ModuleDAOServer.insert_vos');
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
                StatsController.register_stat_COMPTEUR('ModuleDAOServer', 'insert_vos', 'FILTERED');
                return null;
            }
            vos = tmp_vos;

        }

        if (this.check_foreign_keys) {

            vos = await this.filterByForeignKeys(vos);
            if ((!vos) || (!vos.length)) {
                StatsController.register_stat_COMPTEUR('ModuleDAOServer', 'insert_vos', 'filteredByForeignKeys');
                return null;
            }
        }

        /**
         * Si les vos sont segmentés, on check en amont l'existence des tables segmentées
         *  car on ne peut pas les créer en parallèle. Du coup on les crée en amont si besoin
         */
        await this.confirm_segmented_tables_existence(vos);

        return new Promise<any[]>(async (resolve, reject) => {

            StatsController.register_stat_COMPTEUR('ModuleDAOServer', 'insert_vos', 'IN_PROMISE');

            let sqls = [];
            let bdd_versions = [];

            let time_before_getqueryfor_insertOrUpdateVO = Dates.now_ms();
            let promise_pipeline = new PromisePipeline(ConfigurationService.node_configuration.MAX_POOL / 2, 'ModuleDAOServer.insert_vos.2');
            for (let i in vos) {
                let vo: IDistantVOBase = vos[i];

                let moduleTable: ModuleTable<any> = VOsTypesManager.moduleTables_by_voType[vo._type];

                if (!moduleTable) {
                    return null;
                }

                /**
                 * MODIF MAJEURE : on retire ce comportement. On ne devrait jamais demander à insérer un objet avec un champs unique déjà défini.
                 *  on refuse l'insert dans ce cas, et charge au système qui a fait la demande en amont de mettre à jour son cache, et de refaire une demande adaptée
                 * ANCIEN COMPORTEMENT Si on a des fields de type unique, et pas de id fourni, on veut tester de charger depuis la bdd un objet avec
                 *  la même valeur de champ unique. si on trouve on passe en update au lieu d'insert
                 */
                // if (!vo.id) {
                //     try {
                //         vo.id = await this.check_uniq_indexes(vo, moduleTable);
                //     } catch (err) {
                //         continue;
                //     }
                // }

                await promise_pipeline.push(async () => {
                    let sql: string = await this.getqueryfor_insertOrUpdateVO(vo, null, exec_as_server);

                    if (!sql) {
                        StatsController.register_stat_COMPTEUR('ModuleDAOServer', 'insert_vos', 'NO_SQL');
                        return;
                    }

                    sqls[i] = sql;
                    bdd_versions[i] = moduleTable.get_bdd_version(vo);
                });
            }
            await promise_pipeline.end();
            StatsController.register_stat_QUANTITE('ModuleDAOServer', 'insert_vos', 'getqueryfor_insertOrUpdateVO', vos.length);
            StatsController.register_stat_DUREE('ModuleDAOServer', 'insert_vos', 'getqueryfor_insertOrUpdateVO', Dates.now_ms() - time_before_getqueryfor_insertOrUpdateVO);

            let results: InsertOrDeleteQueryResult[] = null;
            let resolved = false;
            let time_before_insert = Dates.now_ms();

            if (sqls.length > 0) {
                let query_uid = LogDBPerfServerController.log_db_query_perf_start('insert_vos', 'nb:' + sqls.length + ':first:' + sqls[0]);
                results = await ModuleServiceBase.db.tx(async (t) => {

                    let queries: any[] = [];

                    for (let i in sqls) {
                        let sql: string = sqls[i];
                        let vo = bdd_versions[i];

                        queries.push(t.oneOrNone(sql, vo));
                    }

                    return t.batch(queries);
                }).catch((reason) => {
                    StatsController.register_stat_COMPTEUR('ModuleDAOServer', 'insert_vos', 'ERROR');
                    ConsoleHandler.error('insert_vos :' + reason);
                    LogDBPerfServerController.log_db_query_perf_end(query_uid, 'insert_vos', 'nb:' + sqls.length + ':first:' + sqls[0]);
                    resolve(null);
                    resolved = true;
                });
                LogDBPerfServerController.log_db_query_perf_end(query_uid, 'insert_vos', 'ex: ' + sqls[0]);
            } else {
                StatsController.register_stat_COMPTEUR('ModuleDAOServer', 'insert_vos', 'NO_SQLS');
                ConsoleHandler.error('insert_vos : no sqls');
                resolve(null);
                return;
            }

            if (resolved) {
                return;
            }

            StatsController.register_stat_DUREE('ModuleDAOServer', 'insert_vos', 'RESULTS', Dates.now_ms() - time_before_insert);
            if (results && results.length) {
                StatsController.register_stat_QUANTITE('ModuleDAOServer', 'insert_vos', 'RESULTS', results.length);
            }

            if ((!results) || (vos.length != results.length)) {
                StatsController.register_stat_COMPTEUR('ModuleDAOServer', 'insert_vos', 'RESULTS_NOT_MATCHING_INPUT_NB');
                ConsoleHandler.error('insert_vos : results not matching input nb');
                resolve(null);
                return;
            }

            let InsertOrDeleteQueryResults: InsertOrDeleteQueryResult[] = [];
            promise_pipeline = new PromisePipeline(ConfigurationService.node_configuration.MAX_POOL / 2, 'ModuleDAOServer.insert_vos.3');
            for (let i in results) {
                let vo = vos[i];

                await promise_pipeline.push(async () => {

                    vo.id = parseInt(results[i].id.toString());
                    await DAOServerController.post_create_trigger_hook.trigger(vo._type, vo, exec_as_server);
                    InsertOrDeleteQueryResults.push(new InsertOrDeleteQueryResult(vo.id));
                });
            }
            await promise_pipeline.end();

            StatsController.register_stat_DUREE('ModuleDAOServer', 'insert_vos', 'OUT', Dates.now_ms() - time_in);
            StatsController.register_stat_COMPTEUR('ModuleDAOServer', 'insert_vos', 'OUT');
            resolve(InsertOrDeleteQueryResults);
        });
    }

    private async _insertOrUpdateVOs<T extends IDistantVOBase>(vos: T[], exec_as_server: boolean = false): Promise<InsertOrDeleteQueryResult[]> {

        if (!vos || !vos.length) {
            return null;
        }
        let inserts = vos.filter((vo) => !vo.id);
        let updates = vos.filter((vo) => !!vo.id);

        let res: InsertOrDeleteQueryResult[] = [];

        if (inserts && inserts.length) {
            let inserts_res = await this._insert_vos(inserts, exec_as_server);
            if (inserts_res && inserts_res.length) {
                res.push(...inserts_res);
            }
        }

        if (updates && updates.length) {

            let promises_pipeline = new PromisePipeline(ConfigurationService.node_configuration.MAX_POOL / 2, 'ModuleDAOServer._insertOrUpdateVOs');

            for (let i in updates) {
                let vo = updates[i];

                await promises_pipeline.push(async () => {
                    /**
                     * On doit traduire les valeurs des champs mais pas les field_ids au format api
                     */
                    // let table = VOsTypesManager.moduleTables_by_voType[vo._type];
                    // let fields = table.get_fields();
                    // for (let j in fields) {
                    //     let field = fields[j];

                    //     vo[field.field_id] = table.default_get_field_api_version(vo[field.field_id], field);
                    // }
                    vo = ModuleTable.default_get_api_version(vo, false);

                    let update_res = await query(vo._type).filter_by_id(vo.id).exec_as_server(exec_as_server).update_vos(vo);
                    if (update_res && update_res.length) {
                        res.push(...update_res);
                    }
                });
            }

            await promises_pipeline.end();
        }

        return res;
    }

    private async _insertOrUpdateVO(vo: IDistantVOBase, exec_as_server: boolean = false): Promise<InsertOrDeleteQueryResult> {

        if (!vo) {
            return null;
        }

        if (!vo.id) {
            let res = await this._insert_vos([vo], exec_as_server);
            if (res && res.length) {
                return res[0];
            }
        } else {

            /**
             * On doit traduire les valeurs des champs mais pas les field_ids au format api
             */
            // let table = VOsTypesManager.moduleTables_by_voType[vo._type];
            // let fields = table.get_fields();
            // for (let i in fields) {
            //     let field = fields[i];

            //     vo[field.field_id] = table.default_get_field_api_version(vo[field.field_id], field);
            // }
            vo = ModuleTable.default_get_api_version(vo, false);

            let res = await query(vo._type).filter_by_id(vo.id).exec_as_server(exec_as_server).update_vos(vo);
            if (res && res.length) {
                return res[0];
            }
        }

        return null;
    }

}
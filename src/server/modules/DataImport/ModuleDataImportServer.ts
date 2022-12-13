
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleContextFilter from '../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVO from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextFilterHandler from '../../../shared/modules/ContextFilter/ContextFilterHandler';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import IImportedData from '../../../shared/modules/DataImport/interfaces/IImportedData';
import ModuleDataImport from '../../../shared/modules/DataImport/ModuleDataImport';
import DataImportColumnVO from '../../../shared/modules/DataImport/vos/DataImportColumnVO';
import DataImportFormatVO from '../../../shared/modules/DataImport/vos/DataImportFormatVO';
import DataImportHistoricVO from '../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import DataImportLogVO from '../../../shared/modules/DataImport/vos/DataImportLogVO';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModulesManager from '../../../shared/modules/ModulesManager';
import ModuleTable from '../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import ModuleVO from '../../../shared/modules/ModuleVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import FileHandler from '../../../shared/tools/FileHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import ConfigurationService from '../../env/ConfigurationService';
import StackContext from '../../StackContext';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleBGThreadServer from '../BGThread/ModuleBGThreadServer';
import ModuleContextFilterServer from '../ContextFilter/ModuleContextFilterServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPostCreateTriggerHook from '../DAO/triggers/DAOPostCreateTriggerHook';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import DAOPreUpdateTriggerHook from '../DAO/triggers/DAOPreUpdateTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import PushDataServerController from '../PushData/PushDataServerController';
import DataImportBGThread from './bgthreads/DataImportBGThread';
import DataImportCronWorkersHandler from './DataImportCronWorkersHandler';
import DataImportModuleBase from './DataImportModuleBase/DataImportModuleBase';
import FormattedDatasStats from './FormattedDatasStats';
import ImportTypeCSVHandler from './ImportTypeHandlers/ImportTypeCSVHandler';
import ImportTypeXLSXHandler from './ImportTypeHandlers/ImportTypeXLSXHandler';
import ImportLogger from './logger/ImportLogger';
import ContextQueryVO, { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ImportTypeXMLHandler from './ImportTypeHandlers/ImportTypeXMLHandler';
import DataImportErrorLogVO from '../../../shared/modules/DataImport/vos/DataImportErrorLogVO';
import DAOPostUpdateTriggerHook from '../DAO/triggers/DAOPostUpdateTriggerHook';

export default class ModuleDataImportServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleDataImportServer.instance) {
            ModuleDataImportServer.instance = new ModuleDataImportServer();
        }
        return ModuleDataImportServer.instance;
    }

    private static instance: ModuleDataImportServer = null;

    private has_preloaded_difs_by_uid: boolean = false;
    private preloaded_difs_by_uid: { [uid: string]: DataImportFormatVO } = {};

    private constructor() {
        super(ModuleDataImport.getInstance().name);
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleDataImport.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            'fr-fr': 'Imports'
        }));


        let logs_access: AccessPolicyVO = new AccessPolicyVO();
        logs_access.group_id = group.id;
        logs_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        logs_access.translatable_name = ModuleDataImport.POLICY_LOGS_ACCESS;
        logs_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(logs_access, new DefaultTranslation({
            'fr-fr': 'Accès aux logs des imports'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = logs_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let bo_full_menu_access: AccessPolicyVO = new AccessPolicyVO();
        bo_full_menu_access.group_id = group.id;
        bo_full_menu_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_full_menu_access.translatable_name = ModuleDataImport.POLICY_BO_FULL_MENU_ACCESS;
        bo_full_menu_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_full_menu_access, new DefaultTranslation({
            'fr-fr': 'Accès complet aux imports - ADMIN'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        admin_access_dependency = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_full_menu_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleDataImport.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            'fr-fr': 'Administration des imports'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let logs_access_dependency = new PolicyDependencyVO();
        logs_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        logs_access_dependency.src_pol_id = bo_access.id;
        logs_access_dependency.depends_on_pol_id = logs_access.id;
        logs_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(logs_access_dependency);
        admin_access_dependency = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }

    public registerCrons(): void {
        DataImportCronWorkersHandler.getInstance();
    }

    public async configure() {

        // On enregistre le bgthread qui gère les imports
        ModuleBGThreadServer.getInstance().registerBGThread(DataImportBGThread.getInstance());

        // Triggers pour mettre à jour les dates
        let preCreateTrigger: DAOPreCreateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        let preUpdateTrigger: DAOPreUpdateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        preUpdateTrigger.registerHandler(DataImportHistoricVO.API_TYPE_ID, this, this.handleImportHistoricDateUpdate);
        preCreateTrigger.registerHandler(DataImportHistoricVO.API_TYPE_ID, this, this.handleImportHistoricDateCreation);

        // Triggers pour faire avancer l'import
        let postCreateTrigger: DAOPostCreateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        postCreateTrigger.registerHandler(DataImportHistoricVO.API_TYPE_ID, this, this.setImportHistoricUID);
        postCreateTrigger.registerHandler(DataImportFormatVO.API_TYPE_ID, this, this.handleImportFormatCreate);

        let postUpdateTrigger: DAOPostUpdateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);
        postUpdateTrigger.registerHandler(DataImportFormatVO.API_TYPE_ID, this, this.handleImportFormatUpdate);

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Annuler les imports en cours'
        }, 'import.cancel_unfinished_imports.body.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Annulation des imports en cours...'
        }, 'import.cancel_unfinished_imports.cancelling.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Annuler les imports en cours?'
        }, 'import.cancel_unfinished_imports.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Remplacer l\'import existant ?'
        }, 'import.new_historic_confirmation.body.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Remplacer l\'import existant'
        }, 'import.new_historic_confirmation.title.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Windows1252'
        }, 'import.encoding.windows1252.name'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'UTF8'
        }, 'import.encoding.utf8.name'));




        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Réimporter'
        }, 'reimport_component.reimporter.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Réimporter'
        }, 'fields.labels.ref.module_data_import_dih.__component__reimporter.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Ré-importation planifiée'
        }, 'imports.reimport.planified.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Annuler'
        }, 'import.format.modal.cancel.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Continuer'
        }, 'import.format.modal.continue.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Lignes KO'
        }, 'import.format.modal.nb_unvalidated_format_elements.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Lignes OK'
        }, 'import.format.modal.nb_validated_format_elements.___LABEL___'));


        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Format d\'import'
        }, 'fields.labels.ref.module_data_import_dif.___LABEL____file_id'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Format d\'import'
        }, 'fields.labels.ref.module_data_import_dif.___LABEL____post_exec_module_id'));


        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Format'
        }, 'fields.labels.ref.module_data_import_difc.___LABEL____data_import_format_id'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Index'
        }, 'import.column_position.index.name'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Titre'
        }, 'import.column_position.label.name'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'CSV'
        }, 'import.file_types.CSV.name'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'XLS'
        }, 'import.file_types.XLS.name'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'XLSX'
        }, 'import.file_types.XLSX.name'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Compléter'
        }, 'import.historic.types.EDIT'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Remplacer'
        }, 'import.historic.types.REPLACE'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'DEBUG'
        }, 'import.logs.lvl.DEBUG'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'ERREUR'
        }, 'import.logs.lvl.ERROR'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'CRITIQUE'
        }, 'import.logs.lvl.FATAL'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'INFO'
        }, 'import.logs.lvl.INFO'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'OK'
        }, 'import.logs.lvl.SUCCESS'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'ATTENTION'
        }, 'import.logs.lvl.WARN'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Le changement de statut est interdit'
        }, 'handleImportHistoricDateUpdate.change_state.error'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Par index'
        }, 'import.sheet_position.index.name'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Par nom'
        }, 'import.sheet_position.label.name'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'SCAN'
        }, 'import.sheet_position.scan.name'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Echec lors de l\'importation'
        }, 'import.state.failed_importation'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Echec lors du post-traitement'
        }, 'import.state.failed_posttreatment'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Formatté'
        }, 'import.state.formatted'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Formattage...'
        }, 'import.state.formatting'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Importation interdite'
        }, 'import.state.importation_not_allowed'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Importé'
        }, 'import.state.imported'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Importation...'
        }, 'import.state.importing'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'En attente de ré-importation'
        }, 'import.state.needs_reimport'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Post-traité'
        }, 'import.state.posttreated'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Post-traitement...'
        }, 'import.state.posttreating'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Prêt à importer'
        }, 'import.state.ready_to_import'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Uploadé'
        }, 'import.state.uploaded'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Imports'
        }, 'menu.menuelements.admin.DataImportAdminVueModule.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Colonnes'
        }, 'menu.menuelements.admin.DataImportColumnVO.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Formats'
        }, 'menu.menuelements.admin.DataImportFormatVO.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Historiques'
        }, 'menu.menuelements.admin.DataImportHistoricVO.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Logs'
        }, 'menu.menuelements.admin.DataImportLogVO.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Import échoué. Voir les logs.'
        }, 'import.errors.failed_importation_see_logs'));


        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Télécharger' },
            'file.download.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Upload : OK' },
            'file.upload.success'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Echec lors de l\'import voir les logs ' },
            'import.errors.failed_post_treatement_see_logs'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Format' },
            'import.format.modal.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Import' },
            'import.import.modal.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Télécharger le fichier importé' },
            'import.modal.imported_file_link.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Nouvel import' },
            'import.modal.new_import.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Voir les logs' },
            'import.modal.see_logs.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Post-traitement' },
            'import.posttreat.modal.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Formatté' },
            'import.success.formatted'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Importé' },
            'import.success.imported'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Post-traité' },
            'import.success.posttreated'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Upload en cours...' },
            'import.upload_started.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Autovalidation' },
            'import.success.autovalidation'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Import impossible' },
            'importJSON.failed.___LABEL___'));
    }


    public registerServerApiHandlers() {
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDataImport.APINAME_getDataImportHistorics, this.getDataImportHistorics.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDataImport.APINAME_getDataImportHistoric, this.getDataImportHistoric.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDataImport.APINAME_getDataImportLogs, this.getDataImportLogs.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDataImport.APINAME_getDataImportFiles, this.getDataImportFiles.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDataImport.APINAME_getDataImportFile, this.getDataImportFile.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDataImport.APINAME_getDataImportColumnsFromFormatId, this.getDataImportColumnsFromFormatId.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDataImport.APINAME_reimportdih, this.reimportdih.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDataImport.APINAME_importJSON, this.importJSON.bind(this));
    }

    public async importJSON(import_json: string, import_on_vo: IDistantVOBase): Promise<IDistantVOBase[]> {

        let vos: IDistantVOBase[] = null;
        let vos_by_type_and_initial_id: { [_type: string]: { [initial_id: number]: IDistantVOBase } } = {};
        try {
            vos = JSON.parse(import_json);
            if (!vos) {
                throw new Error('no datas to import');
            }

            for (let i in vos) {
                let vo = vos[i];
                let table = VOsTypesManager.moduleTables_by_voType[vo._type];
                if (!table) {
                    throw new Error('unknown table:' + vo._type);
                }

                vo = table.from_api_version(vo);
                if (!vos_by_type_and_initial_id[vo._type]) {
                    vos_by_type_and_initial_id[vo._type] = {};
                }
                vos_by_type_and_initial_id[vo._type][vo.id] = vo;
                vos[i] = vo;
            }

            let is_update: boolean = false;
            let updated_item: IDistantVOBase = null;
            if (import_on_vo != null) {

                /**
                 * On doit vérifier qu'on retrouve un objet de ce type (et un seul) dans les vos qu'on s'apprete à importer
                 */
                if ((!vos_by_type_and_initial_id[import_on_vo._type]) ||
                    (Object.keys(vos_by_type_and_initial_id[import_on_vo._type]).length != 1)) {
                    throw new Error('Failed find item to import on vo from JSON:' + import_on_vo._type + ':import_json:' + import_json);
                }

                is_update = true;
                updated_item = vos_by_type_and_initial_id[import_on_vo._type][ObjectHandler.getInstance().getFirstAttributeName(vos_by_type_and_initial_id[import_on_vo._type])];
            }

            /**
             * On check les dépendances des items et on essaie d'ordonner l'import pour pas avoir de soucis sur les liaisons
             */
            let ordered_vos: IDistantVOBase[] = [];
            let ordered_vos_by_type_and_initial_id: { [_type: string]: { [initial_id: number]: IDistantVOBase } } = {};
            /**
             * On stocke les fields de ref, dans un tableau par vo_type cible de la liaison et id_initial, pour que quand on insère cet élement on puisse
             *      trouver facilement les refs et modifier la valeur à importer avec le nouvel id qu'on vient d'insérer.
             */
            let ref_fields: { [_type_vo_target: string]: { [id_initial_vo_target: number]: { [_type_vo_src: string]: { [id_initial_vo_src: number]: { [field_id_vo_src: string]: boolean } } } } } = {};
            let blocked = this.order_vos_to_import(
                vos, vos_by_type_and_initial_id,
                ordered_vos, ordered_vos_by_type_and_initial_id,
                ref_fields
            );

            if (blocked) {
                throw new Error('Import impossible: refs cycliques:' + import_json);
            }

            return await this.import_datas(
                ref_fields,
                ordered_vos,
                ordered_vos_by_type_and_initial_id,
                is_update,
                import_on_vo,
                updated_item
            );
        } catch (error) {
            ConsoleHandler.error('importJSON:' + error);
            await PushDataServerController.getInstance().notifySimpleERROR(
                StackContext.get('UID'),
                StackContext.get('CLIENT_TAB_ID'),
                'importJSON.failed.___LABEL___'
            );
        }
        return null;
    }

    public async getDataImportHistorics(num: number): Promise<DataImportHistoricVO[]> {
        return await query(DataImportHistoricVO.API_TYPE_ID).filter_by_num_eq('data_import_format_id', num).set_limit(50).select_vos<DataImportHistoricVO>();
    }

    public async getDataImportHistoric(num: number): Promise<DataImportHistoricVO> {
        return await query(DataImportHistoricVO.API_TYPE_ID).filter_by_id(num).select_vo<DataImportHistoricVO>();
    }

    public async getDataImportLogs(num: number): Promise<DataImportLogVO[]> {
        return await query(DataImportLogVO.API_TYPE_ID).filter_by_num_eq('data_import_format_id', num).set_limit(50).select_vos<DataImportLogVO>();
    }

    public async getDataImportFiles(): Promise<DataImportFormatVO[]> {
        return await query(DataImportFormatVO.API_TYPE_ID).select_vos<DataImportFormatVO>();
    }

    /**
     * N'utiliser que dans le cadre de l'init des formats de type d'import, on preload un cache et on le maintien pas à jour donc si on veut des données à jour => query
     */
    public async getDataImportFile(text: string): Promise<DataImportFormatVO> {

        if (!this.has_preloaded_difs_by_uid) {
            await this.preload_difs_by_uid();
        }

        return this.preloaded_difs_by_uid[text];
    }

    public async getImportFormatsForApiTypeId(API_TYPE_ID: string): Promise<DataImportFormatVO[]> {
        return await query(DataImportFormatVO.API_TYPE_ID).filter_by_text_eq('api_type_id', API_TYPE_ID).select_vos<DataImportFormatVO>();
    }

    public async getDataImportColumnsFromFormatId(num: number): Promise<DataImportColumnVO[]> {
        return await query(DataImportColumnVO.API_TYPE_ID).filter_by_num_eq('data_import_format_id', num).select_vos<DataImportColumnVO>();
    }

    /**
     * 1 - Récupérer les différents formats possible,
     * 2 - Choisir le format le plus adapté
     * 3 - Importer dans le vo intermédiaire
     * 4 - Mettre à jour le status et informer le client de la mise à jour du DAO
     *
     * Si le fasttrack est activé on ne log pas et on ne fait aucun insert en base
     */
    public async formatDatas(importHistoric: DataImportHistoricVO): Promise<IImportedData[]> {

        if (!importHistoric.use_fast_track) {
            await ImportLogger.getInstance().log(importHistoric, null, 'Début de l\'importation', DataImportLogVO.LOG_LEVEL_INFO);
        }

        // On commence par nettoyer la table, quelle que soit l'issue
        let raw_api_type_id = ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(importHistoric.api_type_id);
        if (!importHistoric.use_fast_track) {
            await ModuleDAOServer.getInstance().truncate(raw_api_type_id);
        }

        // 1
        let formats: DataImportFormatVO[] = await this.getImportFormatsForApiTypeId(importHistoric.api_type_id);
        if ((!formats) || (!formats.length)) {
            await this.logAndUpdateHistoric(importHistoric, null, ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED, "Aucun format pour l'import", "import.errors.failed_formatting_no_format", DataImportLogVO.LOG_LEVEL_FATAL);
            return null;
        }

        /**
         * On test le cas fichier vide :
         */
        let fileVO: FileVO = await query(FileVO.API_TYPE_ID).filter_by_id(importHistoric.file_id).select_vo<FileVO>();
        let file_size = fileVO ? FileHandler.getInstance().get_file_size(fileVO.path) : null;
        if (!file_size) {
            if ((!!importHistoric) && (!!importHistoric.id)) {
                await this.logAndUpdateHistoric(importHistoric, null, ModuleDataImport.IMPORTATION_STATE_POSTTREATED, "Aucune donnée formattable", "import.errors.failed_formatting_no_data", DataImportLogVO.LOG_LEVEL_DEBUG);
                return null;
            }
        }

        let formats_by_ids: { [id: number]: DataImportFormatVO } = VOsTypesManager.getInstance().vosArray_to_vosByIds(formats);

        let all_formats_datas: { [format_id: number]: IImportedData[] } = {};

        let max_formattedDatasStats: FormattedDatasStats = new FormattedDatasStats();
        let moduleTable: ModuleTable<any> = VOsTypesManager.moduleTables_by_voType[raw_api_type_id];

        let has_datas: boolean = false;

        // On priorise les formats de type colonnes nommées, car si on arrive à remplir l'un de ces formats, on a pas besoin de tester les autres
        formats.sort((a: DataImportFormatVO, b: DataImportFormatVO) => {
            if (a.type_column_position < b.type_column_position) {
                return -1;
            }
            if (a.type_column_position > b.type_column_position) {
                return 1;
            }

            return 0;
        });

        for (let i in formats) {
            let format: DataImportFormatVO = formats[i];
            let columns: DataImportColumnVO[] = await ModuleDataImport.getInstance().getDataImportColumnsFromFormatId(format.id);

            if ((!format) || ((!columns) || (!columns.length))) {
                if (!importHistoric.use_fast_track) {
                    await ImportLogger.getInstance().log(importHistoric, format, "Impossible de charger un des formats, ou il n'a pas de colonnes", DataImportLogVO.LOG_LEVEL_ERROR);
                }
                continue;
            }

            // Ensuite on demande au module responsable de l'import si on a des filtrages à appliquer
            let postTreatementModuleVO: ModuleVO = await query(ModuleVO.API_TYPE_ID).filter_by_id(format.post_exec_module_id).select_vo<ModuleVO>();

            if ((!postTreatementModuleVO) || (!postTreatementModuleVO.name)) {
                if (!importHistoric.use_fast_track) {
                    await ImportLogger.getInstance().log(importHistoric, format, "Impossible de retrouver le module pour tester le format", DataImportLogVO.LOG_LEVEL_ERROR);
                }
                continue;
            }

            let postTraitementModule: DataImportModuleBase<any> = (ModulesManager.getInstance().getModuleByNameAndRole(postTreatementModuleVO.name, DataImportModuleBase.DataImportRoleName)) as DataImportModuleBase<any>;
            if (!postTraitementModule) {
                if (!importHistoric.use_fast_track) {
                    await ImportLogger.getInstance().log(importHistoric, format, "Impossible de retrouver le module pour tester le format", DataImportLogVO.LOG_LEVEL_ERROR);
                }
                continue;
            }

            /**
             * Si on est sur un import de type batch, on change de méthode et on met directement les lignes en BDD
             */
            let datas: IImportedData[] = [];
            switch (format.type) {
                case DataImportFormatVO.TYPE_CSV:
                    if ((!importHistoric.use_fast_track) && format.batch_import) {
                        if (!await ImportTypeCSVHandler.getInstance().importFileBatchMode(format, columns, importHistoric, format.type_column_position != DataImportFormatVO.TYPE_COLUMN_POSITION_LABEL)) {
                            /**
                             * Format invalide
                             */
                            continue;
                        } else {
                            has_datas = true;
                        }
                    } else {
                        datas = await ImportTypeCSVHandler.getInstance().importFile(format, columns, importHistoric, format.type_column_position != DataImportFormatVO.TYPE_COLUMN_POSITION_LABEL);
                    }
                    break;
                case DataImportFormatVO.TYPE_XML:
                    datas = await ImportTypeXMLHandler.getInstance().importFile(format, columns, importHistoric, format.type_column_position != DataImportFormatVO.TYPE_COLUMN_POSITION_LABEL);
                    break;
                case DataImportFormatVO.TYPE_XLS:
                case DataImportFormatVO.TYPE_XLSX:
                default:
                    datas = await ImportTypeXLSXHandler.getInstance().importFile(format, columns, importHistoric, format.type_column_position != DataImportFormatVO.TYPE_COLUMN_POSITION_LABEL);
            }

            if (!datas) {
                continue;
            }

            let pre_validation_formattedDatasStats: FormattedDatasStats = ((!importHistoric.use_fast_track) && format.batch_import) ?
                await this.countValidatedDataAndColumnsBatchMode(raw_api_type_id, moduleTable, format.id) : this.countValidatedDataAndColumns(datas, moduleTable, format.id);
            let prevalidation_datas = datas;
            datas = ((!importHistoric.use_fast_track) && format.batch_import) ?
                [] : await postTraitementModule.validate_formatted_data(datas, importHistoric, format);

            if (format.save_error_logs) {
                let error_logs: DataImportErrorLogVO[] = [];

                for (let ed in datas) {
                    let data: IImportedData = datas[ed];

                    if (data.importation_state != ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED) {
                        continue;
                    }

                    let log: DataImportErrorLogVO = DataImportErrorLogVO.createNew(data.not_validated_msg, importHistoric.id);
                    error_logs.push(log);
                }

                await ModuleDAO.getInstance().insertOrUpdateVOs(error_logs);
            }

            has_datas = has_datas || ((pre_validation_formattedDatasStats.nb_row_unvalidated + pre_validation_formattedDatasStats.nb_row_validated) > 0);
            all_formats_datas[format.id] = datas;

            let formattedDatasStats: FormattedDatasStats = ((!importHistoric.use_fast_track) && format.batch_import) ?
                await this.countValidatedDataAndColumnsBatchMode(raw_api_type_id, moduleTable, format.id) : this.countValidatedDataAndColumns(datas, moduleTable, format.id);

            if ((formattedDatasStats.nb_fields_validated > 0) && (formattedDatasStats.nb_row_validated > 0) && (format.type_column_position == DataImportFormatVO.TYPE_COLUMN_POSITION_LABEL)) {
                max_formattedDatasStats = formattedDatasStats;
                break;
            }

            if (formattedDatasStats.nb_fields_validated > max_formattedDatasStats.nb_fields_validated) {
                max_formattedDatasStats = formattedDatasStats;
            }

            // Si on a pas de données, et qu'on est sur un type position label, on veut comprendre
            if (((!formattedDatasStats.nb_fields_validated) || (!formattedDatasStats.nb_row_validated)) && (format.type_column_position == DataImportFormatVO.TYPE_COLUMN_POSITION_LABEL)) {

                // Si on avait des datas avant la validation et qu'on en a plus après, ça intéresse de savoir pourquoi on a tout invalidé.
                // Donc on va chercher les raisons évoquées et on les résume
                if ((pre_validation_formattedDatasStats.nb_row_validated > 0) || (pre_validation_formattedDatasStats.nb_fields_validated > 0)) {
                    let messages_stats: { [msg: string]: number } = {};

                    if ((!format.batch_import) || importHistoric.use_fast_track) {

                        for (let data_i in datas) {
                            let data: IImportedData = datas[data_i];

                            if ((!!data.not_validated_msg) && (data.not_validated_msg != '')) {
                                if (!messages_stats[data.not_validated_msg]) {
                                    messages_stats[data.not_validated_msg] = 0;
                                }
                                messages_stats[data.not_validated_msg]++;
                            }
                        }
                    }

                    if (!importHistoric.use_fast_track) {
                        await ImportLogger.getInstance().log(importHistoric, format, "Toutes les données sont invalides. Nb de lignes identifiées : " + prevalidation_datas.length + ".", DataImportLogVO.LOG_LEVEL_ERROR);
                        for (let msg in messages_stats) {
                            await ImportLogger.getInstance().log(importHistoric, format, "Dont " + messages_stats[msg] + " lignes invalidées car : " + msg + ".", DataImportLogVO.LOG_LEVEL_WARN);
                        }
                    }
                }
            }
        }

        if ((!has_datas) || (!max_formattedDatasStats.format_id) || (max_formattedDatasStats.nb_fields_validated <= 0) || (max_formattedDatasStats.nb_row_validated <= 0)) {
            await this.logAndUpdateHistoric(importHistoric, null, ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED, "Aucune donnée formattable", "import.errors.failed_formatting_no_data", DataImportLogVO.LOG_LEVEL_FATAL);
            return null;
        }

        importHistoric.data_import_format_id = max_formattedDatasStats.format_id;
        importHistoric.nb_row_unvalidated = max_formattedDatasStats.nb_row_unvalidated;
        importHistoric.nb_row_validated = max_formattedDatasStats.nb_row_validated;

        let format_ = formats_by_ids[importHistoric.data_import_format_id];
        if ((!format_.batch_import) && (!importHistoric.use_fast_track)) {
            if (format_.use_multiple_connections) {
                await ModuleDAOServer.getInstance().insert_without_triggers_using_COPY(all_formats_datas[importHistoric.data_import_format_id]);
                // await ModuleDAOServer.getInstance().insertOrUpdateVOsMulticonnections(
                //     all_formats_datas[importHistoric.data_import_format_id]);
                // /*Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2))*/100000);
            } else {
                await ModuleDAO.getInstance().insertOrUpdateVOs(all_formats_datas[importHistoric.data_import_format_id]);
            }
        }

        // 4
        await this.logAndUpdateHistoric(importHistoric, null, ModuleDataImport.IMPORTATION_STATE_FORMATTED, 'Formattage terminé', "import.success.formatted", DataImportLogVO.LOG_LEVEL_SUCCESS);

        return all_formats_datas[importHistoric.data_import_format_id];
    }

    /**
     * 1 - Récupérer le format validé, et les données validées
     * 2 - Importer dans le vo cible, suivant le mode d'importation (remplacement ou mise à jour)
     * 3 - Mettre à jour le status et informer le client
     * @param importHistoric
     */
    public async importDatas(importHistoric: DataImportHistoricVO, fasttrack_datas: IImportedData[] = null): Promise<void> {

        //  1 - Récupérer le format validé, et les données importées ()
        let format: DataImportFormatVO = await query(DataImportFormatVO.API_TYPE_ID).filter_by_id(importHistoric.data_import_format_id).select_vo<DataImportFormatVO>();

        if ((!importHistoric.use_fast_track) && format.batch_import) {
            await this.importDatas_batch_mode(importHistoric, format);
        } else {
            await this.importDatas_classic(importHistoric, format, fasttrack_datas);
        }
    }

    public async importDatas_classic(importHistoric: DataImportHistoricVO, format: DataImportFormatVO, fasttrack_datas: IImportedData[] = null): Promise<void> {

        //  1 - Récupérer le format validé, et les données importées ()
        let raw_imported_datas: IImportedData[] =
            importHistoric.use_fast_track ? fasttrack_datas :
                await query(ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(format.api_type_id)).select_vos<IImportedData>();

        // On garde que les données, validées et importées
        let validated_imported_datas: IImportedData[] = [];
        for (let i in raw_imported_datas) {
            if (raw_imported_datas[i].importation_state != ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT) {
                continue;
            }
            validated_imported_datas.push(raw_imported_datas[i]);
        }

        if ((!format) || (!format.post_exec_module_id)) {
            await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION, "Aucune data formattée ou pas de module configuré", "import.errors.failed_importation_see_logs", DataImportLogVO.LOG_LEVEL_FATAL);
            return;
        }

        if ((!validated_imported_datas) || (!validated_imported_datas.length)) {
            await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION, "Aucune data validée pour importation", "import.errors.failed_importation_see_logs", DataImportLogVO.LOG_LEVEL_FATAL);
            return;
        }

        await this.importDatas_batch(importHistoric, format, validated_imported_datas);

        // 3 - Mettre à jour le status et informer le client
        await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_IMPORTED, "Import terminé", "import.success.imported", DataImportLogVO.LOG_LEVEL_SUCCESS);
    }

    public async importDatas_batch_mode(importHistoric: DataImportHistoricVO, format: DataImportFormatVO): Promise<void> {

        if ((!format) || (!format.post_exec_module_id)) {
            await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION, "Aucune data formattée ou pas de module configuré", "import.errors.failed_importation_see_logs", DataImportLogVO.LOG_LEVEL_FATAL);
            return;
        }

        //  1 - Récupérer les données importées
        let had_datas = true;
        let raw_api_type_id = ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(format.api_type_id);

        let offset = 0;
        let batch_size = await this.get_batch_mode_batch_size(raw_api_type_id, importHistoric, format, ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT);

        while (had_datas) {

            let validated_imported_datas: IImportedData[] = await this.get_batch_mode_batch_datas(raw_api_type_id, importHistoric, format, offset, batch_size, ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT);

            had_datas = validated_imported_datas && (validated_imported_datas.length > 0);
            if (!had_datas) {
                break;
            }

            offset += validated_imported_datas.length;

            await this.importDatas_batch(importHistoric, format, validated_imported_datas);
        }

        if (!offset) {
            await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION, "Aucune data validée pour importation", "import.errors.failed_importation_see_logs", DataImportLogVO.LOG_LEVEL_FATAL);
            return;
        }

        // 3 - Mettre à jour le status et informer le client
        await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_IMPORTED, "Import terminé", "import.success.imported", DataImportLogVO.LOG_LEVEL_SUCCESS);
    }

    /**
     * 1 - Récupérer le format validé, et les données importées ()
     * 2 - Post-traiter les données
     * 3 - Mettre à jour le status et informer le client
     */
    public async posttreatDatas(importHistoric: DataImportHistoricVO, posttreatDatas: IImportedData[] = null): Promise<void> {

        //  1 - Récupérer le format validé, et les données importées ()
        let format: DataImportFormatVO = await query(DataImportFormatVO.API_TYPE_ID).filter_by_id(importHistoric.data_import_format_id).select_vo<DataImportFormatVO>();

        if ((!format) || (!format.post_exec_module_id)) {
            await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT, "Aucune data formattée ou pas de module configuré", "import.errors.failed_post_treatement_see_logs", DataImportLogVO.LOG_LEVEL_FATAL);
            return;
        }

        let postTreated = false;
        if ((!importHistoric.use_fast_track) && format.batch_import) {
            postTreated = await this.posttreatDatas_batch_mode(importHistoric, format);
        } else {
            postTreated = await this.posttreatDatas_classic(importHistoric, format, posttreatDatas);
        }

        if (!postTreated) {
            await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT, "Le post-traitement a échoué", "import.errors.failed_post_treatement_see_logs", DataImportLogVO.LOG_LEVEL_FATAL);
            return;
        }

        //  3 - Mettre à jour le status et informer le client
        // à la fin on indique le bon fonctionnement
        // Pour l'instant on informe que l'auteur, mais en fait à terme ce qui serait top (mais à réfléchir par ce que très gourmand potentiellement)
        //  ça serait d'informer tout le monde, directement en post creat et post update, et post delete, de toutes les modifs de DAO...
        //  comme ça la data se mettrait à jour en temps réel dans l'appli, même si c'est un autre utilisateur qui fait un import

        // Alors c'est tellement gourmand que même pour un user on le fait pour l'instant...
        // let api_type_ids: string[] = postTraitementModule.get_merged_api_type_ids();
        // for (let i in api_type_ids) {
        //     await PushDataServerController.getInstance().notifyDAOGetVos(importHistoric.user_id, api_type_ids[i]);
        // }

        await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_POSTTREATED, "Fin import : " + Dates.format(Dates.now(), "Y-MM-DD HH:mm"), "import.success.posttreated", DataImportLogVO.LOG_LEVEL_SUCCESS);
    }

    public async posttreatDatas_batch_mode(importHistoric: DataImportHistoricVO, format: DataImportFormatVO): Promise<boolean> {

        //  1 - Récupérer les données importées
        let had_datas = true;
        let raw_api_type_id = ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(format.api_type_id);

        let offset = 0;
        let batch_size = await this.get_batch_mode_batch_size(raw_api_type_id, importHistoric, format, ModuleDataImport.IMPORTATION_STATE_IMPORTED);

        while (had_datas) {

            /**
             * Si le module de posttraitement propose un hook pour remplacer le chargement par batch par défaut, on l'utilise
             */
            let postTreatementModuleVO: ModuleVO = await query(ModuleVO.API_TYPE_ID).filter_by_id(format.post_exec_module_id).select_vo<ModuleVO>();
            let postTraitementModule: DataImportModuleBase<any> = (ModulesManager.getInstance().getModuleByNameAndRole(postTreatementModuleVO.name, DataImportModuleBase.DataImportRoleName)) as DataImportModuleBase<any>;

            let validated_imported_datas: IImportedData[] = null;
            if (postTraitementModule.hook_get_batch_mode_batch_datas) {
                validated_imported_datas = await postTraitementModule.hook_get_batch_mode_batch_datas(raw_api_type_id, importHistoric, format, offset, batch_size, ModuleDataImport.IMPORTATION_STATE_IMPORTED);
            } else {
                validated_imported_datas = await this.get_batch_mode_batch_datas(raw_api_type_id, importHistoric, format, offset, batch_size, ModuleDataImport.IMPORTATION_STATE_IMPORTED);
            }

            had_datas = validated_imported_datas && (validated_imported_datas.length > 0);
            if (!had_datas) {
                break;
            }

            offset += validated_imported_datas.length;

            if (!await this.posttreat_batch(importHistoric, format, validated_imported_datas)) {
                for (let i in validated_imported_datas) {
                    let validated_imported_data = validated_imported_datas[i];
                    validated_imported_data.importation_state = ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT;
                }

                if (format.use_multiple_connections) {
                    await ModuleDAOServer.getInstance().insert_without_triggers_using_COPY(validated_imported_datas);
                    // await ModuleDAOServer.getInstance().insertOrUpdateVOsMulticonnections(
                    //     validated_imported_datas);
                    // /*Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2))*/100000);
                } else {
                    await ModuleDAO.getInstance().insertOrUpdateVOs(validated_imported_datas);
                }

                return false;

            } else {
                for (let i in validated_imported_datas) {
                    let validated_imported_data = validated_imported_datas[i];
                    validated_imported_data.importation_state = ModuleDataImport.IMPORTATION_STATE_POSTTREATED;
                }

                if (format.use_multiple_connections) {
                    await ModuleDAOServer.getInstance().insert_without_triggers_using_COPY(validated_imported_datas);
                    // await ModuleDAOServer.getInstance().insertOrUpdateVOsMulticonnections(
                    //     validated_imported_datas);
                    // /*Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2))*/100000);
                } else {
                    await ModuleDAO.getInstance().insertOrUpdateVOs(validated_imported_datas);
                }
            }
        }

        if (!offset) {
            await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION, "Aucune data validée pour importation", "import.errors.failed_importation_see_logs", DataImportLogVO.LOG_LEVEL_FATAL);
            return false;
        }

        return true;
    }

    public async posttreatDatas_classic(importHistoric: DataImportHistoricVO, format: DataImportFormatVO, fasttrack_datas: IImportedData[] = null): Promise<boolean> {

        //  1 - Récupérer le format validé, et les données importées ()
        let raw_imported_datas: IImportedData[] =
            importHistoric.use_fast_track ? fasttrack_datas :
                await query(ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(format.api_type_id)).select_vos<IImportedData>();

        if ((!format) || (!format.post_exec_module_id) || (!raw_imported_datas) || (!raw_imported_datas.length)) {
            await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT, "Aucune data formattée ou pas de module configuré", "import.errors.failed_post_treatement_see_logs", DataImportLogVO.LOG_LEVEL_FATAL);
            return false;
        }

        // On garde que les données, validées et importées
        let validated_imported_datas: IImportedData[] = [];
        for (let i in raw_imported_datas) {
            if (raw_imported_datas[i].importation_state != ModuleDataImport.IMPORTATION_STATE_IMPORTED) {
                continue;
            }
            validated_imported_datas.push(raw_imported_datas[i]);
        }

        if (!importHistoric.use_fast_track) {

            if (await this.posttreat_batch(importHistoric, format, validated_imported_datas)) {

                for (let i in validated_imported_datas) {
                    let validated_imported_data = validated_imported_datas[i];
                    validated_imported_data.importation_state = ModuleDataImport.IMPORTATION_STATE_POSTTREATED;
                }

                if (format.use_multiple_connections) {
                    await ModuleDAOServer.getInstance().insert_without_triggers_using_COPY(validated_imported_datas);
                    // await ModuleDAOServer.getInstance().insertOrUpdateVOsMulticonnections(
                    //     validated_imported_datas);
                    // /*Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2))*/100000);
                } else {
                    await ModuleDAO.getInstance().insertOrUpdateVOs(validated_imported_datas);
                }

                return true;
            } else {
                for (let i in validated_imported_datas) {
                    let validated_imported_data = validated_imported_datas[i];
                    validated_imported_data.importation_state = ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT;
                }

                if (format.use_multiple_connections) {
                    await ModuleDAOServer.getInstance().insert_without_triggers_using_COPY(validated_imported_datas);
                    // await ModuleDAOServer.getInstance().insertOrUpdateVOsMulticonnections(
                    //     validated_imported_datas);
                    // /*Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2))*/100000);
                } else {
                    await ModuleDAO.getInstance().insertOrUpdateVOs(validated_imported_datas);
                }
            }

            return false;
        }

        return await this.posttreat_batch(importHistoric, format, validated_imported_datas);
    }

    public async posttreat_batch(importHistoric: DataImportHistoricVO, format: DataImportFormatVO, validated_imported_datas: IImportedData[]): Promise<boolean> {
        let postTreatementModuleVO: ModuleVO = await query(ModuleVO.API_TYPE_ID).filter_by_id(format.post_exec_module_id).select_vo<ModuleVO>();

        if ((!validated_imported_datas) || (!validated_imported_datas.length)) {
            await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT, "Aucune data importée", "import.errors.failed_post_treatement_see_logs", DataImportLogVO.LOG_LEVEL_FATAL);
            return false;
        }
        if ((!postTreatementModuleVO) || (!postTreatementModuleVO.name)) {
            await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT, "Impossible de retrouver le module", "import.errors.failed_post_treatement_see_logs", DataImportLogVO.LOG_LEVEL_FATAL);
            return false;
        }

        //  2 - Post-traiter les données
        // PostTraitement des données avec les hooks pour générer les questions et intégrer ce qui peut l'être
        let postTraitementModule: DataImportModuleBase<any> = (ModulesManager.getInstance().getModuleByNameAndRole(postTreatementModuleVO.name, DataImportModuleBase.DataImportRoleName)) as DataImportModuleBase<any>;
        try {
            if (!await postTraitementModule.hook_merge_imported_datas_in_database(validated_imported_datas, importHistoric, format)) {
                return false;
            }
        } catch (error) {
            ConsoleHandler.error(error);
            await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT, "Le post-traitement a échoué :" + error, "import.errors.failed_post_treatement_see_logs", DataImportLogVO.LOG_LEVEL_FATAL);
            return false;
        }

        return true;
    }

    public async updateImportHistoric(importHistoric: DataImportHistoricVO) {
        await ModuleDAO.getInstance().insertOrUpdateVO(importHistoric);
        await PushDataServerController.getInstance().notifyDAOGetVoById(importHistoric.user_id, null, DataImportHistoricVO.API_TYPE_ID, importHistoric.id);
    }

    public async logAndUpdateHistoric(importHistoric: DataImportHistoricVO, format: DataImportFormatVO, import_state: number, logmsg: string, notif_code: string, log_lvl: number) {

        importHistoric.state = import_state;

        if (importHistoric.use_fast_track) {
            return;
        }

        // On choisit la notif à envoyer
        switch (log_lvl) {
            case DataImportLogVO.LOG_LEVEL_FATAL:
            case DataImportLogVO.LOG_LEVEL_ERROR:
                await PushDataServerController.getInstance().notifySimpleERROR(importHistoric.user_id, null, notif_code);
                break;
            case DataImportLogVO.LOG_LEVEL_WARN:
                await PushDataServerController.getInstance().notifySimpleWARN(importHistoric.user_id, null, notif_code);
                break;
            case DataImportLogVO.LOG_LEVEL_SUCCESS:
                await PushDataServerController.getInstance().notifySimpleSUCCESS(importHistoric.user_id, null, notif_code);
                break;
            case DataImportLogVO.LOG_LEVEL_INFO:
                await PushDataServerController.getInstance().notifySimpleINFO(importHistoric.user_id, null, notif_code);
                break;
            case DataImportLogVO.LOG_LEVEL_DEBUG:
            default:
                break;
        }

        await ImportLogger.getInstance().log(importHistoric, format, logmsg, log_lvl);
        await this.updateImportHistoric(importHistoric);
    }

    /**
     * Renvoie le nombre de segments de datas à charger en mode batch. Par défaut un segment est une ligne de la base donc on renvoie autant de segment que de lignes ciblées par le format
     * @param raw_api_type_id
     * @param importHistoric
     * @param format
     * @param importation_state
     */
    protected async get_batch_mode_batch_size(raw_api_type_id: string, importHistoric: DataImportHistoricVO, format: DataImportFormatVO, importation_state: number) {
        return format.batch_size;
    }

    /**
     * Renvoie un batch de données
     */
    protected async get_batch_mode_batch_datas<T extends IImportedData>(raw_api_type_id: string, importHistoric: DataImportHistoricVO, format: DataImportFormatVO, offset: number, batch_size: number, importation_state: number): Promise<T[]> {

        let filter = new ContextFilterVO();
        filter.field_id = 'importation_state';
        filter.vo_type = raw_api_type_id;
        filter.filter_type = ContextFilterVO.TYPE_NUMERIC_EQUALS_ALL;
        filter.param_numeric = importation_state;

        /**
         * On utilise pas l'offset par ce que le filtrage va déjà avoir cet effet, les states sont mis à jour
         */
        let query_: ContextQueryVO = query(raw_api_type_id).add_filters([filter]).set_limit(batch_size, 0);

        return await ModuleContextFilterServer.getInstance().select_vos(query_);
    }

    private async setImportHistoricUID(importHistoric: DataImportHistoricVO): Promise<void> {
        importHistoric.historic_uid = importHistoric.id.toString();
        await ModuleDAO.getInstance().insertOrUpdateVO(importHistoric);
    }

    private async handleImportFormatCreate(format: DataImportFormatVO): Promise<void> {
        this.preloaded_difs_by_uid[format.import_uid] = format;
    }

    private async handleImportFormatUpdate(vo_update_handler: DAOUpdateVOHolder<DataImportFormatVO>): Promise<void> {
        this.preloaded_difs_by_uid[vo_update_handler.post_update_vo.import_uid] = vo_update_handler.post_update_vo;
    }

    private async handleImportHistoricDateUpdate(vo_update_handler: DAOUpdateVOHolder<DataImportHistoricVO>): Promise<boolean> {

        let importHistoric: DataImportHistoricVO = vo_update_handler.post_update_vo;

        if (importHistoric.state != ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT) {
            importHistoric.last_up_date = Dates.now();
        }

        if (!importHistoric.end_date) {
            if ((importHistoric.state == ModuleDataImport.IMPORTATION_STATE_POSTTREATED) ||
                (importHistoric.state == ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION) ||
                (importHistoric.state == ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT) ||
                (importHistoric.state == ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED)) {
                importHistoric.end_date = Dates.now();
            }
        }

        // Dans le cas d'un réimport, on met à jour le state de l'import qu'on réimporte
        if (!!importHistoric.reimport_of_dih_id) {
            let reimport_of_dih: DataImportHistoricVO = await query(DataImportHistoricVO.API_TYPE_ID).filter_by_id(importHistoric.reimport_of_dih_id).select_vo<DataImportHistoricVO>();
            reimport_of_dih.status_of_last_reimport = importHistoric.state;
            await ModuleDAO.getInstance().insertOrUpdateVO(reimport_of_dih);
        }

        return true;
    }

    private async handleImportHistoricDateCreation(importHistoric: DataImportHistoricVO): Promise<boolean> {
        importHistoric.start_date = Dates.now();

        // Dans le cas d'un réimport, on met à jour le state de l'import qu'on réimporte
        if (!!importHistoric.reimport_of_dih_id) {
            let reimport_of_dih: DataImportHistoricVO = await query(DataImportHistoricVO.API_TYPE_ID).filter_by_id(importHistoric.reimport_of_dih_id).select_vo<DataImportHistoricVO>();
            reimport_of_dih.status_of_last_reimport = importHistoric.state;
            await ModuleDAO.getInstance().insertOrUpdateVO(reimport_of_dih);
        }

        return true;
    }

    private async countValidatedDataAndColumnsBatchMode(raw_api_type_id: string, moduletable: ModuleTable<any>, data_import_format_id: number): Promise<FormattedDatasStats> {

        let res: FormattedDatasStats = new FormattedDatasStats();
        res.format_id = data_import_format_id;
        let query_res = await ModuleDAOServer.getInstance().query('SELECT COUNT(1) a FROM ' + moduletable.full_name + ' WHERE importation_state!=' + ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT);
        res.nb_row_unvalidated = (query_res && (query_res.length == 1) && (typeof query_res[0]['a'] != 'undefined') && (query_res[0]['a'] !== null)) ? query_res[0]['a'] : null;
        query_res = await ModuleDAOServer.getInstance().query('SELECT COUNT(1) a FROM ' + moduletable.full_name + ' WHERE importation_state=' + ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT);
        res.nb_row_validated = (query_res && (query_res.length == 1) && (typeof query_res[0]['a'] != 'undefined') && (query_res[0]['a'] !== null)) ? query_res[0]['a'] : null;
        let fields = moduletable.get_fields().map((field: ModuleTableField<any>) => field.field_id).join(') + COUNT(');
        query_res = await ModuleDAOServer.getInstance().query('SELECT COUNT(' + fields + ') a FROM ' + moduletable.full_name + ' WHERE importation_state=' + ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT);
        res.nb_fields_validated = (query_res && (query_res.length == 1) && (typeof query_res[0]['a'] != 'undefined') && (query_res[0]['a'] !== null)) ? query_res[0]['a'] : null;

        return res;
    }

    private countValidatedDataAndColumns(vos: IImportedData[], moduleTable: ModuleTable<any>, data_import_format_id: number): FormattedDatasStats {
        let res: FormattedDatasStats = new FormattedDatasStats();
        res.format_id = data_import_format_id;

        for (let i in vos) {
            let vo = vos[i];

            if ((!vo) || (vo.importation_state != ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT)) {
                res.nb_row_unvalidated++;
                continue;
            }

            res.nb_row_validated++;

            for (let j in moduleTable.get_fields()) {
                let field = moduleTable.get_fields()[j];

                if (!!vo[field.field_id]) {
                    res.nb_fields_validated++;
                }
            }
        }

        return res;
    }

    private async reimportdih(dih: DataImportHistoricVO): Promise<void> {
        dih.status_before_reimport = dih.state;
        dih.state = ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT;
        await ModuleDAO.getInstance().insertOrUpdateVO(dih);

    }

    private async importDatas_batch(importHistoric: DataImportHistoricVO, format: DataImportFormatVO, validated_imported_datas: IImportedData[]): Promise<void> {

        if (!importHistoric.use_fast_track) {
            // 2 - Importer dans le vo cible, suivant le mode d'importation (remplacement ou mise à jour)
            switch (importHistoric.import_type) {
                case DataImportHistoricVO.IMPORT_TYPE_REPLACE:

                    await ModuleDAOServer.getInstance().truncate(format.api_type_id);

                    // a priori on a juste à virer les ids et modifier les _type, on peut insérer dans le vo cible
                    let insertable_datas: IImportedData[] = [];
                    for (let i in validated_imported_datas) {
                        let insertable_data: IImportedData = Object.assign({}, validated_imported_datas[i]);
                        delete insertable_data.id;
                        insertable_data._type = format.api_type_id;
                        insertable_datas.push(insertable_data);
                    }

                    let inserteds: InsertOrDeleteQueryResult[] = null;
                    if (format.use_multiple_connections) {
                        // inserteds = ???? await ModuleDAOServer.getInstance().insert_without_triggers_using_COPY(insertable_datas);
                        inserteds = await ModuleDAOServer.getInstance().insertOrUpdateVOsMulticonnections(
                            insertable_datas);
                        // /*Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2))*/100000);
                    } else {
                        inserteds = await ModuleDAO.getInstance().insertOrUpdateVOs(insertable_datas);
                    }

                    if ((!inserteds) || (inserteds.length != insertable_datas.length)) {

                        for (let i in validated_imported_datas) {
                            validated_imported_datas[i].importation_state = ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION;
                        }

                        if (format.use_multiple_connections) {
                            await ModuleDAOServer.getInstance().insert_without_triggers_using_COPY(validated_imported_datas);
                            //    await ModuleDAOServer.getInstance().insertOrUpdateVOsMulticonnections(
                            //         validated_imported_datas);
                            // /*Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2))*/100000);
                        } else {
                            await ModuleDAO.getInstance().insertOrUpdateVOs(validated_imported_datas);
                        }

                        await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION, "Le nombre d'éléments importés ne correspond pas au nombre d'éléments validés", "import.errors.failed_importation_numbers_not_matching", DataImportLogVO.LOG_LEVEL_FATAL);
                        return;
                    }

                    break;
                default:
                    await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION, "Type d\'importation non supporté", "import.errors.failed_importation_unknown_import_type", DataImportLogVO.LOG_LEVEL_FATAL);
                    return;
            }
        }

        for (let i in validated_imported_datas) {
            validated_imported_datas[i].importation_state = ModuleDataImport.IMPORTATION_STATE_IMPORTED;
        }

        if (!importHistoric.use_fast_track) {
            if (format.use_multiple_connections) {
                await ModuleDAOServer.getInstance().insert_without_triggers_using_COPY(validated_imported_datas);
                // await ModuleDAOServer.getInstance().insertOrUpdateVOsMulticonnections(
                //     validated_imported_datas);
                // /*Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2))*/100000);
            } else {
                await ModuleDAO.getInstance().insertOrUpdateVOs(validated_imported_datas);
            }
        }
    }

    private order_vos_to_import(
        vos: IDistantVOBase[],
        vos_by_type_and_initial_id: { [_type: string]: { [initial_id: number]: IDistantVOBase } },
        ordered_vos: IDistantVOBase[],
        ordered_vos_by_type_and_initial_id: { [_type: string]: { [initial_id: number]: IDistantVOBase } },
        ref_fields: { [_type_vo_target: string]: { [id_initial_vo_target: number]: { [_type_vo_src: string]: { [id_initial_vo_src: number]: { [field_id_vo_src: string]: boolean } } } } }
    ): boolean {

        let blocked = false;

        while ((!blocked) && (ordered_vos.length != vos.length)) {

            blocked = true;

            for (let i in vos) {
                let vo = vos[i];

                /**
                 * On cherche les deps vers d'autres objets
                 */
                let vo_fields = VOsTypesManager.moduleTables_by_voType[vo._type].get_fields();
                let need_ref = false;
                for (let j in vo_fields) {

                    let vo_field = vo_fields[j];
                    if (!vo_field.manyToOne_target_moduletable) {
                        continue;
                    }

                    /**
                     * C'est une ref, si c'est une ref d'un type qu'on importe, on check si l'id est aussi importé et si oui
                     *      alors soit on a "déjà importé" (donc déjà dans le ordered_vos_by_type_and_initial_id) et dans ce cas c'est ok
                     *      soit on a pas importé et on doit postpone
                     */
                    if (vos_by_type_and_initial_id[vo_field.manyToOne_target_moduletable.vo_type] &&
                        vos_by_type_and_initial_id[vo_field.manyToOne_target_moduletable.vo_type][vo[vo_field.field_id]]) {

                        if (ordered_vos_by_type_and_initial_id[vo_field.manyToOne_target_moduletable.vo_type] &&
                            ordered_vos_by_type_and_initial_id[vo_field.manyToOne_target_moduletable.vo_type][vo[vo_field.field_id]]) {

                            /**
                             * si on a pas la ref encore on la stocke
                             */
                            if (!ref_fields[vo_field.manyToOne_target_moduletable.vo_type]) {
                                ref_fields[vo_field.manyToOne_target_moduletable.vo_type] = {};
                            }

                            if (!ref_fields[vo_field.manyToOne_target_moduletable.vo_type][vo[vo_field.field_id]]) {
                                ref_fields[vo_field.manyToOne_target_moduletable.vo_type][vo[vo_field.field_id]] = {};
                            }

                            if (!ref_fields[vo_field.manyToOne_target_moduletable.vo_type][vo[vo_field.field_id]][vo._type]) {
                                ref_fields[vo_field.manyToOne_target_moduletable.vo_type][vo[vo_field.field_id]][vo._type] = {};
                            }

                            if (!ref_fields[vo_field.manyToOne_target_moduletable.vo_type][vo[vo_field.field_id]][vo._type][vo.id]) {
                                ref_fields[vo_field.manyToOne_target_moduletable.vo_type][vo[vo_field.field_id]][vo._type][vo.id] = {};
                            }

                            ref_fields[vo_field.manyToOne_target_moduletable.vo_type][vo[vo_field.field_id]][vo._type][vo.id][vo_field.field_id] = true;
                            continue;
                        }
                        need_ref = true;
                        break;
                    }
                }

                if (need_ref) {
                    continue;
                }

                if (!ordered_vos_by_type_and_initial_id[vo._type]) {
                    ordered_vos_by_type_and_initial_id[vo._type] = {};
                }
                ordered_vos_by_type_and_initial_id[vo._type][vo.id] = vo;
                ordered_vos.push(vo);
                blocked = false;
            }
        }

        return blocked;
    }

    private update_refs(
        ref_fields: { [_type_vo_target: string]: { [id_initial_vo_target: number]: { [_type_vo_src: string]: { [id_initial_vo_src: number]: { [field_id_vo_src: string]: boolean } } } } },
        ordered_vo: IDistantVOBase,
        ordered_vos_by_type_and_initial_id: { [_type: string]: { [initial_id: number]: IDistantVOBase } },
        new_id: number
    ) {
        if (ref_fields[ordered_vo._type] && ref_fields[ordered_vo._type][ordered_vo.id]) {
            for (let ref_type in ref_fields[ordered_vo._type][ordered_vo.id]) {
                let refs = ref_fields[ordered_vo._type][ordered_vo.id][ref_type];

                for (let ref_id in refs) {
                    let ref_field_ids = ref_fields[ordered_vo._type][ordered_vo.id][ref_type][ref_id];
                    let ref_vo = ordered_vos_by_type_and_initial_id[ref_type][ref_id];

                    for (let ref_field_id in ref_field_ids) {
                        ref_vo[ref_field_id] = new_id;
                    }
                }
            }
        }
    }

    /**
     * Maintenant on a l'import dans le bon ordre reste à le faire
     *  On doit séparer le cas d'un insert pour le vo principal d'un insert
     *  pour le reste c'est un insert
     *  et quand on insère on stocke le nouveau vo en face de l'ancien id pour avoir le nouvel id à remplacer dans les champs de ref
     *
     * Par ailleurs si on va pour insérer un contenu qui a un ou plusieurs champs uniques :
     *  - pour chaque champs unique on cherche en base si on trouve déjà le vo cible. si oui, on veut update cet objet et pas faire un insère. dès qu'on trouve une cible on arrête de chercher
     *
     * On identifie aussi la possibilité de faire appel à des variables dans les imports. En l'occurrence sur l'id (puisque c'est le champs dont la valeur peut changer post import)
     *  en mettant dans un champs texte (n'importe quel champs texte) : {{IMPORT:vo_type:vo_id_initial}} et on remplacera le bloc par le nouvel id
     */
    private async import_datas(
        ref_fields: { [_type_vo_target: string]: { [id_initial_vo_target: number]: { [_type_vo_src: string]: { [id_initial_vo_src: number]: { [field_id_vo_src: string]: boolean } } } } },
        ordered_vos: IDistantVOBase[],
        ordered_vos_by_type_and_initial_id: { [_type: string]: { [initial_id: number]: IDistantVOBase } },
        is_update: boolean,
        import_on_vo: IDistantVOBase,
        updated_item: IDistantVOBase,
    ): Promise<IDistantVOBase[]> {
        for (let i in ordered_vos) {
            let ordered_vo = ordered_vos[i];

            let initial_id = ordered_vo.id;
            let new_id = null;

            if (is_update && (ordered_vo._type == updated_item._type) && (ordered_vo.id == updated_item.id)) {

                new_id = updated_item.id;
            }

            /**
             * Soit on est sur l'objet sur lequel on veut insérer à la base et on l'a déjà retrouvé, soit on
             *  fait un insère. Sauf si on retrouve un élément en base qui empêcherait l'insertion,
             *  typiquement sur un champ unique commun au vo à insérer
             */
            this.check_text_fields(ordered_vo, ordered_vos_by_type_and_initial_id);
            ordered_vo.id = new_id;
            let insert_res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(ordered_vo);
            if ((!insert_res) || (!insert_res.id) || (new_id && (new_id != insert_res.id))) {
                throw new Error('Failed insert');
            }
            ordered_vo.id = initial_id;

            this.update_refs(ref_fields, ordered_vo, ordered_vos_by_type_and_initial_id, insert_res.id);
            ordered_vo.id = insert_res.id;
        }

        return ordered_vos;
    }

    /**
     * Objectif proposer des codes de remplacement sur les imports pour gérer le fait que l'ID ne peut être connu que post import
     *  typiquement sur des trads qui utiliseraient en code l'id du vo
     */
    private check_text_fields(
        vo: IDistantVOBase,
        ordered_vos_by_type_and_initial_id: { [_type: string]: { [initial_id: number]: IDistantVOBase } },
    ) {
        if (!vo) {
            return;
        }

        let reg_exp = /(.*)\{\{IMPORT:([^:]+):([0-9]+)\}\}(.*)/g;
        let table = VOsTypesManager.moduleTables_by_voType[vo._type];
        let fields = table.get_fields();
        for (let i in fields) {
            let field = fields[i];

            if ((field.field_type == ModuleTableField.FIELD_TYPE_string) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_plain_vo_obj) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_textarea)) {
                if (!vo[field.field_id]) {
                    continue;
                }

                let m = reg_exp.exec(vo[field.field_id]);

                /**
                 * cf: https://regex101.com/codegen?language=javascript
                 */
                while (m !== null) {
                    // This is necessary to avoid infinite loops with zero-width matches
                    if (m.index === reg_exp.lastIndex) {
                        reg_exp.lastIndex++;
                    }

                    // The result can be accessed through the `m`-variable.
                    let start = m[1];
                    let vo_type = m[2];
                    let initial_id = m[3];
                    let end = m[4];

                    if (!ordered_vos_by_type_and_initial_id[vo_type]) {
                        throw new Error('check_text_fields:referencing unknown type:' + vo[field.field_id] + ':' + start + ':' + vo_type + ':' + initial_id + ':' + end + ':');
                    }

                    if (!ordered_vos_by_type_and_initial_id[vo_type][initial_id]) {
                        throw new Error('check_text_fields:referencing unknown id:' + vo[field.field_id] + ':' + start + ':' + vo_type + ':' + initial_id + ':' + end + ':');
                    }

                    vo[field.field_id] = start + ordered_vos_by_type_and_initial_id[vo_type][initial_id].id + end;

                    m = reg_exp.exec(vo[field.field_id]);
                    /**
                     * Par ce que si on catch la dernière occurrence à chaque fois on remplace un élément et paf null derrière
                     */
                    if (!m) {
                        m = reg_exp.exec(vo[field.field_id]);
                    }
                }
            }
        }
    }

    private async preload_difs_by_uid() {
        if (this.has_preloaded_difs_by_uid) {
            return;
        }
        this.has_preloaded_difs_by_uid = true;

        let difs: DataImportFormatVO[] = await query(DataImportFormatVO.API_TYPE_ID).select_vos<DataImportFormatVO>();
        for (let i in difs) {
            let dif = difs[i];
            this.preloaded_difs_by_uid[dif.import_uid] = dif;
        }
    }
}
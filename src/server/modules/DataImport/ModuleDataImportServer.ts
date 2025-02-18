
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ContextFilterVO from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryVO, { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleTableController from '../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldController from '../../../shared/modules/DAO/ModuleTableFieldController';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleTableFieldVO from '../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../../../shared/modules/DAO/vos/ModuleTableVO';
import ModuleDataImport from '../../../shared/modules/DataImport/ModuleDataImport';
import IImportedData from '../../../shared/modules/DataImport/interfaces/IImportedData';
import DataImportColumnVO from '../../../shared/modules/DataImport/vos/DataImportColumnVO';
import DataImportErrorLogVO from '../../../shared/modules/DataImport/vos/DataImportErrorLogVO';
import DataImportFormatVO from '../../../shared/modules/DataImport/vos/DataImportFormatVO';
import DataImportHistoricVO from '../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import DataImportLogVO from '../../../shared/modules/DataImport/vos/DataImportLogVO';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModuleVO from '../../../shared/modules/ModuleVO';
import ModulesManager from '../../../shared/modules/ModulesManager';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import VOsTypesManager from '../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import FileHandler from '../../../shared/tools/FileHandler';
import ObjectHandler, { field_names } from '../../../shared/tools/ObjectHandler';
import StackContext from '../../StackContext';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import BGThreadServerController from '../BGThread/BGThreadServerController';
import ModuleBGThreadServer from '../BGThread/ModuleBGThreadServer';
import ModuleContextFilterServer from '../ContextFilter/ModuleContextFilterServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPostCreateTriggerHook from '../DAO/triggers/DAOPostCreateTriggerHook';
import DAOPostUpdateTriggerHook from '../DAO/triggers/DAOPostUpdateTriggerHook';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import DAOPreUpdateTriggerHook from '../DAO/triggers/DAOPreUpdateTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import PushDataServerController from '../PushData/PushDataServerController';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';
import DataImportCronWorkersHandler from './DataImportCronWorkersHandler';
import DataImportModuleBase from './DataImportModuleBase/DataImportModuleBase';
import FormattedDatasStats from './FormattedDatasStats';
import ImportTypeCSVHandler from './ImportTypeHandlers/ImportTypeCSVHandler';
import ImportTypeXLSXHandler from './ImportTypeHandlers/ImportTypeXLSXHandler';
import ImportTypeXMLHandler from './ImportTypeHandlers/ImportTypeXMLHandler';
import DataImportBGThread from './bgthreads/DataImportBGThread';
import ImportLogger from './logger/ImportLogger';

export default class ModuleDataImportServer extends ModuleServerBase {


    private static instance: ModuleDataImportServer = null;

    private has_preloaded_difs_by_uid: boolean = false;
    private preloaded_difs_by_uid: { [uid: string]: DataImportFormatVO } = {};

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleDataImport.getInstance().name);
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleDataImportServer.instance) {
            ModuleDataImportServer.instance = new ModuleDataImportServer();
        }
        return ModuleDataImportServer.instance;
    }

    /**
     * On définit les droits d'accès du module
     */
    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleDataImport.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, DefaultTranslationVO.create_new({
            'fr-fr': 'Imports'
        }));


        let logs_access: AccessPolicyVO = new AccessPolicyVO();
        logs_access.group_id = group.id;
        logs_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        logs_access.translatable_name = ModuleDataImport.POLICY_LOGS_ACCESS;
        logs_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(logs_access, DefaultTranslationVO.create_new({
            'fr-fr': 'Accès aux logs des imports'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = logs_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let bo_full_menu_access: AccessPolicyVO = new AccessPolicyVO();
        bo_full_menu_access.group_id = group.id;
        bo_full_menu_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_full_menu_access.translatable_name = ModuleDataImport.POLICY_BO_FULL_MENU_ACCESS;
        bo_full_menu_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_full_menu_access, DefaultTranslationVO.create_new({
            'fr-fr': 'Accès complet aux imports - ADMIN'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        admin_access_dependency = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_full_menu_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleDataImport.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, DefaultTranslationVO.create_new({
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
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }

    // istanbul ignore next: cannot test registerCrons
    public registerCrons(): void {
        DataImportCronWorkersHandler.getInstance();
    }

    // istanbul ignore next: cannot test configure
    public async configure() {

        // On enregistre le bgthread qui gère les imports
        ModuleBGThreadServer.getInstance().registerBGThread(DataImportBGThread.getInstance());

        // Triggers pour mettre à jour les dates
        const preCreateTrigger: DAOPreCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        const preUpdateTrigger: DAOPreUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        preUpdateTrigger.registerHandler(DataImportHistoricVO.API_TYPE_ID, this, this.handleImportHistoricDateUpdate);
        preCreateTrigger.registerHandler(DataImportHistoricVO.API_TYPE_ID, this, this.handleImportHistoricDateCreation);

        // Triggers pour faire avancer l'import
        const postCreateTrigger: DAOPostCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        postCreateTrigger.registerHandler(DataImportHistoricVO.API_TYPE_ID, this, this.setImportHistoricUID);
        postCreateTrigger.registerHandler(DataImportFormatVO.API_TYPE_ID, this, this.handleImportFormatCreate);

        const postUpdateTrigger: DAOPostUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);
        postUpdateTrigger.registerHandler(DataImportFormatVO.API_TYPE_ID, this, this.handleImportFormatUpdate);

        // On force l'exec asap du bgthread des imports à la créa et/ou update des DIH
        const force_run_asap = BGThreadServerController.force_run_asap_by_bgthread_name[DataImportBGThread.getInstance().name];
        // Dans le cas du générateur on a pas cette fonctionnalité
        if (force_run_asap) {
            postCreateTrigger.registerHandler(DataImportHistoricVO.API_TYPE_ID, this, force_run_asap);
            postUpdateTrigger.registerHandler(DataImportHistoricVO.API_TYPE_ID, this, force_run_asap);
        }

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Annuler les imports en cours'
        }, 'import.cancel_unfinished_imports.body.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Annulation des imports en cours...'
        }, 'import.cancel_unfinished_imports.cancelling.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Annuler les imports en cours?'
        }, 'import.cancel_unfinished_imports.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Remplacer l\'import existant ?'
        }, 'import.new_historic_confirmation.body.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Remplacer l\'import existant'
        }, 'import.new_historic_confirmation.title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Windows1252'
        }, 'import.encoding.windows1252.name'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'UTF8'
        }, 'import.encoding.utf8.name'));




        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Réimporter'
        }, 'reimport_component.reimporter.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Réimporter'
        }, 'fields.labels.ref.module_data_import_dih.__component__reimporter.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Ré-importation planifiée'
        }, 'imports.reimport.planified.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Annuler'
        }, 'import.format.modal.cancel.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Continuer'
        }, 'import.format.modal.continue.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Lignes KO'
        }, 'import.format.modal.nb_unvalidated_format_elements.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Lignes OK'
        }, 'import.format.modal.nb_validated_format_elements.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Format d\'import'
        }, 'fields.labels.ref.module_data_import_dif.___LABEL____file_id'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Format d\'import'
        }, 'fields.labels.ref.module_data_import_dif.___LABEL____post_exec_module_id'));


        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Fichier importé'
        }, 'fields.labels.ref.module_data_import_dih.file_id.dih___file_id.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'ID unique'
        }, 'fields.labels.ref.module_data_import_dih.historic_uid.dih___historic_uid.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Modification'
        }, 'fields.labels.ref.module_data_import_dih.last_up_date.dih___last_up_date.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Nb. de lignes validées'
        }, 'fields.labels.ref.module_data_import_dih.nb_row_validated.dih___nb_row_validated.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Paramètres'
        }, 'fields.labels.ref.module_data_import_dih.params.dih___params.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Réimport de ...'
        }, 'fields.labels.ref.module_data_import_dih.reimport_of_dih_id.dih___reimport_of_dih_id.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Date de démarrage'
        }, 'fields.labels.ref.module_data_import_dih.start_date.dih___start_date.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Etat de l\'import'
        }, 'fields.labels.ref.module_data_import_dih.state.dih___state.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Sauvegarde de l\'état pour réimport'
        }, 'fields.labels.ref.module_data_import_dih.status_before_reimport.dih___status_before_reimport.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Etat du réimport le plus récent'
        }, 'fields.labels.ref.module_data_import_dih.status_of_last_reimport.dih___status_of_last_reimport.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Poids'
        }, 'fields.labels.ref.module_data_import_dih.weight.dih___weight.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Date'
        }, 'fields.labels.ref.module_data_import_dil.date.dil___date.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Type'
        }, 'fields.labels.ref.module_data_import_dil.log_level.dil___log_level.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Message (statique)'
        }, 'fields.labels.ref.module_data_import_dil.message.dil___message.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Format'
        }, 'fields.labels.ref.module_data_import_difc.___LABEL____data_import_format_id'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Index'
        }, 'import.column_position.index.name'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Titre'
        }, 'import.column_position.label.name'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'CSV'
        }, 'import.file_types.CSV.name'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'XLS'
        }, 'import.file_types.XLS.name'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'XLSX'
        }, 'import.file_types.XLSX.name'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Compléter'
        }, 'import.historic.types.EDIT'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Remplacer'
        }, 'import.historic.types.REPLACE'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'DEBUG'
        }, 'import.logs.lvl.DEBUG'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'ERREUR'
        }, 'import.logs.lvl.ERROR'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'CRITIQUE'
        }, 'import.logs.lvl.FATAL'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'INFO'
        }, 'import.logs.lvl.INFO'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'OK'
        }, 'import.logs.lvl.SUCCESS'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'ATTENTION'
        }, 'import.logs.lvl.WARN'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Le changement de statut est interdit'
        }, 'handleImportHistoricDateUpdate.change_state.error'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Par index'
        }, 'import.sheet_position.index.name'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Par nom'
        }, 'import.sheet_position.label.name'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'SCAN'
        }, 'import.sheet_position.scan.name'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Echec lors de l\'importation'
        }, 'import.state.failed_importation'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Echec lors du post-traitement'
        }, 'import.state.failed_posttreatment'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Formatté'
        }, 'import.state.formatted'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Formattage...'
        }, 'import.state.formatting'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Importation interdite'
        }, 'import.state.importation_not_allowed'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Importé'
        }, 'import.state.imported'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Importation...'
        }, 'import.state.importing'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'En attente de ré-importation'
        }, 'import.state.needs_reimport'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Post-traité'
        }, 'import.state.posttreated'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Post-traitement...'
        }, 'import.state.posttreating'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Prêt à importer'
        }, 'import.state.ready_to_import'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Uploadé'
        }, 'import.state.uploaded'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Imports'
        }, 'menu.menuelements.admin.DataImportAdminVueModule.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Colonnes'
        }, 'menu.menuelements.admin.DataImportColumnVO.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Formats'
        }, 'menu.menuelements.admin.DataImportFormatVO.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Historiques'
        }, 'menu.menuelements.admin.DataImportHistoricVO.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Logs'
        }, 'menu.menuelements.admin.DataImportLogVO.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Import échoué. Voir les logs.'
        }, 'import.errors.failed_importation_see_logs'));


        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Télécharger' },
            'file.download.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Upload : OK' },
            'file.upload.success'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Echec lors de l\'import voir les logs ' },
            'import.errors.failed_post_treatement_see_logs'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Format' },
            'import.format.modal.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Import' },
            'import.import.modal.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Télécharger le fichier importé' },
            'import.modal.imported_file_link.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Nouvel import' },
            'import.modal.new_import.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Voir les logs' },
            'import.modal.see_logs.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Post-traitement' },
            'import.posttreat.modal.title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Formatté' },
            'import.success.formatted'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Importé' },
            'import.success.imported'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Post-traité' },
            'import.success.posttreated'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Upload en cours...' },
            'import.upload_started.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Autovalidation' },
            'import.success.autovalidation'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Import impossible' },
            'importJSON.failed.___LABEL___'));
    }


    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleDataImport.APINAME_getDataImportHistorics, this.getDataImportHistorics.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDataImport.APINAME_getDataImportHistoric, this.getDataImportHistoric.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDataImport.APINAME_getDataImportLogs, this.getDataImportLogs.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDataImport.APINAME_getDataImportFiles, this.getDataImportFiles.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDataImport.APINAME_getDataImportFile, this.getDataImportFile.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDataImport.APINAME_getDataImportColumnsFromFormatId, this.getDataImportColumnsFromFormatId.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDataImport.APINAME_reimportdih, this.reimportdih.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDataImport.APINAME_importJSON, this.importJSON.bind(this));
    }

    public async importJSON(import_json: string, import_on_vo: IDistantVOBase): Promise<IDistantVOBase[]> {

        let vos: IDistantVOBase[] = null;
        const vos_by_type_and_initial_id: { [_type: string]: { [initial_id: number]: IDistantVOBase } } = {};
        try {
            vos = JSON.parse(import_json);
            if (!vos) {
                throw new Error('no datas to import');
            }

            for (const i in vos) {
                let vo = vos[i];
                const table = ModuleTableController.module_tables_by_vo_type[vo._type];
                if (!table) {
                    throw new Error('unknown table:' + vo._type);
                }

                vo = ModuleTableController.translate_vos_from_api(vo);
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
                updated_item = vos_by_type_and_initial_id[import_on_vo._type][ObjectHandler.getFirstAttributeName(vos_by_type_and_initial_id[import_on_vo._type])];
            }

            /**
             * On check les dépendances des items et on essaie d'ordonner l'import pour pas avoir de soucis sur les liaisons
             */
            const ordered_vos: IDistantVOBase[] = [];
            const ordered_vos_by_type_and_initial_id: { [_type: string]: { [initial_id: number]: IDistantVOBase } } = {};
            /**
             * On stocke les fields de ref, dans un tableau par vo_type cible de la liaison et id_initial, pour que quand on insère cet élement on puisse
             *      trouver facilement les refs et modifier la valeur à importer avec le nouvel id qu'on vient d'insérer.
             */
            const ref_fields: { [_type_vo_target: string]: { [id_initial_vo_target: number]: { [_type_vo_src: string]: { [id_initial_vo_src: number]: { [field_id_vo_src: string]: boolean } } } } } = {};
            const blocked = this.order_vos_to_import(
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
            await PushDataServerController.notifySimpleERROR(
                StackContext.get('UID'),
                StackContext.get('CLIENT_TAB_ID'),
                'importJSON.failed.___LABEL___'
            );
        }
        return null;
    }

    public async getDataImportHistorics(num: number): Promise<DataImportHistoricVO[]> {
        return query(DataImportHistoricVO.API_TYPE_ID).filter_by_num_eq(field_names<DataImportHistoricVO>().data_import_format_id, num).set_limit(50).select_vos<DataImportHistoricVO>();
    }

    public async getDataImportHistoric(num: number): Promise<DataImportHistoricVO> {
        return query(DataImportHistoricVO.API_TYPE_ID).filter_by_id(num).select_vo<DataImportHistoricVO>();
    }

    public async getDataImportLogs(num: number): Promise<DataImportLogVO[]> {
        return query(DataImportLogVO.API_TYPE_ID).filter_by_num_eq(field_names<DataImportLogVO>().data_import_format_id, num).set_limit(50).select_vos<DataImportLogVO>();
    }

    public async getDataImportFiles(): Promise<DataImportFormatVO[]> {
        return query(DataImportFormatVO.API_TYPE_ID).select_vos<DataImportFormatVO>();
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
        return query(DataImportFormatVO.API_TYPE_ID).filter_by_text_eq(field_names<DataImportFormatVO>().api_type_id, API_TYPE_ID).select_vos<DataImportFormatVO>();
    }

    public async getDataImportColumnsFromFormatId(num: number): Promise<DataImportColumnVO[]> {
        return query(DataImportColumnVO.API_TYPE_ID).filter_by_num_eq(field_names<DataImportColumnVO>().data_import_format_id, num).select_vos<DataImportColumnVO>();
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
        const raw_api_type_id = ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(importHistoric.api_type_id);
        if (!importHistoric.use_fast_track) {
            await ModuleDAOServer.instance.truncate(raw_api_type_id);
        }

        // 1
        const formats: DataImportFormatVO[] = await this.getImportFormatsForApiTypeId(importHistoric.api_type_id);
        if ((!formats) || (!formats.length)) {
            await this.logAndUpdateHistoric(importHistoric, null, ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED, "Aucun format pour l'import", "import.errors.failed_formatting_no_format", DataImportLogVO.LOG_LEVEL_FATAL);
            return null;
        }

        /**
         * On test le cas fichier vide :
         */
        const fileVO: FileVO = await query(FileVO.API_TYPE_ID).filter_by_id(importHistoric.file_id).select_vo<FileVO>();
        const file_size = fileVO ? FileHandler.getInstance().get_file_size(fileVO.path) : null;
        if (!file_size) {
            if ((!!importHistoric) && (!!importHistoric.id)) {
                await this.logAndUpdateHistoric(importHistoric, null, ModuleDataImport.IMPORTATION_STATE_POSTTREATED, "Aucune donnée formattable", "import.errors.failed_formatting_no_data", DataImportLogVO.LOG_LEVEL_DEBUG);
                return null;
            }
        }

        const formats_by_ids: { [id: number]: DataImportFormatVO } = VOsTypesManager.vosArray_to_vosByIds(formats);

        const all_formats_datas: { [format_id: number]: IImportedData[] } = {};

        let max_formattedDatasStats: FormattedDatasStats = new FormattedDatasStats();
        const moduleTable: ModuleTableVO = ModuleTableController.module_tables_by_vo_type[raw_api_type_id];

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

        for (const i in formats) {
            const format: DataImportFormatVO = formats[i];
            const columns: DataImportColumnVO[] = await ModuleDataImport.getInstance().getDataImportColumnsFromFormatId(format.id);

            if ((!format) || ((!columns) || (!columns.length))) {
                if (!importHistoric.use_fast_track) {
                    await ImportLogger.getInstance().log(importHistoric, format, "Impossible de charger un des formats, ou il n'a pas de colonnes", DataImportLogVO.LOG_LEVEL_ERROR);
                }
                continue;
            }

            // Ensuite on demande au module responsable de l'import si on a des filtrages à appliquer
            const postTreatementModuleVO: ModuleVO = await query(ModuleVO.API_TYPE_ID).filter_by_id(format.post_exec_module_id).select_vo<ModuleVO>();

            if ((!postTreatementModuleVO) || (!postTreatementModuleVO.name)) {
                if (!importHistoric.use_fast_track) {
                    await ImportLogger.getInstance().log(importHistoric, format, "Impossible de retrouver le module pour tester le format", DataImportLogVO.LOG_LEVEL_ERROR);
                }
                continue;
            }

            const postTraitementModule: DataImportModuleBase<any> = (ModulesManager.getModuleByNameAndRole(postTreatementModuleVO.name, DataImportModuleBase.DataImportRoleName)) as DataImportModuleBase<any>;
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

            const pre_validation_formattedDatasStats: FormattedDatasStats = ((!importHistoric.use_fast_track) && format.batch_import) ?
                await this.countValidatedDataAndColumnsBatchMode(raw_api_type_id, moduleTable, format.id) : this.countValidatedDataAndColumns(datas, moduleTable, format.id);
            const prevalidation_datas = datas;
            datas = ((!importHistoric.use_fast_track) && format.batch_import) ?
                [] : await postTraitementModule.validate_formatted_data(datas, importHistoric, format);

            if (format.save_error_logs) {
                const error_logs: DataImportErrorLogVO[] = [];

                for (const ed in datas) {
                    const data: IImportedData = datas[ed];

                    if (data.importation_state != ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED) {
                        continue;
                    }

                    error_logs.push(DataImportErrorLogVO.createNew(data.not_validated_msg, importHistoric.id));
                }

                if (error_logs.length > 0) {
                    await ModuleDAOServer.instance.insertOrUpdateVOs_as_server(error_logs);
                }
            }

            has_datas = has_datas || ((pre_validation_formattedDatasStats.nb_row_unvalidated + pre_validation_formattedDatasStats.nb_row_validated) > 0);
            all_formats_datas[format.id] = datas;

            const formattedDatasStats: FormattedDatasStats = ((!importHistoric.use_fast_track) && format.batch_import) ?
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
                    const messages_stats: { [msg: string]: number } = {};

                    if ((!format.batch_import) || importHistoric.use_fast_track) {

                        for (const data_i in datas) {
                            const data: IImportedData = datas[data_i];

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
                        for (const msg in messages_stats) {
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

        const format_ = formats_by_ids[importHistoric.data_import_format_id];
        if ((!format_.batch_import) && (!importHistoric.use_fast_track)) {
            if (format_.use_multiple_connections) {
                await ModuleDAOServer.instance.insert_without_triggers_using_COPY(all_formats_datas[importHistoric.data_import_format_id], null, true);
                // await ModuleDAOServer.instance.insertOrUpdateVOsMulticonnections(
                //     all_formats_datas[importHistoric.data_import_format_id]);
                // /*Math.max(1, Math.floor(ConfigurationService.node_configuration.max_pool / 2))*/100000);
            } else {
                await ModuleDAOServer.instance.insertOrUpdateVOs_as_server(all_formats_datas[importHistoric.data_import_format_id]);
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
        const format: DataImportFormatVO = await query(DataImportFormatVO.API_TYPE_ID).filter_by_id(importHistoric.data_import_format_id).select_vo<DataImportFormatVO>();

        if ((!importHistoric.use_fast_track) && format.batch_import) {
            await this.importDatas_batch_mode(importHistoric, format);
        } else {
            await this.importDatas_classic(importHistoric, format, fasttrack_datas);
        }
    }

    public async importDatas_classic(importHistoric: DataImportHistoricVO, format: DataImportFormatVO, fasttrack_datas: IImportedData[] = null): Promise<void> {

        //  1 - Récupérer le format validé, et les données importées ()
        const data_api_type_id: string = ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(format.api_type_id);

        const raw_imported_datas: IImportedData[] =
            importHistoric.use_fast_track ? fasttrack_datas :
                await query(data_api_type_id)
                    .set_sort(new SortByVO(data_api_type_id, field_names<IImportedData>().imported_line_number, true))
                    .select_vos<IImportedData>();

        // On garde que les données, validées et importées
        const validated_imported_datas: IImportedData[] = [];
        for (const i in raw_imported_datas) {
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
        const raw_api_type_id = ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(format.api_type_id);

        let offset = 0;
        const batch_size = await this.get_batch_mode_batch_size(raw_api_type_id, importHistoric, format, ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT);

        while (had_datas) {

            const validated_imported_datas: IImportedData[] = await this.get_batch_mode_batch_datas(raw_api_type_id, importHistoric, format, offset, batch_size, ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT);

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
        const format: DataImportFormatVO = await query(DataImportFormatVO.API_TYPE_ID).filter_by_id(importHistoric.data_import_format_id).select_vo<DataImportFormatVO>();

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

        await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_POSTTREATED, "Fin import : " + Dates.format(Dates.now(), "Y-MM-DD HH:mm"), "import.success.posttreated", DataImportLogVO.LOG_LEVEL_SUCCESS);
    }

    public async posttreatDatas_batch_mode(importHistoric: DataImportHistoricVO, format: DataImportFormatVO): Promise<boolean> {

        //  1 - Récupérer les données importées
        let had_datas = true;
        const raw_api_type_id = ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(format.api_type_id);

        let offset = 0;
        const batch_size = await this.get_batch_mode_batch_size(raw_api_type_id, importHistoric, format, ModuleDataImport.IMPORTATION_STATE_IMPORTED);

        while (had_datas) {

            /**
             * Si le module de posttraitement propose un hook pour remplacer le chargement par batch par défaut, on l'utilise
             */
            const postTreatementModuleVO: ModuleVO = await query(ModuleVO.API_TYPE_ID).filter_by_id(format.post_exec_module_id).select_vo<ModuleVO>();
            const postTraitementModule: DataImportModuleBase<any> = (ModulesManager.getModuleByNameAndRole(postTreatementModuleVO.name, DataImportModuleBase.DataImportRoleName)) as DataImportModuleBase<any>;

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
                for (const i in validated_imported_datas) {
                    const validated_imported_data = validated_imported_datas[i];
                    validated_imported_data.importation_state = ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT;
                }

                if (format.use_multiple_connections) {
                    await ModuleDAOServer.instance.insert_without_triggers_using_COPY(validated_imported_datas, null, true);
                    // await ModuleDAOServer.instance.insertOrUpdateVOsMulticonnections(
                    //     validated_imported_datas);
                    // /*Math.max(1, Math.floor(ConfigurationService.node_configuration.max_pool / 2))*/100000);
                } else {
                    await ModuleDAOServer.instance.insertOrUpdateVOs_as_server(validated_imported_datas);
                }

                return false;

            } else {
                for (const i in validated_imported_datas) {
                    const validated_imported_data = validated_imported_datas[i];
                    validated_imported_data.importation_state = ModuleDataImport.IMPORTATION_STATE_POSTTREATED;
                }

                if (format.use_multiple_connections) {
                    await ModuleDAOServer.instance.insert_without_triggers_using_COPY(validated_imported_datas, null, true);
                    // await ModuleDAOServer.instance.insertOrUpdateVOsMulticonnections(
                    //     validated_imported_datas);
                    // /*Math.max(1, Math.floor(ConfigurationService.node_configuration.max_pool / 2))*/100000);
                } else {
                    await ModuleDAOServer.instance.insertOrUpdateVOs_as_server(validated_imported_datas);
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
        const data_api_type_id: string = ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(format.api_type_id);

        const raw_imported_datas: IImportedData[] =
            importHistoric.use_fast_track ? fasttrack_datas :
                await query(data_api_type_id)
                    .set_sort(new SortByVO(data_api_type_id, field_names<IImportedData>().imported_line_number, true))
                    .select_vos<IImportedData>();

        if ((!format) || (!format.post_exec_module_id) || (!raw_imported_datas) || (!raw_imported_datas.length)) {
            await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT, "Aucune data formattée ou pas de module configuré", "import.errors.failed_post_treatement_see_logs", DataImportLogVO.LOG_LEVEL_FATAL);
            return false;
        }

        // On garde que les données, validées et importées
        const validated_imported_datas: IImportedData[] = [];
        for (const i in raw_imported_datas) {
            if (raw_imported_datas[i].importation_state != ModuleDataImport.IMPORTATION_STATE_IMPORTED) {
                continue;
            }
            validated_imported_datas.push(raw_imported_datas[i]);
        }

        if (!importHistoric.use_fast_track) {

            if (await this.posttreat_batch(importHistoric, format, validated_imported_datas)) {

                for (const i in validated_imported_datas) {
                    const validated_imported_data = validated_imported_datas[i];
                    validated_imported_data.importation_state = ModuleDataImport.IMPORTATION_STATE_POSTTREATED;
                }

                if (format.use_multiple_connections) {
                    await ModuleDAOServer.instance.insert_without_triggers_using_COPY(validated_imported_datas, null, true);
                    // await ModuleDAOServer.instance.insertOrUpdateVOsMulticonnections(
                    //     validated_imported_datas);
                    // /*Math.max(1, Math.floor(ConfigurationService.node_configuration.max_pool / 2))*/100000);
                } else {
                    await ModuleDAOServer.instance.insertOrUpdateVOs_as_server(validated_imported_datas);
                }

                return true;
            } else {
                for (const i in validated_imported_datas) {
                    const validated_imported_data = validated_imported_datas[i];
                    validated_imported_data.importation_state = ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT;
                }

                if (format.use_multiple_connections) {
                    await ModuleDAOServer.instance.insert_without_triggers_using_COPY(validated_imported_datas, null, true);
                    // await ModuleDAOServer.instance.insertOrUpdateVOsMulticonnections(
                    //     validated_imported_datas);
                    // /*Math.max(1, Math.floor(ConfigurationService.node_configuration.max_pool / 2))*/100000);
                } else {
                    await ModuleDAOServer.instance.insertOrUpdateVOs_as_server(validated_imported_datas);
                }
            }

            return false;
        }

        return this.posttreat_batch(importHistoric, format, validated_imported_datas);
    }

    public async posttreat_batch(importHistoric: DataImportHistoricVO, format: DataImportFormatVO, validated_imported_datas: IImportedData[]): Promise<boolean> {
        const postTreatementModuleVO: ModuleVO = await query(ModuleVO.API_TYPE_ID).filter_by_id(format.post_exec_module_id).exec_as_server().select_vo<ModuleVO>();

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
        const postTraitementModule: DataImportModuleBase<any> = (ModulesManager.getModuleByNameAndRole(postTreatementModuleVO.name, DataImportModuleBase.DataImportRoleName)) as DataImportModuleBase<any>;
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
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(importHistoric);
        await PushDataServerController.notifyDAOGetVoById(importHistoric.user_id, null, DataImportHistoricVO.API_TYPE_ID, importHistoric.id);
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
                await PushDataServerController.notifySimpleERROR(importHistoric.user_id, null, notif_code);
                break;
            case DataImportLogVO.LOG_LEVEL_WARN:
                await PushDataServerController.notifySimpleWARN(importHistoric.user_id, null, notif_code);
                break;
            case DataImportLogVO.LOG_LEVEL_SUCCESS:
                await PushDataServerController.notifySimpleSUCCESS(importHistoric.user_id, null, notif_code);
                break;
            case DataImportLogVO.LOG_LEVEL_INFO:
                await PushDataServerController.notifySimpleINFO(importHistoric.user_id, null, notif_code);
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

        const filter = new ContextFilterVO();
        filter.field_name = field_names<IImportedData>().importation_state;
        filter.vo_type = raw_api_type_id;
        filter.filter_type = ContextFilterVO.TYPE_NUMERIC_EQUALS_ALL;
        filter.param_numeric = importation_state;

        /**
         * On utilise pas l'offset par ce que le filtrage va déjà avoir cet effet, les states sont mis à jour
         */
        const query_: ContextQueryVO = query(raw_api_type_id)
            .add_filters([filter])
            .set_sort(new SortByVO(raw_api_type_id, field_names<IImportedData>().imported_line_number, true))
            .set_limit(batch_size, 0);

        return ModuleContextFilterServer.instance.select_vos(query_);
    }

    private async setImportHistoricUID(importHistoric: DataImportHistoricVO): Promise<void> {
        importHistoric.historic_uid = importHistoric.id.toString();
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(importHistoric);
    }

    private async handleImportFormatCreate(format: DataImportFormatVO): Promise<void> {
        this.preloaded_difs_by_uid[format.import_uid] = format;
    }

    private async handleImportFormatUpdate(vo_update_handler: DAOUpdateVOHolder<DataImportFormatVO>): Promise<void> {
        this.preloaded_difs_by_uid[vo_update_handler.post_update_vo.import_uid] = vo_update_handler.post_update_vo;
    }

    private async handleImportHistoricDateUpdate(vo_update_handler: DAOUpdateVOHolder<DataImportHistoricVO>): Promise<boolean> {

        const importHistoric: DataImportHistoricVO = vo_update_handler.post_update_vo;

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
        if (importHistoric.reimport_of_dih_id) {
            const reimport_of_dih: DataImportHistoricVO = await query(DataImportHistoricVO.API_TYPE_ID).filter_by_id(importHistoric.reimport_of_dih_id).select_vo<DataImportHistoricVO>();
            reimport_of_dih.status_of_last_reimport = importHistoric.state;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(reimport_of_dih);
        }

        return true;
    }

    private async handleImportHistoricDateCreation(importHistoric: DataImportHistoricVO): Promise<boolean> {
        importHistoric.start_date = Dates.now();

        // Dans le cas d'un réimport, on met à jour le state de l'import qu'on réimporte
        if (importHistoric.reimport_of_dih_id) {
            const reimport_of_dih: DataImportHistoricVO = await query(DataImportHistoricVO.API_TYPE_ID).filter_by_id(importHistoric.reimport_of_dih_id).select_vo<DataImportHistoricVO>();
            reimport_of_dih.status_of_last_reimport = importHistoric.state;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(reimport_of_dih);
        }

        return true;
    }

    private async countValidatedDataAndColumnsBatchMode(raw_api_type_id: string, moduletable: ModuleTableVO, data_import_format_id: number): Promise<FormattedDatasStats> {

        const res: FormattedDatasStats = new FormattedDatasStats();
        res.format_id = data_import_format_id;
        let query_res = await ModuleDAOServer.instance.query('SELECT COUNT(1) a FROM ' + moduletable.full_name + ' WHERE importation_state!=' + ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT);
        res.nb_row_unvalidated = (query_res && (query_res.length == 1) && (typeof query_res[0]['a'] != 'undefined') && (query_res[0]['a'] !== null)) ? query_res[0]['a'] : null;
        query_res = await ModuleDAOServer.instance.query('SELECT COUNT(1) a FROM ' + moduletable.full_name + ' WHERE importation_state=' + ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT);
        res.nb_row_validated = (query_res && (query_res.length == 1) && (typeof query_res[0]['a'] != 'undefined') && (query_res[0]['a'] !== null)) ? query_res[0]['a'] : null;
        const fields = Object.keys(ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[moduletable.vo_type]).join(') + COUNT(');
        query_res = await ModuleDAOServer.instance.query('SELECT COUNT(' + fields + ') a FROM ' + moduletable.full_name + ' WHERE importation_state=' + ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT);
        res.nb_fields_validated = (query_res && (query_res.length == 1) && (typeof query_res[0]['a'] != 'undefined') && (query_res[0]['a'] !== null)) ? query_res[0]['a'] : null;

        return res;
    }

    private countValidatedDataAndColumns(vos: IImportedData[], moduleTable: ModuleTableVO, data_import_format_id: number): FormattedDatasStats {
        const res: FormattedDatasStats = new FormattedDatasStats();
        res.format_id = data_import_format_id;
        const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[moduleTable.vo_type];

        for (const i in vos) {
            const vo = vos[i];

            if ((!vo) || (vo.importation_state != ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT)) {
                res.nb_row_unvalidated++;
                continue;
            }

            res.nb_row_validated++;

            for (const j in fields) {
                const field = fields[j];

                if (vo[field.field_name]) {
                    res.nb_fields_validated++;
                }
            }
        }

        return res;
    }

    private async reimportdih(dih: DataImportHistoricVO): Promise<void> {
        dih.status_before_reimport = dih.state;
        dih.state = ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(dih);

    }

    private async importDatas_batch(importHistoric: DataImportHistoricVO, format: DataImportFormatVO, validated_imported_datas: IImportedData[]): Promise<void> {

        if (!importHistoric.use_fast_track) {
            // 2 - Importer dans le vo cible, suivant le mode d'importation (remplacement ou mise à jour)
            switch (importHistoric.import_type) {
                case DataImportHistoricVO.IMPORT_TYPE_REPLACE:

                    await ModuleDAOServer.instance.truncate(format.api_type_id);

                    // a priori on a juste à virer les ids et modifier les _type, on peut insérer dans le vo cible
                    const insertable_datas: IImportedData[] = [];
                    for (const i in validated_imported_datas) {
                        const insertable_data: IImportedData = Object.assign({}, validated_imported_datas[i]);
                        delete insertable_data.id;
                        insertable_data._type = format.api_type_id;
                        insertable_datas.push(insertable_data);
                    }

                    if (format.use_multiple_connections) {
                        await ModuleDAOServer.instance.insert_without_triggers_using_COPY(insertable_datas, null, true);
                    } else {
                        await ModuleDAOServer.instance.insertOrUpdateVOs_as_server(insertable_datas);
                    }

                    break;
                default:
                    await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION, "Type d\'importation non supporté", "import.errors.failed_importation_unknown_import_type", DataImportLogVO.LOG_LEVEL_FATAL);
                    return;
            }
        }

        for (const i in validated_imported_datas) {
            validated_imported_datas[i].importation_state = ModuleDataImport.IMPORTATION_STATE_IMPORTED;
        }

        if (!importHistoric.use_fast_track) {
            if (format.use_multiple_connections) {
                await ModuleDAOServer.instance.insert_without_triggers_using_COPY(validated_imported_datas, null, true);
            } else {
                await ModuleDAOServer.instance.insertOrUpdateVOs_as_server(validated_imported_datas);
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

            for (const i in vos) {
                const vo = vos[i];
                const vo_fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[vo._type];

                /**
                 * On cherche les deps vers d'autres objets
                 */
                let need_ref = false;
                for (const j in vo_fields) {

                    const vo_field = vo_fields[j];
                    if (!vo_field.foreign_ref_vo_type) {
                        continue;
                    }

                    /**
                     * C'est une ref, si c'est une ref d'un type qu'on importe, on check si l'id est aussi importé et si oui
                     *      alors soit on a "déjà importé" (donc déjà dans le ordered_vos_by_type_and_initial_id) et dans ce cas c'est ok
                     *      soit on a pas importé et on doit postpone
                     */
                    if (vos_by_type_and_initial_id[vo_field.foreign_ref_vo_type] &&
                        vos_by_type_and_initial_id[vo_field.foreign_ref_vo_type][vo[vo_field.field_name]]) {

                        if (ordered_vos_by_type_and_initial_id[vo_field.foreign_ref_vo_type] &&
                            ordered_vos_by_type_and_initial_id[vo_field.foreign_ref_vo_type][vo[vo_field.field_name]]) {

                            /**
                             * si on a pas la ref encore on la stocke
                             */
                            if (!ref_fields[vo_field.foreign_ref_vo_type]) {
                                ref_fields[vo_field.foreign_ref_vo_type] = {};
                            }

                            if (!ref_fields[vo_field.foreign_ref_vo_type][vo[vo_field.field_name]]) {
                                ref_fields[vo_field.foreign_ref_vo_type][vo[vo_field.field_name]] = {};
                            }

                            if (!ref_fields[vo_field.foreign_ref_vo_type][vo[vo_field.field_name]][vo._type]) {
                                ref_fields[vo_field.foreign_ref_vo_type][vo[vo_field.field_name]][vo._type] = {};
                            }

                            if (!ref_fields[vo_field.foreign_ref_vo_type][vo[vo_field.field_name]][vo._type][vo.id]) {
                                ref_fields[vo_field.foreign_ref_vo_type][vo[vo_field.field_name]][vo._type][vo.id] = {};
                            }

                            ref_fields[vo_field.foreign_ref_vo_type][vo[vo_field.field_name]][vo._type][vo.id][vo_field.field_name] = true;
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
            for (const ref_type in ref_fields[ordered_vo._type][ordered_vo.id]) {
                const refs = ref_fields[ordered_vo._type][ordered_vo.id][ref_type];

                for (const ref_id in refs) {
                    const ref_field_ids = ref_fields[ordered_vo._type][ordered_vo.id][ref_type][ref_id];
                    const ref_vo = ordered_vos_by_type_and_initial_id[ref_type][ref_id];

                    for (const ref_field_id in ref_field_ids) {
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
        for (const i in ordered_vos) {
            const ordered_vo = ordered_vos[i];

            const initial_id = ordered_vo.id;
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
            const insert_res: InsertOrDeleteQueryResult = await ModuleDAOServer.instance.insertOrUpdateVO_as_server(ordered_vo);
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

        const reg_exp = /(.*)\{\{IMPORT:([^:]+):([0-9]+)\}\}(.*)/g;
        const table = ModuleTableController.module_tables_by_vo_type[vo._type];
        const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[table.vo_type];
        for (const i in fields) {
            const field = fields[i];

            if ((field.field_type == ModuleTableFieldVO.FIELD_TYPE_string) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_textarea)) {
                if (!vo[field.field_name]) {
                    continue;
                }

                let m = reg_exp.exec(vo[field.field_name]);

                /**
                 * cf: https://regex101.com/codegen?language=javascript
                 */
                while (m !== null) {
                    // This is necessary to avoid infinite loops with zero-width matches
                    if (m.index === reg_exp.lastIndex) {
                        reg_exp.lastIndex++;
                    }

                    // The result can be accessed through the `m`-variable.
                    const start = m[1];
                    const vo_type = m[2];
                    const initial_id = m[3];
                    const end = m[4];

                    if (!ordered_vos_by_type_and_initial_id[vo_type]) {
                        throw new Error('check_text_fields:referencing unknown type:' + vo[field.field_name] + ':' + start + ':' + vo_type + ':' + initial_id + ':' + end + ':');
                    }

                    if (!ordered_vos_by_type_and_initial_id[vo_type][initial_id]) {
                        throw new Error('check_text_fields:referencing unknown id:' + vo[field.field_name] + ':' + start + ':' + vo_type + ':' + initial_id + ':' + end + ':');
                    }

                    vo[field.field_name] = start + ordered_vos_by_type_and_initial_id[vo_type][initial_id].id + end;

                    m = reg_exp.exec(vo[field.field_name]);
                    /**
                     * Par ce que si on catch la dernière occurrence à chaque fois on remplace un élément et paf null derrière
                     */
                    if (!m) {
                        m = reg_exp.exec(vo[field.field_name]);
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

        const difs: DataImportFormatVO[] = await query(DataImportFormatVO.API_TYPE_ID).select_vos<DataImportFormatVO>();
        for (const i in difs) {
            const dif = difs[i];
            this.preloaded_difs_by_uid[dif.import_uid] = dif;
        }
    }
}
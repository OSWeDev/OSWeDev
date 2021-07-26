import * as moment from 'moment';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import IImportedData from '../../../shared/modules/DataImport/interfaces/IImportedData';
import ModuleDataImport from '../../../shared/modules/DataImport/ModuleDataImport';
import DataImportColumnVO from '../../../shared/modules/DataImport/vos/DataImportColumnVO';
import DataImportFormatVO from '../../../shared/modules/DataImport/vos/DataImportFormatVO';
import DataImportHistoricVO from '../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import DataImportLogVO from '../../../shared/modules/DataImport/vos/DataImportLogVO';
import ModulesManager from '../../../shared/modules/ModulesManager';
import ModuleTable from '../../../shared/modules/ModuleTable';
import ModuleVO from '../../../shared/modules/ModuleVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleBGThreadServer from '../BGThread/ModuleBGThreadServer';
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
import ImportTypeXLSXHandler from './ImportTypeHandlers/ImportTypeXLSXHandler';
import ImportLogger from './logger/ImportLogger';

export default class ModuleDataImportServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleDataImportServer.instance) {
            ModuleDataImportServer.instance = new ModuleDataImportServer();
        }
        return ModuleDataImportServer.instance;
    }

    private static instance: ModuleDataImportServer = null;

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
            fr: 'Imports'
        }));


        let logs_access: AccessPolicyVO = new AccessPolicyVO();
        logs_access.group_id = group.id;
        logs_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        logs_access.translatable_name = ModuleDataImport.POLICY_LOGS_ACCESS;
        logs_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(logs_access, new DefaultTranslation({
            fr: 'Accès aux logs des imports'
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
            fr: 'Accès complet aux imports - ADMIN'
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
            fr: 'Administration des imports'
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
        preUpdateTrigger.registerHandler(DataImportHistoricVO.API_TYPE_ID, this.handleImportHistoricDateUpdate);
        preCreateTrigger.registerHandler(DataImportHistoricVO.API_TYPE_ID, this.handleImportHistoricDateCreation);

        // Triggers pour faire avancer l'import
        let postCreateTrigger: DAOPostCreateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        postCreateTrigger.registerHandler(DataImportHistoricVO.API_TYPE_ID, this.setImportHistoricUID);


        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Annuler les imports en cours'
        }, 'import.cancel_unfinished_imports.body.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Annulation des imports en cours...'
        }, 'import.cancel_unfinished_imports.cancelling.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Annuler les imports en cours?'
        }, 'import.cancel_unfinished_imports.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Remplacer l\'import existant ?'
        }, 'import.new_historic_confirmation.body.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Remplacer l\'import existant'
        }, 'import.new_historic_confirmation.title.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Windows1252'
        }, 'import.encoding.windows1252.name'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'UTF8'
        }, 'import.encoding.utf8.name'));




        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Réimporter'
        }, 'reimport_component.reimporter.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Réimporter'
        }, 'fields.labels.ref.module_data_import_dih.__component__reimporter.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Ré-importation planifiée'
        }, 'imports.reimport.planified.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Annuler'
        }, 'import.format.modal.cancel.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Continuer'
        }, 'import.format.modal.continue.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Lignes KO'
        }, 'import.format.modal.nb_unvalidated_format_elements.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Lignes OK'
        }, 'import.format.modal.nb_validated_format_elements.___LABEL___'));


        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Format d\'import'
        }, 'fields.labels.ref.module_data_import_dif.___LABEL____file_id'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Format d\'import'
        }, 'fields.labels.ref.module_data_import_dif.___LABEL____post_exec_module_id'));


        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Format'
        }, 'fields.labels.ref.module_data_import_difc.___LABEL____data_import_format_id'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Index'
        }, 'import.column_position.index.name'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Titre'
        }, 'import.column_position.label.name'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'CSV'
        }, 'import.file_types.CSV.name'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'XLS'
        }, 'import.file_types.XLS.name'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'XLSX'
        }, 'import.file_types.XLSX.name'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Compléter'
        }, 'import.historic.types.EDIT'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Remplacer'
        }, 'import.historic.types.REPLACE'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'DEBUG'
        }, 'import.logs.lvl.DEBUG'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'ERREUR'
        }, 'import.logs.lvl.ERROR'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'CRITIQUE'
        }, 'import.logs.lvl.FATAL'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'INFO'
        }, 'import.logs.lvl.INFO'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'OK'
        }, 'import.logs.lvl.SUCCESS'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'ATTENTION'
        }, 'import.logs.lvl.WARN'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Le changement de statut est interdit'
        }, 'handleImportHistoricDateUpdate.change_state.error'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Par index'
        }, 'import.sheet_position.index.name'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Par nom'
        }, 'import.sheet_position.label.name'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'SCAN'
        }, 'import.sheet_position.scan.name'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Echec lors de l\'importation'
        }, 'import.state.failed_importation'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Echec lors du post-traitement'
        }, 'import.state.failed_posttreatment'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Formatté'
        }, 'import.state.formatted'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Formattage...'
        }, 'import.state.formatting'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Importation interdite'
        }, 'import.state.importation_not_allowed'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Importé'
        }, 'import.state.imported'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Importation...'
        }, 'import.state.importing'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'En attente de ré-importation'
        }, 'import.state.needs_reimport'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Post-traité'
        }, 'import.state.posttreated'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Post-traitement...'
        }, 'import.state.posttreating'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Prêt à importer'
        }, 'import.state.ready_to_import'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Uploadé'
        }, 'import.state.uploaded'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Imports'
        }, 'menu.menuelements.DataImportAdminVueModule.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Colonnes'
        }, 'menu.menuelements.DataImportColumnVO.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Formats'
        }, 'menu.menuelements.DataImportFormatVO.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Historiques'
        }, 'menu.menuelements.DataImportHistoricVO.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Logs'
        }, 'menu.menuelements.DataImportLogVO.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Import échoué. Voir les logs.'
        }, 'import.errors.failed_importation_see_logs'));


        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Télécharger' },
            'file.download.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Upload : OK' },
            'file.upload.success'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Echec lors de l\'import voir les logs ' },
            'import.errors.failed_post_treatement_see_logs'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Format' },
            'import.format.modal.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Import' },
            'import.import.modal.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Télécharger le fichier importé' },
            'import.modal.imported_file_link.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Nouvel import' },
            'import.modal.new_import.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Voir les logs' },
            'import.modal.see_logs.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Post-traitement' },
            'import.posttreat.modal.title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Formatté' },
            'import.success.formatted'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Importé' },
            'import.success.imported'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Post-traité' },
            'import.success.posttreated'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Upload en cours...' },
            'import.upload_started.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Autovalidation' },
            'import.success.autovalidation'));
    }


    public registerServerApiHandlers() {
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDataImport.APINAME_getDataImportHistorics, this.getDataImportHistorics.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDataImport.APINAME_getDataImportHistoric, this.getDataImportHistoric.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDataImport.APINAME_getDataImportLogs, this.getDataImportLogs.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDataImport.APINAME_getDataImportFiles, this.getDataImportFiles.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDataImport.APINAME_getDataImportFile, this.getDataImportFile.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDataImport.APINAME_getDataImportColumnsFromFormatId, this.getDataImportColumnsFromFormatId.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDataImport.APINAME_reimportdih, this.reimportdih.bind(this));
    }

    public async getDataImportHistorics(num: number): Promise<DataImportHistoricVO[]> {

        return await ModuleDAOServer.getInstance().selectAll<DataImportHistoricVO>(
            DataImportHistoricVO.API_TYPE_ID, 'WHERE t.data_import_format_id = $1 LIMIT 50;', [num]);
    }

    public async getDataImportHistoric(num: number): Promise<DataImportHistoricVO> {

        return await ModuleDAOServer.getInstance().selectOne<DataImportHistoricVO>(
            DataImportHistoricVO.API_TYPE_ID, 'WHERE t.id = $1;', [num]);
    }

    public async getDataImportLogs(num: number): Promise<DataImportLogVO[]> {

        return await ModuleDAOServer.getInstance().selectAll<DataImportLogVO>(
            DataImportLogVO.API_TYPE_ID, 'WHERE t.data_import_format_id = $1 LIMIT 50;', [num]);
    }

    public async getDataImportFiles(): Promise<DataImportFormatVO[]> {

        return await ModuleDAO.getInstance().getVos<DataImportFormatVO>(DataImportFormatVO.API_TYPE_ID);
    }

    public async getDataImportFile(text: string): Promise<DataImportFormatVO> {

        return await ModuleDAOServer.getInstance().selectOne<DataImportFormatVO>(
            DataImportFormatVO.API_TYPE_ID, 'WHERE t.import_uid = $1', [text]);
    }

    public async getImportFormatsForApiTypeId(API_TYPE_ID: string): Promise<DataImportFormatVO[]> {

        return await ModuleDAOServer.getInstance().selectAll<DataImportFormatVO>(
            DataImportFormatVO.API_TYPE_ID, 'WHERE t.api_type_id = $1', [API_TYPE_ID]);
    }

    public async getDataImportColumnsFromFormatId(num: number): Promise<DataImportColumnVO[]> {

        return await ModuleDAOServer.getInstance().selectAll<DataImportColumnVO>(
            DataImportColumnVO.API_TYPE_ID, 'WHERE t.data_import_format_id = $1', [num]);
    }

    /**
     * 1 - Récupérer les différents formats possible,
     * 2 - Choisir le format le plus adapté
     * 3 - Importer dans le vo intermédiaire
     * 4 - Mettre à jour le status et informer le client de la mise à jour du DAO
     */
    public async formatDatas(importHistoric: DataImportHistoricVO): Promise<void> {

        await ImportLogger.getInstance().log(importHistoric, null, 'Début de l\'importation', DataImportLogVO.LOG_LEVEL_INFO);

        // On commence par nettoyer la table, quelle que soit l'issue
        await ModuleDAOServer.getInstance().truncate(ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(importHistoric.api_type_id));

        // 1
        let formats: DataImportFormatVO[] = await this.getImportFormatsForApiTypeId(importHistoric.api_type_id);
        if ((!formats) || (!formats.length)) {
            await this.logAndUpdateHistoric(importHistoric, null, ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED, "Aucun format pour l'import", "import.errors.failed_formatting_no_format", DataImportLogVO.LOG_LEVEL_FATAL);
            return;
        }

        let all_formats_datas: { [format_id: number]: IImportedData[] } = {};

        let max_formattedDatasStats: FormattedDatasStats = new FormattedDatasStats();
        let moduleTable: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[importHistoric.api_type_id];

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

            if ((!format) || (!columns) || (!columns.length)) {
                await ImportLogger.getInstance().log(importHistoric, format, "Impossible de charger un des formats, ou il n'a pas de colonnes", DataImportLogVO.LOG_LEVEL_ERROR);
                continue;
            }

            let datas: IImportedData[] = [];
            switch (format.type) {
                case DataImportFormatVO.TYPE_XLS:
                case DataImportFormatVO.TYPE_XLSX:
                default:
                    datas = await ImportTypeXLSXHandler.getInstance().importFile(format, columns, importHistoric, format.type_column_position != DataImportFormatVO.TYPE_COLUMN_POSITION_LABEL);
            }

            // Ensuite on demande au module responsable de l'import si on a des filtrages à appliquer
            let postTreatementModuleVO: ModuleVO = await ModuleDAO.getInstance().getVoById<ModuleVO>(ModuleVO.API_TYPE_ID, format.post_exec_module_id);

            if ((!postTreatementModuleVO) || (!postTreatementModuleVO.name)) {
                await ImportLogger.getInstance().log(importHistoric, format, "Impossible de retrouver le module pour tester le format", DataImportLogVO.LOG_LEVEL_ERROR);
                continue;
            }

            let postTraitementModule: DataImportModuleBase<any> = (ModulesManager.getInstance().getModuleByNameAndRole(postTreatementModuleVO.name, DataImportModuleBase.DataImportRoleName)) as DataImportModuleBase<any>;
            if (!postTraitementModule) {
                await ImportLogger.getInstance().log(importHistoric, format, "Impossible de retrouver le module pour tester le format", DataImportLogVO.LOG_LEVEL_ERROR);
                continue;
            }

            let pre_validation_formattedDatasStats: FormattedDatasStats = this.countValidatedDataAndColumns(datas, moduleTable, format.id);
            let prevalidation_datas = datas;
            datas = await postTraitementModule.validate_formatted_data(datas, importHistoric, format);

            has_datas = has_datas || (datas && (datas.length > 0));
            all_formats_datas[format.id] = datas;

            let formattedDatasStats: FormattedDatasStats = this.countValidatedDataAndColumns(datas, moduleTable, format.id);

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

                    for (let data_i in datas) {
                        let data: IImportedData = datas[data_i];

                        if ((!!data.not_validated_msg) && (data.not_validated_msg != '')) {
                            if (!messages_stats[data.not_validated_msg]) {
                                messages_stats[data.not_validated_msg] = 0;
                            }
                            messages_stats[data.not_validated_msg]++;
                        }
                    }

                    await ImportLogger.getInstance().log(importHistoric, format, "Toutes les données sont invalides. Nb de lignes identifiées : " + prevalidation_datas.length + ".", DataImportLogVO.LOG_LEVEL_ERROR);
                    for (let msg in messages_stats) {
                        await ImportLogger.getInstance().log(importHistoric, format, "Dont " + messages_stats[msg] + " lignes invalidées car : " + msg + ".", DataImportLogVO.LOG_LEVEL_WARN);
                    }
                }
            }
        }

        if ((!has_datas) || (!max_formattedDatasStats.format_id) || (max_formattedDatasStats.nb_fields_validated <= 0) || (max_formattedDatasStats.nb_row_validated <= 0)) {
            await this.logAndUpdateHistoric(importHistoric, null, ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED, "Aucune donnée formattable", "import.errors.failed_formatting_no_data", DataImportLogVO.LOG_LEVEL_FATAL);
            return;
        }

        importHistoric.data_import_format_id = max_formattedDatasStats.format_id;
        importHistoric.nb_row_unvalidated = max_formattedDatasStats.nb_row_unvalidated;
        importHistoric.nb_row_validated = max_formattedDatasStats.nb_row_validated;
        await this.insertImportedDatasInDb(all_formats_datas[importHistoric.data_import_format_id], ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(importHistoric.api_type_id), moduleTable);

        // 4
        await this.logAndUpdateHistoric(importHistoric, null, ModuleDataImport.IMPORTATION_STATE_FORMATTED, 'Formattage terminé', "import.success.formatted", DataImportLogVO.LOG_LEVEL_SUCCESS);
    }

    /**
     * 1 - Récupérer le format validé, et les données validées
     * 2 - Importer dans le vo cible, suivant le mode d'importation (remplacement ou mise à jour)
     * 3 - Mettre à jour le status et informer le client
     * @param importHistoric
     */
    public async importDatas(importHistoric: DataImportHistoricVO): Promise<void> {

        //  1 - Récupérer le format validé, et les données importées ()
        let format: DataImportFormatVO = await ModuleDAO.getInstance().getVoById<DataImportFormatVO>(DataImportFormatVO.API_TYPE_ID, importHistoric.data_import_format_id);
        let raw_imported_datas: IImportedData[] = await ModuleDAO.getInstance().getVos<IImportedData>(ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(format.api_type_id));

        if ((!format) || (!format.post_exec_module_id) || (!raw_imported_datas) || (!raw_imported_datas.length)) {
            await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION, "Aucune data formattée ou pas de module configuré", "import.errors.failed_importation_see_logs", DataImportLogVO.LOG_LEVEL_FATAL);
            return;
        }

        // On garde que les données, validées et importées
        let validated_imported_datas: IImportedData[] = [];
        for (let i in raw_imported_datas) {
            if (raw_imported_datas[i].importation_state != ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT) {
                continue;
            }
            validated_imported_datas.push(raw_imported_datas[i]);
        }

        if ((!validated_imported_datas) || (!validated_imported_datas.length)) {
            await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION, "Aucune data validée pour importation", "import.errors.failed_importation_see_logs", DataImportLogVO.LOG_LEVEL_FATAL);
            return;
        }

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

                let inserteds: InsertOrDeleteQueryResult[] = await ModuleDAO.getInstance().insertOrUpdateVOs(insertable_datas);

                if ((!inserteds) || (inserteds.length != insertable_datas.length)) {

                    for (let i in validated_imported_datas) {
                        validated_imported_datas[i].importation_state = ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION;
                    }
                    await ModuleDAO.getInstance().insertOrUpdateVOs(validated_imported_datas);

                    await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION, "Le nombre d'éléments importés ne correspond pas au nombre d'éléments validés", "import.errors.failed_importation_numbers_not_matching", DataImportLogVO.LOG_LEVEL_FATAL);
                    return;
                }

                break;
            default:
                await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION, "Type d\'importation non supporté", "import.errors.failed_importation_unknown_import_type", DataImportLogVO.LOG_LEVEL_FATAL);
                return;
        }

        for (let i in validated_imported_datas) {
            validated_imported_datas[i].importation_state = ModuleDataImport.IMPORTATION_STATE_IMPORTED;
        }
        await ModuleDAO.getInstance().insertOrUpdateVOs(validated_imported_datas);

        // 3 - Mettre à jour le status et informer le client
        await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_IMPORTED, "Import terminé", "import.success.imported", DataImportLogVO.LOG_LEVEL_SUCCESS);
    }

    /**
     * 1 - Récupérer le format validé, et les données importées ()
     * 2 - Post-traiter les données
     * 3 - Mettre à jour le status et informer le client
     */
    public async posttreatDatas(importHistoric: DataImportHistoricVO): Promise<void> {

        //  1 - Récupérer le format validé, et les données importées ()
        let format: DataImportFormatVO = await ModuleDAO.getInstance().getVoById<DataImportFormatVO>(DataImportFormatVO.API_TYPE_ID, importHistoric.data_import_format_id);
        let raw_imported_datas: IImportedData[] = await ModuleDAO.getInstance().getVos<IImportedData>(ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(format.api_type_id));

        if ((!format) || (!format.post_exec_module_id) || (!raw_imported_datas) || (!raw_imported_datas.length)) {
            await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT, "Aucune data formattée ou pas de module configuré", "import.errors.failed_post_treatement_see_logs", DataImportLogVO.LOG_LEVEL_FATAL);
            return;
        }

        // On garde que les données, validées et importées
        let validated_imported_datas: IImportedData[] = [];
        for (let i in raw_imported_datas) {
            if (raw_imported_datas[i].importation_state != ModuleDataImport.IMPORTATION_STATE_IMPORTED) {
                continue;
            }
            validated_imported_datas.push(raw_imported_datas[i]);
        }

        let postTreated = false;
        let postTreatementModuleVO: ModuleVO = await ModuleDAO.getInstance().getVoById<ModuleVO>(ModuleVO.API_TYPE_ID, format.post_exec_module_id);

        if ((!validated_imported_datas) || (!validated_imported_datas.length)) {
            await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT, "Aucune data importée", "import.errors.failed_post_treatement_see_logs", DataImportLogVO.LOG_LEVEL_FATAL);
            return;
        }
        if ((!postTreatementModuleVO) || (!postTreatementModuleVO.name)) {
            await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT, "Impossible de retrouver le module", "import.errors.failed_post_treatement_see_logs", DataImportLogVO.LOG_LEVEL_FATAL);
            return;
        }

        //  2 - Post-traiter les données
        // PostTraitement des données avec les hooks pour générer les questions et intégrer ce qui peut l'être
        let postTraitementModule: DataImportModuleBase<any> = (ModulesManager.getInstance().getModuleByNameAndRole(postTreatementModuleVO.name, DataImportModuleBase.DataImportRoleName)) as DataImportModuleBase<any>;
        try {
            if (await postTraitementModule.hook_merge_imported_datas_in_database(validated_imported_datas, importHistoric)) {
                postTreated = true;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT, "Le post-traitement a échoué :" + error, "import.errors.failed_post_treatement_see_logs", DataImportLogVO.LOG_LEVEL_FATAL);
            return;
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

        await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_POSTTREATED, "Fin import : " + moment().utc(true).format("Y-MM-DD HH:mm"), "import.success.posttreated", DataImportLogVO.LOG_LEVEL_SUCCESS);
    }

    public async updateImportHistoric(importHistoric: DataImportHistoricVO) {
        await ModuleDAO.getInstance().insertOrUpdateVO(importHistoric);
        await PushDataServerController.getInstance().notifyDAOGetVoById(importHistoric.user_id, null, DataImportHistoricVO.API_TYPE_ID, importHistoric.id);
    }

    public async logAndUpdateHistoric(importHistoric: DataImportHistoricVO, format: DataImportFormatVO, import_state: number, logmsg: string, notif_code: string, log_lvl: number) {

        importHistoric.state = import_state;

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

    private async insertImportedDatasInDb(vos: IImportedData[], api_type_id: string, moduleTable: ModuleTable<any>): Promise<InsertOrDeleteQueryResult[]> {

        // Avant de remplir la base, on la vide.
        await ModuleDAOServer.getInstance().truncate(api_type_id);

        let insertVos: IImportedData[] = [];

        for (let i in vos) {
            let vo: IImportedData = vos[i];

            // let hasIncompatibleData: boolean = false;
            // for (const f in moduleTable.fields) {

            //     if (typeof vo[moduleTable.fields[f].field_id] != "undefined") {

            //         // On peut tester le format des datas suivant le type source et le type dest pour voir si c'est cohérent
            //         //  et mettre à jour hasIncompatibleData
            //     }
            // }

            insertVos.push(vo);
        }

        return ModuleDAO.getInstance().insertOrUpdateVOs(insertVos);
    }

    private async setImportHistoricUID(importHistoric: DataImportHistoricVO): Promise<void> {
        importHistoric.historic_uid = importHistoric.id.toString();
        await ModuleDAO.getInstance().insertOrUpdateVO(importHistoric);
    }

    private async handleImportHistoricDateUpdate(vo_update_handler: DAOUpdateVOHolder<DataImportHistoricVO>): Promise<boolean> {

        let importHistoric: DataImportHistoricVO = vo_update_handler.post_update_vo;

        if (importHistoric.state != ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT) {
            importHistoric.last_up_date = moment().utc(true);
        }

        if (!importHistoric.end_date) {
            if ((importHistoric.state == ModuleDataImport.IMPORTATION_STATE_POSTTREATED) ||
                (importHistoric.state == ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION) ||
                (importHistoric.state == ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT) ||
                (importHistoric.state == ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED)) {
                importHistoric.end_date = moment().utc(true);
            }
        }

        // Dans le cas d'un réimport, on met à jour le state de l'import qu'on réimporte
        if (!!importHistoric.reimport_of_dih_id) {
            let reimport_of_dih: DataImportHistoricVO = await ModuleDAO.getInstance().getVoById<DataImportHistoricVO>(DataImportHistoricVO.API_TYPE_ID, importHistoric.reimport_of_dih_id);
            reimport_of_dih.status_of_last_reimport = importHistoric.state;
            await ModuleDAO.getInstance().insertOrUpdateVO(reimport_of_dih);
        }

        return true;
    }

    private async handleImportHistoricDateCreation(importHistoric: DataImportHistoricVO): Promise<boolean> {
        importHistoric.start_date = moment().utc(true);

        // Dans le cas d'un réimport, on met à jour le state de l'import qu'on réimporte
        if (!!importHistoric.reimport_of_dih_id) {
            let reimport_of_dih: DataImportHistoricVO = await ModuleDAO.getInstance().getVoById<DataImportHistoricVO>(DataImportHistoricVO.API_TYPE_ID, importHistoric.reimport_of_dih_id);
            reimport_of_dih.status_of_last_reimport = importHistoric.state;
            await ModuleDAO.getInstance().insertOrUpdateVO(reimport_of_dih);
        }

        return true;
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
}
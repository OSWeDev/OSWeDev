import { Express, Request, Response } from 'express';
import * as formidable from 'express-formidable';
import * as moment from 'moment';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import NumberParamVO from '../../../shared/modules/API/vos/apis/NumberParamVO';
import StringParamVO from '../../../shared/modules/API/vos/apis/StringParamVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import IImportData from '../../../shared/modules/DataImport/interfaces/IImportData';
import IImportOptions from '../../../shared/modules/DataImport/interfaces/IImportOptions';
import ModuleDataImport from '../../../shared/modules/DataImport/ModuleDataImport';
import DataImportColumnVO from '../../../shared/modules/DataImport/vos/DataImportColumnVO';
import DataImportFileVO from '../../../shared/modules/DataImport/vos/DataImportFileVO';
import DataImportHistoricVO from '../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import DataImportLogVO from '../../../shared/modules/DataImport/vos/DataImportLogVO';
import ModulesManager from '../../../shared/modules/ModulesManager';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleServerBase from '../ModuleServerBase';
import DataImportModuleBase from './DataImportModuleBase/DataImportModuleBase';
import ImportTypeXLSXHandler from './ImportTypeHandlers/ImportTypeXLSXHandler';
import ImportLogger from './logger/ImportLogger';
import DAOTriggerHook from '../DAO/triggers/DAOTriggerHook';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import DateHandler from '../../../shared/tools/DateHandler';
import NotificationVO from '../../../shared/modules/PushData/vos/NotificationVO';
import ModulePushData from '../../../shared/modules/PushData/ModulePushData';
import ModulePushDataServer from '../PushData/ModulePushDataServer';

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

    public async configure() {

        // Triggers pour mettre à jour les dates
        let preCreateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_CREATE_TRIGGER);
        let preUpdateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        preUpdateTrigger.registerHandler(DataImportHistoricVO.API_TYPE_ID, this.handleImportHistoricDateUpdate.bind(this));
        preCreateTrigger.registerHandler(DataImportHistoricVO.API_TYPE_ID, this.handleImportHistoricDateCreation.bind(this));

        // Triggers pour faire avancer l'import
        let postUpdateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_POST_UPDATE_TRIGGER);
        let postCreateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_POST_CREATE_TRIGGER);
        postUpdateTrigger.registerHandler(DataImportHistoricVO.API_TYPE_ID, this.handleImportHistoricProgression.bind(this));
        postCreateTrigger.registerHandler(DataImportHistoricVO.API_TYPE_ID, this.handleImportHistoricProgression.bind(this));
    }

    private async handleImportHistoricDateUpdate(importHistoric: DataImportHistoricVO): Promise<boolean> {
        importHistoric.last_up_date = DateHandler.getInstance().formatDateTimeForBDD(moment());

        if (!importHistoric.end_date) {
            if ((importHistoric.state == ModuleDataImport.IMPORTATION_STATE_POSTTREATED) ||
                (importHistoric.state == ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION) ||
                (importHistoric.state == ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT) ||
                (importHistoric.state == ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED)) {
                importHistoric.end_date = DateHandler.getInstance().formatDateTimeForBDD(moment());
            }
        }
        return true;
    }

    private async handleImportHistoricDateCreation(importHistoric: DataImportHistoricVO): Promise<boolean> {
        importHistoric.start_date = DateHandler.getInstance().formatDateTimeForBDD(moment());
        return true;
    }

    private async handleImportHistoricProgression(importHistoric: DataImportHistoricVO): Promise<void> {

        if (!(importHistoric && importHistoric.id)) {
            return;
        }

        // Call the workers async to give the hand back to the client, but change the state right now since we're ready to launch the trigger
        // The updates will be pushed later on, no need to wait
        switch (importHistoric.state) {
            case ModuleDataImport.IMPORTATION_STATE_UPLOADED:
                importHistoric.state = ModuleDataImport.IMPORTATION_STATE_FORMATTING;
                await ModuleDAO.getInstance().insertOrUpdateVO(importHistoric);
                this.formatDatas(importHistoric);
                break;

            case ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT:
                importHistoric.state = ModuleDataImport.IMPORTATION_STATE_IMPORTING;
                await ModuleDAO.getInstance().insertOrUpdateVO(importHistoric);
                this.importDatas(importHistoric);
                break;

            case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
                importHistoric.state = ModuleDataImport.IMPORTATION_STATE_POSTTREATING;
                await ModuleDAO.getInstance().insertOrUpdateVO(importHistoric);
                this.posttreatDatas(importHistoric);
                break;

            default:
                return;
        }
    }

    private async formatDatas(importHistoric: DataImportHistoricVO): Promise<void> {

        //  1 - Récupérer les différents formats possible, 
        //  2 - Choisir le format le plus adapté
        //  3 - Importer dans le vo intermédiaire
        //  4 - Mettre à jour le status et informer le client de la mise à jour du DAO

        // 4
        importHistoric.state = ModuleDataImport.IMPORTATION_STATE_FORMATTED;
        await ModuleDAO.getInstance().insertOrUpdateVO(importHistoric);
        await ModulePushDataServer.getInstance().notifyDAOGetVoById(importHistoric.user_id, DataImportHistoricVO.API_TYPE_ID, importHistoric.id);
    }

    private async importDatas(importHistoric: DataImportHistoricVO): Promise<void> {

        //  1 - Récupérer le format validé, et les données validées
        //  2 - Importer dans le vo cible, suivant le mode d'importation (remplacement ou mise à jour)
        //  3 - Mettre à jour le status et informer le client

        importHistoric.state = ModuleDataImport.IMPORTATION_STATE_IMPORTED;
        await ModuleDAO.getInstance().insertOrUpdateVO(importHistoric);
        await ModulePushDataServer.getInstance().notifyDAOGetVoById(importHistoric.user_id, DataImportHistoricVO.API_TYPE_ID, importHistoric.id);
    }

    private async posttreatDatas(importHistoric: DataImportHistoricVO): Promise<void> {

        //  1 - Récupérer le format validé, et les données importées ()
        //  2 - Importer dans le vo cible, suivant le mode d'importation (remplacement ou mise à jour)
        //  3 - Mettre à jour le status et informer le client

        importHistoric.state = ModuleDataImport.IMPORTATION_STATE_POSTTREATED;
        await ModuleDAO.getInstance().insertOrUpdateVO(importHistoric);
        await ModulePushDataServer.getInstance().notifyDAOGetVoById(importHistoric.user_id, DataImportHistoricVO.API_TYPE_ID, importHistoric.id);
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataImport.APINAME_getDataImportHistorics, this.getDataImportHistorics.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataImport.APINAME_getDataImportHistoric, this.getDataImportHistoric.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataImport.APINAME_getDataImportLogs, this.getDataImportLogs.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataImport.APINAME_getDataImportFiles, this.getDataImportFiles.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataImport.APINAME_getDataImportFile, this.getDataImportFile.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataImport.APINAME_getDataImportColumnsFromFileId, this.getDataImportColumnsFromFileId.bind(this));
    }

    public async getDataImportHistorics(param: NumberParamVO): Promise<DataImportHistoricVO[]> {

        return await ModuleDAOServer.getInstance().selectAll<DataImportHistoricVO>(
            DataImportHistoricVO.API_TYPE_ID, 'WHERE t.data_import_file_id = $1 LIMIT 50;', [param.num]);
    }

    public async getDataImportHistoric(param: NumberParamVO): Promise<DataImportHistoricVO> {

        return await ModuleDAOServer.getInstance().selectOne<DataImportHistoricVO>(
            DataImportHistoricVO.API_TYPE_ID, 'WHERE t.id = $1;', [param.num]);
    }

    public async getDataImportLogs(param: NumberParamVO): Promise<DataImportLogVO[]> {

        return await ModuleDAOServer.getInstance().selectAll<DataImportLogVO>(
            DataImportLogVO.API_TYPE_ID, 'WHERE t.data_import_file_id = $1 LIMIT 50;', [param.num]);
    }

    public async getDataImportFiles(): Promise<DataImportFileVO[]> {

        return await ModuleDAO.getInstance().getVos<DataImportFileVO>(DataImportFileVO.API_TYPE_ID);
    }

    public async getDataImportFile(param: StringParamVO): Promise<DataImportFileVO> {

        return await ModuleDAOServer.getInstance().selectOne<DataImportFileVO>(
            DataImportFileVO.API_TYPE_ID, 'WHERE t.import_uid = $1', [param.text]);
    }

    public async getDataImportColumnsFromFileId(param: NumberParamVO): Promise<DataImportColumnVO[]> {

        return await ModuleDAOServer.getInstance().selectAll<DataImportColumnVO>(
            DataImportColumnVO.API_TYPE_ID, 'WHERE t.data_import_file_id = $1', [param.num]);
    }

    public registerExpressApis(app) {
        this.registerExpressApi_importFile(app);
    }

    /**
     * Cette API nécessite un paramètre import_uid qui correspond au DataImportFileVO.import_uid
     */
    private async resolveExpressApi_importFile(req: Request, res: Response) {

        let historic: DataImportHistoricVO = null;
        try {

            let import_uid: string = req.params.import_uid;
            let import_target_date: string = req.params.import_target_date as string;
            let options: IImportOptions = req.fields.options ? JSON.parse(req.fields.options as string) : null;
            console.log('IMPORT : ' + import_uid);

            let dataImportFile: DataImportFileVO = null;
            try {
                dataImportFile = await ModuleDataImport.getInstance().getDataImportFile(import_uid);
            } catch (error) {
                console.error(error);
                this.handleApiError_importFile(res);
                return;
            }

            // On prépare tout de suite le Log d'import
            historic = await ImportLogger.getInstance().newImportHistoric(dataImportFile, moment(import_target_date));

            // et on répond de suite à la requête
            res.json(historic);

            // On charge les informations de ce type d'import
            let dataImportColumns: DataImportColumnVO[] = null;
            let import_file = null;

            try {
                dataImportFile = await ModuleDataImport.getInstance().getDataImportFile(import_uid);
                dataImportColumns = await ModuleDataImport.getInstance().getDataImportColumnsFromFileId(dataImportFile.id);
                import_file = req.files[Object.keys(req.files)[0]];
            } catch (error) {
                console.error(error);
                dataImportFile = null;
                await ImportLogger.getInstance().log(historic, error, DataImportLogVO.LOG_LEVEL_ERROR);
            }

            if ((!dataImportFile) || (!dataImportColumns)) {
                await ImportLogger.getInstance().log(historic, "Impossible de charger les informations d'importation de ce fichier : '" + import_uid + "'. Abandon.", DataImportLogVO.LOG_LEVEL_FATAL, false);
                await ImportLogger.getInstance().updateImportHistoric(historic, DataImportHistoricVO.IMPORT_STATE_FAILED);
                // this.handleApiError_importFile(res);
                return;
            }

            let datas: IImportData[] = [];
            switch (dataImportFile.type) {
                case DataImportFileVO.TYPE_XLS:
                case DataImportFileVO.TYPE_XLSX:
                    datas = await ImportTypeXLSXHandler.getInstance().importFile(dataImportFile, dataImportColumns, historic, import_uid, import_file, moment(import_target_date));
                    break;
                default:
                    datas = await ImportTypeXLSXHandler.getInstance().importFile(dataImportFile, dataImportColumns, historic, import_uid, import_file, moment(import_target_date));
            }

            if (!datas) {
                await ImportLogger.getInstance().log(historic, "Aucune data à importer. Abandon.", DataImportLogVO.LOG_LEVEL_WARN, false);
                await ImportLogger.getInstance().updateImportHistoric(historic, DataImportHistoricVO.IMPORT_STATE_NODATA);
                // this.handleApiError_importFile(res);
                return;
            }

            let postTreated = false;
            try {

                // PostTraitement des données avec les hooks pour générer les questions et intégrer ce qui peut l'être
                let postTraitementModule: DataImportModuleBase = (ModulesManager.getInstance().getModuleByNameAndRole(dataImportFile.post_traitement_module, DataImportModuleBase.DataImportRoleName)) as DataImportModuleBase;

                if (await postTraitementModule.hook_merge_imported_datas_in_database(datas, import_target_date, historic, options)) {

                    postTreated = true;
                }
            } catch (error) {
                console.error(error);
                await ImportLogger.getInstance().log(historic, error, DataImportLogVO.LOG_LEVEL_ERROR, false);
                postTreated = false;
            }

            if (!postTreated) {
                await ImportLogger.getInstance().log(historic, "Impossible de posttraiter les datas : '" + import_uid + "'. Abandon.", DataImportLogVO.LOG_LEVEL_FATAL, false);
                await ImportLogger.getInstance().updateImportHistoric(historic, DataImportHistoricVO.IMPORT_STATE_POSTTRAITMENT_FAILED);
                // this.handleApiError_importFile(res);
                return;
            }

            // à la fin on indique le bon fonctionnement
            await ImportLogger.getInstance().log(historic, "Fin import : " + moment().format("Y-MM-DD HH:mm"), DataImportLogVO.LOG_LEVEL_INFO, false);
            await ImportLogger.getInstance().updateImportHistoric(historic, DataImportHistoricVO.IMPORT_STATE_OK);
        } catch (error) {
            console.error(error);
            // res.send(null);
            return;
        }
        // res.send(historic);
    }
    private handleApiError_importFile(res: Response) {
        console.error("handleApiError_importFile");
        res.statusCode = DataImportHistoricVO.FAILED_HTML_STATUS;
        res.send(null);
    }
    private registerExpressApi_importFile(app: Express) {
        app.post('/modules/ModuleDataImport/ImportFile/:import_uid/:import_target_date', formidable(), this.resolveExpressApi_importFile.bind(this));
    }
}
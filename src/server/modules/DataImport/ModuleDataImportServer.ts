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
            DataImportFileVO.API_TYPE_ID, 'WHERE t.import_name = $1', [param.text]);
    }

    public async getDataImportColumnsFromFileId(param: NumberParamVO): Promise<DataImportColumnVO[]> {

        return await ModuleDAOServer.getInstance().selectAll<DataImportColumnVO>(
            DataImportColumnVO.API_TYPE_ID, 'WHERE t.data_import_file_id = $1', [param.num]);
    }

    public registerExpressApis(app) {
        this.registerExpressApi_importFile(app);
    }

    /**
     * Cette API nécessite un paramètre import_name qui correspond au DataImportFileVO.import_name
     */
    private async resolveExpressApi_importFile(req: Request, res: Response) {

        let historic: DataImportHistoricVO = null;
        try {

            let import_name: string = req.params.import_name;
            let import_target_date: string = req.params.import_target_date as string;
            let options: IImportOptions = req.fields.options ? JSON.parse(req.fields.options as string) : null;
            console.log('IMPORT : ' + import_name);

            let dataImportFile: DataImportFileVO = null;
            try {
                dataImportFile = await ModuleDataImport.getInstance().getDataImportFile(import_name);
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
                dataImportFile = await ModuleDataImport.getInstance().getDataImportFile(import_name);
                dataImportColumns = await ModuleDataImport.getInstance().getDataImportColumnsFromFileId(dataImportFile.id);
                import_file = req.files[Object.keys(req.files)[0]];
            } catch (error) {
                console.error(error);
                dataImportFile = null;
                await ImportLogger.getInstance().log(historic, error, DataImportLogVO.LOG_LEVEL_50_ERROR);
            }

            if ((!dataImportFile) || (!dataImportColumns)) {
                await ImportLogger.getInstance().log(historic, "Impossible de charger les informations d'importation de ce fichier : '" + import_name + "'. Abandon.", DataImportLogVO.LOG_LEVEL_100_FATAL, false);
                await ImportLogger.getInstance().updateImportHistoric(historic, DataImportHistoricVO.IMPORT_STATE_FAILED);
                // this.handleApiError_importFile(res);
                return;
            }

            let datas: IImportData[] = [];
            switch (dataImportFile.type) {
                case DataImportFileVO.TYPE_XLS:
                case DataImportFileVO.TYPE_XLSX:
                    datas = await ImportTypeXLSXHandler.getInstance().importFile(dataImportFile, dataImportColumns, historic, import_name, import_file, moment(import_target_date));
                    break;
                default:
                    datas = await ImportTypeXLSXHandler.getInstance().importFile(dataImportFile, dataImportColumns, historic, import_name, import_file, moment(import_target_date));
            }

            if (!datas) {
                await ImportLogger.getInstance().log(historic, "Aucune data à importer. Abandon.", DataImportLogVO.LOG_LEVEL_25_WARN, false);
                await ImportLogger.getInstance().updateImportHistoric(historic, DataImportHistoricVO.IMPORT_STATE_NODATA);
                // this.handleApiError_importFile(res);
                return;
            }

            let postTreated = false;
            try {

                // PostTraitement des données avec les hooks pour générer les questions et intégrer ce qui peut l'être
                let postTraitementModule: DataImportModuleBase = ModulesManager.getInstance().getModuleByNameAndRole(dataImportFile.post_traitement_module, DataImportModuleBase.DataImportRoleName) as DataImportModuleBase;

                if (await postTraitementModule.hook_merge_imported_datas_in_database(datas, import_target_date, historic, options)) {

                    postTreated = true;
                }
            } catch (error) {
                console.error(error);
                await ImportLogger.getInstance().log(historic, error, DataImportLogVO.LOG_LEVEL_50_ERROR, false);
                postTreated = false;
            }

            if (!postTreated) {
                await ImportLogger.getInstance().log(historic, "Impossible de posttraiter les datas : '" + import_name + "'. Abandon.", DataImportLogVO.LOG_LEVEL_100_FATAL, false);
                await ImportLogger.getInstance().updateImportHistoric(historic, DataImportHistoricVO.IMPORT_STATE_POSTTRAITMENT_FAILED);
                // this.handleApiError_importFile(res);
                return;
            }

            // à la fin on indique le bon fonctionnement
            await ImportLogger.getInstance().log(historic, "Fin import : " + moment().format("Y-MM-DD HH:mm"), DataImportLogVO.LOG_LEVEL_10_INFO, false);
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
        app.post('/modules/ModuleDataImport/ImportFile/:import_name/:import_target_date', formidable(), this.resolveExpressApi_importFile.bind(this));
    }
}
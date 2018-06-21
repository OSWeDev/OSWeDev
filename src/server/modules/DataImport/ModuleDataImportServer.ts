import * as moment from 'moment';
import ModuleServerBase from '../ModuleServerBase';
import { Express, Request, Response } from 'express';
import * as formidable from 'express-formidable';
import DataImportFileVO from '../../../shared/modules/DataImport/vos/DataImportFileVO';
import ModuleDataImport from '../../../shared/modules/DataImport/ModuleDataImport';
import DataImportLogVO from '../../../shared/modules/DataImport/vos/DataImportLogVO';
import DataImportColumnVO from '../../../shared/modules/DataImport/vos/DataImportColumnVO';
import ImportTypeXLSXHandler from './ImportTypeHandlers/ImportTypeXLSXHandler';
import ModulesManager from '../../../shared/modules/ModulesManager';
import DataImportModuleBase from './DataImportModuleBase/DataImportModuleBase';
import IImportData from '../../../shared/modules/DataImport/interfaces/IImportData';
import IImportOptions from '../../../shared/modules/DataImport/interfaces/IImportOptions';
import ImportLogger from './logger/ImportLogger';
import DataImportHistoricVO from '../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import GetAPIDefinition from '../../../shared/modules/API/vos/GetAPIDefinition';

export default class ModuleDataImportServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleDataImportServer.instance) {
            ModuleDataImportServer.instance = new ModuleDataImportServer();
        }
        return ModuleDataImportServer.instance;
    }

    private static instance: ModuleDataImportServer = null;

    get actif(): boolean {
        return ModuleDataImport.getInstance().actif;
    }

    public registerApis() {
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<number, DataImportHistoricVO[]>(
            ModuleDataImport.APINAME_getDataImportHistorics,
            [DataImportHistoricVO.API_TYPE_ID],
            this.getDataImportHistorics.bind(this)
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<number, DataImportHistoricVO>(
            ModuleDataImport.APINAME_getDataImportHistoric,
            [DataImportHistoricVO.API_TYPE_ID],
            this.getDataImportHistoric.bind(this)
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<number, DataImportLogVO[]>(
            ModuleDataImport.APINAME_getDataImportLogs,
            [DataImportLogVO.API_TYPE_ID],
            this.getDataImportLogs.bind(this)
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<void, DataImportFileVO[]>(
            ModuleDataImport.APINAME_getDataImportFiles,
            [DataImportFileVO.API_TYPE_ID],
            this.getDataImportFiles.bind(this)
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<string, DataImportFileVO>(
            ModuleDataImport.APINAME_getDataImportFile,
            [DataImportFileVO.API_TYPE_ID],
            this.getDataImportFile.bind(this)
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<number, DataImportColumnVO[]>(
            ModuleDataImport.APINAME_getDataImportColumnsFromFileId,
            [DataImportColumnVO.API_TYPE_ID],
            this.getDataImportColumnsFromFileId.bind(this)
        ));
    }

    public async getDataImportHistorics(data_import_file_id: number): Promise<DataImportHistoricVO[]> {

        return await ModuleDAO.getInstance().selectAll<DataImportHistoricVO>(
            DataImportHistoricVO.API_TYPE_ID, 'WHERE t.data_import_file_id = $1 LIMIT 50;', [data_import_file_id]);
    }

    public async getDataImportHistoric(historic_id: number): Promise<DataImportHistoricVO> {

        return await ModuleDAO.getInstance().selectOne<DataImportHistoricVO>(
            DataImportHistoricVO.API_TYPE_ID, 'WHERE t.id = $1;', [historic_id]);
    }

    public async getDataImportLogs(data_import_file_id: number): Promise<DataImportLogVO[]> {

        return await ModuleDAO.getInstance().selectAll<DataImportLogVO>(
            DataImportLogVO.API_TYPE_ID, 'WHERE t.data_import_file_id = $1 LIMIT 50;', [data_import_file_id]);
    }

    public async getDataImportFiles(): Promise<DataImportFileVO[]> {

        return await ModuleDAO.getInstance().getVos<DataImportFileVO>(DataImportFileVO.API_TYPE_ID);
    }

    public async getDataImportFile(import_name: string): Promise<DataImportFileVO> {

        return await ModuleDAO.getInstance().selectOne<DataImportFileVO>(
            DataImportFileVO.API_TYPE_ID, 'WHERE t.import_name = $1', [import_name]);
    }

    public async getDataImportColumnsFromFileId(data_import_file_id: number): Promise<DataImportColumnVO[]> {

        return await ModuleDAO.getInstance().selectAll<DataImportColumnVO>(
            DataImportColumnVO.API_TYPE_ID, 'WHERE t.data_import_file_id = $1', [data_import_file_id]);
    }

    private resolveExpressApi_getDataImportLogs(req: Request, res: Response) {
        const data_import_file_id = parseInt(req.params.data_import_file_id);

        ModuleDataImport.getInstance().getDataImportLogs(data_import_file_id).then((datas) => {
            res.json(datas);
        });
    }
    private registerExpressApi_getDataImportLogs(app: Express) {
        app.get('/modules/ModuleDataImport/getDataImportLogs/:data_import_file_id', this.resolveExpressApi_getDataImportLogs.bind(this));
    }

    private resolveExpressApi_getDataImportHistorics(req: Request, res: Response) {
        const data_import_file_id = parseInt(req.params.data_import_file_id);

        ModuleDataImport.getInstance().getDataImportHistorics(data_import_file_id).then((datas) => {
            res.json(datas);
        });
    }
    private registerExpressApi_getDataImportHistorics(app: Express) {
        app.get('/modules/ModuleDataImport/getDataImportHistorics/:data_import_file_id', this.resolveExpressApi_getDataImportHistorics.bind(this));
    }

    private resolveExpressApi_getDataImportHistoric(req: Request, res: Response) {
        const id = parseInt(req.params.id);

        ModuleDataImport.getInstance().getDataImportHistoric(id).then((datas) => {
            res.json(datas);
        });
    }
    private registerExpressApi_getDataImportHistoric(app: Express) {
        app.get('/modules/ModuleDataImport/getDataImportHistoric/:id', this.resolveExpressApi_getDataImportHistoric.bind(this));
    }

    private resolveExpressApi_getDataImportFile(req: Request, res: Response) {
        const import_name = req.params.import_name;

        ModuleDataImport.getInstance().getDataImportFile(import_name).then((datas) => {
            res.json(datas);
        });
    }
    private registerExpressApi_getDataImportFile(app: Express) {
        app.get('/modules/ModuleDataImport/getDataImportFile/:import_name', this.resolveExpressApi_getDataImportFile.bind(this));
    }

    private resolveExpressApi_getDataImportFiles(req: Request, res: Response) {

        ModuleDataImport.getInstance().getDataImportFiles().then((datas) => {
            res.json(datas);
        });
    }
    private registerExpressApi_getDataImportFiles(app: Express) {
        app.get('/modules/ModuleDataImport/getDataImportFiles', this.resolveExpressApi_getDataImportFiles.bind(this));
    }

    private resolveExpressApi_getDataImportColumnsFromFile(req: Request, res: Response) {
        const data_import_file_id = parseInt(req.params.data_import_file_id.toString());

        ModuleDataImport.getInstance().getDataImportColumnsFromFileId(data_import_file_id).then((datas) => {
            res.json(datas);
        });
    }
    private registerExpressApi_getDataImportColumnsFromFile(app: Express) {
        app.get('/modules/ModuleDataImport/getDataImportColumnsFromFile/:data_import_file_id', this.resolveExpressApi_getDataImportFile.bind(this));
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
        res.statusCode = DataImportHistoricVO.FAILED_HTML_STATUS;
        res.send(null);
    }
    private registerExpressApi_importFile(app: Express) {
        app.post('/modules/ModuleDataImport/ImportFile/:import_name/:import_target_date', formidable(), this.resolveExpressApi_importFile.bind(this));
    }
}
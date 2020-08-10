import * as moment from 'moment';
import * as XLSX from 'xlsx';
import { WorkBook } from 'xlsx';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleDataExport from '../../../shared/modules/DataExport/ModuleDataExport';
import ExportDataToMultiSheetsXLSXParamVO from '../../../shared/modules/DataExport/vos/apis/ExportDataToMultiSheetsXLSXParamVO';
import ExportDataToXLSXParamVO from '../../../shared/modules/DataExport/vos/apis/ExportDataToXLSXParamVO';
import ExportLogVO from '../../../shared/modules/DataExport/vos/apis/ExportLogVO';
import ExportHistoricVO from '../../../shared/modules/DataExport/vos/ExportHistoricVO';
import ModuleFile from '../../../shared/modules/File/ModuleFile';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleBGThreadServer from '../BGThread/ModuleBGThreadServer';
import DAOTriggerHook from '../DAO/triggers/DAOTriggerHook';
import ModuleServerBase from '../ModuleServerBase';
import DataExportBGThread from './bgthreads/DataExportBGThread';

export default class ModuleDataExportServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleDataExportServer.instance) {
            ModuleDataExportServer.instance = new ModuleDataExportServer();
        }
        return ModuleDataExportServer.instance;
    }

    private static instance: ModuleDataExportServer = null;

    private constructor() {
        super(ModuleDataExport.getInstance().name);
    }

    public async configure() {

        ModuleBGThreadServer.getInstance().registerBGThread(DataExportBGThread.getInstance());

        let preCreateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCreateTrigger.registerHandler(ExportHistoricVO.API_TYPE_ID, this.handleTriggerExportHistoricVOCreate.bind(this));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Exports'
        }, 'fields.labels.ref.module_data_export_export_log.___LABEL____user_id'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Fichier exporté : %%VAR%%EXPORT_TYPE_ID%%'
        }, 'export.default_mail.subject'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Cliquez sur le lien ci-dessous pour télcharger le fichier exporté.'
        }, 'export.default_mail.html'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Télécharger'
        }, 'export.default_mail.download'));


        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Export de données en cours...'
        }, 'DataExportBGThread.handleHistoric.start'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Export de données terminé, vous devriez le recevoir par mail'
        }, 'DataExportBGThread.handleHistoric.success'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Echec de l\'export de données'
        }, 'DataExportBGThread.handleHistoric.failed'));
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataExport.APINAME_ExportDataToXLSXParamVO, this.exportDataToXLSX.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataExport.APINAME_ExportDataToXLSXParamVOFile, this.exportDataToXLSXFile.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataExport.APINAME_ExportDataToMultiSheetsXLSXParamVO, this.exportDataToMultiSheetsXLSX.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataExport.APINAME_ExportDataToMultiSheetsXLSXParamVOFile, this.exportDataToMultiSheetsXLSXFile.bind(this));
    }

    public async exportDataToXLSX(params: ExportDataToXLSXParamVO): Promise<string> {
        let filepath: string = await this.exportDataToXLSX_base(params);
        await this.getFileVo(filepath, params.is_secured, params.file_access_policy_name);
        return filepath;
    }

    public async exportDataToXLSXFile(params: ExportDataToXLSXParamVO): Promise<FileVO> {

        let filepath: string = await this.exportDataToXLSX_base(params);

        let file: FileVO = new FileVO();
        file.path = filepath;
        file.file_access_policy_name = params.file_access_policy_name;
        file.is_secured = params.is_secured;
        let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(file);
        if ((!res) || (!res.id)) {
            ConsoleHandler.getInstance().error('Erreur lors de l\'enregistrement du fichier en base:' + filepath);
            return null;
        }
        file.id = parseInt(res.id.toString());

        return file;
    }

    private async exportDataToXLSX_base(params: ExportDataToXLSXParamVO): Promise<string> {

        if ((!params) || (!params.filename) || (!params.datas) || (!params.column_labels) || (!params.ordered_column_list)) {
            return null;
        }

        ConsoleHandler.getInstance().log('EXPORT : ' + params.filename);

        let worksheetColumns = [];
        for (let i in params.ordered_column_list) {
            worksheetColumns.push({ wch: 25 });
        }

        let workbook: WorkBook = XLSX.utils.book_new();

        let ws_data = [];
        let ws_row = [];
        for (let i in params.ordered_column_list) {
            let data_field_name: string = params.ordered_column_list[i];
            let title: string = params.column_labels[data_field_name];

            ws_row.push(title);
        }
        ws_data.push(ws_row);

        for (let r in params.datas) {
            let row_data = params.datas[r];
            ws_row = [];

            for (let i in params.ordered_column_list) {
                let data_field_name: string = params.ordered_column_list[i];
                let data = row_data[data_field_name];

                ws_row.push(data);
            }
            ws_data.push(ws_row);
        }

        let ws = XLSX.utils.aoa_to_sheet(ws_data);
        XLSX.utils.book_append_sheet(workbook, ws, "Datas");

        let filepath: string = (params.is_secured ? ModuleFile.SECURED_FILES_ROOT : ModuleFile.FILES_ROOT) + params.filename;
        XLSX.writeFile(workbook, filepath);

        let user_log_id: number = ModuleAccessPolicyServer.getInstance().getLoggedUserId();

        // On log l'export
        if (!!user_log_id) {
            await ModuleDAO.getInstance().insertOrUpdateVO(ExportLogVO.createNew(
                params.api_type_id,
                moment().utc(true),
                user_log_id
            ));
        }

        return filepath;
    }


    private async exportDataToMultiSheetsXLSX(params: ExportDataToMultiSheetsXLSXParamVO): Promise<string> {
        let filepath: string = await this.exportDataToMultiSheetsXLSX_base(params);
        await this.getFileVo(filepath, params.is_secured, params.file_access_policy_name);
        return filepath;
    }

    private async exportDataToMultiSheetsXLSXFile(params: ExportDataToMultiSheetsXLSXParamVO): Promise<FileVO> {

        let filepath: string = await this.exportDataToMultiSheetsXLSX_base(params);

        return await this.getFileVo(filepath, params.is_secured, params.file_access_policy_name);
    }

    private async getFileVo(filepath: string, is_secured: boolean, file_access_policy_name: string): Promise<FileVO> {
        let file: FileVO = new FileVO();
        file.path = filepath;
        file.file_access_policy_name = file_access_policy_name;
        file.is_secured = is_secured;
        let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(file);
        if ((!res) || (!res.id)) {
            ConsoleHandler.getInstance().error('Erreur lors de l\'enregistrement du fichier en base:' + filepath);
            return null;
        }
        file.id = parseInt(res.id.toString());

        return file;
    }

    private async exportDataToMultiSheetsXLSX_base(params: ExportDataToMultiSheetsXLSXParamVO): Promise<string> {

        if ((!params) || (!params.filename) || (!params.sheets) || (!ObjectHandler.getInstance().hasAtLeastOneAttribute(params.sheets))) {
            return null;
        }

        ConsoleHandler.getInstance().log('EXPORT : ' + params.filename);
        let workbook: WorkBook = XLSX.utils.book_new();

        for (let sheeti in params.sheets) {
            let sheet = params.sheets[sheeti];

            let worksheetColumns = [];
            for (let i in sheet.ordered_column_list) {
                worksheetColumns.push({ wch: 25 });
            }

            let ws_data = [];
            let ws_row = [];
            for (let i in sheet.ordered_column_list) {
                let data_field_name: string = sheet.ordered_column_list[i];
                let title: string = sheet.column_labels[data_field_name];

                ws_row.push(title);
            }
            ws_data.push(ws_row);

            for (let r in sheet.datas) {
                let row_data = sheet.datas[r];
                ws_row = [];

                for (let i in sheet.ordered_column_list) {
                    let data_field_name: string = sheet.ordered_column_list[i];
                    let data = row_data[data_field_name];

                    ws_row.push(data);
                }
                ws_data.push(ws_row);
            }

            let ws = XLSX.utils.aoa_to_sheet(ws_data);
            XLSX.utils.book_append_sheet(workbook, ws, sheet.sheet_name);
        }

        let filepath: string = (params.is_secured ? ModuleFile.SECURED_FILES_ROOT : ModuleFile.FILES_ROOT) + params.filename;
        XLSX.writeFile(workbook, filepath);

        let user_log_id: number = ModuleAccessPolicyServer.getInstance().getLoggedUserId();

        // On log l'export
        if (!!user_log_id) {
            await ModuleDAO.getInstance().insertOrUpdateVO(ExportLogVO.createNew(
                params.api_type_id,
                moment().utc(true),
                user_log_id
            ));
        }

        return filepath;
    }


    private async handleTriggerExportHistoricVOCreate(exhi: ExportHistoricVO): Promise<boolean> {

        exhi.creation_date = moment().utc(true);
        exhi.state = ExportHistoricVO.EXPORT_STATE_TODO;
        return true;
    }
}
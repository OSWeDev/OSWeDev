import * as moment from 'moment';
import * as XLSX from 'xlsx';
import { WorkBook } from 'xlsx';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleDataExport from '../../../shared/modules/DataExport/ModuleDataExport';
import ExportDataToXLSXParamVO from '../../../shared/modules/DataExport/vos/apis/ExportDataToXLSXParamVO';
import ExportLogVO from '../../../shared/modules/DataExport/vos/apis/ExportLogVO';
import ExportHistoricVO from '../../../shared/modules/DataExport/vos/ExportHistoricVO';
import ModuleFile from '../../../shared/modules/File/ModuleFile';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import DAOTriggerHook from '../DAO/triggers/DAOTriggerHook';
import ModuleServerBase from '../ModuleServerBase';
import IExportableDatas from './interfaces/IExportableDatas';
import ModuleBGThreadServer from '../BGThread/ModuleBGThreadServer';
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
    }

    public async exportDataToXLSX(params: ExportDataToXLSXParamVO): Promise<string> {
        return await this.exportDataToXLSX_base(params);
    }

    public async exportDataToXLSX_file(datas: ExportDataToXLSXParamVO, is_secured: boolean = false, file_access_policy_name: string = null): Promise<FileVO> {

        let filepath: string = await this.exportDataToXLSX_base(datas, is_secured, file_access_policy_name);

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

    private async exportDataToXLSX_base(datas: IExportableDatas, is_secured: boolean = false, file_access_policy_name: string = null): Promise<string> {

        if ((!datas) || (!datas.filename) || (!datas.datas) || (!datas.column_labels) || (!datas.ordered_column_list)) {
            return null;
        }

        ConsoleHandler.getInstance().log('EXPORT : ' + datas.filename);

        let worksheetColumns = [];
        for (let i in datas.ordered_column_list) {
            worksheetColumns.push({ wch: 25 });
        }

        let workbook: WorkBook = XLSX.utils.book_new();

        let ws_data = [];
        let ws_row = [];
        for (let i in datas.ordered_column_list) {
            let data_field_name: string = datas.ordered_column_list[i];
            let title: string = datas.column_labels[data_field_name];

            ws_row.push(title);
        }
        ws_data.push(ws_row);

        for (let r in datas.datas) {
            let row_data = datas.datas[r];
            ws_row = [];

            for (let i in datas.ordered_column_list) {
                let data_field_name: string = datas.ordered_column_list[i];
                let data = row_data[data_field_name];

                ws_row.push(data);
            }
            ws_data.push(ws_row);
        }

        let ws = XLSX.utils.aoa_to_sheet(ws_data);
        XLSX.utils.book_append_sheet(workbook, ws, "Datas");

        let filepath: string = (is_secured ? ModuleFile.SECURED_FILES_ROOT : ModuleFile.TEMP_FILES_ROOT) + datas.filename;
        XLSX.writeFile(workbook, filepath);

        let user_log_id: number = ModuleAccessPolicyServer.getInstance().getLoggedUserId();

        // On log l'export
        if (!!user_log_id) {
            await ModuleDAO.getInstance().insertOrUpdateVO(ExportLogVO.createNew(
                datas.api_type_id,
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
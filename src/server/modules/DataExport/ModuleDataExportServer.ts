
import * as XLSX from 'xlsx';
import { WorkBook } from 'xlsx';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleDataExport from '../../../shared/modules/DataExport/ModuleDataExport';
import ExportLogVO from '../../../shared/modules/DataExport/vos/apis/ExportLogVO';
import ExportHistoricVO from '../../../shared/modules/DataExport/vos/ExportHistoricVO';
import ModuleFile from '../../../shared/modules/File/ModuleFile';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import DateHandler from '../../../shared/tools/DateHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import StackContext from '../../StackContext';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleBGThreadServer from '../BGThread/ModuleBGThreadServer';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import ModuleServerBase from '../ModuleServerBase';
import DataExportBGThread from './bgthreads/DataExportBGThread';
import IExportableSheet from './interfaces/IExportableSheet';

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

        let preCreateTrigger: DAOPreCreateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCreateTrigger.registerHandler(ExportHistoricVO.API_TYPE_ID, this.handleTriggerExportHistoricVOCreate);

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Exports'
        }, 'fields.labels.ref.module_data_export_export_log.___LABEL____user_id'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Fichier exporté : %%VAR%%EXPORT_TYPE_ID%%'
        }, 'export.default_mail.subject'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Cliquez sur le lien ci-dessous pour télcharger le fichier exporté.'
        }, 'export.default_mail.html'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Télécharger'
        }, 'export.default_mail.download'));


        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Export de données en cours...'
        }, 'DataExportBGThread.handleHistoric.start'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Export de données terminé, vous devriez le recevoir par mail'
        }, 'DataExportBGThread.handleHistoric.success'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Echec de l\'export de données'
        }, 'DataExportBGThread.handleHistoric.failed'));
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDataExport.APINAME_ExportDataToXLSXParamVO, this.exportDataToXLSX.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDataExport.APINAME_ExportDataToXLSXParamVOFile, this.exportDataToXLSXFile.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDataExport.APINAME_ExportDataToMultiSheetsXLSXParamVO, this.exportDataToMultiSheetsXLSX.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDataExport.APINAME_ExportDataToMultiSheetsXLSXParamVOFile, this.exportDataToMultiSheetsXLSXFile.bind(this));
    }

    public async exportDataToXLSX(
        filename: string,
        datas: any[],
        ordered_column_list: string[],
        column_labels: { [field_name: string]: string },
        api_type_id: string,
        is_secured: boolean = false,
        file_access_policy_name: string = null): Promise<string> {
        let filepath: string = await this.exportDataToXLSX_base(
            filename,
            datas,
            ordered_column_list,
            column_labels,
            api_type_id,
            is_secured,
            file_access_policy_name
        );

        await this.getFileVo(filepath, is_secured, file_access_policy_name);
        return filepath;
    }

    public async exportDataToXLSXFile(
        filename: string,
        datas: any[],
        ordered_column_list: string[],
        column_labels: { [field_name: string]: string },
        api_type_id: string,
        is_secured: boolean = false,
        file_access_policy_name: string = null
    ): Promise<FileVO> {

        let filepath: string = await this.exportDataToXLSX_base(
            filename,
            datas,
            ordered_column_list,
            column_labels,
            api_type_id,
            is_secured,
            file_access_policy_name
        );

        let file: FileVO = new FileVO();
        file.path = filepath;
        file.file_access_policy_name = file_access_policy_name;
        file.is_secured = is_secured;
        let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(file);
        if ((!res) || (!res.id)) {
            ConsoleHandler.getInstance().error('Erreur lors de l\'enregistrement du fichier en base:' + filepath);
            return null;
        }
        file.id = res.id;

        return file;
    }

    /**
     * WARN : Pour exporter on doit pouvoir récupérer toutes les données, donc attention à la volumétrie avant de faire la demande...
     */
    public async exportModuletableDataToXLSXFile(
        api_type_id: string,
        lang_id: number = null,
        filename: string = null,
        file_access_policy_name: string = null
    ): Promise<FileVO> {

        let datas: any[] = [];
        let ordered_column_list: string[] = [];
        let column_labels: { [field_name: string]: string } = {};
        let modultable = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];
        filename = filename ? filename : api_type_id + '.xlsx';

        if (!lang_id) {
            let user = await ModuleAccessPolicyServer.getInstance().getSelfUser();
            if (!user) {
                ConsoleHandler.getInstance().error('Une langue doit être définie pour l\'export XLSX');
                return null;
            }
            lang_id = user.lang_id;
        }

        let vos = await ModuleDAO.getInstance().getVos(api_type_id);
        for (let i in vos) {
            let vo = modultable.get_xlsx_version(vos[i]);
            if (vo) {
                datas.push(vo);
            }
        }
        let fields = modultable.get_fields();
        for (let i in fields) {
            let field = fields[i];
            ordered_column_list.push(field.field_id);

            let text = await ModuleTranslation.getInstance().getTranslatableText(field.field_label.code_text);
            if (!text) {
                ConsoleHandler.getInstance().error('Code texte de colonne introuvable:' + field.field_label.code_text);
                continue;
            }
            let translation = await ModuleTranslation.getInstance().getTranslation(lang_id, text.id);
            if (!translation) {
                ConsoleHandler.getInstance().error('Traduction de colonne introuvable:' + field.field_label.code_text);
                continue;
            }
            column_labels[field.field_id] = translation.translated;
        }

        ordered_column_list.unshift("id");
        column_labels['id'] = 'id';

        file_access_policy_name = file_access_policy_name ? file_access_policy_name : ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS;

        let filepath: string = await this.exportDataToXLSX_base(
            filename,
            datas,
            ordered_column_list,
            column_labels,
            api_type_id,
            true,
            file_access_policy_name
        );

        let file: FileVO = new FileVO();
        file.path = filepath;
        file.file_access_policy_name = file_access_policy_name;
        file.is_secured = true;
        let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(file);
        if ((!res) || (!res.id)) {
            ConsoleHandler.getInstance().error('Erreur lors de l\'enregistrement du fichier en base:' + filepath);
            return null;
        }
        file.id = res.id;

        return file;
    }

    private async exportDataToXLSX_base(
        filename: string,
        datas: any[],
        ordered_column_list: string[],
        column_labels: { [field_name: string]: string },
        api_type_id: string,
        is_secured: boolean = false,
        file_access_policy_name: string = null
    ): Promise<string> {

        if ((!filename) || (!datas) || (!column_labels) || (!ordered_column_list)) {
            return null;
        }

        ConsoleHandler.getInstance().log('EXPORT : ' + filename);

        let worksheetColumns = [];
        for (let i in ordered_column_list) {
            worksheetColumns.push({ wch: 25 });
        }

        let workbook: WorkBook = XLSX.utils.book_new();

        let ws_data = [];
        let ws_row = [];
        for (let i in ordered_column_list) {
            let data_field_name: string = ordered_column_list[i];
            let title: string = column_labels[data_field_name];

            ws_row.push(title);
        }
        ws_data.push(ws_row);

        for (let r in datas) {
            let row_data = datas[r];
            ws_row = [];

            for (let i in ordered_column_list) {
                let data_field_name: string = ordered_column_list[i];
                let data = row_data[data_field_name];

                ws_row.push(data);
            }
            ws_data.push(ws_row);
        }

        let ws = XLSX.utils.aoa_to_sheet(ws_data);
        XLSX.utils.book_append_sheet(workbook, ws, "Datas");

        let filepath: string = (is_secured ? ModuleFile.SECURED_FILES_ROOT : ModuleFile.FILES_ROOT) + filename;
        XLSX.writeFile(workbook, filepath);

        let user_log_id: number = ModuleAccessPolicyServer.getInstance().getLoggedUserId();

        // On log l'export
        if (!!user_log_id) {

            await StackContext.getInstance().runPromise(
                { IS_CLIENT: false },
                async () => {
                    await ModuleDAO.getInstance().insertOrUpdateVO(ExportLogVO.createNew(
                        api_type_id ? api_type_id : 'N/A',
                        Dates.now(),
                        user_log_id
                    ));
                });
        }

        return filepath;
    }


    private async exportDataToMultiSheetsXLSX(
        filename: string,
        sheets: IExportableSheet[],
        api_type_id: string,
        is_secured: boolean = false,
        file_access_policy_name: string = null
    ): Promise<string> {
        let filepath: string = await this.exportDataToMultiSheetsXLSX_base(
            filename,
            sheets,
            api_type_id,
            is_secured,
            file_access_policy_name
        );
        await this.getFileVo(filepath, is_secured, file_access_policy_name);
        return filepath;
    }

    private async exportDataToMultiSheetsXLSXFile(
        filename: string,
        sheets: IExportableSheet[],
        api_type_id: string,
        is_secured: boolean = false,
        file_access_policy_name: string = null
    ): Promise<FileVO> {

        let filepath: string = await this.exportDataToMultiSheetsXLSX_base(
            filename,
            sheets,
            api_type_id,
            is_secured,
            file_access_policy_name
        );

        return await this.getFileVo(filepath, is_secured, file_access_policy_name);
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
        file.id = res.id;

        return file;
    }

    private async exportDataToMultiSheetsXLSX_base(
        filename: string,
        sheets: IExportableSheet[],
        api_type_id: string,
        is_secured: boolean = false,
        file_access_policy_name: string = null
    ): Promise<string> {

        if ((!filename) || (!sheets) || (!ObjectHandler.getInstance().hasAtLeastOneAttribute(sheets))) {
            return null;
        }

        ConsoleHandler.getInstance().log('EXPORT : ' + filename);
        let workbook: WorkBook = XLSX.utils.book_new();

        for (let sheeti in sheets) {
            let sheet = sheets[sheeti];

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

        let filepath: string = (is_secured ? ModuleFile.SECURED_FILES_ROOT : ModuleFile.FILES_ROOT) + filename;
        XLSX.writeFile(workbook, filepath);

        let user_log_id: number = ModuleAccessPolicyServer.getInstance().getLoggedUserId();

        // On log l'export
        if (!!user_log_id) {
            await StackContext.getInstance().runPromise(
                { IS_CLIENT: false },
                async () => {
                    await ModuleDAO.getInstance().insertOrUpdateVO(ExportLogVO.createNew(
                        api_type_id,
                        Dates.now(),
                        user_log_id
                    ));
                });
        }

        return filepath;
    }


    private async handleTriggerExportHistoricVOCreate(exhi: ExportHistoricVO): Promise<boolean> {

        exhi.creation_date = Dates.now();
        exhi.state = ExportHistoricVO.EXPORT_STATE_TODO;
        return true;
    }
}
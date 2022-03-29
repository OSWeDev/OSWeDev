
import { cloneDeep } from 'lodash';
import * as XLSX from 'xlsx';
import { WorkBook } from 'xlsx';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleContextFilter from '../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextQueryVO, { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleDataExport from '../../../shared/modules/DataExport/ModuleDataExport';
import ExportLogVO from '../../../shared/modules/DataExport/vos/apis/ExportLogVO';
import ExportHistoricVO from '../../../shared/modules/DataExport/vos/ExportHistoricVO';
import ModuleFile from '../../../shared/modules/File/ModuleFile';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import RangeHandler from '../../../shared/tools/RangeHandler';
import ConfigurationService from '../../env/ConfigurationService';
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
            'fr-fr': "Echec de l\'export du fichier : %%VAR%%EXPORT_TYPE_ID%%"
        }, 'export.default_mail_error.subject'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Cliquez sur le lien ci-dessous pour télécharger le fichier exporté.'
        }, 'export.default_mail.html'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Veuillez refaire votre demande d'export et nous excuser pour la gène occasionnée. Si le probleme persiste n'hésitez pas à nous en alerter"
        }, 'export.default_mail_error.html'));
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


        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDataExport.APINAME_ExportContextQueryToXLSXParamVO, this.exportContextQueryToXLSX.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleDataExport.APINAME_ExportContextQueryToXLSXParamVOFile, this.exportContextQueryToXLSXFile.bind(this));

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
     * Export des résultats d'un context_query en XLSX, et on télécharge le fichier directement
     */
    public async exportContextQueryToXLSX(
        filename: string,
        context_query: ContextQueryVO,
        ordered_column_list: string[],
        column_labels: { [field_name: string]: string },
        is_secured: boolean = false,
        file_access_policy_name: string = null): Promise<string> {

        let api_type_id = context_query.base_api_type_id;
        let datas = (context_query.fields && context_query.fields.length) ?
            await ModuleContextFilter.getInstance().select_datatable_rows(context_query) :
            await ModuleContextFilter.getInstance().select_vos(context_query);

        datas = await this.translate_context_query_fields_from_bdd(datas, context_query);

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

    public async translate_context_query_fields_from_bdd(datas: any[], context_query: ContextQueryVO): Promise<any[]> {
        if ((!datas) || (!datas.length)) {
            return null;
        }

        if (!context_query) {
            return null;
        }

        let res = cloneDeep(datas);

        if ((!context_query.fields) || !context_query.fields.length) {

            let table = VOsTypesManager.getInstance().moduleTables_by_voType[context_query.base_api_type_id];
            res = table.forceNumerics(res);
            for (let i in res) {
                let e = res[i];
                res[i] = this.get_xlsx_version(table, e);
            }
            return res;
        }

        let promises = [];
        let max = Math.max(1, Math.floor(ConfigurationService.getInstance().getNodeConfiguration().MAX_POOL / 2));
        for (let i in datas) {
            let data = datas[i];

            for (let j in context_query.fields) {
                let field = context_query.fields[j];

                if (promises.length >= max) {
                    await Promise.all(promises);
                    promises = [];
                }

                promises.push((async () => {
                    let table = VOsTypesManager.getInstance().moduleTables_by_voType[field.api_type_id];

                    // cas spécifique de l'id
                    if (field.field_id == 'id') {
                        res[i][field.alias] = parseInt(data[field.alias]);
                        return;
                    }

                    let table_field = table.get_field_by_id(field.field_id);

                    if (!table_field) {
                        ConsoleHandler.getInstance().error('translate_context_query_fields_from_bdd:Unknown field:' + field.field_id + ':type:' + field.api_type_id + ':');
                        throw new Error('Unknown field');
                    }

                    table.force_numeric_field(table_field, data, res[i], field.alias);
                    await this.field_to_xlsx(table_field, res[i], res[i], field.alias);
                })());
            }
        }

        await Promise.all(promises);

        return res;
    }

    /**
     * Export des résultats d'un context_query en XLSX, et on renvoie le file généré
     */
    public async exportContextQueryToXLSXFile(
        filename: string,
        context_query: ContextQueryVO,
        ordered_column_list: string[],
        column_labels: { [field_name: string]: string },
        is_secured: boolean = false,
        file_access_policy_name: string = null
    ): Promise<FileVO> {

        let api_type_id = context_query.base_api_type_id;
        let datas = (context_query.fields && context_query.fields.length) ?
            await ModuleContextFilter.getInstance().select_datatable_rows(context_query) :
            await ModuleContextFilter.getInstance().select_vos(context_query);

        datas = await this.translate_context_query_fields_from_bdd(datas, context_query);

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
            let vo = this.get_xlsx_version(modultable, vos[i]);
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

    /**
     * Permet de récupérer un clone dont les fields sont trasférable via l'api (en gros ça passe par un json.stringify).
     * Cela autorise l'usage en VO de fields dont les types sont incompatibles nativement avec json.stringify (moment par exemple qui sur un parse reste une string)
     * @param e Le VO dont on veut une version api
     */
    private async get_xlsx_version<T extends IDistantVOBase>(module_table: ModuleTable<any>, e: T): Promise<any> {
        if (!e) {
            return null;
        }

        let res = {};
        let fields = module_table.get_fields();

        if (!fields) {
            return cloneDeep(e);
        }

        res['_type'] = e._type;
        res['id'] = e.id;
        let promises = [];
        for (let i in fields) {
            let field = fields[i];

            promises.push(this.field_to_xlsx(field, e, res));
        }

        await Promise.all(promises);

        return res;
    }

    /**
     * Traduire le champs field.field_id de src_vo dans dest_vo dans l'optique d'un export excel
     * @param field le descriptif du champs à traduire
     * @param src_vo le vo source
     * @param dest_vo le vo de destination de la traduction (potentiellement le même que src_vo)
     * @param field_alias optionnel. Permet de définir un nom de champs différent du field_id utilisé dans le src_vo et le dest_vo typiquement en résultat d'un contextquery
     */
    private async field_to_xlsx(field: ModuleTableField<any>, src_vo: any, dest_vo: any, field_alias: string = null) {

        let field_id = field_alias ? field_alias : field.field_id;

        /**
         * Si le champ possible un custom_to_api
         */
        if (!!field.custom_translate_to_xlsx) {
            dest_vo[field_id] = field.custom_translate_to_xlsx(src_vo[field_id]);
            /**
             * Compatibilité MSGPACK : il traduit les undefind en null
             */
            if (typeof dest_vo[field_id] === 'undefined') {
                delete dest_vo[field_id];
            }
            return;
        }

        switch (field.field_type) {

            // TODO FIXME  export des ranges dans xlsx à réfléchir...

            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_refrange_array:
            case ModuleTableField.FIELD_TYPE_isoweekdays:
            case ModuleTableField.FIELD_TYPE_hourrange_array:
            case ModuleTableField.FIELD_TYPE_tstzrange_array:
                dest_vo[field_id] = RangeHandler.getInstance().translate_to_api(src_vo[field_id]);
                break;

            case ModuleTableField.FIELD_TYPE_numrange:
            case ModuleTableField.FIELD_TYPE_tsrange:
            case ModuleTableField.FIELD_TYPE_hourrange:
                dest_vo[field_id] = RangeHandler.getInstance().translate_range_to_api(src_vo[field_id]);
                break;

            case ModuleTableField.FIELD_TYPE_tstz:

                let date = src_vo[field_id] ? new Date(src_vo[field_id] * 1000) : null;
                dest_vo[field_id] = date;
                break;

            case ModuleTableField.FIELD_TYPE_tstz_array:
                if ((src_vo[field_id] === null) || (typeof src_vo[field_id] === 'undefined')) {
                    dest_vo[field_id] = src_vo[field_id];
                } else {
                    dest_vo[field_id] = (src_vo[field_id] as number[]).map((ts: number) => new Date(ts * 1000));
                }
                break;

            case ModuleTableField.FIELD_TYPE_plain_vo_obj:
                delete dest_vo[field_id];
                break;

            case ModuleTableField.FIELD_TYPE_enum:
                let user = await ModuleAccessPolicy.getInstance().getSelfUser();
                let trads: TranslationVO[] = await query(TranslationVO.API_TYPE_ID)
                    .filter_by_text_eq('code_text', field.enum_values[src_vo[field_id]], TranslatableTextVO.API_TYPE_ID)
                    .filter_by_num_in('lang_id', query(UserVO.API_TYPE_ID).field('lang_id').filter_by_id(user.id))
                    .select_vos();
                let trad = trads ? trads[0] : null;
                dest_vo[field_id] = trad ? trad.translated : null;
                break;

            case ModuleTableField.FIELD_TYPE_float:
            case ModuleTableField.FIELD_TYPE_decimal_full_precision:
            case ModuleTableField.FIELD_TYPE_amount:
            case ModuleTableField.FIELD_TYPE_file_ref:
            case ModuleTableField.FIELD_TYPE_image_ref:
            case ModuleTableField.FIELD_TYPE_foreign_key:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
            case ModuleTableField.FIELD_TYPE_int:
            case ModuleTableField.FIELD_TYPE_prct:
            case ModuleTableField.FIELD_TYPE_hour:
            default:
                dest_vo[field_id] = src_vo[field_id];
        }

        if (typeof dest_vo[field_id] === 'undefined') {
            delete dest_vo[field_id];
        }
    }
}
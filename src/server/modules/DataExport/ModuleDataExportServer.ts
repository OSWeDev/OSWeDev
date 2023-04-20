
import { cloneDeep } from 'lodash';
import * as XLSX from 'xlsx';
import { WorkBook } from 'xlsx';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ContextFilterHandler from '../../../shared/modules/ContextFilter/ContextFilterHandler';
import ModuleContextFilter from '../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVO from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryVO, { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import DatatableField from '../../../shared/modules/DAO/vos/datatable/DatatableField';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import DashboardBuilderController from '../../../shared/modules/DashboardBuilder/DashboardBuilderController';
import TableWidgetCustomFieldsController from '../../../shared/modules/DashboardBuilder/TableWidgetCustomFieldsController';
import TableColumnDescVO from '../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import IExportableSheet from '../../../shared/modules/DataExport/interfaces/IExportableSheet';
import { IExportOptions } from '../../../shared/modules/DataExport/interfaces/IExportOptions';
import ModuleDataExport from '../../../shared/modules/DataExport/ModuleDataExport';
import ExportLogVO from '../../../shared/modules/DataExport/vos/apis/ExportLogVO';
import ExportHistoricVO from '../../../shared/modules/DataExport/vos/ExportHistoricVO';
import ExportVarcolumnConf from '../../../shared/modules/DataExport/vos/ExportVarcolumnConf';
import { ExportVarIndicator } from '../../../shared/modules/DataExport/vos/ExportVarIndicator';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import ModuleFile from '../../../shared/modules/File/ModuleFile';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import SendInBlueMailVO from '../../../shared/modules/SendInBlue/vos/SendInBlueMailVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import ModuleVar from '../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import { VOsTypesManager } from '../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { filter_by_name } from '../../../shared/tools/Filters';
import LocaleManager from '../../../shared/tools/LocaleManager';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import { all_promises } from '../../../shared/tools/PromiseTools';
import RangeHandler from '../../../shared/tools/RangeHandler';
import ConfigurationService from '../../env/ConfigurationService';
import StackContext from '../../StackContext';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleBGThreadServer from '../BGThread/ModuleBGThreadServer';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import ModuleServerBase from '../ModuleServerBase';
import PushDataServerController from '../PushData/PushDataServerController';
import SendInBlueMailServerController from '../SendInBlue/SendInBlueMailServerController';
import VarsServerCallBackSubsController from '../Var/VarsServerCallBackSubsController';
import DataExportBGThread from './bgthreads/DataExportBGThread';
import ExportContextQueryToXLSXBGThread from './bgthreads/ExportContextQueryToXLSXBGThread';
import ExportContextQueryToXLSXQueryVO from './bgthreads/vos/ExportContextQueryToXLSXQueryVO';
import DataExportServerController from './DataExportServerController';

export default class ModuleDataExportServer extends ModuleServerBase {

    public static PARAM_NAME_SEND_IN_BLUE_TEMPLATE_ID: string = 'ModuleDataExport.export_mail_template_id';
    public static MAILCATEGORY_export_file_ready = 'MAILCATEGORY.ModuleDataExport_export_file_ready';

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
        ModuleBGThreadServer.getInstance().registerBGThread(ExportContextQueryToXLSXBGThread.getInstance());

        let preCreateTrigger: DAOPreCreateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCreateTrigger.registerHandler(ExportHistoricVO.API_TYPE_ID, this, this.handleTriggerExportHistoricVOCreate);

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Exports'
        }, 'fields.labels.ref.module_data_export_export_log.___LABEL____user_id'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Fichier exporté : %%VAR%%EXPORT_TYPE_ID%%'
        }, 'export.default_mail.subject'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Echec de l\'export du fichier : %%VAR%%EXPORT_TYPE_ID%%"
        }, 'export.default_mail_error.subject'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Cliquez sur le lien ci-dessous pour télécharger le fichier exporté.'
        }, 'export.default_mail.html'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': "Veuillez refaire votre demande d'export et nous excuser pour la gène occasionnée. Si le probleme persiste n'hésitez pas à nous en alerter"
        }, 'export.default_mail_error.html'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Télécharger'
        }, 'export.default_mail.download'));


        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Export de données en cours...'
        }, 'DataExportBGThread.handleHistoric.start'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Export de données terminé, vous devriez le recevoir par mail'
        }, 'DataExportBGThread.handleHistoric.success'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Echec de l\'export de données'
        }, 'DataExportBGThread.handleHistoric.failed'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Export en cours... vous recevrez un lien dans les notifications et par mail pour télécharger le fichier une fois l\'export terminé.'
        }, 'exportContextQueryToXLSX.starting.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Export terminé'
        }, 'exportContextQueryToXLSX.file_ready.___LABEL___'));
    }

    public registerServerApiHandlers() {


        APIControllerWrapper.registerServerApiHandler(ModuleDataExport.APINAME_ExportContextQueryToXLSXParamVO, this.prepare_exportContextQueryToXLSX.bind(this));

        APIControllerWrapper.registerServerApiHandler(ModuleDataExport.APINAME_ExportDataToXLSXParamVO, this.exportDataToXLSX.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDataExport.APINAME_ExportDataToXLSXParamVOFile, this.exportDataToXLSXFile.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDataExport.APINAME_ExportDataToMultiSheetsXLSXParamVO, this.exportDataToMultiSheetsXLSX.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDataExport.APINAME_ExportDataToMultiSheetsXLSXParamVOFile, this.exportDataToMultiSheetsXLSXFile.bind(this));
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

        if (!filepath) {
            ConsoleHandler.error('Erreur lors de l\'export:' + filename);
            return null;
        }

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

        if (!filepath) {
            ConsoleHandler.error('Erreur lors de l\'export:' + filename);
            return null;
        }

        let file: FileVO = new FileVO();
        file.path = filepath;
        file.file_access_policy_name = file_access_policy_name;
        file.is_secured = is_secured;
        let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(file);
        if ((!res) || (!res.id)) {
            ConsoleHandler.error('Erreur lors de l\'enregistrement du fichier en base:' + filepath);
            return null;
        }
        file.id = res.id;

        return file;
    }

    /**
     * Export des résultats d'un context_query en XLSX, et on envoie une notif avec le lien vers le fichier
     *  on indique au démarrage qu'on enverra une notif avec le lien à la fin de l'export
     */
    public async prepare_exportContextQueryToXLSX(
        filename: string,
        context_query: ContextQueryVO,
        ordered_column_list: string[],
        column_labels: { [field_name: string]: string },
        exportable_datatable_custom_field_columns: { [datatable_field_uid: string]: string } = null,

        columns: TableColumnDescVO[],
        fields: { [datatable_field_uid: string]: DatatableField<any, any> },
        varcolumn_conf: { [datatable_field_uid: string]: ExportVarcolumnConf } = null,
        active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = null,
        custom_filters: { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } } = null,
        active_api_type_ids: string[] = null,
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } } = null,

        is_secured: boolean = false,
        file_access_policy_name: string = null,

        target_user_id: number = null,

        do_not_user_filter_by_datatable_field_uid: { [datatable_field_uid: string]: { [vo_type: string]: { [field_id: string]: boolean } } } = null,

        export_options?: IExportOptions,

        vars_indicator?: ExportVarIndicator,
    ): Promise<string> {

        target_user_id = target_user_id ? target_user_id : StackContext.get('UID');

        if (target_user_id) {
            await PushDataServerController.getInstance().notifySimpleINFO(target_user_id, null, 'exportContextQueryToXLSX.starting.___LABEL___', true);
        }

        let export_query = new ExportContextQueryToXLSXQueryVO(
            filename,
            context_query,
            ordered_column_list,
            column_labels,
            exportable_datatable_custom_field_columns,
            columns,
            fields,
            varcolumn_conf,
            active_field_filters,
            custom_filters,
            active_api_type_ids,
            discarded_field_paths,
            is_secured,
            file_access_policy_name,
            target_user_id,
            do_not_user_filter_by_datatable_field_uid,
            export_options,
            vars_indicator,
        );

        await ExportContextQueryToXLSXBGThread.getInstance().push_export_query(export_query);

        return null;
    }

    /**
     * Export des résultats d'un context_query en XLSX, et on envoie une notif avec le lien vers le fichier
     *  on indique au démarrage qu'on enverra une notif avec le lien à la fin de l'export
     */
    public async do_exportContextQueryToXLSX(
        filename: string,
        context_query: ContextQueryVO,
        ordered_column_list: string[],
        column_labels: { [field_name: string]: string },
        exportable_datatable_custom_field_columns: { [datatable_field_uid: string]: string } = null,

        columns: TableColumnDescVO[] = null,
        fields: { [datatable_field_uid: string]: DatatableField<any, any> } = null,
        varcolumn_conf: { [datatable_field_uid: string]: ExportVarcolumnConf } = null,
        active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = null,
        custom_filters: { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } } = null,
        active_api_type_ids: string[] = null,
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } } = null,

        is_secured: boolean = false,
        file_access_policy_name: string = null,

        target_user_id: number = null,

        do_not_user_filter_by_datatable_field_uid: { [datatable_field_uid: string]: { [vo_type: string]: { [field_id: string]: boolean } } } = null,

        export_options?: IExportOptions,

        vars_indicator?: ExportVarIndicator,
    ): Promise<void> {

        target_user_id = target_user_id ? target_user_id : StackContext.get('UID');

        if (target_user_id != StackContext.get('UID')) {

            await StackContext.runPromise({
                IS_CLIENT: true, UID: target_user_id
            }, async () => {
                await this.do_exportContextQueryToXLSX_contextuid(
                    filename,
                    context_query,
                    ordered_column_list,
                    column_labels,
                    exportable_datatable_custom_field_columns,
                    columns,
                    fields,
                    varcolumn_conf,
                    active_field_filters,
                    custom_filters,
                    active_api_type_ids,
                    discarded_field_paths,
                    is_secured,
                    file_access_policy_name,
                    target_user_id,
                    do_not_user_filter_by_datatable_field_uid,
                    export_options,
                    vars_indicator,
                );
            });
        } else {
            await this.do_exportContextQueryToXLSX_contextuid(
                filename,
                context_query,
                ordered_column_list,
                column_labels,
                exportable_datatable_custom_field_columns,
                columns,
                fields,
                varcolumn_conf,
                active_field_filters,
                custom_filters,
                active_api_type_ids,
                discarded_field_paths,
                is_secured,
                file_access_policy_name,
                target_user_id,
                do_not_user_filter_by_datatable_field_uid,
                export_options,
                vars_indicator,
            );
        }
    }

    public async do_exportContextQueryToXLSX_contextuid(
        filename: string,
        context_query: ContextQueryVO,
        ordered_column_list: string[],
        column_labels: { [field_name: string]: string },
        exportable_datatable_custom_field_columns: { [datatable_field_uid: string]: string } = null,

        columns: TableColumnDescVO[] = null,
        fields: { [datatable_field_uid: string]: DatatableField<any, any> } = null,
        varcolumn_conf: { [datatable_field_uid: string]: ExportVarcolumnConf } = null,
        active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = null,
        custom_filters: { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } } = null,
        active_api_type_ids: string[] = null,
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } } = null,

        is_secured: boolean = false,
        file_access_policy_name: string = null,

        target_user_id: number = null,

        do_not_user_filter_by_datatable_field_uid: { [datatable_field_uid: string]: { [vo_type: string]: { [field_id: string]: boolean } } } = null,

        export_options?: IExportOptions,

        vars_indicator?: ExportVarIndicator,
    ): Promise<void> {

        let api_type_id = context_query.base_api_type_id;
        let columns_by_field_id = {};

        for (let i in columns) {
            let column = columns[i];
            columns_by_field_id[column.datatable_field_uid] = column;
        }

        let datas = (context_query.fields?.length > 0) ?
            await ModuleContextFilter.getInstance().select_datatable_rows(context_query, columns_by_field_id, fields) :
            await ModuleContextFilter.getInstance().select_vos(context_query);

        let datas_with_vars = await this.add_var_columns_values_for_xlsx_datas(
            datas,
            ordered_column_list,
            columns,
            varcolumn_conf,
            active_field_filters,
            custom_filters,
            active_api_type_ids,
            discarded_field_paths,
            do_not_user_filter_by_datatable_field_uid,
        );

        let translated_datas = await this.translate_context_query_fields_from_bdd(datas_with_vars, context_query, context_query.fields?.length > 0);

        await this.update_custom_fields(translated_datas, exportable_datatable_custom_field_columns);

        // - update to columns format (percent, toFixed etc...)
        const xlsx_datas = await this.update_to_xlsx_columns_format(translated_datas, columns);

        let sheets: IExportableSheet[] = [];

        // Sheet for the actual datatable
        const datas_sheet: IExportableSheet = {
            sheet_name: 'Datas',
            datas: xlsx_datas,
            ordered_column_list,
            column_labels,
        };

        sheets.push(datas_sheet);

        // Sheet for active field filters
        if (export_options?.export_active_field_filters) {
            const active_filters_sheet = await this.make_active_filters_xlsx_sheet(active_field_filters);
            sheets.push(active_filters_sheet);
        }

        // Sheet for Vars Indicator
        if (export_options?.export_vars_indicator) {
            const vars_indicator_sheet = await this.make_vars_indicator_xlsx_sheet(
                vars_indicator,
                active_field_filters,
                active_api_type_ids,
                discarded_field_paths,
            );
            sheets.push(vars_indicator_sheet);
        }

        // Final Excel file
        let filepath: string = await this.exportDataToMultiSheetsXLSX(
            filename,
            sheets,
            api_type_id,
            is_secured,
            file_access_policy_name,
        );

        if (!filepath) {
            ConsoleHandler.error('Erreur lors de l\'export:' + filename);
            return;
        }

        await this.getFileVo(filepath, is_secured, file_access_policy_name);

        if (target_user_id) {
            let fullpath = ConfigurationService.node_configuration.BASE_URL + filepath;
            await PushDataServerController.getInstance().notifySimpleINFO(target_user_id, null, 'exportContextQueryToXLSX.file_ready.___LABEL___', false, null, fullpath);
            let SEND_IN_BLUE_TEMPLATE_ID: number = await ModuleParams.getInstance().getParamValueAsInt(ModuleDataExportServer.PARAM_NAME_SEND_IN_BLUE_TEMPLATE_ID);

            // Send mail
            if (!!SEND_IN_BLUE_TEMPLATE_ID) {

                let user: UserVO = await query(UserVO.API_TYPE_ID).filter_by_id(target_user_id).select_vo<UserVO>();

                // Using SendInBlue
                await SendInBlueMailServerController.getInstance().sendWithTemplate(
                    ModuleDataExportServer.MAILCATEGORY_export_file_ready,
                    SendInBlueMailVO.createNew(user.name, user.email),
                    SEND_IN_BLUE_TEMPLATE_ID,
                    ['Export_file_ready'],
                    {
                        EMAIL: user.email,
                        UID: user.id.toString(),
                        FILEPATH: filepath
                    });
            }
        }
    }

    public async translate_context_query_fields_from_bdd(datas: any[], context_query: ContextQueryVO, use_raw_field: boolean = false): Promise<any[]> {
        if (!(datas?.length > 0)) {
            return null;
        }

        if (!context_query) {
            return null;
        }

        let res = cloneDeep(datas);

        if (!(context_query?.fields?.length > 0)) {

            let table = VOsTypesManager.moduleTables_by_voType[context_query.base_api_type_id];
            for (let j in res) {
                let data = res[j];
                data._type = context_query.base_api_type_id;
            }
            res = table.forceNumerics(res);
            for (let i in res) {
                let e = res[i];
                res[i] = this.get_xlsx_version(table, e);
            }
            return res;
        }

        let max = Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2));
        let promise_pipeline = new PromisePipeline(max);
        for (let i in datas) {
            let data = datas[i];

            for (let j in context_query.fields) {
                let field = context_query.fields[j];

                await promise_pipeline.push(async () => {
                    let table = VOsTypesManager.moduleTables_by_voType[field.api_type_id];

                    // cas spécifique de l'id
                    if (field.field_id == 'id') {
                        res[i][field.alias] = parseInt(data[field.alias]);
                        return;
                    }

                    let table_field = table.get_field_by_id(field.field_id);

                    if (!table_field) {
                        ConsoleHandler.error('translate_context_query_fields_from_bdd:Unknown field:' + field.field_id + ':type:' + field.api_type_id + ':');
                        throw new Error('Unknown field');
                    }

                    table.force_numeric_field(table_field, data, res[i], field.alias);
                    await this.field_to_xlsx(table_field, res[i], res[i], field.alias, use_raw_field);
                });
            }
        }

        await promise_pipeline.end();

        return res;
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
        let modultable = VOsTypesManager.moduleTables_by_voType[api_type_id];
        filename = filename ? filename : api_type_id + '.xlsx';

        if (!lang_id) {
            let user = await ModuleAccessPolicyServer.getInstance().getSelfUser();
            if (!user) {
                ConsoleHandler.error('Une langue doit être définie pour l\'export XLSX');
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
                ConsoleHandler.error('Code texte de colonne introuvable:' + field.field_label.code_text);
                continue;
            }
            let translation = await ModuleTranslation.getInstance().getTranslation(lang_id, text.id);
            if (!translation) {
                ConsoleHandler.error('Traduction de colonne introuvable:' + field.field_label.code_text);
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

        if (!filepath) {
            ConsoleHandler.error('Erreur lors de l\'export:' + filename);
            return null;
        }

        let file: FileVO = new FileVO();
        file.path = filepath;
        file.file_access_policy_name = file_access_policy_name;
        file.is_secured = true;
        let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(file);
        if ((!res) || (!res.id)) {
            ConsoleHandler.error('Erreur lors de l\'enregistrement du fichier en base:' + filepath);
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

        ConsoleHandler.log('EXPORT : ' + filename);

        // we need to make sure the name is suitable
        filename = filename.replace(/[^-._a-z0-9]/gi, '_');

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

            await StackContext.runPromise(
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

    /**
     * make_active_filters_xlsx_sheet
     *  - Make the Xlsx sheet of Active field filters
     *
     * @param active_field_filters {{ [api_type_id: string]: { [field_id: string]: ContextFilterVO } }}
     * @returns {IExportableSheet}
     */
    private async make_active_filters_xlsx_sheet(
        active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = null,
    ): Promise<IExportableSheet> {

        if ((!active_field_filters)) {
            return null;
        }

        const sheet: IExportableSheet = {
            sheet_name: 'Filtres Actifs',
            datas: [],
            ordered_column_list: ['filter_name', 'value'],
            column_labels: { filter_name: 'Filtre', value: 'Valeur' },
        };

        for (const api_type_id in active_field_filters) {
            const active_filter = active_field_filters[api_type_id];

            for (const context_filter_name in active_filter) {
                const context_filter: ContextFilterVO = active_filter[context_filter_name];

                if (context_filter == null) { continue; }

                sheet.datas.push({
                    filter_name: `${context_filter.vo_type} - ${context_filter.field_id}`,
                    value: ContextFilterHandler.context_filter_to_readable_ihm(context_filter)
                });
            }
        }

        return sheet;
    }

    /**
     * make_vars_indicator_xlsx_sheet
     *  - Make the Xlsx sheet of the given Vars Indicator
     *
     * @param vars_indicator {ExportVarIndicator}
     * @param active_field_filters {{ [api_type_id: string]: { [field_id: string]: ContextFilterVO } }}
     * @param active_api_type_ids {string[]}
     * @param discarded_field_paths {{ [vo_type: string]: { [field_id: string]: boolean } }}
     * @returns {IExportableSheet}
     */
    private async make_vars_indicator_xlsx_sheet(
        vars_indicator: ExportVarIndicator,
        active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = null,
        active_api_type_ids: string[] = null,
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } } = null,
    ): Promise<IExportableSheet> {

        if ((!vars_indicator)) {
            return null;
        }

        const sheet: IExportableSheet = {
            sheet_name: 'Indicateurs',
            datas: [],
            ordered_column_list: ['name', 'value'],
            column_labels: { name: 'Nom', value: 'Valeur' },
        };

        const current_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = cloneDeep(active_field_filters);
        const limit = 500; //Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2));
        const promise_pipeline = new PromisePipeline(limit);
        let debug_uid: number = 0;

        for (let var_name in vars_indicator.varcolumn_conf) {

            const varcolumn_conf = vars_indicator.varcolumn_conf[var_name];
            let this_custom_filters: { [var_param_field_name: string]: ContextFilterVO } = {};
            let filter_additional_params = null;

            try {
                // JSON parse may throw exeception (case when empty or Non-JSON)
                filter_additional_params = JSON.parse(varcolumn_conf.filter_additional_params);
            } catch (e) {

            }


            for (const field_filter in varcolumn_conf.custom_field_filters) {
                // varcolumn_conf filter name
                const varcolumn_conf_custom_filter_name = varcolumn_conf.custom_field_filters[field_filter];

                // find the actual field filters key from active_field_filters
                const field_filters_key: string = Object.keys(current_active_field_filters)
                    .find((key_a) => Object.keys(current_active_field_filters[key_a])
                        .find((key_b) => key_b === varcolumn_conf_custom_filter_name)
                    );

                if (!field_filters_key) { continue; }

                this_custom_filters[field_filter] = current_active_field_filters[field_filters_key][varcolumn_conf_custom_filter_name];
            }

            debug_uid++;
            ConsoleHandler.log('make_vars_indicator_xlsx_sheet:PRE PIPELINE PUSH:nb :' + var_name + ':' + debug_uid);
            await promise_pipeline.push(async () => {

                ConsoleHandler.log('make_vars_indicator_xlsx_sheet:INSIDE PIPELINE CB 1:nb :' + var_name + ':' + debug_uid);

                /**
                 * On doit récupérer le param en fonction de la ligne et les filtres actifs utilisés pour l'export
                 */
                let var_param: VarDataBaseVO = await ModuleVar.getInstance().getVarParamFromContextFilters(
                    VarsController.getInstance().var_conf_by_id[varcolumn_conf.var_id].name,
                    current_active_field_filters,
                    this_custom_filters,
                    active_api_type_ids,
                    discarded_field_paths
                );

                ConsoleHandler.log('make_vars_indicator_xlsx_sheet:INSIDE PIPELINE CB 2:nb :' + var_name + ':' + debug_uid + ':' + JSON.stringify(var_param));

                let var_data = await VarsServerCallBackSubsController.getInstance().get_var_data(var_param, 'make_vars_indicator_xlsx_sheet: exporting data');
                let value = var_data ? var_data.value : null;

                if (value != null) {
                    let params = [value];
                    params = params.concat(filter_additional_params);

                    if (typeof filter_by_name[varcolumn_conf.filter_type]?.read === 'function') {
                        value = filter_by_name[varcolumn_conf.filter_type].read.apply(null, params);
                        if (varcolumn_conf.filter_type != 'tstz') {
                            value = (value as any).replace(/\s+/g, '');
                        }
                    }
                }

                sheet.datas.push({
                    name: LocaleManager.getInstance().t(var_name),
                    value,
                });

                ConsoleHandler.log('make_vars_indicator_xlsx_sheet:INSIDE PIPELINE CB 3:nb :' + var_name + ':' + debug_uid);
            });
            ConsoleHandler.log('make_vars_indicator_xlsx_sheet:POST PIPELINE PUSH:nb :' + var_name + ':' + debug_uid);
        }

        await promise_pipeline.end();

        return sheet;
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

        if (!filepath) {
            ConsoleHandler.error('Erreur lors de l\'export:' + filename);
            return null;
        }

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

        if (!filepath) {
            ConsoleHandler.error('Erreur lors de l\'export:' + filename);
            return null;
        }

        return await this.getFileVo(filepath, is_secured, file_access_policy_name);
    }

    private async getFileVo(filepath: string, is_secured: boolean, file_access_policy_name: string): Promise<FileVO> {
        let file: FileVO = new FileVO();
        file.path = filepath;
        file.file_access_policy_name = file_access_policy_name;
        file.is_secured = is_secured;
        let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(file);
        if ((!res) || (!res.id)) {
            ConsoleHandler.error('Erreur lors de l\'enregistrement du fichier en base:' + filepath);
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

        ConsoleHandler.log('EXPORT : ' + filename);
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
            await StackContext.runPromise(
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

        await all_promises(promises);

        return res;
    }

    /**
     * Traduire le champs field.field_id de src_vo dans dest_vo dans l'optique d'un export excel
     * @param field le descriptif du champs à traduire
     * @param src_vo le vo source
     * @param dest_vo le vo de destination de la traduction (potentiellement le même que src_vo)
     * @param field_alias optionnel. Permet de définir un nom de champs différent du field_id utilisé dans le src_vo et le dest_vo typiquement en résultat d'un contextquery
     */
    private async field_to_xlsx(field: ModuleTableField<any>, src_vo: any, dest_vo: any, field_alias: string = null, use_raw_field: boolean = false) {

        let src_field_id = (field_alias ? field_alias : field.field_id) + (use_raw_field ? '__raw' : '');
        let dest_field_id = (field_alias ? field_alias : field.field_id);

        /**
         * Si le champ possible un custom_to_api
         */
        if (!!field.custom_translate_to_xlsx) {
            dest_vo[dest_field_id] = field.custom_translate_to_xlsx(src_vo[src_field_id]);
            return;
        }

        switch (field.field_type) {

            // TODO FIXME  export des ranges dans xlsx à réfléchir...

            case ModuleTableField.FIELD_TYPE_tstzrange_array:
                let tab_tstzrange_array = src_vo[src_field_id];
                dest_vo[dest_field_id] = '';

                for (let i in tab_tstzrange_array) {
                    let range = tab_tstzrange_array[i];
                    if (range) {

                        if (dest_vo[dest_field_id] != '') {
                            dest_vo[dest_field_id] += ', ';
                        }
                        dest_vo[dest_field_id] += Dates.format_segment(RangeHandler.getSegmentedMin(src_vo[src_field_id], src_vo[src_field_id].segment_type), src_vo[src_field_id].segment_type) + ' - ' +
                            Dates.format_segment(RangeHandler.getSegmentedMax(src_vo[src_field_id], src_vo[src_field_id].segment_type), src_vo[src_field_id].segment_type);
                    }
                }
                break;

            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_refrange_array:
            case ModuleTableField.FIELD_TYPE_isoweekdays:
            case ModuleTableField.FIELD_TYPE_hourrange_array:
                let tab = src_vo[src_field_id];
                dest_vo[dest_field_id] = '';

                for (let i in tab) {
                    let range = tab[i];
                    if (range) {

                        if (dest_vo[dest_field_id] != '') {
                            dest_vo[dest_field_id] += ', ';
                        }
                        dest_vo[dest_field_id] += RangeHandler.getSegmentedMin(src_vo[src_field_id], src_vo[src_field_id].segment_type) + ' - ' + RangeHandler.getSegmentedMax(src_vo[src_field_id], src_vo[src_field_id].segment_type);
                    }
                }
                break;

            case ModuleTableField.FIELD_TYPE_tsrange:
                dest_vo[dest_field_id] = Dates.format_segment(RangeHandler.getSegmentedMin(src_vo[src_field_id], src_vo[src_field_id].segment_type), src_vo[src_field_id].segment_type) + ' - ' +
                    Dates.format_segment(RangeHandler.getSegmentedMax(src_vo[src_field_id], src_vo[src_field_id].segment_type), src_vo[src_field_id].segment_type);
                break;

            case ModuleTableField.FIELD_TYPE_numrange:
            case ModuleTableField.FIELD_TYPE_hourrange:
                dest_vo[dest_field_id] = RangeHandler.getSegmentedMin(src_vo[src_field_id], src_vo[src_field_id].segment_type) + ' - ' + RangeHandler.getSegmentedMax(src_vo[src_field_id], src_vo[src_field_id].segment_type);
                break;

            case ModuleTableField.FIELD_TYPE_tstz:

                dest_vo[dest_field_id] = DataExportServerController.format_date_utc_excel(src_vo[src_field_id], (field.segmentation_type == null) ? TimeSegment.TYPE_DAY : field.segmentation_type);
                break;

            case ModuleTableField.FIELD_TYPE_tstz_array:
                if ((src_vo[src_field_id] === null) || (typeof src_vo[src_field_id] === 'undefined')) {
                    dest_vo[dest_field_id] = src_vo[src_field_id];
                } else {
                    dest_vo[dest_field_id] = (src_vo[src_field_id] as number[]).map((ts: number) => DataExportServerController.format_date_utc_excel(ts, (field.segmentation_type == null) ? TimeSegment.TYPE_DAY : field.segmentation_type));
                }
                break;

            case ModuleTableField.FIELD_TYPE_plain_vo_obj:
                delete dest_vo[dest_field_id];
                break;

            case ModuleTableField.FIELD_TYPE_enum:
                let user = await ModuleAccessPolicy.getInstance().getSelfUser();
                let trads: TranslationVO[] = await query(TranslationVO.API_TYPE_ID)
                    .filter_by_text_eq('code_text', field.enum_values[src_vo[src_field_id]], TranslatableTextVO.API_TYPE_ID)
                    .filter_by_num_in('lang_id', query(UserVO.API_TYPE_ID).field('lang_id').filter_by_id(user.id))
                    .select_vos();
                let trad = trads ? trads[0] : null;
                dest_vo[dest_field_id] = trad ? trad.translated : null;
                break;


            case ModuleTableField.FIELD_TYPE_html:
            case ModuleTableField.FIELD_TYPE_textarea:
            case ModuleTableField.FIELD_TYPE_email:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_plain_vo_obj:
            case ModuleTableField.FIELD_TYPE_translatable_text:
            case ModuleTableField.FIELD_TYPE_password:
            case ModuleTableField.FIELD_TYPE_file_field:
            case ModuleTableField.FIELD_TYPE_image_field:
                /**
                 * Si on a un type string, mais que la bdd renvoie un array, on join(',') pour avoir une string
                 */
                if (Array.isArray(src_vo[src_field_id])) {
                    dest_vo[dest_field_id] = src_vo[src_field_id].join(',');
                } else {
                    dest_vo[dest_field_id] = src_vo[src_field_id];
                }
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
                dest_vo[dest_field_id] = src_vo[src_field_id];
        }

        if (typeof dest_vo[dest_field_id] === 'undefined') {
            delete dest_vo[dest_field_id];
        }
    }

    /**
     * On retouche les champs custom en appelant les cbs
     */
    private async update_custom_fields(
        datas: any[],
        exportable_datatable_custom_field_columns: { [datatable_field_uid: string]: string } = null,
    ) {

        const max_connections_to_use = Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2));
        const promise_pipeline = new PromisePipeline(max_connections_to_use);
        let cpt_custom_field_translatable_name: { [custom_field_translatable_name: string]: number } = {};

        for (let field_id in exportable_datatable_custom_field_columns) {
            let custom_field_translatable_name = exportable_datatable_custom_field_columns[field_id];

            let cb = TableWidgetCustomFieldsController.getInstance()
                .custom_components_export_cb_by_translatable_title[custom_field_translatable_name];

            if (!cb) {
                continue;
            }

            cpt_custom_field_translatable_name[custom_field_translatable_name] = 1;

            for (const key_i in datas) {
                let data = datas[key_i];

                await promise_pipeline.push(async () => {
                    data[field_id] = await cb(data);

                    if (ConfigurationService.node_configuration.DEBUG_EXPORTS) {
                        ConsoleHandler.log('update_custom_fields :: ' + custom_field_translatable_name + ' :: ' + cpt_custom_field_translatable_name[custom_field_translatable_name] + '/' + datas.length);
                    }

                    cpt_custom_field_translatable_name[custom_field_translatable_name]++;
                });
            }
        }

        await promise_pipeline.end();

        return datas;
    }

    /**
     * Update To Columns Format
     *  - Update to column format defined from the column widget configuration (percent, decimal, toFixed etc...)
     *
     * TODO: do export in specific way for each type (date, number, string, etc...)
     * e.g. https://github.com/SheetJS/sheetjs/issues/2192#issuecomment-745865277
     */
    private async update_to_xlsx_columns_format(
        datas: any[],
        columns: TableColumnDescVO[] = null,
    ) {

        const rows = cloneDeep(datas);

        for (const field_uid in columns) {
            const column = columns[field_uid];

            let filter_additional_params = null;

            try {
                // JSON parse may throw exeception (case when empty or Non-JSON)
                filter_additional_params = JSON.parse(column.filter_additional_params);
            } catch (e) {

            }

            for (const row_key in rows) {
                let row = rows[row_key];

                if (row[column.datatable_field_uid] == null) {
                    continue;
                }

                row[column.datatable_field_uid + '__raw'] = row[column.datatable_field_uid];

                if (!(filter_additional_params?.length > 0)) {
                    continue;
                }

                let params = [row[column.datatable_field_uid]];

                params = params.concat(filter_additional_params);

                if (typeof filter_by_name[column.filter_type]?.read === 'function') {
                    row[column.datatable_field_uid] = filter_by_name[column.filter_type].read.apply(null, params);
                    if (column.filter_type != 'tstz') {
                        row[column.datatable_field_uid] = (row[column.datatable_field_uid] as any).replace(/\s+/g, '');
                    }
                }
            }
        }

        return rows;
    }

    /**
     * On ajoute aux datas les résolutats de calcul des vars qui remplissent les colonnes de var du tableau
     *  Il faut donc d'abord définir les pramètres de calcul des vars, puis attendre le résultat du calcul
     */
    private async add_var_columns_values_for_xlsx_datas(
        datatable_rows: IDistantVOBase[],
        ordered_column_list: string[],

        columns: TableColumnDescVO[],
        varcolumn_conf: { [datatable_field_uid: string]: ExportVarcolumnConf } = null,
        active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = null,
        custom_filters: { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } } = null,
        active_api_type_ids: string[] = null,
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } } = null,
        do_not_user_filter_by_datatable_field_uid: { [datatable_field_uid: string]: { [vo_type: string]: { [field_id: string]: boolean } } } = null,

    ): Promise<IDistantVOBase[]> {

        // May be better to not alter the original data rows
        let rows: IDistantVOBase[] = cloneDeep(datatable_rows);

        let limit = 500; //Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2));
        let promise_pipeline = new PromisePipeline(limit);
        let debug_uid: number = 0;

        ConsoleHandler.log('add_var_columns_values_for_xlsx_datas:nb rows:' + rows.length);
        for (let j in rows) {
            let row = rows[j];
            let data_n: number = parseInt(j) + 1;

            ConsoleHandler.log('add_var_columns_values_for_xlsx_datas:nb rows:' + rows.length);

            for (let i in ordered_column_list) {
                let row_field_name: string = ordered_column_list[i];

                // Check if it's actually a var param field
                if (!varcolumn_conf[row_field_name]) {
                    continue;
                }

                const this_varcolumn_conf = cloneDeep(varcolumn_conf[row_field_name]);
                const this_custom_filters = custom_filters ?
                    cloneDeep(custom_filters[row_field_name]) :
                    null;
                const do_not_user_filter: { [vo_type: string]: { [field_id: string]: boolean } } = do_not_user_filter_by_datatable_field_uid ?
                    do_not_user_filter_by_datatable_field_uid[row_field_name] :
                    null;

                let current_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = cloneDeep(active_field_filters);

                for (let vo_type in do_not_user_filter) {
                    for (let field_id in do_not_user_filter[vo_type]) {
                        if (do_not_user_filter[vo_type][field_id]) {
                            if (current_active_field_filters && current_active_field_filters[vo_type]) {
                                delete current_active_field_filters[vo_type][field_id];
                            }
                        }
                    }
                }

                let context = DashboardBuilderController.getInstance().add_table_row_context(current_active_field_filters, columns, row);

                debug_uid++;
                ConsoleHandler.log('add_var_columns_values_for_xlsx_datas:PRE PIPELINE PUSH:nb :' + i + ':' + debug_uid);
                await promise_pipeline.push(async () => {

                    ConsoleHandler.log('add_var_columns_values_for_xlsx_datas:INSIDE PIPELINE CB 1:nb :' + i + ':' + debug_uid);

                    /**
                     * On doit récupérer le param en fonction de la ligne et les filtres actifs utilisés pour l'export
                     */
                    let var_param: VarDataBaseVO = await ModuleVar.getInstance().getVarParamFromContextFilters(
                        VarsController.getInstance().var_conf_by_id[this_varcolumn_conf.var_id].name,
                        context,
                        this_custom_filters,
                        active_api_type_ids,
                        discarded_field_paths
                    );

                    ConsoleHandler.log('add_var_columns_values_for_xlsx_datas:INSIDE PIPELINE CB 2:nb :' + i + ':' + debug_uid + ':' + JSON.stringify(var_param));

                    let var_data = await VarsServerCallBackSubsController.getInstance().get_var_data(var_param, 'add_var_columns_values_for_xlsx_datas: exporting data');
                    row[row_field_name] = var_data?.value ?? null;

                    ConsoleHandler.log('add_var_columns_values_for_xlsx_datas:INSIDE PIPELINE CB 3:nb :' + i + ':' + debug_uid);
                });
                ConsoleHandler.log('add_var_columns_values_for_xlsx_datas:POST PIPELINE PUSH:nb :' + i + ':' + debug_uid);
            }
        }

        await promise_pipeline.end();

        return rows;
    }
}

import { cloneDeep, indexOf } from 'lodash';
import XLSX, { WorkBook } from 'xlsx';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleContextFilter from '../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVOHandler from '../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextFilterVO from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryVO, { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleTableController from '../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldController from '../../../shared/modules/DAO/ModuleTableFieldController';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleTableFieldVO from '../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../../../shared/modules/DAO/vos/ModuleTableVO';
import DatatableField from '../../../shared/modules/DAO/vos/datatable/DatatableField';
import TableWidgetCustomFieldsController from '../../../shared/modules/DashboardBuilder/TableWidgetCustomFieldsController';
import VOFieldRefVOManager from '../../../shared/modules/DashboardBuilder/manager/VOFieldRefVOManager';
import FieldFiltersVO from '../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import TableColumnDescVO from '../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import ModuleDataExport from '../../../shared/modules/DataExport/ModuleDataExport';
import IExportableSheet from '../../../shared/modules/DataExport/interfaces/IExportableSheet';
import { XlsxCellFormatByFilterType } from '../../../shared/modules/DataExport/type/XlsxCellFormatByFilterType';
import ExportContextQueryToXLSXQueryVO from '../../../shared/modules/DataExport/vos/ExportContextQueryToXLSXQueryVO';
import ExportHistoricVO from '../../../shared/modules/DataExport/vos/ExportHistoricVO';
import ExportVarIndicatorVO from '../../../shared/modules/DataExport/vos/ExportVarIndicatorVO';
import ExportVarcolumnConfVO from '../../../shared/modules/DataExport/vos/ExportVarcolumnConfVO';
import ExportLogVO from '../../../shared/modules/DataExport/vos/apis/ExportLogVO';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import ModuleFile from '../../../shared/modules/File/ModuleFile';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import SendInBlueMailVO from '../../../shared/modules/SendInBlue/vos/SendInBlueMailVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import ModuleVar from '../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import FilterObj, { filter_by_name } from '../../../shared/tools/Filters';
import LocaleManager from '../../../shared/tools/LocaleManager';
import ObjectHandler, { field_names } from '../../../shared/tools/ObjectHandler';
import OrderedPromisePipeline from '../../../shared/tools/PromisePipeline/OrderedPromisePipeline';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import { all_promises } from '../../../shared/tools/PromiseTools';
import RangeHandler from '../../../shared/tools/RangeHandler';
import StackContext from '../../StackContext';
import ConfigurationService from '../../env/ConfigurationService';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleBGThreadServer from '../BGThread/ModuleBGThreadServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleTableFieldServerController from '../DAO/ModuleTableFieldServerController';
import ModuleTableServerController from '../DAO/ModuleTableServerController';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import ModuleMailerServer from '../Mailer/ModuleMailerServer';
import ModuleServerBase from '../ModuleServerBase';
import PushDataServerController from '../PushData/PushDataServerController';
import SendInBlueMailServerController from '../SendInBlue/SendInBlueMailServerController';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';
import ModuleVarServer from '../Var/ModuleVarServer';
import VarsServerCallBackSubsController from '../Var/VarsServerCallBackSubsController';
import DataExportBGThread from './bgthreads/DataExportBGThread';
import ExportContextQueryToXLSXBGThread from './bgthreads/ExportContextQueryToXLSXBGThread';
import default_export_mail_html_template from './default_export_mail_html_template.html';

export default class ModuleDataExportServer extends ModuleServerBase {

    public static PARAM_NAME_SEND_IN_BLUE_EXPORT_NOTIFICATION_TEMPLATE_ID: string = 'ModuleDataExport.export_notification_mail_template_id';
    public static PARAM_NAME_SEND_IN_BLUE_TEMPLATE_ID: string = 'ModuleDataExport.export_mail_template_id';
    public static MAILCATEGORY_export_file_ready = 'MAILCATEGORY.ModuleDataExport_export_file_ready';

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleDataExportServer.instance) {
            ModuleDataExportServer.instance = new ModuleDataExportServer();
        }
        return ModuleDataExportServer.instance;
    }

    private static instance: ModuleDataExportServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleDataExport.getInstance().name);
    }

    // istanbul ignore next: cannot test configure
    public async configure() {

        ModuleBGThreadServer.getInstance().registerBGThread(DataExportBGThread.getInstance());
        ModuleBGThreadServer.getInstance().registerBGThread(ExportContextQueryToXLSXBGThread.getInstance());

        const preCreateTrigger: DAOPreCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCreateTrigger.registerHandler(ExportHistoricVO.API_TYPE_ID, this, this.handleTriggerExportHistoricVOCreate);

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Exports'
        }, 'fields.labels.ref.module_data_export_export_log.___LABEL____user_id'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Fichier exporté : %%VAR%%EXPORT_TYPE_ID%%'
        }, 'export.default_mail.subject'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': "Echec de l\'export du fichier : %%VAR%%EXPORT_TYPE_ID%%"
        }, 'export.default_mail_error.subject'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Cliquez sur le lien ci-dessous pour télécharger le fichier exporté.'
        }, 'export.default_mail.html'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': "Veuillez refaire votre demande d'export et nous excuser pour la gène occasionnée. Si le probleme persiste n'hésitez pas à nous en alerter"
        }, 'export.default_mail_error.html'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Télécharger'
        }, 'export.default_mail.download'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Echec de l\'exportation des données : si l\'erreur persiste merci de nous contacter.'
        }, 'exportation_failed.error_vars_loading.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Export de données en cours...'
        }, 'DataExportBGThread.handleHistoric.start'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Export de données terminé, vous devriez le recevoir par mail'
        }, 'DataExportBGThread.handleHistoric.success'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Echec de l\'export de données'
        }, 'DataExportBGThread.handleHistoric.failed'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Export en cours... vous recevrez un lien dans les notifications et par mail pour télécharger le fichier une fois l\'export terminé.'
        }, 'exportContextQueryToXLSX.starting.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Export terminé'
        }, 'exportContextQueryToXLSX.file_ready.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Cette fonctionnalité est actuellement en maintenance. Elle sera de retour prochainement.'
        }, 'exportContextQueryToXLSX.maintenance.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Téléchargement de votre tableau'
        }, 'mails.export.dashboard.subject'));
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {


        APIControllerWrapper.registerServerApiHandler(ModuleDataExport.APINAME_ExportContextQueryToXLSXParamVO, this.prepare_exportContextQueryToXLSX.bind(this));

        APIControllerWrapper.registerServerApiHandler(ModuleDataExport.APINAME_ExportDataToXLSXParamVO, this.exportDataToXLSX.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDataExport.APINAME_ExportDataToXLSXParamVOFile, this.exportDataToXLSXFile.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDataExport.APINAME_ExportDataToMultiSheetsXLSXParamVO, this.export_data_to_multi_sheets_xlsx.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDataExport.APINAME_ExportDataToMultiSheetsXLSXParamVOFile, this.export_data_to_multi_sheets_xslw_file.bind(this));
    }

    public async exportDataToXLSX(
        filename: string,
        datas: any[],
        ordered_column_list: string[],
        column_labels: { [field_name: string]: string },
        api_type_id: string,
        is_secured: boolean = false,
        file_access_policy_name: string = null): Promise<string> {

        const filepath: string = await this.exportDataToXLSX_base(
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

        const filepath: string = await this.exportDataToXLSX_base(
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

        // Si le file existe déjà, on le récupère
        let file: FileVO = await query(FileVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<FileVO>().path, filepath)
            .select_vo<FileVO>();

        if (!file) {
            file = new FileVO();
            file.path = filepath;
            file.file_access_policy_name = file_access_policy_name;
            file.is_secured = is_secured;
            const res: InsertOrDeleteQueryResult = await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(file);
            if ((!res) || (!res.id)) {
                ConsoleHandler.error('Erreur lors de l\'enregistrement du fichier en base:' + filepath);
                return null;
            }
            file.id = res.id;
        }

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
        varcolumn_conf: { [datatable_field_uid: string]: ExportVarcolumnConfVO } = null,
        active_field_filters: FieldFiltersVO = null,
        custom_filters: { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } } = null,
        active_api_type_ids: string[] = null,
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } } = null,

        is_secured: boolean = false,
        file_access_policy_name: string = null,

        target_user_id: number = null,

        do_not_use_filter_by_datatable_field_uid: { [datatable_field_uid: string]: { [vo_type: string]: { [field_id: string]: boolean } } } = null,

        export_active_field_filters?: boolean,
        export_vars_indicator?: boolean,
        send_email_with_export_notification?: boolean,

        vars_indicator?: ExportVarIndicatorVO,
    ): Promise<string> {

        target_user_id = target_user_id ? target_user_id : StackContext.get('UID');

        if (target_user_id) {
            await PushDataServerController.getInstance().notifySimpleINFO(target_user_id, null, 'exportContextQueryToXLSX.starting.___LABEL___', true);
        }

        const export_query = ExportContextQueryToXLSXQueryVO.create_new(
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
            do_not_use_filter_by_datatable_field_uid,
            export_active_field_filters,
            export_vars_indicator,
            send_email_with_export_notification,
            vars_indicator,
        );

        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(export_query);

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
        varcolumn_conf: { [datatable_field_uid: string]: ExportVarcolumnConfVO } = null,
        active_field_filters: FieldFiltersVO = null,
        custom_filters: { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } } = null,
        active_api_type_ids: string[] = null,
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } } = null,

        is_secured: boolean = false,
        file_access_policy_name: string = null,

        target_user_id: number = null,

        do_not_use_filter_by_datatable_field_uid: { [datatable_field_uid: string]: { [vo_type: string]: { [field_id: string]: boolean } } } = null,

        export_active_field_filters?: boolean,
        export_vars_indicator?: boolean,
        send_email_with_export_notification?: boolean,

        vars_indicator?: ExportVarIndicatorVO,
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
                    do_not_use_filter_by_datatable_field_uid,
                    export_active_field_filters,
                    export_vars_indicator,
                    send_email_with_export_notification,
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
                do_not_use_filter_by_datatable_field_uid,
                export_active_field_filters,
                export_vars_indicator,
                send_email_with_export_notification,
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
        varcolumn_conf: { [datatable_field_uid: string]: ExportVarcolumnConfVO } = null, // TODO FIXME : Quand est-ce qu'on applique le format ???
        active_field_filters: FieldFiltersVO = null,
        custom_filters: { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } } = null,
        active_api_type_ids: string[] = null,
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } } = null,

        is_secured: boolean = false,
        file_access_policy_name: string = null,

        target_user_id: number = null,

        do_not_use_filter_by_datatable_field_uid: { [datatable_field_uid: string]: { [vo_type: string]: { [field_id: string]: boolean } } } = null, // TODO FIXME ??? What is the use of this param ???

        export_active_field_filters?: boolean,
        export_vars_indicator?: boolean,
        send_email_with_export_notification?: boolean,

        vars_indicator?: ExportVarIndicatorVO,
    ): Promise<void> {

        const api_type_id = context_query.base_api_type_id;
        const columns_by_field_id = {};

        for (const i in columns) {
            const column = columns[i];
            columns_by_field_id[column.datatable_field_uid] = column;
        }

        const ordered_promise_pipeline = new OrderedPromisePipeline(100, "do_exportContextQueryToXLSX_contextuid");
        const xlsx_datas = [];
        const has_query_limit = !!context_query.query_limit;
        const limit = has_query_limit ? context_query.query_limit : 25;
        let offset = has_query_limit ? context_query.query_offset : 0;

        const context_query_with_vars = context_query.clone();
        await ModuleVar.getInstance().add_vars_params_columns_for_ref_ids(context_query_with_vars, columns);

        /**
         * On commence par compter le nombre de datas à exporter, pour faire plus propre sur l'exportation
         */
        let nb_elts_to_export = limit;
        const context_query_count = context_query_with_vars.clone();

        if (!has_query_limit) {
            nb_elts_to_export = await context_query_count.select_count();
        }

        let step_i = 0;

        while (nb_elts_to_export > 0) {

            const this_context_query = context_query_with_vars.clone();
            const this_offset = offset;
            const this_step_i = step_i;

            this_context_query.set_limit(limit, this_offset);

            // On doit aussi ajuster les sub_queries en jointure dans ce cas
            for (const i in this_context_query.joined_context_queries) {
                const joined_context_query = this_context_query.joined_context_queries[i];

                if (!joined_context_query) {
                    continue;
                }

                joined_context_query.joined_context_query.set_limit(limit, this_offset);
            }


            if (!has_query_limit) {
                offset += limit;
            }

            nb_elts_to_export -= limit;
            step_i++;

            await ordered_promise_pipeline.push(async () => {

                const datas = (this_context_query.fields?.length > 0) ?
                    await ModuleContextFilter.getInstance().select_datatable_rows(this_context_query, columns_by_field_id, fields) :
                    await ModuleContextFilter.getInstance().select_vos(this_context_query);

                if (ConfigurationService.node_configuration.DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_DATAS) {
                    for (const i in datas) {
                        ConsoleHandler.log('DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_DATAS:step_i:' + this_step_i + ':data_i:' + i + ':' + JSON.stringify(datas[i]));
                    }
                }

                if (!datas?.length) {
                    return null;
                }

                const datas_with_vars = await this.convert_varparamfields_to_vardatas(
                    this_context_query,
                    datas,
                    columns,
                    custom_filters);

                if (ConfigurationService.node_configuration.DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_DATAS_WITH_VARS) {
                    for (const i in datas_with_vars) {
                        ConsoleHandler.log('DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_DATAS_WITH_VARS:step_i:' + this_step_i + ':data_with_var_i:' + i + ':' + JSON.stringify(datas_with_vars[i]));
                    }
                }

                if (!datas_with_vars) {
                    ConsoleHandler.error('Erreur lors de l\'export:la récupération des vars a échoué');
                    await PushDataServerController.getInstance().notifySimpleINFO(target_user_id, null, 'exportation_failed.error_vars_loading.___LABEL___', false, null);
                    return null;
                }
                return datas_with_vars;
            }, async (datas_with_vars: IDistantVOBase[]) => {

                if (!datas_with_vars?.length) {
                    return;
                }

                const translated_datas = await this.translate_context_query_fields_from_bdd(datas_with_vars, this_context_query, this_context_query.fields?.length > 0);

                if (ConfigurationService.node_configuration.DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_TRANSLATED_DATAS) {
                    for (const i in translated_datas) {
                        ConsoleHandler.log('DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_TRANSLATED_DATAS:step_i:' + this_step_i + ':translated_data_i:' + i + ':' + JSON.stringify(translated_datas[i]));
                    }
                }

                await this.update_custom_fields(translated_datas, exportable_datatable_custom_field_columns);

                // - Update to columns format (percent, toFixed etc...)
                const this_xlsx_datas = await this.update_data_rows_to_xlsx_columns_format(translated_datas, columns);

                if (ConfigurationService.node_configuration.DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_XLSX_DATAS) {
                    for (const i in this_xlsx_datas) {
                        ConsoleHandler.log('DEBUG_EXPORT_CONTEXT_QUERY_TO_XLSX_XLSX_DATAS:step_i:' + this_step_i + ':xlsx_data_i:' + i + ':' + JSON.stringify(this_xlsx_datas[i]));
                    }
                }

                xlsx_datas.push(...this_xlsx_datas);
            });
        }

        await ordered_promise_pipeline.end();

        const sheets: IExportableSheet[] = [];

        // Sheet for the actual datatable
        const datas_sheet: IExportableSheet = {
            sheet_name: 'Datas',
            datas: xlsx_datas,
            ordered_column_list,
            column_labels,
        };

        sheets.push(datas_sheet);

        // Sheet for active field filters
        if (export_active_field_filters) {
            const active_filters_sheet = await this.create_active_filters_xlsx_sheet(active_field_filters);
            sheets.push(active_filters_sheet);
        }

        // Sheet for Vars Indicator
        if (export_vars_indicator) {

            try {

                const vars_indicator_sheet = await this.create_vars_indicator_xlsx_sheet(
                    vars_indicator,
                    active_field_filters,
                    active_api_type_ids,
                    discarded_field_paths,
                );

                sheets.push(vars_indicator_sheet);

            } catch (error) {
                ConsoleHandler.error('Erreur lors de l\'export:la récupération des vars a échoué');
                await PushDataServerController.getInstance().notifySimpleINFO(target_user_id, null, 'exportation_failed.error_vars_loading.___LABEL___', false, null);
                return;
            }
        }

        // Final Excel file
        const filepath: string = await this.export_data_to_multi_sheets_xlsx(
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
            const fullpath = ConfigurationService.node_configuration.BASE_URL + filepath;

            let SEND_IN_BLUE_TEMPLATE_ID: number = null;

            if (send_email_with_export_notification) {
                SEND_IN_BLUE_TEMPLATE_ID = await ModuleParams.getInstance().getParamValueAsInt(
                    ModuleDataExportServer.PARAM_NAME_SEND_IN_BLUE_EXPORT_NOTIFICATION_TEMPLATE_ID
                );
            } else {
                SEND_IN_BLUE_TEMPLATE_ID = await ModuleParams.getInstance().getParamValueAsInt(
                    ModuleDataExportServer.PARAM_NAME_SEND_IN_BLUE_TEMPLATE_ID
                );
            }

            await PushDataServerController.getInstance().notifySimpleINFO(
                target_user_id,
                null,
                'exportContextQueryToXLSX.file_ready.___LABEL___',
                false,
                null,
                fullpath
            );

            await PushDataServerController.getInstance().notifyDownloadFile(
                target_user_id,
                null,
                ConfigurationService.node_configuration.BASE_URL + filepath
            );

            const user: UserVO = await query(UserVO.API_TYPE_ID)
                .filter_by_id(target_user_id)
                .select_vo<UserVO>();

            // Send mail
            if (SEND_IN_BLUE_TEMPLATE_ID) {

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
            } else {

                // Using APP
                const translatable_mail_subject: TranslatableTextVO = await ModuleTranslation.getInstance().getTranslatableText(ModuleDataExport.CODE_TEXT_MAIL_SUBJECT_export_dashboard);
                const translated_mail_subject: TranslationVO = await ModuleTranslation.getInstance().getTranslation(user.lang_id, translatable_mail_subject.id);
                await ModuleMailerServer.getInstance().sendMail({
                    to: user.email,
                    subject: translated_mail_subject.translated,
                    html: await ModuleMailerServer.getInstance().prepareHTML(default_export_mail_html_template, user.lang_id, {
                        FILE_URL: ConfigurationService.node_configuration.BASE_URL + filepath.substring(2, filepath.length)
                    })
                });
            }
        }
    }

    public async translate_context_query_fields_from_bdd(
        datas: any[],
        context_query: ContextQueryVO,
        use_raw_field: boolean = false
    ): Promise<any[]> {
        if (!(datas?.length > 0)) {
            return null;
        }

        if (!context_query) {
            return null;
        }

        let res = cloneDeep(datas);

        if (!(context_query?.fields?.length > 0)) {
            const table = ModuleTableController.module_tables_by_vo_type[context_query.base_api_type_id];

            for (const j in res) {
                const data = res[j];
                data._type = context_query.base_api_type_id;
            }

            res = ModuleTableServerController.translate_vos_from_db(res);

            for (const i in res) {
                const e = res[i];
                res[i] = this.get_xlsx_version(table, e);
            }

            return res;
        }

        const max = Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2));
        const promise_pipeline = new PromisePipeline(max, 'ModuleDataExportServer.translate_context_query_fields_from_bdd');
        for (const i in datas) {
            const data = datas[i];

            for (const j in context_query.fields) {
                const field = context_query.fields[j];

                await promise_pipeline.push(async () => {
                    const table = ModuleTableController.module_tables_by_vo_type[field.api_type_id];

                    if (!table) {
                        // Probablement un field pour des chargement de var ?
                        return;
                    }

                    // cas spécifique de l'id
                    if (field.field_name == 'id') {
                        res[i][field.alias] = parseInt(data[field.alias]);
                        return;
                    }

                    const table_field = table.get_field_by_id(field.field_name);

                    if (!table_field) {
                        ConsoleHandler.error('translate_context_query_fields_from_bdd:Unknown field:' + field.field_name + ':type:' + field.api_type_id + ':');
                        throw new Error('Unknown field');
                    }

                    ModuleTableFieldServerController.translate_field_from_db(table_field, data, res[i], field.alias);

                    res[i] = await this.field_to_xlsx(
                        table_field,
                        res[i],
                        res[i],
                        field.alias,
                        use_raw_field,
                    );
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

        const datas: any[] = [];
        const ordered_column_list: string[] = [];
        const column_labels: { [field_name: string]: string } = {};
        const modultable = ModuleTableController.module_tables_by_vo_type[api_type_id];
        filename = filename ? filename : api_type_id + '.xlsx';

        if (!lang_id) {
            const user = await ModuleAccessPolicyServer.getSelfUser();
            if (!user) {
                ConsoleHandler.error('Une langue doit être définie pour l\'export XLSX');
                return null;
            }
            lang_id = user.lang_id;
        }

        const vos = await query(api_type_id).select_vos();
        for (const i in vos) {
            const vo = this.get_xlsx_version(modultable, vos[i]);
            if (vo) {
                datas.push(vo);
            }
        }
        const fields = modultable.get_fields();
        for (const i in fields) {
            const field = fields[i];
            ordered_column_list.push(field.field_id);

            let label = ModuleTableFieldController.default_field_translation_by_vo_type_and_field_name[api_type_id] ?
                ModuleTableFieldController.default_field_translation_by_vo_type_and_field_name[api_type_id][field.field_id] :
                null;
            const text = await ModuleTranslation.getInstance().getTranslatableText(label.code_text);
            if (!text) {
                ConsoleHandler.error('Code texte de colonne introuvable:' + label.code_text);
                continue;
            }
            const translation = await ModuleTranslation.getInstance().getTranslation(lang_id, text.id);
            if (!translation) {
                ConsoleHandler.error('Traduction de colonne introuvable:' + label.code_text);
                continue;
            }
            column_labels[field.field_id] = translation.translated;
        }

        ordered_column_list.unshift("id");
        column_labels['id'] = 'id';

        file_access_policy_name = file_access_policy_name ? file_access_policy_name : ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS;

        const filepath: string = await this.exportDataToXLSX_base(
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

        // Si le file existe déjà, on le récupère
        let file: FileVO = await query(FileVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<FileVO>().path, filepath)
            .select_vo<FileVO>();

        if (!file) {
            file = new FileVO();
            file.path = filepath;
            file.file_access_policy_name = file_access_policy_name;
            file.is_secured = true;
            const res: InsertOrDeleteQueryResult = await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(file);
            if ((!res) || (!res.id)) {
                ConsoleHandler.error('Erreur lors de l\'enregistrement du fichier en base:' + filepath);
                return null;
            }
            file.id = res.id;
        }

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

        const worksheet_columns = [];
        for (const i in ordered_column_list) {
            worksheet_columns.push({ wch: 25 });
        }

        const workbook: WorkBook = XLSX.utils.book_new();

        const ws_data = [];
        let ws_row = [];
        for (const i in ordered_column_list) {
            const data_field_name: string = ordered_column_list[i];
            const title: string = column_labels[data_field_name];

            ws_row.push(title);
        }
        ws_data.push(ws_row);

        for (const r in datas) {
            const row_data = datas[r];
            ws_row = [];

            for (const i in ordered_column_list) {
                const data_field_name: string = ordered_column_list[i];
                const data = row_data[data_field_name];

                ws_row.push(data);
            }
            ws_data.push(ws_row);
        }

        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        XLSX.utils.book_append_sheet(workbook, ws, "Datas");

        const filepath: string = (is_secured ? ModuleFile.SECURED_FILES_ROOT : ModuleFile.FILES_ROOT) + filename;
        XLSX.writeFile(workbook, filepath);

        const user_log_id: number = ModuleAccessPolicyServer.getLoggedUserId();

        // On log l'export
        if (user_log_id) {

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(ExportLogVO.createNew(
                api_type_id ? api_type_id : 'N/A',
                Dates.now(),
                user_log_id
            ));
        }

        return filepath;
    }

    /**
     * create_active_filters_xlsx_sheet
     *  - Make the Xlsx sheet of Active field filters
     *
     * @param {FieldFiltersVO} active_field_filters
     * @returns {IExportableSheet}
     */
    private async create_active_filters_xlsx_sheet(
        active_field_filters: FieldFiltersVO = null,
    ): Promise<IExportableSheet> {

        if ((!active_field_filters)) {
            return null;
        }

        const sheet: IExportableSheet = {
            column_labels: { filter_name: 'Filtre', value: 'Valeur' },
            ordered_column_list: ['filter_name', 'value'],
            sheet_name: 'Filtres Actifs',
            datas: [],
        };

        for (const api_type_id in active_field_filters) {
            const active_filter = active_field_filters[api_type_id];

            for (const context_filter_name in active_filter) {
                const context_filter: ContextFilterVO = active_filter[context_filter_name];

                if (context_filter == null) {
                    continue;
                }

                const vo_field_ref_label: string = await VOFieldRefVOManager.create_readable_vo_field_ref_label(
                    { api_type_id: context_filter.vo_type, field_id: context_filter.field_name },
                    // TODO: get page id from to get the right translation
                );

                const data: { [column_list_key: string]: { value: string | number, format?: string } } = {
                    filter_name: { value: vo_field_ref_label },
                    value: { value: ContextFilterVOHandler.context_filter_to_readable_ihm(context_filter) }
                };

                sheet.datas.push(data);
            }
        }

        return sheet;
    }

    /**
     * create_vars_indicator_xlsx_sheet
     *  - Make the Xlsx sheet of the given Vars Indicator
     *
     * @param vars_indicator {ExportVarIndicatorVO}
     * @param active_field_filters {FieldFiltersVO}
     * @param active_api_type_ids {string[]}
     * @param discarded_field_paths {{ [vo_type: string]: { [field_id: string]: boolean } }}
     * @returns {IExportableSheet}
     */
    private async create_vars_indicator_xlsx_sheet(
        vars_indicator: ExportVarIndicatorVO,
        active_field_filters: FieldFiltersVO = null,
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

        const current_active_field_filters: FieldFiltersVO = cloneDeep(active_field_filters);
        const limit = 500; //Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2));
        const promise_pipeline = new PromisePipeline(limit, 'ModuleDataExportServer.create_vars_indicator_xlsx_sheet');
        let debug_uid: number = 0;
        let has_errors: boolean = false;

        for (const var_name in vars_indicator.varcolumn_conf) {

            const varcolumn_conf = vars_indicator.varcolumn_conf[var_name];

            const this_custom_filters: { [var_param_field_name: string]: ContextFilterVO } = {};
            let filter_additional_params = null;

            if (has_errors) {
                break;
            }

            try {
                // JSON parse may throw exeception (case when empty or Non-JSON)
                filter_additional_params = JSON.parse(varcolumn_conf.filter_additional_params);
            } catch (e) {

            }

            for (const var_param_field_name in varcolumn_conf.custom_field_filters) {
                // varcolumn_conf filter name
                const varcolumn_conf_custom_field_filters_key = varcolumn_conf.custom_field_filters[var_param_field_name];

                // find the actual field filters key from active_field_filters
                const varcolumn_conf_api_type_id: string = Object.keys(current_active_field_filters)
                    .find((api_type_id) => Object.keys(current_active_field_filters[api_type_id])
                        .find((field_filter_key) => field_filter_key === varcolumn_conf_custom_field_filters_key)
                    );

                if (!varcolumn_conf_api_type_id) {
                    continue;
                }

                this_custom_filters[var_param_field_name] = current_active_field_filters[varcolumn_conf_api_type_id][varcolumn_conf_custom_field_filters_key];
            }

            debug_uid++;
            ConsoleHandler.log('create_vars_indicator_xlsx_sheet:PRE PIPELINE PUSH:nb :' + var_name + ':' + debug_uid);
            await promise_pipeline.push(async () => {

                ConsoleHandler.log('create_vars_indicator_xlsx_sheet:INSIDE PIPELINE CB 1:nb :' + var_name + ':' + debug_uid);

                /**
                 * On doit récupérer le param en fonction de la ligne et les filtres actifs utilisés pour l'export
                 */
                const var_param: VarDataBaseVO = await ModuleVar.getInstance().getVarParamFromContextFilters(
                    VarsController.var_conf_by_id[varcolumn_conf.var_id].name,
                    current_active_field_filters,
                    this_custom_filters,
                    active_api_type_ids,
                    discarded_field_paths
                );
                if (!var_param) {
                    ConsoleHandler.log('create_vars_indicator_xlsx_sheet:INSIDE PIPELINE CB 1.5:!var_param :' + var_name + ':' + debug_uid);
                    sheet.datas.push({
                        name: { value: LocaleManager.getInstance().t(var_name) },
                        value: null
                    });
                    return;
                }

                ConsoleHandler.log('create_vars_indicator_xlsx_sheet:INSIDE PIPELINE CB 2:nb :' + var_name + ':' + debug_uid + ':' + var_param.index);

                try {

                    const var_data = await VarsServerCallBackSubsController.get_var_data(
                        var_param.index);
                    let value = var_data ? var_data.value : null;
                    let format: XlsxCellFormatByFilterType = null;

                    if (value != null) {
                        const params = [value].concat(filter_additional_params);

                        // We update the value to the column format (FilterObj => percent, decimal, toFixed etc...)
                        if (typeof filter_by_name[varcolumn_conf.filter_type]?.read === 'function') {
                            value = filter_by_name[varcolumn_conf.filter_type].read.apply(null, params);
                            format = varcolumn_conf.filter_type as XlsxCellFormatByFilterType;

                            value = this.update_value_to_xlsx_column_format(varcolumn_conf, value);
                        }
                    }

                    const data: { [column_list_key: string]: { value: string | number, format?: string } } = {
                        name: { value: LocaleManager.getInstance().t(var_name) },
                        value: { value, format }
                    };

                    sheet.datas.push(data);
                } catch (error) {

                    ConsoleHandler.error('create_vars_indicator_xlsx_sheet:FAILED get_var_data:nb :' + var_name + ':' + debug_uid + ':' + var_param._bdd_only_index + ':' + error);
                    has_errors = true;
                }

                ConsoleHandler.log('create_vars_indicator_xlsx_sheet:INSIDE PIPELINE CB 3:nb :' + var_name + ':' + debug_uid);
            });

            ConsoleHandler.log('create_vars_indicator_xlsx_sheet:POST PIPELINE PUSH:nb :' + var_name + ':' + debug_uid);
        }

        await promise_pipeline.end();

        if (has_errors) {
            throw new Error('Erreur lors de la récupération des données');
        }

        return sheet;
    }


    private async export_data_to_multi_sheets_xlsx(
        filename: string,
        sheets: IExportableSheet[],
        api_type_id: string,
        is_secured: boolean = false,
        file_access_policy_name: string = null
    ): Promise<string> {

        const filepath: string = await this.export_data_to_multi_sheets_xlsx_base(
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

    private async export_data_to_multi_sheets_xslw_file(
        filename: string,
        sheets: IExportableSheet[],
        api_type_id: string,
        is_secured: boolean = false,
        file_access_policy_name: string = null
    ): Promise<FileVO> {

        const filepath: string = await this.export_data_to_multi_sheets_xlsx_base(
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

        // Si le file existe déjà, on le récupère
        let file: FileVO = await query(FileVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<FileVO>().path, filepath)
            .select_vo<FileVO>();

        if (file && (file.file_access_policy_name != file_access_policy_name)) {
            ConsoleHandler.error('Erreur lors de l\'export:' + filepath + ' : file_access_policy_name mismatch');
        }

        if (!file) {
            file = new FileVO();
            file.path = filepath;
            file.file_access_policy_name = file_access_policy_name;
            file.is_secured = is_secured;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(file);
            if (!file.id) {
                ConsoleHandler.error('Erreur lors de l\'enregistrement du fichier en base:' + filepath);
                return null;
            }
        }

        return file;
    }

    private async export_data_to_multi_sheets_xlsx_base(
        filename: string,
        sheets: IExportableSheet[],
        api_type_id: string,
        is_secured: boolean = false,
        file_access_policy_name: string = null
    ): Promise<string> {

        if ((!filename) || (!sheets) || (!ObjectHandler.hasAtLeastOneAttribute(sheets))) {
            return null;
        }

        ConsoleHandler.log('EXPORT : ' + filename);
        const workbook: WorkBook = XLSX.utils.book_new();

        // For each sheet that we want to export
        for (const sheeti in sheets) {
            const sheet = sheets[sheeti];

            const ws_formats: { [cell: string]: string } = {};
            const ws_data = [];
            let ws_row = [];

            // We create the sheet
            const worksheet_columns = [];
            for (const i in sheet.ordered_column_list) {

                // Add worksheet columns list width
                worksheet_columns.push({ wch: 25 });

                const data_field_name: string = sheet.ordered_column_list[i];
                const title: string = sheet.column_labels[data_field_name];

                // Add worksheet columns_list title row
                ws_row.push(title);
            }

            // Add worksheet columns_list title row (columns_list titles)
            ws_data.push(ws_row);

            // Add worksheet columns_list data rows
            for (const row_i in sheet.datas) {
                const row_data = sheet.datas[row_i];

                ws_row = [];

                for (const i in sheet.ordered_column_list) {
                    const data_field_name: string = sheet.ordered_column_list[i];

                    const format = row_data[data_field_name]?.format; // The actual format of the cell
                    const value = row_data[data_field_name]?.value; // The actual value of the cell

                    const column_number = indexOf(sheet.ordered_column_list, data_field_name); // The actual column number of the cell
                    const column_letter = String.fromCharCode(97 + column_number); // The actual column letter of the cell
                    const cell = column_letter?.toUpperCase() + (parseInt(row_i) + 2); // The actual cell

                    let cell_format = null;
                    if (format) {
                        cell_format = XlsxCellFormatByFilterType[format] ?? null;
                    }

                    ws_formats[cell] = cell_format; // The actual format of the cell

                    ws_row.push(value);
                }

                ws_data.push(ws_row);
            }

            const ws = XLSX.utils.aoa_to_sheet(ws_data);

            // Add|Assign cell (number) format
            for (const cell in ws_formats) {
                const cell_format = ws_formats[cell];
                const ws_cell = ws[cell];

                if (!cell_format) {
                    continue;
                }

                if (!ws_cell) {
                    continue;
                }

                ws_cell.z = ws_formats[cell];
            }

            XLSX.utils.book_append_sheet(
                workbook,
                ws,
                sheet.sheet_name
            );
        }

        const filepath: string = (is_secured ? ModuleFile.SECURED_FILES_ROOT : ModuleFile.FILES_ROOT) + filename;
        XLSX.writeFile(workbook, filepath);

        const user_log_id: number = ModuleAccessPolicyServer.getLoggedUserId();

        // On log l'export
        if (user_log_id) {

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(ExportLogVO.createNew(
                api_type_id,
                Dates.now(),
                user_log_id
            ));
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
    private async get_xlsx_version<T extends IDistantVOBase>(module_table: ModuleTableVO, e: T): Promise<any> {
        if (!e) {
            return null;
        }

        const res = {};
        const fields = module_table.get_fields();

        if (!fields) {
            return cloneDeep(e);
        }

        res['_type'] = e._type;
        res['id'] = e.id;
        const promises = [];
        for (const i in fields) {
            const field = fields[i];

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
    private async field_to_xlsx(
        field: ModuleTableFieldVO,
        src_vo: any,
        dest_vo: any,
        field_alias: string = null,
        use_raw_field: boolean = false
    ): Promise<any> {

        const src_field_id = (field_alias ? field_alias : field.field_id) + (use_raw_field ? '__raw' : '');
        const dest_field_id = (field_alias ? field_alias : field.field_id);

        switch (field.field_type) {

            // TODO FIXME  export des ranges dans xlsx à réfléchir...

            case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                const tab_tstzrange_array = src_vo[src_field_id];
                dest_vo[dest_field_id] = '';

                for (const i in tab_tstzrange_array) {
                    const range = tab_tstzrange_array[i];
                    if (range) {

                        if (dest_vo[dest_field_id] != '') {
                            dest_vo[dest_field_id] += ', ';
                        }
                        dest_vo[dest_field_id] += Dates.format_segment(RangeHandler.getSegmentedMin(src_vo[src_field_id], src_vo[src_field_id].segment_type), src_vo[src_field_id].segment_type) + ' - ' +
                            Dates.format_segment(RangeHandler.getSegmentedMax(src_vo[src_field_id], src_vo[src_field_id].segment_type, field.max_range_offset), src_vo[src_field_id].segment_type);
                    }
                }
                break;
            case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                const _src_field_id = (field_alias ? field_alias : field.field_id);

                // Many to Many relation: we need to get the related vo
                // and get the label field
                const vo_field = src_vo[_src_field_id];
                dest_vo[dest_field_id] = '';

                for (const i in vo_field) {
                    const related_vo = vo_field[i];
                    if (!related_vo) {
                        continue;
                    }

                    if (dest_vo[dest_field_id] != '') {
                        dest_vo[dest_field_id] += ', ';
                    }

                    dest_vo[dest_field_id] += related_vo.label;
                }

                break;

            case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
            case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
                const tab = src_vo[src_field_id];
                dest_vo[dest_field_id] = '';

                for (const i in tab) {
                    const range = tab[i];
                    if (range) {

                        if (dest_vo[dest_field_id] != '') {
                            dest_vo[dest_field_id] += ', ';
                        }
                        dest_vo[dest_field_id] += RangeHandler.getSegmentedMin(
                            src_vo[src_field_id],
                            src_vo[src_field_id].segment_type
                        ) + ' - ' +
                            RangeHandler.getSegmentedMax(
                                src_vo[src_field_id],
                                src_vo[src_field_id].segment_type,
                                field.max_range_offset
                            );
                    }
                }
                break;

            case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                dest_vo[dest_field_id] = Dates.format_segment(
                    RangeHandler.getSegmentedMin(src_vo[src_field_id], src_vo[src_field_id].segment_type), src_vo[src_field_id].segment_type) + ' - ' +
                    Dates.format_segment(RangeHandler.getSegmentedMax(src_vo[src_field_id], src_vo[src_field_id].segment_type, field.max_range_offset), src_vo[src_field_id].segment_type);
                break;

            case ModuleTableFieldVO.FIELD_TYPE_numrange:
            case ModuleTableFieldVO.FIELD_TYPE_hourrange:
                dest_vo[dest_field_id] = RangeHandler.getSegmentedMin(src_vo[src_field_id], src_vo[src_field_id].segment_type) + ' - ' + RangeHandler.getSegmentedMax(src_vo[src_field_id], src_vo[src_field_id].segment_type, field.max_range_offset);
                break;

            case ModuleTableFieldVO.FIELD_TYPE_tstz:

                if (field instanceof DatatableField) {
                    dest_vo[dest_field_id] = field.dataToReadIHM(src_vo[src_field_id], src_vo);
                } else {
                    dest_vo[dest_field_id] = Dates.format_segment(
                        src_vo[src_field_id],
                        (field.segmentation_type == null) ? TimeSegment.TYPE_DAY : field.segmentation_type,
                        field.format_localized_time
                    );
                }

                break;

            case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                if (field instanceof DatatableField) {
                    dest_vo[dest_field_id] = field.dataToReadIHM(src_vo[src_field_id], src_vo);
                } else if ((src_vo[src_field_id] === null) || (typeof src_vo[src_field_id] === 'undefined')) {
                    dest_vo[dest_field_id] = src_vo[src_field_id];
                } else {
                    dest_vo[dest_field_id] = (src_vo[src_field_id] as number[]).map(
                        (ts: number) => Dates.format_segment(
                            ts,
                            (field.segmentation_type == null) ? TimeSegment.TYPE_DAY : field.segmentation_type
                        )
                    );
                }
                break;

            case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:
                delete dest_vo[dest_field_id];
                break;

            case ModuleTableFieldVO.FIELD_TYPE_enum:
                const user = await ModuleAccessPolicy.getInstance().getSelfUser();
                const trads: TranslationVO[] = await query(TranslationVO.API_TYPE_ID)
                    .filter_by_text_eq(field_names<TranslatableTextVO>().code_text, field.enum_values[src_vo[src_field_id]], TranslatableTextVO.API_TYPE_ID)
                    .filter_by_num_in(field_names<TranslationVO>().lang_id, query(UserVO.API_TYPE_ID).field(field_names<UserVO>().lang_id).filter_by_id(user.id))
                    .select_vos();
                const trad = trads ? trads[0] : null;
                dest_vo[dest_field_id] = trad ? trad.translated : null;
                break;


            case ModuleTableFieldVO.FIELD_TYPE_html:
            case ModuleTableFieldVO.FIELD_TYPE_textarea:
            case ModuleTableFieldVO.FIELD_TYPE_email:
            case ModuleTableFieldVO.FIELD_TYPE_string:
            case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:
            case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
            case ModuleTableFieldVO.FIELD_TYPE_password:
            case ModuleTableFieldVO.FIELD_TYPE_file_field:
            case ModuleTableFieldVO.FIELD_TYPE_image_field:
                /**
                 * Si on a un type string, mais que la bdd renvoie un array, on join(',') pour avoir une string
                 */
                if (Array.isArray(src_vo[src_field_id])) {
                    dest_vo[dest_field_id] = src_vo[src_field_id].join(',');
                } else {
                    dest_vo[dest_field_id] = src_vo[src_field_id];
                }
                break;

            case ModuleTableFieldVO.FIELD_TYPE_float:
            case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
            case ModuleTableFieldVO.FIELD_TYPE_amount:
            case ModuleTableFieldVO.FIELD_TYPE_file_ref:
            case ModuleTableFieldVO.FIELD_TYPE_image_ref:
            case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
            case ModuleTableFieldVO.FIELD_TYPE_int:
            case ModuleTableFieldVO.FIELD_TYPE_prct:
            case ModuleTableFieldVO.FIELD_TYPE_hour:
            default:
                dest_vo[dest_field_id] = src_vo[src_field_id];
        }

        if (typeof dest_vo[dest_field_id] === 'undefined') {
            delete dest_vo[dest_field_id];
        }

        return dest_vo;
    }

    /**
     * On retouche les champs custom en appelant les cbs
     */
    private async update_custom_fields(
        datas: any[],
        exportable_datatable_custom_field_columns: { [datatable_field_uid: string]: string } = null,
    ) {

        const max_connections_to_use = Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2));
        const promise_pipeline = new PromisePipeline(max_connections_to_use, 'ModuleDataExportServer.update_custom_fields');
        const cpt_custom_field_translatable_name: { [custom_field_translatable_name: string]: number } = {};

        for (const field_id in exportable_datatable_custom_field_columns) {
            const custom_field_translatable_name = exportable_datatable_custom_field_columns[field_id];

            const cb = TableWidgetCustomFieldsController.getInstance()
                .custom_components_export_cb_by_translatable_title[custom_field_translatable_name];

            if (!cb) {
                continue;
            }

            cpt_custom_field_translatable_name[custom_field_translatable_name] = 1;

            for (const key_i in datas) {
                const data = datas[key_i];

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
    private async update_data_rows_to_xlsx_columns_format(
        datas: any[],
        columns: TableColumnDescVO[] = null,
    ) {

        const xlsx_datas = cloneDeep(datas);

        for (const field_uid in columns) {
            const column = columns[field_uid];

            let filter_additional_params = null;

            try {
                // JSON parse may throw exeception (case when empty or Non-JSON)
                filter_additional_params = column.filter_additional_params ? ObjectHandler.try_get_json(column.filter_additional_params) : null;
            } catch (e) {

            }

            for (const row_key in xlsx_datas) {
                const row = xlsx_datas[row_key];

                if (row[column.datatable_field_uid] == null) {
                    continue;
                }

                // We keep the raw value in case we need it later
                row[column.datatable_field_uid + '__raw'] = row[column.datatable_field_uid + '__raw'] ?? row[column.datatable_field_uid];

                let value = row[column.datatable_field_uid] ?? null;
                let format: XlsxCellFormatByFilterType = null;

                // Default value we will update the value
                // to the column format later
                row[column.datatable_field_uid] = {
                    format,
                    value,
                };

                if (!(filter_additional_params?.length > 0)) {
                    continue;
                }

                // Rather use the raw value (not the formatted one) to apply the filter
                const raw_value = row[column.datatable_field_uid + '__raw'] ?? null;
                const params = [raw_value].concat(filter_additional_params);

                // We update the value to the column format (FilterObj => percent, decimal, toFixed etc...)
                if (typeof filter_by_name[column.filter_type]?.read === 'function') {
                    value = filter_by_name[column.filter_type].read.apply(null, params);
                    format = column.filter_type as XlsxCellFormatByFilterType;

                    value = this.update_value_to_xlsx_column_format(column, value);
                }

                row[column.datatable_field_uid] = {
                    format,
                    value,
                };
            }
        }

        return xlsx_datas;
    }

    // /**
    //  * On ajoute aux datas les résolutats de calcul des vars qui remplissent les colonnes de var du tableau
    //  *  Il faut donc d'abord définir les pramètres de calcul des vars, puis attendre le résultat du calcul
    //  */
    // private async add_var_columns_values_for_xlsx_datas(
    //     datatable_rows: IDistantVOBase[],
    //     ordered_column_list: string[],

    //     columns: TableColumnDescVO[],
    //     varcolumn_conf: { [datatable_field_uid: string]: ExportVarcolumnConfVO } = null,
    //     active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = null,
    //     custom_filters: { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } } = null,
    //     active_api_type_ids: string[] = null,
    //     discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } } = null,
    //     do_not_use_filter_by_datatable_field_uid: { [datatable_field_uid: string]: { [vo_type: string]: { [field_id: string]: boolean } } } = null,

    // ): Promise<IDistantVOBase[]> {

    //     // May be better to not alter the original data rows
    //     let rows: IDistantVOBase[] = cloneDeep(datatable_rows);

    //     let limit = 500; //Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2));
    //     let promise_pipeline = new PromisePipeline(limit);
    //     let debug_uid: number = 0;
    //     let has_errors: boolean = false;

    //     if (ConfigurationService.node_configuration.DEBUG_add_var_columns_values_for_xlsx_datas) {
    //         ConsoleHandler.log('add_var_columns_values_for_xlsx_datas:nb rows:' + rows.length);
    //     }
    //     for (let j in rows) {
    //         let row = rows[j];
    //         let data_n: number = parseInt(j) + 1;

    //         if (has_errors) {
    //             break;
    //         }

    //         if (ConfigurationService.node_configuration.DEBUG_add_var_columns_values_for_xlsx_datas) {
    //             ConsoleHandler.log('add_var_columns_values_for_xlsx_datas:row:' + data_n + '/' + rows.length);
    //         }

    //         for (let i in ordered_column_list) {
    //             let row_field_name: string = ordered_column_list[i];

    //             if (has_errors) {
    //                 break;
    //             }

    //             // Check if it's actually a var param field
    //             if (!varcolumn_conf[row_field_name]) {
    //                 continue;
    //             }

    //             const this_varcolumn_conf = cloneDeep(varcolumn_conf[row_field_name]);
    //             const this_custom_filters = custom_filters ?
    //                 cloneDeep(custom_filters[row_field_name]) :
    //                 null;
    //             const do_not_user_filter: { [vo_type: string]: { [field_id: string]: boolean } } = do_not_use_filter_by_datatable_field_uid ?
    //                 do_not_use_filter_by_datatable_field_uid[row_field_name] :
    //                 null;

    //             let current_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = cloneDeep(active_field_filters);

    //             for (let vo_type in do_not_user_filter) {
    //                 for (let field_id in do_not_user_filter[vo_type]) {
    //                     if (do_not_user_filter[vo_type][field_id]) {
    //                         if (current_active_field_filters && current_active_field_filters[vo_type]) {
    //                             delete current_active_field_filters[vo_type][field_id];
    //                         }
    //                     }
    //                 }
    //             }

    //             let context = DashboardBuilderController.getInstance().add_table_row_context(current_active_field_filters, columns, row);

    //             debug_uid++;
    //             await promise_pipeline.push(async () => {

    //                 /**
    //                  * On doit récupérer le param en fonction de la ligne et les filtres actifs utilisés pour l'export
    //                  */
    //                 let var_param: VarDataBaseVO = await ModuleVar.getInstance().getVarParamFromContextFilters(
    //                     VarsController.var_conf_by_id[this_varcolumn_conf.var_id].name,
    //                     context,
    //                     this_custom_filters,
    //                     active_api_type_ids,
    //                     discarded_field_paths
    //                 );
    //                 if (!var_param) {
    //                     row[row_field_name] = null;
    //                     return;
    //                 }

    //                 try {

    //                     let var_data = await VarsServerCallBackSubsController.get_var_data(var_param, 'add_var_columns_values_for_xlsx_datas: exporting data');
    //                     row[row_field_name] = var_data?.value ?? null;
    //                 } catch (error) {
    //                     ConsoleHandler.error('add_var_columns_values_for_xlsx_datas:FAILED get_var_data:nb :' + i + ':' + debug_uid + ':' + var_param._bdd_only_index + ':' + error);
    //                     has_errors = true;
    //                 }
    //             });
    //         }
    //     }

    //     await promise_pipeline.end();

    //     if (has_errors) {
    //         return null;
    //     }

    //     return rows;
    // }


    /**
     * update_value_to_xlsx_column_format
     *
     * @param {TableColumnDescVO | ExportVarcolumnConfVO} column
     * @param {number | string} value
     * @returns {number}
     */
    private update_value_to_xlsx_column_format(
        column: TableColumnDescVO | ExportVarcolumnConfVO,
        value: any,
    ): number {

        if (column.filter_type != FilterObj.FILTER_TYPE_tstz) {
            // Remove all spaces
            value = (value as any).replace(/\s+/g, '');
        }

        /**
         * Si on est sur du numérique, on remplace la , par un . au cas où
         */
        if ((
            (column.filter_type == FilterObj.FILTER_TYPE_percent) ||
            (column.filter_type == FilterObj.FILTER_TYPE_toFixed) ||
            (column.filter_type == FilterObj.FILTER_TYPE_toFixedCeil) ||
            (column.filter_type == FilterObj.FILTER_TYPE_toFixedFloor)
        ) &&
            (typeof value === 'string')) {
            value = (value as string).replace(/,/g, '.');
        }

        // Remove all non numeric characters
        // And force to be a number
        switch (column.filter_type) {
            case FilterObj.FILTER_TYPE_percent:
                value = (value as any).replace(/%/g, '');
                value = parseFloat(value as any) / 100;
                break;
            case FilterObj.FILTER_TYPE_toFixed:
            case FilterObj.FILTER_TYPE_toFixedCeil:
            case FilterObj.FILTER_TYPE_toFixedFloor:
                value = parseFloat(value as any);
        }

        return value;
    }

    /**
     * On ajoute aux datas les résolutats de calcul des vars qui remplissent les colonnes de var du tableau
     *  Il faut donc d'abord définir les pramètres de calcul des vars, puis attendre le résultat du calcul
     */
    private async convert_varparamfields_to_vardatas(
        context_query: ContextQueryVO,

        datatable_rows: IDistantVOBase[],
        columns: TableColumnDescVO[],

        custom_filters: { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } } = null,
    ): Promise<IDistantVOBase[]> {

        // May be better to not alter the original data rows
        const rows: IDistantVOBase[] = cloneDeep(datatable_rows);

        const limit = 20000; //Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2));
        const promise_pipeline = new PromisePipeline(limit, 'ModuleDataExportServer.convert_varparamfields_to_vardatas');
        let debug_uid: number = 0;
        let has_errors: boolean = false;
        const module_var = ModuleVar.getInstance();

        const limit_nb_ts_ranges_on_param_by_context_filter: number = await ModuleVarServer.getInstance().get_limit_nb_ts_ranges_on_param_by_context_filter();

        if (ConfigurationService.node_configuration.DEBUG_convert_varparamfields_to_vardatas) {
            ConsoleHandler.log('convert_varparamfields_to_vardatas:nb rows:' + rows.length);
        }

        for (const j in rows) {
            const row = rows[j];
            const data_n: number = parseInt(j) + 1;

            if (has_errors) {
                break;
            }

            if (ConfigurationService.node_configuration.DEBUG_convert_varparamfields_to_vardatas) {
                ConsoleHandler.log('convert_varparamfields_to_vardatas:row:' + data_n + '/' + rows.length);
            }

            for (const i in columns) {
                const column = columns[i];

                if (has_errors) {
                    break;
                }

                // Check if it's actually a var param field
                if ((!column) || (column.type != TableColumnDescVO.TYPE_var_ref)) {
                    continue;
                }

                const this_custom_filters = custom_filters ?
                    cloneDeep(custom_filters[column.datatable_field_uid]) :
                    null;

                // FIXME : DELETE IF useless - kept from last merge ==>
                // let current_active_field_filters: FieldFiltersVO = cloneDeep(active_field_filters);

                // for (let vo_type in do_not_user_filter) {
                //     for (let field_id in do_not_user_filter[vo_type]) {
                //         if (do_not_user_filter[vo_type][field_id]) {
                //             if (current_active_field_filters && current_active_field_filters[vo_type]) {
                //                 delete current_active_field_filters[vo_type][field_id];
                //             }
                //         }
                //     }
                // }

                // let context = DashboardBuilderController.getInstance().add_table_row_context(current_active_field_filters, columns, row);
                //<==

                debug_uid++;
                await promise_pipeline.push(async () => {

                    /**
                     * On doit récupérer le param en fonction de la ligne et les filtres actifs utilisés pour l'export
                     */
                    const var_param: VarDataBaseVO = module_var.getVarParamFromDataRow(
                        row,
                        column,
                        this_custom_filters,
                        limit_nb_ts_ranges_on_param_by_context_filter,
                        false);
                    if (!var_param) {
                        row[column.datatable_field_uid] = null;
                        return;
                    }

                    try {

                        const var_data = await VarsServerCallBackSubsController.get_var_data(var_param.index);
                        row[column.datatable_field_uid] = var_data?.value ?? null;
                    } catch (error) {
                        ConsoleHandler.error('convert_varparamfields_to_vardatas:FAILED get_var_data:nb :' + i + ':' + debug_uid + ':' + var_param._bdd_only_index + ':' + error);

                        /**
                         * On retente. Si ça ne passe pas non plus on abandonne
                         */
                        try {

                            const var_data = await VarsServerCallBackSubsController.get_var_data(var_param.index);
                            row[column.datatable_field_uid] = var_data?.value ?? null;
                        } catch (error) {
                            ConsoleHandler.error('convert_varparamfields_to_vardatas:FAILED 2 get_var_data:nb :' + i + ':' + debug_uid + ':' + var_param._bdd_only_index + ':' + error);
                            has_errors = true;
                        }
                    }
                });
            }
        }

        await promise_pipeline.end();

        /**
         * Dans tous les cas on clean la row des champs de paramètres des vars
         */
        module_var.clean_rows_of_varparamfields(rows, context_query);

        if (has_errors) {
            return null;
        }

        return rows;
    }

    // private get_active_field_filters_filtered_by_do_not_use_filter_by_datatable_field_uid(
    //     active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
    //     ordered_column_list: string[],
    //     varcolumn_conf: { [datatable_field_uid: string]: ExportVarcolumnConfVO } = null,
    //     do_not_use_filter_by_datatable_field_uid: { [datatable_field_uid: string]: { [vo_type: string]: { [field_id: string]: boolean } } } = null
    // ): { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } {

    //     // On commence par appliquer le param do_not_use_filter_by_datatable_field_uid
    //     let active_field_filters_cp: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = cloneDeep(active_field_filters);
    //     for (let i in ordered_column_list) {
    //         let row_field_name: string = ordered_column_list[i];

    //         // Check if it's actually a var param field
    //         if (!varcolumn_conf[row_field_name]) {
    //             continue;
    //         }

    //         const do_not_user_filter: { [vo_type: string]: { [field_id: string]: boolean } } = do_not_use_filter_by_datatable_field_uid ?
    //             do_not_use_filter_by_datatable_field_uid[row_field_name] :
    //             null;

    //         for (let vo_type in do_not_user_filter) {
    //             for (let field_id in do_not_user_filter[vo_type]) {
    //                 if (do_not_user_filter[vo_type][field_id]) {
    //                     if (active_field_filters_cp && active_field_filters_cp[vo_type]) {
    //                         delete active_field_filters_cp[vo_type][field_id];
    //                     }
    //                 }
    //             }
    //         }
    //     }

    //     return active_field_filters_cp;
    // }
}
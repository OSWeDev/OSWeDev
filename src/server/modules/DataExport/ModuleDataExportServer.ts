
import { cloneDeep, indexOf } from 'lodash';
import XLSX, { WorkBook } from 'xlsx';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleContextFilter from '../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVOHandler from '../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextFilterVO from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryVO, { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import DatatableField from '../../../shared/modules/DAO/vos/datatable/DatatableField';
import TableWidgetCustomFieldsController from '../../../shared/modules/DashboardBuilder/TableWidgetCustomFieldsController';
import VOFieldRefVOManager from '../../../shared/modules/DashboardBuilder/manager/VOFieldRefVOManager';
import TableColumnDescVO from '../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import ModuleDataExport from '../../../shared/modules/DataExport/ModuleDataExport';
import IExportOptions from '../../../shared/modules/DataExport/interfaces/IExportOptions';
import IExportableSheet from '../../../shared/modules/DataExport/interfaces/IExportableSheet';
import { XlsxCellFormatByFilterType } from '../../../shared/modules/DataExport/type/XlsxCellFormatByFilterType';
import ExportHistoricVO from '../../../shared/modules/DataExport/vos/ExportHistoricVO';
import ExportVarIndicator from '../../../shared/modules/DataExport/vos/ExportVarIndicator';
import ExportVarcolumnConf from '../../../shared/modules/DataExport/vos/ExportVarcolumnConf';
import ExportLogVO from '../../../shared/modules/DataExport/vos/apis/ExportLogVO';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import ModuleFile from '../../../shared/modules/File/ModuleFile';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import ModuleTable from '../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import SendInBlueMailVO from '../../../shared/modules/SendInBlue/vos/SendInBlueMailVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import VOsTypesManager from '../../../shared/modules/VO/manager/VOsTypesManager';
import ModuleVar from '../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import FilterObj, { filter_by_name } from '../../../shared/tools/Filters';
import LocaleManager from '../../../shared/tools/LocaleManager';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import { all_promises } from '../../../shared/tools/PromiseTools';
import RangeHandler from '../../../shared/tools/RangeHandler';
import StackContext from '../../StackContext';
import ConfigurationService from '../../env/ConfigurationService';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleBGThreadServer from '../BGThread/ModuleBGThreadServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import ModuleServerBase from '../ModuleServerBase';
import PushDataServerController from '../PushData/PushDataServerController';
import SendInBlueMailServerController from '../SendInBlue/SendInBlueMailServerController';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';
import ModuleVarServer from '../Var/ModuleVarServer';
import VarsServerCallBackSubsController from '../Var/VarsServerCallBackSubsController';
import DataExportServerController from './DataExportServerController';
import DataExportBGThread from './bgthreads/DataExportBGThread';
import ExportContextQueryToXLSXBGThread from './bgthreads/ExportContextQueryToXLSXBGThread';
import ExportContextQueryToXLSXQueryVO from './bgthreads/vos/ExportContextQueryToXLSXQueryVO';
import DashboardPageWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';

export default class ModuleDataExportServer extends ModuleServerBase {

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

        let preCreateTrigger: DAOPreCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
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
            'fr-fr': 'Echec de l\'exportation des données : si l\'erreur persiste merci de nous contacter.'
        }, 'exportation_failed.error_vars_loading.___LABEL___'));

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

        do_not_use_filter_by_datatable_field_uid: { [datatable_field_uid: string]: { [vo_type: string]: { [field_id: string]: boolean } } } = null,

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
            do_not_use_filter_by_datatable_field_uid,
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

        do_not_use_filter_by_datatable_field_uid: { [datatable_field_uid: string]: { [vo_type: string]: { [field_id: string]: boolean } } } = null,

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
                    do_not_use_filter_by_datatable_field_uid,
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
                do_not_use_filter_by_datatable_field_uid,
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
        varcolumn_conf: { [datatable_field_uid: string]: ExportVarcolumnConf } = null, // TODO FIXME : Quand est-ce qu'on applique le format ???
        active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = null,
        custom_filters: { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } } = null,
        active_api_type_ids: string[] = null,
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } } = null,

        is_secured: boolean = false,
        file_access_policy_name: string = null,

        target_user_id: number = null,

        do_not_use_filter_by_datatable_field_uid: { [datatable_field_uid: string]: { [vo_type: string]: { [field_id: string]: boolean } } } = null, // TODO FIXME ??? What is the use of this param ???

        export_options?: IExportOptions,

        vars_indicator?: ExportVarIndicator,
    ): Promise<void> {

        let api_type_id = context_query.base_api_type_id;
        let columns_by_field_id = {};

        for (let i in columns) {
            let column = columns[i];
            columns_by_field_id[column.datatable_field_uid] = column;
        }

        // TODO FIXME il faut faire des blocs de x lignes, on peut pas exporter tout d'un coup (sur 20k lignes ça bloque complet)
        //  à la limite on peut envisager peut-etre de faire 1000 lignes, checker la durée, et passer à 500 ou 2000 en fonction, ... jusqu'à trouver un bon compromis pour un export donné
        //  une durée de 2/3 secondes max c'est surement pas mal pour la partie requete

        await ModuleVar.getInstance().add_vars_params_columns_for_ref_ids(context_query, columns);

        let might_have_more_datas = true;
        let xlsx_datas = [];
        while (might_have_more_datas) {

            // let time_in = Dates.now(); Pour l'instant on fait betement des packets de 1k lignes, on verra plus tard pour optimiser en fonction des temps de traitement de chaque requete
            context_query.set_limit(1000, xlsx_datas.length);

            let datas = (context_query.fields?.length > 0) ?
                await ModuleContextFilter.getInstance().select_datatable_rows(context_query, columns_by_field_id, fields) :
                await ModuleContextFilter.getInstance().select_vos(context_query);

            let datas_with_vars = await this.convert_varparamfields_to_vardatas(
                context_query,
                datas,
                columns,
                custom_filters);

            if (!datas_with_vars) {
                ConsoleHandler.error('Erreur lors de l\'export:la récupération des vars a échoué');
                await PushDataServerController.getInstance().notifySimpleINFO(target_user_id, null, 'exportation_failed.error_vars_loading.___LABEL___', false, null);
                return;
            }

            let translated_datas = await this.translate_context_query_fields_from_bdd(datas_with_vars, context_query, context_query.fields?.length > 0);

            await this.update_custom_fields(translated_datas, exportable_datatable_custom_field_columns);

            // - Update to columns format (percent, toFixed etc...)
            const this_xlsx_datas = await this.update_to_xlsx_columns_format(translated_datas, columns);
            xlsx_datas.push(...this_xlsx_datas);
        }

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
            const active_filters_sheet = await this.create_active_filters_xlsx_sheet(active_field_filters);
            sheets.push(active_filters_sheet);
        }

        // Sheet for Vars Indicator
        if (export_options?.export_vars_indicator) {

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
        let filepath: string = await this.export_data_to_multi_sheets_xlsx(
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

        let vos = await query(api_type_id).select_vos();
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

        let worksheet_columns = [];
        for (let i in ordered_column_list) {
            worksheet_columns.push({ wch: 25 });
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
     * @param {{ [api_type_id: string]: { [field_id: string]: ContextFilterVO } }} active_field_filters
     * @returns {IExportableSheet}
     */
    private async create_active_filters_xlsx_sheet(
        active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = null,
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
                    { api_type_id: context_filter.vo_type, field_id: context_filter.field_id }
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
     * @param vars_indicator {ExportVarIndicator}
     * @param active_field_filters {{ [api_type_id: string]: { [field_id: string]: ContextFilterVO } }}
     * @param active_api_type_ids {string[]}
     * @param discarded_field_paths {{ [vo_type: string]: { [field_id: string]: boolean } }}
     * @returns {IExportableSheet}
     */
    private async create_vars_indicator_xlsx_sheet(
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
        let has_errors: boolean = false;

        for (let var_name in vars_indicator.varcolumn_conf) {

            const varcolumn_conf = vars_indicator.varcolumn_conf[var_name];

            let this_custom_filters: { [var_param_field_name: string]: ContextFilterVO } = {};
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
                let var_param: VarDataBaseVO = await ModuleVar.getInstance().getVarParamFromContextFilters(
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

                    let var_data = await VarsServerCallBackSubsController.get_var_data(var_param, 'create_vars_indicator_xlsx_sheet: exporting data');
                    let value = var_data ? var_data.value : null;
                    let format: XlsxCellFormatByFilterType = null;

                    if (value != null) {
                        const params = [value].concat(filter_additional_params);

                        if (typeof filter_by_name[varcolumn_conf.filter_type]?.read === 'function') {
                            value = filter_by_name[varcolumn_conf.filter_type].read.apply(null, params);
                            format = varcolumn_conf.filter_type as XlsxCellFormatByFilterType;

                            if (varcolumn_conf.filter_type != 'tstz') {
                                value = (value as any).replace(/\s+/g, '');
                            }
                        }

                        if (
                            varcolumn_conf.filter_type == FilterObj.FILTER_TYPE_percent
                        ) {
                            value = (value as any).replace(/%/g, '');
                            value = parseFloat(value as any) / 100;
                        }

                        if (
                            varcolumn_conf.filter_type == FilterObj.FILTER_TYPE_toFixed ||
                            varcolumn_conf.filter_type == FilterObj.FILTER_TYPE_toFixedCeil ||
                            varcolumn_conf.filter_type == FilterObj.FILTER_TYPE_toFixedFloor
                        ) {
                            value = parseFloat(value as any);
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

        let filepath: string = await this.export_data_to_multi_sheets_xlsx_base(
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

        let filepath: string = await this.export_data_to_multi_sheets_xlsx_base(
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
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(file);
        if (!file.id) {
            ConsoleHandler.error('Erreur lors de l\'enregistrement du fichier en base:' + filepath);
            return null;
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
        let workbook: WorkBook = XLSX.utils.book_new();

        // For each sheet that we want to export
        for (let sheeti in sheets) {
            let sheet = sheets[sheeti];

            let ws_formats: { [cell: string]: string } = {};
            let ws_data = [];
            let ws_row = [];

            // We create the sheet
            const worksheet_columns = [];
            for (let i in sheet.ordered_column_list) {

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

        let filepath: string = (is_secured ? ModuleFile.SECURED_FILES_ROOT : ModuleFile.FILES_ROOT) + filename;
        XLSX.writeFile(workbook, filepath);

        let user_log_id: number = ModuleAccessPolicyServer.getInstance().getLoggedUserId();

        // On log l'export
        if (!!user_log_id) {

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

        const xlsx_datas = cloneDeep(datas);

        for (const field_uid in columns) {
            const column = columns[field_uid];

            let filter_additional_params = null;

            try {
                // JSON parse may throw exeception (case when empty or Non-JSON)
                filter_additional_params = JSON.parse(column.filter_additional_params);
            } catch (e) {

            }

            for (const row_key in xlsx_datas) {
                let row = xlsx_datas[row_key];

                if (row[column.datatable_field_uid] == null) {
                    continue;
                }

                row[column.datatable_field_uid + '__raw'] = row[column.datatable_field_uid];

                let value = row[column.datatable_field_uid] ?? null;
                let format: XlsxCellFormatByFilterType = null;

                row[column.datatable_field_uid] = {
                    format,
                    value,
                };

                if (!(filter_additional_params?.length > 0)) {
                    continue;
                }

                let params = [value].concat(filter_additional_params);

                if (typeof filter_by_name[column.filter_type]?.read === 'function') {
                    value = filter_by_name[column.filter_type].read.apply(null, params);
                    format = column.filter_type as XlsxCellFormatByFilterType;

                    if (column.filter_type != 'tstz') {
                        value = value.replace(/\s+/g, '');
                    }

                    if (
                        column.filter_type == FilterObj.FILTER_TYPE_percent
                    ) {
                        value = (value as any).replace(/%/g, '');
                        value = parseFloat(value as any) / 100;
                    }

                    if (
                        column.filter_type == FilterObj.FILTER_TYPE_toFixed ||
                        column.filter_type == FilterObj.FILTER_TYPE_toFixedCeil ||
                        column.filter_type == FilterObj.FILTER_TYPE_toFixedFloor
                    ) {
                        value = parseFloat(value as any);
                    }
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
    //     varcolumn_conf: { [datatable_field_uid: string]: ExportVarcolumnConf } = null,
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
        let rows: IDistantVOBase[] = cloneDeep(datatable_rows);

        let limit = 500; //Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2));
        let promise_pipeline = new PromisePipeline(limit, 'convert_varparamfields_to_vardatas');
        let debug_uid: number = 0;
        let has_errors: boolean = false;
        let module_var = ModuleVar.getInstance();

        let limit_nb_ts_ranges_on_param_by_context_filter: number = await ModuleVarServer.getInstance().get_limit_nb_ts_ranges_on_param_by_context_filter();

        if (ConfigurationService.node_configuration.DEBUG_convert_varparamfields_to_vardatas) {
            ConsoleHandler.log('convert_varparamfields_to_vardatas:nb rows:' + rows.length);
        }
        for (let j in rows) {
            let row = rows[j];
            let data_n: number = parseInt(j) + 1;

            if (has_errors) {
                break;
            }

            if (ConfigurationService.node_configuration.DEBUG_convert_varparamfields_to_vardatas) {
                ConsoleHandler.log('convert_varparamfields_to_vardatas:row:' + data_n + '/' + rows.length);
            }

            for (let i in columns) {
                let column = columns[i];

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

                debug_uid++;
                await promise_pipeline.push(async () => {

                    /**
                     * On doit récupérer le param en fonction de la ligne et les filtres actifs utilisés pour l'export
                     */
                    let var_param: VarDataBaseVO = module_var.getVarParamFromDataRow(
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

                        let var_data = await VarsServerCallBackSubsController.get_var_data(var_param, 'convert_varparamfields_to_vardatas: exporting data');
                        row[column.datatable_field_uid] = var_data?.value ?? null;
                    } catch (error) {
                        ConsoleHandler.error('convert_varparamfields_to_vardatas:FAILED get_var_data:nb :' + i + ':' + debug_uid + ':' + var_param._bdd_only_index + ':' + error);
                        has_errors = true;
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
    //     varcolumn_conf: { [datatable_field_uid: string]: ExportVarcolumnConf } = null,
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
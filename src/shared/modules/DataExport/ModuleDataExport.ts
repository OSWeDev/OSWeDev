import { field_names } from '../../tools/ObjectHandler';
import ModuleAccessPolicy from '../AccessPolicy/ModuleAccessPolicy';
import UserVO from '../AccessPolicy/vos/UserVO';
import APIControllerWrapper from '../API/APIControllerWrapper';
import APIDefinition from '../API/vos/APIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import ContextFilterVO from '../ContextFilter/vos/ContextFilterVO';
import ContextQueryVO from '../ContextFilter/vos/ContextQueryVO';
import DatatableField from '../DAO/vos/datatable/DatatableField';
import FieldFiltersVO from '../DashboardBuilder/vos/FieldFiltersVO';
import TableColumnDescVO from '../DashboardBuilder/vos/TableColumnDescVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import FileVO from '../File/vos/FileVO';
import Module from '../Module';
import ModuleTableVO from '../DAO/vos/ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import DefaultTranslationVO from '../Translation/vos/DefaultTranslationVO';
import VarConfVO from '../Var/vos/VarConfVO';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import IExportableSheet from './interfaces/IExportableSheet';
import ExportContextQueryToXLSXParamVO, { ExportContextQueryToXLSXParamVOStatic } from './vos/apis/ExportContextQueryToXLSXParamVO';
import ExportDataToMultiSheetsXLSXParamVO from './vos/apis/ExportDataToMultiSheetsXLSXParamVO';
import ExportDataToXLSXParamVO, { ExportDataToXLSXParamVOStatic } from './vos/apis/ExportDataToXLSXParamVO';
import ExportLogVO from './vos/apis/ExportLogVO';
import ExportContextQueryToXLSXQueryVO from './vos/ExportContextQueryToXLSXQueryVO';
import ExportHistoricVO from './vos/ExportHistoricVO';
import ExportVarcolumnConfVO from './vos/ExportVarcolumnConfVO';
import ExportVarIndicatorVO from './vos/ExportVarIndicatorVO';

export default class ModuleDataExport extends Module {

    public static CODE_TEXT_MAIL_SUBJECT_export_dashboard: string = 'mails.export.dashboard.subject';

    public static APINAME_ExportDataToXLSXParamVO: string = 'ExportDataToXLSXParamVO';
    public static APINAME_ExportDataToXLSXParamVOFile: string = 'ExportDataToXLSXParamVOFile';
    public static APINAME_ExportDataToMultiSheetsXLSXParamVO: string = 'ExportDataToMultiSheetsXLSXParamVO';
    public static APINAME_ExportDataToMultiSheetsXLSXParamVOFile: string = 'ExportDataToMultiSheetsXLSXParamVOFile';
    public static APINAME_ExportContextQueryToXLSXParamVO: string = 'ExportContextQueryToXLSXParamVO';

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleDataExport {
        if (!ModuleDataExport.instance) {
            ModuleDataExport.instance = new ModuleDataExport();
        }
        return ModuleDataExport.instance;
    }

    private static instance: ModuleDataExport = null;

    public exportContextQueryToXLSX: (
        filename: string,
        context_query: ContextQueryVO,
        ordered_column_list: string[],
        column_labels: { [field_name: string]: string },
        exportable_datatable_custom_field_columns?: { [datatable_field_uid: string]: string },

        columns?: TableColumnDescVO[],
        fields?: { [datatable_field_uid: string]: DatatableField<any, any> },
        varcolumn_conf?: { [datatable_field_uid: string]: ExportVarcolumnConfVO },
        active_field_filters?: FieldFiltersVO,
        custom_filters?: { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } },
        active_api_type_ids?: string[],
        discarded_field_paths?: { [vo_type: string]: { [field_id: string]: boolean } },

        is_secured?: boolean,
        file_access_policy_name?: string,
        target_user_id?: number,
        do_not_use_filter_by_datatable_field_uid?: { [datatable_field_uid: string]: { [vo_type: string]: { [field_id: string]: boolean } } },

        export_active_field_filters?: boolean,
        export_vars_indicator?: boolean,
        send_email_with_export_notification?: boolean,

        vars_indicator?: ExportVarIndicatorVO,
    ) => Promise<string> = APIControllerWrapper.sah(ModuleDataExport.APINAME_ExportContextQueryToXLSXParamVO);

    public exportDataToXLSX: (
        filename: string,
        datas: any[],
        ordered_column_list: string[],
        column_labels: { [field_name: string]: string },
        api_type_id: string,
        is_secured?: boolean,
        file_access_policy_name?: string
    ) => Promise<string> = APIControllerWrapper.sah(ModuleDataExport.APINAME_ExportDataToXLSXParamVO);

    public exportDataToXLSXFile: (
        filename: string,
        datas: any[],
        ordered_column_list: string[],
        column_labels: { [field_name: string]: string },
        api_type_id: string,
        is_secured?: boolean,
        file_access_policy_name?: string) => Promise<FileVO> = APIControllerWrapper.sah(ModuleDataExport.APINAME_ExportDataToXLSXParamVOFile);

    public exportDataToMultiSheetsXLSX: (
        filename: string,
        sheets: IExportableSheet[],
        api_type_id: string,
        is_secured?: boolean,
        file_access_policy_name?: string) => Promise<string> = APIControllerWrapper.sah(ModuleDataExport.APINAME_ExportDataToMultiSheetsXLSXParamVO);

    public exportDataToMultiSheetsXLSXFile: (
        filename: string,
        sheets: IExportableSheet[],
        api_type_id: string,
        is_secured?: boolean,
        file_access_policy_name?: string) => Promise<FileVO> = APIControllerWrapper.sah(ModuleDataExport.APINAME_ExportDataToMultiSheetsXLSXParamVOFile);

    private constructor() {
        super("data_export", "DataExport");
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.initializeExportLogVO();
        this.initializeExportHistoricVO();

        this.initializeExportVarcolumnConfVO();
        this.initializeExportVarIndicatorVO();
        this.initializeExportContextQueryToXLSXQueryVO();
    }

    public registerApis() {

        APIControllerWrapper.registerApi(new PostAPIDefinition<ExportContextQueryToXLSXParamVO, string>(
            ModuleAccessPolicy.POLICY_FO_ACCESS,
            ModuleDataExport.APINAME_ExportContextQueryToXLSXParamVO,
            [FileVO.API_TYPE_ID],
            ExportContextQueryToXLSXParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<ExportDataToXLSXParamVO, string>(
            ModuleAccessPolicy.POLICY_FO_ACCESS,
            ModuleDataExport.APINAME_ExportDataToXLSXParamVO,
            [FileVO.API_TYPE_ID],
            ExportDataToXLSXParamVOStatic,
            APIDefinition.API_RETURN_TYPE_FILE
        ));
        APIControllerWrapper.registerApi(new PostAPIDefinition<ExportDataToXLSXParamVO, FileVO>(
            ModuleAccessPolicy.POLICY_FO_ACCESS,
            ModuleDataExport.APINAME_ExportDataToXLSXParamVOFile,
            [FileVO.API_TYPE_ID],
            ExportDataToXLSXParamVOStatic
        ));
        APIControllerWrapper.registerApi(new PostAPIDefinition<ExportDataToMultiSheetsXLSXParamVO, string>(
            ModuleAccessPolicy.POLICY_FO_ACCESS,
            ModuleDataExport.APINAME_ExportDataToMultiSheetsXLSXParamVO,
            [FileVO.API_TYPE_ID],
            ExportDataToXLSXParamVOStatic,
            APIDefinition.API_RETURN_TYPE_FILE
        ));
        APIControllerWrapper.registerApi(new PostAPIDefinition<ExportDataToMultiSheetsXLSXParamVO, FileVO>(
            ModuleAccessPolicy.POLICY_FO_ACCESS,
            ModuleDataExport.APINAME_ExportDataToMultiSheetsXLSXParamVOFile,
            [FileVO.API_TYPE_ID],
            ExportDataToXLSXParamVOStatic
        ));
    }

    private initializeExportHistoricVO(): void {
        let export_to_uid = ModuleTableFieldController.create_new(ExportHistoricVO.API_TYPE_ID, field_names<ExportHistoricVO>().export_to_uid, ModuleTableFieldVO.FIELD_TYPE_foreign_key, DefaultTranslationVO.create_new({ 'fr-fr': "Destinataire - Utilisateur" }), false);
        let exported_file_id = ModuleTableFieldController.create_new(ExportHistoricVO.API_TYPE_ID, field_names<ExportHistoricVO>().exported_file_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, DefaultTranslationVO.create_new({ 'fr-fr': "Fichier exporté" }), false).not_add_to_crud();

        let datatable_fields = [
            ModuleTableFieldController.create_new(ExportHistoricVO.API_TYPE_ID, field_names<ExportHistoricVO>().export_type_id, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Type d'export" }), true),
            ModuleTableFieldController.create_new(ExportHistoricVO.API_TYPE_ID, field_names<ExportHistoricVO>().export_is_secured, ModuleTableFieldVO.FIELD_TYPE_boolean, DefaultTranslationVO.create_new({ 'fr-fr': "Fichier sécurisé" }), true, true, false),
            ModuleTableFieldController.create_new(ExportHistoricVO.API_TYPE_ID, field_names<ExportHistoricVO>().export_file_access_policy_name, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Droit d\'accès au fichier" }), false),
            ModuleTableFieldController.create_new(ExportHistoricVO.API_TYPE_ID, field_names<ExportHistoricVO>().export_params_stringified, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Paramètres" }), false),
            ModuleTableFieldController.create_new(ExportHistoricVO.API_TYPE_ID, field_names<ExportHistoricVO>().export_to_mails, ModuleTableFieldVO.FIELD_TYPE_string_array, DefaultTranslationVO.create_new({ 'fr-fr': "Emails destinataires" }), false),
            export_to_uid,
            exported_file_id,
            ModuleTableFieldController.create_new(ExportHistoricVO.API_TYPE_ID, field_names<ExportHistoricVO>().state, ModuleTableFieldVO.FIELD_TYPE_enum, DefaultTranslationVO.create_new({ 'fr-fr': "Status" }), true, true, ExportHistoricVO.EXPORT_STATE_TODO).setEnumValues(ExportHistoricVO.EXPORT_STATE_LABELS),
            ModuleTableFieldController.create_new(ExportHistoricVO.API_TYPE_ID, field_names<ExportHistoricVO>().creation_date, ModuleTableFieldVO.FIELD_TYPE_tstz, DefaultTranslationVO.create_new({ 'fr-fr': "Date de création" }), true).set_segmentation_type(TimeSegment.TYPE_SECOND),
            ModuleTableFieldController.create_new(ExportHistoricVO.API_TYPE_ID, field_names<ExportHistoricVO>().start_date, ModuleTableFieldVO.FIELD_TYPE_tstz, DefaultTranslationVO.create_new({ 'fr-fr': "Date de début" }), false).set_segmentation_type(TimeSegment.TYPE_SECOND),
            ModuleTableFieldController.create_new(ExportHistoricVO.API_TYPE_ID, field_names<ExportHistoricVO>().sent_date, ModuleTableFieldVO.FIELD_TYPE_tstz, DefaultTranslationVO.create_new({ 'fr-fr': "Date d'envoi" }), false).set_segmentation_type(TimeSegment.TYPE_SECOND),
            ModuleTableFieldController.create_new(ExportHistoricVO.API_TYPE_ID, field_names<ExportHistoricVO>().export_date, ModuleTableFieldVO.FIELD_TYPE_tstz, DefaultTranslationVO.create_new({ 'fr-fr': "Date d'export" }), false).set_segmentation_type(TimeSegment.TYPE_SECOND),
        ];

        let moduleTable: ModuleTableVO<ExportHistoricVO> = new ModuleTableVO<ExportHistoricVO>(this, ExportHistoricVO.API_TYPE_ID, () => new ExportHistoricVO(), datatable_fields, null);

        export_to_uid.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
        exported_file_id.set_many_to_one_target_moduletable_name(FileVO.API_TYPE_ID);

        this.datatables.push(moduleTable);
    }

    private initializeExportVarcolumnConfVO() {
        let var_id = ModuleTableFieldController.create_new(ExportVarcolumnConfVO.API_TYPE_ID, field_names<ExportVarcolumnConfVO>().var_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, DefaultTranslationVO.create_new({ 'fr-fr': "Var" }), true);

        let datatable_fields = [
            var_id,
            ModuleTableFieldController.create_new(ExportVarcolumnConfVO.API_TYPE_ID, field_names<ExportVarcolumnConfVO>().custom_field_filters, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "Filtres" }), false),
            ModuleTableFieldController.create_new(ExportVarcolumnConfVO.API_TYPE_ID, field_names<ExportVarcolumnConfVO>().filter_type, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Type de filtre" }), false),
            ModuleTableFieldController.create_new(ExportVarcolumnConfVO.API_TYPE_ID, field_names<ExportVarcolumnConfVO>().filter_additional_params, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Paramètres additionnels" }), false),
        ];
        let moduleTable: ModuleTableVO<ExportVarcolumnConfVO> = new ModuleTableVO<ExportVarcolumnConfVO>(this, ExportVarcolumnConfVO.API_TYPE_ID, () => new ExportVarcolumnConfVO(), datatable_fields, null, 'Conf des vars pour export');

        var_id.set_many_to_one_target_moduletable_name(VarConfVO.API_TYPE_ID);

        this.datatables.push(moduleTable);
    }

    private initializeExportVarIndicatorVO() {
        let datatable_fields = [
            ModuleTableFieldController.create_new(ExportVarIndicatorVO.API_TYPE_ID, field_names<ExportVarIndicatorVO>().ordered_column_list, ModuleTableFieldVO.FIELD_TYPE_string_array, DefaultTranslationVO.create_new({ 'fr-fr': "Colonnes" }), true),
            ModuleTableFieldController.create_new(ExportVarIndicatorVO.API_TYPE_ID, field_names<ExportVarIndicatorVO>().column_labels, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "Libellés colonnes" }), true),
            ModuleTableFieldController.create_new(ExportVarIndicatorVO.API_TYPE_ID, field_names<ExportVarIndicatorVO>().varcolumn_conf, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "Conf des variables" }), true),
        ];
        let moduleTable: ModuleTableVO<ExportVarIndicatorVO> = new ModuleTableVO<ExportVarIndicatorVO>(this, ExportVarIndicatorVO.API_TYPE_ID, () => new ExportVarIndicatorVO(), datatable_fields, null, 'Conf export des KPIs');

        this.datatables.push(moduleTable);
    }

    private initializeExportContextQueryToXLSXQueryVO() {
        let filename = ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().filename, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Nom du fichier" }), true);
        let target_user_id = ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().target_user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, DefaultTranslationVO.create_new({ 'fr-fr': "Utilisateur" }), true);

        let datatable_fields = [
            filename,
            ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().state, ModuleTableFieldVO.FIELD_TYPE_email, DefaultTranslationVO.create_new({ 'fr-fr': "Status" }), true, true, ExportContextQueryToXLSXQueryVO.STATE_TODO).setEnumValues(ExportContextQueryToXLSXQueryVO.STATE_LABELS),
            ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().context_query, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "Requête" }), true),
            ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().ordered_column_list, ModuleTableFieldVO.FIELD_TYPE_string_array, DefaultTranslationVO.create_new({ 'fr-fr': "Colonnes" }), true),
            ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().column_labels, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "Libellés colonnes" }), true),
            ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().exportable_datatable_custom_field_columns, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "Colonnes personnalisées" }), false),
            ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().columns, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "Colonnes" }), false),
            ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().fields, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "Champs" }), false),
            ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().varcolumn_conf, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "Conf des variables" }), false),
            ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().active_field_filters, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "Filtres actifs" }), false),
            ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().custom_filters, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "Filtres personnalisés" }), false),
            ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().active_api_type_ids, ModuleTableFieldVO.FIELD_TYPE_string_array, DefaultTranslationVO.create_new({ 'fr-fr': "API_TYPE_IDs actifs" }), false),
            ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().discarded_field_paths, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "Chemins à ignorer" }), false),
            ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().is_secured, ModuleTableFieldVO.FIELD_TYPE_boolean, DefaultTranslationVO.create_new({ 'fr-fr': "Fichier sécurisé" }), true, true, false),
            ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().file_access_policy_name, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Droit d\'accès au fichier" }), false),
            target_user_id,
            ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().do_not_use_filter_by_datatable_field_uid, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "Filtres à ignorer" }), false),

            ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().export_active_field_filters, ModuleTableFieldVO.FIELD_TYPE_boolean, DefaultTranslationVO.create_new({ 'fr-fr': "Exporter les filtres actifs" }), false),
            ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().export_vars_indicator, ModuleTableFieldVO.FIELD_TYPE_boolean, DefaultTranslationVO.create_new({ 'fr-fr': "Exporter les KPIs" }), false),
            ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().send_email_with_export_notification, ModuleTableFieldVO.FIELD_TYPE_boolean, DefaultTranslationVO.create_new({ 'fr-fr': "Envoyer par mail à un destinataire spécifique" }), false),

            ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().vars_indicator, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "KPIs" }), false),
        ];

        let moduleTable: ModuleTableVO<ExportContextQueryToXLSXQueryVO> = new ModuleTableVO<ExportContextQueryToXLSXQueryVO>(this, ExportContextQueryToXLSXQueryVO.API_TYPE_ID, () => new ExportContextQueryToXLSXQueryVO(), datatable_fields, filename, 'Exports de ContextQuery en XLSX');

        target_user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);

        this.datatables.push(moduleTable);
    }

    private initializeExportLogVO(): void {
        let field_name = ModuleTableFieldController.create_new(ExportLogVO.API_TYPE_ID, field_names<ExportLogVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Nom de l'export" }), true);
        let field_user_id = ModuleTableFieldController.create_new(ExportLogVO.API_TYPE_ID, field_names<ExportLogVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, DefaultTranslationVO.create_new({ 'fr-fr': "Utilisateur" }), true);

        let datatable_fields = [
            field_name,
            ModuleTableFieldController.create_new(ExportLogVO.API_TYPE_ID, field_names<ExportLogVO>().log_time, ModuleTableFieldVO.FIELD_TYPE_tstz, DefaultTranslationVO.create_new({ 'fr-fr': "Date de l'export" })).set_segmentation_type(TimeSegment.TYPE_SECOND),
            field_user_id
        ];

        let moduleTable: ModuleTableVO<ExportLogVO> = new ModuleTableVO<ExportLogVO>(this, ExportLogVO.API_TYPE_ID, () => new ExportLogVO(), datatable_fields, field_name);

        field_user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);

        this.datatables.push(moduleTable);
    }
}
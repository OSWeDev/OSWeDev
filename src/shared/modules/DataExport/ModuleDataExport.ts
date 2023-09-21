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
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import DefaultTranslation from '../Translation/vos/DefaultTranslation';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import IExportableSheet from './interfaces/IExportableSheet';
import IExportOptions from './interfaces/IExportOptions';
import ExportContextQueryToXLSXParamVO, { ExportContextQueryToXLSXParamVOStatic } from './vos/apis/ExportContextQueryToXLSXParamVO';
import ExportDataToMultiSheetsXLSXParamVO from './vos/apis/ExportDataToMultiSheetsXLSXParamVO';
import ExportDataToXLSXParamVO, { ExportDataToXLSXParamVOStatic } from './vos/apis/ExportDataToXLSXParamVO';
import ExportLogVO from './vos/apis/ExportLogVO';
import ExportHistoricVO from './vos/ExportHistoricVO';
import ExportVarcolumnConf from './vos/ExportVarcolumnConf';
import ExportVarIndicator from './vos/ExportVarIndicator';

export default class ModuleDataExport extends Module {

    public static CODE_TEXT_MAIL_SUBJECT_export_dashboard: string = 'mails.export.dashboard.subject';

    public static APINAME_ExportDataToXLSXParamVO: string = 'ExportDataToXLSXParamVO';
    public static APINAME_ExportDataToXLSXParamVOFile: string = 'ExportDataToXLSXParamVOFile';
    public static APINAME_ExportDataToMultiSheetsXLSXParamVO: string = 'ExportDataToMultiSheetsXLSXParamVO';
    public static APINAME_ExportDataToMultiSheetsXLSXParamVOFile: string = 'ExportDataToMultiSheetsXLSXParamVOFile';
    public static APINAME_ExportContextQueryToXLSXParamVO: string = 'ExportContextQueryToXLSXParamVO';

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
        varcolumn_conf?: { [datatable_field_uid: string]: ExportVarcolumnConf },
        active_field_filters?: FieldFiltersVO,
        custom_filters?: { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } },
        active_api_type_ids?: string[],
        discarded_field_paths?: { [vo_type: string]: { [field_id: string]: boolean } },

        is_secured?: boolean,
        file_access_policy_name?: string,
        target_user_id?: number,
        do_not_use_filter_by_datatable_field_uid?: { [datatable_field_uid: string]: { [vo_type: string]: { [field_id: string]: boolean } } },

        export_options?: IExportOptions,

        vars_indicator?: ExportVarIndicator,
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
        this.fields = [];
        this.datatables = [];

        this.initializeExportLogVO();
        this.initializeExportHistoricVO();
    }

    public registerApis() {

        APIControllerWrapper.registerApi(new PostAPIDefinition<ExportContextQueryToXLSXParamVO, string>(
            ModuleAccessPolicy.POLICY_FO_ACCESS,
            ModuleDataExport.APINAME_ExportContextQueryToXLSXParamVO,
            [FileVO.API_TYPE_ID],
            ExportContextQueryToXLSXParamVOStatic,
            APIDefinition.API_RETURN_TYPE_FILE
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
        let export_to_uid = new ModuleTableField('export_to_uid', ModuleTableField.FIELD_TYPE_foreign_key, new DefaultTranslation({ 'fr-fr': "Destinataire - Utilisateur" }), false);
        let exported_file_id = new ModuleTableField('exported_file_id', ModuleTableField.FIELD_TYPE_foreign_key, new DefaultTranslation({ 'fr-fr': "Fichier exporté" }), false).not_add_to_crud();

        let datatable_fields = [
            new ModuleTableField('export_type_id', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ 'fr-fr': "Type d'export" }), true),
            new ModuleTableField('export_is_secured', ModuleTableField.FIELD_TYPE_boolean, new DefaultTranslation({ 'fr-fr': "Fichier sécurisé" }), true, true, false),
            new ModuleTableField('export_file_access_policy_name', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ 'fr-fr': "Droit d\'accès au fichier" }), false),
            new ModuleTableField('export_params_stringified', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ 'fr-fr': "Paramètres" }), false),
            new ModuleTableField('export_to_mails', ModuleTableField.FIELD_TYPE_string_array, new DefaultTranslation({ 'fr-fr': "Emails destinataires" }), false),
            export_to_uid,
            exported_file_id,
            new ModuleTableField('state', ModuleTableField.FIELD_TYPE_enum, new DefaultTranslation({ 'fr-fr': "Status" }), true, true, ExportHistoricVO.EXPORT_STATE_TODO).setEnumValues(ExportHistoricVO.EXPORT_STATE_LABELS),
            new ModuleTableField('creation_date', ModuleTableField.FIELD_TYPE_tstz, new DefaultTranslation({ 'fr-fr': "Date de création" }), true).set_segmentation_type(TimeSegment.TYPE_SECOND),
            new ModuleTableField('start_date', ModuleTableField.FIELD_TYPE_tstz, new DefaultTranslation({ 'fr-fr': "Date de début" }), false).set_segmentation_type(TimeSegment.TYPE_SECOND),
            new ModuleTableField('sent_date', ModuleTableField.FIELD_TYPE_tstz, new DefaultTranslation({ 'fr-fr': "Date d'envoi" }), false).set_segmentation_type(TimeSegment.TYPE_SECOND),
            new ModuleTableField('export_date', ModuleTableField.FIELD_TYPE_tstz, new DefaultTranslation({ 'fr-fr': "Date d'export" }), false).set_segmentation_type(TimeSegment.TYPE_SECOND),
        ];

        let moduleTable: ModuleTable<ExportHistoricVO> = new ModuleTable<ExportHistoricVO>(this, ExportHistoricVO.API_TYPE_ID, () => new ExportHistoricVO(), datatable_fields, null);

        export_to_uid.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
        exported_file_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[FileVO.API_TYPE_ID]);

        this.datatables.push(moduleTable);
    }

    private initializeExportLogVO(): void {
        let field_name = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ 'fr-fr': "Nom de l'export" }), true);
        let field_user_id = new ModuleTableField('user_id', ModuleTableField.FIELD_TYPE_foreign_key, new DefaultTranslation({ 'fr-fr': "Utilisateur" }), true);

        let datatable_fields = [
            field_name,
            new ModuleTableField('log_time', ModuleTableField.FIELD_TYPE_tstz, new DefaultTranslation({ 'fr-fr': "Date de l'export" })).set_segmentation_type(TimeSegment.TYPE_SECOND),
            field_user_id
        ];

        let moduleTable: ModuleTable<ExportLogVO> = new ModuleTable<ExportLogVO>(this, ExportLogVO.API_TYPE_ID, () => new ExportLogVO(), datatable_fields, field_name);

        field_user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);

        this.datatables.push(moduleTable);
    }
}
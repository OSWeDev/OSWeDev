import { field_names, reflect } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import APIDefinition from '../API/vos/APIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import DefaultParamTranslatorVO, { DefaultParamTranslatorVOStatic } from '../API/vos/apis/DefaultParamTranslatorVO';
import ModuleAccessPolicy from '../AccessPolicy/ModuleAccessPolicy';
import UserVO from '../AccessPolicy/vos/UserVO';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import FileVO from '../File/vos/FileVO';
import IDistantVOBase from '../IDistantVOBase';
import Module from '../Module';
import DefaultTranslationVO from '../Translation/vos/DefaultTranslationVO';
import VarConfVO from '../Var/vos/VarConfVO';
import IExportableSheet from './interfaces/IExportableSheet';
import ExportContextQueryToXLSXQueryVO from './vos/ExportContextQueryToXLSXQueryVO';
import ExportHistoricVO from './vos/ExportHistoricVO';
import ExportVOsToJSONConfVO from './vos/ExportVOsToJSONConfVO';
import ExportVOsToJSONHistoricVO from './vos/ExportVOsToJSONHistoricVO';
import ExportVarIndicatorVO from './vos/ExportVarIndicatorVO';
import ExportVarcolumnConfVO from './vos/ExportVarcolumnConfVO';
import ExportedJSONForeignKeyRefVO from './vos/ExportedJSONForeignKeyRefVO';
import ExportDataToMultiSheetsXLSXParamVO from './vos/apis/ExportDataToMultiSheetsXLSXParamVO';
import ExportDataToXLSXParamVO, { ExportDataToXLSXParamVOStatic } from './vos/apis/ExportDataToXLSXParamVO';
import ExportLogVO from './vos/apis/ExportLogVO';

export default class ModuleDataExport extends Module {

    public static CODE_TEXT_MAIL_SUBJECT_export_dashboard: string = 'mails.export.dashboard.subject';

    public static APINAME_ExportDataToXLSXParamVO: string = 'ExportDataToXLSXParamVO';
    public static APINAME_ExportDataToXLSXParamVOFile: string = 'ExportDataToXLSXParamVOFile';
    public static APINAME_ExportDataToMultiSheetsXLSXParamVO: string = 'ExportDataToMultiSheetsXLSXParamVO';
    public static APINAME_ExportDataToMultiSheetsXLSXParamVOFile: string = 'ExportDataToMultiSheetsXLSXParamVOFile';

    private static instance: ModuleDataExport = null;

    // public exportContextQueryToXLSX: (
    //     filename: string,
    //     context_query: ContextQueryVO,
    //     ordered_column_list: string[],
    //     column_labels: { [field_name: string]: string },
    //     exportable_datatable_custom_field_columns: { [datatable_field_uid: string]: string },

    //     columns: TableColumnDescVO[],
    //     fields: { [datatable_field_uid: string]: DatatableField<any, any> },
    //     varcolumn_conf: { [datatable_field_uid: string]: ExportVarcolumnConfVO },
    //     active_field_filters: FieldFiltersVO,
    //     custom_filters: { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } },
    //     active_api_type_ids: string[],
    //     discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } },

    //     is_secured: boolean,
    //     file_access_policy_name: string,
    //     target_user_id: number,
    //     do_not_use_filter_by_datatable_field_uid: { [datatable_field_uid: string]: { [vo_type: string]: { [field_id: string]: boolean } } },

    //     export_active_field_filters: boolean,
    //     export_vars_indicator: boolean,
    //     send_email_with_export_notification: boolean,

    //     // vars_indicator: ExportVarIndicatorVO[],
    //     vars_indicator: ExportVarIndicatorVO,
    // ) => Promise<string> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModuleDataExport>().exportContextQueryToXLSX);

    public exportDataToXLSX: (
        filename: string,
        datas: any[],
        ordered_column_list: string[],
        column_labels: { [field_name: string]: string },
        api_type_id: string,
        is_secured: boolean,
        file_access_policy_name: string
    ) => Promise<string> = APIControllerWrapper.sah(ModuleDataExport.APINAME_ExportDataToXLSXParamVO);

    public exportDataToXLSXFile: (
        filename: string,
        datas: any[],
        ordered_column_list: string[],
        column_labels: { [field_name: string]: string },
        api_type_id: string,
        is_secured: boolean,
        file_access_policy_name: string) => Promise<FileVO> = APIControllerWrapper.sah(ModuleDataExport.APINAME_ExportDataToXLSXParamVOFile);

    public exportDataToMultiSheetsXLSX: (
        filename: string,
        sheets: IExportableSheet[],
        api_type_id: string,
        is_secured: boolean,
        file_access_policy_name: string) => Promise<string> = APIControllerWrapper.sah(ModuleDataExport.APINAME_ExportDataToMultiSheetsXLSXParamVO);

    public exportDataToMultiSheetsXLSXFile: (
        filename: string,
        sheets: IExportableSheet[],
        api_type_id: string,
        is_secured: boolean,
        file_access_policy_name: string) => Promise<FileVO> = APIControllerWrapper.sah(ModuleDataExport.APINAME_ExportDataToMultiSheetsXLSXParamVOFile);

    public export_vos_to_json: (
        vos: IDistantVOBase[],
        export_vos_to_json_conf: ExportVOsToJSONConfVO,
    ) => Promise<ExportVOsToJSONHistoricVO> = APIControllerWrapper.sah_optimizer(this.name, reflect<this>().export_vos_to_json);
    public import_vos_from_json: (
        exported_data_historic: ExportVOsToJSONHistoricVO,
        import_first_elt_to_id: number,
    ) => Promise<IDistantVOBase> = APIControllerWrapper.sah_optimizer(this.name, reflect<this>().import_vos_from_json);

    public export_vos_to_json_historic_vo_label_function: (historic: ExportVOsToJSONHistoricVO) => Promise<string> = APIControllerWrapper.sah_optimizer(this.name, reflect<this>().export_vos_to_json_historic_vo_label_function);


    private constructor() {
        super("data_export", "DataExport");
        this.forceActivationOnInstallation();
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleDataExport {
        if (!ModuleDataExport.instance) {
            ModuleDataExport.instance = new ModuleDataExport();
        }
        return ModuleDataExport.instance;
    }

    public initialize() {
        this.initializeExportLogVO();
        this.initializeExportHistoricVO();

        this.initializeExportVarcolumnConfVO();
        this.initializeExportVarIndicatorVO();
        this.initializeExportContextQueryToXLSXQueryVO();

        this.initialize_ExportVOsToJSONConfVO();
        this.initialize_ExportVOToJSONHistoricVO();
        this.initialize_ExportedJSONForeignKeyRefVO();
    }

    public registerApis() {

        // APIControllerWrapper.registerApi(new PostAPIDefinition<ExportContextQueryToXLSXParamVO, string>(
        //     ModuleAccessPolicy.POLICY_FO_ACCESS,
        //     ModuleDataExport.APINAME_ExportContextQueryToXLSXParamVO,
        //     [FileVO.API_TYPE_ID],
        //     ExportContextQueryToXLSXParamVOStatic
        // ));

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

        APIControllerWrapper.registerApi(PostAPIDefinition.new<DefaultParamTranslatorVO<[vo: IDistantVOBase, export_vo_to_json_conf: ExportVOsToJSONConfVO]>, string>(
            ModuleAccessPolicy.POLICY_FO_ACCESS,
            this.name,
            reflect<this>().export_vos_to_json,
            [ExportVOsToJSONHistoricVO.API_TYPE_ID],
            DefaultParamTranslatorVOStatic
        ));

        APIControllerWrapper.registerApi(PostAPIDefinition.new<DefaultParamTranslatorVO<[exported_data_historic: ExportVOsToJSONHistoricVO, import_first_elt_to_id: number]>, IDistantVOBase>(
            ModuleAccessPolicy.POLICY_FO_ACCESS,
            this.name,
            reflect<this>().import_vos_from_json,
            (value: DefaultParamTranslatorVO<[exported_data_historic: ExportVOsToJSONHistoricVO, import_first_elt_to_id: number]>) =>
                Object.keys(value.params[0].exported_vos_ids_by_api_type_id),
            DefaultParamTranslatorVOStatic
        ));

        APIControllerWrapper.registerApi(PostAPIDefinition.new<ExportVOsToJSONHistoricVO, string>(
            ModuleAccessPolicy.POLICY_FO_ACCESS,
            this.name,
            reflect<this>().export_vos_to_json_historic_vo_label_function,
            null
        ));

    }


    private initialize_ExportedJSONForeignKeyRefVO(): void {
        ModuleTableFieldController.create_new(ExportedJSONForeignKeyRefVO.API_TYPE_ID, field_names<ExportedJSONForeignKeyRefVO>().ref_type, ModuleTableFieldVO.FIELD_TYPE_enum, DefaultTranslationVO.create_new({ 'fr-fr': "Type de référence" }), true, true, ExportedJSONForeignKeyRefVO.REF_TYPE_FULL_VO).setEnumValues(ExportedJSONForeignKeyRefVO.REF_TYPE_LABELS);
        ModuleTableFieldController.create_new(ExportedJSONForeignKeyRefVO.API_TYPE_ID, field_names<ExportedJSONForeignKeyRefVO>().vo_exported_json, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Export JSON du VO" }), false);
        ModuleTableFieldController.create_new(ExportedJSONForeignKeyRefVO.API_TYPE_ID, field_names<ExportedJSONForeignKeyRefVO>().unique_field_name, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Nom du champ unique" }), false);
        ModuleTableFieldController.create_new(ExportedJSONForeignKeyRefVO.API_TYPE_ID, field_names<ExportedJSONForeignKeyRefVO>().unique_field_value_string, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Valeur du champ unique (string)" }), false);
        ModuleTableFieldController.create_new(ExportedJSONForeignKeyRefVO.API_TYPE_ID, field_names<ExportedJSONForeignKeyRefVO>().unique_field_value_number, ModuleTableFieldVO.FIELD_TYPE_float, DefaultTranslationVO.create_new({ 'fr-fr': "Valeur du champ unique (number)" }), false);
        ModuleTableFieldController.create_new(ExportedJSONForeignKeyRefVO.API_TYPE_ID, field_names<ExportedJSONForeignKeyRefVO>().vo_id, ModuleTableFieldVO.FIELD_TYPE_int, DefaultTranslationVO.create_new({ 'fr-fr': "Id du VO" }), false);

        ModuleTableController.create_new(this.name, ExportedJSONForeignKeyRefVO, null, 'Référence de VO dans un export JSON');
    }


    private initialize_ExportVOsToJSONConfVO(): void {
        const name = ModuleTableFieldController.create_new(ExportVOsToJSONConfVO.API_TYPE_ID, field_names<ExportVOsToJSONConfVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Nom de la conf d'export" }), true);
        ModuleTableFieldController.create_new(ExportVOsToJSONConfVO.API_TYPE_ID, field_names<ExportVOsToJSONConfVO>().description, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Description de la conf d'export" }), false);
        ModuleTableFieldController.create_new(ExportVOsToJSONConfVO.API_TYPE_ID, field_names<ExportVOsToJSONConfVO>().unique_fields_to_use_id_ranges, ModuleTableFieldVO.FIELD_TYPE_refrange_array, DefaultTranslationVO.create_new({ 'fr-fr': "Champs uniques à utiliser à la place des ids" }), false)
            .set_many_to_one_target_moduletable_name(ModuleTableFieldVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(ExportVOsToJSONConfVO.API_TYPE_ID, field_names<ExportVOsToJSONConfVO>().ref_fields_to_follow_id_ranges, ModuleTableFieldVO.FIELD_TYPE_refrange_array, DefaultTranslationVO.create_new({ 'fr-fr': "Champs à suivre pour l'export" }), false)
            .set_many_to_one_target_moduletable_name(ModuleTableFieldVO.API_TYPE_ID);

        ModuleTableController.create_new(this.name, ExportVOsToJSONConfVO, name, 'Configuration de l\'export de VO vers JSON');
    }

    private initialize_ExportVOToJSONHistoricVO(): void {
        const label = ModuleTableFieldController.create_new(ExportVOsToJSONHistoricVO.API_TYPE_ID, field_names<ExportVOsToJSONHistoricVO>().label, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Label de l'export" }), true).define_as_custom_computed(this.name, reflect<this>().export_vos_to_json_historic_vo_label_function);
        ModuleTableFieldController.create_new(ExportVOsToJSONConfVO.API_TYPE_ID, field_names<ExportVOsToJSONConfVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Nom de la conf d'export" }), true);
        ModuleTableFieldController.create_new(ExportVOsToJSONConfVO.API_TYPE_ID, field_names<ExportVOsToJSONConfVO>().description, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Description de la conf d'export" }), false);

        ModuleTableFieldController.create_new(ExportVOsToJSONHistoricVO.API_TYPE_ID, field_names<ExportVOsToJSONHistoricVO>().unique_fields_to_use_id_ranges, ModuleTableFieldVO.FIELD_TYPE_refrange_array, DefaultTranslationVO.create_new({ 'fr-fr': "Champs uniques à utiliser à la place des ids" }), false)
            .set_many_to_one_target_moduletable_name(ModuleTableFieldVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(ExportVOsToJSONHistoricVO.API_TYPE_ID, field_names<ExportVOsToJSONHistoricVO>().ref_fields_to_follow_id_ranges, ModuleTableFieldVO.FIELD_TYPE_refrange_array, DefaultTranslationVO.create_new({ 'fr-fr': "Champs à suivre pour l'export" }), false)
            .set_many_to_one_target_moduletable_name(ModuleTableFieldVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(ExportVOsToJSONHistoricVO.API_TYPE_ID, field_names<ExportVOsToJSONHistoricVO>().exported_vos_ids_by_api_type_id, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "ID des VOs exportés par API_TYPE_ID" }), true);

        ModuleTableFieldController.create_new(ExportVOsToJSONHistoricVO.API_TYPE_ID, field_names<ExportVOsToJSONHistoricVO>().export_conf_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, DefaultTranslationVO.create_new({ 'fr-fr': "Conf d'export" }), true)
            .set_many_to_one_target_moduletable_name(ExportVOsToJSONConfVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(ExportVOsToJSONHistoricVO.API_TYPE_ID, field_names<ExportVOsToJSONHistoricVO>().source_app_name, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Application source" }), true);
        ModuleTableFieldController.create_new(ExportVOsToJSONHistoricVO.API_TYPE_ID, field_names<ExportVOsToJSONHistoricVO>().source_app_env, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Environnement source" }), true);
        ModuleTableFieldController.create_new(ExportVOsToJSONHistoricVO.API_TYPE_ID, field_names<ExportVOsToJSONHistoricVO>().source_app_version, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Version source" }), true);
        ModuleTableFieldController.create_new(ExportVOsToJSONHistoricVO.API_TYPE_ID, field_names<ExportVOsToJSONHistoricVO>().export_date, ModuleTableFieldVO.FIELD_TYPE_tstz, DefaultTranslationVO.create_new({ 'fr-fr': "Date de l'export" }), true).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(ExportVOsToJSONHistoricVO.API_TYPE_ID, field_names<ExportVOsToJSONHistoricVO>().export_user_email, ModuleTableFieldVO.FIELD_TYPE_email, DefaultTranslationVO.create_new({ 'fr-fr': "Email de l'utilisateur ayant réalisé l\'export" }), true);
        ModuleTableFieldController.create_new(ExportVOsToJSONHistoricVO.API_TYPE_ID, field_names<ExportVOsToJSONHistoricVO>().export_user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, DefaultTranslationVO.create_new({ 'fr-fr': "Utilisateur ayant réalisé l'export" }), true)
            .set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(ExportVOsToJSONHistoricVO.API_TYPE_ID, field_names<ExportVOsToJSONHistoricVO>().import_date, ModuleTableFieldVO.FIELD_TYPE_tstz, DefaultTranslationVO.create_new({ 'fr-fr': "Date de l'import" }), false).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(ExportVOsToJSONHistoricVO.API_TYPE_ID, field_names<ExportVOsToJSONHistoricVO>().import_user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, DefaultTranslationVO.create_new({ 'fr-fr': "Utilisateur ayant réalisé l'import" }), false)
            .set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(ExportVOsToJSONHistoricVO.API_TYPE_ID, field_names<ExportVOsToJSONHistoricVO>().import_error, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Erreur de l'import" }), false);

        ModuleTableFieldController.create_new(ExportVOsToJSONHistoricVO.API_TYPE_ID, field_names<ExportVOsToJSONHistoricVO>().dest_app_name, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Application cible" }), true);
        ModuleTableFieldController.create_new(ExportVOsToJSONHistoricVO.API_TYPE_ID, field_names<ExportVOsToJSONHistoricVO>().dest_app_env, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Environnement cible" }), true);
        ModuleTableFieldController.create_new(ExportVOsToJSONHistoricVO.API_TYPE_ID, field_names<ExportVOsToJSONHistoricVO>().dest_app_version, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Version cible" }), true);

        ModuleTableFieldController.create_new(ExportVOsToJSONHistoricVO.API_TYPE_ID, field_names<ExportVOsToJSONHistoricVO>().exported_data, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Données exportées" }), true);

        ModuleTableController.create_new(this.name, ExportVOsToJSONConfVO, label, 'Export de VO vers JSON');
    }

    private initializeExportHistoricVO(): void {
        const export_to_uid = ModuleTableFieldController.create_new(ExportHistoricVO.API_TYPE_ID, field_names<ExportHistoricVO>().export_to_uid, ModuleTableFieldVO.FIELD_TYPE_foreign_key, DefaultTranslationVO.create_new({ 'fr-fr': "Destinataire - Utilisateur" }), false);
        const exported_file_id = ModuleTableFieldController.create_new(ExportHistoricVO.API_TYPE_ID, field_names<ExportHistoricVO>().exported_file_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, DefaultTranslationVO.create_new({ 'fr-fr': "Fichier exporté" }), false).not_add_to_crud();

        const datatable_fields = [
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

        const moduleTable = ModuleTableController.create_new(this.name, ExportHistoricVO, null);

        export_to_uid.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
        exported_file_id.set_many_to_one_target_moduletable_name(FileVO.API_TYPE_ID);
    }

    private initializeExportVarcolumnConfVO() {
        const var_id = ModuleTableFieldController.create_new(ExportVarcolumnConfVO.API_TYPE_ID, field_names<ExportVarcolumnConfVO>().var_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, DefaultTranslationVO.create_new({ 'fr-fr': "Var" }), true);

        const datatable_fields = [
            var_id,
            ModuleTableFieldController.create_new(ExportVarcolumnConfVO.API_TYPE_ID, field_names<ExportVarcolumnConfVO>().custom_field_filters, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "Filtres" }), false),
            ModuleTableFieldController.create_new(ExportVarcolumnConfVO.API_TYPE_ID, field_names<ExportVarcolumnConfVO>().filter_type, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Type de filtre" }), false),
            ModuleTableFieldController.create_new(ExportVarcolumnConfVO.API_TYPE_ID, field_names<ExportVarcolumnConfVO>().filter_additional_params, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Paramètres additionnels" }), false),
        ];
        const moduleTable = ModuleTableController.create_new(this.name, ExportVarcolumnConfVO, null, 'Conf des vars pour export');

        var_id.set_many_to_one_target_moduletable_name(VarConfVO.API_TYPE_ID);
    }

    private initializeExportVarIndicatorVO() {
        const datatable_fields = [
            ModuleTableFieldController.create_new(ExportVarIndicatorVO.API_TYPE_ID, field_names<ExportVarIndicatorVO>().ordered_column_list, ModuleTableFieldVO.FIELD_TYPE_string_array, DefaultTranslationVO.create_new({ 'fr-fr': "Colonnes" }), true),
            ModuleTableFieldController.create_new(ExportVarIndicatorVO.API_TYPE_ID, field_names<ExportVarIndicatorVO>().column_labels, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "Libellés colonnes" }), true),
            ModuleTableFieldController.create_new(ExportVarIndicatorVO.API_TYPE_ID, field_names<ExportVarIndicatorVO>().varcolumn_conf, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "Conf des variables" }), true),
        ];
        const moduleTable = ModuleTableController.create_new(this.name, ExportVarIndicatorVO, null, 'Conf export des KPIs');
    }

    private initializeExportContextQueryToXLSXQueryVO() {
        const filename = ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().filename, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Nom du fichier" }), true);
        ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().target_user_id_ranges, ModuleTableFieldVO.FIELD_TYPE_refrange_array, DefaultTranslationVO.create_new({ 'fr-fr': "Destinataires" }), false)
            .set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().state, ModuleTableFieldVO.FIELD_TYPE_email, DefaultTranslationVO.create_new({ 'fr-fr': "Status" }), true, true, ExportContextQueryToXLSXQueryVO.STATE_TODO).setEnumValues(ExportContextQueryToXLSXQueryVO.STATE_LABELS);
        ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().context_query, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "Requête" }), true);
        ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().ordered_column_list, ModuleTableFieldVO.FIELD_TYPE_string_array, DefaultTranslationVO.create_new({ 'fr-fr': "Colonnes" }), true);
        ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().column_labels, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "Libellés colonnes" }), true);
        ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().exportable_datatable_custom_field_columns, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "Colonnes personnalisées" }), false);
        ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().columns, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "Colonnes" }), false);
        ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().fields, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "Champs" }), false);
        ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().varcolumn_conf, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "Conf des variables" }), false);
        ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().active_field_filters, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "Filtres actifs" }), false);
        ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().custom_filters, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "Filtres personnalisés" }), false);
        ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().active_api_type_ids, ModuleTableFieldVO.FIELD_TYPE_string_array, DefaultTranslationVO.create_new({ 'fr-fr': "API_TYPE_IDs actifs" }), false);
        ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().discarded_field_paths, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "Chemins à ignorer" }), false);
        ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().is_secured, ModuleTableFieldVO.FIELD_TYPE_boolean, DefaultTranslationVO.create_new({ 'fr-fr': "Fichier sécurisé" }), true, true, false);
        ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().file_access_policy_name, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Droit d\'accès au fichier" }), false);
        ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().do_not_use_filter_by_datatable_field_uid, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "Filtres à ignorer" }), false);
        ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().export_active_field_filters, ModuleTableFieldVO.FIELD_TYPE_boolean, DefaultTranslationVO.create_new({ 'fr-fr': "Exporter les filtres actifs" }), false);
        ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().active_field_filters_column_labels, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "Libellés des filtres actifs" }), false);
        ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().export_vars_indicator, ModuleTableFieldVO.FIELD_TYPE_boolean, DefaultTranslationVO.create_new({ 'fr-fr': "Exporter les KPIs" }), false);
        ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().send_email_with_export_notification, ModuleTableFieldVO.FIELD_TYPE_boolean, DefaultTranslationVO.create_new({ 'fr-fr': "Envoyer par mail à un destinataire spécifique" }), false);
        ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().vars_indicator, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, DefaultTranslationVO.create_new({ 'fr-fr': "KPIs" }), false);

        ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().creation_date, ModuleTableFieldVO.FIELD_TYPE_tstz, DefaultTranslationVO.create_new({ 'fr-fr': "Date de création" }), false).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().start_date, ModuleTableFieldVO.FIELD_TYPE_tstz, DefaultTranslationVO.create_new({ 'fr-fr': "Date de début" }), false).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(ExportContextQueryToXLSXQueryVO.API_TYPE_ID, field_names<ExportContextQueryToXLSXQueryVO>().end_date, ModuleTableFieldVO.FIELD_TYPE_tstz, DefaultTranslationVO.create_new({ 'fr-fr': "Date d'envoi" }), false).set_segmentation_type(TimeSegment.TYPE_SECOND);

        ModuleTableController.create_new(this.name, ExportContextQueryToXLSXQueryVO, filename, 'Exports de ContextQuery en XLSX');


    }

    private initializeExportLogVO(): void {
        const field_name = ModuleTableFieldController.create_new(ExportLogVO.API_TYPE_ID, field_names<ExportLogVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': "Nom de l'export" }), true);
        const field_user_id = ModuleTableFieldController.create_new(ExportLogVO.API_TYPE_ID, field_names<ExportLogVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, DefaultTranslationVO.create_new({ 'fr-fr': "Utilisateur" }), true);

        const datatable_fields = [
            field_name,
            ModuleTableFieldController.create_new(ExportLogVO.API_TYPE_ID, field_names<ExportLogVO>().log_time, ModuleTableFieldVO.FIELD_TYPE_tstz, DefaultTranslationVO.create_new({ 'fr-fr': "Date de l'export" })).set_segmentation_type(TimeSegment.TYPE_SECOND),
            field_user_id
        ];

        const moduleTable = ModuleTableController.create_new(this.name, ExportLogVO, field_name);

        field_user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
    }
}
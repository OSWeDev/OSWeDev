import AccessPolicyTools from '../../tools/AccessPolicyTools';
import UserVO from '../AccessPolicy/vos/UserVO';
import CacheInvalidationRulesVO from '../AjaxCache/vos/CacheInvalidationRulesVO';
import ModuleAPI from '../API/ModuleAPI';
import NumberParamVO, { NumberParamVOStatic } from '../API/vos/apis/NumberParamVO';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import ModuleDAO from '../DAO/ModuleDAO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import FileVO from '../File/vos/FileVO';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import ModuleVO from '../ModuleVO';
import DefaultTranslation from '../Translation/vos/DefaultTranslation';
import VOsTypesManager from '../VOsTypesManager';
import DataImportColumnVO from './vos/DataImportColumnVO';
import DataImportFormatVO from './vos/DataImportFormatVO';
import DataImportHistoricVO from './vos/DataImportHistoricVO';
import DataImportLogVO from './vos/DataImportLogVO';

export default class ModuleDataImport extends Module {

    public static MODULE_NAME: string = 'DataImport';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleDataImport.MODULE_NAME;
    public static POLICY_LOGS_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleDataImport.MODULE_NAME + '.LOGS_ACCESS';
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleDataImport.MODULE_NAME + '.BO_ACCESS';
    public static POLICY_BO_FULL_MENU_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleDataImport.MODULE_NAME + '.BO_FULL_MENU_ACCESS';

    public static IMPORT_SCHEMA: string = 'imports';

    public static APINAME_reimportdih: string = 'reimportdih';
    public static APINAME_getDataImportHistorics: string = 'getDataImportHistorics';
    public static APINAME_getDataImportHistoric: string = 'getDataImportHistoric';
    public static APINAME_getDataImportLogs: string = 'getDataImportLogs';
    public static APINAME_getDataImportFiles: string = 'getDataImportFiles';
    public static APINAME_getDataImportFile: string = 'getDataImportFile';
    public static APINAME_getDataImportColumnsFromFormatId: string = 'getDataImportColumnsFromFormatId';

    public static IMPORTATION_STATE_NAMES: string[] = [
        "import.state.uploaded",
        "import.state.formatting",
        "import.state.formatted",
        "import.state.ready_to_import",
        "import.state.importing",
        "import.state.imported",
        "import.state.posttreating",
        "import.state.posttreated",
        "import.state.importation_not_allowed",
        "import.state.failed_importation",
        "import.state.failed_posttreatment",
        "import.state.needs_reimport"];
    public static IMPORTATION_STATE_UPLOADED: number = 0;
    public static IMPORTATION_STATE_FORMATTING: number = 1;
    public static IMPORTATION_STATE_FORMATTED: number = 2;
    public static IMPORTATION_STATE_READY_TO_IMPORT: number = 3;
    public static IMPORTATION_STATE_IMPORTING: number = 4;
    public static IMPORTATION_STATE_IMPORTED: number = 5;
    public static IMPORTATION_STATE_POSTTREATING: number = 6;
    public static IMPORTATION_STATE_POSTTREATED: number = 7;
    public static IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED: number = 8;
    public static IMPORTATION_STATE_FAILED_IMPORTATION: number = 9;
    public static IMPORTATION_STATE_FAILED_POSTTREATMENT: number = 10;
    public static IMPORTATION_STATE_NEEDS_REIMPORT: number = 11;


    public static IMPORT_TABLE_PREFIX: string = '_i_';

    public static getInstance(): ModuleDataImport {
        if (!ModuleDataImport.instance) {
            ModuleDataImport.instance = new ModuleDataImport();
        }
        return ModuleDataImport.instance;
    }

    private static instance: ModuleDataImport = null;

    public reimportdih: (dih: DataImportHistoricVO) => Promise<void> = ModuleAPI.sah(ModuleDataImport.APINAME_reimportdih);
    public getDataImportHistorics: (data_import_format_id: number) => Promise<DataImportHistoricVO[]> = ModuleAPI.sah(ModuleDataImport.APINAME_getDataImportHistorics);
    public getDataImportHistoric: (historic_id: number) => Promise<DataImportHistoricVO> = ModuleAPI.sah(ModuleDataImport.APINAME_getDataImportHistoric);
    public getDataImportLogs: (data_import_format_id: number) => Promise<DataImportLogVO[]> = ModuleAPI.sah(ModuleDataImport.APINAME_getDataImportLogs);
    public getDataImportFiles: () => Promise<DataImportFormatVO[]> = ModuleAPI.sah(ModuleDataImport.APINAME_getDataImportFiles);
    public getDataImportFile: (import_uid: string) => Promise<DataImportFormatVO> = ModuleAPI.sah(ModuleDataImport.APINAME_getDataImportFile);
    public getDataImportColumnsFromFormatId: (data_import_format_id: number) => Promise<DataImportColumnVO[]> = ModuleAPI.sah(ModuleDataImport.APINAME_getDataImportColumnsFromFormatId);

    private constructor() {

        super("data_import", ModuleDataImport.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<DataImportHistoricVO, void>(
            ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, DataImportHistoricVO.API_TYPE_ID),
            ModuleDataImport.APINAME_reimportdih,
            [DataImportHistoricVO.API_TYPE_ID]
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<NumberParamVO, DataImportHistoricVO[]>(
            ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, DataImportHistoricVO.API_TYPE_ID),
            ModuleDataImport.APINAME_getDataImportHistorics,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            NumberParamVOStatic
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<NumberParamVO, DataImportHistoricVO>(
            ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, DataImportHistoricVO.API_TYPE_ID),
            ModuleDataImport.APINAME_getDataImportHistoric,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            NumberParamVOStatic
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<NumberParamVO, DataImportLogVO[]>(
            ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, DataImportLogVO.API_TYPE_ID),
            ModuleDataImport.APINAME_getDataImportLogs,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            NumberParamVOStatic
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<void, DataImportFormatVO[]>(
            ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, DataImportFormatVO.API_TYPE_ID),
            ModuleDataImport.APINAME_getDataImportFiles,
            [DataImportFormatVO.API_TYPE_ID]
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<StringParamVO, DataImportFormatVO>(
            ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, DataImportFormatVO.API_TYPE_ID),
            ModuleDataImport.APINAME_getDataImportFile,
            [DataImportFormatVO.API_TYPE_ID],
            StringParamVOStatic
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<NumberParamVO, DataImportColumnVO[]>(
            ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, DataImportColumnVO.API_TYPE_ID),
            ModuleDataImport.APINAME_getDataImportColumnsFromFormatId,
            [DataImportColumnVO.API_TYPE_ID],
            NumberParamVOStatic
        ));
    }

    public getTableSuffix(dataImportFile: DataImportFormatVO): string {

        return dataImportFile.import_uid.replace(/[^a-zA-Z_]/g, '_');
    }

    public registerImportableModuleTable(targetModuleTable: ModuleTable<any>) {

        targetModuleTable.defineAsImportable();

        // On crée le moduletable adapté, et on stocke l'info de l'existence de ce type importable
        let fields: Array<ModuleTableField<any>> = [];

        for (let i in targetModuleTable.get_fields()) {
            let vofield = targetModuleTable.get_fields()[i];

            fields.push(Object.assign(new ModuleTableField<any>(vofield.field_id, vofield.field_type, vofield.field_label, vofield.field_required, vofield.has_default, vofield.field_default), vofield));
        }

        let field_historic_id = new ModuleTableField<any>("historic_id", ModuleTableField.FIELD_TYPE_foreign_key, "Historique", false);
        fields.unshift(new ModuleTableField<any>("not_validated_msg", ModuleTableField.FIELD_TYPE_string, "Msg validation", false));
        fields.unshift(new ModuleTableField<any>("imported_line_number", ModuleTableField.FIELD_TYPE_int, "N° de la ligne", false));
        fields.unshift(new ModuleTableField<any>("importation_state", ModuleTableField.FIELD_TYPE_enum, "Status", true, true, 0).setEnumValues({
            [ModuleDataImport.IMPORTATION_STATE_UPLOADED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_UPLOADED],
            [ModuleDataImport.IMPORTATION_STATE_FORMATTING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FORMATTING],
            [ModuleDataImport.IMPORTATION_STATE_FORMATTED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FORMATTED],
            [ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT],
            [ModuleDataImport.IMPORTATION_STATE_IMPORTING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTING],
            [ModuleDataImport.IMPORTATION_STATE_IMPORTED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTED],
            [ModuleDataImport.IMPORTATION_STATE_POSTTREATING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_POSTTREATING],
            [ModuleDataImport.IMPORTATION_STATE_POSTTREATED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_POSTTREATED],
            [ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED],
            [ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION],
            [ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT],
            [ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT],
        }));
        fields.push(new ModuleTableField<any>("creation_date", ModuleTableField.FIELD_TYPE_tstz, "Date de création", false));
        fields.push(new ModuleTableField<any>("not_imported_msg", ModuleTableField.FIELD_TYPE_string, "Msg import", false));
        fields.push(new ModuleTableField<any>("not_posttreated_msg", ModuleTableField.FIELD_TYPE_string, "Msg post-traitement", false));
        fields.unshift(field_historic_id);
        let importTable: ModuleTable<any> = new ModuleTable<any>(
            targetModuleTable.module, ModuleDataImport.IMPORT_TABLE_PREFIX + targetModuleTable.vo_type,
            () => ({} as any), fields, null, "Import " + targetModuleTable.name);
        importTable.set_bdd_ref(ModuleDataImport.IMPORT_SCHEMA, ModuleDataImport.IMPORT_TABLE_PREFIX + targetModuleTable.vo_type);
        field_historic_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[DataImportHistoricVO.API_TYPE_ID]);
        targetModuleTable.module.datatables.push(importTable);
        targetModuleTable.importable = true;
    }

    public getRawImportedDatasAPI_Type_Id(target_vo_api_type_id: string): string {
        return ModuleDataImport.IMPORT_TABLE_PREFIX + target_vo_api_type_id;
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        // Création de la table dataimportfile
        let field_file_id: ModuleTableField<number> = new ModuleTableField('file_id', ModuleTableField.FIELD_TYPE_file_ref, 'Fichier importé', false);
        let field_post_exec_module_id: ModuleTableField<number> = new ModuleTableField('post_exec_module_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Module de post-traitement', false);
        let label_field = new ModuleTableField('import_uid', ModuleTableField.FIELD_TYPE_string, 'Nom du fichier d\'import', true);
        let datatable_fields = [
            field_file_id,
            label_field,
            new ModuleTableField('type', ModuleTableField.FIELD_TYPE_enum, 'Type d\'import (XLS, XLSX, CSV)', true).setEnumValues({
                [DataImportFormatVO.TYPE_XLS]: DataImportFormatVO.TYPE_LABELS[DataImportFormatVO.TYPE_XLS],
                [DataImportFormatVO.TYPE_XLSX]: DataImportFormatVO.TYPE_LABELS[DataImportFormatVO.TYPE_XLSX],
                [DataImportFormatVO.TYPE_CSV]: DataImportFormatVO.TYPE_LABELS[DataImportFormatVO.TYPE_CSV]
            }),
            new ModuleTableField('encoding', ModuleTableField.FIELD_TYPE_enum, 'Encodage', false).setEnumValues({
                [DataImportFormatVO.TYPE_UTF8]: DataImportFormatVO.TYPE_ENCODING_LABELS[DataImportFormatVO.TYPE_UTF8],
                [DataImportFormatVO.TYPE_WINDOWS1252]: DataImportFormatVO.TYPE_ENCODING_LABELS[DataImportFormatVO.TYPE_WINDOWS1252],
            }),
            new ModuleTableField('sheet_name', ModuleTableField.FIELD_TYPE_string, 'Nom de l\'onglet (XLS, XLSX)', false, true, ""),
            new ModuleTableField('sheet_index', ModuleTableField.FIELD_TYPE_int, 'Index de l\'onglet (XLS, XLSX) si nom indisponible', false, true, 0),
            new ModuleTableField('first_row_index', ModuleTableField.FIELD_TYPE_int, 'Index de la première ligne (1ère ligne = 0)', true),
            new ModuleTableField('api_type_id', ModuleTableField.FIELD_TYPE_string, 'API_TYPE_ID associé', true),
            new ModuleTableField('copy_folder', ModuleTableField.FIELD_TYPE_string, 'Répertoire d\'archivage', true),
            new ModuleTableField('type_sheet_position', ModuleTableField.FIELD_TYPE_enum, 'Type de positionnement de l\'onglet', true, true, DataImportFormatVO.TYPE_SHEET_POSITION_INDEX).setEnumValues({
                [DataImportFormatVO.TYPE_SHEET_POSITION_LABEL]: DataImportFormatVO.TYPE_SHEET_POSITION_LABELS[DataImportFormatVO.TYPE_SHEET_POSITION_LABEL],
                [DataImportFormatVO.TYPE_SHEET_POSITION_INDEX]: DataImportFormatVO.TYPE_SHEET_POSITION_LABELS[DataImportFormatVO.TYPE_SHEET_POSITION_INDEX],
                [DataImportFormatVO.TYPE_SHEET_POSITION_SCAN]: DataImportFormatVO.TYPE_SHEET_POSITION_LABELS[DataImportFormatVO.TYPE_SHEET_POSITION_SCAN]
            }),
            new ModuleTableField('type_column_position', ModuleTableField.FIELD_TYPE_enum, 'Type de positionnement des colonnes', true, true, DataImportFormatVO.TYPE_COLUMN_POSITION_INDEX).setEnumValues({
                [DataImportFormatVO.TYPE_COLUMN_POSITION_LABEL]: DataImportFormatVO.TYPE_COLUMN_POSITION_LABELS[DataImportFormatVO.TYPE_COLUMN_POSITION_LABEL],
                [DataImportFormatVO.TYPE_COLUMN_POSITION_INDEX]: DataImportFormatVO.TYPE_COLUMN_POSITION_LABELS[DataImportFormatVO.TYPE_COLUMN_POSITION_INDEX]
            }),
            new ModuleTableField('column_labels_row_index', ModuleTableField.FIELD_TYPE_int, 'Index de la ligne des titres de colonne (1ère ligne = 0)', false),

            field_post_exec_module_id
        ];
        let datatable_desc = new ModuleTable(this, DataImportFormatVO.API_TYPE_ID, () => new DataImportFormatVO(), datatable_fields, label_field, "Fichiers d'import");
        field_file_id.donotCascadeOnDelete();
        field_file_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[FileVO.API_TYPE_ID]);
        field_post_exec_module_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[ModuleVO.API_TYPE_ID]);
        this.datatables.push(datatable_desc);

        // Création de la table dataimportcolumn
        label_field = new ModuleTableField('title', ModuleTableField.FIELD_TYPE_string, 'Nom de la colonne (Fichier)', true);
        let field_data_import_format_id: ModuleTableField<number> = new ModuleTableField('data_import_format_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Format d\'import', true, true, 0);
        datatable_fields = [
            field_data_import_format_id,
            new ModuleTableField('column_index', ModuleTableField.FIELD_TYPE_int, 'Index de la colonne (1ère colonne = 0)', false),
            label_field,
            new ModuleTableField('type', ModuleTableField.FIELD_TYPE_string, 'Type de donnée', true),
            new ModuleTableField('mandatory', ModuleTableField.FIELD_TYPE_boolean, 'Obligatoire', true, true, false),
            new ModuleTableField('vo_field_name', ModuleTableField.FIELD_TYPE_string, 'Nom de la colonne (Vo)', true),
            new ModuleTableField('other_column_labels', ModuleTableField.FIELD_TYPE_string_array, 'Autres noms possibles (Fichier)', true, true, "{}")
        ];
        let dt2 = new ModuleTable(this, DataImportColumnVO.API_TYPE_ID, () => new DataImportColumnVO(), datatable_fields, label_field, "Colonnes importées");
        field_data_import_format_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[DataImportFormatVO.API_TYPE_ID]);
        this.datatables.push(dt2);

        label_field = new ModuleTableField('historic_uid', ModuleTableField.FIELD_TYPE_string, 'ID unique', false);
        field_data_import_format_id = new ModuleTableField('data_import_format_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Format d\'import', false);
        let field_user_id = new ModuleTableField('user_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Auteur', false);
        field_file_id = new ModuleTableField('file_id', ModuleTableField.FIELD_TYPE_file_ref, 'Fichier importé', false);
        let reimport_of_dih_id = new ModuleTableField('reimport_of_dih_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Réimport de ...', false);
        datatable_fields = [
            field_data_import_format_id,
            field_file_id,
            field_user_id,
            new ModuleTableField('state', ModuleTableField.FIELD_TYPE_enum, 'Etat de l\'import', true).setEnumValues({
                [ModuleDataImport.IMPORTATION_STATE_UPLOADED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_UPLOADED],
                [ModuleDataImport.IMPORTATION_STATE_FORMATTING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FORMATTING],
                [ModuleDataImport.IMPORTATION_STATE_FORMATTED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FORMATTED],
                [ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT],
                [ModuleDataImport.IMPORTATION_STATE_IMPORTING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTING],
                [ModuleDataImport.IMPORTATION_STATE_IMPORTED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTED],
                [ModuleDataImport.IMPORTATION_STATE_POSTTREATING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_POSTTREATING],
                [ModuleDataImport.IMPORTATION_STATE_POSTTREATED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_POSTTREATED],
                [ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED],
                [ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION],
                [ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT],
                [ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT]
            }),
            reimport_of_dih_id,
            new ModuleTableField('status_before_reimport', ModuleTableField.FIELD_TYPE_enum, 'Sauvegarde de l\'état pour réimport', false).setEnumValues({
                [ModuleDataImport.IMPORTATION_STATE_UPLOADED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_UPLOADED],
                [ModuleDataImport.IMPORTATION_STATE_FORMATTING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FORMATTING],
                [ModuleDataImport.IMPORTATION_STATE_FORMATTED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FORMATTED],
                [ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT],
                [ModuleDataImport.IMPORTATION_STATE_IMPORTING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTING],
                [ModuleDataImport.IMPORTATION_STATE_IMPORTED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTED],
                [ModuleDataImport.IMPORTATION_STATE_POSTTREATING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_POSTTREATING],
                [ModuleDataImport.IMPORTATION_STATE_POSTTREATED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_POSTTREATED],
                [ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED],
                [ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION],
                [ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT],
                [ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT]
            }),
            new ModuleTableField('status_of_last_reimport', ModuleTableField.FIELD_TYPE_enum, 'Etat du réimport le plus récent', false).setEnumValues({
                [ModuleDataImport.IMPORTATION_STATE_UPLOADED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_UPLOADED],
                [ModuleDataImport.IMPORTATION_STATE_FORMATTING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FORMATTING],
                [ModuleDataImport.IMPORTATION_STATE_FORMATTED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FORMATTED],
                [ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT],
                [ModuleDataImport.IMPORTATION_STATE_IMPORTING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTING],
                [ModuleDataImport.IMPORTATION_STATE_IMPORTED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTED],
                [ModuleDataImport.IMPORTATION_STATE_POSTTREATING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_POSTTREATING],
                [ModuleDataImport.IMPORTATION_STATE_POSTTREATED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_POSTTREATED],
                [ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED],
                [ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION],
                [ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT],
                [ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT]
            }),

            label_field,
            new ModuleTableField('start_date', ModuleTableField.FIELD_TYPE_tstz, 'Date de démarrage', false),
            new ModuleTableField('segment_date_index', ModuleTableField.FIELD_TYPE_string, 'Segment cible', false),
            new ModuleTableField('segment_type', ModuleTableField.FIELD_TYPE_enum, 'Type de segment', false).setEnumValues({
                [TimeSegment.TYPE_YEAR]: TimeSegment.TYPE_NAMES[TimeSegment.TYPE_YEAR],
                [TimeSegment.TYPE_MONTH]: TimeSegment.TYPE_NAMES[TimeSegment.TYPE_MONTH],
                [TimeSegment.TYPE_DAY]: TimeSegment.TYPE_NAMES[TimeSegment.TYPE_DAY],
                [TimeSegment.TYPE_WEEK]: TimeSegment.TYPE_NAMES[TimeSegment.TYPE_WEEK],
                [TimeSegment.TYPE_ROLLING_YEAR_MONTH_START]: TimeSegment.TYPE_NAMES[TimeSegment.TYPE_ROLLING_YEAR_MONTH_START],
            }),
            new ModuleTableField('last_up_date', ModuleTableField.FIELD_TYPE_tstz, 'Modification', false),
            new ModuleTableField('end_date', ModuleTableField.FIELD_TYPE_tstz, 'Date de fin', false),
            new ModuleTableField('params', ModuleTableField.FIELD_TYPE_string, 'Paramètres', false),
            new ModuleTableField('api_type_id', ModuleTableField.FIELD_TYPE_string, 'Vo importé', false),
            new ModuleTableField('import_type', ModuleTableField.FIELD_TYPE_enum, 'Type d\'import', true).setEnumValues({
                [DataImportHistoricVO.IMPORT_TYPE_EDIT]: DataImportHistoricVO.IMPORT_TYPE_NAMES[DataImportHistoricVO.IMPORT_TYPE_EDIT],
                [DataImportHistoricVO.IMPORT_TYPE_REPLACE]: DataImportHistoricVO.IMPORT_TYPE_NAMES[DataImportHistoricVO.IMPORT_TYPE_REPLACE],
            }),
            new ModuleTableField('nb_row_validated', ModuleTableField.FIELD_TYPE_int, new DefaultTranslation({
                fr: 'Nb. de lignes validées'
            }), false),
            new ModuleTableField('nb_row_unvalidated', ModuleTableField.FIELD_TYPE_int, 'Nb. de lignes invalidées', false),
            new ModuleTableField('autovalidate', ModuleTableField.FIELD_TYPE_boolean, 'Validation automatique', false, true, false),
        ];
        let datatable_historic = new ModuleTable(this, DataImportHistoricVO.API_TYPE_ID, () => new DataImportHistoricVO(), datatable_fields, label_field, "Historiques d'importation").hideAnyToManyByDefault();
        field_data_import_format_id.addManyToOneRelation(datatable_desc);
        field_user_id.donotCascadeOnDelete();
        field_user_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);
        reimport_of_dih_id.addManyToOneRelation(datatable_historic);
        field_file_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[FileVO.API_TYPE_ID]);
        this.datatables.push(datatable_historic);


        label_field = new ModuleTableField('date', ModuleTableField.FIELD_TYPE_tstz, 'Date', false);
        field_data_import_format_id = new ModuleTableField('data_import_format_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Format d\'import', false);
        let field_data_import_historic_id = new ModuleTableField('data_import_historic_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Historique', false);
        datatable_fields = [
            field_data_import_format_id,
            field_data_import_historic_id,
            label_field,
            new ModuleTableField('api_type_id', ModuleTableField.FIELD_TYPE_string, 'VO cible', false),
            new ModuleTableField('code_text', ModuleTableField.FIELD_TYPE_string, 'Message (traduit)', false),
            new ModuleTableField('message', ModuleTableField.FIELD_TYPE_string, 'Message (statique)', false),
            new ModuleTableField('log_level', ModuleTableField.FIELD_TYPE_enum, 'Type', true, true, DataImportLogVO.LOG_LEVEL_INFO).setEnumValues({
                [DataImportLogVO.LOG_LEVEL_DEBUG]: DataImportLogVO.LOG_LEVEL_LABELS[DataImportLogVO.LOG_LEVEL_DEBUG],
                [DataImportLogVO.LOG_LEVEL_INFO]: DataImportLogVO.LOG_LEVEL_LABELS[DataImportLogVO.LOG_LEVEL_INFO],
                [DataImportLogVO.LOG_LEVEL_SUCCESS]: DataImportLogVO.LOG_LEVEL_LABELS[DataImportLogVO.LOG_LEVEL_SUCCESS],
                [DataImportLogVO.LOG_LEVEL_WARN]: DataImportLogVO.LOG_LEVEL_LABELS[DataImportLogVO.LOG_LEVEL_WARN],
                [DataImportLogVO.LOG_LEVEL_ERROR]: DataImportLogVO.LOG_LEVEL_LABELS[DataImportLogVO.LOG_LEVEL_ERROR],
                [DataImportLogVO.LOG_LEVEL_FATAL]: DataImportLogVO.LOG_LEVEL_LABELS[DataImportLogVO.LOG_LEVEL_FATAL],
            })
        ];
        let datatable_log = new ModuleTable(this, DataImportLogVO.API_TYPE_ID, () => new DataImportLogVO(), datatable_fields, label_field, "Logs d'importation").hideAnyToManyByDefault();
        field_data_import_format_id.addManyToOneRelation(datatable_desc);
        field_data_import_historic_id.addManyToOneRelation(datatable_historic);
        this.datatables.push(datatable_log);
    }
}
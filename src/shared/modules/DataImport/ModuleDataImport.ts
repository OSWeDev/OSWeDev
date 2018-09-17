import ModuleAjaxCache from '../AjaxCache/ModuleAjaxCache';
import ModuleAPI from '../API/ModuleAPI';
import NumberParamVO from '../API/vos/apis/NumberParamVO';
import StringParamVO from '../API/vos/apis/StringParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import FileVO from '../File/vos/FileVO';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import ModuleVO from '../ModuleVO';
import VOsTypesManager from '../VOsTypesManager';
import DataImportColumnVO from './vos/DataImportColumnVO';
import DataImportFormatVO from './vos/DataImportFormatVO';
import DataImportHistoricVO from './vos/DataImportHistoricVO';
import DataImportLogVO from './vos/DataImportLogVO';
import UserVO from '../AccessPolicy/vos/UserVO';

export default class ModuleDataImport extends Module {

    public static IMPORT_SCHEMA: string = 'imports';

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
        "import.state.failed_posttreatment"];
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


    public static IMPORT_TABLE_PREFIX: string = '_i_';

    public static getInstance(): ModuleDataImport {
        if (!ModuleDataImport.instance) {
            ModuleDataImport.instance = new ModuleDataImport();
        }
        return ModuleDataImport.instance;
    }

    private static instance: ModuleDataImport = null;

    public datatable_desc: ModuleTable<DataImportFormatVO>;
    public datatable_column: ModuleTable<DataImportColumnVO>;
    public datatable_historic: ModuleTable<DataImportHistoricVO>;
    public datatable_log: ModuleTable<DataImportLogVO>;

    private constructor() {

        super("data_import", "DataImport");
    }

    public registerApis() {
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<NumberParamVO, DataImportHistoricVO[]>(
            ModuleDataImport.APINAME_getDataImportHistorics,
            [DataImportHistoricVO.API_TYPE_ID],
            NumberParamVO.translateCheckAccessParams,
            NumberParamVO.URL,
            NumberParamVO.translateToURL,
            NumberParamVO.translateFromREQ
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<NumberParamVO, DataImportHistoricVO>(
            ModuleDataImport.APINAME_getDataImportHistoric,
            [DataImportHistoricVO.API_TYPE_ID],
            NumberParamVO.translateCheckAccessParams,
            NumberParamVO.URL,
            NumberParamVO.translateToURL,
            NumberParamVO.translateFromREQ
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<NumberParamVO, DataImportLogVO[]>(
            ModuleDataImport.APINAME_getDataImportLogs,
            [DataImportLogVO.API_TYPE_ID],
            NumberParamVO.translateCheckAccessParams,
            NumberParamVO.URL,
            NumberParamVO.translateToURL,
            NumberParamVO.translateFromREQ
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<void, DataImportFormatVO[]>(
            ModuleDataImport.APINAME_getDataImportFiles,
            [DataImportFormatVO.API_TYPE_ID]
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<StringParamVO, DataImportFormatVO>(
            ModuleDataImport.APINAME_getDataImportFile,
            [DataImportFormatVO.API_TYPE_ID],
            StringParamVO.translateCheckAccessParams,
            StringParamVO.URL,
            StringParamVO.translateToURL,
            StringParamVO.translateFromREQ
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<NumberParamVO, DataImportColumnVO[]>(
            ModuleDataImport.APINAME_getDataImportColumnsFromFormatId,
            [DataImportColumnVO.API_TYPE_ID],
            NumberParamVO.translateCheckAccessParams,
            NumberParamVO.URL,
            NumberParamVO.translateToURL,
            NumberParamVO.translateFromREQ
        ));
    }

    public getTableSuffix(dataImportFile: DataImportFormatVO): string {

        return dataImportFile.import_uid.replace(/[^a-zA-Z_]/g, '_');
    }

    public async getDataImportHistorics(data_import_format_id: number): Promise<DataImportHistoricVO[]> {
        // On s'assure de recharger toujours une version fraîche sur cette api.
        ModuleAjaxCache.getInstance().invalidateCachesFromApiTypesInvolved([DataImportHistoricVO.API_TYPE_ID]);
        return await ModuleAPI.getInstance().handleAPI<NumberParamVO, DataImportHistoricVO[]>(ModuleDataImport.APINAME_getDataImportHistorics, data_import_format_id);
    }

    public async getDataImportHistoric(historic_id: number): Promise<DataImportHistoricVO> {
        // On s'assure de recharger toujours une version fraîche sur cette api.
        ModuleAjaxCache.getInstance().invalidateCachesFromApiTypesInvolved([DataImportHistoricVO.API_TYPE_ID]);
        return await ModuleAPI.getInstance().handleAPI<NumberParamVO, DataImportHistoricVO>(ModuleDataImport.APINAME_getDataImportHistoric, historic_id);
    }

    public async getDataImportLogs(data_import_format_id: number): Promise<DataImportLogVO[]> {
        // On s'assure de recharger toujours une version fraîche sur cette api.
        ModuleAjaxCache.getInstance().invalidateCachesFromApiTypesInvolved([DataImportLogVO.API_TYPE_ID]);
        return await ModuleAPI.getInstance().handleAPI<NumberParamVO, DataImportLogVO[]>(ModuleDataImport.APINAME_getDataImportLogs, data_import_format_id);
    }

    public async getDataImportFiles(): Promise<DataImportFormatVO[]> {
        return await ModuleAPI.getInstance().handleAPI<void, DataImportFormatVO[]>(ModuleDataImport.APINAME_getDataImportFiles);
    }

    public async getDataImportFile(import_uid: string): Promise<DataImportFormatVO> {
        return await ModuleAPI.getInstance().handleAPI<StringParamVO, DataImportFormatVO>(ModuleDataImport.APINAME_getDataImportFile, import_uid);
    }

    public async getDataImportColumnsFromFormatId(data_import_format_id: number): Promise<DataImportColumnVO[]> {
        return await ModuleAPI.getInstance().handleAPI<NumberParamVO, DataImportColumnVO[]>(ModuleDataImport.APINAME_getDataImportColumnsFromFormatId, data_import_format_id);
    }

    public registerImportableModuleTable(targetModuleTable: ModuleTable<any>) {

        targetModuleTable.defineAsImportable();

        // On crée le moduletable adapté, et on stocke l'info de l'existence de ce type importable 
        let fields: Array<ModuleTableField<any>> = [];

        for (let i in targetModuleTable.fields) {
            let vofield = targetModuleTable.fields[i];

            fields.push(Object.assign(new ModuleTableField<any>(vofield.field_id, vofield.field_type, vofield.field_label, vofield.field_required, vofield.has_default, vofield.field_default), vofield));
        }

        let field_target_vo_id = new ModuleTableField<any>("target_vo_id", ModuleTableField.FIELD_TYPE_foreign_key, "Objet cible de l'import", false);
        fields.unshift(new ModuleTableField<any>("importation_state", ModuleTableField.FIELD_TYPE_enum, "Status", true, true, 0).setEnumValues({
            [ModuleDataImport.IMPORTATION_STATE_UPLOADED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_UPLOADED],
            [ModuleDataImport.IMPORTATION_STATE_FORMATTING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FORMATTING],
            [ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT],
            [ModuleDataImport.IMPORTATION_STATE_IMPORTING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTING],
            [ModuleDataImport.IMPORTATION_STATE_IMPORTED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTED],
            [ModuleDataImport.IMPORTATION_STATE_POSTTREATING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_POSTTREATING],
            [ModuleDataImport.IMPORTATION_STATE_POSTTREATED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_POSTTREATED],
            [ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED],
            [ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION],
            [ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT]
        }));
        fields.push(new ModuleTableField<any>("creation_date", ModuleTableField.FIELD_TYPE_timestamp, "Date de création", false));
        fields.unshift(new ModuleTableField<any>("not_validated_msg", ModuleTableField.FIELD_TYPE_string, "Msg validation", false));
        fields.push(new ModuleTableField<any>("not_imported_msg", ModuleTableField.FIELD_TYPE_string, "Msg import", false));
        fields.push(new ModuleTableField<any>("not_posttreated_msg", ModuleTableField.FIELD_TYPE_string, "Msg post-traitement", false));
        let importTable: ModuleTable<any> = new ModuleTable<any>(targetModuleTable.module, ModuleDataImport.IMPORT_TABLE_PREFIX + targetModuleTable.vo_type, fields, null, "Import " + targetModuleTable.name);
        importTable.set_bdd_ref(ModuleDataImport.IMPORT_SCHEMA, ModuleDataImport.IMPORT_TABLE_PREFIX + targetModuleTable.vo_type);
        field_target_vo_id.addManyToOneRelation(importTable, targetModuleTable);
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
            new ModuleTableField('sheet_name', ModuleTableField.FIELD_TYPE_string, 'Nom de l\'onglet (XLS, XLSX)', false, true, ""),
            new ModuleTableField('sheet_index', ModuleTableField.FIELD_TYPE_int, 'Index de l\'onglet (XLS, XLSX) si nom indisponible', false, true, 0),
            new ModuleTableField('first_row_index', ModuleTableField.FIELD_TYPE_int, 'Index de la première ligne (1ère ligne = 0)', true),
            new ModuleTableField('api_type_id', ModuleTableField.FIELD_TYPE_string, 'API_TYPE_ID associé', true),
            new ModuleTableField('copy_folder', ModuleTableField.FIELD_TYPE_string, 'Répertoire d\'archivage', true),
            field_post_exec_module_id
        ];
        this.datatable_desc = new ModuleTable(this, DataImportFormatVO.API_TYPE_ID, datatable_fields, label_field, "Fichiers d'import");
        field_file_id.addManyToOneRelation(this.datatable_desc, VOsTypesManager.getInstance().moduleTables_by_voType[FileVO.API_TYPE_ID]);
        field_post_exec_module_id.addManyToOneRelation(this.datatable_desc, VOsTypesManager.getInstance().moduleTables_by_voType[ModuleVO.API_TYPE_ID]);
        this.datatables.push(this.datatable_desc);

        // Création de la table dataimportcolumn
        label_field = new ModuleTableField('title', ModuleTableField.FIELD_TYPE_string, 'Nom de la colonne (Fichier)', true);
        let field_data_import_format_id: ModuleTableField<number> = new ModuleTableField('data_import_format_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Format d\'import', true, true, 0);
        datatable_fields = [
            field_data_import_format_id,
            new ModuleTableField('column_index', ModuleTableField.FIELD_TYPE_int, 'Index de la colonne (1ère colonne = 0)', true),
            label_field,
            new ModuleTableField('type', ModuleTableField.FIELD_TYPE_string, 'Type de donnée', true),
            new ModuleTableField('vo_field_name', ModuleTableField.FIELD_TYPE_string, 'Nom de la colonne (Vo)', true),
        ];
        this.datatable_column = new ModuleTable(this, DataImportColumnVO.API_TYPE_ID, datatable_fields, label_field, "Colonnes importées");
        field_data_import_format_id.addManyToOneRelation(this.datatable_column, this.datatable_desc);
        this.datatables.push(this.datatable_column);

        // Création de la table dataimportlog
        label_field = new ModuleTableField('historic_uid', ModuleTableField.FIELD_TYPE_string, 'ID unique', false);
        field_data_import_format_id = new ModuleTableField('data_import_format_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Format d\'import', false);
        let field_user_id = new ModuleTableField('user_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Auteur', false);
        field_file_id = new ModuleTableField('file_id', ModuleTableField.FIELD_TYPE_file_ref, 'Fichier importé', false);
        datatable_fields = [
            field_data_import_format_id,
            field_file_id,
            field_user_id,
            new ModuleTableField('state', ModuleTableField.FIELD_TYPE_enum, 'Etat de l\'import', true).setEnumValues({
                [ModuleDataImport.IMPORTATION_STATE_UPLOADED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_UPLOADED],
                [ModuleDataImport.IMPORTATION_STATE_FORMATTING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FORMATTING],
                [ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT],
                [ModuleDataImport.IMPORTATION_STATE_IMPORTING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTING],
                [ModuleDataImport.IMPORTATION_STATE_IMPORTED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTED],
                [ModuleDataImport.IMPORTATION_STATE_POSTTREATING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_POSTTREATING],
                [ModuleDataImport.IMPORTATION_STATE_POSTTREATED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_POSTTREATED],
                [ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED],
                [ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION],
                [ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT]
            }),
            label_field,
            new ModuleTableField('start_date', ModuleTableField.FIELD_TYPE_timestamp, 'Date de démarrage', false),
            new ModuleTableField('segment_date_index', ModuleTableField.FIELD_TYPE_string, 'Segment cible', false),
            new ModuleTableField('last_up_date', ModuleTableField.FIELD_TYPE_timestamp, 'Modification', false),
            new ModuleTableField('end_date', ModuleTableField.FIELD_TYPE_timestamp, 'Date de fin', false),
            new ModuleTableField('params', ModuleTableField.FIELD_TYPE_string, 'Paramètres', false),
            new ModuleTableField('api_type_id', ModuleTableField.FIELD_TYPE_string, 'Vo importé', false),
            new ModuleTableField('import_type', ModuleTableField.FIELD_TYPE_enum, 'Type d\'import', true).setEnumValues({
                [DataImportHistoricVO.IMPORT_TYPE_EDIT]: DataImportHistoricVO.IMPORT_TYPE_NAMES[DataImportHistoricVO.IMPORT_TYPE_EDIT],
                [DataImportHistoricVO.IMPORT_TYPE_REPLACE]: DataImportHistoricVO.IMPORT_TYPE_NAMES[DataImportHistoricVO.IMPORT_TYPE_REPLACE],
            })
        ];
        this.datatable_historic = new ModuleTable(this, DataImportHistoricVO.API_TYPE_ID, datatable_fields, label_field, "Historiques d'importation");
        field_data_import_format_id.addManyToOneRelation(this.datatable_historic, this.datatable_desc);
        field_user_id.addManyToOneRelation(this.datatable_historic, VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);
        field_file_id.addManyToOneRelation(this.datatable_historic, VOsTypesManager.getInstance().moduleTables_by_voType[FileVO.API_TYPE_ID]);
        this.datatables.push(this.datatable_historic);


        label_field = new ModuleTableField('date', ModuleTableField.FIELD_TYPE_timestamp, 'Date', false);
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
        this.datatable_log = new ModuleTable(this, DataImportLogVO.API_TYPE_ID, datatable_fields, label_field, "Logs d'importation");
        field_data_import_format_id.addManyToOneRelation(this.datatable_log, this.datatable_desc);
        field_data_import_historic_id.addManyToOneRelation(this.datatable_log, this.datatable_historic);
        this.datatables.push(this.datatable_log);
    }
}
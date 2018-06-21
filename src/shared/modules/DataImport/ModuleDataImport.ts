import ModuleAjaxCache from '../AjaxCache/ModuleAjaxCache';
import ModuleAPI from '../API/ModuleAPI';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import Module from '../Module';
import ModulesManager from '../ModulesManager';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import DataImportColumnVO from './vos/DataImportColumnVO';
import DataImportFileVO from './vos/DataImportFileVO';
import DataImportHistoricVO from './vos/DataImportHistoricVO';
import DataImportLogVO from './vos/DataImportLogVO';

export default class ModuleDataImport extends Module {

    public static APINAME_getDataImportHistorics: string = 'getDataImportHistorics';
    public static APINAME_getDataImportHistoric: string = 'getDataImportHistoric';
    public static APINAME_getDataImportLogs: string = 'getDataImportLogs';
    public static APINAME_getDataImportFiles: string = 'getDataImportFiles';
    public static APINAME_getDataImportFile: string = 'getDataImportFile';
    public static APINAME_getDataImportColumnsFromFileId: string = 'getDataImportColumnsFromFileId';

    public static getInstance(): ModuleDataImport {
        if (!ModuleDataImport.instance) {
            ModuleDataImport.instance = new ModuleDataImport();
        }
        return ModuleDataImport.instance;
    }

    private static instance: ModuleDataImport = null;

    public dataImportFiles_by_name: { [name: string]: DataImportFileVO } = {};
    public dataImportFiles_by_id: { [id: number]: DataImportFileVO } = {};

    public datatable_file: ModuleTable<DataImportFileVO>;
    public datatable_column: ModuleTable<DataImportColumnVO>;
    public datatable_historic: ModuleTable<DataImportHistoricVO>;
    public datatable_log: ModuleTable<DataImportLogVO>;

    private constructor() {

        super("data_import", "DataImport");
        this.initialize();

        // Si on est côté serveur l'init des apis se passe dans le module server
        if (!ModulesManager.getInstance().isServerSide) {
            this.registerApis();
        }
    }

    public registerApis() {
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<number, DataImportHistoricVO[]>(
            ModuleDataImport.APINAME_getDataImportHistorics,
            [DataImportHistoricVO.API_TYPE_ID]
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<number, DataImportHistoricVO>(
            ModuleDataImport.APINAME_getDataImportHistoric,
            [DataImportHistoricVO.API_TYPE_ID]
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<number, DataImportLogVO[]>(
            ModuleDataImport.APINAME_getDataImportLogs,
            [DataImportLogVO.API_TYPE_ID]
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<void, DataImportFileVO[]>(
            ModuleDataImport.APINAME_getDataImportFiles,
            [DataImportFileVO.API_TYPE_ID]
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<string, DataImportFileVO>(
            ModuleDataImport.APINAME_getDataImportFile,
            [DataImportFileVO.API_TYPE_ID]
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<number, DataImportColumnVO[]>(
            ModuleDataImport.APINAME_getDataImportColumnsFromFileId,
            [DataImportColumnVO.API_TYPE_ID]
        ));
    }

    public async hook_module_async_admin_initialization() {
        // On précharge les DataImportFile pour être synchrone sur l'admin sur ce sujet et pouvoir créer les menus adaptés
        let dataImportFiles: DataImportFileVO[] = await this.getDataImportFiles();

        for (let i in dataImportFiles) {
            let dataImportFile: DataImportFileVO = dataImportFiles[i];

            this.dataImportFiles_by_name[dataImportFile.import_name] = dataImportFile;
            this.dataImportFiles_by_id[dataImportFile.id] = dataImportFile;
        }
    }

    public getTableSuffix(dataImportFile: DataImportFileVO): string {

        return dataImportFile.import_name.replace(/[^a-zA-Z_]/g, '_');
    }

    public getLogLevelValue(log_level: string): number {
        switch (log_level) {
            case DataImportLogVO.LOG_LEVEL_0_DEBUG:
                return 0;
            case DataImportLogVO.LOG_LEVEL_100_FATAL:
                return 100;
            case DataImportLogVO.LOG_LEVEL_10_INFO:
                return 10;
            case DataImportLogVO.LOG_LEVEL_25_WARN:
                return 25;
            case DataImportLogVO.LOG_LEVEL_50_ERROR:
                return 50;
        }
        return 0;
    }

    public async getDataImportHistorics(data_import_file_id: number): Promise<DataImportHistoricVO[]> {
        // On s'assure de recharger toujours une version fraîche sur cette api.
        ModuleAjaxCache.getInstance().invalidateCachesFromApiTypesInvolved([DataImportHistoricVO.API_TYPE_ID]);
        return await ModuleAPI.getInstance().handleAPI<number, DataImportHistoricVO[]>(ModuleDataImport.APINAME_getDataImportHistorics, data_import_file_id);
    }

    public async getDataImportHistoric(historic_id: number): Promise<DataImportHistoricVO> {
        // On s'assure de recharger toujours une version fraîche sur cette api.
        ModuleAjaxCache.getInstance().invalidateCachesFromApiTypesInvolved([DataImportHistoricVO.API_TYPE_ID]);
        return await ModuleAPI.getInstance().handleAPI<number, DataImportHistoricVO>(ModuleDataImport.APINAME_getDataImportHistoric, historic_id);
    }

    public async getDataImportLogs(data_import_file_id: number): Promise<DataImportLogVO[]> {
        // On s'assure de recharger toujours une version fraîche sur cette api.
        ModuleAjaxCache.getInstance().invalidateCachesFromApiTypesInvolved([DataImportLogVO.API_TYPE_ID]);
        return await ModuleAPI.getInstance().handleAPI<number, DataImportLogVO[]>(ModuleDataImport.APINAME_getDataImportLogs, data_import_file_id);
    }

    public async getDataImportFiles(): Promise<DataImportFileVO[]> {
        return await ModuleAPI.getInstance().handleAPI<void, DataImportFileVO[]>(ModuleDataImport.APINAME_getDataImportFiles);
    }

    public async getDataImportFile(import_name: string): Promise<DataImportFileVO> {
        return await ModuleAPI.getInstance().handleAPI<string, DataImportFileVO>(ModuleDataImport.APINAME_getDataImportFile, import_name);
    }

    public async getDataImportColumnsFromFileId(data_import_file_id: number): Promise<DataImportColumnVO[]> {
        return await ModuleAPI.getInstance().handleAPI<number, DataImportColumnVO[]>(ModuleDataImport.APINAME_getDataImportColumnsFromFileId, data_import_file_id);
    }

    protected initialize() {
        this.fields = [];
        this.datatables = [];

        // Création de la table dataimportfile
        let datatable_fields = [
            new ModuleTableField('import_name', ModuleTableField.FIELD_TYPE_string, 'Nom du fichier d\'import', true),
            new ModuleTableField('type', ModuleTableField.FIELD_TYPE_string, 'Type d\'import (XLS, XLSX, CSV)', true),
            new ModuleTableField('sheet_name', ModuleTableField.FIELD_TYPE_string, 'Nom de l\'onglet (XLS, XLSX)', false, true, ""),
            new ModuleTableField('sheet_index', ModuleTableField.FIELD_TYPE_int, 'Index de l\'onglet (XLS, XLSX) si nom indisponible', false, true, 0),
            new ModuleTableField('first_row_index', ModuleTableField.FIELD_TYPE_int, 'Index de la première ligne (1ère ligne = 0)', true),
            new ModuleTableField('copy_folder', ModuleTableField.FIELD_TYPE_string, 'Nom du répertoire dans lequel garder une copie de l\'import', true),
            new ModuleTableField('datatable_fullname', ModuleTableField.FIELD_TYPE_string, 'Nom du datatable cible de l\'import', true),
            new ModuleTableField('post_traitement_module', ModuleTableField.FIELD_TYPE_string, 'Nom du module qui gère l\'intégration', true),
        ];

        this.datatable_file = new ModuleTable(this, DataImportFileVO.API_TYPE_ID, DataImportFileVO.forceNumeric, DataImportFileVO.forceNumerics, datatable_fields, 'file');
        this.datatables.push(this.datatable_file);

        // Création de la table dataimportcolumn
        let field_data_import_file_id: ModuleTableField<number> = new ModuleTableField('data_import_file_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Fichier d\'import', true, true, 0);

        datatable_fields = [
            field_data_import_file_id,
            new ModuleTableField('column_index', ModuleTableField.FIELD_TYPE_int, 'Index de la colonne (1ère colonne = 0)', true),
            new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom de la colonne', true),
            new ModuleTableField('type', ModuleTableField.FIELD_TYPE_string, 'Type de donnée', true)
        ];

        this.datatable_column = new ModuleTable(this, DataImportColumnVO.API_TYPE_ID, DataImportColumnVO.forceNumeric, DataImportColumnVO.forceNumerics, datatable_fields, 'column');
        field_data_import_file_id.addRelation(this.datatable_column, 'ref', this.datatable_file.name, 'id');
        this.datatables.push(this.datatable_column);

        // Création de la table dataimportlog
        field_data_import_file_id = new ModuleTableField('data_import_file_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Fichier d\'import', false);
        datatable_fields = [
            field_data_import_file_id,

            new ModuleTableField('state', ModuleTableField.FIELD_TYPE_int, 'Etat de l\'import', true),
            new ModuleTableField('filepath', ModuleTableField.FIELD_TYPE_string, 'filepath', false),

            new ModuleTableField('start_date', 'timestamp', 'start_date', false),
            new ModuleTableField('end_date', 'timestamp', 'end_date', false),
            new ModuleTableField('target_date', 'timestamp', 'target_date', false),
            new ModuleTableField('last_up_date', 'timestamp', 'last_up_date', false)
        ];

        this.datatable_historic = new ModuleTable(this, DataImportHistoricVO.API_TYPE_ID, DataImportHistoricVO.forceNumeric, DataImportHistoricVO.forceNumerics, datatable_fields, 'historic');
        field_data_import_file_id.addRelation(this.datatable_historic, 'ref', this.datatable_file.name, 'id');
        this.datatables.push(this.datatable_historic);


        field_data_import_file_id = new ModuleTableField('data_import_file_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Fichier d\'import', false);
        let field_data_import_historic_id = new ModuleTableField('data_import_historic_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Historique', false);
        datatable_fields = [
            field_data_import_file_id,
            field_data_import_historic_id,

            new ModuleTableField('message', ModuleTableField.FIELD_TYPE_string, 'message', true),
            new ModuleTableField('log_level', ModuleTableField.FIELD_TYPE_string, 'log_level', true),

            new ModuleTableField('date', 'timestamp', 'start_date', false, true, '01/01/2001 09:00')
        ];

        this.datatable_log = new ModuleTable(this, DataImportLogVO.API_TYPE_ID, DataImportLogVO.forceNumeric, DataImportLogVO.forceNumerics, datatable_fields, 'log');
        field_data_import_file_id.addRelation(this.datatable_log, 'ref', this.datatable_file.name, 'id');
        field_data_import_historic_id.addRelation(this.datatable_log, 'ref', this.datatable_historic.name, 'id');
        this.datatables.push(this.datatable_log);
    }
}
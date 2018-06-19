import Module from '../Module';
import ModuleTableField from '../ModuleTableField';
import ModuleTable from '../ModuleTable';
import ModuleParamChange from '../ModuleParamChange';
import ModuleAjaxCache from '../AjaxCache/ModuleAjaxCache';
import DataImportFileVO from './vos/DataImportFileVO';
import ModulesManager from '../ModulesManager';
import DataImportColumnVO from './vos/DataImportColumnVO';
import DataImportLogVO from './vos/DataImportLogVO';
import { IDatabase } from 'pg-promise';
import DataImportHistoricVO from './vos/DataImportHistoricVO';

export default class ModuleDataImport extends Module {

    public static getInstance(): ModuleDataImport {
        if (!ModuleDataImport.instance) {
            ModuleDataImport.instance = new ModuleDataImport();
        }
        return ModuleDataImport.instance;
    }

    private static instance: ModuleDataImport = null;

    public dataImportFiles_by_name: { [name: string]: DataImportFileVO } = {};
    public dataImportFiles_by_id: { [id: number]: DataImportFileVO } = {};

    /// #if false
    private db: IDatabase<any>;
    /// #endif

    private datatable_file: ModuleTable<DataImportFileVO>;
    private datatable_column: ModuleTable<DataImportColumnVO>;
    private datatable_historic: ModuleTable<DataImportHistoricVO>;
    private datatable_log: ModuleTable<DataImportLogVO>;

    private constructor() {

        super("data_import", "DataImport");
        this.initialize();
    }

    /// #if false
    public async hook_module_configure(db): Promise<boolean> {
        this.db = db;
        return true;
    }
    public async hook_module_install(db) { return true; }
    /// #endif

    public async hook_module_on_params_changed(paramChanged: Array<ModuleParamChange<any>>) { }
    public async hook_module_async_client_admin_initialization() { }

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

        // Si on est en client / admin il faut utiliser un AjaxCache get, sinon on fait un appel en BDD
        if (ModulesManager.getInstance().isServerSide) {

            /// #if false

            return DataImportHistoricVO.forceNumerics(await this.db.query(
                'SELECT t.* FROM ' + this.datatable_historic.full_name + ' t ' +
                '   WHERE t.data_import_file_id = $1 LIMIT 50;', [data_import_file_id]));

            /// #endif
        } else {
            // On s'assure de recharger toujours une version fraîche sur cette api.
            ModuleAjaxCache.getInstance().invalidateCachesFromApiTypesInvolved([DataImportHistoricVO.API_TYPE_ID]);
            return await ModuleAjaxCache.getInstance().get("/modules/ModuleDataImport/getDataImportHistorics/" + data_import_file_id, [DataImportHistoricVO.API_TYPE_ID]) as DataImportHistoricVO[];
        }
    }

    public async getDataImportHistoric(historic_id: number): Promise<DataImportHistoricVO> {

        // Si on est en client / admin il faut utiliser un AjaxCache get, sinon on fait un appel en BDD
        if (ModulesManager.getInstance().isServerSide) {

            /// #if false

            return DataImportHistoricVO.forceNumeric(await this.db.oneOrNone(
                'SELECT t.* FROM ' + this.datatable_historic.full_name + ' t ' +
                '   WHERE t.id = $1;', [historic_id]));

            /// #endif
        } else {
            // On s'assure de recharger toujours une version fraîche sur cette api.
            ModuleAjaxCache.getInstance().invalidateCachesFromApiTypesInvolved([DataImportHistoricVO.API_TYPE_ID]);
            return await ModuleAjaxCache.getInstance().get("/modules/ModuleDataImport/getDataImportHistoric/" + historic_id, [DataImportHistoricVO.API_TYPE_ID]) as DataImportHistoricVO;
        }
    }

    public async getDataImportLogs(data_import_file_id: number): Promise<DataImportLogVO[]> {

        // Si on est en client / admin il faut utiliser un AjaxCache get, sinon on fait un appel en BDD
        if (ModulesManager.getInstance().isServerSide) {

            /// #if false

            return DataImportLogVO.forceNumerics(await this.db.query(
                'SELECT t.* FROM ' + this.datatable_log.full_name + ' t ' +
                '   WHERE t.data_import_file_id = $1 LIMIT 50;', [data_import_file_id]));

            /// #endif
        } else {
            // On s'assure de recharger toujours une version fraîche sur cette api.
            ModuleAjaxCache.getInstance().invalidateCachesFromApiTypesInvolved([DataImportLogVO.API_TYPE_ID]);
            return await ModuleAjaxCache.getInstance().get("/modules/ModuleDataImport/getDataImportLogs/" + data_import_file_id, [DataImportLogVO.API_TYPE_ID]) as DataImportLogVO[];
        }
    }

    public async getDataImportFiles(): Promise<DataImportFileVO[]> {

        // Si on est en client / admin il faut utiliser un AjaxCache get, sinon on fait un appel en BDD
        if (ModulesManager.getInstance().isServerSide) {

            /// #if false

            return DataImportFileVO.forceNumerics(await this.db.query(
                'SELECT t.* FROM ' + this.datatable_file.full_name + ' t;'));

            /// #endif
        } else {
            return await ModuleAjaxCache.getInstance().get("/modules/ModuleDataImport/getDataImportFiles/", [DataImportFileVO.API_TYPE_ID]) as DataImportFileVO[];
        }
    }

    public async getDataImportFile(import_name: string): Promise<DataImportFileVO> {

        // Si on est en client / admin il faut utiliser un AjaxCache get, sinon on fait un appel en BDD
        if (ModulesManager.getInstance().isServerSide) {

            /// #if false

            return DataImportFileVO.forceNumeric(await this.db.oneOrNone(
                'SELECT t.* FROM ' + this.datatable_file.full_name + ' t ' +
                '  WHERE t.import_name = $1', [import_name]));

            /// #endif
        } else {
            return await ModuleAjaxCache.getInstance().get("/modules/ModuleDataImport/getDataImportFile/" + import_name, [DataImportFileVO.API_TYPE_ID]) as DataImportFileVO;
        }
    }

    public async getDataImportColumnsFromFileId(data_import_file_id: number): Promise<DataImportColumnVO[]> {

        // Si on est en client / admin il faut utiliser un AjaxCache get, sinon on fait un appel en BDD
        if (ModulesManager.getInstance().isServerSide) {

            /// #if false

            return DataImportColumnVO.forceNumerics(await this.db.query(
                'SELECT t.* FROM ' + this.datatable_column.full_name + ' t ' +
                '  WHERE t.data_import_file_id = $1', [data_import_file_id]));

            /// #endif
        } else {
            return await ModuleAjaxCache.getInstance().get("/modules/ModuleDataImport/getDataImportColumnsFromFile/" + data_import_file_id, [DataImportColumnVO.API_TYPE_ID]) as DataImportColumnVO[];
        }
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
import Module from '../Module';
import ModuleParamChange from '../ModuleParamChange';
import ModulesManager from '../ModulesManager';
import { IDatabase } from 'pg-promise';
import ModuleAPI from '../API/ModuleAPI';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import ExportDataToXLSXParamVO from './vos/apis/ExportDataToXLSXParamVO';
import APIDefinition from '../API/vos/APIDefinition';

export default class ModuleDataExport extends Module {

    public static APINAME_ExportDataToXLSXParamVO: string = 'ExportDataToXLSXParamVO';

    public static getInstance(): ModuleDataExport {
        if (!ModuleDataExport.instance) {
            ModuleDataExport.instance = new ModuleDataExport();
        }
        return ModuleDataExport.instance;
    }

    private static instance: ModuleDataExport = null;

    private constructor() {

        super("data_export", "DataExport");
        this.initialize();

        // Si on est côté serveur l'init des apis se passe dans le module server
        if (!ModulesManager.getInstance().isServerSide) {
            this.registerApis();
        }
    }

    public async hook_module_on_params_changed(paramChanged: Array<ModuleParamChange<any>>) { }
    public async hook_module_async_client_admin_initialization() { }

    public async hook_module_async_admin_initialization() {
    }

    public async exportDataToXLSX(exportDataToXLSXParamVO: ExportDataToXLSXParamVO): Promise<any> {
        return await ModuleAPI.getInstance().handleAPI<ExportDataToXLSXParamVO, any>(ModuleDataExport.APINAME_ExportDataToXLSXParamVO, exportDataToXLSXParamVO);
    }

    protected initialize() {
        this.fields = [];
        this.datatables = [];
    }

    private registerApis() {
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<ExportDataToXLSXParamVO, string>(
            ModuleDataExport.APINAME_ExportDataToXLSXParamVO,
            [],
            null,
            null,
            APIDefinition.API_RETURN_TYPE_FILE
        ));
    }
}
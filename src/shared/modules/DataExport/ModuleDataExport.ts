import ModuleAPI from '../API/ModuleAPI';
import APIDefinition from '../API/vos/APIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import Module from '../Module';
import ExportDataToXLSXParamVO from './vos/apis/ExportDataToXLSXParamVO';

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
        this.forceActivationOnInstallation();
    }

    public async exportDataToXLSX(exportDataToXLSXParamVO: ExportDataToXLSXParamVO): Promise<any> {
        return await ModuleAPI.getInstance().handleAPI<ExportDataToXLSXParamVO, any>(ModuleDataExport.APINAME_ExportDataToXLSXParamVO, exportDataToXLSXParamVO);
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }

    public registerApis() {
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<ExportDataToXLSXParamVO, string>(
            ModuleDataExport.APINAME_ExportDataToXLSXParamVO,
            [],
            null,
            APIDefinition.API_RETURN_TYPE_FILE
        ));
    }
}
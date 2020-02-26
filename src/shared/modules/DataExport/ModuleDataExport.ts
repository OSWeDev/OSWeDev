import UserVO from '../AccessPolicy/vos/UserVO';
import ModuleAPI from '../API/ModuleAPI';
import APIDefinition from '../API/vos/APIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import DefaultTranslation from '../Translation/vos/DefaultTranslation';
import VOsTypesManager from '../VOsTypesManager';
import ExportDataToXLSXParamVO from './vos/apis/ExportDataToXLSXParamVO';
import ExportLogVO from './vos/apis/ExportLogVO';

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

        this.initializeExportLogVO();
    }

    public registerApis() {
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<ExportDataToXLSXParamVO, string>(
            ModuleDataExport.APINAME_ExportDataToXLSXParamVO,
            [],
            null,
            APIDefinition.API_RETURN_TYPE_FILE
        ));
    }

    private initializeExportLogVO(): void {
        let field_name = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ fr: "Nom de l'export" }), true);
        let field_user_id = new ModuleTableField('user_id', ModuleTableField.FIELD_TYPE_foreign_key, new DefaultTranslation({ fr: "Utilisateur" }), true);

        let datatable_fields = [
            field_name,
            new ModuleTableField('log_time', ModuleTableField.FIELD_TYPE_tstz, new DefaultTranslation({ fr: "Date de l'export" })).set_segmentation_type(TimeSegment.TYPE_SECOND),
            field_user_id
        ];

        let moduleTable: ModuleTable<ExportLogVO> = new ModuleTable<ExportLogVO>(this, ExportLogVO.API_TYPE_ID, () => new ExportLogVO(), datatable_fields, field_name);

        field_user_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);

        this.datatables.push(moduleTable);
    }
}
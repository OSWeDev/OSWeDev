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
import ExportHistoricVO from './vos/ExportHistoricVO';
import FileVO from '../File/vos/FileVO';

export default class ModuleDataExport extends Module {

    public static APINAME_ExportDataToXLSXParamVO: string = 'ExportDataToXLSXParamVO';
    public static APINAME_ExportDataToXLSXParamVOFile: string = 'ExportDataToXLSXParamVOFile';

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

    public async exportDataToXLSX(exportDataToXLSXParamVO: ExportDataToXLSXParamVO): Promise<string> {
        return await ModuleAPI.getInstance().handleAPI<ExportDataToXLSXParamVO, string>(ModuleDataExport.APINAME_ExportDataToXLSXParamVO, exportDataToXLSXParamVO);
    }

    public async exportDataToXLSXFile(exportDataToXLSXParamVO: ExportDataToXLSXParamVO): Promise<FileVO> {
        return await ModuleAPI.getInstance().handleAPI<ExportDataToXLSXParamVO, FileVO>(ModuleDataExport.APINAME_ExportDataToXLSXParamVOFile, exportDataToXLSXParamVO);
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.initializeExportLogVO();
        this.initializeExportHistoricVO();
    }

    public registerApis() {
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<ExportDataToXLSXParamVO, string>(
            ModuleDataExport.APINAME_ExportDataToXLSXParamVO,
            [],
            null,
            APIDefinition.API_RETURN_TYPE_FILE
        ));
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<ExportDataToXLSXParamVO, FileVO>(
            ModuleDataExport.APINAME_ExportDataToXLSXParamVOFile,
            [FileVO.API_TYPE_ID]
        ));
    }

    private initializeExportHistoricVO(): void {
        let export_to_uid = new ModuleTableField('export_to_uid', ModuleTableField.FIELD_TYPE_foreign_key, new DefaultTranslation({ fr: "Destinataire - Utilisateur" }), false);
        let exported_file_id = new ModuleTableField('exported_file_id', ModuleTableField.FIELD_TYPE_foreign_key, new DefaultTranslation({ fr: "Fichier exporté" }), false);

        let datatable_fields = [
            new ModuleTableField('export_type_id', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ fr: "Type d'export" }), true),
            new ModuleTableField('export_is_secured', ModuleTableField.FIELD_TYPE_boolean, new DefaultTranslation({ fr: "Fichier sécurisé" }), true, true, false),
            new ModuleTableField('export_file_access_policy_name', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ fr: "Droit d\'accès au fichier" }), false),
            new ModuleTableField('export_params_stringified', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ fr: "Paramètres" }), false),
            new ModuleTableField('export_to_mails', ModuleTableField.FIELD_TYPE_string_array, new DefaultTranslation({ fr: "Emails destinataires" }), false),
            export_to_uid,
            exported_file_id,
            new ModuleTableField('state', ModuleTableField.FIELD_TYPE_enum, new DefaultTranslation({ fr: "Status" }), true, true, ExportHistoricVO.EXPORT_STATE_TODO).setEnumValues(ExportHistoricVO.EXPORT_STATE_LABELS),
            new ModuleTableField('creation_date', ModuleTableField.FIELD_TYPE_tstz, new DefaultTranslation({ fr: "Date de création" }), true).set_segmentation_type(TimeSegment.TYPE_MS),
            new ModuleTableField('start_date', ModuleTableField.FIELD_TYPE_tstz, new DefaultTranslation({ fr: "Date de début" }), false).set_segmentation_type(TimeSegment.TYPE_MS),
            new ModuleTableField('sent_date', ModuleTableField.FIELD_TYPE_tstz, new DefaultTranslation({ fr: "Date d'envoi" }), false).set_segmentation_type(TimeSegment.TYPE_MS),
            new ModuleTableField('export_date', ModuleTableField.FIELD_TYPE_tstz, new DefaultTranslation({ fr: "Date d'export" }), false).set_segmentation_type(TimeSegment.TYPE_MS),
        ];

        let moduleTable: ModuleTable<ExportHistoricVO> = new ModuleTable<ExportHistoricVO>(this, ExportHistoricVO.API_TYPE_ID, () => new ExportHistoricVO(), datatable_fields, null);

        export_to_uid.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);
        exported_file_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[FileVO.API_TYPE_ID]);

        this.datatables.push(moduleTable);
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
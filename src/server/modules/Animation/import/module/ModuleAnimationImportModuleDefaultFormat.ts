import ModuleAnimationImportModule from "../../../../../shared/modules/Animation/import/Module/ModuleAnimationImportModule";
import AnimationImportModuleVO from "../../../../../shared/modules/Animation/import/Module/vos/AnimationImportModuleVO";
import ModuleDAO from "../../../../../shared/modules/DAO/ModuleDAO";
import ModuleDataImport from "../../../../../shared/modules/DataImport/ModuleDataImport";
import DataImportColumnVO from "../../../../../shared/modules/DataImport/vos/DataImportColumnVO";
import DataImportFormatVO from "../../../../../shared/modules/DataImport/vos/DataImportFormatVO";
import ConsoleHandler from "../../../../../shared/tools/ConsoleHandler";
import ModuleDAOServer from "../../../DAO/ModuleDAOServer";
import ModulesManagerServer from "../../../ModulesManagerServer";

export default class ModuleAnimationImportModuleDefaultFormats {

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleAnimationImportModuleDefaultFormats {
        if (!ModuleAnimationImportModuleDefaultFormats.instance) {
            ModuleAnimationImportModuleDefaultFormats.instance = new ModuleAnimationImportModuleDefaultFormats();
        }
        return ModuleAnimationImportModuleDefaultFormats.instance;
    }
    private static instance: ModuleAnimationImportModuleDefaultFormats = null;

    private constructor() { }

    public async AnimationImportModuleDefaultFormatLabels() {

        const default_import_format_name: string = 'AnimationImportModuleDefaultFormatLabels';
        let import_base_data_import_file: DataImportFormatVO = await ModuleDataImport.getInstance().getDataImportFile(default_import_format_name);

        if (import_base_data_import_file) {
            return;
        }

        import_base_data_import_file = new DataImportFormatVO();
        import_base_data_import_file.copy_folder = default_import_format_name;
        import_base_data_import_file.first_row_index = 1;
        import_base_data_import_file.column_labels_row_index = 0;
        import_base_data_import_file.import_uid = default_import_format_name;
        import_base_data_import_file.post_exec_module_id = (await ModulesManagerServer.getInstance().getModuleVOByName(ModuleAnimationImportModule.getInstance().name)).id;
        import_base_data_import_file.type_sheet_position = DataImportFormatVO.TYPE_SHEET_POSITION_SCAN;
        import_base_data_import_file.file_id = /* TODO Example file */ null;
        import_base_data_import_file.api_type_id = AnimationImportModuleVO.API_TYPE_ID;
        import_base_data_import_file.type = DataImportFormatVO.TYPE_XLSX;
        import_base_data_import_file.type_column_position = DataImportFormatVO.TYPE_COLUMN_POSITION_LABEL;

        await ModuleDAOServer.instance.insertOrUpdateVOs_as_server([import_base_data_import_file]);
        import_base_data_import_file = await ModuleDataImport.getInstance().getDataImportFile(default_import_format_name);

        if (!import_base_data_import_file) {
            ConsoleHandler.error('La création du format d\'import a échoué');
            return;
        }

        // Puis chaque champs d'import
        const i = 0;
        const import_base_data_import_columns: DataImportColumnVO[] = [];

        import_base_data_import_columns.push(DataImportColumnVO.createNew('name', import_base_data_import_file.id).setMandatory());
        import_base_data_import_columns.push(DataImportColumnVO.createNew('description', import_base_data_import_file.id));
        import_base_data_import_columns.push(DataImportColumnVO.createNew('messages', import_base_data_import_file.id));
        import_base_data_import_columns.push(DataImportColumnVO.createNew('computed_name', import_base_data_import_file.id));
        import_base_data_import_columns.push(DataImportColumnVO.createNew('weight', import_base_data_import_file.id).setMandatory());
        import_base_data_import_columns.push(DataImportColumnVO.createNew('theme_id_import', import_base_data_import_file.id).setMandatory());
        import_base_data_import_columns.push(DataImportColumnVO.createNew('document_id', import_base_data_import_file.id));
        import_base_data_import_columns.push(DataImportColumnVO.createNew('role_id_ranges', import_base_data_import_file.id));
        import_base_data_import_columns.push(DataImportColumnVO.createNew('id_import', import_base_data_import_file.id).setMandatory());

        await ModuleDAOServer.instance.insertOrUpdateVOs_as_server(import_base_data_import_columns);
    }
}
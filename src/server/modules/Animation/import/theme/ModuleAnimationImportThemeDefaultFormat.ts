import ModuleAnimationImportTheme from "../../../../../shared/modules/Animation/import/Theme/ModuleAnimationImportTheme";
import AnimationImportThemeVO from "../../../../../shared/modules/Animation/import/Theme/vos/AnimationImportThemeVO";
import ModuleDataImport from "../../../../../shared/modules/DataImport/ModuleDataImport";
import DataImportColumnVO from "../../../../../shared/modules/DataImport/vos/DataImportColumnVO";
import DataImportFormatVO from "../../../../../shared/modules/DataImport/vos/DataImportFormatVO";
import ConsoleHandler from "../../../../../shared/tools/ConsoleHandler";
import ModuleDAOServer from "../../../DAO/ModuleDAOServer";
import ModulesManagerServer from "../../../ModulesManagerServer";

export default class ModuleAnimationImportThemeDefaultFormats {

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleAnimationImportThemeDefaultFormats {
        if (!ModuleAnimationImportThemeDefaultFormats.instance) {
            ModuleAnimationImportThemeDefaultFormats.instance = new ModuleAnimationImportThemeDefaultFormats();
        }
        return ModuleAnimationImportThemeDefaultFormats.instance;
    }
    private static instance: ModuleAnimationImportThemeDefaultFormats = null;

    private constructor() { }

    public async AnimationImportThemeDefaultFormatLabels() {

        const default_import_format_name: string = 'AnimationImportThemeDefaultFormatLabels';
        let import_base_data_import_file: DataImportFormatVO = await ModuleDataImport.getInstance().getDataImportFile(default_import_format_name);

        if (import_base_data_import_file) {
            return;
        }

        import_base_data_import_file = new DataImportFormatVO();
        import_base_data_import_file.copy_folder = default_import_format_name;
        import_base_data_import_file.first_row_index = 1;
        import_base_data_import_file.column_labels_row_index = 0;
        import_base_data_import_file.import_uid = default_import_format_name;
        import_base_data_import_file.post_exec_module_id = (await ModulesManagerServer.getInstance().getModuleVOByName(ModuleAnimationImportTheme.getInstance().name)).id;
        import_base_data_import_file.type_sheet_position = DataImportFormatVO.TYPE_SHEET_POSITION_SCAN;
        import_base_data_import_file.file_id = /* TODO Example file */ null;
        import_base_data_import_file.api_type_id = AnimationImportThemeVO.API_TYPE_ID;
        import_base_data_import_file.type = DataImportFormatVO.TYPE_XLSX;
        import_base_data_import_file.type_column_position = DataImportFormatVO.TYPE_COLUMN_POSITION_LABEL;

        await ModuleDAOServer.getInstance().insertOrUpdateVOs_as_server([import_base_data_import_file]);
        import_base_data_import_file = await ModuleDataImport.getInstance().getDataImportFile(default_import_format_name);

        if (!import_base_data_import_file) {
            ConsoleHandler.error('La création du format d\'import a échoué');
            return;
        }

        // Puis chaque champs
        const i = 0;
        const import_base_data_import_columns: DataImportColumnVO[] = [];

        import_base_data_import_columns.push(DataImportColumnVO.createNew('description', import_base_data_import_file.id));
        import_base_data_import_columns.push(DataImportColumnVO.createNew('name', import_base_data_import_file.id).setMandatory());
        import_base_data_import_columns.push(DataImportColumnVO.createNew('weight', import_base_data_import_file.id).setMandatory());
        import_base_data_import_columns.push(DataImportColumnVO.createNew('id_import', import_base_data_import_file.id).setMandatory());

        await ModuleDAOServer.getInstance().insertOrUpdateVOs_as_server(import_base_data_import_columns);
    }
}
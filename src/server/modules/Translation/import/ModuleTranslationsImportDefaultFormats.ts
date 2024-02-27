import ModuleDataImport from '../../../../shared/modules/DataImport/ModuleDataImport';
import DataImportColumnVO from '../../../../shared/modules/DataImport/vos/DataImportColumnVO';
import DataImportFormatVO from '../../../../shared/modules/DataImport/vos/DataImportFormatVO';
import ModuleTranslationsImport from '../../../../shared/modules/Translation/import/ModuleTranslationsImport';
import ImportTranslation from '../../../../shared/modules/Translation/import/vos/ImportTranslation';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ModulesManagerServer from '../../ModulesManagerServer';

export default class ModuleTranslationsImportDefaultFormats {

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleTranslationsImportDefaultFormats {
        if (!ModuleTranslationsImportDefaultFormats.instance) {
            ModuleTranslationsImportDefaultFormats.instance = new ModuleTranslationsImportDefaultFormats();
        }
        return ModuleTranslationsImportDefaultFormats.instance;
    }
    private static instance: ModuleTranslationsImportDefaultFormats = null;

    private constructor() { }

    public async TranslationsImportDefaultFormatLabels() {

        const default_import_format_name: string = 'TranslationsImportDefaultFormatLabels';
        let import_base_data_import_file: DataImportFormatVO = await ModuleDataImport.getInstance().getDataImportFile(default_import_format_name);

        if (import_base_data_import_file) {
            return;
        }

        import_base_data_import_file = new DataImportFormatVO();
        import_base_data_import_file.copy_folder = default_import_format_name;
        import_base_data_import_file.first_row_index = 1;
        import_base_data_import_file.column_labels_row_index = 0;
        import_base_data_import_file.import_uid = default_import_format_name;
        import_base_data_import_file.post_exec_module_id = (await ModulesManagerServer.getInstance().getModuleVOByName(ModuleTranslationsImport.getInstance().name)).id;
        import_base_data_import_file.type_sheet_position = DataImportFormatVO.TYPE_SHEET_POSITION_SCAN;
        import_base_data_import_file.file_id = /* TODO Example file */ null;
        import_base_data_import_file.api_type_id = ImportTranslation.API_TYPE_ID;
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

        import_base_data_import_columns.push(DataImportColumnVO.createNew('code_lang', import_base_data_import_file.id).addColumnLabels(['code_lang']).setMandatory());
        import_base_data_import_columns.push(DataImportColumnVO.createNew('code_text', import_base_data_import_file.id).addColumnLabels(['code_text']).setMandatory());
        import_base_data_import_columns.push(DataImportColumnVO.createNew('translated', import_base_data_import_file.id).addColumnLabels(['translated']).setMandatory());

        await ModuleDAOServer.getInstance().insertOrUpdateVOs_as_server(import_base_data_import_columns);
    }
}
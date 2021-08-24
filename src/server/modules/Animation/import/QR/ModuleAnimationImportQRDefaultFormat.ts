import ModuleAnimationImportQR from "../../../../../shared/modules/Animation/import/QR/ModuleAnimationImportQR";
import AnimationImportQRVO from "../../../../../shared/modules/Animation/import/QR/vos/AnimationImportQRVO";
import ModuleDAO from "../../../../../shared/modules/DAO/ModuleDAO";
import ModuleDataImport from "../../../../../shared/modules/DataImport/ModuleDataImport";
import DataImportColumnVO from "../../../../../shared/modules/DataImport/vos/DataImportColumnVO";
import DataImportFormatVO from "../../../../../shared/modules/DataImport/vos/DataImportFormatVO";
import ConsoleHandler from "../../../../../shared/tools/ConsoleHandler";
import ModulesManagerServer from "../../../ModulesManagerServer";

export default class ModuleAnimationImportQRDefaultFormats {

    public static getInstance(): ModuleAnimationImportQRDefaultFormats {
        if (!ModuleAnimationImportQRDefaultFormats.instance) {
            ModuleAnimationImportQRDefaultFormats.instance = new ModuleAnimationImportQRDefaultFormats();
        }
        return ModuleAnimationImportQRDefaultFormats.instance;
    }
    private static instance: ModuleAnimationImportQRDefaultFormats = null;

    private constructor() { }

    public async AnimationImportQRDefaultFormatLabels() {

        let default_import_format_name: string = 'AnimationImportQRDefaultFormatLabels';
        let import_base_data_import_file: DataImportFormatVO = await ModuleDataImport.getInstance().getDataImportFile(default_import_format_name);

        if (import_base_data_import_file) {
            return;
        }

        import_base_data_import_file = new DataImportFormatVO();
        import_base_data_import_file.copy_folder = default_import_format_name;
        import_base_data_import_file.first_row_index = 1;
        import_base_data_import_file.column_labels_row_index = 0;
        import_base_data_import_file.import_uid = default_import_format_name;
        import_base_data_import_file.post_exec_module_id = (await ModulesManagerServer.getInstance().getModuleVOByName(ModuleAnimationImportQR.getInstance().name)).id;
        import_base_data_import_file.type_sheet_position = DataImportFormatVO.TYPE_SHEET_POSITION_SCAN;
        import_base_data_import_file.file_id = /* TODO Example file */ null;
        import_base_data_import_file.api_type_id = AnimationImportQRVO.API_TYPE_ID;
        import_base_data_import_file.type = DataImportFormatVO.TYPE_XLSX;
        import_base_data_import_file.type_column_position = DataImportFormatVO.TYPE_COLUMN_POSITION_LABEL;

        await ModuleDAO.getInstance().insertOrUpdateVOs([import_base_data_import_file]);
        import_base_data_import_file = await ModuleDataImport.getInstance().getDataImportFile(default_import_format_name);

        if (!import_base_data_import_file) {
            ConsoleHandler.getInstance().error('La création du format d\'import a échoué');
            return;
        }

        // Puis chaque champs
        let i = 0;
        let import_base_data_import_columns: DataImportColumnVO[] = [];

        import_base_data_import_columns.push(DataImportColumnVO.createNew('weight', import_base_data_import_file.id).setMandatory());
        import_base_data_import_columns.push(DataImportColumnVO.createNew('module_id_import', import_base_data_import_file.id).setMandatory());
        import_base_data_import_columns.push(DataImportColumnVO.createNew('name', import_base_data_import_file.id).setMandatory());
        import_base_data_import_columns.push(DataImportColumnVO.createNew('description', import_base_data_import_file.id));
        import_base_data_import_columns.push(DataImportColumnVO.createNew('reponses', import_base_data_import_file.id).setMandatory());
        import_base_data_import_columns.push(DataImportColumnVO.createNew('explicatif', import_base_data_import_file.id).setMandatory());
        import_base_data_import_columns.push(DataImportColumnVO.createNew('external_video', import_base_data_import_file.id));
        import_base_data_import_columns.push(DataImportColumnVO.createNew('question_file_id', import_base_data_import_file.id));
        import_base_data_import_columns.push(DataImportColumnVO.createNew('reponse_file_id', import_base_data_import_file.id));

        await ModuleDAO.getInstance().insertOrUpdateVOs(import_base_data_import_columns);
    }
}
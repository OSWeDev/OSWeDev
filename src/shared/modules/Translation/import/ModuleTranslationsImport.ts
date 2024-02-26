import Module from '../../Module';
import AccessPolicyTools from '../../../tools/AccessPolicyTools';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../DAO/vos/ModuleTableFieldVO';
import ImportTranslation from './vos/ImportTranslation';
import ModuleTableVO from '../../DAO/vos/ModuleTableVO';
import ModuleDataImport from '../../DataImport/ModuleDataImport';
import { field_names } from '../../../tools/ObjectHandler';


export default class ModuleTranslationsImport extends Module {

    public static MODULE_NAME: string = "TranslationsImport";

    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleTranslationsImport.MODULE_NAME + ".BO_ACCESS";

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleTranslationsImport {
        if (!ModuleTranslationsImport.instance) {
            ModuleTranslationsImport.instance = new ModuleTranslationsImport();
        }
        return ModuleTranslationsImport.instance;
    }

    private static instance: ModuleTranslationsImport = null;

    private constructor() {
        super("translation_import", ModuleTranslationsImport.MODULE_NAME, "Translation/import");
        this.forceActivationOnInstallation();
    }

    public initialize() {

        this.intializeImport();
    }

    private intializeImport() {


        let datatable_fields = [
            ModuleTableFieldController.create_new(ImportTranslation.API_TYPE_ID, field_names<ImportTranslation>().code_lang, ModuleTableFieldVO.FIELD_TYPE_string, 'code_lang', false),
            ModuleTableFieldController.create_new(ImportTranslation.API_TYPE_ID, field_names<ImportTranslation>().code_text, ModuleTableFieldVO.FIELD_TYPE_string, 'code_text', false),
            ModuleTableFieldController.create_new(ImportTranslation.API_TYPE_ID, field_names<ImportTranslation>().translated, ModuleTableFieldVO.FIELD_TYPE_string, 'translated', false)
        ];

        let datatable = new ModuleTableVO(this, ImportTranslation.API_TYPE_ID, () => new ImportTranslation(), datatable_fields, null, "Import des traductions");
        ModuleDataImport.getInstance().registerImportableModuleTable(datatable);
        this.datatables.push(datatable);
    }
}
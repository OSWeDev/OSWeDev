import Module from '../../Module';
import AccessPolicyTools from '../../../tools/AccessPolicyTools';
import ModuleTableField from '../../ModuleTableField';
import ImportTranslation from './vos/ImportTranslation';
import ModuleTable from '../../ModuleTable';
import ModuleDataImport from '../../DataImport/ModuleDataImport';


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
        this.fields = [];
        this.datatables = [];

        this.intializeImport();
    }

    private intializeImport() {


        let datatable_fields = [
            new ModuleTableField('code_lang', ModuleTableField.FIELD_TYPE_string, 'code_lang', false),
            new ModuleTableField('code_text', ModuleTableField.FIELD_TYPE_string, 'code_text', false),
            new ModuleTableField('translated', ModuleTableField.FIELD_TYPE_string, 'translated', false)
        ];

        let datatable = new ModuleTable(this, ImportTranslation.API_TYPE_ID, () => new ImportTranslation(), datatable_fields, null, "Import des traductions");
        ModuleDataImport.getInstance().registerImportableModuleTable(datatable);
        this.datatables.push(datatable);
    }
}
import AccessPolicyTools from "../../../../tools/AccessPolicyTools";
import ModuleDataImport from "../../../DataImport/ModuleDataImport";
import Module from "../../../Module";
import ModuleTable from "../../../ModuleTable";
import ModuleTableField from "../../../ModuleTableField";
import AnimationImportModuleVO from "./vos/AnimationImportModuleVO";


export default class ModuleAnimationImportModule extends Module {

    public static MODULE_NAME: string = "AnimationImportModule";

    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAnimationImportModule.MODULE_NAME + ".BO_ACCESS";

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleAnimationImportModule {
        if (!ModuleAnimationImportModule.instance) {
            ModuleAnimationImportModule.instance = new ModuleAnimationImportModule();
        }
        return ModuleAnimationImportModule.instance;
    }

    private static instance: ModuleAnimationImportModule = null;

    private constructor() {
        super(AnimationImportModuleVO.API_TYPE_ID, ModuleAnimationImportModule.MODULE_NAME, "Animation/import/Module");
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.intializeImport();
    }

    private intializeImport() {
        let datatable_fields = [

            new ModuleTableField('description', ModuleTableField.FIELD_TYPE_string, 'description', false),
            new ModuleTableField('messages', ModuleTableField.FIELD_TYPE_string, 'messages', false),

            new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'name', false),
            new ModuleTableField('computed_name', ModuleTableField.FIELD_TYPE_string, 'computed_name', false),
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_string, 'weight', false),

            new ModuleTableField('document_id', ModuleTableField.FIELD_TYPE_string, 'document_id', false),
            new ModuleTableField('role_id_ranges', ModuleTableField.FIELD_TYPE_string, 'role_id_ranges', false),

            new ModuleTableField('id_import', ModuleTableField.FIELD_TYPE_string, 'id_import', false),
            new ModuleTableField('theme_id_import', ModuleTableField.FIELD_TYPE_string, 'theme_id_import', false),
        ];


        let datatable = new ModuleTable(this, AnimationImportModuleVO.API_TYPE_ID, () => new AnimationImportModuleVO(), datatable_fields, null, "Import des traductions");
        ModuleDataImport.getInstance().registerImportableModuleTable(datatable);
        this.datatables.push(datatable);
    }
}
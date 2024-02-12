import AccessPolicyTools from "../../../../tools/AccessPolicyTools";
import ModuleDataImport from "../../../DataImport/ModuleDataImport";
import Module from "../../../Module";
import ModuleTable from "../../../ModuleTable";
import ModuleTableField from "../../../ModuleTableField";
import AnimationImportThemeVO from "./vos/AnimationImportThemeVO";


export default class ModuleAnimationImportTheme extends Module {

    public static MODULE_NAME: string = "AnimationImportTheme";

    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAnimationImportTheme.MODULE_NAME + ".BO_ACCESS";

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleAnimationImportTheme {
        if (!ModuleAnimationImportTheme.instance) {
            ModuleAnimationImportTheme.instance = new ModuleAnimationImportTheme();
        }
        return ModuleAnimationImportTheme.instance;
    }

    private static instance: ModuleAnimationImportTheme = null;

    private constructor() {
        super(AnimationImportThemeVO.API_TYPE_ID, ModuleAnimationImportTheme.MODULE_NAME, "Animation/import/Theme");
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.intializeImport();
    }

    private intializeImport() {


        let datatable_fields = [

            new ModuleTableField('description', ModuleTableField.FIELD_TYPE_string, 'description', false),
            new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'name', false),
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'weight', false),
            new ModuleTableField('id_import', ModuleTableField.FIELD_TYPE_string, 'id_import', false),
        ];

        let datatable = new ModuleTable(this, AnimationImportThemeVO.API_TYPE_ID, () => new AnimationImportThemeVO(), datatable_fields, null, "Import des themes");
        ModuleDataImport.getInstance().registerImportableModuleTable(datatable);
        this.datatables.push(datatable);


    }
}
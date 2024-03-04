import AccessPolicyTools from "../../../../tools/AccessPolicyTools";
import ModuleDataImport from "../../../DataImport/ModuleDataImport";
import Module from "../../../Module";
import ModuleTable from "../../../ModuleTable";
import ModuleTableField from "../../../ModuleTableField";
import AnimationImportQRVO from "./vos/AnimationImportQRVO";


export default class ModuleAnimationImportQR extends Module {

    public static MODULE_NAME: string = "AnimationImportQR";

    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAnimationImportQR.MODULE_NAME + ".BO_ACCESS";

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleAnimationImportQR {
        if (!ModuleAnimationImportQR.instance) {
            ModuleAnimationImportQR.instance = new ModuleAnimationImportQR();
        }
        return ModuleAnimationImportQR.instance;
    }

    private static instance: ModuleAnimationImportQR = null;

    private constructor() {
        super(AnimationImportQRVO.API_TYPE_ID, ModuleAnimationImportQR.MODULE_NAME, "Animation/import/QR");
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.intializeImport();
    }

    private intializeImport() {


        let datatable_fields = [
            new ModuleTableField('description', ModuleTableField.FIELD_TYPE_string, 'description', false),
            new ModuleTableField('reponses', ModuleTableField.FIELD_TYPE_string, 'reponses', false),
            new ModuleTableField('explicatif', ModuleTableField.FIELD_TYPE_string, 'explicatif', false),
            new ModuleTableField('external_video', ModuleTableField.FIELD_TYPE_string, 'external_video', false),

            new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'name', false),
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_string, 'weight', false),

            new ModuleTableField('question_file_id', ModuleTableField.FIELD_TYPE_string, 'question_file_id', false),
            new ModuleTableField('reponse_file_id', ModuleTableField.FIELD_TYPE_string, 'reponse_file_id', false),
            new ModuleTableField('module_id_import', ModuleTableField.FIELD_TYPE_string, 'module_id_import', false),
        ];


        let datatable = new ModuleTable(this, AnimationImportQRVO.API_TYPE_ID, () => new AnimationImportQRVO(), datatable_fields, null, "Import des traductions");
        ModuleDataImport.getInstance().registerImportableModuleTable(datatable);
        this.datatables.push(datatable);
    }
}
import AccessPolicyTools from "../../../../tools/AccessPolicyTools";
import { field_names } from "../../../../tools/ObjectHandler";
import ModuleDataImport from "../../../DataImport/ModuleDataImport";
import Module from "../../../Module";
import ModuleTableVO from "../../../ModuleTableVO";
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from "../../../ModuleTableFieldVO";
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
        this.intializeImport();
    }

    private intializeImport() {
        let datatable_fields = [

            ModuleTableFieldController.create_new(AnimationImportModuleVO.API_TYPE_ID, field_names<AnimationImportModuleVO>().description, ModuleTableFieldVO.FIELD_TYPE_string, 'description', false),
            ModuleTableFieldController.create_new(AnimationImportModuleVO.API_TYPE_ID, field_names<AnimationImportModuleVO>().messages, ModuleTableFieldVO.FIELD_TYPE_string, 'messages', false),

            ModuleTableFieldController.create_new(AnimationImportModuleVO.API_TYPE_ID, field_names<AnimationImportModuleVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'name', false),
            ModuleTableFieldController.create_new(AnimationImportModuleVO.API_TYPE_ID, field_names<AnimationImportModuleVO>().computed_name, ModuleTableFieldVO.FIELD_TYPE_string, 'computed_name', false),
            ModuleTableFieldController.create_new(AnimationImportModuleVO.API_TYPE_ID, field_names<AnimationImportModuleVO>().weight, ModuleTableFieldVO.FIELD_TYPE_string, 'weight', false),

            ModuleTableFieldController.create_new(AnimationImportModuleVO.API_TYPE_ID, field_names<AnimationImportModuleVO>().document_id, ModuleTableFieldVO.FIELD_TYPE_string, 'document_id', false),
            ModuleTableFieldController.create_new(AnimationImportModuleVO.API_TYPE_ID, field_names<AnimationImportModuleVO>().role_id_ranges, ModuleTableFieldVO.FIELD_TYPE_string, 'role_id_ranges', false),

            ModuleTableFieldController.create_new(AnimationImportModuleVO.API_TYPE_ID, field_names<AnimationImportModuleVO>().id_import, ModuleTableFieldVO.FIELD_TYPE_string, 'id_import', false),
            ModuleTableFieldController.create_new(AnimationImportModuleVO.API_TYPE_ID, field_names<AnimationImportModuleVO>().theme_id_import, ModuleTableFieldVO.FIELD_TYPE_string, 'theme_id_import', false),
        ];


        let datatable = new ModuleTableVO(this, AnimationImportModuleVO.API_TYPE_ID, () => new AnimationImportModuleVO(), datatable_fields, null, "Import des traductions");
        ModuleDataImport.getInstance().registerImportableModuleTable(datatable);
        this.datatables.push(datatable);
    }
}
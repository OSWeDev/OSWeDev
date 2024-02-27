import AccessPolicyTools from "../../../../tools/AccessPolicyTools";
import { field_names } from "../../../../tools/ObjectHandler";
import ModuleDataImport from "../../../DataImport/ModuleDataImport";
import Module from "../../../Module";
import ModuleTableVO from "../../../ModuleTableVO";
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from "../../../ModuleTableFieldVO";
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
        this.intializeImport();
    }

    private intializeImport() {


        const datatable_fields = [

            ModuleTableFieldController.create_new(AnimationImportThemeVO.API_TYPE_ID, field_names<AnimationImportThemeVO>().description, ModuleTableFieldVO.FIELD_TYPE_string, 'description', false),
            ModuleTableFieldController.create_new(AnimationImportThemeVO.API_TYPE_ID, field_names<AnimationImportThemeVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'name', false),
            ModuleTableFieldController.create_new(AnimationImportThemeVO.API_TYPE_ID, field_names<AnimationImportThemeVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'weight', false),
            ModuleTableFieldController.create_new(AnimationImportThemeVO.API_TYPE_ID, field_names<AnimationImportThemeVO>().id_import, ModuleTableFieldVO.FIELD_TYPE_string, 'id_import', false),
        ];

        const datatable = new ModuleTableVO(this, AnimationImportThemeVO.API_TYPE_ID, () => new AnimationImportThemeVO(), datatable_fields, null, "Import des themes");
        ModuleDataImport.getInstance().registerImportableModuleTable(datatable);
        this.datatables.push(datatable);


    }
}
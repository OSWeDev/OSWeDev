import AccessPolicyTools from "../../../../tools/AccessPolicyTools";
import { field_names } from "../../../../tools/ObjectHandler";
import ModuleDataImport from "../../../DataImport/ModuleDataImport";
import Module from "../../../Module";
import ModuleTableVO from "../../../ModuleTableVO";
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from "../../../ModuleTableFieldVO";
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
        this.intializeImport();
    }

    private intializeImport() {


        const datatable_fields = [
            ModuleTableFieldController.create_new(AnimationImportQRVO.API_TYPE_ID, field_names<AnimationImportQRVO>().description, ModuleTableFieldVO.FIELD_TYPE_string, 'description', false),
            ModuleTableFieldController.create_new(AnimationImportQRVO.API_TYPE_ID, field_names<AnimationImportQRVO>().reponses, ModuleTableFieldVO.FIELD_TYPE_string, 'reponses', false),
            ModuleTableFieldController.create_new(AnimationImportQRVO.API_TYPE_ID, field_names<AnimationImportQRVO>().explicatif, ModuleTableFieldVO.FIELD_TYPE_string, 'explicatif', false),
            ModuleTableFieldController.create_new(AnimationImportQRVO.API_TYPE_ID, field_names<AnimationImportQRVO>().external_video, ModuleTableFieldVO.FIELD_TYPE_string, 'external_video', false),

            ModuleTableFieldController.create_new(AnimationImportQRVO.API_TYPE_ID, field_names<AnimationImportQRVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'name', false),
            ModuleTableFieldController.create_new(AnimationImportQRVO.API_TYPE_ID, field_names<AnimationImportQRVO>().weight, ModuleTableFieldVO.FIELD_TYPE_string, 'weight', false),

            ModuleTableFieldController.create_new(AnimationImportQRVO.API_TYPE_ID, field_names<AnimationImportQRVO>().question_file_id, ModuleTableFieldVO.FIELD_TYPE_string, 'question_file_id', false),
            ModuleTableFieldController.create_new(AnimationImportQRVO.API_TYPE_ID, field_names<AnimationImportQRVO>().reponse_file_id, ModuleTableFieldVO.FIELD_TYPE_string, 'reponse_file_id', false),
            ModuleTableFieldController.create_new(AnimationImportQRVO.API_TYPE_ID, field_names<AnimationImportQRVO>().module_id_import, ModuleTableFieldVO.FIELD_TYPE_string, 'module_id_import', false),
        ];


        const datatable = new ModuleTableVO(this, AnimationImportQRVO.API_TYPE_ID, () => new AnimationImportQRVO(), datatable_fields, null, "Import des traductions");
        ModuleDataImport.getInstance().registerImportableModuleTable(datatable);
        this.datatables.push(datatable);
    }
}
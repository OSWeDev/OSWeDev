import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import String2ParamVO, { String2ParamVOStatic } from '../API/vos/apis/String2ParamVO';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import Module from '../Module';
import ModuleTableVO from '../DAO/vos/ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import SupervisedCRONController from './SupervisedCRONController';
import SupervisionController from './SupervisionController';
import SupervisedCategoryVO from './vos/SupervisedCategoryVO';
import SupervisedCRONVO from './vos/SupervisedCRONVO';
import ModuleTableController from '../DAO/ModuleTableController';

export default class ModuleSupervision extends Module {

    public static MODULE_NAME: string = "Supervision";

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleSupervision.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleSupervision.MODULE_NAME + ".BO_ACCESS";

    public static APINAME_execute_manually: string = 'execute_manually';
    public static APINAME_refresh_one_manually: string = 'refresh_one_manually';

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleSupervision {
        if (!ModuleSupervision.instance) {
            ModuleSupervision.instance = new ModuleSupervision();
        }
        return ModuleSupervision.instance;
    }

    private static instance: ModuleSupervision = null;

    public execute_manually: (api_type_id: string) => void = APIControllerWrapper.sah(ModuleSupervision.APINAME_execute_manually);
    public refresh_one_manually: (api_type_id: string, name: string) => void = APIControllerWrapper.sah(ModuleSupervision.APINAME_refresh_one_manually);

    private constructor() {

        super("supervision", ModuleSupervision.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {
        APIControllerWrapper.registerApi(new PostAPIDefinition<StringParamVO, void>(
            ModuleSupervision.POLICY_BO_ACCESS,
            ModuleSupervision.APINAME_execute_manually,
            (param: StringParamVO) => [param.text],
            StringParamVOStatic
        ));
        APIControllerWrapper.registerApi(new PostAPIDefinition<String2ParamVO, void>(
            ModuleSupervision.POLICY_BO_ACCESS,
            ModuleSupervision.APINAME_refresh_one_manually,
            (param: String2ParamVO) => [param.text],
            String2ParamVOStatic
        ));
    }

    public initialize() {
        this.initializeSupervisedCategoryVO();
        this.initializeSupervisedCRONVO();
    }

    private initializeSupervisedCategoryVO() {
        const name_field = ModuleTableFieldController.create_new(SupervisedCategoryVO.API_TYPE_ID, field_names<SupervisedCategoryVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, "Nom", true);

        const fields = [
            name_field,
            ModuleTableFieldController.create_new(SupervisedCategoryVO.API_TYPE_ID, field_names<SupervisedCategoryVO>().notify, ModuleTableFieldVO.FIELD_TYPE_boolean, "Notification", true, true, false),
        ];

        const datatable = ModuleTableController.create_new(this.name, SupervisedCategoryVO, name_field, "Supervision - Catégorie");
    }

    private initializeSupervisedCRONVO() {

        const fields = [
            ModuleTableFieldController.create_new(SupervisedCRONVO.API_TYPE_ID, field_names<SupervisedCRONVO>().planification_uid, ModuleTableFieldVO.FIELD_TYPE_string, "Planification UID", true),
            ModuleTableFieldController.create_new(SupervisedCRONVO.API_TYPE_ID, field_names<SupervisedCRONVO>().worker_uid, ModuleTableFieldVO.FIELD_TYPE_string, "Worker UID", true),
        ];

        const datatable = ModuleTableController.create_new(this.name, SupervisedCRONVO, null, "Supervision - CRON");
        SupervisionController.getInstance().registerModuleTable(datatable, SupervisedCRONController.getInstance());
    }
}
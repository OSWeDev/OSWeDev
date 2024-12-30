import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import String2ParamVO, { String2ParamVOStatic } from '../API/vos/apis/String2ParamVO';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import Module from '../Module';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import SupervisedCRONController from './SupervisedCRONController';
import SupervisionController from './SupervisionController';
import SupervisedCategoryVO from './vos/SupervisedCategoryVO';
import SupervisedCRONVO from './vos/SupervisedCRONVO';
import ModuleTableController from '../DAO/ModuleTableController';
import SupervisedProbeVO from './vos/SupervisedProbeVO';
import SupervisionProbeStateDataRangesVO from './vars/vos/SupervisionProbeStateDataRangesVO';
import NumSegment from '../DataRender/vos/NumSegment';
import VarsInitController from '../Var/VarsInitController';

export default class ModuleSupervision extends Module {

    public static MODULE_NAME: string = "Supervision";

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleSupervision.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleSupervision.MODULE_NAME + ".BO_ACCESS";
    public static POLICY_FO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleSupervision.MODULE_NAME + ".FO_ACCESS";

    public static APINAME_execute_manually: string = 'execute_manually';
    public static APINAME_refresh_one_manually: string = 'refresh_one_manually';

    private static instance: ModuleSupervision = null;

    public execute_manually: (api_type_id: string) => void = APIControllerWrapper.sah(ModuleSupervision.APINAME_execute_manually);
    public refresh_one_manually: (api_type_id: string, name: string) => void = APIControllerWrapper.sah(ModuleSupervision.APINAME_refresh_one_manually);

    private constructor() {

        super("supervision", ModuleSupervision.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleSupervision {
        if (!ModuleSupervision.instance) {
            ModuleSupervision.instance = new ModuleSupervision();
        }
        return ModuleSupervision.instance;
    }


    public registerApis() {
        APIControllerWrapper.registerApi(new PostAPIDefinition<StringParamVO, void>(
            ModuleSupervision.POLICY_FO_ACCESS,
            ModuleSupervision.APINAME_execute_manually,
            (param: StringParamVO) => [param.text],
            StringParamVOStatic
        ));
        APIControllerWrapper.registerApi(new PostAPIDefinition<String2ParamVO, void>(
            ModuleSupervision.POLICY_FO_ACCESS,
            ModuleSupervision.APINAME_refresh_one_manually,
            (param: String2ParamVO) => [param.text],
            String2ParamVOStatic
        ));
    }

    public initialize() {
        this.initializeSupervisedCategoryVO();
        this.initializeSupervisedCRONVO();
        this.initializeSuperviseProbeVO();

        this.initializeSupervisionProbeStateDataRangesVO();
    }

    private initializeSupervisedCategoryVO() {
        const name_field = ModuleTableFieldController.create_new(SupervisedCategoryVO.API_TYPE_ID, field_names<SupervisedCategoryVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, "Nom", true);

        const fields = [
            name_field,
            ModuleTableFieldController.create_new(SupervisedCategoryVO.API_TYPE_ID, field_names<SupervisedCategoryVO>().notify, ModuleTableFieldVO.FIELD_TYPE_boolean, "Notification", true, true, false),
            ModuleTableFieldController.create_new(SupervisedCategoryVO.API_TYPE_ID, field_names<SupervisedCategoryVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', false),
        ];

        const datatable = ModuleTableController.create_new(this.name, SupervisedCategoryVO, name_field, "Supervision - Catégorie");
    }

    private initializeSupervisedCRONVO() {

        ModuleTableFieldController.create_new(SupervisedCRONVO.API_TYPE_ID, field_names<SupervisedCRONVO>().planification_uid, ModuleTableFieldVO.FIELD_TYPE_string, "Planification UID", true);
        ModuleTableFieldController.create_new(SupervisedCRONVO.API_TYPE_ID, field_names<SupervisedCRONVO>().worker_uid, ModuleTableFieldVO.FIELD_TYPE_string, "Worker UID", true);

        SupervisionController.getInstance().registerModuleTable(
            ModuleTableController.create_new(this.name, SupervisedCRONVO, null, "Supervision - CRON"),
            SupervisedCRONController.getInstance());
    }

    private initializeSuperviseProbeVO() {
        const sup_item_api_type_id_field = ModuleTableFieldController.create_new(SupervisedProbeVO.API_TYPE_ID, field_names<SupervisedProbeVO>().sup_item_api_type_id, ModuleTableFieldVO.FIELD_TYPE_string, "api_type_id d'item de supervision", true).unique();
        const category_id_field = ModuleTableFieldController.create_new(SupervisedProbeVO.API_TYPE_ID, field_names<SupervisedProbeVO>().category_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Catégorie').set_many_to_one_target_moduletable_name(
            SupervisedCategoryVO.API_TYPE_ID
        );

        const fields = [
            sup_item_api_type_id_field,
            ModuleTableFieldController.create_new(SupervisedProbeVO.API_TYPE_ID, field_names<SupervisedProbeVO>().notify, ModuleTableFieldVO.FIELD_TYPE_boolean, "Notification", true, true, false),
            category_id_field,
            ModuleTableFieldController.create_new(SupervisedProbeVO.API_TYPE_ID, field_names<SupervisedProbeVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', false),
        ];
        const datatable = ModuleTableController.create_new(this.name, SupervisedProbeVO, sup_item_api_type_id_field, "Supervision - Sonde");
    }

    private initializeSupervisionProbeStateDataRangesVO() {

        const probe_id_ranges = ModuleTableFieldController.create_new(SupervisionProbeStateDataRangesVO.API_TYPE_ID, field_names<SupervisionProbeStateDataRangesVO>().probe_id_ranges, ModuleTableFieldVO.FIELD_TYPE_numrange_array, 'sondes', true).set_segmentation_type(NumSegment.TYPE_INT);
        const datatable_fields = [
            probe_id_ranges,
            ModuleTableFieldController.create_new(SupervisionProbeStateDataRangesVO.API_TYPE_ID, field_names<SupervisionProbeStateDataRangesVO>().state_id_ranges, ModuleTableFieldVO.FIELD_TYPE_numrange_array, 'état (0 à 6)', true).set_segmentation_type(NumSegment.TYPE_INT)
        ];

        VarsInitController.getInstance().register_var_data(SupervisionProbeStateDataRangesVO.API_TYPE_ID, SupervisionProbeStateDataRangesVO, this);
        probe_id_ranges.set_many_to_one_target_moduletable_name(SupervisedProbeVO.API_TYPE_ID);
    }
}
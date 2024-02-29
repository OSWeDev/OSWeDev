import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import Module from '../Module';
import DAGBuilderEdgeVO from './vos/DAGBuilderEdgeVO';
import DAGBuilderNodeVO from './vos/DAGBuilderNodeVO';

/**
 * Adapted From https://github.com/AlexImb/vue-dag
 */
export default class ModuleDAGBuilder extends Module {

    public static MODULE_NAME: string = "DAGBuilder";

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleDAGBuilder.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleDAGBuilder.MODULE_NAME + ".BO_ACCESS";

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleDAGBuilder {
        if (!ModuleDAGBuilder.instance) {
            ModuleDAGBuilder.instance = new ModuleDAGBuilder();
        }
        return ModuleDAGBuilder.instance;
    }

    private static instance: ModuleDAGBuilder = null;

    private constructor() {

        super("dagbuilder", ModuleDAGBuilder.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.init_DAGBuilderNodeVO();
        this.init_DAGBuilderEdgeVO();
    }

    private init_DAGBuilderNodeVO() {

        const datatable_fields = [
            ModuleTableFieldController.create_new(DAGBuilderNodeVO.API_TYPE_ID, field_names<DAGBuilderNodeVO>().x, ModuleTableFieldVO.FIELD_TYPE_float, 'x', true),
            ModuleTableFieldController.create_new(DAGBuilderNodeVO.API_TYPE_ID, field_names<DAGBuilderNodeVO>().y, ModuleTableFieldVO.FIELD_TYPE_float, 'y', true),
            ModuleTableFieldController.create_new(DAGBuilderNodeVO.API_TYPE_ID, field_names<DAGBuilderNodeVO>().component, ModuleTableFieldVO.FIELD_TYPE_string, 'component', false),
            ModuleTableFieldController.create_new(DAGBuilderNodeVO.API_TYPE_ID, field_names<DAGBuilderNodeVO>().content, ModuleTableFieldVO.FIELD_TYPE_string, 'content', false),
            ModuleTableFieldController.create_new(DAGBuilderNodeVO.API_TYPE_ID, field_names<DAGBuilderNodeVO>().props_json, ModuleTableFieldVO.FIELD_TYPE_string, 'props_json', false)
        ];

        const datatable = ModuleTableController.create_new(this.name, DAGBuilderNodeVO, null, "DAGBuilder Node");
    }

    private init_DAGBuilderEdgeVO() {
        const from = ModuleTableFieldController.create_new(DAGBuilderEdgeVO.API_TYPE_ID, field_names<DAGBuilderEdgeVO>().from, ModuleTableFieldVO.FIELD_TYPE_string, 'from', true);
        const to = ModuleTableFieldController.create_new(DAGBuilderEdgeVO.API_TYPE_ID, field_names<DAGBuilderEdgeVO>().to, ModuleTableFieldVO.FIELD_TYPE_string, 'to', true);

        const datatable_fields = [
            from,
            to,
            ModuleTableFieldController.create_new(DAGBuilderEdgeVO.API_TYPE_ID, field_names<DAGBuilderEdgeVO>().fromLink, ModuleTableFieldVO.FIELD_TYPE_string, 'fromLink', false),
            ModuleTableFieldController.create_new(DAGBuilderEdgeVO.API_TYPE_ID, field_names<DAGBuilderEdgeVO>().toLink, ModuleTableFieldVO.FIELD_TYPE_string, 'toLink', false),
            ModuleTableFieldController.create_new(DAGBuilderEdgeVO.API_TYPE_ID, field_names<DAGBuilderEdgeVO>().edgeColor, ModuleTableFieldVO.FIELD_TYPE_string, 'edgeColor', false),
            ModuleTableFieldController.create_new(DAGBuilderEdgeVO.API_TYPE_ID, field_names<DAGBuilderEdgeVO>().arrowColor, ModuleTableFieldVO.FIELD_TYPE_string, 'arrowColor', false),
        ];

        const datatable = ModuleTableController.create_new(this.name, DAGBuilderEdgeVO, null, "DAGBuilder Edge");
        from.set_many_to_one_target_moduletable_name(DAGBuilderNodeVO.API_TYPE_ID);
        to.set_many_to_one_target_moduletable_name(DAGBuilderNodeVO.API_TYPE_ID);
    }
}
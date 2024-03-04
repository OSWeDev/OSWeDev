import AccessPolicyTools from '../../tools/AccessPolicyTools';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
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
        this.fields = [];
        this.datatables = [];

        this.init_DAGBuilderNodeVO();
        this.init_DAGBuilderEdgeVO();
    }

    private init_DAGBuilderNodeVO() {

        let datatable_fields = [
            new ModuleTableField('x', ModuleTableField.FIELD_TYPE_float, 'x', true),
            new ModuleTableField('y', ModuleTableField.FIELD_TYPE_float, 'y', true),
            new ModuleTableField('component', ModuleTableField.FIELD_TYPE_string, 'component', false),
            new ModuleTableField('content', ModuleTableField.FIELD_TYPE_string, 'content', false),
            new ModuleTableField('props_json', ModuleTableField.FIELD_TYPE_string, 'props_json', false)
        ];

        let datatable = new ModuleTable(this, DAGBuilderNodeVO.API_TYPE_ID, () => new DAGBuilderNodeVO(), datatable_fields, null, "DAGBuilder Node");
    }

    private init_DAGBuilderEdgeVO() {
        this.fields = [];
        this.datatables = [];

        let from = new ModuleTableField('from', ModuleTableField.FIELD_TYPE_string, 'from', true);
        let to = new ModuleTableField('to', ModuleTableField.FIELD_TYPE_string, 'to', true);

        let datatable_fields = [
            from,
            to,
            new ModuleTableField('fromLink', ModuleTableField.FIELD_TYPE_string, 'fromLink', false),
            new ModuleTableField('toLink', ModuleTableField.FIELD_TYPE_string, 'toLink', false),
            new ModuleTableField('edgeColor', ModuleTableField.FIELD_TYPE_string, 'edgeColor', false),
            new ModuleTableField('arrowColor', ModuleTableField.FIELD_TYPE_string, 'arrowColor', false),
        ];

        let datatable = new ModuleTable(this, DAGBuilderEdgeVO.API_TYPE_ID, () => new DAGBuilderEdgeVO(), datatable_fields, null, "DAGBuilder Edge");
        from.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[DAGBuilderNodeVO.API_TYPE_ID]);
        to.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[DAGBuilderNodeVO.API_TYPE_ID]);
    }
}
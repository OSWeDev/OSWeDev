import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import ModuleAccessPolicy from '../AccessPolicy/ModuleAccessPolicy';
import DAOController from '../DAO/DAOController';
import ModuleDAO from '../DAO/ModuleDAO';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import Module from '../Module';
import VersionedVOController from '../Versioned/VersionedVOController';


export default class ModuleWorkflowsBuilder extends Module {
    public static MODULE_NAME: string = 'WorkflowsBuilder';

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleWorkflowsBuilder.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleWorkflowsBuilder.MODULE_NAME + ".BO_ACCESS";
    private static instance: ModuleWorkflowsBuilder = null;
    private constructor() {
        super("workflowsbuilder", ModuleWorkflowsBuilder.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleWorkflowsBuilder {
        if (!ModuleWorkflowsBuilder.instance) {
            ModuleWorkflowsBuilder.instance = new ModuleWorkflowsBuilder();
        }
        return ModuleWorkflowsBuilder.instance;
    }


    public registerApis() {

    }

    public initialize() {

        // this.initializeWorkflowsPageVO();
    }

    // private initializeWorkflowsPageVO() {

    //     const name = ModuleTableFieldController.create_new(WorkflowsPageVO.API_TYPE_ID, field_names<WorkflowsPageVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Titre', true);
    //     const menu_parent_id = ModuleTableFieldController.create_new(WorkflowsPageVO.API_TYPE_ID, field_names<WorkflowsPageVO>().menu_parent_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Lien parent', false);

    //     const fields = [
    //         name,
    //         menu_parent_id,

    //         ModuleTableFieldController.create_new(WorkflowsPageVO.API_TYPE_ID, field_names<WorkflowsPageVO>().access_policy_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Clé du droit d\'accès', false, true, ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS),
    //     ];

    //     const table = ModuleTableController.create_new(this.name, WorkflowsPageVO, name, 'Menus');

    //     menu_parent_id.set_many_to_one_target_moduletable_name(table.vo_type);

    //     VersionedVOController.getInstance().registerModuleTable(table);
    // }
}
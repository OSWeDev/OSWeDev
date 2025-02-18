import ModuleWorkflowsBuilder from '../../../../shared/modules/WorkflowsBuilder/ModuleWorkflowsBuilder';
import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import VueAppController from '../../../VueAppController';
import CRUDComponentManager from '../crud/CRUDComponentManager';
import MenuController from '../menu/MenuController';
import WorkflowsBuilderVueModuleBase from './WorkflowsBuilderVueModuleBase';

export default class WorkflowsBuilderAdminVueModule extends WorkflowsBuilderVueModuleBase {
    protected static instance: WorkflowsBuilderAdminVueModule = null;
    protected constructor() {

        super();

        if (!this.policies_needed) {
            this.policies_needed = [
                ModuleWorkflowsBuilder.POLICY_BO_ACCESS
            ];
        } else if (this.policies_needed.indexOf(ModuleWorkflowsBuilder.POLICY_BO_ACCESS) < 0) {
            this.policies_needed.push(ModuleWorkflowsBuilder.POLICY_BO_ACCESS);
        }
    }
    // istanbul ignore next: nothing to test
    public static getInstance(): WorkflowsBuilderAdminVueModule {
        if (!WorkflowsBuilderAdminVueModule.instance) {
            WorkflowsBuilderAdminVueModule.instance = new WorkflowsBuilderAdminVueModule();
        }

        return WorkflowsBuilderAdminVueModule.instance;
    }


    public async initializeAsync() {

        await super.initializeAsync();

        if (!this.policies_loaded[ModuleWorkflowsBuilder.POLICY_BO_ACCESS]) {
            return;
        }
    }
}
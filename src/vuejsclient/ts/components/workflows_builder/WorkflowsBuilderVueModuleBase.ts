import ModuleWorkflowsBuilder from '../../../../shared/modules/WorkflowsBuilder/ModuleWorkflowsBuilder';
import VueModuleBase from '../../modules/VueModuleBase';
import WorkflowsBuilderController from './WorkflowsBuilderController';
export default class WorkflowsBuilderVueModuleBase extends VueModuleBase {

    protected static instance: WorkflowsBuilderVueModuleBase = null;

    protected constructor() {

        super(ModuleWorkflowsBuilder.getInstance().name);

        if (!this.policies_needed) {
            this.policies_needed = [
                ModuleWorkflowsBuilder.POLICY_BO_ACCESS
            ];
        } else if (this.policies_needed.indexOf(ModuleWorkflowsBuilder.POLICY_BO_ACCESS) < 0) {
            this.policies_needed.push(ModuleWorkflowsBuilder.POLICY_BO_ACCESS);
        }
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): WorkflowsBuilderVueModuleBase {
        if (!WorkflowsBuilderVueModuleBase.instance) {
            WorkflowsBuilderVueModuleBase.instance = new WorkflowsBuilderVueModuleBase();
        }

        return WorkflowsBuilderVueModuleBase.instance;
    }

    public async initializeAsync() {
        if (!this.policies_loaded[ModuleWorkflowsBuilder.POLICY_BO_ACCESS]) {
            return;
        }

        let url: string = "/workflows/view/:workflows_id";
        let main_route_name: string = 'Workflows View';


        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import('./viewer/WorkflowsViewerComponent'),
            props: (route) => ({
                workflows_id: null
            })
        });

        url = "/workflows_builder";
        main_route_name = 'WorkflowsBuilder';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import('./component/WorkflowsBuilderComponent'),
            props: (route) => ({
                workflows_id: null
            })
        });

        url = "/workflows_builder" + "/:workflows_id";
        main_route_name = 'WorkflowsBuilder_id';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import('./component/WorkflowsBuilderComponent'),
            props: (route) => ({
                workflows_id: null
            })
        });

    }
}
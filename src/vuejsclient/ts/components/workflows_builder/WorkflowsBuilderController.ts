

export default class WorkflowsBuilderController {

    private static instance: WorkflowsBuilderController;
    public access_by_name: { [policy_name: string]: boolean } = {};

    public callback_reload_menus = null;

    // istanbul ignore next: nothing to test
    public static getInstance(): WorkflowsBuilderController {
        if (!WorkflowsBuilderController.instance) {
            WorkflowsBuilderController.instance = new WorkflowsBuilderController();
        }
        return WorkflowsBuilderController.instance;
    }

}
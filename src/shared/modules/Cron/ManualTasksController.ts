
export default class ManualTasksController {

    // istanbul ignore next: nothing to test
    public static getInstance(): ManualTasksController {
        if (!ManualTasksController.instance) {
            ManualTasksController.instance = new ManualTasksController();
        }
        return ManualTasksController.instance;
    }

    private static instance: ManualTasksController = null;

    public registered_manual_tasks_by_name: { [name: string]: () => Promise<any> } = {};

    private constructor() { }
}
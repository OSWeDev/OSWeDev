
/**
 * RegisteredForkedTasksController
 */
export default class RegisteredForkedTasksController {

    /**
     * Local thread cache -----
     */
    public static registered_tasks: { [task_uid: string]: (...task_params) => unknown } = {};

    public static register_task(task_uid: string, handler: (...task_params) => unknown) {
        RegisteredForkedTasksController.registered_tasks[task_uid] = handler;
    }
}
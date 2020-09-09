
export default class SupervisionController {

    public static STATE_LABELS: string[] = ['supervision.STATE_ERROR', 'supervision.STATE_ERROR_READ', 'supervision.STATE_WARN', 'supervision.STATE_WARN_READ', 'supervision.STATE_OK', 'supervision.STATE_PAUSED', 'supervision.STATE_UNKOWN'];
    public static STATE_ERROR = 0;
    public static STATE_ERROR_READ = 1;
    public static STATE_WARN = 2;
    public static STATE_WARN_READ = 3;
    public static STATE_OK = 4;
    public static STATE_PAUSED = 5;
    public static STATE_UNKOWN = 6;

    public static getInstance(): SupervisionController {
        if (!SupervisionController.instance) {
            SupervisionController.instance = new SupervisionController();
        }
        return SupervisionController.instance;
    }

    private static instance: SupervisionController = null;

    private registered_api_type_by_ids: { [api_type_id: string]: boolean } = {};

    private constructor() { }

    get registered_api_types(): { [api_type_id: string]: boolean } {
        return this.registered_api_type_by_ids;
    }

    public register_api_type(api_type_id: string) {
        this.registered_api_type_by_ids[api_type_id] = true;
    }
}
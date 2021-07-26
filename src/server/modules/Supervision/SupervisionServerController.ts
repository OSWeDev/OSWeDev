import ISupervisedItemServerController from './interfaces/ISupervisedItemServerController';

export default class SupervisionServerController {

    public static getInstance(): SupervisionServerController {
        if (!SupervisionServerController.instance) {
            SupervisionServerController.instance = new SupervisionServerController();
        }
        return SupervisionServerController.instance;
    }

    private static instance: SupervisionServerController = null;

    private registered_api_type_by_ids: { [api_type_id: string]: ISupervisedItemServerController<any> } = {};

    private constructor() { }

    public registerServerController(api_type_id: string, controller: ISupervisedItemServerController<any>) {
        this.registered_api_type_by_ids[api_type_id] = controller;
    }

    get registered_controllers(): { [api_type_id: string]: ISupervisedItemServerController<any> } {
        return this.registered_api_type_by_ids;
    }
}
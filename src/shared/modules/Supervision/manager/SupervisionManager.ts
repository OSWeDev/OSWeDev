import SupervisionController from "../SupervisionController";

/**
 * @class SupervisionManager
 *  - This class is responsible for managing the supervision vo
 */
export default class SupervisionManager {

    /**
     * load_all_supervision_api_type_ids
     * - This method is responsible for loading all the supervision api type ids
     *
     * @returns {string[]}
     */
    public static load_all_supervision_api_type_ids(
        options: { load_actifs: boolean } = { load_actifs: true }
    ): string[] {
        let available_api_type_ids: string[] = [];

        const registerd_controllers = SupervisionController.getInstance().registered_controllers;

        const has_registerd_controllers: boolean = Object.keys(registerd_controllers).length > 0;

        if (!has_registerd_controllers) {
            return null;
        }

        for (const api_type_id in registerd_controllers) {
            if (options.load_actifs && registerd_controllers[api_type_id].is_actif()) {
                available_api_type_ids.push(api_type_id);
            } else {
                available_api_type_ids.push(api_type_id);
            }
        }

        return available_api_type_ids;
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): SupervisionManager {
        if (!SupervisionManager.instance) {
            SupervisionManager.instance = new SupervisionManager();
        }

        return SupervisionManager.instance;
    }

    private static instance: SupervisionManager;


}
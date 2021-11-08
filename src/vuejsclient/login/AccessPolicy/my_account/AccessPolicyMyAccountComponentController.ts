
export default class AccessPolicyMyAccountComponentController {
    public static getInstance() {

        if (!AccessPolicyMyAccountComponentController.instance) {
            AccessPolicyMyAccountComponentController.instance = new AccessPolicyMyAccountComponentController();
        }
        return AccessPolicyMyAccountComponentController.instance;
    }

    private static instance: AccessPolicyMyAccountComponentController;

    public registered_components: any[] = [];

    public registerComponent(component) {
        this.registered_components.push(component);
    }
}
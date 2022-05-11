
export default class AccessPolicyMyAccountComponentController {
    public static getInstance() {

        if (!AccessPolicyMyAccountComponentController.instance) {
            AccessPolicyMyAccountComponentController.instance = new AccessPolicyMyAccountComponentController();
        }
        return AccessPolicyMyAccountComponentController.instance;
    }

    private static instance: AccessPolicyMyAccountComponentController;

    public registered_components: any[] = [];
    public show_firstname_field: boolean = true;
    public show_lastname_field: boolean = true;

    public registerComponent(component) {
        this.registered_components.push(component);
    }
}
import VueComponentBase from './VueComponentBase';

export default class VueComponentsManager {
    public static getInstance(): VueComponentsManager {
        if (!VueComponentsManager.instance) {
            VueComponentsManager.instance = new VueComponentsManager();
        }
        return VueComponentsManager.instance;
    }

    private static instance: VueComponentsManager;

    public registered_vue_components: { [name: string]: VueComponentBase };

    private constructor() {
        this.registered_vue_components = {};
    }

    // public registerVueComponent(component: VueComponentBase) {
    //     this.registered_vue_components[component.name] = component;
    // }
}
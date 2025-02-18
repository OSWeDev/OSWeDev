import { StatThisMapKeys } from '../../../shared/modules/Stats/annotations/StatThisMapKeys';
import VueComponentBase from './VueComponentBase';

export default class VueComponentsManager {
    private static instance: VueComponentsManager;

    @StatThisMapKeys('VueComponentsManager', VueComponentsManager.getInstance)
    public registered_vue_components: { [name: string]: VueComponentBase };

    private constructor() {
        this.registered_vue_components = {};
    }

    public static getInstance(): VueComponentsManager {
        if (!VueComponentsManager.instance) {
            VueComponentsManager.instance = new VueComponentsManager();
        }
        return VueComponentsManager.instance;
    }

    // public registerVueComponent(component: VueComponentBase) {
    //     this.registered_vue_components[component.name] = component;
    // }
}
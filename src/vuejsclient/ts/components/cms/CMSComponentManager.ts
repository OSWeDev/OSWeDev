import Vue, { VueConstructor } from 'vue';
import ICMSComponentTemplateVue from './interfaces/ICMSComponentTemplateVue';

export default class CMSComponentManager {

    public static getInstance() {

        if (!CMSComponentManager.instance) {
            CMSComponentManager.instance = new CMSComponentManager();
        }
        return CMSComponentManager.instance;
    }

    private static instance: CMSComponentManager;

    public template_component_vue_by_type_id: { [api_type_id: string]: VueConstructor<ICMSComponentTemplateVue> } = {};

    public registerCMSTemplateComponent(type_id: string, vueComponent: VueConstructor<ICMSComponentTemplateVue>) {
        if (!this.template_component_vue_by_type_id[type_id]) {
            this.template_component_vue_by_type_id[type_id] = vueComponent;
        }
    }
}
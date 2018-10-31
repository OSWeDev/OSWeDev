import { Component } from "vue-property-decorator";
import ModuleAccessPolicy from "../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import ModuleTranslation from "../../../../../shared/modules/Translation/ModuleTranslation";
import VueComponentBase from "../../../../ts/components/VueComponentBase";
import './OnPageTranslation.scss';

@Component({
    template: require('./OnPageTranslation.pug')
})
export default class OnPageTranslation extends VueComponentBase {

    private right: boolean = false;
    private isOpened: boolean = false;

    public async mounted() {
        this.right = await ModuleAccessPolicy.getInstance().checkAccess(ModuleTranslation.ACCESS_GROUP_NAME, ModuleTranslation.ACCESS_ON_PAGE_TRANSLATION_MODULE);
    }

    get isActive(): boolean {
        return ModuleTranslation.getInstance().actif && this.right;
    }

    private openModule() {
        this.isOpened = true;
    }

    private closeModule() {
        this.isOpened = false;
    }
}
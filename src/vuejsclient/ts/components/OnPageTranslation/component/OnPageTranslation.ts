import { Component } from "vue-property-decorator";
import ModuleAccessPolicy from "../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import ModuleTranslation from "../../../../../shared/modules/Translation/ModuleTranslation";
import VueComponentBase from "../../../../ts/components/VueComponentBase";
import './OnPageTranslation.scss';
import VueAppController from '../../../../VueAppController';

@Component({
    template: require('./OnPageTranslation.pug')
})
export default class OnPageTranslation extends VueComponentBase {

    private isOpened: boolean = false;

    get isActive(): boolean {
        return ModuleTranslation.getInstance().actif && VueAppController.getInstance().has_access_to_onpage_translation;
    }

    private openModule() {
        this.isOpened = true;
    }

    private closeModule() {
        this.isOpened = false;
    }
}
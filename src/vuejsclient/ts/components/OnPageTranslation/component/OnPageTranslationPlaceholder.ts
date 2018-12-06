import { Component } from "vue-property-decorator";
import VueComponentBase from "../../../../ts/components/VueComponentBase";

/**
 * In case the user doesn't have access to this feature, don't load full component
 */
@Component({
    template: require('./OnPageTranslationPlaceholder.pug')
})
export default class OnPageTranslationPlaceholder extends VueComponentBase {
}
import { Component } from "vue-property-decorator";
import AnimationThemeVO from "../../../../../../shared/modules/Animation/vos/AnimationThemeVO";
import ModuleDAO from "../../../../../../shared/modules/DAO/ModuleDAO";
import VueComponentBase from '../../../VueComponentBase';
import './animation.scss';

@Component({
    template: require("./animation.pug"),
    components: {}
})
export default class VueAnimationComponent extends VueComponentBase {

    private themes: AnimationThemeVO[] = null;

    private async mounted() {
        this.themes = await ModuleDAO.getInstance().getVos<AnimationThemeVO>(AnimationThemeVO.API_TYPE_ID);
    }
}
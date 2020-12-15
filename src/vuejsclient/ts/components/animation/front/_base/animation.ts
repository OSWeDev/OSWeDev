import { Component } from "vue-property-decorator";
import AnimationController from "../../../../../../shared/modules/Animation/AnimationController";
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

    private get_route_theme(theme: AnimationThemeVO) {
        return {
            name: AnimationController.ROUTE_NAME_ANIMATION_THEME,
            params: {
                theme_id: theme.id.toString(),
            }
        };
    }

    get ordered_themes(): AnimationThemeVO[] {
        return this.themes ? this.themes.sort((a, b) => a.weight - b.weight) : null;
    }
}
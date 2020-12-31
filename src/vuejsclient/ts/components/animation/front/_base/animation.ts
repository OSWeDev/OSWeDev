import { Component } from "vue-property-decorator";
import AnimationModuleVO from "../../../../../../shared/modules/Animation/vos/AnimationModuleVO";
import AnimationThemeVO from "../../../../../../shared/modules/Animation/vos/AnimationThemeVO";
import ModuleDAO from "../../../../../../shared/modules/DAO/ModuleDAO";
import VueComponentBase from '../../../VueComponentBase';
import VueAnimationThemeComponent from "../theme/theme";
import './animation.scss';

@Component({
    template: require("./animation.pug"),
    components: {
        Animationtheme: VueAnimationThemeComponent
    }
})
export default class VueAnimationComponent extends VueComponentBase {

    private themes: AnimationThemeVO[] = null;
    private modules_by_themes: { [theme_id: number]: AnimationModuleVO[] } = {};

    private async mounted() {
        let promises = [];

        promises.push((async () => this.themes = await ModuleDAO.getInstance().getVos<AnimationThemeVO>(AnimationThemeVO.API_TYPE_ID))());
        promises.push((async () => {
            let animation_modules: AnimationModuleVO[] = await ModuleDAO.getInstance().getVos<AnimationModuleVO>(AnimationModuleVO.API_TYPE_ID);

            for (let i in animation_modules) {
                if (!this.modules_by_themes[animation_modules[i].theme_id]) {
                    this.modules_by_themes[animation_modules[i].theme_id] = [];
                }

                this.modules_by_themes[animation_modules[i].theme_id].push(animation_modules[i]);
            }
        })());

        await Promise.all(promises);
    }

    get ordered_themes(): AnimationThemeVO[] {
        return this.themes ? this.themes.sort((a, b) => a.weight - b.weight) : null;
    }
}
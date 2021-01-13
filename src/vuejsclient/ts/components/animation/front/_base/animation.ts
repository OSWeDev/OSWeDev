import { Component } from "vue-property-decorator";
import ModuleAccessPolicy from "../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import AnimationController from "../../../../../../shared/modules/Animation/AnimationController";
import ModuleAnimation from "../../../../../../shared/modules/Animation/ModuleAnimation";
import AnimationModuleVO from "../../../../../../shared/modules/Animation/vos/AnimationModuleVO";
import AnimationThemeVO from "../../../../../../shared/modules/Animation/vos/AnimationThemeVO";
import ModuleDAO from "../../../../../../shared/modules/DAO/ModuleDAO";
import ModuleParams from "../../../../../../shared/modules/Params/ModuleParams";
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
    private logged_user_id: number = null;
    private image_home: string = null;
    private skip_home: boolean = false;

    private async mounted() {
        let promises = [];

        promises.push((async () => this.logged_user_id = await ModuleAccessPolicy.getInstance().getLoggedUserId())());
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
        promises.push((async () => this.themes = await ModuleDAO.getInstance().getVos<AnimationThemeVO>(AnimationThemeVO.API_TYPE_ID))());
        promises.push((async () => this.image_home = await ModuleParams.getInstance().getParamValue(ModuleAnimation.PARAM_NAME_IMAGE_HOME))());

        await Promise.all(promises);

        this.skip_home = AnimationController.getInstance().skip_home;
    }

    private skipFormations() {
        AnimationController.getInstance().skip_home = true;

        this.skip_home = AnimationController.getInstance().skip_home;
    }

    get ordered_themes(): AnimationThemeVO[] {
        return this.themes ? this.themes.sort((a, b) => a.weight - b.weight) : null;
    }

    get is_mobile_or_tablette(): boolean {
        return AnimationController.getInstance().isMobile() || AnimationController.getInstance().isTablette();
    }
}
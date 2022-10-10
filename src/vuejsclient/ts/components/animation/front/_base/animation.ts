import { Component } from "vue-property-decorator";
import ModuleAccessPolicy from "../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import AnimationController from "../../../../../../shared/modules/Animation/AnimationController";
import ModuleAnimation from "../../../../../../shared/modules/Animation/ModuleAnimation";
import AnimationModuleVO from "../../../../../../shared/modules/Animation/vos/AnimationModuleVO";
import AnimationParametersVO from "../../../../../../shared/modules/Animation/vos/AnimationParametersVO";
import AnimationThemeVO from "../../../../../../shared/modules/Animation/vos/AnimationThemeVO";
import ModuleDAO from "../../../../../../shared/modules/DAO/ModuleDAO";
import DocumentVO from "../../../../../../shared/modules/Document/vos/DocumentVO";
import FileVO from "../../../../../../shared/modules/File/vos/FileVO";
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
    /** used in pug to show home page or not */
    private skip_home: boolean = false;
    private animation_params: AnimationParametersVO = null;
    private documents: DocumentVO[] = null;

    private async mounted() {
        let promises = [];

        promises.push((async () => this.logged_user_id = await ModuleAccessPolicy.getInstance().getLoggedUserId())());
        promises.push((async () => this.themes = await query(AnimationThemeVO.API_TYPE_ID).select_vos<AnimationThemeVO>())());
        promises.push((async () => this.animation_params = await ModuleAnimation.getInstance().getParameters())());
        promises.push((async () => {
            let animation_modules: AnimationModuleVO[] = await query(AnimationModuleVO.API_TYPE_ID).select_vos<AnimationModuleVO>();

            for (let i in animation_modules) {
                if (!this.modules_by_themes[animation_modules[i].theme_id]) {
                    this.modules_by_themes[animation_modules[i].theme_id] = [];
                }

                this.modules_by_themes[animation_modules[i].theme_id].push(animation_modules[i]);
            }
        })());

        await Promise.all(promises);

        promises = [];

        if (this.animation_params && this.animation_params.image_home_id) {
            promises.push((async () => {
                let file: FileVO = await ModuleDAO.getInstance().getVoById<FileVO>(FileVO.API_TYPE_ID, this.animation_params.image_home_id);

                this.image_home = file ? file.path : null;
            })());
        }

        if (this.animation_params && this.animation_params.document_id_ranges) {
            promises.push((async () => this.documents = await ModuleDAO.getInstance().getVosByIdsRanges<DocumentVO>(DocumentVO.API_TYPE_ID, this.animation_params.document_id_ranges))());
        }

        await Promise.all(promises);

        this.skip_home = AnimationController.getInstance().skip_home;
    }

    /**
     * skips home page and shows main page
     */
    private skipFormations() {
        AnimationController.getInstance().skip_home = true;

        this.skip_home = AnimationController.getInstance().skip_home;
    }

    get ordered_themes(): AnimationThemeVO[] {
        return this.themes ? this.themes.sort((a, b) => a.weight - b.weight) : null;
    }
}
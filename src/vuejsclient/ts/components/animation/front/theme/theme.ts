import { Component, Watch } from "vue-property-decorator";
import ModuleAccessPolicy from "../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import AnimationController from "../../../../../../shared/modules/Animation/AnimationController";
import AnimationModuleVO from "../../../../../../shared/modules/Animation/vos/AnimationModuleVO";
import AnimationThemeVO from "../../../../../../shared/modules/Animation/vos/AnimationThemeVO";
import AnimationUserModuleVO from "../../../../../../shared/modules/Animation/vos/AnimationUserModuleVO";
import ModuleDAO from "../../../../../../shared/modules/DAO/ModuleDAO";
import VueComponentBase from '../../../VueComponentBase';
import './theme.scss';

@Component({
    template: require("./theme.pug"),
    components: {}
})
export default class VueAnimationThemeComponent extends VueComponentBase {

    private modules: AnimationModuleVO[] = null;
    private theme: AnimationThemeVO = null;
    private user_module_by_ids: { [id: number]: AnimationUserModuleVO } = null;
    private user_id: number = null;

    @Watch('theme_id')
    private async reloadAsyncDatas() {
        if (!this.theme_id) {
            return;
        }

        let promises = [];

        promises.push((async () => this.user_id = await ModuleAccessPolicy.getInstance().getLoggedUserId())());
        promises.push((async () => this.theme = await ModuleDAO.getInstance().getVoById<AnimationThemeVO>(AnimationThemeVO.API_TYPE_ID, this.theme_id))());
        promises.push((async () => this.modules = await ModuleDAO.getInstance().getVosByRefFieldIds<AnimationModuleVO>(AnimationModuleVO.API_TYPE_ID, 'theme_id', [this.theme_id]))());

        await Promise.all(promises);

        promises = [];

        if (this.modules && this.modules.length) {
            promises.push((async () => {
                let user_modules: AnimationUserModuleVO[] = await ModuleDAO.getInstance().getVosByRefFieldsIds<AnimationUserModuleVO>(
                    AnimationUserModuleVO.API_TYPE_ID,
                    'module_id',
                    this.modules.map((m) => m.id),
                    'user_id',
                    [this.user_id],
                )

                for (let i in user_modules) {
                    this.user_module_by_ids[user_modules[i].module_id] = user_modules[i];
                }
            })());
        }

        await Promise.all(promises);
    }

    private async mounted() {
        this.reloadAsyncDatas();
    }

    private get_route_module(module: AnimationModuleVO) {
        return {
            name: AnimationController.ROUTE_NAME_ANIMATION_MODULE,
            params: {
                theme_id: this.theme.id.toString(),
                module_id: module.id.toString(),
            }
        };
    }

    private get_type_module(module: AnimationModuleVO): string {
        return module.type_module != null ? this.t(AnimationModuleVO.TYPE_MODULE_LABELS[module.type_module]) : null;
    }

    get theme_id(): number {
        return (this.$route.params && this.$route.params.theme_id) ? parseInt(this.$route.params.theme_id) : null;
    }

    get ordered_modules(): AnimationModuleVO[] {
        return this.modules ? this.modules.sort((a, b) => a.weight - b.weight) : null;
    }
}
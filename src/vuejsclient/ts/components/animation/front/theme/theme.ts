import { Component, Watch } from "vue-property-decorator";
import ModuleAccessPolicy from "../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
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
    private user_module: AnimationUserModuleVO[] = null;
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
            promises.push((async () => this.user_module = await ModuleDAO.getInstance().getVosByRefFieldsIds<AnimationUserModuleVO>(
                AnimationUserModuleVO.API_TYPE_ID,
                'module_id',
                this.modules.map((m) => m.id),
                'user_id',
                [this.user_id],
            ))());
        }

        await Promise.all(promises);
    }

    private async mounted() {
        this.reloadAsyncDatas();
    }

    get theme_id(): number {
        return (this.$route.params && this.$route.params.theme_id) ? parseInt(this.$route.params.theme_id) : null;
    }
}
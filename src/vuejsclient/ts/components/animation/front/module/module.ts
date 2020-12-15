import { Component, Watch } from "vue-property-decorator";
import ModuleAccessPolicy from "../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import AnimationModuleVO from "../../../../../../shared/modules/Animation/vos/AnimationModuleVO";
import AnimationQRVO from "../../../../../../shared/modules/Animation/vos/AnimationQRVO";
import AnimationThemeVO from "../../../../../../shared/modules/Animation/vos/AnimationThemeVO";
import AnimationUserModuleVO from "../../../../../../shared/modules/Animation/vos/AnimationUserModuleVO";
import AnimationUserQRVO from "../../../../../../shared/modules/Animation/vos/AnimationUserQRVO";
import ModuleDAO from "../../../../../../shared/modules/DAO/ModuleDAO";
import VueComponentBase from '../../../VueComponentBase';
import './module.scss';

@Component({
    template: require("./module.pug"),
    components: {}
})
export default class VueAnimationModuleComponent extends VueComponentBase {

    private qrs: AnimationQRVO[] = null;
    private theme: AnimationThemeVO = null;
    private module: AnimationModuleVO = null;
    private user_module: AnimationUserModuleVO[] = null;
    private user_qrs: AnimationUserQRVO[] = null;
    private user_id: number = null;

    @Watch('module_id')
    private async reloadAsyncDatas() {
        if (!this.module_id) {
            return;
        }

        let promises = [];

        promises.push((async () => this.user_id = await ModuleAccessPolicy.getInstance().getLoggedUserId())());
        promises.push((async () => this.module = await ModuleDAO.getInstance().getVoById<AnimationModuleVO>(AnimationModuleVO.API_TYPE_ID, this.module_id))());
        promises.push((async () => this.qrs = await ModuleDAO.getInstance().getVosByRefFieldIds<AnimationQRVO>(AnimationQRVO.API_TYPE_ID, 'module_id', [this.module_id]))());

        await Promise.all(promises);

        promises = [];

        promises.push((async () => this.theme = await ModuleDAO.getInstance().getVoById<AnimationThemeVO>(AnimationThemeVO.API_TYPE_ID, this.module.theme_id))());

        promises.push((async () => this.user_module = await ModuleDAO.getInstance().getVosByRefFieldsIds<AnimationUserModuleVO>(
            AnimationUserModuleVO.API_TYPE_ID,
            'module_id',
            [this.module_id],
            'user_id',
            [this.user_id],
        ))());

        if (this.qrs && this.qrs.length) {
            promises.push((async () => this.user_qrs = await ModuleDAO.getInstance().getVosByRefFieldsIds<AnimationUserQRVO>(
                AnimationUserQRVO.API_TYPE_ID,
                'qr_id',
                this.qrs.map((m) => m.id),
                'user_id',
                [this.user_id],
            ))());
        }

        await Promise.all(promises);
    }

    private async mounted() {
        this.reloadAsyncDatas();
    }

    get module_id(): number {
        return (this.$route.params && this.$route.params.module_id) ? parseInt(this.$route.params.module_id) : null;
    }
}
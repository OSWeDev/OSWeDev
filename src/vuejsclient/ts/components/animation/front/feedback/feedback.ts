import { Component, Watch } from "vue-property-decorator";
import ModuleAccessPolicy from "../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import AnimationController from "../../../../../../shared/modules/Animation/AnimationController";
import ModuleAnimation from "../../../../../../shared/modules/Animation/ModuleAnimation";
import AnimationModuleVO from "../../../../../../shared/modules/Animation/vos/AnimationModuleVO";
import AnimationThemeVO from "../../../../../../shared/modules/Animation/vos/AnimationThemeVO";
import AnimationUserModuleVO from "../../../../../../shared/modules/Animation/vos/AnimationUserModuleVO";
import ModuleDAO from "../../../../../../shared/modules/DAO/ModuleDAO";
import SimpleDatatableField from "../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField";
import VarsController from "../../../../../../shared/modules/Var/VarsController";
import VOsTypesManager from "../../../../../../shared/modules/VOsTypesManager";
import VueComponentBase from '../../../VueComponentBase';
import '../_base/animation.scss';

@Component({
    template: require("./feedback.pug"),
    components: {}
})
export default class VueAnimationModuleFeedbackComponent extends VueComponentBase {

    private anim_module: AnimationModuleVO = null;
    private user_module: AnimationUserModuleVO = null;
    private theme: AnimationThemeVO = null;
    private user_id: number = null;

    private saving: boolean = false;

    @Watch('module_id')
    private async reloadAsyncDatas() {
        if (!this.module_id) {
            return;
        }

        let promises = [];

        promises.push((async () => this.user_id = await ModuleAccessPolicy.getInstance().getLoggedUserId())());
        promises.push((async () => this.anim_module = await ModuleDAO.getInstance().getVoById<AnimationModuleVO>(AnimationModuleVO.API_TYPE_ID, this.module_id))());

        await Promise.all(promises);

        promises = [];

        promises.push((async () => this.user_module = await ModuleAnimation.getInstance().getUserModule(this.user_id, this.anim_module.id))());

        promises.push((async () => this.theme = await ModuleDAO.getInstance().getVoById<AnimationThemeVO>(AnimationThemeVO.API_TYPE_ID, this.anim_module.theme_id))());

        await Promise.all(promises);
    }

    private async mounted() {
        this.reloadAsyncDatas();
    }

    private changeLikeVoteVeryGood() {
        this.user_module.like_vote = AnimationUserModuleVO.LIKE_VOTE_VERY_GOOD;
    }

    private changeLikeVoteGood() {
        this.user_module.like_vote = AnimationUserModuleVO.LIKE_VOTE_GOOD;
    }

    private changeLikeVoteBad() {
        this.user_module.like_vote = AnimationUserModuleVO.LIKE_VOTE_BAD;
    }

    private async valider() {
        this.saving = true;

        await ModuleDAO.getInstance().insertOrUpdateVO(this.user_module);

        VarsController.getInstance().stageUpdateVoUpdate(this.user_module, this.user_module);

        this.$router.push({
            name: AnimationController.ROUTE_NAME_ANIMATION,
        });

        this.saving = false;
    }

    get like_vote_bad(): string {
        return AnimationUserModuleVO.LIKE_VOTE_LABELS[AnimationUserModuleVO.LIKE_VOTE_BAD];
    }

    get like_vote_good(): string {
        return AnimationUserModuleVO.LIKE_VOTE_LABELS[AnimationUserModuleVO.LIKE_VOTE_GOOD];
    }

    get like_vote_very_good(): string {
        return AnimationUserModuleVO.LIKE_VOTE_LABELS[AnimationUserModuleVO.LIKE_VOTE_VERY_GOOD];
    }

    get is_like_vote_very_good(): boolean {
        return this.user_module.like_vote == AnimationUserModuleVO.LIKE_VOTE_VERY_GOOD;
    }

    get is_like_vote_good(): boolean {
        return this.user_module.like_vote == AnimationUserModuleVO.LIKE_VOTE_GOOD;
    }

    get is_like_vote_bad(): boolean {
        return this.user_module.like_vote == AnimationUserModuleVO.LIKE_VOTE_BAD;
    }

    get commentaire_editable_field() {
        return new SimpleDatatableField('commentaire').setModuleTable(VOsTypesManager.getInstance().moduleTables_by_voType[AnimationUserModuleVO.API_TYPE_ID]);
    }

    get module_id(): number {
        return (this.$route.params && this.$route.params.module_id) ? parseInt(this.$route.params.module_id) : null;
    }
}
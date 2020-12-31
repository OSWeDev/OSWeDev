import { Component, Watch } from "vue-property-decorator";
import ModuleAccessPolicy from "../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import AnimationController from "../../../../../../shared/modules/Animation/AnimationController";
import ModuleAnimation from "../../../../../../shared/modules/Animation/ModuleAnimation";
import ThemeModuleDataParamRangesVO from "../../../../../../shared/modules/Animation/params/theme_module/ThemeModuleDataParamRangesVO";
import VarDayPrctReussiteAnimationController from "../../../../../../shared/modules/Animation/vars/VarDayPrctReussiteAnimationController";
import AnimationModuleVO from "../../../../../../shared/modules/Animation/vos/AnimationModuleVO";
import AnimationQRVO from "../../../../../../shared/modules/Animation/vos/AnimationQRVO";
import AnimationThemeVO from "../../../../../../shared/modules/Animation/vos/AnimationThemeVO";
import AnimationUserModuleVO from "../../../../../../shared/modules/Animation/vos/AnimationUserModuleVO";
import AnimationUserQRVO from "../../../../../../shared/modules/Animation/vos/AnimationUserQRVO";
import ModuleDAO from "../../../../../../shared/modules/DAO/ModuleDAO";
import NumSegment from "../../../../../../shared/modules/DataRender/vos/NumSegment";
import ISimpleNumberVarData from "../../../../../../shared/modules/Var/interfaces/ISimpleNumberVarData";
import IVarDataVOBase from "../../../../../../shared/modules/Var/interfaces/IVarDataVOBase";
import RangeHandler from "../../../../../../shared/tools/RangeHandler";
import IVarDirectiveParams from '../../../Var/directives/var-directive/IVarDirectiveParams';
import VueComponentBase from '../../../VueComponentBase';
import VueAnimationQrComponent from "../qr/qr";
import './module.scss';

@Component({
    template: require("./module.pug"),
    components: {
        Animationqr: VueAnimationQrComponent,
    }
})
export default class VueAnimationModuleComponent extends VueComponentBase {

    private qrs: AnimationQRVO[] = null;
    private theme: AnimationThemeVO = null;
    private module: AnimationModuleVO = null;
    private user_module: AnimationUserModuleVO[] = null;
    private uqr_by_qr_ids: { [qr_id: number]: AnimationUserQRVO } = {};
    private user_id: number = null;
    private show_recap: boolean = false;
    private recap_is_actif: boolean = false;

    private current_qr: AnimationQRVO = null;

    @Watch('module_id')
    private async reloadAsyncDatas() {
        this.show_recap = false;
        this.recap_is_actif = false;

        if (!this.module_id) {
            return;
        }

        let promises = [];

        promises.push((async () => this.user_id = await ModuleAccessPolicy.getInstance().getLoggedUserId())());
        promises.push((async () => this.module = await ModuleDAO.getInstance().getVoById<AnimationModuleVO>(AnimationModuleVO.API_TYPE_ID, this.module_id))());
        promises.push((async () => this.qrs = await ModuleDAO.getInstance().getVosByRefFieldIds<AnimationQRVO>(AnimationQRVO.API_TYPE_ID, 'module_id', [this.module_id]))());

        await Promise.all(promises);

        await ModuleAnimation.getInstance().startModule(this.user_id, this.module_id);

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
            promises.push((async () => await this.reloadUqrs())());
        }

        await Promise.all(promises);

        this.current_qr = this.ordered_qrs ? this.ordered_qrs[0] : null;
    }

    private async reloadUqrs() {
        let user_qrs: AnimationUserQRVO[] = await ModuleDAO.getInstance().getVosByRefFieldsIds<AnimationUserQRVO>(
            AnimationUserQRVO.API_TYPE_ID,
            'qr_id',
            this.qrs.map((m) => m.id),
            'user_id',
            [this.user_id],
        );

        for (let i in user_qrs) {
            this.uqr_by_qr_ids[user_qrs[i].qr_id] = user_qrs[i];
        }

        this.recap_is_actif = user_qrs.length == this.qrs.length;
    }

    private async mounted() {
        this.reloadAsyncDatas();
    }

    private switchQR(qr: AnimationQRVO) {
        this.current_qr = qr;
        this.show_recap = false;
    }

    private backToFront() {
        this.$router.push({
            name: AnimationController.ROUTE_NAME_ANIMATION,
        });
    }

    private nextQr() {
        let qr: AnimationQRVO = this.qrs.find((q) => q.weight == (this.current_qr.weight + 1));

        if (qr) {
            this.switchQR(qr);
            return;
        }

        if (this.current_qr.weight == this.qrs.length) {
            this.show_recap = true;
        }
    }

    private show_recap_toggle() {
        if (this.recap_is_actif) {
            this.show_recap = true;
        }
    }

    get ordered_qrs(): AnimationQRVO[] {
        return this.qrs ? this.qrs.sort((a, b) => a.weight - b.weight) : null;
    }

    get module_id(): number {
        return (this.$route.params && this.$route.params.module_id) ? parseInt(this.$route.params.module_id) : null;
    }

    get module_quizz(): boolean {
        return this.module && this.module.type_module == AnimationModuleVO.TYPE_MODULE_QUIZZ;
    }

    get module_photo(): boolean {
        return this.module && this.module.type_module == AnimationModuleVO.TYPE_MODULE_PHOTO;
    }

    get module_video(): boolean {
        return this.module && this.module.type_module == AnimationModuleVO.TYPE_MODULE_VIDEO;
    }

    get prct_reussite_module_param(): ThemeModuleDataParamRangesVO {
        return ThemeModuleDataParamRangesVO.createNew(
            VarDayPrctReussiteAnimationController.getInstance().varConf.id,
            null,
            [RangeHandler.getInstance().create_single_elt_NumRange(this.module.id, NumSegment.TYPE_INT)],
        );
    }

    get prct_reussite_module_directive(): IVarDirectiveParams {
        return {
            var_param: this.prct_reussite_module_param,
            on_every_update: (varData: IVarDataVOBase, el, binding, vnode) => {
                let value: number = (!!varData) ? (varData as ISimpleNumberVarData).value : 0;

                el.className = (value >= 0.8) ? 'alert-success' : (value >= 0.5) ? 'alert-warning' : 'alert-danger';
            },
            already_register: true,
        };
    }
}
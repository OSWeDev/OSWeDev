import { Component, Watch } from "vue-property-decorator";
import ModuleAccessPolicy from "../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import AnimationController from "../../../../../../shared/modules/Animation/AnimationController";
import AnimationMessageModuleVO from "../../../../../../shared/modules/Animation/fields/message_module/vos/AnimationMessageModuleVO";
import ModuleAnimation from "../../../../../../shared/modules/Animation/ModuleAnimation";
import ThemeModuleDataRangesVO from "../../../../../../shared/modules/Animation/params/theme_module/ThemeModuleDataRangesVO";
import AnimationModuleVO from "../../../../../../shared/modules/Animation/vos/AnimationModuleVO";
import AnimationParametersVO from "../../../../../../shared/modules/Animation/vos/AnimationParametersVO";
import AnimationQRVO from "../../../../../../shared/modules/Animation/vos/AnimationQRVO";
import AnimationThemeVO from "../../../../../../shared/modules/Animation/vos/AnimationThemeVO";
import AnimationUserModuleVO from "../../../../../../shared/modules/Animation/vos/AnimationUserModuleVO";
import AnimationUserQRVO from "../../../../../../shared/modules/Animation/vos/AnimationUserQRVO";
import { query } from "../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ModuleDAO from "../../../../../../shared/modules/DAO/ModuleDAO";
import SimpleDatatableField from "../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField";
import NumRange from "../../../../../../shared/modules/DataRender/vos/NumRange";
import NumSegment from "../../../../../../shared/modules/DataRender/vos/NumSegment";
import DocumentVO from "../../../../../../shared/modules/Document/vos/DocumentVO";
import FileVO from "../../../../../../shared/modules/File/vos/FileVO";
import IDistantVOBase from "../../../../../../shared/modules/IDistantVOBase";
import VarsController from "../../../../../../shared/modules/Var/VarsController";
import VarDataBaseVO from "../../../../../../shared/modules/Var/vos/VarDataBaseVO";
import VOsTypesManager from "../../../../../../shared/modules/VOsTypesManager";
import { all_promises } from "../../../../../../shared/tools/PromiseTools";
import RangeHandler from "../../../../../../shared/tools/RangeHandler";
import AjaxCacheClientController from "../../../../modules/AjaxCache/AjaxCacheClientController";
import IVarDirectiveParams from '../../../Var/directives/var-directive/IVarDirectiveParams';
import VarsClientController from "../../../Var/VarsClientController";
import VueComponentBase from '../../../VueComponentBase';
import VueAnimationQrComponent from "../qr/qr";
import '../_base/animation.scss';

@Component({
    template: require("./module.pug"),
    components: {
        Animationqr: VueAnimationQrComponent,
    }
})
export default class VueAnimationModuleComponent extends VueComponentBase {

    private qrs: AnimationQRVO[] = null;
    private theme: AnimationThemeVO = null;
    private anim_module: AnimationModuleVO = null;
    private uqr_by_qr_ids: { [qr_id: number]: AnimationUserQRVO } = {};
    private file_by_ids: { [id: number]: FileVO } = {};
    private logged_user_id: number = null;

    private show_recap: boolean = false;
    private recap_is_actif: boolean = false;
    /** score sur le module pour l'utilisateur */
    private prct_reussite_value: number = null;

    private animation_params: AnimationParametersVO = null;
    private prct_atteinte_seuil_module: number = null;
    private um: AnimationUserModuleVO = null;

    private is_reponse_valid: { [qr_id: number]: boolean } = {};
    private current_qr: AnimationQRVO = null;

    private document: DocumentVO = null;
    private inline_input_mode: boolean = false;
    private has_access_inline_input_mode: boolean = false;

    private themes: AnimationThemeVO[] = [];
    private theme_id_ranges: NumRange[] = [];

    private prct_atteinte_seuil_module_param: ThemeModuleDataRangesVO = null;
    /** paramètre pour le score {@link VarDayPrctReussiteAnimationController} */
    private prct_reussite_module_param: ThemeModuleDataRangesVO = null;

    @Watch('module_id')
    private async reloadAsyncDatas() {
        this.show_recap = false;
        this.recap_is_actif = false;
        this.prct_reussite_value = null;
        this.current_qr = null;
        this.um = null;
        this.prct_atteinte_seuil_module = null;

        if (!this.module_id) {
            return;
        }

        let promises = [];

        promises.push((async () => this.logged_user_id = await ModuleAccessPolicy.getInstance().getLoggedUserId())());
        promises.push((async () => this.anim_module = await query(AnimationModuleVO.API_TYPE_ID).filter_by_id(this.module_id).select_vo<AnimationModuleVO>())());
        promises.push((async () => this.qrs = await query(AnimationQRVO.API_TYPE_ID).filter_by_num_eq('module_id', this.module_id).select_vos<AnimationQRVO>())());
        promises.push((async () => this.themes = await query(AnimationThemeVO.API_TYPE_ID).select_vos<AnimationThemeVO>())());
        promises.push((async () => this.animation_params = await ModuleAnimation.getInstance().getParameters())());
        promises.push((async () => this.has_access_inline_input_mode = await ModuleAccessPolicy.getInstance().testAccess(ModuleAnimation.POLICY_FO_REPORTING_ACCESS))());

        await all_promises(promises);

        for (let i in this.themes) {
            this.theme_id_ranges.push(RangeHandler.create_single_elt_NumRange(this.themes[i].id, NumSegment.TYPE_INT));
        }

        this.prct_atteinte_seuil_module_param = ThemeModuleDataRangesVO.createNew(
            AnimationController.VarDayPrctAtteinteSeuilAnimationController_VAR_NAME,
            true,
            this.theme_id_ranges,
            [RangeHandler.create_single_elt_NumRange(this.anim_module.id, NumSegment.TYPE_INT)],
            [RangeHandler.create_single_elt_NumRange(this.logged_user_id, NumSegment.TYPE_INT)],
        );

        this.prct_reussite_module_param = ThemeModuleDataRangesVO.createNew(
            AnimationController.VarDayPrctReussiteAnimationController_VAR_NAME,
            true,
            this.theme_id_ranges,
            [RangeHandler.create_single_elt_NumRange(this.anim_module.id, NumSegment.TYPE_INT)],
            [RangeHandler.create_single_elt_NumRange(this.logged_user_id, NumSegment.TYPE_INT)],
        );

        promises = [];

        promises.push((async () => {
            this.um = await ModuleAnimation.getInstance().startModule(this.logged_user_id, this.module_id, AnimationController.getInstance().getSupport());
            // On force le vidage de cache
            AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([AnimationUserModuleVO.API_TYPE_ID]);
        })());

        promises.push((async () =>
            this.prct_atteinte_seuil_module = VarsController.getInstance().getValueOrDefault(
                await VarsClientController.getInstance().registerParamAndWait<ThemeModuleDataRangesVO>(
                    this.prct_atteinte_seuil_module_param
                ) as ThemeModuleDataRangesVO,
                0
            )
        )());

        if (this.anim_module.document_id) {
            promises.push((async () => this.document = await query(DocumentVO.API_TYPE_ID).filter_by_id(this.anim_module.document_id).select_vo<DocumentVO>())());
        }

        await all_promises(promises);

        // Si module terminé et atteinte seuil pas atteint, on propose de recommencer le module
        if (this.um.end_date && !this.prct_atteinte_seuil_module) {
            $(this.$refs.restartmodulemodal).modal('show');
            return;
        }

        await this.reloadAsyncDatasContinue();
    }

    private async reloadAsyncDatasContinue() {
        let file_ids: number[] = [];

        for (let i in this.qrs) {
            if (this.qrs[i].question_file_id) {
                file_ids.push(this.qrs[i].question_file_id);
            }
            if (this.qrs[i].reponse_file_id) {
                file_ids.push(this.qrs[i].reponse_file_id);
            }
        }

        let promises = [];

        promises.push((async () => this.file_by_ids = VOsTypesManager.vosArray_to_vosByIds(
            await query(FileVO.API_TYPE_ID).filter_by_ids(file_ids).select_vos<FileVO>()
        ))());

        promises.push((async () => this.theme = await query(AnimationThemeVO.API_TYPE_ID).filter_by_id(this.anim_module.theme_id).select_vo<AnimationThemeVO>())());

        if (this.qrs && this.qrs.length) {
            promises.push((async () => await this.reloadUqrs())());
        }

        await all_promises(promises);

        this.current_qr = this.ordered_qrs ? this.ordered_qrs[0] : null;
    }

    private async reloadUqrs() {
        let user_qrs: AnimationUserQRVO[] = await ModuleDAO.getInstance().getVosByRefFieldsIds<AnimationUserQRVO>(
            AnimationUserQRVO.API_TYPE_ID,
            'qr_id',
            this.qrs.map((m) => m.id),
            'user_id',
            [this.logged_user_id],
        );

        for (let i in user_qrs) {
            this.uqr_by_qr_ids[user_qrs[i].qr_id] = user_qrs[i];
        }

        this.recap_is_actif = user_qrs.length == this.qrs.length;

        for (let i in this.qrs) {
            let qr: AnimationQRVO = this.qrs[i];

            this.is_reponse_valid[qr.id] = AnimationController.getInstance().isUserQROk(qr, this.uqr_by_qr_ids[qr.id]);
        }
    }

    private async mounted() {
        await this.reloadAsyncDatas();
    }

    private async closeModal(restart: boolean) {
        if (restart) {
            if (this.um) {
                let user_qrs: AnimationUserQRVO[] = await ModuleDAO.getInstance().getVosByRefFieldsIds<AnimationUserQRVO>(
                    AnimationUserQRVO.API_TYPE_ID,
                    'qr_id',
                    this.qrs.map((m) => m.id),
                    'user_id',
                    [this.logged_user_id],
                );

                let toDelete: IDistantVOBase[] = [this.um];
                toDelete = toDelete.concat(user_qrs);

                await ModuleDAO.getInstance().deleteVOs(toDelete);
                await this.reloadAsyncDatas();

                $(this.$refs.restartmodulemodal).modal('hide');

                return;
            }
        }

        await this.reloadAsyncDatasContinue();

        $(this.$refs.restartmodulemodal).modal('hide');
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

    private goToFeedback() {
        this.$router.push({
            name: AnimationController.ROUTE_NAME_ANIMATION_MODULE_FEEDBACK,
            params: {
                module_id: this.anim_module.id.toString(),
            }
        });
    }

    private async nextQr() {
        let qr: AnimationQRVO = this.qrs.find((q) => q.weight == (this.current_qr.weight + 1));

        if (qr) {
            this.switchQR(qr);
            return;
        }

        if (this.current_qr.weight == this.qrs.length) {
            await this.show_recap_toggle();
        }
    }

    /**
     * Passe a l'affichage de la page du score.
     * Appelé par le bouton flèche de la dernière question et le bouton trophé sur la barre de navigation entre les questions.
     */
    private async show_recap_toggle() {
        if (this.recap_is_actif) {
            await ModuleAnimation.getInstance().endModule(this.logged_user_id, this.anim_module.id);
            // On force le vidage de cache
            AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([AnimationUserModuleVO.API_TYPE_ID]);
            this.show_recap = true;
        }
    }

    private set_inline_input_mode() {
        this.inline_input_mode = !this.inline_input_mode;
    }

    get name_theme_editable_field() {
        return new SimpleDatatableField('name').setModuleTable(VOsTypesManager.moduleTables_by_voType[AnimationThemeVO.API_TYPE_ID]);
    }

    get name_module_editable_field() {
        return new SimpleDatatableField('name').setModuleTable(VOsTypesManager.moduleTables_by_voType[AnimationModuleVO.API_TYPE_ID]);
    }

    get ordered_qrs(): AnimationQRVO[] {
        return this.qrs ? this.qrs.sort((a, b) => a.weight - b.weight) : null;
    }

    get module_id(): number {
        return (this.$route.params && this.$route.params.module_id) ? parseInt(this.$route.params.module_id) : null;
    }

    get prct_reussite_class(): string {
        if (this.prct_reussite_value == null) {
            return null;
        }

        let classes: string[] = ['p' + Math.round(this.prct_reussite_value * 100).toString()];

        if (this.prct_reussite_value >= 0.8) {
            classes.push('success');
        } else {
            classes.push('warning');
        }

        return classes.join(' ');
    }

    get prct_reussite_module_directive(): IVarDirectiveParams {
        return {
            var_param: this.prct_reussite_module_param,
            on_every_update: (varData: VarDataBaseVO, el, binding, vnode) => {
                this.prct_reussite_value = (!!varData) ? varData.value : 0;
            },
            already_register: true,
        };
    }

    get prct_reussite_message(): string {
        let mm: AnimationMessageModuleVO = AnimationController.getInstance().getMessageModuleForPrct(this.anim_module, this.prct_reussite_value);

        return mm ? mm.message : null;
    }

    get seuil_validation_module_prct(): number {
        return this.animation_params ? this.animation_params.seuil_validation_module_prct : null;
    }

    get is_module_valide(): boolean {
        return this.prct_reussite_value >= this.seuil_validation_module_prct;
    }
}
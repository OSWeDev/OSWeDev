import ConsoleHandler from '../../tools/ConsoleHandler';
import AnimationMessageModuleVO from './fields/message_module/vos/AnimationMessageModuleVO';
import AnimationReponseVO from './fields/reponse/vos/AnimationReponseVO';
import AnimationModuleVO from './vos/AnimationModuleVO';
import AnimationQRVO from './vos/AnimationQRVO';
import AnimationUserModuleVO from './vos/AnimationUserModuleVO';
import AnimationUserQRVO from './vos/AnimationUserQRVO';

export default class AnimationController {

    public static VarDayPrctAtteinteSeuilAnimationController_VAR_NAME: string = 'VarDayPrctAtteinteSeuilAnimationController';
    public static VarDayPrctReussiteAnimationController_VAR_NAME: string = 'VarDayPrctReussiteAnimationController';
    public static VarDayPrctAvancementAnimationController_VAR_NAME: string = 'VarDayPrctAvancementAnimationController';
    public static VarDayTempsPasseAnimationController_VAR_NAME: string = 'VarDayTempsPasseAnimationController';

    public static ROUTE_NAME_ANIMATION: string = 'animation';
    public static ROUTE_NAME_ANIMATION_MODULE: string = 'animation_module';
    public static ROUTE_NAME_ANIMATION_MODULE_FEEDBACK: string = 'animation_module_feedback';
    public static ROUTE_NAME_ANIMATION_REPORTING: string = 'animation_reporting';

    public static OPTION_YES: number = 1;
    public static OPTION_NO: number = 2;

    // istanbul ignore next: nothing to test
    public static getInstance(): AnimationController {
        if (!AnimationController.instance) {
            AnimationController.instance = new AnimationController();
        }
        return AnimationController.instance;
    }

    private static instance: AnimationController = null;

    public skip_home: boolean = false;

    private constructor() { }
    /**
     * Parse les réponses du AnimationQRVO.
     * @param vo AnimationQRVO
     * @returns Liste des réponses AnimationReponseVO[].
     */
    public getReponses(vo: AnimationQRVO): AnimationReponseVO[] {
        if ((vo) && (vo.reponses) && (vo.reponses != '') && (vo.reponses != '[]')) {
            try {
                return JSON.parse(vo.reponses);
            } catch {
                ConsoleHandler.error("PB getReponses :: vo_id" + vo.id);
            }
        }

        return null;
    }

    public getMessagesModule(vo: AnimationModuleVO): AnimationMessageModuleVO[] {
        if ((vo) && (vo.messages) && (vo.messages != '') && (vo.messages != '[]')) {
            try {
                return JSON.parse(vo.messages);
            } catch {
                ConsoleHandler.error("PB getMessagesModule :: vo_id" + vo.id);
            }
        }

        return null;
    }

    public getMessageModuleForPrct(vo: AnimationModuleVO, prct: number): AnimationMessageModuleVO {
        const mms: AnimationMessageModuleVO[] = this.getMessagesModule(vo);

        if (!mms || !mms.length || prct == null) {
            return null;
        }

        return mms.find((m) => (m.min <= prct) && (m.max >= prct));
    }

    /**
     * Checks si la réponse de l'utilisateur est correcte ou non.
     * @param qr AnimationQRVO
     * @param uqr AnimationUserQRVO
     * @returns true si la réponse de l'utilisateur est bonne sinon false
     */
    public isUserQROk(qr: AnimationQRVO, uqr: AnimationUserQRVO): boolean {
        if (!qr || !uqr || !uqr.reponses) {
            return false;
        }

        if (qr.id != uqr.qr_id) {
            return false;
        }

        const reponses: AnimationReponseVO[] = this.getReponses(qr);

        if (!reponses || !reponses.length) {
            return false;
        }

        for (const i in reponses) {
            const u_reponse: boolean = uqr.reponses.indexOf(reponses[i].id) >= 0;

            if (reponses[i].valid != u_reponse) {
                return false;
            }
        }

        return true;
    }

    public getSupport(): number {
        if (this.isMobile()) {
            return AnimationUserModuleVO.SUPPORT_MOBILE;
        }

        if (this.isTablette()) {
            return AnimationUserModuleVO.SUPPORT_TABLETTE;
        }

        return AnimationUserModuleVO.SUPPORT_PC;
    }

    public isMobile(): boolean {
        const screenWidth: number = window.innerWidth;

        if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            return true;
        }

        return (screenWidth <= 500) ? true : false;
    }

    public isTablette(): boolean {
        if (this.isMobile()) {
            return false;
        }

        if (/iPad|iPod/i.test(navigator.userAgent)) {
            return true;
        }

        const screenWidth: number = window.innerWidth;

        return (screenWidth <= 850) ? true : false;
    }
}
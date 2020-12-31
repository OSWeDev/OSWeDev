import ConsoleHandler from '../../tools/ConsoleHandler';
import AnimationMessageModuleVO from './fields/message_module/vos/AnimationMessageModuleVO';
import AnimationReponseVO from './fields/reponse/vos/AnimationReponseVO';
import AnimationModuleVO from './vos/AnimationModuleVO';
import AnimationQRVO from './vos/AnimationQRVO';
import AnimationUserQRVO from './vos/AnimationUserQRVO';

export default class AnimationController {

    public static ROUTE_NAME_ANIMATION: string = 'animation';
    public static ROUTE_NAME_ANIMATION_MODULE: string = 'animation_module';

    public static getInstance(): AnimationController {
        if (!AnimationController.instance) {
            AnimationController.instance = new AnimationController();
        }
        return AnimationController.instance;
    }

    private static instance: AnimationController = null;

    private constructor() { }

    public getReponses(vo: AnimationQRVO): AnimationReponseVO[] {
        if ((vo) && (vo.reponses) && (vo.reponses != '') && (vo.reponses != '[]')) {
            try {
                return JSON.parse(vo.reponses);
            } catch {
                ConsoleHandler.getInstance().error("PB getReponses :: vo_id" + vo.id);
            }
        }

        return null;
    }

    public getMessagesModule(vo: AnimationModuleVO): AnimationMessageModuleVO[] {
        if ((vo) && (vo.messages) && (vo.messages != '') && (vo.messages != '[]')) {
            try {
                return JSON.parse(vo.messages);
            } catch {
                ConsoleHandler.getInstance().error("PB getMessagesModule :: vo_id" + vo.id);
            }
        }

        return null;
    }

    public isUserQROk(qr: AnimationQRVO, uqr: AnimationUserQRVO): boolean {
        if (!qr || !uqr || !uqr.reponses) {
            return false;
        }

        if (qr.id != uqr.qr_id) {
            return false;
        }

        let reponses: AnimationReponseVO[] = this.getReponses(qr);

        if (!reponses || !reponses.length) {
            return false;
        }

        for (let i in reponses) {
            let u_reponse: boolean = uqr.reponses.indexOf(reponses[i].id) >= 0;

            if (reponses[i].valid != u_reponse) {
                return false;
            }
        }

        return true;
    }
}
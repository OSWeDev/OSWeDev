import ConsoleHandler from '../../tools/ConsoleHandler';
import AnimationMessageModuleVO from './fields/message_module/vos/AnimationMessageModuleVO';
import AnimationReponseVO from './fields/reponse/vos/AnimationReponseVO';
import AnimationModuleVO from './vos/AnimationModuleVO';
import AnimationQRVO from './vos/AnimationQRVO';

export default class AnimationController {

    public static ROUTE_NAME_ANIMATION: string = 'animation';
    public static ROUTE_NAME_ANIMATION_THEME: string = 'animation_theme';
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
                let reponses: AnimationReponseVO[] = JSON.parse(vo.reponses);

                for (let obj of reponses) {
                    obj.weight = (obj.weight) ? parseFloat(obj.weight.toString()) : null;
                    obj.id = (obj.id) ? parseFloat(obj.id.toString()) : null;

                    if (obj.valid && (obj.valid as any) != '') {
                        obj.valid = ((obj.valid as any) == 'true') ? true : false;
                    } else {
                        obj.valid = null;
                    }
                }

                return reponses;
            } catch {
                ConsoleHandler.getInstance().error("PB getReponses :: vo_id" + vo.id);
            }
        }

        return null;
    }

    public getMessagesModule(vo: AnimationModuleVO): AnimationMessageModuleVO[] {
        if ((vo) && (vo.messages) && (vo.messages != '') && (vo.messages != '[]')) {
            try {
                let messages: AnimationMessageModuleVO[] = JSON.parse(vo.messages);

                for (let obj of messages) {
                    obj.min = (obj.max) ? parseFloat(obj.max.toString()) : null;
                    obj.max = (obj.min) ? parseFloat(obj.min.toString()) : null;
                    obj.id = (obj.id) ? parseFloat(obj.id.toString()) : null;
                }

                return messages;
            } catch {
                ConsoleHandler.getInstance().error("PB getMessagesModule :: vo_id" + vo.id);
            }
        }

        return null;
    }
}
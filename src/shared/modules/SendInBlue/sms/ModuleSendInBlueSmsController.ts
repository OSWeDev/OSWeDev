import ModuleRequest from '../../../../server/modules/Request/ModuleRequest';
import ModuleSendInBlueController from '../ModuleSendInBlueController';
import SendInBlueSmsFormatVO from '../vos/SendInBlueSmsFormatVO';
import SendInBlueSmsVO from '../vos/SendInBlueSmsVO';

export default class ModuleSendInBlueSmsController {

    public static getInstance(): ModuleSendInBlueSmsController {
        if (!ModuleSendInBlueSmsController.instance) {
            ModuleSendInBlueSmsController.instance = new ModuleSendInBlueSmsController();
        }
        return ModuleSendInBlueSmsController.instance;
    }

    private static instance: ModuleSendInBlueSmsController = null;

    private static PATH_SMS: string = 'transactionalSMS/sms';

    public async send(recipient: SendInBlueSmsFormatVO, content: string, tag: string = null, type: string = SendInBlueSmsVO.TYPE_TRANSACTIONAL): Promise<SendInBlueSmsVO> {
        if (!recipient || !SendInBlueSmsFormatVO.formate(recipient.tel, recipient.code_pays)) {
            return null;
        }

        let postParams: any = {
            sender: await ModuleSendInBlueController.getInstance().getSenderNameSMS(),
            recipient: SendInBlueSmsFormatVO.formate(recipient.tel, recipient.code_pays),
            content: content,
            type: type,
        };

        if (tag) {
            postParams.tag = tag;
        }

        return ModuleSendInBlueController.getInstance().sendRequestFromApp<SendInBlueSmsVO>(
            ModuleRequest.METHOD_POST,
            ModuleSendInBlueSmsController.PATH_SMS,
            postParams
        );
    }
}
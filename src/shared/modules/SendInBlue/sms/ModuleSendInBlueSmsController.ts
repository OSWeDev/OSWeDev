import ModuleRequest from '../../../../server/modules/Request/ModuleRequest';
import ModuleSendInBlueController from '../ModuleSendInBlueController';
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

    public async send(recipient: string, content: string, type: string = SendInBlueSmsVO.TYPE_TRANSACTIONAL): Promise<SendInBlueSmsVO> {
        return ModuleSendInBlueController.getInstance().sendRequestFromApp<SendInBlueSmsVO>(
            ModuleRequest.METHOD_POST,
            ModuleSendInBlueSmsController.PATH_SMS,
            {
                sender: ModuleSendInBlueController.getInstance().getSenderName(),
                recipient: recipient,
                content: content,
                type: type,
            }
        );
    }
}
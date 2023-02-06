import ModuleRequest from '../../../../shared/modules/Request/ModuleRequest';
import SendInBlueSmsFormatVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueSmsFormatVO';
import SendInBlueSmsVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueSmsVO';
import SendInBlueServerController from '../SendInBlueServerController';
import ConfigurationService from '../../../env/ConfigurationService';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import ModuleMailerServer from '../../Mailer/ModuleMailerServer';

export default class SendInBlueSmsServerController {

    public static getInstance(): SendInBlueSmsServerController {
        if (!SendInBlueSmsServerController.instance) {
            SendInBlueSmsServerController.instance = new SendInBlueSmsServerController();
        }
        return SendInBlueSmsServerController.instance;
    }

    private static instance: SendInBlueSmsServerController = null;

    private static PATH_SMS: string = 'transactionalSMS/sms';

    public async send(recipient: SendInBlueSmsFormatVO, content: string, tag: string = null, type: string = SendInBlueSmsVO.TYPE_TRANSACTIONAL): Promise<SendInBlueSmsVO> {

        // On check que l'env permet d'envoyer des mails
        if (ConfigurationService.node_configuration.BLOCK_MAIL_DELIVERY) {

            if (ModuleMailerServer.getInstance().check_mail_whitelist(recipient.tel, [], [])) {
                ConsoleHandler.warn('Envoi de mails interdit sur cet env mais adresses whitelistées:' + recipient.tel);

            } else {
                ConsoleHandler.warn('Envoi de mails interdit sur cet env: ' + recipient.tel + ':' + content);
                return;
            }
        }

        if (!recipient || !SendInBlueSmsFormatVO.formate(recipient.tel, recipient.code_pays)) {
            return null;
        }

        let postParams: any = {
            sender: await SendInBlueServerController.getInstance().getSenderNameSMS(),
            recipient: SendInBlueSmsFormatVO.formate(recipient.tel, recipient.code_pays),
            content: content,
            type: type,
        };

        if (tag) {
            postParams.tag = tag;
        }

        return SendInBlueServerController.getInstance().sendRequestFromApp<SendInBlueSmsVO>(
            ModuleRequest.METHOD_POST,
            SendInBlueSmsServerController.PATH_SMS,
            postParams
        );
    }
}
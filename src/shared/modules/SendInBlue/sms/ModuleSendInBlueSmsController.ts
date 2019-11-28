import { ClientResponse } from 'http';
import * as SibAPI from 'sib-api-v3-typescript';

export default class ModuleSendInBlueSmsController {

    public static getInstance(): ModuleSendInBlueSmsController {
        if (!ModuleSendInBlueSmsController.instance) {
            ModuleSendInBlueSmsController.instance = new ModuleSendInBlueSmsController();
        }
        return ModuleSendInBlueSmsController.instance;
    }

    private static instance: ModuleSendInBlueSmsController = null;

    public async send(sender: string, recipient: string, content: string, type: SibAPI.SendTransacSms.TypeEnum, tag: string, webUrl: string): Promise<boolean> {
        // TODO
        let sms: SibAPI.SendTransacSms = new SibAPI.SendTransacSms();
        sms.sender = sender;
        sms.recipient = recipient;
        sms.content = content;
        sms.type = type;
        sms.tag = tag;
        sms.webUrl = webUrl;

        let res: {
            response: ClientResponse;
            body?: any;
        } = await new SibAPI.TransactionalSMSApi().sendTransacSms(sms);

        if (res && res.response && res.response.statusCode == 200 && res.body) {
            return true;
        }

        return false;
    }
}
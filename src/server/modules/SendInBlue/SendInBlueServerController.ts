import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleRequest from '../../../shared/modules/Request/ModuleRequest';
import SendInBlueMailVO from '../../../shared/modules/SendInBlue/vos/SendInBlueMailVO';
import SendInBlueVO from '../../../shared/modules/SendInBlue/vos/SendInBlueVO';


export default class SendInBlueServerController {

    // istanbul ignore next: nothing to test
    public static getInstance(): SendInBlueServerController {
        if (!SendInBlueServerController.instance) {
            SendInBlueServerController.instance = new SendInBlueServerController();
        }
        return SendInBlueServerController.instance;
    }

    private static instance: SendInBlueServerController = null;
    private static VERSION_API: string = '/v3/';

    /**
     * Local thread cache -----
     */
    public param: SendInBlueVO = null;
    /**
     * ----- Local thread cache
     */

    public async loadParam(): Promise<void> {
        if (!this.param) {
            let params: SendInBlueVO[] = await query(SendInBlueVO.API_TYPE_ID).select_vos<SendInBlueVO>();

            this.param = (params) ? params[0] : null;
        }
    }

    public async sendRequestFromApp<T>(method: string, path: string, posts: {} = {}): Promise<T> {
        await this.loadParam();

        if (!this.param) {
            return null;
        }

        return ModuleRequest.getInstance().sendRequestFromApp(
            method,
            this.param.host,
            SendInBlueServerController.VERSION_API + path,
            posts,
            await this.getHeadersRequest(),
            true
        );
    }

    public async getReplyTo(): Promise<SendInBlueMailVO> {
        await this.loadParam();

        if (!this.param) {
            return null;
        }

        return SendInBlueMailVO.createNew(
            this.param.replyto_name,
            this.param.replyto_email
        );
    }

    public async getReplyToEmail(): Promise<string> {
        let reply_to: SendInBlueMailVO = await this.getReplyTo();
        return reply_to ? reply_to.email : null;
    }

    public async getSender(): Promise<SendInBlueMailVO> {
        await this.loadParam();

        if (!this.param) {
            return null;
        }

        return SendInBlueMailVO.createNew(
            this.param.sender_name,
            this.param.sender_email
        );
    }

    public async getSenderName(): Promise<string> {
        let sender: SendInBlueMailVO = await this.getSender();
        return sender ? sender.name : null;
    }

    public async getSenderNameSMS(): Promise<string> {
        await this.loadParam();

        return this.param ? this.param.sender_sms_name : null;
    }

    public async getDefaultFolderList(): Promise<string> {
        await this.loadParam();

        return this.param ? this.param.default_folder_list : null;
    }

    private async getHeadersRequest(): Promise<any> {
        await this.loadParam();

        if (!this.param) {
            return null;
        }

        return {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'api-key': this.param.api_key
        };
    }
}
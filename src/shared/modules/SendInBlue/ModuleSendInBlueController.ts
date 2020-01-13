import ModuleRequest from '../../../server/modules/Request/ModuleRequest';
import ModuleDAO from '../DAO/ModuleDAO';
import SendInBlueMailVO from './vos/SendInBlueMailVO';
import SendInBlueVO from './vos/SendInBlueVO';

export default class ModuleSendInBlueController {

    public static getInstance(): ModuleSendInBlueController {
        if (!ModuleSendInBlueController.instance) {
            ModuleSendInBlueController.instance = new ModuleSendInBlueController();
        }
        return ModuleSendInBlueController.instance;
    }

    private static instance: ModuleSendInBlueController = null;
    private static VERSION_API: string = '/v3/';

    public param: SendInBlueVO = null;

    public async loadParam(): Promise<void> {
        if (!this.param) {
            let params: SendInBlueVO[] = await ModuleDAO.getInstance().getVos<SendInBlueVO>(SendInBlueVO.API_TYPE_ID);

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
            ModuleSendInBlueController.VERSION_API + path,
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
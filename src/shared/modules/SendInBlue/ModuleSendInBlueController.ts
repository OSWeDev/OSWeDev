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
        if (!this.param) {
            return null;
        }

        return ModuleRequest.getInstance().sendRequestFromApp(
            method,
            this.param.host,
            ModuleSendInBlueController.VERSION_API + path,
            posts,
            this.getHeadersRequest(),
            true
        );
    }

    public getReplyTo(): SendInBlueMailVO {
        if (!this.param) {
            return null;
        }

        return SendInBlueMailVO.createNew(
            this.param.replyto_name,
            this.param.replyto_email
        );
    }

    public getReplyToEmail(): string {
        return this.getReplyTo() ? this.getReplyTo().email : null;
    }

    public getSender(): SendInBlueMailVO {
        if (!this.param) {
            return null;
        }

        return SendInBlueMailVO.createNew(
            this.param.sender_name,
            this.param.sender_email
        );
    }

    public getSenderName(): string {
        return this.getSender() ? this.getSender().name : null;
    }

    public getDefaultFolderList(): string {
        return this.param ? this.param.default_folder_list : null;
    }

    private getHeadersRequest(): any {
        return {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'api-key': this.param.api_key
        };
    }
}
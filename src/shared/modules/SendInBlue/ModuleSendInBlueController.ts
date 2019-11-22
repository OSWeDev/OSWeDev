import ModuleDAO from '../DAO/ModuleDAO';
import SendInBlueVO from './vos/SendInBlueVO';

export default class ModuleSendInBlueController {

    public static getInstance(): ModuleSendInBlueController {
        if (!ModuleSendInBlueController.instance) {
            ModuleSendInBlueController.instance = new ModuleSendInBlueController();
        }
        return ModuleSendInBlueController.instance;
    }

    private static instance: ModuleSendInBlueController = null;

    private param_cache: SendInBlueVO = null;

    public async getParam(): Promise<SendInBlueVO> {
        if (!this.param_cache) {
            let params: SendInBlueVO[] = await ModuleDAO.getInstance().getVos<SendInBlueVO>(SendInBlueVO.API_TYPE_ID);

            this.param_cache = (params) ? params[0] : null;
        }

        return this.param_cache;
    }
}
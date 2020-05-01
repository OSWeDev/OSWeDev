import ModuleServerBase from '../../ModuleServerBase';
import ModuleClient from '../../../../shared/modules/Commerce/Client/ModuleClient';
import ModuleAPI from '../../../../shared/modules/API/ModuleAPI';
import NumberParamVO from '../../../../shared/modules/API/vos/apis/NumberParamVO';
import InformationsVO from '../../../../shared/modules/Commerce/Client/vos/InformationsVO';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import ClientVO from '../../../../shared/modules/Commerce/Client/vos/ClientVO';
import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';

export default class ModuleClientServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleClientServer.instance) {
            ModuleClientServer.instance = new ModuleClientServer();
        }
        return ModuleClientServer.instance;
    }

    private static instance: ModuleClientServer = null;

    constructor() {
        super(ModuleClient.getInstance().name);
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleClient.APINAME_getInformationsClientUser, this.getInformationsClientUser.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleClient.APINAME_getClientsByUserId, this.getClientsByUserId.bind(this));
    }

    public async getInformationsClientUser(param: NumberParamVO): Promise<InformationsVO> {
        return await ModuleDAOServer.getInstance().selectOne<InformationsVO>(
            InformationsVO.API_TYPE_ID,
            ' JOIN ' + VOsTypesManager.getInstance().moduleTables_by_voType[ClientVO.API_TYPE_ID].full_name + ' c on c.informations_id = t.id ' +
            ' WHERE c.user_id = $1', [param.num]
        );
    }

    public async getClientsByUserId(param: NumberParamVO): Promise<ClientVO[]> {
        if (!param.num) {
            return null;
        }

        return await ModuleDAOServer.getInstance().selectAll<ClientVO>(
            ClientVO.API_TYPE_ID,
            ' WHERE t.user_id = $1', [param.num]
        );
    }

    public async getFirstClientByUser(user: UserVO): Promise<ClientVO> {
        if ((!user) || (!user.id)) {
            return null;
        }

        return await this.getFirstClientByUserId(user.id);
    }

    public async getFirstClientByUserId(uid: number): Promise<ClientVO> {
        if (!uid) {
            return null;
        }

        let clients: ClientVO[] = await this.getClientsByUserId(new NumberParamVO(uid));

        return (clients && clients.length > 0) ? clients[0] : null;
    }

}
import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import APIControllerWrapper from '../../../../shared/modules/API/APIControllerWrapper';
import ModuleClient from '../../../../shared/modules/Commerce/Client/ModuleClient';
import ClientVO from '../../../../shared/modules/Commerce/Client/vos/ClientVO';
import InformationsVO from '../../../../shared/modules/Commerce/Client/vos/InformationsVO';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleTableController from '../../../../shared/modules/DAO/ModuleTableController';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ModuleServerBase from '../../ModuleServerBase';

export default class ModuleClientServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
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

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleClient.APINAME_getInformationsClientUser, this.getInformationsClientUser.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleClient.APINAME_getClientsByUserId, this.getClientsByUserId.bind(this));
    }

    public async getInformationsClientUser(num: number): Promise<InformationsVO> {
        return ModuleDAOServer.instance.selectOne<InformationsVO>(
            InformationsVO.API_TYPE_ID,
            ' JOIN ' + ModuleTableController.module_tables_by_vo_type[ClientVO.API_TYPE_ID].full_name + ' c on c.informations_id = t.id ' +
            ' WHERE c.user_id = $1', [num]
        );
    }

    public async getClientsByUserId(num: number): Promise<ClientVO[]> {
        if (!num) {
            return null;
        }

        return query(ClientVO.API_TYPE_ID).filter_by_num_eq(field_names<ClientVO>().user_id, num).select_vos<ClientVO>();
    }

    public async getFirstClientByUser(user: UserVO): Promise<ClientVO> {
        if ((!user) || (!user.id)) {
            return null;
        }

        return this.getFirstClientByUserId(user.id);
    }

    public async getFirstClientByUserId(uid: number): Promise<ClientVO> {
        if (!uid) {
            return null;
        }

        const clients: ClientVO[] = await this.getClientsByUserId(uid);

        return (clients && clients.length > 0) ? clients[0] : null;
    }

}
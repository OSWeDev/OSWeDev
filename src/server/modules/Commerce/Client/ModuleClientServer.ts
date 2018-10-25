import ModuleServerBase from '../../ModuleServerBase';
import ModuleClient from '../../../../shared/modules/Commerce/Client/ModuleClient';
import ModuleAPI from '../../../../shared/modules/API/ModuleAPI';
import NumberParamVO from '../../../../shared/modules/API/vos/apis/NumberParamVO';
import InformationsVO from '../../../../shared/modules/Commerce/Client/vos/InformationsVO';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import ClientVO from '../../../../shared/modules/Commerce/Client/vos/ClientVO';

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
    }

    public async getInformationsClientUser(param: NumberParamVO): Promise<InformationsVO> {
        return await ModuleDAOServer.getInstance().selectOne<InformationsVO>(
            InformationsVO.API_TYPE_ID,
            ' JOIN ' + VOsTypesManager.getInstance().moduleTables_by_voType[ClientVO.API_TYPE_ID].full_name + ' c on c.informations_id = t.id ' +
            ' WHERE c.user_id = $1', [param.num]
        );
    }
}
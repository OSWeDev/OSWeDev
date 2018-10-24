import ModuleServerBase from '../../ModuleServerBase';
import ModuleCommande from '../../../../shared/modules/Commerce/Commande/ModuleCommande';
import ModuleAPI from '../../../../shared/modules/API/ModuleAPI';
import NumberParamVO from '../../../../shared/modules/API/vos/apis/NumberParamVO';
import CommandeVO from '../../../../shared/modules/Commerce/Commande/vos/CommandeVO';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ModuleClient from '../../../../shared/modules/Commerce/Client/ModuleClient';
import LigneCommandeVO from '../../../../shared/modules/Commerce/Commande/vos/LigneCommandeVO';

export default class ModuleCommandeServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleCommandeServer.instance) {
            ModuleCommandeServer.instance = new ModuleCommandeServer();
        }
        return ModuleCommandeServer.instance;
    }

    private static instance: ModuleCommandeServer = null;

    constructor() {
        super(ModuleCommande.getInstance().name);
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleCommande.APINAME_getCommandesUser, this.getCommandesUser.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleCommande.APINAME_getLignesCommandeByCommandeId, this.getLignesCommandeByCommandeId.bind(this));
    }

    public async getCommandesUser(param: NumberParamVO): Promise<CommandeVO[]> {
        return await ModuleDAOServer.getInstance().selectAll<CommandeVO>(
            CommandeVO.API_TYPE_ID,
            ' JOIN ' + ModuleClient.getInstance().datatable_client.full_name + ' c on c.id = t.client_id ' +
            ' WHERE c.user_id = $1', [param.num]
        );
    }

    public async getLignesCommandeByCommandeId(param: NumberParamVO): Promise<LigneCommandeVO[]> {
        return await ModuleDAOServer.getInstance().selectAll<LigneCommandeVO>(
            LigneCommandeVO.API_TYPE_ID,
            ' JOIN ' + ModuleClient.getInstance().datatable_client.full_name + ' c on c.id = t.client_id ' +
            ' WHERE c.user_id = $1', [param.num]
        );
    }
}
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleAPI from '../../../../shared/modules/API/ModuleAPI';
import NumberAndStringParamVO from '../../../../shared/modules/API/vos/apis/NumberAndStringParamVO';
import NumberParamVO from '../../../../shared/modules/API/vos/apis/NumberParamVO';
import ClientVO from '../../../../shared/modules/Commerce/Client/vos/ClientVO';
import ModuleCommande from '../../../../shared/modules/Commerce/Commande/ModuleCommande';
import CommandeVO from '../../../../shared/modules/Commerce/Commande/vos/CommandeVO';
import LigneCommandeVO from '../../../../shared/modules/Commerce/Commande/vos/LigneCommandeVO';
import ParamLigneCommandeVO from '../../../../shared/modules/Commerce/Commande/vos/ParamLigneCommandeVO';
import ProduitParamLigneParamVO from '../../../../shared/modules/Commerce/Produit/vos/apis/ProduitParamLigneParamVO';
import ProduitsParamLignesParamVO from '../../../../shared/modules/Commerce/Produit/vos/apis/ProduitsParamLignesParamVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ModuleServerBase from '../../ModuleServerBase';
import ModuleClientServer from '../Client/ModuleClientServer';
import ModuleProduitServer from '../Produit/ModuleProduitServer';
import moment = require('moment');
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
        ModuleAPI.getInstance().registerServerApiHandler(ModuleCommande.APINAME_ajouterAuPanier, this.ajouterAuPanier.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleCommande.APINAME_getParamLigneCommandeById, this.getParamLigneCommandeById.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleCommande.APINAME_creationPanier, this.creationPanier.bind(this));
    }

    public async getCommandesUser(param: NumberParamVO): Promise<CommandeVO[]> {
        return await ModuleDAOServer.getInstance().selectAll<CommandeVO>(
            CommandeVO.API_TYPE_ID,
            ' JOIN ' + VOsTypesManager.getInstance().moduleTables_by_voType[ClientVO.API_TYPE_ID].full_name + ' c on c.id = t.client_id ' +
            ' WHERE c.user_id = $1', [param.num]
        );
    }

    public async getLignesCommandeByCommandeId(param: NumberParamVO): Promise<LigneCommandeVO[]> {
        return await ModuleDAOServer.getInstance().selectAll<LigneCommandeVO>(
            LigneCommandeVO.API_TYPE_ID,
            ' JOIN ' + VOsTypesManager.getInstance().moduleTables_by_voType[CommandeVO.API_TYPE_ID].full_name + ' commande on commande.id = t.commande_id ' +
            ' JOIN ' + VOsTypesManager.getInstance().moduleTables_by_voType[ClientVO.API_TYPE_ID].full_name + ' client on client.id = commande.client_id ' +
            ' WHERE t.commande_id = $1', [param.num]
        );
    }

    public async creationPanier(): Promise<CommandeVO> {
        let client: ClientVO = await ModuleClientServer.getInstance().getFirstClientByUserId(ModuleAccessPolicy.getInstance().connected_user);
        let panier: CommandeVO = new CommandeVO();
        panier.client_id = (client) ? client.id : null;
        panier.date = moment().utc(true).toLocaleString();
        panier.statut = CommandeVO.STATUT_PANIER;

        let result: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(panier);

        panier.id = (result) ? parseInt(result.id) : null;

        return panier;
    }

    public async ajouterAuPanier(param: ProduitsParamLignesParamVO): Promise<CommandeVO> {
        if (param.produitsParam) {
            for (let i in param.produitsParam) {
                this.ajouterLigneCommande(param.commande, param.produitsParam[i]);
            }
        }

        return param.commande;
    }

    public async ajouterLigneCommande(commande: CommandeVO, produitParam: ProduitParamLigneParamVO): Promise<void> {
        if (!commande || !produitParam) {
            return null;
        }

        let client: ClientVO = await ModuleClientServer.getInstance().getFirstClientByUserId(ModuleAccessPolicy.getInstance().connected_user);
        let ligne: LigneCommandeVO = new LigneCommandeVO();
        ligne.commande_id = commande.id;
        ligne.informations_id = (client) ? client.informations_id : null;
        ligne.prix_unitaire = await ModuleProduitServer.getInstance().getPrixProduit(produitParam);
        ligne.produit_id = produitParam.produit.id;
        ligne.quantite = 1;

        let result: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(ligne);

        produitParam.ligneParam.ligne_commande_id = parseInt(result.id);

        await ModuleDAO.getInstance().insertOrUpdateVO(produitParam.ligneParam);
    }

    public async getParamLigneCommandeById(param: NumberAndStringParamVO): Promise<ParamLigneCommandeVO> {
        return await ModuleDAOServer.getInstance().selectOne<ParamLigneCommandeVO>(
            param.text,
            ' WHERE t.ligne_commande_id = $1', [param.num]
        );
    }
}
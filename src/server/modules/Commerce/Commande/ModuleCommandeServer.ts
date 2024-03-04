import APIControllerWrapper from '../../../../shared/modules/API/APIControllerWrapper';
import ModuleAPI from '../../../../shared/modules/API/ModuleAPI';
import ClientVO from '../../../../shared/modules/Commerce/Client/vos/ClientVO';
import ModuleCommande from '../../../../shared/modules/Commerce/Commande/ModuleCommande';
import CommandeVO from '../../../../shared/modules/Commerce/Commande/vos/CommandeVO';
import LigneCommandeVO from '../../../../shared/modules/Commerce/Commande/vos/LigneCommandeVO';
import ParamLigneCommandeVO from '../../../../shared/modules/Commerce/Commande/vos/ParamLigneCommandeVO';
import ProduitParamLigneParamVO from '../../../../shared/modules/Commerce/Produit/vos/apis/ProduitParamLigneParamVO';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import VOsTypesManager from '../../../../shared/modules/VO/manager/VOsTypesManager';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import ModuleAccessPolicyServer from '../../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ModuleServerBase from '../../ModuleServerBase';
import ModuleClientServer from '../Client/ModuleClientServer';
import ModuleProduitServer from '../Produit/ModuleProduitServer';

export default class ModuleCommandeServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
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

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleCommande.APINAME_getCommandesUser, this.getCommandesUser.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleCommande.APINAME_getLignesCommandeByCommandeId, this.getLignesCommandeByCommandeId.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleCommande.APINAME_ajouterAuPanier, this.ajouterAuPanier.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleCommande.APINAME_getParamLigneCommandeById, this.getParamLigneCommandeById.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleCommande.APINAME_creationPanier, this.creationPanier.bind(this));
    }

    public async getCommandesUser(num: number): Promise<CommandeVO[]> {
        return await query(CommandeVO.API_TYPE_ID).filter_by_num_eq(field_names<ClientVO>().user_id, num, ClientVO.API_TYPE_ID).select_vos<CommandeVO>();
    }

    public async getLignesCommandeByCommandeId(num: number): Promise<LigneCommandeVO[]> {
        return await query(LigneCommandeVO.API_TYPE_ID).filter_by_num_eq(field_names<LigneCommandeVO>().commande_id, num).select_vos<LigneCommandeVO>();
    }

    public async creationPanier(): Promise<CommandeVO> {
        const client: ClientVO = await ModuleClientServer.getInstance().getFirstClientByUserId(ModuleAccessPolicyServer.getLoggedUserId());
        const panier: CommandeVO = new CommandeVO();
        panier.client_id = (client) ? client.id : null;
        panier.date = Dates.now();
        panier.statut = CommandeVO.STATUT_PANIER;

        const result: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(panier);
        panier.id = result.id;

        return panier;
    }

    public async ajouterAuPanier(
        produitsParam: ProduitParamLigneParamVO[],
        commande: CommandeVO
    ): Promise<CommandeVO> {

        if (produitsParam) {
            for (const i in produitsParam) {
                await this.ajouterLigneCommande(commande, produitsParam[i]);
            }
        }

        return commande;
    }

    public async getParamLigneCommandeById(num: number, text: string): Promise<ParamLigneCommandeVO> {
        return await ModuleDAOServer.getInstance().selectOne<ParamLigneCommandeVO>(
            text,
            ' WHERE t.ligne_commande_id = $1', [num]
        );
    }

    private async ajouterLigneCommande(commande: CommandeVO, produitParam: ProduitParamLigneParamVO): Promise<void> {
        if (!commande || !produitParam) {
            return null;
        }

        const client: ClientVO = await ModuleClientServer.getInstance().getFirstClientByUserId(ModuleAccessPolicyServer.getLoggedUserId());
        const ligne: LigneCommandeVO = new LigneCommandeVO();
        ligne.commande_id = commande.id;
        ligne.informations_id = (client) ? client.informations_id : null;
        ligne.prix_unitaire = await ModuleProduitServer.getInstance().getPrixProduit(produitParam.produit, produitParam.produit_custom, produitParam.ligneParam);
        ligne.produit_id = produitParam.produit.id;
        ligne.quantite = 1;

        const result: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(ligne);
        produitParam.ligneParam.ligne_commande_id = result.id;

        await ModuleDAO.getInstance().insertOrUpdateVO(produitParam.ligneParam);
    }
}
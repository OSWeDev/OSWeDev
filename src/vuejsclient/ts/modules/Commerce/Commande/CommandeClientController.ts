import APIControllerWrapper from "../../../../../shared/modules/API/APIControllerWrapper";
import ModuleCommande from '../../../../../shared/modules/Commerce/Commande/ModuleCommande';
import CommandeVO from '../../../../../shared/modules/Commerce/Commande/vos/CommandeVO';
import ProduitParamLigneParamVO from '../../../../../shared/modules/Commerce/Produit/vos/apis/ProduitParamLigneParamVO';
import AjaxCacheClientController from "../../AjaxCache/AjaxCacheClientController";

export default class CommandeClientController {

    // istanbul ignore next: nothing to test
    public static getInstance(): CommandeClientController {
        if (!CommandeClientController.instance) {
            CommandeClientController.instance = new CommandeClientController();
        }
        return CommandeClientController.instance;
    }

    private static instance: CommandeClientController = null;

    public async ajouterAuPanier(produitsParam: ProduitParamLigneParamVO[]): Promise<CommandeVO> {
        let panier: CommandeVO = await this.getPanierEnCours();
        return await APIControllerWrapper.sah(ModuleCommande.APINAME_ajouterAuPanier)(produitsParam, panier) as CommandeVO;
    }

    public async getPanierEnCours(): Promise<CommandeVO> {
        let result: { panier_id: number } = await AjaxCacheClientController.getInstance().get('/getIdPanierEnCours', null) as { panier_id: number };
        let panier: CommandeVO = null;

        if (!result || !result.panier_id) {
            panier = await ModuleCommande.getInstance().creationPanier();
        }

        return panier;
    }
}
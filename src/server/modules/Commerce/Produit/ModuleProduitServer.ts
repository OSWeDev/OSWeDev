import APIControllerWrapper from '../../../../shared/modules/API/APIControllerWrapper';
import ParamLigneCommandeVO from '../../../../shared/modules/Commerce/Commande/vos/ParamLigneCommandeVO';
import ModuleProduit from '../../../../shared/modules/Commerce/Produit/ModuleProduit';
import FacturationProduitVO from '../../../../shared/modules/Commerce/Produit/vos/FacturationProduitVO';
import ProduitVO from '../../../../shared/modules/Commerce/Produit/vos/ProduitVO';
import ProduitVOBase from '../../../../shared/modules/Commerce/Produit/vos/ProduitVOBase';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ModuleServerBase from '../../ModuleServerBase';
import ProduitControllersManager from './ProduitControllersManager';

export default class ModuleProduitServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleProduitServer.instance) {
            ModuleProduitServer.instance = new ModuleProduitServer();
        }
        return ModuleProduitServer.instance;
    }

    private static instance: ModuleProduitServer = null;

    constructor() {
        super(ModuleProduit.getInstance().name);
    }

    public registerServerApiHandlers() {
        // APIControllerWrapper.getInstance().registerServerApiHandler(ModuleProduit.APINAME_getProduitAjoutPanier, this.getProduitAjoutPanier.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleProduit.APINAME_getFacturationProduitByIdProduit, this.getFacturationProduitByIdProduit.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleProduit.APINAME_getPrixProduit, this.getPrixProduit.bind(this));
    }

    public async getFacturationProduitByIdProduit(num: number): Promise<FacturationProduitVO[]> {
        return await query(FacturationProduitVO.API_TYPE_ID).filter_by_num_eq('produit_id', num).select_vos<FacturationProduitVO>();
    }

    public async getPrixProduit(
        produit: ProduitVO,
        produit_custom: ProduitVOBase,
        ligneParam: ParamLigneCommandeVO
    ): Promise<number> {
        return ProduitControllersManager.getInstance().get_registered_product_controller(produit_custom).calcPrixProduit(produit, produit_custom, ligneParam);
    }
}
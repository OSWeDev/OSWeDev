import APIControllerWrapper from '../../../../shared/modules/API/APIControllerWrapper';
import ParamLigneCommandeVO from '../../../../shared/modules/Commerce/Commande/vos/ParamLigneCommandeVO';
import ModuleProduit from '../../../../shared/modules/Commerce/Produit/ModuleProduit';
import FacturationProduitVO from '../../../../shared/modules/Commerce/Produit/vos/FacturationProduitVO';
import ProduitVO from '../../../../shared/modules/Commerce/Produit/vos/ProduitVO';
import ProduitVOBase from '../../../../shared/modules/Commerce/Produit/vos/ProduitVOBase';
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

    // public async getProduitAjoutPanier(text: string): Promise<ProduitVO> {
    //     let produits: ProduitVO[] = await ModuleDAOServer.getInstance().selectAll<ProduitVO>(ProduitVO.API_TYPE_ID);

    //     if (!produits) {
    //         return null;
    //     }
    //     let types_produit: TypeProduitVO[] = await ModuleDAOServer.getInstance().selectAll<TypeProduitVO>(TypeProduitVO.API_TYPE_ID);

    //     if (!types_produit) {
    //         return null;
    //     }
    //     let type_produit: TypeProduitVO = types_produit.find((t) => t.vo_type_produit == param.text);

    //     if (!type_produit) {
    //         return null;
    //     }

    //     return produits.find((p) => p.type_produit_id == type_produit.id);
    // }

    public async getFacturationProduitByIdProduit(num: number): Promise<FacturationProduitVO[]> {
        return await ModuleDAOServer.getInstance().selectAll<FacturationProduitVO>(
            FacturationProduitVO.API_TYPE_ID,
            ' WHERE t.produit_id = $1', [num]
        );
    }

    public async getPrixProduit(
        produit: ProduitVO,
        produit_custom: ProduitVOBase,
        ligneParam: ParamLigneCommandeVO
    ): Promise<number> {
        return ProduitControllersManager.getInstance().get_registered_product_controller(produit_custom).calcPrixProduit(produit, produit_custom, ligneParam);
    }
}
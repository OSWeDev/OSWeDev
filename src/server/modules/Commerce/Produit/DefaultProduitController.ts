import ProduitVO from '../../../../shared/modules/Commerce/Produit/vos/ProduitVO';
import ProduitVOBase from '../../../../shared/modules/Commerce/Produit/vos/ProduitVOBase';
import ProduitControllerBase from './ProduitControllerBase';
import ParamLigneCommandeVO from '../../../../shared/modules/Commerce/Commande/vos/ParamLigneCommandeVO';

export default class DefaultProduitController extends ProduitControllerBase {

    public static getInstance() {
        if (!DefaultProduitController.instance) {
            DefaultProduitController.instance = new DefaultProduitController();
        }
        return DefaultProduitController.instance;
    }

    private static instance: DefaultProduitController = null;

    private constructor() {
        super(null);
    }

    public async calcPrixProduit(produit: ProduitVO, produit_base: ProduitVOBase, ligneParam: ParamLigneCommandeVO): Promise<number> {
        return produit.prix;
    }
}
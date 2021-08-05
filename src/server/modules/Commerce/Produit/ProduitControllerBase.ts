import ProduitVO from '../../../../shared/modules/Commerce/Produit/vos/ProduitVO';
import ProduitVOBase from '../../../../shared/modules/Commerce/Produit/vos/ProduitVOBase';
import ProduitControllersManager from './ProduitControllersManager';
import ParamLigneCommandeVO from '../../../../shared/modules/Commerce/Commande/vos/ParamLigneCommandeVO';

export default abstract class ProduitControllerBase {

    protected constructor(public vo_type_produit: string) {
        if (vo_type_produit) {
            ProduitControllersManager.getInstance().register_product_controller(this);
        }
    }

    public abstract calcPrixProduit(produit: ProduitVO, produit_base: ProduitVOBase, ligneParam: ParamLigneCommandeVO): Promise<number>;
}
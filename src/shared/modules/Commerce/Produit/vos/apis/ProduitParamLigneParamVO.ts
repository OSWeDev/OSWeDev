import ProduitVO from '../ProduitVO';
import ProduitVOBase from '../ProduitVOBase';
import ParamLigneCommandeVO from '../../../Commande/vos/ParamLigneCommandeVO';

export default class ProduitParamLigneParamVO {

    public static async translateCheckAccessParams(produit: ProduitVO, produit_custom: ProduitVOBase, ligneParam: ParamLigneCommandeVO): Promise<ProduitParamLigneParamVO> {
        return new ProduitParamLigneParamVO(produit, produit_custom, ligneParam);
    }

    public constructor(
        public produit: ProduitVO,
        public produit_custom: ProduitVOBase,
        public ligneParam: ParamLigneCommandeVO
    ) { }
}
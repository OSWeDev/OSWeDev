import ProduitVO from '../../Produit/vos/ProduitVO';
import InformationsVO from '../../Client/vos/InformationsVO';
import LigneCommandeVO from './LigneCommandeVO';
import ParamLigneCommandeVO from './ParamLigneCommandeVO';

export default class LigneCommandeDetailsVO {
    public constructor(
        public ligne: LigneCommandeVO,
        public produit: ProduitVO,
        public informations: InformationsVO,
        public ligneParam: ParamLigneCommandeVO
    ) { }
}
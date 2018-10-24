import ServiceVO from '../../Service/vos/ServiceVO';
import ProduitVO from '../../Produit/vos/ProduitVO';
import InformationsVO from '../../Client/vos/InformationsVO';
import LigneCommandeVO from './LigneCommandeVO';

export default class LigneCommandeDetailsVO {
    public constructor(
        public ligne: LigneCommandeVO,
        public service: ServiceVO,
        public produit: ProduitVO,
        public informations: InformationsVO) { }
}
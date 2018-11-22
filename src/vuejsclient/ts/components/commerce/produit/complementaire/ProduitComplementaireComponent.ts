import Component from 'vue-class-component';
import VueComponentBase from '../../../VueComponentBase';
import ProduitVO from '../../../../../../shared/modules/Commerce/Produit/vos/ProduitVO';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';

@Component({
    template: require('./ProduitComplementaireComponent.pug'),
    components: {}
})
export default class ProduitComplementaireComponent extends VueComponentBase {
    private produits: ProduitVO[] = null;

    private async created(): Promise<void> {
        this.startLoading();

        // Récupération des produits
        this.produits = await ModuleDAO.getInstance().getVos<ProduitVO>(ProduitVO.API_TYPE_ID);

        // Fin de chargement
        this.stopLoading();
    }

    get produits_complementaires(): ProduitVO[] {
        return (this.produits) ? this.produits.filter((p: ProduitVO) => p.is_complementaire) : null;
    }
}
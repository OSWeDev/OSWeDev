import Component from 'vue-class-component';
import VueComponentBase from '../../../VueComponentBase';
import { Prop } from 'vue-property-decorator';
import PanierAjoutLigneComponent from './ligne/PanierAjoutLigneComponent';
import ModuleCommande from '../../../../../../shared/modules/Commerce/Commande/ModuleCommande';
import ProduitParamLigneParamVO from '../../../../../../shared/modules/Commerce/Produit/vos/apis/ProduitParamLigneParamVO';

@Component({
    template: require('./PanierAjoutComponent.pug'),
    components: {
        panier_ajout_ligne: PanierAjoutLigneComponent
    }
})
export default class PanierAjoutComponent extends VueComponentBase {
    @Prop({ default: null })
    private produitsParam: ProduitParamLigneParamVO[];

    private async created(): Promise<void> {
        this.startLoading();

        // Fin de chargement
        this.stopLoading();
    }

    private async ajouterAuPanier(): Promise<void> {
        await ModuleCommande.getInstance().ajouterAuPanier(this.produitsParam);
    }
}
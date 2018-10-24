import Component from 'vue-class-component';
import VueComponentBase from '../../../../VueComponentBase';
import { Prop } from 'vue-property-decorator';
import LigneCommandeDetailsVO from '../../../../../../../shared/modules/Commerce/Commande/vos/LigneCommandeDetailsVO';
import { timingSafeEqual } from 'crypto';

@Component({
    template: require('./CommandeDetailLigneComponent.pug'),
    components: {}
})
export default class CommandeDetailLigneComponent extends VueComponentBase {
    @Prop()
    private detail: LigneCommandeDetailsVO;

    get produitTitle(): string {
        if (this.detail && this.detail.produit) {
            return this.detail.produit.titre;
        }

        return null;
    }

    get prixUnitaire(): number {
        if (this.detail && this.detail.ligne) {
            return this.detail.ligne.prix_unitaire;
        }

        return null;
    }

    get quantite(): number {
        if (this.detail && this.detail.ligne) {
            return this.detail.ligne.quantite;
        }

        return null;
    }

    get total(): number {
        if (this.prixUnitaire && this.quantite) {
            return this.prixUnitaire * this.quantite;
        }

        return null;
    }
}
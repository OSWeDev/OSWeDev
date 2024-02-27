import Component from 'vue-class-component';
import VueComponentBase from '../../../../VueComponentBase';
import { Prop } from 'vue-property-decorator';
import LigneCommandeDetailsVO from '../../../../../../../shared/modules/Commerce/Commande/vos/LigneCommandeDetailsVO';

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

    get produitDescription(): string {
        let returnValue: string = null;

        if (this.detail && this.detail.ligneParam) {
            returnValue = "<ul>";
            const disableAttr: string[] = [
                '_type',
                'id',
                'service_id'
            ];

            Object.keys(this.detail.ligneParam).forEach((attr: string) => {
                if (this.detail.ligneParam[attr] != null && disableAttr.indexOf(attr) == -1) {
                    returnValue += "<li>" + this.label('client.commande.ligne.service.' + attr) + " : " + this.detail.ligneParam[attr] + "</li>";
                }
            });

            returnValue += "</ul>";
        }

        return returnValue;
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
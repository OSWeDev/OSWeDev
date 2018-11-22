import Component from 'vue-class-component';
import VueComponentBase from '../../../VueComponentBase';
import { Prop } from 'vue-property-decorator';
import CommandeVO from '../../../../../../shared/modules/Commerce/Commande/vos/CommandeVO';
import ModuleCommande from '../../../../../../shared/modules/Commerce/Commande/ModuleCommande';
import LigneCommandeDetailsVO from '../../../../../../shared/modules/Commerce/Commande/vos/LigneCommandeDetailsVO';
import CommandeDetailLigneComponent from './ligne/CommandeDetailLigneComponent';

@Component({
    template: require('./CommandeDetailComponent.pug'),
    components: {
        'ligne-detail': CommandeDetailLigneComponent
    }
})
export default class CommandeDetailComponent extends VueComponentBase {
    @Prop()
    private commande_id: number;

    private commande: CommandeVO = null;
    private details: LigneCommandeDetailsVO[] = null;

    private async created(): Promise<void> {
        this.startLoading();

        // On charge la commande
        this.commande = await ModuleCommande.getInstance().getCommandeById(this.commande_id);

        if (this.commande) {
            this.details = await ModuleCommande.getInstance().getDetailsLignesCommandeByCommandeId(this.commande.id);
        }

        // Fin de chargement
        this.stopLoading();
    }

    get totalCommande(): number {
        let total: number = 0;

        if (!this.details) {
            return null;
        }

        for (let i in this.details) {
            let details: LigneCommandeDetailsVO = this.details[i];

            if (details.ligne && details.ligne.prix_unitaire && details.ligne.quantite) {
                total += (details.ligne.prix_unitaire * details.ligne.quantite);
            }
        }

        return total;
    }

    get statutCommande(): string {
        return ModuleCommande.getInstance().getStatutCommande(this.commande);
    }
}
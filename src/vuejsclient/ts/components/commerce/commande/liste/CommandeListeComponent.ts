import Component from 'vue-class-component';
import ModuleCommande from '../../../../../../shared/modules/Commerce/Commande/ModuleCommande';
import CommandeVO from '../../../../../../shared/modules/Commerce/Commande/vos/CommandeVO';
import VueAppController from '../../../../../VueAppController';
import VueComponentBase from '../../../VueComponentBase';
import CommandeListeLigneComponent from './ligne/CommandeListeLigneComponent';

@Component({
    template: require('./CommandeListeComponent.pug'),
    components: {
        'ligne-commande': CommandeListeLigneComponent
    }
})
export default class CommandeListeComponent extends VueComponentBase {
    private commandes: CommandeVO[] = null;

    private async created(): Promise<void> {
        this.startLoading();

        if (VueAppController.getInstance().data_user) {
            // On charge les commandes
            this.commandes = await ModuleCommande.getInstance().getCommandesUser(VueAppController.getInstance().data_user.id);
        }

        // Fin de chargement
        this.stopLoading();
    }
}
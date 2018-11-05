import Component from 'vue-class-component';
import VueComponentBase from '../../../VueComponentBase';
import CommandeVO from '../../../../../../shared/modules/Commerce/Commande/vos/CommandeVO';
import ModuleCommande from '../../../../../../shared/modules/Commerce/Commande/ModuleCommande';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
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

        if (ModuleAccessPolicy.getInstance().connected_user) {
            // On charge les commandes
            this.commandes = await ModuleCommande.getInstance().getCommandesUser(ModuleAccessPolicy.getInstance().connected_user.id);
        }

        // Fin de chargement
        this.stopLoading();
    }
}
import Component from 'vue-class-component';
import VueComponentBase from '../../../../VueComponentBase';
import { Prop } from 'vue-property-decorator';
import CommandeVO from '../../../../../../../shared/modules/Commerce/Commande/vos/CommandeVO';
import ModuleCommande from '../../../../../../../shared/modules/Commerce/Commande/ModuleCommande';

@Component({
    template: require('./CommandeListeLigneComponent.pug'),
    components: {}
})
export default class CommandeListeLigneComponent extends VueComponentBase {
    @Prop()
    private commande: CommandeVO;

    get routeDetail(): object {
        if (this.commande) {
            return { name: 'commande_detail', params: { commande_id: this.commande.id } };
        }

        return null;
    }

    get statutCommande(): string {
        return ModuleCommande.getInstance().getStatutCommande(this.commande);
    }
}
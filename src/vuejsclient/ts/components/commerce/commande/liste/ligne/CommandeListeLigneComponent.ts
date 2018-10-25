import Component from 'vue-class-component';
import VueComponentBase from '../../../../VueComponentBase';
import { Prop } from 'vue-property-decorator';
import CommandeVO from '../../../../../../../shared/modules/Commerce/Commande/vos/CommandeVO';

@Component({
    template: require('./CommandeDetailLigneComponent.pug'),
    components: {}
})
export default class CommandeDetailLigneComponent extends VueComponentBase {
    @Prop()
    private commande: CommandeVO;

    get routeDetail(): object {
        if (this.commande) {
            return { name: 'commande_detail', params: { commande_id: this.commande.id } };
        }

        return null;
    }
}
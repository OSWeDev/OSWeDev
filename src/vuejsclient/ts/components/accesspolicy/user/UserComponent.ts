import Component from 'vue-class-component';
import ClientComponent from '../../commerce/client/ClientComponent';
import VueComponentBase from '../../VueComponentBase';
import UserCompteComponent from './compte/UserCompteComponent';

@Component({
    template: require('./UserComponent.pug'),
    components: {
        'user-compte': UserCompteComponent,
        'user-informations': ClientComponent,
    }
})
export default class UserComponent extends VueComponentBase {
    private async created(): Promise<void> { }
}
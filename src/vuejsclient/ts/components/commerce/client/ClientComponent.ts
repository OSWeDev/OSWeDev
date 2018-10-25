import Component from 'vue-class-component';
import VueComponentBase from '../../VueComponentBase';
import UserVO from '../../../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleAccessPolicy from '../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ClientVO from '../../../../../shared/modules/Commerce/Client/vos/ClientVO';
import ModuleClient from '../../../../../shared/modules/Commerce/Client/ModuleClient';
import InformationsVO from '../../../../../shared/modules/Commerce/Client/vos/InformationsVO';

@Component({
    template: require('./ClientComponent.pug'),
    components: {}
})
export default class ClientComponent extends VueComponentBase {
    public client: InformationsVO = null;

    private async created(): Promise<void> {
        if (ModuleAccessPolicy.getInstance().connected_user) {
            // On charge les infos client
            this.client = await ModuleClient.getInstance().getInformationsClientUser(ModuleAccessPolicy.getInstance().connected_user.id);
        }
    }
}
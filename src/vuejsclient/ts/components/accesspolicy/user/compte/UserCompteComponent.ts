import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import VueComponentBase from '../../../VueComponentBase';
import UserVO from '../../../../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';

@Component({
    template: require('./UserCompteComponent.pug'),
    components: {}
})
export default class UserCompteComponent extends VueComponentBase {
    public user: UserVO = ModuleAccessPolicy.getInstance().connected_user;

    private async created(): Promise<void> { }
}
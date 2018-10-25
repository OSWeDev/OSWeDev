import Component from 'vue-class-component';
import VueComponentBase from '../../VueComponentBase';
import UserVO from '../../../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleAccessPolicy from '../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';

@Component({
    template: require('./UserComponent.pug'),
    components: {}
})
export default class UserComponent extends VueComponentBase {
    public user: UserVO = null;

    private async created(): Promise<void> {
        this.user = ModuleAccessPolicy.getInstance().connected_user;
    }
}
import { Component } from "vue-property-decorator";
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserVO from "../../../../shared/modules/AccessPolicy/vos/UserVO";
import NFCConnectLoginComponent from "../../../ts/components/NFCConnect/login/NFCConnectLoginComponent";
import VueComponentBase from '../../../ts/components/VueComponentBase';
import './AccessPolicyMyAccountComponent.scss';
import NFCUserTagListComponent from "../../../ts/components/NFCConnect/user_tag_list/NFCUserTagListComponent";
import SessionShareComponent from "../../../ts/components/session_share/SessionShareComponent";
import AccessPolicyMyAccountComponentController from "./AccessPolicyMyAccountComponentController";

@Component({
    template: require('./AccessPolicyMyAccountComponent.pug'),
    components: {
        Nfcusertaglistcomponent: NFCUserTagListComponent,
        Nfcconnectlogincomponent: NFCConnectLoginComponent,
        Sessionsharecomponent: SessionShareComponent
    }
})
export default class AccessPolicyMyAccountComponent extends VueComponentBase {

    private user: UserVO = null;
    private registered_components: VueComponentBase[] = [];

    private async logout() {
        await ModuleAccessPolicy.getInstance().logout();
    }
    private async mounted() {
        this.registered_components = AccessPolicyMyAccountComponentController.getInstance().registered_components;
        this.user = await ModuleAccessPolicy.getInstance().getSelfUser();
        if (!this.user) {
            this.$router.push('/');
        }
    }
}
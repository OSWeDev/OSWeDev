import { Component } from "vue-property-decorator";
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserVO from "../../../../shared/modules/AccessPolicy/vos/UserVO";
import NFCConnectLoginComponent from "../../../ts/components/NFCConnect/login/NFCConnectLoginComponent";
import VueComponentBase from '../../../ts/components/VueComponentBase';
import './AccessPolicyMyAccountComponent.scss';
import NFCUserTagListComponent from "../../../ts/components/NFCConnect/user_tag_list/NFCUserTagListComponent";
import SessionShareComponent from "../../../ts/components/session_share/SessionShareComponent";
import AccessPolicyMyAccountComponentController from "./AccessPolicyMyAccountComponentController";
import VOsTypesManager from "../../../../shared/modules/VO/manager/VOsTypesManager";
import SimpleDatatableFieldVO from "../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO";

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

    get editable_login_tooltip() {
        if (!this.editable_login) {
            return null;
        }

        return this.t(this.editable_login.translatable_title);
    }

    get editable_firstname_tooltip() {
        if (!this.editable_firstname) {
            return null;
        }

        return this.t(this.editable_firstname.translatable_title);
    }

    get editable_lastname_tooltip() {
        if (!this.editable_lastname) {
            return null;
        }

        return this.t(this.editable_lastname.translatable_title);
    }

    get editable_email_tooltip() {
        if (!this.editable_email) {
            return null;
        }

        return this.t(this.editable_email.translatable_title);
    }

    get editable_phone_tooltip() {
        if (!this.editable_phone) {
            return null;
        }

        return this.t(this.editable_phone.translatable_title);
    }

    get user_moduletable() {
        return VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID];
    }

    get show_firstname_field() {
        return AccessPolicyMyAccountComponentController.getInstance().show_firstname_field;
    }

    get show_lastname_field() {
        return AccessPolicyMyAccountComponentController.getInstance().show_lastname_field;
    }

    get editable_login() {
        return SimpleDatatableFieldVO.createNew('name').setModuleTable(this.user_moduletable);
    }

    get editable_firstname() {
        return SimpleDatatableFieldVO.createNew('firstname').setModuleTable(this.user_moduletable);
    }

    get editable_lastname() {
        return SimpleDatatableFieldVO.createNew('lastname').setModuleTable(this.user_moduletable);
    }

    get editable_email() {
        return SimpleDatatableFieldVO.createNew('email').setModuleTable(this.user_moduletable);
    }

    get editable_phone() {
        return SimpleDatatableFieldVO.createNew('phone').setModuleTable(this.user_moduletable);
    }

    private async onchangevo() {
    }
}
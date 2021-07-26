import { Component } from "vue-property-decorator";
import ModuleNFCConnect from "../../../../../shared/modules/NFCConnect/ModuleNFCConnect";
import NFCTagVO from "../../../../../shared/modules/NFCConnect/vos/NFCTagVO";
import VueComponentBase from "../../VueComponentBase";
import './NFCUserTagListComponent.scss';
import ModuleAccessPolicy from '../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import NFCHandler from "../NFCHandler";

@Component({
    template: require('./NFCUserTagListComponent.pug')
})
export default class NFCUserTagListComponent extends VueComponentBase {

    private user_tags: NFCTagVO[] = [];
    private has_access_to_nfc: boolean = false;

    private async delete_user_tag(tag: NFCTagVO) {
        await ModuleNFCConnect.getInstance().remove_user_tag(tag.name);
        await this.update_list();
    }

    private async update_list() {
        this.user_tags = await ModuleNFCConnect.getInstance().get_own_tags();
    }

    private async mounted() {
        this.has_access_to_nfc = NFCHandler.getInstance().has_access_to_nfc;

        if (!this.has_access_to_nfc) {
            return;
        }
        this.user_tags = await ModuleNFCConnect.getInstance().get_own_tags();
    }
}
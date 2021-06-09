import { Component } from "vue-property-decorator";
import ModuleNFCConnect from "../../../../../shared/modules/NFCConnect/ModuleNFCConnect";
import NFCTagVO from "../../../../../shared/modules/NFCConnect/vos/NFCTagVO";
import VueComponentBase from "../../VueComponentBase";
import './NFCUserTagListComponent.scss';

@Component({
    template: require('./NFCUserTagListComponent.pug')
})
export default class NFCUserTagListComponent extends VueComponentBase {

    private user_tags: NFCTagVO[] = [];

    private async delete_user_tag(tag: NFCTagVO) {
        await ModuleNFCConnect.getInstance().remove_user_tag(tag.name);
        await this.update_list();
    }

    private async update_list() {
        this.user_tags = await ModuleNFCConnect.getInstance().get_own_tags();
    }

    private async mounted() {
        this.user_tags = await ModuleNFCConnect.getInstance().get_own_tags();
    }
}
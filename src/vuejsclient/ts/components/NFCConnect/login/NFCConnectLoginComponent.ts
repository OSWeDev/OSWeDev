import { Component, Prop } from "vue-property-decorator";
import ModuleAccessPolicy from "../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import ModuleNFCConnect from "../../../../../shared/modules/NFCConnect/ModuleNFCConnect";
import VueComponentBase from "../../VueComponentBase";
import NFCHandler from "../NFCHandler";
import './NFCConnectLoginComponent.scss';

@Component({
    template: require('./NFCConnectLoginComponent.pug')
})
export default class NFCConnectLoginComponent extends VueComponentBase {

    private nfcconnected: boolean = false;
    private has_access_to_nfc: boolean = false;

    private async mounted() {
        this.has_access_to_nfc = NFCHandler.getInstance().has_access_to_nfc;

        if (!this.has_access_to_nfc) {
            return;
        }

        this.check_nfc_conf();
    }

    private check_nfc_conf() {

        this.nfcconnected = !!NFCHandler.getInstance().ndef_active;
        if (!this.nfcconnected) {
            setTimeout(this.check_nfc_conf.bind(this), 1000);
        }
    }

    get nfcconnect_available() {
        return this.has_access_to_nfc && (!this.nfcconnected) && !!window['NDEFReader'];
    }

    private async nfcconnect() {

        if (await NFCHandler.getInstance().make_sure_nfc_is_initialized()) {
            this.snotify.info(this.label('login.nfcconnect.on'));
        } else {
            this.snotify.error(this.label('login.nfcconnect.off'));
        }
    }
}
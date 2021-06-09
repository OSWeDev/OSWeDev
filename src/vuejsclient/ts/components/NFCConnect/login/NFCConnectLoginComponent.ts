import { Component, Prop } from "vue-property-decorator";
import VueComponentBase from "../../VueComponentBase";
import NFCHandler from "../NFCHandler";
import './NFCConnectLoginComponent.scss';

@Component({
    template: require('./NFCConnectLoginComponent.pug')
})
export default class NFCConnectLoginComponent extends VueComponentBase {

    private nfcconnected: boolean = false;

    private mounted() {
        this.check_nfc_conf();
    }

    private check_nfc_conf() {

        this.nfcconnected = !!NFCHandler.getInstance().ndef_active;
        if (!this.nfcconnected) {
            setTimeout(this.check_nfc_conf.bind(this), 1000);
        }
    }

    get nfcconnect_available() {
        return (!this.nfcconnected) && !!window['NDEFReader'];
    }

    private async nfcconnect() {

        if (await NFCHandler.getInstance().make_sure_nfc_is_initialized()) {
            this.snotify.info(this.label('login.nfcconnect.on'));
        } else {
            this.snotify.error(this.label('login.nfcconnect.off'));
        }
    }
}
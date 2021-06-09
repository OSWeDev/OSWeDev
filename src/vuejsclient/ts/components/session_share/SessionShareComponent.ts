import { Component } from "vue-property-decorator";
import ModuleAccessPolicy from "../../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import ConsoleHandler from "../../../../shared/tools/ConsoleHandler";
import VueComponentBase from "../VueComponentBase";
import './SessionShareComponent.scss';
let QRCode = require('qrcode');

@Component({
    template: require('./SessionShareComponent.pug')
})
export default class SessionShareComponent extends VueComponentBase {

    private hidden: boolean = true;

    private email: string = null;
    private phone: string = null;

    private url: string = null;

    private async mounted() {

        let sessionid = await ModuleAccessPolicy.getInstance().get_my_sid();
        if (!sessionid) {
            return;
        }
        this.url = "http://localhost:49407/login?sessionid=" + sessionid + "#/";

        let user = await ModuleAccessPolicy.getInstance().getSelfUser();
        if (user) {
            this.email = user.email;
            this.phone = user.phone;
        }
    }

    private async send_mail() {
        if ((!this.email) || (!this.url)) {
            this.snotify.error(this.label('session_share.mail_not_sent'));
            return null;
        }

        await ModuleAccessPolicy.getInstance().send_session_share_email(this.url, this.email);

        this.snotify.info(this.label('session_share.mail_sent'));
    }

    private async send_sms() {
        if ((!this.phone) || (!this.url)) {
            this.snotify.error(this.label('session_share.sms_not_sent'));
            return null;
        }

        await ModuleAccessPolicy.getInstance().send_session_share_sms(
            this.label('session_share.sms_preurl') + this.url, this.phone);

        this.snotify.info(this.label('session_share.sms_sent'));
    }

    private open_show() {
        let canvas = document.getElementById('session_share_qr_code');
        let self = this;

        QRCode.toCanvas(canvas, this.url, function (error) {
            if (error) {
                ConsoleHandler.getInstance().error(error);
            }
            self.hidden = false;
        });
    }
}
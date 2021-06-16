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

    private session_share_url: string = null;

    private has_access_to_session_share: boolean = false;
    private can_use_navigator_share: boolean = false;

    private async mounted() {

        this.has_access_to_session_share = await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_SESSIONSHARE_ACCESS);
        if (!this.has_access_to_session_share) {
            return;
        }

        let sessionid = await ModuleAccessPolicy.getInstance().get_my_sid();
        if (!sessionid) {
            return;
        }
        this.session_share_url = window.location.origin + "/login?sessionid=" + encodeURIComponent(sessionid) + "#/";

        this.can_use_navigator_share = !!navigator['share'];
        let user = await ModuleAccessPolicy.getInstance().getSelfUser();
        if (user) {
            this.email = user.email;
            this.phone = user.phone;
        }
    }

    private async send_mail() {
        if ((!this.email) || (!this.session_share_url)) {
            this.snotify.error(this.label('session_share.mail_not_sent'));
            return null;
        }

        await ModuleAccessPolicy.getInstance().send_session_share_email(this.session_share_url, this.email);

        this.snotify.success(this.label('session_share.mail_sent'));
    }

    private async send_sms() {
        if ((!this.phone) || (!this.session_share_url)) {
            this.snotify.error(this.label('session_share.sms_not_sent'));
            return null;
        }

        await ModuleAccessPolicy.getInstance().send_session_share_sms(
            this.label('session_share.sms_preurl') + this.session_share_url, this.phone);

        this.snotify.success(this.label('session_share.sms_sent'));
    }

    private open_show() {
        let canvas = document.getElementById('session_share_qr_code');
        let self = this;

        QRCode.toCanvas(canvas, this.session_share_url, function (error) {
            if (error) {
                ConsoleHandler.getInstance().error(error);
            }
            self.hidden = false;
        });
    }

    private navigator_share() {
        if (this.can_use_navigator_share) {
            navigator['share']({
                title: this.label('session_share.navigator_share_title'),
                text: this.label('session_share.navigator_share_content'),
                url: this.session_share_url
            })
                .then(() => {
                    this.snotify.success(this.label('session_share.navigator_share_success'));
                })
                .catch((error) => {
                    this.snotify.error(this.label('session_share.navigator_share_error'));
                    ConsoleHandler.getInstance().error('navigator_share:error:' + error);
                });
        }
    }
}
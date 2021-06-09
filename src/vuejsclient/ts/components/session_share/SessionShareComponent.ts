import { Component } from "vue-property-decorator";
import SendInBlueMailServerController from "../../../../server/modules/SendInBlue/SendInBlueMailServerController";
import SendInBlueSmsServerController from "../../../../server/modules/SendInBlue/sms/SendInBlueSmsServerController";
import ModuleAccessPolicy from "../../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import ModuleParams from "../../../../shared/modules/Params/ModuleParams";
import SendInBlueMailVO from "../../../../shared/modules/SendInBlue/vos/SendInBlueMailVO";
import SendInBlueSmsFormatVO from "../../../../shared/modules/SendInBlue/vos/SendInBlueSmsFormatVO";
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

        if (!document.cookie) {
            return;
        }

        let groups = /^(.*; ?)?sid=([^;]+)(; ?(.*))?$/.exec(document.cookie);
        let sessionid = (groups[2] ? groups[2] : null);
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

        let SEND_IN_BLUE_TEMPLATE_ID = await ModuleParams.getInstance().getParamValueAsInt(ModuleAccessPolicy.PARAM_NAME_SESSION_SHARE_SEND_IN_BLUE_MAIL_ID);
        await SendInBlueMailServerController.getInstance().sendWithTemplate(
            SendInBlueMailVO.createNew("", this.email),
            SEND_IN_BLUE_TEMPLATE_ID,
            ['session_share'],
            {
                SESSION_SHARE_URL: this.url
            });

        this.snotify.info(this.label('session_share.mail_sent'));
    }

    private async send_sms() {
        if ((!this.phone) || (!this.url)) {
            this.snotify.error(this.label('session_share.sms_not_sent'));
            return null;
        }

        await SendInBlueSmsServerController.getInstance().send(
            SendInBlueSmsFormatVO.createNew(this.phone),
            this.label('session_share.sms_preurl') + this.url,
            'session_share');

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
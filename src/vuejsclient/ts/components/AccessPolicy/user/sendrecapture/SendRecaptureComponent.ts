import { Component, Prop } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserVO from '../../../../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleParams from '../../../../../../shared/modules/Params/ModuleParams';
import ModuleSendInBlue from '../../../../../../shared/modules/SendInBlue/ModuleSendInBlue';
import VueComponentBase from '../../../../../ts/components/VueComponentBase';
import MailStatsEventsComponent from '../../../mail_stats_events/MailStatsEventsComponent';
import "./SendRecaptureComponent.scss";

@Component({
    template: require('./SendRecaptureComponent.pug'),
    components: {
        Mailstatseventscomponent: MailStatsEventsComponent
    }
})
export default class SendRecaptureComponent extends VueComponentBase {

    @Prop()
    private vo: UserVO;

    private has_sms_activation: boolean = false;

    public async mounted() {
        this.has_sms_activation = await ModuleParams.getInstance().getParamValueAsBoolean(ModuleSendInBlue.PARAM_NAME_SMS_ACTIVATION);
    }

    get category_name() {
        return this.vo ? 'MAILCATEGORY.UserRecapture' : null;
    }

    get email_to() {
        return this.vo ? this.vo.email : null;
    }

    private async sendrecapture() {
        if (!this.vo) {
            return;
        }

        await ModuleAccessPolicy.getInstance().sendrecapture(this.vo.email);
        this.snotify.success(this.label('sendrecapture.ok'));
        let self = this;
        setTimeout(() => {
            if (self.$refs['mailstatsevents'] && self.$refs['mailstatsevents']['sendinblue_refresh_mail_events']) {
                self.$refs['mailstatsevents']['sendinblue_refresh_mail_events']();
            }
        }, 1000);
    }

    // private async sendrecapturesms() {
    //     if (!this.vo) {
    //         return;
    //     }

    //     await ModuleAccessPolicy.getInstance().beginrecapturesms(this.vo.email);
    //     this.snotify.success(this.label('sendrecapture.oksms'));
    // }
}
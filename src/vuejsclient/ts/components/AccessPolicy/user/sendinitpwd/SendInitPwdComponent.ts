import { Component, Prop } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserVO from '../../../../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleParams from '../../../../../../shared/modules/Params/ModuleParams';
import ModuleSendInBlue from '../../../../../../shared/modules/SendInBlue/ModuleSendInBlue';
import VueComponentBase from '../../../../../ts/components/VueComponentBase';
import MailStatsEventsComponent from '../../../mail_stats_events/MailStatsEventsComponent';
import "./SendInitPwdComponent.scss";

@Component({
    template: require('./SendInitPwdComponent.pug'),
    components: {
        Mailstatseventscomponent: MailStatsEventsComponent
    }
})
export default class SendInitPwdComponent extends VueComponentBase {

    @Prop()
    private vo: UserVO;

    private has_sms_activation: boolean = false;

    public async mounted() {
        this.has_sms_activation = await ModuleParams.getInstance().getParamValueAsBoolean(ModuleSendInBlue.PARAM_NAME_SMS_ACTIVATION);
    }

    get category_name() {
        return this.vo ? 'MAILCATEGORY.PasswordInitialisation' : null;
    }

    get email_to() {
        return this.vo ? this.vo.email : null;
    }

    private async sendinitpwd() {
        if (!this.vo) {
            return;
        }

        await ModuleAccessPolicy.getInstance().begininitpwd(this.vo.email);
        this.snotify.success(this.label('sendinitpwd.ok'));
        let self = this;
        setTimeout(() => {
            if (self.$refs['mailstatsevents'] && self.$refs['mailstatsevents']['sendinblue_refresh_mail_events']) {
                self.$refs['mailstatsevents']['sendinblue_refresh_mail_events']();
            }
        }, 1000);
    }

    private async sendinitpwdsms() {
        if (!this.vo) {
            return;
        }

        await ModuleAccessPolicy.getInstance().begininitpwdsms(this.vo.email);
        this.snotify.success(this.label('sendinitpwd.oksms'));
    }
}
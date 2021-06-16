import { Component } from "vue-property-decorator";
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';
import ModuleSASSSkinConfigurator from '../../../../shared/modules/SASSSkinConfigurator/ModuleSASSSkinConfigurator';
import ModuleSendInBlue from '../../../../shared/modules/SendInBlue/ModuleSendInBlue';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import './AccessPolicyRecoverComponent.scss';

@Component({
    template: require('./AccessPolicyRecoverComponent.pug')
})
export default class AccessPolicyRecoverComponent extends VueComponentBase {

    private email: string = "";
    private message: string = null;

    private logo_url: string = null;
    private redirect_to: string = "/";

    private has_sms_activation: boolean = false;

    private async mounted() {

        this.load_logo_url();

        let logged_id: number = await ModuleAccessPolicy.getInstance().getLoggedUserId();
        if (!!logged_id) {
            window.location = this.redirect_to as any;
        }

        for (let j in this.$route.query) {
            switch (j) {
                case 'email':
                    this.email = this.$route.query[j];
                    break;
            }
        }

        this.has_sms_activation =
            await ModuleParams.getInstance().getParamValueAsBoolean(ModuleSendInBlue.PARAM_NAME_SMS_ACTIVATION) &&
            await ModuleParams.getInstance().getParamValueAsBoolean(ModuleAccessPolicy.PARAM_NAME_CAN_RECOVER_PWD_BY_SMS);
    }

    private async load_logo_url() {
        this.logo_url = await ModuleParams.getInstance().getParamValue(ModuleSASSSkinConfigurator.MODULE_NAME + '.logo_url');
        if (this.logo_url && (this.logo_url != '""') && (this.logo_url != '')) {
            return;
        }
        this.logo_url = null;
    }

    private async recover() {
        this.snotify.info(this.label('recover.start'));

        if (await ModuleAccessPolicy.getInstance().beginRecover(this.email)) {
            this.snotify.success(this.label('recover.ok'));

            if (this.has_sms_activation) {
                this.message = this.label('login.recover.answercansms');
            } else {
                this.message = this.label('login.recover.answer');
            }

        } else {
            this.snotify.error(this.label('recover.failed'));
        }
    }

    private async recoversms() {
        this.snotify.info(this.label('recover.start'));

        if (await ModuleAccessPolicy.getInstance().beginRecoverSMS(this.email)) {
            this.snotify.success(this.label('recover.oksms'));
            this.message = this.label('login.recover.answersms');
        } else {
            this.snotify.error(this.label('recover.failed'));
        }
    }
}
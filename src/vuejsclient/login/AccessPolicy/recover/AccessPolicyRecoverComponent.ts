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
        let self = this;
        self.snotify.async(self.label('recover.start'), () =>
            new Promise(async (resolve, reject) => {

                if (await ModuleAccessPolicy.getInstance().beginRecover(self.email)) {
                    if (self.has_sms_activation) {
                        self.message = self.label('login.recover.answercansms');
                    } else {
                        self.message = self.label('login.recover.answer');
                    }

                    resolve({
                        body: self.label('recover.ok'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                } else {
                    reject({
                        body: self.label('recover.failed'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                }
            })
        );
    }

    private async recoversms() {
        let self = this;
        self.snotify.async(self.label('recover.start'), () =>
            new Promise(async (resolve, reject) => {

                if (await ModuleAccessPolicy.getInstance().beginRecoverSMS(this.email)) {
                    this.message = this.label('login.recover.answersms');
                    resolve({
                        body: self.label('recover.oksms'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                } else {
                    reject({
                        body: self.label('recover.failed'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                }
            })
        );
    }
}
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import { Component } from "vue-property-decorator";
import './AccessPolicyRecoverComponent.scss';
import ModuleSASSSkinConfigurator from '../../../../shared/modules/SASSSkinConfigurator/ModuleSASSSkinConfigurator';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';

@Component({
    template: require('./AccessPolicyRecoverComponent.pug')
})
export default class AccessPolicyRecoverComponent extends VueComponentBase {

    private email: string = "";
    private message: string = null;

    private logo_url: string = null;

    private can_recover_by_sms: boolean = false;


    private async mounted() {
        this.load_logo_url();

        for (let j in this.$route.query) {
            switch (j) {
                case 'email':
                    this.email = this.$route.query[j];
                    break;
            }
        }

        this.can_recover_by_sms = await ModuleParams.getInstance().getParamValueAsBoolean(ModuleAccessPolicy.PARAM_NAME_CAN_RECOVER_PWD_BY_SMS);
    }

    private async load_logo_url() {
        this.logo_url = await ModuleParams.getInstance().getParamValue(ModuleSASSSkinConfigurator.SASS_PARAMS_VALUES + '.logo_url');
        if (this.logo_url && (this.logo_url != '""') && (this.logo_url != '')) {
            return;
        }
        this.logo_url = null;
    }

    private async recover() {
        this.snotify.info(this.label('recover.start'));

        if (await ModuleAccessPolicy.getInstance().beginRecover(this.email)) {
            this.snotify.success(this.label('recover.ok'));
            this.message = this.label('login.recover.answer');
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
import { Component } from "vue-property-decorator";
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleSASSSkinConfigurator from '../../../../shared/modules/SASSSkinConfigurator/ModuleSASSSkinConfigurator';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import './AccessPolicyResetComponent.scss';

@Component({
    template: require('./AccessPolicyResetComponent.pug')
})
export default class AccessPolicyResetComponent extends VueComponentBase {

    private email: string = "";
    private challenge: string = "";
    private new_pwd1: string = "";

    private message: string = null;
    private status: boolean = false;

    get logo_url(): string {
        let logo_url: string = ModuleSASSSkinConfigurator.getInstance().getParamValue('logo_url');
        if (logo_url && (logo_url != '""') && (logo_url != '')) {
            return logo_url;
        }
        return null;
    }

    private mounted() {
        for (let j in this.$route.query) {
            switch (j) {
                case 'email':
                    this.email = this.$route.query[j];
                    break;
                case 'challenge':
                    this.challenge = this.$route.query[j];
                    break;
            }
        }
    }

    private async reset() {
        this.snotify.info(this.label('reset.start'));

        if (await ModuleAccessPolicy.getInstance().resetPwd(this.email, this.challenge, this.new_pwd1)) {
            this.snotify.success(this.label('reset.ok'));
            this.message = this.label('login.reset.answer_ok');
            this.status = true;
        } else {
            this.snotify.error(this.label('reset.failed'));
            this.message = this.label('login.reset.answer_ko');
            this.status = false;
        }
    }
}
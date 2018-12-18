import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import { Component } from "vue-property-decorator";
import './AccessPolicyRecoverComponent.scss';
import ModuleSASSSkinConfigurator from '../../../../shared/modules/SASSSkinConfigurator/ModuleSASSSkinConfigurator';
import VueComponentBase from '../../../ts/components/VueComponentBase';

@Component({
    template: require('./AccessPolicyRecoverComponent.pug')
})
export default class AccessPolicyRecoverComponent extends VueComponentBase {

    private email: string = "";
    private message: string = null;

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
            }
        }
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
}
import { Component, Prop } from "vue-property-decorator";
import './AccessPolicyLoginComponent.scss';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleSASSSkinConfigurator from '../../../../shared/modules/SASSSkinConfigurator/ModuleSASSSkinConfigurator';
import VueComponentBase from '../../../ts/components/VueComponentBase';

@Component({
    template: require('./AccessPolicyLoginComponent.pug')
})
export default class AccessPolicyLoginComponent extends VueComponentBase {

    private email: string = "";
    private password: string = "";

    private redirect_to: string = "/";

    get logo_url(): string {
        let logo_url: string = ModuleSASSSkinConfigurator.getInstance().getParamValue('logo_url');
        if (logo_url && (logo_url != '""') && (logo_url != '')) {
            return logo_url;
        }
        return null;
    }

    private async mounted() {
        for (let j in this.$route.query) {
            if (j == 'redirect_to') {
                this.redirect_to = this.$route.query[j];
            }
        }

        let loggedVO: UserVO = await ModuleAccessPolicy.getInstance().getLoggedUser();
        if (loggedVO) {
            window.location = this.redirect_to as any;
        }
    }

    // On log si possible, si oui on redirige
    private async login() {
        this.snotify.info(this.label('login.start'));

        let loggedVO: UserVO = await ModuleAccessPolicy.getInstance().loginAndRedirect(this.email, this.password, this.redirect_to);

        if (!loggedVO) {
            this.snotify.error(this.label('login.failed'));
            this.password = "";
        } else {
            window.location = this.redirect_to as any;
        }
    }
}
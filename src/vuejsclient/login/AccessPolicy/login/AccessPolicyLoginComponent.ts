import { Component, Prop } from "vue-property-decorator";
import './AccessPolicyLoginComponent.scss';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleSASSSkinConfigurator from '../../../../shared/modules/SASSSkinConfigurator/ModuleSASSSkinConfigurator';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import ModuleParams from "../../../../shared/modules/Params/ModuleParams";

@Component({
    template: require('./AccessPolicyLoginComponent.pug')
})
export default class AccessPolicyLoginComponent extends VueComponentBase {

    private email: string = "";
    private password: string = "";

    private redirect_to: string = "/";
    private message: string = null;

    private logo_url: string = null;

    private async mounted() {
        this.load_logo_url();
        for (let j in this.$route.query) {
            if (j == 'redirect_to') {
                this.redirect_to = this.$route.query[j];
            }
        }

        let logged_id: number = await ModuleAccessPolicy.getInstance().getLoggedUserId();
        if (!!logged_id) {
            window.location = this.redirect_to as any;
        }
    }

    private async load_logo_url() {
        this.logo_url = await ModuleParams.getInstance().getParamValue(ModuleSASSSkinConfigurator.SASS_PARAMS_VALUES + '.logo_url');
        if (this.logo_url && (this.logo_url != '""') && (this.logo_url != '')) {
            return;
        }
        this.logo_url = null;
    }

    // On log si possible, si oui on redirige
    private async login() {
        this.snotify.info(this.label('login.start'));

        let logged_id: number = await ModuleAccessPolicy.getInstance().loginAndRedirect(this.email, this.password, this.redirect_to);

        if (!logged_id) {
            this.snotify.error(this.label('login.failed'));
            this.password = "";
            this.message = this.label('login.failed.message');
        } else {
            window.location = this.redirect_to as any;
        }
    }
}
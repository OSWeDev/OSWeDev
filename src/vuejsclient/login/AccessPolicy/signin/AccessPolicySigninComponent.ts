import { Component, Prop } from "vue-property-decorator";
import './AccessPolicySigninComponent.scss';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleSASSSkinConfigurator from '../../../../shared/modules/SASSSkinConfigurator/ModuleSASSSkinConfigurator';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import ModuleParams from "../../../../shared/modules/Params/ModuleParams";
import NFCHandler from "../../../ts/components/NFCConnect/NFCHandler";
import SessionShareComponent from "../../../ts/components/session_share/SessionShareComponent";

@Component({
    template: require('./AccessPolicySigninComponent.pug'),
    components: {
        Sessionsharecomponent: SessionShareComponent
    }
})
export default class AccessPolicySigninComponent extends VueComponentBase {

    private nom: string = "";
    private email: string = "";
    private password: string = "";
    private confirm_password: string = "";

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
        this.logo_url = await ModuleParams.getInstance().getParamValue(ModuleSASSSkinConfigurator.MODULE_NAME + '.logo_url');
        if (this.logo_url && (this.logo_url != '""') && (this.logo_url != '')) {
            return;
        }
        this.logo_url = null;
    }

    // On log si possible, si oui on redirige
    private async signin() {
        this.snotify.info(this.label('signin.start'));

        let logged_id: number = null;
        if (this.password == this.confirm_password && this.nom && this.email) {
            logged_id = await ModuleAccessPolicy.getInstance().signinAndRedirect(this.nom, this.email, this.password, this.redirect_to);
        }
        if (!logged_id) {
            this.snotify.error(this.label('signin.failed'));
            this.password = "";
            this.message = this.label('signin.failed.message');
        }
        /*else {
            window.location = this.redirect_to as any;
        }*/
    }
}
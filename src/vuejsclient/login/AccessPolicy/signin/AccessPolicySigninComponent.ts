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

    @Prop()
    private footer_component: any;

    private nom: string = "";
    private email: string = "";
    private password: string = "";
    private confirm_password: string = "";

    private redirect_to: string = "/";
    private message: string = null;

    private logo_url: string = null;


    private async beforeCreate() {

        const logged_id: number = await ModuleAccessPolicy.getInstance().getLoggedUserId();
        if (logged_id) {
            window.location = this.redirect_to as any;
        }

        const signin_allowed: boolean = await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_FO_SIGNIN_ACCESS);
        if (!signin_allowed) {
            window.location = this.redirect_to as any;
        }
    }
    private async mounted() {
        await this.load_logo_url();
        for (const j in this.$route.query) {
            if (j == 'redirect_to') {
                this.redirect_to = this.$route.query[j];
            }
        }
    }


    private async load_logo_url() {
        this.logo_url = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.MODULE_NAME + '.logo_url');
        if (this.logo_url && (this.logo_url != '""') && (this.logo_url != '')) {
            return;
        }
        this.logo_url = null;
    }

    // On log si possible, si oui on redirige
    private async signin() {

        const self = this;
        self.snotify.async(self.label('signin.start'), () =>
            new Promise(async (resolve, reject) => {

                let logged_id: number = null;
                if (self.password == self.confirm_password && self.nom && self.email) {
                    logged_id = await ModuleAccessPolicy.getInstance().signinAndRedirect(self.nom, self.email, self.password, self.redirect_to);
                }
                if (!logged_id) {
                    self.password = "";
                    self.confirm_password = "";
                    self.message = self.label('signin.failed.message');
                    reject({
                        body: self.label('signin.failed'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                } else {
                    resolve({
                        body: self.label('login.ok'),
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
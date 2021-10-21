import { Component } from "vue-property-decorator";
import AccessPolicyController from "../../../../shared/modules/AccessPolicy/AccessPolicyController";
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleParams from "../../../../shared/modules/Params/ModuleParams";
import ModuleSASSSkinConfigurator from '../../../../shared/modules/SASSSkinConfigurator/ModuleSASSSkinConfigurator';
import NFCConnectLoginComponent from "../../../ts/components/NFCConnect/login/NFCConnectLoginComponent";
import NFCHandler from "../../../ts/components/NFCConnect/NFCHandler";
import SessionShareComponent from "../../../ts/components/session_share/SessionShareComponent";
import VueComponentBase from '../../../ts/components/VueComponentBase';
import './AccessPolicyLoginComponent.scss';

@Component({
    template: require('./AccessPolicyLoginComponent.pug'),
    components: {
        Nfcconnectlogincomponent: NFCConnectLoginComponent,
        Sessionsharecomponent: SessionShareComponent
    }
})
export default class AccessPolicyLoginComponent extends VueComponentBase {

    private email: string = "";
    private password: string = "";

    private redirect_to: string = "/";
    private message: string = null;

    private logo_url: string = null;
    private signin_allowed: boolean = false;

    private pdf_info: string = null;
    private pdf_cgu: string = null;

    private show_password: boolean = false;

    private async mounted() {
        let promises = [];

        promises.push(this.load_logo_url());

        for (let j in this.$route.query) {
            if (j == 'redirect_to') {
                this.redirect_to = this.$route.query[j];
            }
        }

        let logged_id: number = null;

        promises.push((async () =>
            logged_id = await ModuleAccessPolicy.getInstance().getLoggedUserId()
        )());

        promises.push((async () =>
            this.signin_allowed = await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_FO_SIGNIN_ACCESS)
        )());

        promises.push((async () =>
            this.pdf_info = await ModuleParams.getInstance().getParamValue(ModuleAccessPolicy.PARAM_NAME_LOGIN_INFOS)
        )());

        promises.push((async () =>
            this.pdf_cgu = await ModuleParams.getInstance().getParamValue(ModuleAccessPolicy.PARAM_NAME_LOGIN_CGU)
        )());

        await Promise.all(promises);

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
    private async login() {

        let self = this;
        self.snotify.async(self.label('login.start'), () =>
            new Promise(async (resolve, reject) => {

                let logged_id: number = await ModuleAccessPolicy.getInstance().loginAndRedirect(self.email, self.password, self.redirect_to);

                if (!logged_id) {
                    self.password = "";
                    self.message = self.label('login.failed.message');
                    reject({
                        body: self.label('login.failed'),
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

    private async nfcconnect() {

        if (await NFCHandler.getInstance().make_sure_nfc_is_initialized()) {
            this.snotify.info(this.label('login.nfcconnect.on'));
        } else {
            this.snotify.error(this.label('login.nfcconnect.off'));
        }
    }

    private signin_action() {
        if (AccessPolicyController.getInstance().hook_user_signin) {
            return AccessPolicyController.getInstance().hook_user_signin();
        }

        this.$router.push({
            name: 'signin'
        });
    }

    private recover_action() {
        if (AccessPolicyController.getInstance().hook_user_recover) {
            return AccessPolicyController.getInstance().hook_user_recover();
        }

        this.$router.push({
            name: 'recover'
        });
    }

    private set_show_password(show_password: boolean) {
        this.show_password = show_password;
    }

    get nfcconnect_available() {
        return (!NFCHandler.getInstance().ndef_active) && !!window['NDEFReader'];
    }
}
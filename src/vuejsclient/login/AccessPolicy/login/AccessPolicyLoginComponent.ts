import { Component, Prop } from "vue-property-decorator";
import AccessPolicyController from "../../../../shared/modules/AccessPolicy/AccessPolicyController";
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleParams from "../../../../shared/modules/Params/ModuleParams";
import ModuleSASSSkinConfigurator from '../../../../shared/modules/SASSSkinConfigurator/ModuleSASSSkinConfigurator';
import { all_promises } from "../../../../shared/tools/PromiseTools";
import NFCConnectLoginComponent from "../../../ts/components/NFCConnect/login/NFCConnectLoginComponent";
import NFCHandler from "../../../ts/components/NFCConnect/NFCHandler";
import SessionShareComponent from "../../../ts/components/session_share/SessionShareComponent";
import VueComponentBase from '../../../ts/components/VueComponentBase';
import './AccessPolicyLoginComponent.scss';
import ConsoleHandler from "../../../../shared/tools/ConsoleHandler";

@Component({
    template: require('./AccessPolicyLoginComponent.pug'),
    components: {
        Nfcconnectlogincomponent: NFCConnectLoginComponent,
        Sessionsharecomponent: SessionShareComponent
    }
})
export default class AccessPolicyLoginComponent extends VueComponentBase {

    @Prop()
    private footer_component: any;

    private email: string = "";
    private password: string = "";

    private redirect_to: string = "/";
    private sso: boolean = false;
    private message: string = null;

    private logo_url: string = null;
    private signin_allowed: boolean = false;

    private pdf_info: string = null;
    private pdf_cgu: string = null;

    private show_password: boolean = false;

    private has_error_form: boolean = false;

    private is_ok_loging: boolean = false;

    get nfcconnect_available() {
        return (!NFCHandler.getInstance().ndef_active) && !!window['NDEFReader'];
    }

    private async mounted() {
        const promises = [];
        this.is_ok_loging = false;

        promises.push(this.load_logo_url());

        for (const j in this.$route.query) {
            if (j == 'redirect_to') {
                this.redirect_to = this.$route.query[j];
            }
            if (j == 'sso') {
                this.sso = ((this.$route.query[j] == "1") || (this.$route.query[j] == "true"));
            }
        }

        let logged_id: number = null;
        let session_id: string = null;

        promises.push((async () =>
            logged_id = await ModuleAccessPolicy.getInstance().getLoggedUserId()
        )());

        if (this.sso) {
            promises.push((async () =>
                session_id = await ModuleAccessPolicy.getInstance().get_my_sid()
            )());
        }

        promises.push((async () =>
            this.signin_allowed = await ModuleAccessPolicy.getInstance().testAccess(ModuleAccessPolicy.POLICY_FO_SIGNIN_ACCESS)
        )());

        promises.push((async () =>
            this.pdf_info = await ModuleParams.getInstance().getParamValueAsString(ModuleAccessPolicy.PARAM_NAME_LOGIN_INFOS, null, 10000)
        )());

        promises.push((async () =>
            this.pdf_cgu = await ModuleParams.getInstance().getParamValueAsString(ModuleAccessPolicy.PARAM_NAME_LOGIN_CGU, null, 10000)
        )());

        await all_promises(promises);

        if (!!logged_id) {
            let location: string = this.redirect_to;

            if (!location) {
                location = "/";
            }

            if (this.sso) {
                location += '?session_id=' + session_id;
            }

            ConsoleHandler.log('AccessPolicyLoginComponent mounted logged_id:' + logged_id + ':redirect_to:' + location);

            window.location = (location as any);
        }
    }

    private async load_logo_url() {
        this.logo_url = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.MODULE_NAME + '.logo_url', null, 10000);
        if (this.logo_url && (this.logo_url != '""') && (this.logo_url != '')) {
            return;
        }
        this.logo_url = null;
    }

    // On log si possible, si oui on redirige
    private async login() {
        if (this.is_ok_loging) {
            return;
        }

        this.is_ok_loging = true;
        this.has_error_form = false;

        const self = this;
        self.snotify.async(self.label('login.start'), () =>
            new Promise(async (resolve, reject) => {

                const logged_id: number = await ModuleAccessPolicy.getInstance().loginAndRedirect(self.email, self.password, self.redirect_to, self.sso);

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

                    this.has_error_form = true;

                    this.is_ok_loging = false;
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
}
import { Component, Prop, Watch } from "vue-property-decorator";
import AccessPolicyController from "../../../../shared/modules/AccessPolicy/AccessPolicyController";
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import LoginResponseVO from '../../../../shared/modules/AccessPolicy/vos/LoginResponseVO';
import ModuleParams from "../../../../shared/modules/Params/ModuleParams";
import ModuleSASSSkinConfigurator from '../../../../shared/modules/SASSSkinConfigurator/ModuleSASSSkinConfigurator';
import { all_promises } from "../../../../shared/tools/PromiseTools";
import NFCConnectLoginComponent from "../../../ts/components/NFCConnect/login/NFCConnectLoginComponent";
import NFCHandler from "../../../ts/components/NFCConnect/NFCHandler";
import SessionShareComponent from "../../../ts/components/session_share/SessionShareComponent";
import MFAPageComponent from "../../../ts/components/AccessPolicy/mfa/MFAPageComponent";
import AntiSpamWaitComponent from "../../../ts/components/AccessPolicy/antispam/AntiSpamWaitComponent";
import VueComponentBase from '../../../ts/components/VueComponentBase';
import './AccessPolicyLoginComponent.scss';
import ConsoleHandler from "../../../../shared/tools/ConsoleHandler";
import EnvHandler from "../../../../shared/tools/EnvHandler";

@Component({
    template: require('./AccessPolicyLoginComponent.pug'),
    components: {
        Nfcconnectlogincomponent: NFCConnectLoginComponent,
        Sessionsharecomponent: SessionShareComponent,
        Mfapagecomponent: MFAPageComponent,
        Antispamwaitcomponent: AntiSpamWaitComponent
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

    // MFA properties
    private mfa_required: boolean = false;
    private mfa_code: string = "";
    private mfa_method: string = ""; // Récupéré depuis le serveur
    private mfa_method_label: string = ""; // Label affiché à l'utilisateur
    private mfa_resend_cooldown: number = 0; // Délai en secondes avant pouvoir renvoyer
    private mfa_resend_timer: NodeJS.Timeout = null; // Timer pour le délai

    // MFA force config properties
    private mfa_force_config_required: boolean = false;

    // Anti-Spam properties
    private antispam_info: {
        allowed: boolean;
        delay_seconds?: number;
        message?: string;
        blocked_type?: 'ip' | 'email' | 'user';
        current_attempts?: number;
        remaining_attempts?: number;
    } = null;

    // Timeout pour debounce de la vérification anti-spam lors de la saisie email
    private email_debounce_timeout: NodeJS.Timeout = null;

    get nfcconnect_available() {
        return (!NFCHandler.getInstance().ndef_active) && !!window['NDEFReader'];
    }

    get canResendCode(): boolean {
        return (this.mfa_method === 'email' || this.mfa_method === 'sms') && this.mfa_resend_cooldown <= 0;
    }

    get resendButtonLabel(): string {
        if (this.mfa_resend_cooldown > 0) {
            return this.label('mfa.resend_wait', { seconds: this.mfa_resend_cooldown });
        }
        return this.label('mfa.resend');
    }

    get loginMsgLabel(): string {
        return this.label('login.msg', { app_title: EnvHandler.app_title });
    }

    get is_antispam_blocked(): boolean {
        return this.antispam_info && !this.antispam_info.allowed;
    }

    get should_show_antispam_info(): boolean {
        // Afficher les infos anti-spam si :
        // 1. Il y a un blocage actuel
        // 2. OU il y a des tentatives en cours (pour informer l'utilisateur)
        // 3. OU on a des informations de tentatives disponibles (même si c'est le début)
        const shouldShow = this.antispam_info && (
            !this.antispam_info.allowed ||
            this.antispam_info.current_attempts > 0 ||
            (this.antispam_info.remaining_attempts !== undefined && this.antispam_info.remaining_attempts >= 0)
        );

        return shouldShow;
    }

    get can_show_login_form(): boolean {
        return !this.mfa_required &&
               !this.mfa_force_config_required &&
               !this.is_antispam_blocked;
    }

    // === WATCHERS ===
    @Watch('email')
    private watch_email() {
        if (this.email_debounce_timeout) {
            clearTimeout(this.email_debounce_timeout);
        }

        this.email_debounce_timeout = setTimeout(async () => {
            if (this.email && this.email.trim()) {
                // Sauvegarder l'email pour la prochaine fois
                localStorage.setItem('last_login_email', this.email.trim());
                // Ne plus charger l'anti-spam automatiquement - seulement après un échec
            }
        }, 500); // Attendre 500ms après que l'utilisateur arrête de taper
    }

    // === METHODS ===
    private async loadAntiSpamStatus(email: string) {
        try {
            const antiSpamStatus = await ModuleAccessPolicy.getInstance().getAntiSpamStatus(email);
            if (antiSpamStatus) {
                this.antispam_info = {
                    allowed: antiSpamStatus.allowed,
                    delay_seconds: antiSpamStatus.delay_seconds,
                    message: antiSpamStatus.message,
                    blocked_type: antiSpamStatus.blocked_type,
                    current_attempts: antiSpamStatus.current_attempts,
                    remaining_attempts: antiSpamStatus.remaining_attempts
                };
            }
        } catch (error) {
            ConsoleHandler.warn('Erreur lors de la récupération du statut anti-spam:', error);
            // En cas d'erreur, on reset l'info pour éviter d'afficher de fausses informations
            this.antispam_info = null;
        }
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
                session_id = await ModuleAccessPolicy.getInstance().get_my_session_id()
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

        // Ne plus charger l'anti-spam au démarrage - seulement après un échec de connexion

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

    private onAntiSpamCountdownFinished() {
        this.antispam_info = null;
        this.has_error_form = false;
        this.message = null;
    }

    // On log si possible, si oui on redirige
    private async login() {
        if (this.is_ok_loging) {
            return;
        }

        // Empêcher le submit si anti-spam actif
        if (this.is_antispam_blocked) {
            return;
        }

        this.is_ok_loging = true;
        this.has_error_form = false;

        const self = this;
        self.snotify.async(self.label('login.start'), () =>
            new Promise(async (resolve, reject) => {

                // Utiliser la nouvelle API structurée
                const loginResponse: LoginResponseVO = await ModuleAccessPolicy.getInstance().loginWithAntiSpam(self.email, self.password, self.redirect_to, self.sso);

                if (!loginResponse) {
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
                    return;
                }

                // Toujours traiter les informations anti-spam si présentes (pour affichage)
                if (loginResponse.antispam_info) {
                    self.antispam_info = {
                        allowed: loginResponse.antispam_info.allowed,
                        delay_seconds: loginResponse.antispam_info.delay_seconds,
                        message: loginResponse.antispam_info.message,
                        blocked_type: loginResponse.antispam_info.blocked_type,
                        current_attempts: loginResponse.antispam_info.current_attempts,
                        remaining_attempts: loginResponse.antispam_info.remaining_attempts
                    };

                    // Si l'action n'est pas autorisée, c'est un échec
                    if (!loginResponse.antispam_info.allowed) {
                        self.password = "";
                        reject({
                            body: self.label('login.failed') + (loginResponse.message ? ': ' + loginResponse.message : ''),
                            config: {
                                timeout: 10000,
                                showProgressBar: true,
                                closeOnClick: false,
                                pauseOnHover: true,
                            },
                        });
                        this.has_error_form = true;
                        this.is_ok_loging = false;
                        return;
                    }
                }

                // Traiter les informations MFA si présentes
                if (loginResponse.mfa_method) {
                    self.mfa_method = loginResponse.mfa_method;

                    if (loginResponse.mfa_method === 'force_config') {
                        // Configuration MFA forcée
                        self.mfa_force_config_required = true;
                        self.is_ok_loging = false;
                        resolve({
                            body: self.label('login.mfa_force_config'),
                            config: {
                                timeout: 5000,
                                showProgressBar: true,
                                closeOnClick: false,
                                pauseOnHover: true,
                            },
                        });
                    } else {
                        // MFA requis
                        self.mfa_required = true;
                        self.setMFAMethodLabel();
                        self.is_ok_loging = false;
                        resolve({
                            body: self.label('login.mfa_required'),
                            config: {
                                timeout: 5000,
                                showProgressBar: true,
                                closeOnClick: false,
                                pauseOnHover: true,
                            },
                        });
                    }
                    return;
                }

                // Vérifier le résultat de la connexion
                if (!loginResponse.result_code || loginResponse.result_code <= 0) {
                    self.password = "";
                    self.message = loginResponse.message || self.label('login.failed.message');

                    // === CHARGER L'ANTI-SPAM SEULEMENT APRÈS UN ÉCHEC ===
                    // Maintenant qu'on a échoué, charger le statut anti-spam pour afficher les tentatives restantes
                    try {
                        await self.loadAntiSpamStatus(self.email);
                    } catch (error) {
                        ConsoleHandler.warn('Erreur lors du chargement de l\'anti-spam après échec:', error);
                    }

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
                    // Connexion réussie
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

    // Vérifier le code MFA et terminer la connexion
    private async verifyMFA() {
        if (this.is_ok_loging) {
            return;
        }

        this.is_ok_loging = true;
        this.has_error_form = false;

        const self = this;
        self.snotify.async(self.label('mfa.verifying'), () =>
            new Promise(async (resolve, reject) => {

                const param = {
                    code: self.mfa_code,
                    method: self.mfa_method,
                    userId: null // Pas besoin côté client, récupéré depuis la session
                };

                const result: number = await ModuleAccessPolicy.getInstance().mfaLoginVerify(param);

                if (result > 0) {
                    resolve({
                        body: self.label('login.ok'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                } else {
                    self.mfa_code = "";
                    self.message = self.label('mfa.invalid_code');
                    reject({
                        body: self.label('mfa.verification_failed'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });

                    this.has_error_form = true;
                    this.is_ok_loging = false;
                }
            })
        );
    }

    /**
     * Finalise la configuration MFA forcée et connecte l'utilisateur
     */
    private async completeForcedMFAConfig() {
        if (this.is_ok_loging) {
            return;
        }

        this.is_ok_loging = true;
        this.has_error_form = false;

        const self = this;
        self.snotify.async(self.label('mfa.force_config.completing'), () =>
            new Promise(async (resolve, reject) => {

                const result: boolean = await ModuleAccessPolicy.getInstance().completeForcedMFAConfig();

                if (result) {
                    resolve({
                        body: self.label('mfa.force_config.completed'),
                        config: {
                            timeout: 5000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });

                    // Rediriger après finalisation
                    setTimeout(() => {
                        if (self.redirect_to) {
                            window.location.href = self.redirect_to;
                        } else {
                            window.location.href = '/';
                        }
                    }, 2000);
                } else {
                    reject({
                        body: self.label('mfa.force_config.completion_failed'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });

                    this.has_error_form = true;
                    this.is_ok_loging = false;
                }
            })
        );
    }

    private cancelMFA() {
        this.mfa_required = false;
        this.mfa_code = "";
        this.mfa_method = "";
        this.mfa_method_label = "";
        this.mfa_force_config_required = false; // Réinitialiser aussi la config forcée
        this.password = "";
        this.message = null;
        this.has_error_form = false;

        // Nettoyer le timer si il existe
        if (this.mfa_resend_timer) {
            clearInterval(this.mfa_resend_timer);
            this.mfa_resend_timer = null;
        }
        this.mfa_resend_cooldown = 0;
    }

    /**
     * Renvoie le code MFA pour les méthodes Email et SMS
     */
    private async resendMFACode() {
        if (this.mfa_resend_cooldown > 0) {
            return; // Encore en délai
        }

        if (this.mfa_method !== 'email' && this.mfa_method !== 'sms') {
            return; // Pas applicable pour TOTP
        }

        if (this.is_ok_loging) {
            return;
        }

        this.is_ok_loging = true;
        this.has_error_form = false;

        const self = this;
        self.snotify.async(self.label('mfa.resending'), () =>
            new Promise(async (resolve, reject) => {

                const result: boolean = await ModuleAccessPolicy.getInstance().mfaResendCode();

                if (result) {
                    self.startResendCooldown();
                    resolve({
                        body: self.label('mfa.resent'),
                        config: {
                            timeout: 5000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                } else {
                    reject({
                        body: self.label('mfa.resend_failed'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                }

                self.is_ok_loging = false;
            })
        );
    }

    /**
     * Démarre le délai de renvoi de 60 secondes
     */
    private startResendCooldown(): void {
        this.mfa_resend_cooldown = 60; // 60 secondes

        if (this.mfa_resend_timer) {
            clearInterval(this.mfa_resend_timer);
        }

        this.mfa_resend_timer = setInterval(() => {
            this.mfa_resend_cooldown--;
            if (this.mfa_resend_cooldown <= 0) {
                clearInterval(this.mfa_resend_timer);
                this.mfa_resend_timer = null;
            }
        }, 1000);
    }

    private setMFAMethodLabel() {
        switch (this.mfa_method) {
            case 'totp':
                this.mfa_method_label = this.label('mfa.method.totp');
                break;
            case 'email':
                this.mfa_method_label = this.label('mfa.method.email');
                break;
            case 'sms':
                this.mfa_method_label = this.label('mfa.method.sms');
                break;
            default:
                this.mfa_method_label = this.mfa_method;
        }
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
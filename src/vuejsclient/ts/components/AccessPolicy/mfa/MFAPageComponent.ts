import Component from 'vue-class-component';
import ModuleAccessPolicy from '../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserMFAVO from '../../../../../shared/modules/AccessPolicy/vos/UserMFAVO';
import UserVO from '../../../../../shared/modules/AccessPolicy/vos/UserVO';
import MFAActivateParamVO from '../../../../../shared/modules/AccessPolicy/vos/apis/MFAActivateParamVO';
import MFAConfigureParamVO from '../../../../../shared/modules/AccessPolicy/vos/apis/MFAConfigureParamVO';
import MFAGenerateCodeParamVO from '../../../../../shared/modules/AccessPolicy/vos/apis/MFAGenerateCodeParamVO';
import VueAppController from '../../../../VueAppController';
import VueComponentBase from '../../VueComponentBase';
import QRCodeComponent from '../user/mfa/qrcode/QRCodeComponent';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';

import './MFAPageComponent.scss';
import ModuleTranslation from '../../../../../shared/modules/Translation/ModuleTranslation';

@Component({
    template: require('./MFAPageComponent.pug'),
    components: {
        'qr-code': QRCodeComponent,
    },
})
export default class MFAPageComponent extends VueComponentBase {

    public user: UserVO = VueAppController.getInstance().data_user;
    public mfaConfig: UserMFAVO = null;
    public isMFAEnabled: boolean = false;
    public isConfiguring: boolean = false;
    public selectedMethod: string = UserMFAVO.MFA_METHOD_AUTHENTICATOR;
    public phoneNumber: string = '';
    public verificationCode: string = '';
    public qrCodeData: string = '';
    public showQRCode: boolean = false;
    public isActivating: boolean = false;
    public loading: boolean = false;
    public totpSecret: string = '';
    public isForcedConfig: boolean = false; // Indique si l'utilisateur est forcé à configurer la MFA
    public userDataLoading: boolean = false; // Indique si nous sommes en train de charger les données utilisateur

    // Constantes pour les méthodes MFA
    public readonly MFA_METHOD_EMAIL = UserMFAVO.MFA_METHOD_EMAIL;
    public readonly MFA_METHOD_SMS = UserMFAVO.MFA_METHOD_SMS;
    public readonly MFA_METHOD_AUTHENTICATOR = UserMFAVO.MFA_METHOD_AUTHENTICATOR;

    private get methodLabel(): string {
        switch (this.selectedMethod) {
            case UserMFAVO.MFA_METHOD_EMAIL:
                return this.label('mfa.method.email');
            case UserMFAVO.MFA_METHOD_SMS:
                return this.label('mfa.method.sms');
            case UserMFAVO.MFA_METHOD_AUTHENTICATOR:
                return this.label('mfa.method.authenticator');
            default:
                return '';
        }
    }

    private get currentMethodLabel(): string {
        if (!this.mfaConfig) {
            return '';
        }

        switch (this.mfaConfig.mfa_method) {
            case UserMFAVO.MFA_METHOD_EMAIL:
                return this.label('mfa.method.email');
            case UserMFAVO.MFA_METHOD_SMS:
                return this.label('mfa.method.sms');
            case UserMFAVO.MFA_METHOD_AUTHENTICATOR:
                return this.label('mfa.method.authenticator');
            default:
                return this.label('mfa.method.unknown');
        }
    }

    private async created(): Promise<void> {
        // Dans le contexte de configuration MFA forcée, l'utilisateur peut ne pas être encore complètement authentifié
        // Nous devons récupérer les informations utilisateur temporaires depuis la session
        await this.ensureUserData();
        await this.loadMFAStatus();
        await this.checkForcedMFAConfig();
    }

    /**
     * S'assurer que nous avons les données utilisateur nécessaires
     * Dans le contexte de configuration MFA forcée, récupérer depuis la session temporaire
     */
    private async ensureUserData(): Promise<void> {
        if (!this.user || !this.user.id) {
            this.userDataLoading = true;
            try {
                // Tenter de récupérer l'utilisateur temporaire depuis la session MFA
                const tempUser = await ModuleAccessPolicy.getInstance().mfaGetTempUser();
                if (tempUser && tempUser.id) {
                    this.user = tempUser;
                    // Mettre à jour aussi dans VueAppController si nécessaire
                    if (!VueAppController.getInstance().data_user || !VueAppController.getInstance().data_user.id) {
                        VueAppController.getInstance().data_user = tempUser;
                    }
                    ConsoleHandler.log('MFAPageComponent: Utilisateur temporaire récupéré:', tempUser.id);
                } else {
                    console.warn('MFAPageComponent: Aucun utilisateur temporaire trouvé en session');
                }
            } catch (error) {
                console.error('Erreur lors de la récupération de l\'utilisateur temporaire:', error);
            } finally {
                this.userDataLoading = false;
            }
        }
    }

    private async checkForcedMFAConfig(): Promise<void> {
        // Vérifier si l'utilisateur a le flag force_mfa_config activé
        if (this.user && this.user.force_mfa_config && !this.isMFAEnabled) {
            this.isForcedConfig = true;
            // Démarrer automatiquement la configuration
            this.startMFAConfiguration();
        } else if (!this.user) {
            // Si pas d'utilisateur, considérer comme configuration forcée dans ce contexte
            this.isForcedConfig = true;
            this.startMFAConfiguration();
        }
    }

    private async loadMFAStatus(): Promise<void> {
        if (!this.user || !this.user.id) {
            return;
        }

        this.loading = true;
        try {
            this.isMFAEnabled = await ModuleAccessPolicy.getInstance().mfaIsEnabled(this.user.id);
            if (this.isMFAEnabled) {
                this.mfaConfig = await ModuleAccessPolicy.getInstance().mfaGetConfig(this.user.id);
            }
        } catch (error) {
            console.error('Erreur lors du chargement du statut MFA:', error);
            this.snotify.error(this.label('mfa.error.load_status'));
        } finally {
            this.loading = false;
        }
    }

    private async startMFAConfiguration(): Promise<void> {
        this.isConfiguring = true;
        this.selectedMethod = UserMFAVO.MFA_METHOD_AUTHENTICATOR;
        this.phoneNumber = '';
        this.verificationCode = '';
        this.qrCodeData = '';
        this.showQRCode = false;
        this.totpSecret = '';
    }

    private async configureMFA(): Promise<void> {
        // S'assurer que nous avons les données utilisateur
        if (!this.user || !this.user.id) {
            await this.ensureUserData();
        }

        if (!this.user || !this.user.id) {
            this.snotify.error(this.label('mfa.error.invalid_user'));
            return;
        }

        if (this.selectedMethod === UserMFAVO.MFA_METHOD_SMS && !this.phoneNumber) {
            this.snotify.error(this.label('mfa.error.phone_required'));
            return;
        }

        this.loading = true;
        try {
            const param = new MFAConfigureParamVO(
                this.user.id,
                this.selectedMethod,
                this.phoneNumber || undefined
            );

            const success = await ModuleAccessPolicy.getInstance().mfaConfigure(param);

            if (success) {
                this.snotify.success(this.label('mfa.success.configure'));

                // Si c'est la méthode Authenticator, générer le QR code
                if (this.selectedMethod === UserMFAVO.MFA_METHOD_AUTHENTICATOR) {
                    await this.generateQRCode();
                    this.showQRCode = true;
                }

                this.isActivating = true;
            } else {
                this.snotify.error(this.label('mfa.error.configure_failed'));
            }
        } catch (error) {
            console.error('Erreur lors de la configuration MFA:', error);
            this.snotify.error(this.label('mfa.error.configure'));
        } finally {
            this.loading = false;
        }
    }

    private async generateQRCode(): Promise<void> {
        // S'assurer que nous avons les données utilisateur
        if (!this.user || !this.user.id) {
            await this.ensureUserData();
        }

        if (!this.user || !this.user.id) {
            console.error('generateQRCode: Aucun utilisateur disponible');
            return;
        }

        try {
            // Pour l'authenticator, on génère un QR code avec les données TOTP
            const param = new MFAGenerateCodeParamVO(
                this.user.id,
                UserMFAVO.MFA_METHOD_AUTHENTICATOR
            );

            const secret = await ModuleAccessPolicy.getInstance().mfaGenerateCode(param);

            if (secret) {
                this.totpSecret = secret;
                const label = encodeURIComponent(`${await ModuleTranslation.getInstance().label('app_name', this.user.lang_id)}:${this.user.email}`);
                const issuer = encodeURIComponent(`${await ModuleTranslation.getInstance().label('app_name', this.user.lang_id)}`);
                this.qrCodeData = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}`;
            }
        } catch (error) {
            console.error('Erreur lors de la génération du QR code:', error);
            this.snotify.error(this.label('mfa.error.qr_code'));
        }
    }

    private async sendVerificationCode(): Promise<void> {
        if (!this.user || !this.user.id) {
            return;
        }

        this.loading = true;
        try {
            const param = new MFAGenerateCodeParamVO(
                this.user.id,
                this.selectedMethod
            );

            const code = await ModuleAccessPolicy.getInstance().mfaGenerateCode(param);

            if (code) {
                this.snotify.success(this.label('mfa.success.code_sent'));
            } else {
                this.snotify.error(this.label('mfa.error.send_failed'));
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi du code:', error);
            this.snotify.error(this.label('mfa.error.send'));
        } finally {
            this.loading = false;
        }
    }

    private async activateMFA(): Promise<void> {
        if (!this.user || !this.user.id || !this.verificationCode) {
            this.snotify.error(this.label('mfa.error.code_required'));
            return;
        }

        this.loading = true;
        try {
            const param = new MFAActivateParamVO(
                this.user.id,
                this.verificationCode
            );

            const success = await ModuleAccessPolicy.getInstance().mfaActivate(param);

            if (success) {
                this.snotify.success(this.label('mfa.success.activate'));
                this.isConfiguring = false;
                this.isActivating = false;
                this.showQRCode = false;
                await this.loadMFAStatus();

                // Si c'était une configuration forcée, nettoyer le flag côté serveur et mettre à jour l'utilisateur
                if (this.isForcedConfig) {
                    try {
                        await ModuleAccessPolicy.getInstance().completeForcedMFAConfig();
                        // Mettre à jour l'utilisateur dans VueAppController
                        const updatedUser = await ModuleAccessPolicy.getInstance().getSelfUser();
                        if (updatedUser) {
                            VueAppController.getInstance().data_user = updatedUser;
                            this.user = updatedUser;
                        }
                    } catch (error) {
                        console.error('Erreur lors de la finalisation de la configuration MFA forcée:', error);
                    }

                    this.isForcedConfig = false;
                    setTimeout(() => {
                        const redirect_to = new URLSearchParams(window.location.search).get('redirect_to') || '/';
                        window.location.href = redirect_to;
                    }, 2000);
                }
            } else {
                this.snotify.error(this.label('mfa.error.invalid_code'));
            }
        } catch (error) {
            console.error('Erreur lors de l\'activation MFA:', error);
            this.snotify.error(this.label('mfa.error.activate'));
        } finally {
            this.loading = false;
        }
    }

    private async disableMFA(): Promise<void> {
        // La MFA ne peut plus être désactivée une fois activée
        this.snotify.warning(this.label('mfa.desactivation.impossible'));
    }

    private async modifyMFA(): Promise<void> {
        if (!this.user || !this.user.id) {
            return;
        }

        if (!confirm(this.label('mfa.modification.confirmation'))) {
            return;
        }

        // Lancer le processus de reconfiguration
        this.startMFAConfiguration();
    }

    private cancelConfiguration(): void {
        // Empêcher l'annulation si c'est une configuration forcée
        if (this.isForcedConfig) {
            this.snotify.warning(this.label('mfa.forced.cannot_cancel'));
            return;
        }

        this.isConfiguring = false;
        this.isActivating = false;
        this.showQRCode = false;
        this.selectedMethod = UserMFAVO.MFA_METHOD_AUTHENTICATOR;
        this.phoneNumber = '';
        this.verificationCode = '';
        this.qrCodeData = '';
        this.totpSecret = '';
    }

    private formatDate(timestamp: number): string {
        if (!timestamp) {
            return this.label('mfa.date.undefined');
        }

        // Convertir les secondes Unix en millisecondes pour JavaScript
        const date = new Date(timestamp);

        // Vérifier si la date est valide
        if (isNaN(date.getTime())) {
            return this.label('mfa.date.invalid');
        }

        // Format français : JJ/MM/AAAA HH:MM
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    private copyToClipboard(text: string): void {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                this.snotify.success(this.label('mfa.success.copy'));
            }).catch((error) => {
                console.error('Erreur lors de la copie:', error);
                this.snotify.error(this.label('mfa.error.copy'));
            });
        } else {
            // Fallback pour les navigateurs plus anciens
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.snotify.success(this.label('mfa.success.copy'));
        }
    }

    private goToUserPage(): void {
        // Empêcher de quitter si c'est une configuration forcée
        if (this.isForcedConfig) {
            this.snotify.warning(this.label('mfa.forced.cannot_leave'));
            return;
        }
        this.$router.push('/me');
    }
}

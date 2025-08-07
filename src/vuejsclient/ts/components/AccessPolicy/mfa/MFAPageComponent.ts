import Component from 'vue-class-component';
import ModuleAccessPolicy from '../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserMFAVO from '../../../../../shared/modules/AccessPolicy/vos/UserMFAVO';
import UserVO from '../../../../../shared/modules/AccessPolicy/vos/UserVO';
import VueAppController from '../../../../VueAppController';
import VueComponentBase from '../../VueComponentBase';
import QRCodeComponent from '../user/mfa/qrcode/QRCodeComponent';

import './MFAPageComponent.scss';

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

    // Constantes pour les méthodes MFA
    public readonly MFA_METHOD_EMAIL = UserMFAVO.MFA_METHOD_EMAIL;
    public readonly MFA_METHOD_SMS = UserMFAVO.MFA_METHOD_SMS;
    public readonly MFA_METHOD_AUTHENTICATOR = UserMFAVO.MFA_METHOD_AUTHENTICATOR;

    private get methodLabel(): string {
        switch (this.selectedMethod) {
            case UserMFAVO.MFA_METHOD_EMAIL:
                return 'Email';
            case UserMFAVO.MFA_METHOD_SMS:
                return 'SMS';
            case UserMFAVO.MFA_METHOD_AUTHENTICATOR:
                return 'Application d\'authentification';
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
                return 'Email';
            case UserMFAVO.MFA_METHOD_SMS:
                return 'SMS';
            case UserMFAVO.MFA_METHOD_AUTHENTICATOR:
                return 'Application d\'authentification';
            default:
                return 'Méthode inconnue';
        }
    }

    private async created(): Promise<void> {
        await this.loadMFAStatus();
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
            this.snotify.error('Erreur lors du chargement du statut MFA');
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
        if (!this.user || !this.user.id) {
            this.snotify.error('Utilisateur invalide');
            return;
        }

        if (this.selectedMethod === UserMFAVO.MFA_METHOD_SMS && !this.phoneNumber) {
            this.snotify.error('Numéro de téléphone requis');
            return;
        }

        this.loading = true;
        try {
            const success = await ModuleAccessPolicy.getInstance().mfaConfigure(
                this.user.id,
                this.selectedMethod,
                this.phoneNumber || undefined
            );

            if (success) {
                this.snotify.success('Configuration MFA réussie');

                // Si c'est la méthode Authenticator, générer le QR code
                if (this.selectedMethod === UserMFAVO.MFA_METHOD_AUTHENTICATOR) {
                    await this.generateQRCode();
                    this.showQRCode = true;
                }

                this.isActivating = true;
            } else {
                this.snotify.error('Échec de la configuration MFA');
            }
        } catch (error) {
            console.error('Erreur lors de la configuration MFA:', error);
            this.snotify.error('Erreur lors de la configuration MFA');
        } finally {
            this.loading = false;
        }
    }

    private async generateQRCode(): Promise<void> {
        if (!this.user || !this.user.id) {
            return;
        }

        try {
            // Pour l'authenticator, on génère un QR code avec les données TOTP
            const secret = await ModuleAccessPolicy.getInstance().mfaGenerateCode(
                this.user.id,
                UserMFAVO.MFA_METHOD_AUTHENTICATOR
            );

            if (secret) {
                this.totpSecret = secret;
                // Format: otpauth://totp/OSWeDev:user@example.com?secret=SECRET&issuer=OSWeDev
                const label = encodeURIComponent(`OSWeDev:${this.user.email}`);
                const issuer = encodeURIComponent('OSWeDev');
                this.qrCodeData = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}`;
            }
        } catch (error) {
            console.error('Erreur lors de la génération du QR code:', error);
            this.snotify.error('Erreur lors de la génération du QR code');
        }
    }

    private async sendVerificationCode(): Promise<void> {
        if (!this.user || !this.user.id) {
            return;
        }

        this.loading = true;
        try {
            const code = await ModuleAccessPolicy.getInstance().mfaGenerateCode(
                this.user.id,
                this.selectedMethod
            );

            if (code) {
                this.snotify.success('Code de vérification envoyé');
            } else {
                this.snotify.error('Échec de l\'envoi du code');
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi du code:', error);
            this.snotify.error('Erreur lors de l\'envoi du code');
        } finally {
            this.loading = false;
        }
    }

    private async activateMFA(): Promise<void> {
        if (!this.user || !this.user.id || !this.verificationCode) {
            this.snotify.error('Code de vérification requis');
            return;
        }

        this.loading = true;
        try {
            const success = await ModuleAccessPolicy.getInstance().mfaActivate(
                this.user.id,
                this.verificationCode
            );

            if (success) {
                this.snotify.success('MFA activé avec succès');
                this.isConfiguring = false;
                this.isActivating = false;
                this.showQRCode = false;
                await this.loadMFAStatus();
            } else {
                this.snotify.error('Code de vérification invalide');
            }
        } catch (error) {
            console.error('Erreur lors de l\'activation MFA:', error);
            this.snotify.error('Erreur lors de l\'activation MFA');
        } finally {
            this.loading = false;
        }
    }

    private async disableMFA(): Promise<void> {
        if (!this.user || !this.user.id) {
            return;
        }

        if (!confirm('Êtes-vous sûr de vouloir désactiver l\'authentification à deux facteurs ?')) {
            return;
        }

        this.loading = true;
        try {
            const success = await ModuleAccessPolicy.getInstance().mfaDisable(this.user.id);

            if (success) {
                this.snotify.success('MFA désactivé avec succès');
                await this.loadMFAStatus();
            } else {
                this.snotify.error('Échec de la désactivation MFA');
            }
        } catch (error) {
            console.error('Erreur lors de la désactivation MFA:', error);
            this.snotify.error('Erreur lors de la désactivation MFA');
        } finally {
            this.loading = false;
        }
    }

    private cancelConfiguration(): void {
        this.isConfiguring = false;
        this.isActivating = false;
        this.showQRCode = false;
        this.selectedMethod = UserMFAVO.MFA_METHOD_AUTHENTICATOR;
        this.phoneNumber = '';
        this.verificationCode = '';
        this.qrCodeData = '';
        this.totpSecret = '';
    }

    private goToUserPage(): void {
        this.$router.push('/user');
    }
}

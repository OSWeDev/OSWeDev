import Component from 'vue-class-component';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserMFAVO from '../../../../../../shared/modules/AccessPolicy/vos/UserMFAVO';
import UserVO from '../../../../../../shared/modules/AccessPolicy/vos/UserVO';
import MFAConfigureParamVO from '../../../../../../shared/modules/AccessPolicy/vos/apis/MFAConfigureParamVO';
import MFAActivateParamVO from '../../../../../../shared/modules/AccessPolicy/vos/apis/MFAActivateParamVO';
import MFAGenerateCodeParamVO from '../../../../../../shared/modules/AccessPolicy/vos/apis/MFAGenerateCodeParamVO';
import VueAppController from '../../../../../VueAppController';
import VueComponentBase from '../../../VueComponentBase';
import QRCodeComponent from './qrcode/QRCodeComponent';

import './UserMFAComponent.scss';

@Component({
    template: require('./UserMFAComponent.pug'),
    components: {
        'qr-code': QRCodeComponent,
    }
})
export default class UserMFAComponent extends VueComponentBase {

    public user: UserVO = VueAppController.getInstance().data_user;
    public mfaConfig: UserMFAVO = null;
    public isMFAEnabled: boolean = false;
    public isConfiguring: boolean = false;
    public selectedMethod: string = UserMFAVO.MFA_METHOD_EMAIL;
    public phoneNumber: string = '';
    public verificationCode: string = '';
    public qrCodeData: string = '';
    public showQRCode: boolean = false;
    public isActivating: boolean = false;
    public loading: boolean = false;

    // Constantes pour les méthodes MFA
    public readonly MFA_METHOD_EMAIL = UserMFAVO.MFA_METHOD_EMAIL;
    public readonly MFA_METHOD_SMS = UserMFAVO.MFA_METHOD_SMS;
    public readonly MFA_METHOD_AUTHENTICATOR = UserMFAVO.MFA_METHOD_AUTHENTICATOR;

    private get methodLabel(): string {
        switch (this.selectedMethod) {
            case UserMFAVO.MFA_METHOD_EMAIL:
                return this.label('mfa.methode.email');
            case UserMFAVO.MFA_METHOD_SMS:
                return this.label('mfa.methode.sms');
            case UserMFAVO.MFA_METHOD_AUTHENTICATOR:
                return this.label('mfa.methode.authenticator');
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
                return this.label('mfa.methode.email');
            case UserMFAVO.MFA_METHOD_SMS:
                return this.label('mfa.methode.sms');
            case UserMFAVO.MFA_METHOD_AUTHENTICATOR:
                return this.label('mfa.methode.authenticator');
            default:
                return this.label('mfa.methode.inconnue');
        }
    }

    private get canDisableMFA(): boolean {
        // Une fois la MFA activée, elle ne peut plus être désactivée
        // Seule la modification est autorisée
        return false;
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
            this.snotify.error(this.label('mfa.erreur.chargement'));
        } finally {
            this.loading = false;
        }
    }

    private async startMFAConfiguration(): Promise<void> {
        this.isConfiguring = true;
        this.selectedMethod = UserMFAVO.MFA_METHOD_EMAIL;
        this.phoneNumber = '';
        this.verificationCode = '';
        this.qrCodeData = '';
        this.showQRCode = false;
    }

    private async configureMFA(): Promise<void> {
        if (!this.user || !this.user.id) {
            this.snotify.error(this.label('mfa.erreur.utilisateur_invalide'));
            return;
        }

        if (this.selectedMethod === UserMFAVO.MFA_METHOD_SMS && !this.phoneNumber) {
            this.snotify.error(this.label('mfa.erreur.telephone_requis'));
            return;
        }

        this.loading = true;
        try {
            const success = await ModuleAccessPolicy.getInstance().mfaConfigure(
                MFAConfigureParamVO.fromParams(
                    this.user.id,
                    this.selectedMethod,
                    this.phoneNumber || undefined
                )
            );

            if (success) {
                this.snotify.success(this.label('mfa.configuration.succes'));

                // Si c'est la méthode Authenticator, générer le QR code
                if (this.selectedMethod === UserMFAVO.MFA_METHOD_AUTHENTICATOR) {
                    await this.generateQRCode();
                    this.showQRCode = true;
                }

                this.isActivating = true;
            } else {
                this.snotify.error(this.label('mfa.configuration.echec'));
            }
        } catch (error) {
            console.error('Erreur lors de la configuration MFA:', error);
            this.snotify.error(this.label('mfa.erreur.configuration'));
        } finally {
            this.loading = false;
        }
    }

    private async generateQRCode(): Promise<void> {
        if (!this.user || !this.user.id) {
            return;
        }

        try {
            const secret = await ModuleAccessPolicy.getInstance().mfaGenerateCode(
                MFAGenerateCodeParamVO.fromParams(
                    this.user.id,
                    UserMFAVO.MFA_METHOD_AUTHENTICATOR
                )
            );

            if (secret) {
                const label = encodeURIComponent(`OSWeDev:${this.user.email}`);
                const issuer = encodeURIComponent('OSWeDev');
                this.qrCodeData = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}`;
            }
        } catch (error) {
            console.error('Erreur lors de la génération du QR code:', error);
            this.snotify.error(this.label('mfa.erreur.qr_code'));
        }
    }

    private async sendVerificationCode(): Promise<void> {
        if (!this.user || !this.user.id) {
            return;
        }

        this.loading = true;
        try {
            const code = await ModuleAccessPolicy.getInstance().mfaGenerateCode(
                MFAGenerateCodeParamVO.fromParams(
                    this.user.id,
                    this.selectedMethod
                )
            );

            if (code) {
                this.snotify.success(this.label('mfa.code.envoye'));
            } else {
                this.snotify.error(this.label('mfa.code.echec'));
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi du code:', error);
            this.snotify.error(this.label('mfa.erreur.envoi_code'));
        } finally {
            this.loading = false;
        }
    }

    private async activateMFA(): Promise<void> {
        if (!this.user || !this.user.id || !this.verificationCode) {
            this.snotify.error(this.label('mfa.erreur.code_requis'));
            return;
        }

        this.loading = true;
        try {
            const success = await ModuleAccessPolicy.getInstance().mfaActivate(
                MFAActivateParamVO.fromParams(
                    this.user.id,
                    this.verificationCode
                )
            );

            if (success) {
                this.snotify.success(this.label('mfa.activation.succes'));
                this.isConfiguring = false;
                this.isActivating = false;
                this.showQRCode = false;
                await this.loadMFAStatus();

                // Émettre un événement pour informer le parent que la configuration est terminée
                this.$emit('configuration-complete', {
                    success: true,
                    method: this.selectedMethod
                });
            } else {
                this.snotify.error(this.label('mfa.activation.echec'));
            }
        } catch (error) {
            console.error('Erreur lors de l\'activation MFA:', error);
            this.snotify.error(this.label('mfa.erreur.activation'));
        } finally {
            this.loading = false;
        }
    }

    private async disableMFA(): Promise<void> {
        // Cette méthode est maintenant obsolète car la MFA ne peut plus être désactivée
        // On affiche un message informatif
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
        this.isConfiguring = false;
        this.isActivating = false;
        this.showQRCode = false;
        this.selectedMethod = UserMFAVO.MFA_METHOD_EMAIL;
        this.phoneNumber = '';
        this.verificationCode = '';
        this.qrCodeData = '';
    }
}

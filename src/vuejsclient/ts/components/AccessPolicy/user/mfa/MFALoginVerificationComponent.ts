import Component from 'vue-class-component';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserMFAVO from '../../../../../../shared/modules/AccessPolicy/vos/UserMFAVO';
import UserVO from '../../../../../../shared/modules/AccessPolicy/vos/UserVO';
import VueAppController from '../../../../../VueAppController';
import VueComponentBase from '../../../VueComponentBase';

@Component({
    template: require('./MFALoginVerificationComponent.pug'),
    components: {}
})
export default class MFALoginVerificationComponent extends VueComponentBase {

    public user: UserVO = VueAppController.getInstance().data_user;
    public verificationCode: string = '';
    public loading: boolean = false;
    public mfaMethod: string = '';

    private get methodLabel(): string {
        switch (this.mfaMethod) {
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

    private async created(): Promise<void> {
        await this.loadMFAMethod();
    }

    private async loadMFAMethod(): Promise<void> {
        if (!this.user || !this.user.id) {
            return;
        }

        try {
            const mfaConfig = await ModuleAccessPolicy.getInstance().mfaGetConfig(this.user.id);
            if (mfaConfig) {
                this.mfaMethod = mfaConfig.mfa_method;
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la méthode MFA:', error);
        }
    }

    private async sendCode(): Promise<void> {
        if (!this.user || !this.user.id) {
            return;
        }

        this.loading = true;
        try {
            const code = await ModuleAccessPolicy.getInstance().mfaGenerateCode(
                this.user.id,
                this.mfaMethod
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

    private async verifyCode(): Promise<void> {
        if (!this.user || !this.user.id || !this.verificationCode) {
            this.snotify.error(this.label('mfa.erreur.code_requis'));
            return;
        }

        this.loading = true;
        try {
            const success = await ModuleAccessPolicy.getInstance().mfaVerifyCode(
                this.user.id,
                this.verificationCode,
                this.mfaMethod
            );

            if (success) {
                this.snotify.success(this.label('mfa.verification.succes'));
                // Rediriger vers l'application principale
                this.$router.push('/');
            } else {
                this.snotify.error(this.label('mfa.verification.echec'));
                this.verificationCode = '';
            }
        } catch (error) {
            console.error('Erreur lors de la vérification MFA:', error);
            this.snotify.error(this.label('mfa.erreur.verification'));
            this.verificationCode = '';
        } finally {
            this.loading = false;
        }
    }
}

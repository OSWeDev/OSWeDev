import INamedVO from '../../../interfaces/INamedVO';

export default class ResetPwdResultVO implements INamedVO {
    public static API_TYPE_ID: string = "reset_pwd_result";

    // Codes d'erreur
    public static ERROR_CODE_SUCCESS: string = "SUCCESS";
    public static ERROR_CODE_UNKNOWN_USER: string = "UNKNOWN_USER";
    public static ERROR_CODE_INVALID_CHALLENGE: string = "INVALID_CHALLENGE";
    public static ERROR_CODE_PASSWORD_INVALID: string = "PASSWORD_INVALID";
    public static ERROR_CODE_PASSWORD_REUSED: string = "PASSWORD_REUSED";
    public static ERROR_CODE_MODULE_DISABLED: string = "MODULE_DISABLED";
    public static ERROR_CODE_INTERNAL_ERROR: string = "INTERNAL_ERROR";

    public id: number;
    public _type: string = ResetPwdResultVO.API_TYPE_ID;

    public success: boolean;
    public error_code: string;
    public message: string;

    public get name(): string {
        return this.error_code || this._type;
    }

    public static create(data: {
        success: boolean;
        error_code?: string;
        message?: string;
    }): ResetPwdResultVO {
        const result = new ResetPwdResultVO();
        result.success = data.success;
        result.error_code = data.error_code || (data.success ? ResetPwdResultVO.ERROR_CODE_SUCCESS : ResetPwdResultVO.ERROR_CODE_INTERNAL_ERROR);
        result.message = data.message || '';
        return result;
    }

    /**
     * Retourne un message d'erreur convivial basé sur le code d'erreur
     */
    public getUserFriendlyMessage(): string {
        if (this.message && this.message.trim() !== '') {
            return this.message;
        }

        switch (this.error_code) {
            case ResetPwdResultVO.ERROR_CODE_SUCCESS:
                return 'Mot de passe modifié avec succès';
            case ResetPwdResultVO.ERROR_CODE_PASSWORD_REUSED:
                return 'Ce mot de passe a déjà été utilisé récemment. Veuillez en choisir un autre.';
            case ResetPwdResultVO.ERROR_CODE_PASSWORD_INVALID:
                return 'Le mot de passe ne respecte pas les critères de sécurité requis.';
            case ResetPwdResultVO.ERROR_CODE_INVALID_CHALLENGE:
                return 'Code de vérification invalide ou expiré.';
            case ResetPwdResultVO.ERROR_CODE_UNKNOWN_USER:
                return 'Utilisateur introuvable.';
            case ResetPwdResultVO.ERROR_CODE_MODULE_DISABLED:
                return 'Service temporairement indisponible.';
            case ResetPwdResultVO.ERROR_CODE_INTERNAL_ERROR:
            default:
                return 'Une erreur interne s\'est produite. Veuillez réessayer.';
        }
    }
}

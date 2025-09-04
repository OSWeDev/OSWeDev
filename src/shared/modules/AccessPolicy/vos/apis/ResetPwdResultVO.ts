import IDistantVOBase from '../../../IDistantVOBase';

export default class ResetPwdResultVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "reset_pwd_result";

    // Codes d'erreur possibles
    public static readonly ERROR_CODE_SUCCESS = "SUCCESS";
    public static readonly ERROR_CODE_PASSWORD_REUSED = "PASSWORD_REUSED";
    public static readonly ERROR_CODE_PASSWORD_INVALID = "PASSWORD_INVALID";
    public static readonly ERROR_CODE_INVALID_CHALLENGE = "INVALID_CHALLENGE";
    public static readonly ERROR_CODE_UNKNOWN_USER = "UNKNOWN_USER";
    public static readonly ERROR_CODE_USER_BLOCKED = "USER_BLOCKED";
    public static readonly ERROR_CODE_CHALLENGE_EXPIRED = "CHALLENGE_EXPIRED";
    public static readonly ERROR_CODE_MODULE_DISABLED = "MODULE_DISABLED";
    public static readonly ERROR_CODE_INTERNAL_ERROR = "INTERNAL_ERROR";
    public static readonly ERROR_CODE_UNKNOWN = "UNKNOWN";

    public id: number;
    public _type: string = ResetPwdResultVO.API_TYPE_ID;

    public success: boolean = false;
    public error_code: string = null;
    public message: string = null;

    public constructor(success: boolean = false, error_code: string = null, message: string = null) {
        this.success = success;
        this.error_code = error_code;
        this.message = message;
    }

    public static createSuccess(message: string = 'Mot de passe modifié avec succès'): ResetPwdResultVO {
        return new ResetPwdResultVO(true, ResetPwdResultVO.ERROR_CODE_SUCCESS, message);
    }

    public static createError(error_code: string, message: string = null): ResetPwdResultVO {
        return new ResetPwdResultVO(false, error_code, message);
    }

    public static create(data: {
        success: boolean;
        error_code?: string;
        message?: string;
    }): ResetPwdResultVO {
        return new ResetPwdResultVO(
            data.success,
            data.error_code || (data.success ? ResetPwdResultVO.ERROR_CODE_SUCCESS : ResetPwdResultVO.ERROR_CODE_INTERNAL_ERROR),
            data.message
        );
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
            case ResetPwdResultVO.ERROR_CODE_USER_BLOCKED:
                return 'Compte utilisateur bloqué.';
            case ResetPwdResultVO.ERROR_CODE_CHALLENGE_EXPIRED:
                return 'Code de vérification expiré.';
            case ResetPwdResultVO.ERROR_CODE_MODULE_DISABLED:
                return 'Service temporairement indisponible.';
            case ResetPwdResultVO.ERROR_CODE_INTERNAL_ERROR:
            case ResetPwdResultVO.ERROR_CODE_UNKNOWN:
            default:
                return 'Une erreur interne s\'est produite. Veuillez réessayer.';
        }
    }
}

export const ResetPwdResultVOStatic = ResetPwdResultVO;

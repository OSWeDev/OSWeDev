import IDistantVOBase from '../../IDistantVOBase';
import AntiSpamResponseVO from './AntiSpamResponseVO';

export default class LoginResponseVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "login_response";

    public id: number;
    public _type: string = LoginResponseVO.API_TYPE_ID;

    // Code de résultat du login (comme avant)
    public result_code: number;

    // Informations anti-spam si applicable
    public antispam_info?: AntiSpamResponseVO;

    // Informations MFA si applicable
    public mfa_method?: string;

    // Message pour l'utilisateur
    public message?: string;

    public constructor() {
        this.result_code = 0;
    }

    /**
     * Créer une réponse de succès
     */
    public static createSuccess(result_code: number, message?: string): LoginResponseVO {
        const response = new LoginResponseVO();
        response.result_code = result_code;
        response.message = message;
        return response;
    }

    /**
     * Créer une réponse d'erreur générale
     */
    public static createError(message: string): LoginResponseVO {
        const response = new LoginResponseVO();
        response.result_code = null; // null = échec
        response.message = message;
        return response;
    }

    /**
     * Créer une réponse d'échec avec informations anti-spam
     */
    public static createWithAntiSpam(antispam_info: AntiSpamResponseVO, message?: string): LoginResponseVO {
        const response = new LoginResponseVO();
        response.result_code = null; // Échec à cause anti-spam
        response.antispam_info = antispam_info;
        response.message = message;
        return response;
    }

    /**
     * Créer une réponse MFA
     */
    public static createMFA(mfa_method: string, message?: string): LoginResponseVO {
        const response = new LoginResponseVO();
        response.result_code = null; // null = pas encore connecté, MFA requis
        response.mfa_method = mfa_method;
        response.message = message;
        return response;
    }
}

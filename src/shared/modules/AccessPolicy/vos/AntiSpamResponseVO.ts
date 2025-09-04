import IDistantVOBase from '../../IDistantVOBase';

export default class AntiSpamResponseVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "anti_spam_response";

    public id: number;
    public _type: string = AntiSpamResponseVO.API_TYPE_ID;

    // Résultat de la vérification
    public allowed: boolean;

    // Temps d'attente en secondes si refusé
    public delay_seconds?: number;

    // Message descriptif pour l'utilisateur
    public message?: string;

    // Type d'identifiant concerné (pour debug/admin)
    public blocked_type?: 'ip' | 'email' | 'user';

    // Nombre de tentatives actuelles (pour debug/admin)
    public current_attempts?: number;

    // Tentatives restantes avant blocage total (pour debug/admin)
    public remaining_attempts?: number;

    public constructor() {
        this.allowed = true;
    }

    /**
     * Créer une réponse de succès
     */
    public static createAllowed(): AntiSpamResponseVO {
        const response = new AntiSpamResponseVO();
        response.allowed = true;
        return response;
    }

    /**
     * Créer une réponse de refus avec délai
     */
    public static createDelayed(delay_seconds: number, message: string, blocked_type?: 'ip' | 'email' | 'user', current_attempts?: number, remaining_attempts?: number): AntiSpamResponseVO {
        const response = new AntiSpamResponseVO();
        response.allowed = false;
        response.delay_seconds = delay_seconds;
        response.message = message;
        response.blocked_type = blocked_type;
        response.current_attempts = current_attempts;
        response.remaining_attempts = remaining_attempts;
        return response;
    }

    /**
     * Créer une réponse de blocage permanent
     */
    public static createBlocked(message: string, blocked_type?: 'ip' | 'email' | 'user'): AntiSpamResponseVO {
        const response = new AntiSpamResponseVO();
        response.allowed = false;
        response.message = message;
        response.blocked_type = blocked_type;
        response.current_attempts = 10;
        response.remaining_attempts = 0;
        return response;
    }
}

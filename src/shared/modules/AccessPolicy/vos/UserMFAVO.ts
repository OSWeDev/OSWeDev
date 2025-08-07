import IDistantVOBase from '../../IDistantVOBase';

export default class UserMFAVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "user_mfa";

    // Méthodes MFA disponibles
    public static readonly MFA_METHOD_EMAIL = "email";
    public static readonly MFA_METHOD_SMS = "sms";
    public static readonly MFA_METHOD_AUTHENTICATOR = "authenticator";

    public id: number;
    public _type: string = UserMFAVO.API_TYPE_ID;

    public user_id: number;
    public mfa_method: string; // 'email', 'sms', 'authenticator'
    public totp_secret: string; // Pour authenticator (TOTP)
    public phone_number: string; // Pour SMS
    public is_active: boolean = false;
    public backup_codes: string; // JSON array de codes de sauvegarde
    public created_date: number;
    public last_used_date: number;

    public constructor() {
    }
}

export const UserMFAVOStatic = UserMFAVO;

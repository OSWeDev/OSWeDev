import IDistantVOBase from '../../IDistantVOBase';

export default class MFASessionVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "mfa_session";

    public id: number;
    public _type: string = MFASessionVO.API_TYPE_ID;

    public user_id: number;
    public challenge_code: string; // Code temporaire à 6 chiffres
    public mfa_method: string; // email, sms, authenticator
    public expiry_date: number; // Date d'expiration (5 minutes)
    public attempts: number = 0; // Nombre de tentatives
    public max_attempts: number = 3;
    public created_date: number;
    public is_verified: boolean = false;

    public constructor() {
    }

    public isExpired(): boolean {
        return Date.now() > this.expiry_date;
    }

    public isMaxAttemptsReached(): boolean {
        return this.attempts >= this.max_attempts;
    }
}

export const MFASessionVOStatic = MFASessionVO;

import ConversionHandler from '../../../tools/ConversionHandler';

export default class UserVO {
    public static API_TYPE_ID: string = "user";

    // Pour forcer les numériques à court terme
    public static forceNumeric(e: UserVO): UserVO {
        if (!e) {
            return null;
        }

        e.id = ConversionHandler.forceNumber(e.id);
        e.lang_id = ConversionHandler.forceNumber(e.lang_id);
        e.recovery_expiration = ConversionHandler.forceNumber(e.recovery_expiration);

        e._type = UserVO.API_TYPE_ID;

        return e;
    }

    public static forceNumerics(es: UserVO[]): UserVO[] {
        for (let i in es) {
            es[i] = UserVO.forceNumeric(es[i]);
        }
        return es;
    }

    public id: number;
    public _type: string = UserVO.API_TYPE_ID;

    public name: string;
    public email: string;
    public password: string;
    public password_change_date: string;
    public reminded_pwd_1: boolean;
    public reminded_pwd_2: boolean;
    public invalidated: boolean;
    public lang_id: number;
    public recovery_challenge: string;
    public recovery_expiration: number;
}

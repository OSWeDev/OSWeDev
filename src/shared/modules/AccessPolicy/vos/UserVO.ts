import { Moment } from 'moment';

export default class UserVO {
    public static API_TYPE_ID: string = "user";

    public static createNew(
        name: string,
        email: string,
        phone: string,
        password: string,
        lang_id: number
    ): UserVO {
        let user: UserVO = new UserVO();

        user.name = name;
        user.email = email;
        user.phone = phone;
        user.password = password;
        user.lang_id = lang_id;

        return user;
    }

    public id: number;
    public _type: string = UserVO.API_TYPE_ID;

    public name: string;
    public email: string;
    public phone: string;
    public password: string;
    public password_change_date: string;

    /**
     * Un compte bloqué est totalement inactivé et ne peut plus se connecter ni utiliser la procédure de
     *  récupération du mot de passe
     */
    public blocked: boolean;

    /**
     * Le premier rappel a été envoyé pour prévenir l'expiration du mot de passe
     */
    public reminded_pwd_1: boolean;
    /**
     * Le second rappel a été envoyé pour prévenir l'expiration du mot de passe
     */
    public reminded_pwd_2: boolean;
    /**
     * Un compte invalidé est un compte qui a été invalidé automatiquement par l'expiration du mot de passe
     *  et qui peut donc utiliser la procédure de récupération du mot de passe
     */
    public invalidated: boolean;

    /**
     * Marqueur indiquant que l'utilisateur s'est connecté au moins une fois normalement
     */
    public logged_once: boolean;

    public recovery_challenge: string;
    public recovery_expiration: Moment;

    public lang_id: number;
}


import IArchivedVOBase from '../../IArchivedVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class UserVO implements IArchivedVOBase, IVersionedVO {
    public static API_TYPE_ID: string = "user";

    public id: number;
    public _type: string = UserVO.API_TYPE_ID;

    public name: string;
    public email: string;
    public phone: string;
    public password: string;
    public password_change_date: number;

    /**
     * Ajout du prénom / nom dans le compte utilisateur
     */
    public firstname: string;
    public lastname: string;

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
    public recovery_expiration: number;

    public creation_date: number;

    public lang_id: number;

    public archived: boolean;

    // Tables du IVersionedVO
    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;

    public static createNew(
        name: string,
        email: string,
        phone: string,
        password: string,
        lang_id: number
    ): UserVO {
        const user: UserVO = new UserVO();

        user.name = name;
        user.email = email;
        user.phone = phone;
        user.password = password;
        user.lang_id = lang_id;

        return user;
    }
}

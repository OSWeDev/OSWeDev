import IServerUserSession from "./IServerUserSession";

export default class UserLogVO {
    public static API_TYPE_ID: string = "userlog";

    public static LOG_TYPE_LOGIN: number = 0;
    public static LOG_TYPE_LOGOUT: number = 1;
    public static LOG_TYPE_CSRF_REQUEST: number = 2;
    public static LOG_TYPE_LABELS: string[] = ['userlog.log_type.login', 'userlog.log_type.logout', 'userlog.log_type.csrf_request'];

    public id: number;
    public _type: string = UserLogVO.API_TYPE_ID;

    public user_id: number;
    public log_type: number;
    public log_time: number;

    public impersonated: boolean;

    public referer: string;

    public comment: string;
    public data: string;

    /**
     * Gestion du impersonate. On va chercher récursivement si il y a des impersonates récursifs
     * @param session la session de l'utilisateur
     */
    public handle_impersonation(session: IServerUserSession) {

        let impersonated_from_session = session ? session.impersonated_from : null;
        this.impersonated = false;
        let comment = '';

        while (!!impersonated_from_session) {

            let imp_uid: number = impersonated_from_session.uid;
            this.impersonated = true;
            comment += ((comment == '') ? '' : ' <- ') + 'Impersonated from user_id [' + imp_uid + ']';
            impersonated_from_session = impersonated_from_session.impersonated_from;
        }

        this.comment = comment;
    }
}

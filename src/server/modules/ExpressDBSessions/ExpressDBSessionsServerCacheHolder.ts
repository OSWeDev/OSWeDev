import IServerUserSession from '../../../shared/modules/AccessPolicy/vos/IServerUserSession';
import ExpressSessionVO from '../../../shared/modules/ExpressDBSessions/vos/ExpressSessionVO';
import { StatThisMapKeys } from '../../../shared/modules/Stats/annotations/StatThisMapKeys';


/**
 * @author node-connect-pg-simple
 */
export default class ExpressDBSessionsServerCacheHolder {


    /**
     * On ajoute un cache de session pour éviter de faire des requêtes SQL inutiles
     *  (on ne fait pas de requête SQL si on a déjà la session en cache et qu'elle est valide)
     */
    @StatThisMapKeys('ExpressDBSessionsServerCacheHolder')
    public static session_cache: { [session_id: string]: ExpressSessionVO } = {};
    @StatThisMapKeys('ExpressDBSessionsServerCacheHolder')
    public static parsed_session_cache: { [session_id: string]: IServerUserSession } = {};

    // JNE dans l'urgence, mais la bonne question ça serait quel est l'usage de sid plutot que session_id
    @StatThisMapKeys('ExpressDBSessionsServerCacheHolder')
    public static session_id_by_sid: { [sid: string]: string } = {};
}
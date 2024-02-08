import expressSession from 'express-session';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ExpressSessionController from '../../../shared/modules/ExpressDBSessions/ExpressSessionController';
import ExpressSessionVO from '../../../shared/modules/ExpressDBSessions/vos/ExpressSessionVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import StatsController from '../../../shared/modules/Stats/StatsController';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler, { field_names } from '../../../shared/tools/ObjectHandler';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import StackContext from '../../StackContext';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleTable from '../../../shared/modules/ModuleTable';

const session = expressSession as any;
const Store = session.Store || session.session.Store;

/**
 * @author node-connect-pg-simple
 */
export default class ExpressDBSessionsServerController extends Store {


    public static getInstance(options): ExpressDBSessionsServerController {
        if (!ExpressDBSessionsServerController.instance) {
            ExpressDBSessionsServerController.instance = new ExpressDBSessionsServerController(options);
        }
        return ExpressDBSessionsServerController.instance;
    }

    private static instance: ExpressDBSessionsServerController = null;

    /**
     * On ajoute un cache de session pour éviter de faire des requêtes SQL inutiles
     *  (on ne fait pas de requête SQL si on a déjà la session en cache et qu'elle est valide)
     */
    private static session_cache: { [session_id: string]: ExpressSessionVO } = {};

    public constructor(options) {
        super(options);
    }

    /**
     * Attempt to fetch session by the given `sid`.
     *
     * @param {string} sid – the session id
     * @param {(err: Error|null, firstRow?: PGStoreQueryResult) => void} fn – a standard Node.js callback returning the parsed session object
     * @access public
     */
    public async get(sid, fn) {

        let this_session: ExpressSessionVO = null;
        if (ExpressDBSessionsServerController.session_cache[sid] && ExpressDBSessionsServerController.session_cache[sid].expire >= Dates.now()) {
            this_session = ExpressDBSessionsServerController.session_cache[sid];
        } else {

            // On sort du contexte client pour faire la requete, on doit toujours pouvoir récupérer la session
            this_session = await query(ExpressSessionVO.API_TYPE_ID).filter_by_text_eq('sid', sid).filter_by_date_same_or_after('expire', Dates.now()).exec_as_server().select_vo<ExpressSessionVO>();
            ExpressDBSessionsServerController.session_cache[sid] = this_session;
        }

        if (this_session && this_session.sess) {
            try {
                let sess = ObjectHandler.try_get_json(this_session.sess);
                return fn(null, sess);
            } catch {
                return this.destroy(sid, fn);
            }
        }

        return fn(null);
    }

    /**
     * Commit the given `sess` object associated with the given `sid`.
     *
     * @param {string} sid – the session id
     * @param {SessionObject} sess – the session object to store
     * @param {SimpleErrorCallback} fn – a standard Node.js callback returning the parsed session object
     * @access public
     */
    public async set(sid, sess, fn) {
        const expireTime = ExpressSessionController.getExpireTime(sess);
        StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'set', 'IN');

        /**
         * On ne met à jour que si : le contenu de la session change (objet sess) ou la date d'expiration a bougé de plus de 7 jours
         */
        let cache_sess_obj = ExpressDBSessionsServerController.session_cache[sid] ?
            ((typeof ExpressDBSessionsServerController.session_cache[sid].sess === 'string') ?
                JSON.parse(ExpressDBSessionsServerController.session_cache[sid].sess) : ExpressDBSessionsServerController.session_cache[sid].sess) :
            null;
        let sess_obj = ObjectHandler.try_get_json(sess);

        let do_update = (!ExpressDBSessionsServerController.session_cache[sid]) ||
            (!ExpressDBSessionsServerController.session_cache[sid].expire) ||
            !ObjectHandler.are_equal(sess_obj, cache_sess_obj);
        if (!do_update) {
            do_update = (Math.abs(expireTime - ExpressDBSessionsServerController.session_cache[sid].expire) > 7 * 24 * 60 * 60);
        }

        let db_session_time_in = Dates.now_ms();

        if (do_update) {
            let res = ExpressDBSessionsServerController.session_cache[sid];
            if (!res) {

                StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'set', 'insert');
                res = new ExpressSessionVO();
                res.sid = sid;
                res.sess = (typeof sess === 'string') ? sess : JSON.stringify(sess);
                res.expire = expireTime;
                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(res);
                ExpressDBSessionsServerController.session_cache[sid] = res;
                StatsController.register_stat_DUREE('ExpressDBSessionsServerController', 'set', 'insert_out', Dates.now_ms() - db_session_time_in);
            } else {

                StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'set', 'update');
                res.sess = (typeof sess === 'string') ? sess : JSON.stringify(sess);
                res.expire = expireTime;
                await query(ExpressSessionVO.API_TYPE_ID).filter_by_id(res.id).exec_as_server().update_vos<ExpressSessionVO>(
                    ModuleTable.default_get_api_version(res, false)
                );
                StatsController.register_stat_DUREE('ExpressDBSessionsServerController', 'set', 'update_out', Dates.now_ms() - db_session_time_in);
            }

            if (!res || !res.id) {
                /**
                 * On a un problème, on supprime la session du cache pour forcer une nouvelle insertion
                 */
                delete ExpressDBSessionsServerController.session_cache[sid];
                StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'set', 'ERROR_session_cache');
                try {
                    let db_sess: ExpressSessionVO = await query(ExpressSessionVO.API_TYPE_ID).filter_by_text_eq('sid', sid).exec_as_server().select_vo<ExpressSessionVO>();

                    if (db_sess) {
                        await query(ExpressSessionVO.API_TYPE_ID).filter_by_id(db_sess.id).exec_as_server().delete_vos();
                        ConsoleHandler.warn('ExpressDBSessionsServerController.set: found a session in db for this sid. deleting and replacing with new session:' + sid);

                        return await this.set(sid, sess, fn);
                    } else {

                        // on attend un peu et on retente, le serveur est peut-etre pas démarré correctement encore
                        ConsoleHandler.warn('ExpressDBSessionsServerController.set: no session in db for this sid but insertion failed. Waiting for retry... :' + sid);
                        await ThreadHandler.sleep(5000, 'ExpressDBSessionsServerController.Set.failed_session_insert');
                        return await this.touch(sid, sess, fn);
                    }
                } catch (error) {
                    ConsoleHandler.warn('ExpressDBSessionsServerController.set: error on delete sid when insert or update previously failed:' + sid + ': ' + error);
                }
                return null;
            }

            ExpressDBSessionsServerController.session_cache[sid].id = ExpressDBSessionsServerController.session_cache[sid].id ? ExpressDBSessionsServerController.session_cache[sid].id : res.id;

            if (!ExpressDBSessionsServerController.session_cache[sid].id) {
                StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'set', 'ERROR_no_id');
                ConsoleHandler.error('ExpressDBSessionsServerController.set: no id for session sid:' + sid +
                    ': sess:' + ((typeof sess === 'string') ? sess : JSON.stringify(sess)) +
                    ': res:' + JSON.stringify(res));
            }
        }

        if (fn) {
            return fn(null);
        }
    }

    /**
     * Destroy the session associated with the given `sid`.
     *
     * @param {string} sid – the session id
     * @param {SimpleErrorCallback} fn – a standard Node.js callback returning the parsed session object
     * @access public
     */
    public async destroy(sid, fn) {
        if (!ExpressDBSessionsServerController.session_cache[sid] || !ExpressDBSessionsServerController.session_cache[sid].id) {
            if (fn) {
                return fn(null);
            }
        }

        StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'destroy', 'IN');
        try {
            let db_session_time_in = Dates.now_ms();
            await query(ExpressSessionVO.API_TYPE_ID).filter_by_id(ExpressDBSessionsServerController.session_cache[sid].id).exec_as_server().delete_vos();
            StatsController.register_stat_DUREE('ExpressDBSessionsServerController', 'destroy', 'OUT', Dates.now_ms() - db_session_time_in);
            StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'destroy', 'OUT');
        } catch (error) {
            StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'destroy', 'error');
            ConsoleHandler.error('ExpressDBSessionsServerController.destroy: error on delete sid:' + sid + ': ' + error);
        }
        delete ExpressDBSessionsServerController.session_cache[sid];

        if (fn) {
            return fn(null);
        }
    }

    /**
     * Touch the given session object associated with the given session ID.
     *
     * @param {string} sid – the session id
     * @param {SessionObject} sess – the session object to store
     * @param {SimpleErrorCallback} fn – a standard Node.js callback returning the parsed session object
     * @access public
     */
    public async touch(sid, sess, fn) {
        const expireTime = ExpressSessionController.getExpireTime(sess);

        /**
         * On ne met à jour que si : le contenu de la session change (objet sess) ou la date d'expiration a bougé de plus de 7 jours
         */
        let do_update = (!ExpressDBSessionsServerController.session_cache[sid]) || (!ExpressDBSessionsServerController.session_cache[sid].expire);
        if (!do_update) {
            do_update = (Math.abs(expireTime - ExpressDBSessionsServerController.session_cache[sid].expire) > 7 * 24 * 60 * 60);
        }

        StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'touch', 'IN');
        let db_session_time_in = Dates.now_ms();

        if (do_update) {
            let res = ExpressDBSessionsServerController.session_cache[sid];
            if (!res) {

                StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'touch', 'insert');
                res = new ExpressSessionVO();
                res.sid = sid;
                res.sess = (typeof sess === 'string') ? sess : JSON.stringify(sess);
                res.expire = expireTime;
                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(res);
                ExpressDBSessionsServerController.session_cache[sid] = res;
                StatsController.register_stat_DUREE('ExpressDBSessionsServerController', 'touch', 'insert_out', Dates.now_ms() - db_session_time_in);
            } else {

                StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'touch', 'update');
                res.expire = expireTime;
                await query(ExpressSessionVO.API_TYPE_ID).filter_by_id(res.id).exec_as_server().update_vos<ExpressSessionVO>(
                    ModuleTable.default_get_api_version(res, false)
                );
                StatsController.register_stat_DUREE('ExpressDBSessionsServerController', 'touch', 'update_out', Dates.now_ms() - db_session_time_in);
            }

            if (!res || !res.id) {
                /**
                 * On a un problème, on supprime la session du cache pour forcer une nouvelle insertion
                 */
                StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'touch', 'ERROR_session_cache');
                delete ExpressDBSessionsServerController.session_cache[sid];
                try {
                    let db_sess: ExpressSessionVO = await query(ExpressSessionVO.API_TYPE_ID).filter_by_text_eq('sid', sid).exec_as_server().select_vo<ExpressSessionVO>();
                    if (db_sess && db_sess.id) {
                        await query(ExpressSessionVO.API_TYPE_ID).filter_by_id(db_sess.id).exec_as_server().delete_vos();
                        ConsoleHandler.warn('ExpressDBSessionsServerController.touch: found a session in db for this sid. deleting and replacing with new session:' + sid);

                        return await this.touch(sid, sess, fn);
                    } else {

                        // on attend un peu et on retente
                        ConsoleHandler.warn('ExpressDBSessionsServerController.touch: no session in db for this sid but insertion failed. Waiting for retry... :' + sid);
                        await ThreadHandler.sleep(5000, 'ExpressDBSessionsServerController.touch.failed_session_insert');
                        return await this.touch(sid, sess, fn);
                    }
                } catch (error) {
                    ConsoleHandler.warn('ExpressDBSessionsServerController.touch: error on delete sid when insert or update previously failed:' + sid + ': ' + error);
                }
                return null;
            }

            ExpressDBSessionsServerController.session_cache[sid].id = ExpressDBSessionsServerController.session_cache[sid].id ? ExpressDBSessionsServerController.session_cache[sid].id : res.id;

            if (!ExpressDBSessionsServerController.session_cache[sid].id) {
                StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'touch', 'ERROR_no_id');
                ConsoleHandler.error('ExpressDBSessionsServerController.touch: no id for session sid:' + sid +
                    ': sess:' + ((typeof sess === 'string') ? sess : JSON.stringify(sess)) +
                    ': res:' + JSON.stringify(res));
            }
        }

        if (fn) {
            return fn(null);
        }
    }
}
import * as expressSession from 'express-session';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ExpressSessionController from '../../../shared/modules/ExpressDBSessions/ExpressSessionController';
import ExpressSessionVO from '../../../shared/modules/ExpressDBSessions/vos/ExpressSessionVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import StackContext from '../../StackContext';

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
            this_session = await StackContext.runPromise({ IS_CLIENT: false }, async () => {
                return await query(ExpressSessionVO.API_TYPE_ID).filter_by_text_eq('sid', sid).filter_by_date_same_or_after('expire', Dates.now()).select_vo<ExpressSessionVO>();
            });
            ExpressDBSessionsServerController.session_cache[sid] = this_session;
        }

        if (this_session && this_session.sess) {
            try {
                let sess = (typeof this_session.sess === 'string') ? JSON.parse(this_session.sess) : this_session.sess;
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

        /**
         * On ne met à jour que si : le contenu de la session change (objet sess) ou la date d'expiration a bougé de plus de 7 jours
         */
        let cache_sess_obj = ExpressDBSessionsServerController.session_cache[sid] ?
            ((typeof ExpressDBSessionsServerController.session_cache[sid].sess === 'string') ?
                JSON.parse(ExpressDBSessionsServerController.session_cache[sid].sess) : ExpressDBSessionsServerController.session_cache[sid].sess) :
            null;
        let sess_obj = (typeof sess === 'string') ? JSON.parse(sess) : sess;

        let do_update = (!ExpressDBSessionsServerController.session_cache[sid]) ||
            (!ExpressDBSessionsServerController.session_cache[sid].expire) ||
            !ObjectHandler.getInstance().are_equal(sess_obj, cache_sess_obj);
        if (!do_update) {
            do_update = (Math.abs(expireTime - ExpressDBSessionsServerController.session_cache[sid].expire) > 7 * 24 * 60 * 60);
        }

        if (do_update) {
            if (!ExpressDBSessionsServerController.session_cache[sid]) {
                ExpressDBSessionsServerController.session_cache[sid] = new ExpressSessionVO();
                ExpressDBSessionsServerController.session_cache[sid].sid = sid;
            }
            ExpressDBSessionsServerController.session_cache[sid].expire = expireTime;
            ExpressDBSessionsServerController.session_cache[sid].sess = (typeof sess === 'string') ? sess : JSON.stringify(sess);

            // On sort du contexte client pour faire la requete, on doit toujours pouvoir save la session
            let res = await StackContext.runPromise({ IS_CLIENT: false }, async () => {
                return await ModuleDAO.getInstance().insertOrUpdateVO(ExpressDBSessionsServerController.session_cache[sid]);
            });

            if (!res || !res.id) {
                /**
                 * On a un problème, on supprime la session du cache pour forcer une nouvelle insertion
                 */
                delete ExpressDBSessionsServerController.session_cache[sid];
                try {
                    let db_sess: ExpressSessionVO = await StackContext.runPromise({ IS_CLIENT: false }, async () => {
                        return await query(ExpressSessionVO.API_TYPE_ID).filter_by_text_eq('sid', sid).select_vo<ExpressSessionVO>();
                    });

                    if (db_sess) {
                        await StackContext.runPromise({ IS_CLIENT: false }, async () => {
                            await ModuleDAO.getInstance().deleteVOs([db_sess]);
                        });
                        ConsoleHandler.warn('ExpressDBSessionsServerController.set: found a session in db for this sid. deleting and replacing with new session:' + sid);

                        return await this.set(sid, sess, fn);
                    }
                } catch (error) {
                    ConsoleHandler.warn('ExpressDBSessionsServerController.set: error on delete sid when insert or update previously failed:' + sid + ': ' + error);
                }
            }

            ExpressDBSessionsServerController.session_cache[sid].id = ExpressDBSessionsServerController.session_cache[sid].id ? ExpressDBSessionsServerController.session_cache[sid].id : res.id;

            if (!ExpressDBSessionsServerController.session_cache[sid].id) {
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
        if (!ExpressDBSessionsServerController.session_cache[sid]) {
            if (fn) {
                return fn(null);
            }
        }

        await StackContext.runPromise({ IS_CLIENT: false }, async () => {
            await ModuleDAO.getInstance().deleteVOs([ExpressDBSessionsServerController.session_cache[sid]]);
        });
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

        if (do_update) {
            if (!ExpressDBSessionsServerController.session_cache[sid]) {
                ExpressDBSessionsServerController.session_cache[sid] = new ExpressSessionVO();
                ExpressDBSessionsServerController.session_cache[sid].sid = sid;
                ExpressDBSessionsServerController.session_cache[sid].sess = (typeof sess === 'string') ? sess : JSON.stringify(sess);
            }
            ExpressDBSessionsServerController.session_cache[sid].expire = expireTime;
            let res = await StackContext.runPromise({ IS_CLIENT: false }, async () => {
                return await ModuleDAO.getInstance().insertOrUpdateVO(ExpressDBSessionsServerController.session_cache[sid]);
            });

            if (!res || !res.id) {
                /**
                 * On a un problème, on supprime la session du cache pour forcer une nouvelle insertion
                 */
                delete ExpressDBSessionsServerController.session_cache[sid];
                try {
                    let db_sess: ExpressSessionVO = await StackContext.runPromise({ IS_CLIENT: false }, async () => {
                        return await query(ExpressSessionVO.API_TYPE_ID).filter_by_text_eq('sid', sid).select_vo<ExpressSessionVO>();
                    });
                    if (db_sess) {
                        await StackContext.runPromise({ IS_CLIENT: false }, async () => {
                            await ModuleDAO.getInstance().deleteVOs([db_sess]);
                        });
                        ConsoleHandler.warn('ExpressDBSessionsServerController.touch: found a session in db for this sid. deleting and replacing with new session:' + sid);

                        return await this.touch(sid, sess, fn);
                    }
                } catch (error) {
                    ConsoleHandler.warn('ExpressDBSessionsServerController.touch: error on delete sid when insert or update previously failed:' + sid + ': ' + error);
                }
            }

            ExpressDBSessionsServerController.session_cache[sid].id = ExpressDBSessionsServerController.session_cache[sid].id ? ExpressDBSessionsServerController.session_cache[sid].id : res.id;

            if (!ExpressDBSessionsServerController.session_cache[sid].id) {
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
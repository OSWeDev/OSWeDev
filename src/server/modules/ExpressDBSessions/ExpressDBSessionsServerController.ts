import * as expressSession from 'express-session';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ExpressSessionController from '../../../shared/modules/ExpressDBSessions/ExpressSessionController';
import ExpressSessionVO from '../../../shared/modules/ExpressDBSessions/vos/ExpressSessionVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ObjectHandler from '../../../shared/tools/ObjectHandler';

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
            this_session = await query(ExpressSessionVO.API_TYPE_ID).filter_by_text_eq('sid', sid).filter_by_date_same_or_after('expire', Dates.now()).select_vo<ExpressSessionVO>();
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
        let do_update = (!ExpressDBSessionsServerController.session_cache[sid]) ||
            (!ExpressDBSessionsServerController.session_cache[sid].expire) ||
            !ObjectHandler.getInstance().are_equal(sess, ExpressDBSessionsServerController.session_cache[sid].sess);
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
            let res = await ModuleDAO.getInstance().insertOrUpdateVO(ExpressDBSessionsServerController.session_cache[sid]);
            ExpressDBSessionsServerController.session_cache[sid].id = ExpressDBSessionsServerController.session_cache[sid].id ? ExpressDBSessionsServerController.session_cache[sid].id : res.id;
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

        await ModuleDAO.getInstance().deleteVOs([ExpressDBSessionsServerController.session_cache[sid]]);
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
            let res = await ModuleDAO.getInstance().insertOrUpdateVO(ExpressDBSessionsServerController.session_cache[sid]);
            ExpressDBSessionsServerController.session_cache[sid].id = ExpressDBSessionsServerController.session_cache[sid].id ? ExpressDBSessionsServerController.session_cache[sid].id : res.id;
        }

        if (fn) {
            return fn(null);
        }
    }
}
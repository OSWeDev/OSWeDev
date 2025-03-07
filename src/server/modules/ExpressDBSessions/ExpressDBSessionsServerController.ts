import expressSession from 'express-session';
import IServerUserSession from '../../../shared/modules/AccessPolicy/vos/IServerUserSession';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleTableController from '../../../shared/modules/DAO/ModuleTableController';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ExpressSessionController from '../../../shared/modules/ExpressDBSessions/ExpressSessionController';
import ExpressSessionVO from '../../../shared/modules/ExpressDBSessions/vos/ExpressSessionVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import StatsController from '../../../shared/modules/Stats/StatsController';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler, { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import APIBGThread from '../API/bgthreads/APIBGThread';
import { RunsOnBgThread } from '../BGThread/annotations/RunsOnBGThread';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ExpressDBSessionsServerCacheHolder from './ExpressDBSessionsServerCacheHolder';

const session = expressSession as any;
const Store = session.Store || session.session.Store;

/**
 * @author node-connect-pg-simple
 */
export default class ExpressDBSessionsServerController extends Store {


    private static instance: ExpressDBSessionsServerController = null;

    public constructor(options) {
        super(options);
    }

    public static getInstance(options?): ExpressDBSessionsServerController {
        if (!ExpressDBSessionsServerController.instance) {
            ExpressDBSessionsServerController.instance = new ExpressDBSessionsServerController(options);
        }
        return ExpressDBSessionsServerController.instance;
    }

    /**
     * On envoie sur un autre thread pour ne pas bloquer le serveur ExpressJS
     * INFO : On peut lancer en local si le bgthread est pas encore dispo
     * @param session_id
     * @returns
     */
    @RunsOnBgThread(APIBGThread.BGTHREAD_name, ExpressDBSessionsServerController.getInstance, true)
    private async get_session_from_db(session_id: string): Promise<ExpressSessionVO> {
        return query(ExpressSessionVO.API_TYPE_ID).filter_by_text_eq(field_names<ExpressSessionVO>().session_id, session_id).exec_as_server().select_vo<ExpressSessionVO>();
    }

    /**
     * On envoie sur un autre thread pour ne pas bloquer le serveur ExpressJS
     *  Attention : l'id n'est pas mis à jour dans le VO du fait de passage par un bgthread
     * INFO : On peut lancer en local si le bgthread est pas encore dispo
     * @param session_id
     * @returns
     */
    @RunsOnBgThread(APIBGThread.BGTHREAD_name, ExpressDBSessionsServerController.getInstance, true)
    private async create_session_in_db(sessionvo: ExpressSessionVO): Promise<InsertOrDeleteQueryResult> {
        return ModuleDAOServer.instance.insertOrUpdateVO_as_server(sessionvo);
    }

    /**
     * On envoie sur un autre thread pour ne pas bloquer le serveur ExpressJS
     * INFO : On peut lancer en local si le bgthread est pas encore dispo
     * @param session_id
     * @returns
     */
    @RunsOnBgThread(APIBGThread.BGTHREAD_name, ExpressDBSessionsServerController.getInstance, true)
    private async update_session_in_db(sessionvo: ExpressSessionVO): Promise<InsertOrDeleteQueryResult[]> {
        return query(ExpressSessionVO.API_TYPE_ID).filter_by_id(sessionvo.id).exec_as_server().update_vos<ExpressSessionVO>(
            ModuleTableController.translate_vos_to_api(sessionvo, false)
        );
    }

    /**
     * On envoie sur un autre thread pour ne pas bloquer le serveur ExpressJS
     * INFO : On peut lancer en local si le bgthread est pas encore dispo
     * @param session_id
     * @returns
     */
    @RunsOnBgThread(APIBGThread.BGTHREAD_name, ExpressDBSessionsServerController.getInstance, true)
    private async delete_session_in_db(session_id: number): Promise<InsertOrDeleteQueryResult[]> {
        return query(ExpressSessionVO.API_TYPE_ID).filter_by_id(session_id).exec_as_server().delete_vos();
    }

    /**
     * Attempt to fetch session by the given `session_id`.
     *
     * @param {string} session_id – the session id
     * @param {(err: Error|null, firstRow?: PGStoreQueryResult) => void} fn – a standard Node.js callback returning the parsed session object
     * @access public
     */
    public async get(session_id, fn) {

        try {

            let this_session: ExpressSessionVO = null;
            let this_parsed_session: IServerUserSession = null;
            if (ExpressDBSessionsServerCacheHolder.session_cache[session_id] && ExpressDBSessionsServerCacheHolder.session_cache[session_id].expire >= Dates.now()) {
                this_session = ExpressDBSessionsServerCacheHolder.session_cache[session_id];
                if (ExpressDBSessionsServerCacheHolder.parsed_session_cache[session_id]) {
                    this_parsed_session = ExpressDBSessionsServerCacheHolder.parsed_session_cache[session_id];
                }
            } else {

                // On sort du contexte client pour faire la requete, on doit toujours pouvoir récupérer la session
                this_session = await this.get_session_from_db(session_id);
                ExpressDBSessionsServerCacheHolder.session_cache[session_id] = this_session;
                try {
                    this_parsed_session = this_session ? ObjectHandler.try_get_json(this_session.sess) : null;
                    ExpressDBSessionsServerCacheHolder.parsed_session_cache[session_id] = this_parsed_session;
                    ExpressDBSessionsServerCacheHolder.session_id_by_sid[this_parsed_session.sid] = session_id;
                } catch {
                    return this.destroy(session_id, fn);
                }
            }

            if (this_parsed_session) {
                try {
                    return fn(null, this_parsed_session);
                } catch {
                    return this.destroy(session_id, fn);
                }
            }

            try {
                return fn(null);
            } catch {
                return this.destroy(session_id, fn);
            }
        } catch (error) {
            ConsoleHandler.error('ExpressDBSessionsServerController.get: error on get session_id:' + session_id + ': ' + error);

            return this.destroy(session_id, fn);
        }
    }

    /**
     * Commit the given `sess` object associated with the given `session_id`.
     *
     * @param {string} session_id – the session id
     * @param {SessionObject} sess – the session object to store
     * @param {SimpleErrorCallback} fn – a standard Node.js callback returning the parsed session object
     * @access public
     */
    public async set(session_id, sess, fn) {
        try {

            const expireTime = ExpressSessionController.getExpireTime(sess);
            StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'set', 'IN');

            /**
             * On ne met à jour que si : le contenu de la session change (objet sess) ou la date d'expiration a bougé de plus de 7 jours
             */
            let cache_sess: ExpressSessionVO = null;
            let cache_sess_obj: IServerUserSession = null;
            if (ExpressDBSessionsServerCacheHolder.session_cache[session_id]) {
                cache_sess = ExpressDBSessionsServerCacheHolder.session_cache[session_id];
                if (ExpressDBSessionsServerCacheHolder.parsed_session_cache[session_id]) {
                    cache_sess_obj = ExpressDBSessionsServerCacheHolder.parsed_session_cache[session_id];
                }
            }

            const sess_obj = ObjectHandler.try_get_json(sess);

            let do_update = (!cache_sess) ||
                (!cache_sess.expire) ||
                !ObjectHandler.are_equal(
                    sess_obj,
                    cache_sess_obj,
                    [
                        reflect<IServerUserSession>().id, // On ne compare pas l'id car celui issu de la bdd ou préparé pour ne peut pas avoir le même
                        // reflect<IServerUserSession>().last_check_blocked_or_expired, // Si on met pas à jour les dates de check, on check tout le temps....
                        // reflect<IServerUserSession>().last_check_session_validity, // Si on met pas à jour les dates de check, on check tout le temps....
                        reflect<IServerUserSession>().last_load_date_unix,
                        reflect<IServerUserSession>().regenerate, // On ne compare pas les fonctions
                        reflect<IServerUserSession>().reload, // On ne compare pas les fonctions
                        reflect<IServerUserSession>().save, // On ne compare pas les fonctions
                        "req", // Req n'existe que sur la session express, pas en base
                        reflect<IServerUserSession>().touch, // On ne compare pas les fonctions
                        reflect<IServerUserSession>().cookie, // ATTENTION On ne peut pas comparer les cookies a cause du expire
                    ]
                );
            if (!do_update) {
                do_update = (Math.abs(expireTime - cache_sess.expire) > 7 * 24 * 60 * 60);
            }

            const db_session_time_in = Dates.now_ms();

            if (do_update) {
                let res = cache_sess;
                if (!res) {

                    StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'set', 'insert');
                    res = new ExpressSessionVO();
                    res.session_id = session_id;
                    res.sess = (typeof sess === 'string') ? sess : JSON.stringify(sess);
                    res.expire = expireTime;
                    const insert_res = await this.create_session_in_db(res);
                    if (!insert_res || !insert_res.id) {
                        StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'set', 'ERROR_insert');
                        ConsoleHandler.error('ExpressDBSessionsServerController.set: error on insert session_id:' + session_id + ': ' + JSON.stringify(res));
                        return this.destroy(session_id, fn);
                    }
                    res.id = insert_res?.id;
                    StatsController.register_stat_DUREE('ExpressDBSessionsServerController', 'set', 'insert_out', Dates.now_ms() - db_session_time_in);
                } else {

                    StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'set', 'update');
                    res.sess = (typeof sess === 'string') ? sess : JSON.stringify(sess);
                    res.expire = expireTime;
                    await this.update_session_in_db(res);
                    StatsController.register_stat_DUREE('ExpressDBSessionsServerController', 'set', 'update_out', Dates.now_ms() - db_session_time_in);
                }

                ExpressDBSessionsServerCacheHolder.session_cache[session_id] = res;
                ExpressDBSessionsServerCacheHolder.parsed_session_cache[session_id] = sess;
                ExpressDBSessionsServerCacheHolder.session_id_by_sid[sess_obj.sid] = session_id;

                if (!res || !res.id) {
                    /**
                     * On a un problème, on supprime la session du cache pour forcer une nouvelle insertion
                     */
                    delete ExpressDBSessionsServerCacheHolder.session_cache[session_id];
                    delete ExpressDBSessionsServerCacheHolder.parsed_session_cache[session_id];
                    delete ExpressDBSessionsServerCacheHolder.session_id_by_sid[sess_obj.sid];
                    StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'set', 'ERROR_session_cache');
                    try {
                        const db_sess: ExpressSessionVO = await this.get_session_from_db(session_id);

                        if (db_sess) {
                            await this.delete_session_in_db(db_sess.id);
                            ConsoleHandler.warn('ExpressDBSessionsServerController.set: found a session in db for this session_id. deleting and replacing with new session:' + session_id);

                            return await this.set(session_id, sess, fn);
                        } else {

                            // on attend un peu et on retente, le serveur est peut-etre pas démarré correctement encore
                            ConsoleHandler.warn('ExpressDBSessionsServerController.set: no session in db for this session_id but insertion failed. Waiting for retry... :' + session_id);
                            await ThreadHandler.sleep(5000, 'ExpressDBSessionsServerController.Set.failed_session_insert');
                            return await this.touch(session_id, sess, fn);
                        }
                    } catch (error) {
                        ConsoleHandler.warn('ExpressDBSessionsServerController.set: error on delete session_id when insert or update previously failed:' + session_id + ': ' + error);
                    }
                    return null;
                }

                ExpressDBSessionsServerCacheHolder.session_cache[session_id].id = ExpressDBSessionsServerCacheHolder.session_cache[session_id].id ? ExpressDBSessionsServerCacheHolder.session_cache[session_id].id : res.id;

                if (!ExpressDBSessionsServerCacheHolder.session_cache[session_id].id) {
                    StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'set', 'ERROR_no_id');
                    ConsoleHandler.error('ExpressDBSessionsServerController.set: no id for session session_id:' + session_id +
                        ': sess:' + ((typeof sess === 'string') ? sess : JSON.stringify(sess)) +
                        ': res:' + JSON.stringify(res));
                }
            }

            if (fn) {
                return fn(null);
            }
        } catch (error) {
            ConsoleHandler.error('ExpressDBSessionsServerController.set: error on set session_id:' + session_id + ': ' + error);
            return this.destroy(session_id, fn);
        }
    }

    /**
     * Destroy the session associated with the given `session_id`.
     *
     * @param {string} session_id – the session id
     * @param {SimpleErrorCallback} fn – a standard Node.js callback returning the parsed session object
     * @access public
     */
    public async destroy(session_id, fn) {

        if (!ExpressDBSessionsServerCacheHolder.session_cache[session_id] || !ExpressDBSessionsServerCacheHolder.session_cache[session_id].id) {
            if (fn) {
                return fn(null);
            }
        }

        StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'destroy', 'IN');
        try {
            const db_session_time_in = Dates.now_ms();
            await this.delete_session_in_db(ExpressDBSessionsServerCacheHolder.session_cache[session_id].id);
            StatsController.register_stat_DUREE('ExpressDBSessionsServerController', 'destroy', 'OUT', Dates.now_ms() - db_session_time_in);
            StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'destroy', 'OUT');
        } catch (error) {
            StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'destroy', 'error');
            ConsoleHandler.error('ExpressDBSessionsServerController.destroy: error on delete session_id:' + session_id + ': ' + error);
        }
        delete ExpressDBSessionsServerCacheHolder.session_cache[session_id];
        delete ExpressDBSessionsServerCacheHolder.parsed_session_cache[session_id];

        let sid = null;
        for (const i in ExpressDBSessionsServerCacheHolder.session_id_by_sid) {
            if (ExpressDBSessionsServerCacheHolder.session_id_by_sid[i] == session_id) {
                sid = i;
                break;
            }
        }
        if (sid) {
            delete ExpressDBSessionsServerCacheHolder.session_id_by_sid[sid];
        }

        if (fn) {
            return fn(null);
        }
    }

    /**
     * Touch the given session object associated with the given session ID.
     *
     * @param {string} session_id – the session id
     * @param {SessionObject} sess – the session object to store
     * @param {SimpleErrorCallback} fn – a standard Node.js callback returning the parsed session object
     * @access public
     */
    public async touch(session_id, sess, fn) {
        const expireTime = ExpressSessionController.getExpireTime(sess);

        /**
         * On ne met à jour que si : le contenu de la session change (objet sess) ou la date d'expiration a bougé de plus de 7 jours
         */
        let do_update = (!ExpressDBSessionsServerCacheHolder.session_cache[session_id]) || (!ExpressDBSessionsServerCacheHolder.session_cache[session_id].expire);
        if (!do_update) {
            do_update = (Math.abs(expireTime - ExpressDBSessionsServerCacheHolder.session_cache[session_id].expire) > 7 * 24 * 60 * 60);
        }

        StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'touch', 'IN');
        const db_session_time_in = Dates.now_ms();

        if (do_update) {
            let res = ExpressDBSessionsServerCacheHolder.session_cache[session_id];
            if (!res) {

                StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'touch', 'insert');
                res = new ExpressSessionVO();
                res.session_id = session_id;
                res.sess = (typeof sess === 'string') ? sess : JSON.stringify(sess);
                res.expire = expireTime;
                const insert_res = await this.create_session_in_db(res);
                if (!insert_res || !insert_res.id) {
                    StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'touch', 'ERROR_insert');
                    ConsoleHandler.error('ExpressDBSessionsServerController.touch: error on insert sid:' + session_id + ': ' + JSON.stringify(res));
                    return this.destroy(session_id, fn);
                }
                res.id = insert_res?.id;

                StatsController.register_stat_DUREE('ExpressDBSessionsServerController', 'touch', 'insert_out', Dates.now_ms() - db_session_time_in);
            } else {

                StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'touch', 'update');
                res.expire = expireTime;
                await this.update_session_in_db(res);

                StatsController.register_stat_DUREE('ExpressDBSessionsServerController', 'touch', 'update_out', Dates.now_ms() - db_session_time_in);
            }

            ExpressDBSessionsServerCacheHolder.session_cache[session_id] = res;
            ExpressDBSessionsServerCacheHolder.parsed_session_cache[session_id] = sess;
            ExpressDBSessionsServerCacheHolder.session_id_by_sid[ObjectHandler.try_get_json(sess).sid] = session_id;

            if (!res || !res.id) {
                /**
                 * On a un problème, on supprime la session du cache pour forcer une nouvelle insertion
                 */
                StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'touch', 'ERROR_session_cache');
                delete ExpressDBSessionsServerCacheHolder.session_cache[session_id];
                delete ExpressDBSessionsServerCacheHolder.parsed_session_cache[session_id];
                delete ExpressDBSessionsServerCacheHolder.session_id_by_sid[ObjectHandler.try_get_json(sess).sid];
                try {
                    const db_sess: ExpressSessionVO = await this.get_session_from_db(session_id);
                    if (db_sess && db_sess.id) {
                        await this.delete_session_in_db(db_sess.id);
                        ConsoleHandler.warn('ExpressDBSessionsServerController.touch: found a session in db for this session_id. deleting and replacing with new session:' + session_id);

                        return await this.touch(session_id, sess, fn);
                    } else {

                        // on attend un peu et on retente
                        ConsoleHandler.warn('ExpressDBSessionsServerController.touch: no session in db for this session_id but insertion failed. Waiting for retry... :' + session_id);
                        await ThreadHandler.sleep(5000, 'ExpressDBSessionsServerController.touch.failed_session_insert');
                        return await this.touch(session_id, sess, fn);
                    }
                } catch (error) {
                    ConsoleHandler.warn('ExpressDBSessionsServerController.touch: error on delete session_id when insert or update previously failed:' + session_id + ': ' + error);
                }
                return null;
            }

            ExpressDBSessionsServerCacheHolder.session_cache[session_id].id = ExpressDBSessionsServerCacheHolder.session_cache[session_id].id ? ExpressDBSessionsServerCacheHolder.session_cache[session_id].id : res.id;

            if (!ExpressDBSessionsServerCacheHolder.session_cache[session_id].id) {
                StatsController.register_stat_COMPTEUR('ExpressDBSessionsServerController', 'touch', 'ERROR_no_id');
                ConsoleHandler.error('ExpressDBSessionsServerController.touch: no id for session session_id:' + session_id +
                    ': sess:' + ((typeof sess === 'string') ? sess : JSON.stringify(sess)) +
                    ': res:' + JSON.stringify(res));
            }
        }

        if (fn) {
            return fn(null);
        }
    }
}
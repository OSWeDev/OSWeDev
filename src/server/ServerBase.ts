import child_process from 'child_process';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import express, { NextFunction, Request, Response } from 'express';
import createLocaleMiddleware from 'express-locale';
import expressSession from 'express-session';
import sharedsession from 'express-socket.io-session';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import pg_promise, { IDatabase } from 'pg-promise';
import socketIO from 'socket.io';
import winston from 'winston';
import winston_daily_rotate_file from 'winston-daily-rotate-file';
import ModuleAccessPolicy from '../shared/modules/AccessPolicy/ModuleAccessPolicy';
import IServerUserSession from '../shared/modules/AccessPolicy/vos/IServerUserSession';
import UserLogVO from '../shared/modules/AccessPolicy/vos/UserLogVO';
import UserSessionVO from '../shared/modules/AccessPolicy/vos/UserSessionVO';
import UserVO from '../shared/modules/AccessPolicy/vos/UserVO';
import ModuleCommerce from '../shared/modules/Commerce/ModuleCommerce';
import { query } from '../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleFile from '../shared/modules/File/ModuleFile';
import FileVO from '../shared/modules/File/vos/FileVO';
import Dates from '../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleImageFormat from '../shared/modules/ImageFormat/ModuleImageFormat';
import FormattedImageVO from '../shared/modules/ImageFormat/vos/FormattedImageVO';
import ImageFormatVO from '../shared/modules/ImageFormat/vos/ImageFormatVO';
import ModuleMaintenance from '../shared/modules/Maintenance/ModuleMaintenance';
import ModulesManager from '../shared/modules/ModulesManager';
import ModuleParams from '../shared/modules/Params/ModuleParams';
import ModulePushData from '../shared/modules/PushData/ModulePushData';
import StatsController from '../shared/modules/Stats/StatsController';
import ModuleTranslation from '../shared/modules/Translation/ModuleTranslation';
import ConsoleHandler from '../shared/tools/ConsoleHandler';
import EnvHandler from '../shared/tools/EnvHandler';
import LocaleManager from '../shared/tools/LocaleManager';
import ThreadHandler from '../shared/tools/ThreadHandler';
import FileLoggerHandler from './FileLoggerHandler';
import I18nextInit from './I18nextInit';
import MemoryUsageStat from './MemoryUsageStat';
import ConfigurationService from './env/ConfigurationService';
import EnvParam from './env/EnvParam';
import AccessPolicyServerController from './modules/AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from './modules/AccessPolicy/ModuleAccessPolicyServer';
import AccessPolicyDeleteSessionBGThread from './modules/AccessPolicy/bgthreads/AccessPolicyDeleteSessionBGThread';
import BGThreadServerController from './modules/BGThread/BGThreadServerController';
import CronServerController from './modules/Cron/CronServerController';
import ModuleDAOServer from './modules/DAO/ModuleDAOServer';
import ExpressDBSessionsServerController from './modules/ExpressDBSessions/ExpressDBSessionsServerController';
import ModuleFileServer from './modules/File/ModuleFileServer';
import ForkServerController from './modules/Fork/ForkServerController';
import ForkedTasksController from './modules/Fork/ForkedTasksController';
import MaintenanceServerController from './modules/Maintenance/MaintenanceServerController';
import ModuleServiceBase from './modules/ModuleServiceBase';
import PushDataServerController from './modules/PushData/PushDataServerController';
import StatsServerController from './modules/Stats/StatsServerController';
import DefaultTranslationsServerManager from './modules/Translation/DefaultTranslationsServerManager';
// import { createTerminus } from '@godaddy/terminus';
import { IClient } from 'pg-promise/typescript/pg-subset';
import DBDisconnectionManager from '../shared/tools/DBDisconnectionManager';
import { field_names } from '../shared/tools/ObjectHandler';
import PromisePipeline from '../shared/tools/PromisePipeline/PromisePipeline';
import ServerExpressController from './ServerExpressController';
import StackContext from './StackContext';
import DBDisconnectionServerHandler from './modules/DAO/disconnection/DBDisconnectionServerHandler';
import ModulePushDataServer from './modules/PushData/ModulePushDataServer';
import VarsDatasVoUpdateHandler from './modules/Var/VarsDatasVoUpdateHandler';
require('moment-json-parser').overrideDefault();

export default abstract class ServerBase {

    /* istanbul ignore next: nothing to test here */
    public static getInstance(): ServerBase {
        return ServerBase.instance;
    }

    protected static SLOW_EXPRESS_QUERY_LIMIT_MS_PARAM_NAME: string = 'ServerBase.SLOW_EXPRESS_QUERY_LIMIT_MS';

    /* istanbul ignore next: nothing to test here */
    protected static instance: ServerBase = null;

    public csrfProtection;
    public version;
    public io;

    protected db: IDatabase<any>;
    protected spawn;
    protected app;
    protected port;
    protected uiDebug;
    protected envParam: EnvParam;
    private connectionString: string;
    // private jwtSecret: string;
    private modulesService: ModuleServiceBase;
    private STATIC_ENV_PARAMS: { [env: string]: EnvParam };

    private session;

    private ROOT_FOLDER: string = null;
    // private subscription;

    /* istanbul ignore next: nothing to test here */
    protected constructor(modulesService: ModuleServiceBase, STATIC_ENV_PARAMS: { [env: string]: EnvParam }) {

        ForkedTasksController.init();
        ForkedTasksController.assert_is_main_process();

        // INIT Stats Server side
        StatsController.THREAD_NAME = 'main';
        StatsController.getInstance().UNSTACK_THROTTLE = 60000;
        StatsController.UNSTACK_THROTTLE_PARAM_NAME = 'StatsController.UNSTACK_THROTTLE_SERVER';
        StatsController.new_stats_handler = StatsServerController.new_stats_handler;
        StatsController.register_stat_COMPTEUR('ServerBase', 'START', '-');

        ServerBase.instance = this;
        this.modulesService = modulesService;
        this.STATIC_ENV_PARAMS = STATIC_ENV_PARAMS;
        ConfigurationService.setEnvParams(this.STATIC_ENV_PARAMS);
        PromisePipeline.DEBUG_PROMISE_PIPELINE_WORKER_STATS = ConfigurationService.node_configuration.debug_promise_pipeline_worker_stats;
        DBDisconnectionManager.instance = new DBDisconnectionServerHandler();

        ConsoleHandler.init();
        FileLoggerHandler.getInstance().prepare().then(() => {
            ConsoleHandler.logger_handler = FileLoggerHandler.getInstance();
            ConsoleHandler.log("Main Process starting");
        }).catch((reason) => {
            ConsoleHandler.error("FileLogger prepare : " + reason);
        });

        // Les bgthreads peuvent être register mais pas run dans le process server principal. On le dédie à Express et aux APIs
        BGThreadServerController.init();
        BGThreadServerController.register_bgthreads = true;
        CronServerController.getInstance().register_crons = true;

        ModulesManager.isServerSide = true;
        this.csrfProtection = csrf({ cookie: true });
    }

    // /**
    //  * Gestion des clefs d'API
    //  */
    // public verifyApiKeyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    //     const apiKey = req.headers['x-api-key'] as string;

    //     if (!apiKey) {
    //         next();
    //         return;
    //     }

    //     // Vérifier la clé d'API ici. Exemple :
    //     const isValidApiKey = await this.checkApiKey(apiKey);

    //     if (!isValidApiKey) {
    //         return res.status(401).json({ message: 'Invalid or missing API Key' });
    //     }

    //     next();
    // }

    // public async checkApiKey(apiKey: string): Promise<boolean> {
    //     let exist_user_api_vo: UserAPIVO = await query(UserAPIVO.API_TYPE_ID)
    //         .filter_by_text_eq(field_names<UserAPIVO>().api_key, apiKey)
    //         .exec_as_server()
    //         .select_vo<UserAPIVO>();

    //     return !!exist_user_api_vo; // Retourne true si valide, false sinon
    // }

    /* istanbul ignore next: FIXME Don't want to test this file, but there are many things that should be externalized in smaller files and tested */
    public async initializeNodeServer() {

        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ServerExpressController:createMandatoryFolders:START');
        }
        await this.createMandatoryFolders();
        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ServerExpressController:createMandatoryFolders:END');
        }

        this.version = this.getVersion();

        this.envParam = ConfigurationService.node_configuration;

        EnvHandler.base_url = this.envParam.base_url;
        EnvHandler.node_verbose = !!this.envParam.node_verbose;
        EnvHandler.is_dev = !!this.envParam.isdev;
        EnvHandler.debug_promise_pipeline = !!this.envParam.debug_promise_pipeline;
        EnvHandler.max_pool = this.envParam.max_pool;
        EnvHandler.compress = !!this.envParam.compress;
        EnvHandler.code_google_analytics = this.envParam.code_google_analytics;
        EnvHandler.version = this.version;
        EnvHandler.activate_pwa = !!this.envParam.activate_pwa;
        EnvHandler.zoom_auto = !!this.envParam.zoom_auto;
        EnvHandler.debug_vars = !!this.envParam.debug_vars;

        this.connectionString = this.envParam.connection_string;
        this.uiDebug = null; // JNE MODIF FLK process.env.UI_DEBUG;
        this.port = process.env.PORT ? process.env.PORT : this.envParam.port;

        // this.jwtSecret = 'This is the jwt secret for the rest part';

        const pgp: pg_promise.IMain = pg_promise({
            async connect(e: { client: IClient, dc: any, useCount: number }) {
                StatsController.register_stat_COMPTEUR('ServerBase', 'PGP', 'connect');
            },
            async disconnect(e: { client: IClient, dc: any }) {
                StatsController.register_stat_COMPTEUR('ServerBase', 'PGP', 'disconnect');
            },
            async query(e) {
                StatsController.register_stat_COMPTEUR('ServerBase', 'PGP', 'query');
            },
            async error(err, e) {
                StatsController.register_stat_COMPTEUR('ServerBase', 'PGP', 'error');
                ConsoleHandler.error(
                    'ServerBase.PGP.error: ' + JSON.stringify(err) +
                    ' query: ' + JSON.stringify({ query: e.query })
                );
            },
        });
        this.db = pgp({
            connectionString: this.connectionString,
            max: this.envParam.max_pool,
        });

        this.db.$pool.options.max = ConfigurationService.node_configuration.max_pool;
        this.db.$pool.options.idleTimeoutMillis = 120000;

        const GM = this.modulesService;
        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ServerExpressController:register_all_modules:START');
        }
        await GM.init_db(this.db);
        await GM.register_all_modules();
        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ServerExpressController:register_all_modules:END');
        }

        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ServerExpressController:initializeDataImports:START');
        }
        await this.initializeDataImports();
        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ServerExpressController:initializeDataImports:END');
        }

        await StatsController.init_params();
        this.spawn = child_process.spawn;

        /* A voir l'intéret des différents routers this.app.use(apiRouter());
        this.app.use(config.IS_PRODUCTION ? staticsRouter() : staticsDevRouter());*/

        /*app.listen(config.SERVER_PORT, () => {
            ConsoleHandler.log(`App listening on port ${config.SERVER_PORT}!`);
        });*/


        const logger = new (winston.Logger)({
            transports: [
                new (winston.transports.Console)(),
                new (winston_daily_rotate_file)(
                    {
                        filename: './logs/log',
                        datePattern: 'yyyy-MM-dd.'
                    })
            ]
        });

        // Correction timezone
        const types = pg.types;
        types.setTypeParser(1114, (stringValue) => {
            return stringValue;
        });

        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ServerExpressController:express:START');
        }
        this.app = express();

        const responseTime = require('response-time');

        this.app.use(responseTime(async (req, res, time) => {
            const url = req.originalUrl;
            const method = req.method;
            const status = res.statusCode;

            const log = `${method} ${url} ${status} ${time.toFixed(3)} ms`;

            // let cleaned_url = req.url.toLowerCase()
            //     .replace(/[:.]/g, '')
            //     .replace(/\//g, '_');

            StatsController.register_stat_DUREE('express', method, status, time);
            StatsController.register_stat_COMPTEUR('express', method, status);

            if (status >= 500) {
                ConsoleHandler.error(log);
            } else if (status >= 400) {
                ConsoleHandler.warn(log);
            } else {

                /**
                 * On stocke les requêtes par :
                 *  - par méthode
                 *  - par status
                 *  - par temps de réponse - en 2 catégories : toutes les requêtes et les requêtes qui ont pris plus de 1s (paramétrable)
                 */
                const slow_queries_limit = await ModuleParams.getInstance().getParamValueAsInt(
                    ServerBase.SLOW_EXPRESS_QUERY_LIMIT_MS_PARAM_NAME, 1000, 300000
                );
                if (time > slow_queries_limit) {
                    StatsController.register_stat_COMPTEUR('express', method, 'slow');
                }
            }
        }));

        // createTerminus(this.app, { onSignal: ServerBase.getInstance().terminus });

        process.stdin.resume(); //so the program will not close instantly

        //do something when app is closing
        process.on('exit', async () => await this.exitHandler.bind(null, { cleanup: true, from: 'exit' }));

        //catches ctrl+c event
        process.on('SIGINT', async () => await this.exitHandler.bind(null, { exit: true, from: 'SIGINT' }));

        // catches "kill pid" (for example: nodemon restart)
        process.on('SIGUSR1', async () => await this.exitHandler.bind(null, { exit: true, from: 'SIGUSR1' }));
        process.on('SIGUSR2', async () => await this.exitHandler.bind(null, { exit: true, from: 'SIGUSR2' }));

        //catches uncaught exceptions
        process.on('uncaughtException', async (err) => await this.exitHandler.bind(null, { exit: true, from: 'uncaughtException:' + err }));

        this.app.use(cookieParser());

        // this.app.use(helmet({
        //     referrerPolicy: ({ policy: 'same-origin' }),
        //     contentSecurityPolicy: ({
        //         directives: {
        //             'default-src': ["'self'"],
        //             'style-src': ["'self'", 'fonts.googleapis.com'],
        //             'script-src': ["'self'", 'fonts.googleapis.com'],
        //             'font-src': ["'self'", 'fonts.googleapis.com']
        //         }
        //     }),
        //     featurePolicy: ({
        //         features: {
        //             autoplay: ["'none'"],
        //             camera: ["'none'"],
        //             vibrate: ["'none'"],
        //             geolocation: ["'none'"],
        //             accelerometer: ["'none'"],
        //             magnetometer: ["'none'"],
        //             microphone: ["'none'"],
        //             payment: ["'none'"],
        //             usb: ["'none'"],
        //         }
        //     })
        // }
        // ));

        // const csrfMiddleware = new csurf();
        // this.app.use(csrfMiddleware);

        if (this.envParam.compress) {
            const shouldCompress = function (req, res) {
                if (req.headers['x-no-compression']) {
                    // don't compress responses with this request header
                    return false;
                }

                // fallback to standard filter function
                return compression.filter(req, res);
            };
            this.app.use(compression({ filter: shouldCompress }));
        }

        this.app.use(createLocaleMiddleware({
            priority: ["accept-language", "default"],
            default: this.envParam.default_locale
        }));

        // JNE : Ajout du header no cache sur les requetes gérées par express
        this.app.use(
            (req, res, next) => {
                res.setHeader("cache-control", "no-cache");
                return next();
            });

        // !JNE : Ajout du header no cache sur les requetes gérées par express

        /**
         * On tente de récupérer un ID unique de session en request, et si on en trouve, on essaie de charger la session correspondante
         * cf : https://stackoverflow.com/questions/29425070/is-it-possible-to-get-an-express-session-by-sessionid
         */
        this.app.use(function getSessionViaQuerystring(req, res: Response, next) {
            const sessionid = req.query.sessionid;
            if (!sessionid) {
                next();
                return;
            }

            // Trick the session middleware that you have the cookie;
            // Make sure you configure the cookie name, and set 'secure' to false
            // in https://github.com/expressjs/session#cookie-options
            if (req.cookies) {
                req.cookies['sid'] = req.query.sessionid;
            }

            if (req.rawHeaders) {
                for (const i in req.rawHeaders) {
                    const rawHeader = req.rawHeaders[i];
                    if (/^(.*; ?)?sid=[^;]+(; ?(.*))?$/.test(rawHeader)) {

                        const groups = /^(.*; ?)?sid=[^;]+(; ?(.*))?$/.exec(rawHeader);
                        req.rawHeaders[i] = (groups[1] ? groups[1] : '') + 'sid=' + req.query.sessionid + (groups[2] ? groups[2] : '');
                    }
                }
            }

            if (req.headers && req.headers['cookie'] && (req.headers['cookie'].indexOf('sid') >= 0)) {

                const groups = /^(.*; ?)?sid=[^;]+(; ?(.*))?$/.exec(req.headers['cookie']);
                req.headers['cookie'] = (groups[1] ? groups[1] : '') + 'sid=' + req.query.sessionid + (groups[2] ? groups[2] : '');
            } else {
                if (!req.headers) {
                    req.headers = {};
                }
                req.headers['cookie'] = 'sid=' + req.query.sessionid;
            }
            // res.setHeader('cookie', req.headers['cookie']);
            res.cookie('sid', req.query.sessionid);

            next();
        });

        this.session = expressSession({
            secret: ConfigurationService.node_configuration.express_secret,
            name: 'sid',
            proxy: true,
            resave: false,
            saveUninitialized: false,
            store: ExpressDBSessionsServerController.getInstance({
                conString: this.connectionString,
                schemaName: 'ref',
                tableName: UserSessionVO.API_TYPE_ID,
            }),
            cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
        });
        this.app.use(this.session);


        /**
         * On ajoute un contrôle de la version du client et si il se co avec une version trop ancienne on lui demande de reload
         */
        this.app.use(
            async (req, res, next) => {

                if (req.headers.version) {
                    const client_version = req.headers.version;
                    const server_version = this.getVersion();

                    if (client_version != server_version) {

                        const server_app_version_timestamp_str: string = server_version.split('-')[1];
                        const server_app_version_timestamp: number = server_app_version_timestamp_str?.length ? parseInt(server_app_version_timestamp_str) : null;

                        const local_app_version_timestamp_str: string = client_version.split('-')[1];
                        const local_app_version_timestamp: number = local_app_version_timestamp_str?.length ? parseInt(local_app_version_timestamp_str) : null;

                        if (server_app_version_timestamp && local_app_version_timestamp && (local_app_version_timestamp > server_app_version_timestamp)) {
                            return next();
                        }

                        ConsoleHandler.log("[CLIENT]:" + client_version + " != " + server_version);

                        const uid = req.session ? req.session.uid : null;
                        const client_tab_id = req.headers ? req.headers.client_tab_id : null;

                        if (uid && client_tab_id) {
                            StatsController.register_stat_COMPTEUR('express', 'version', 'reload');
                            ConsoleHandler.log("ServerExpressController:version:uid:" + uid + ":client_tab_id:" + client_tab_id + ": asking for reload");
                            await PushDataServerController.getInstance().notifyTabReload(uid, client_tab_id);
                        }

                        res.setHeader("cache-control", "no-cache");
                        res.status(426).send("Version mismatch, please reload your browser");
                        return;
                    }
                }

                return next();
            });

        // On rajoute un middleware pour stocker l'info de la last use tab_id par user
        this.app.use(
            async (req, res, next) => {
                const uid = req.session ? req.session.uid : null;
                const client_tab_id = req.headers ? req.headers.client_tab_id : null;

                if (!uid || !client_tab_id) {
                    return next();
                }

                PushDataServerController.last_known_tab_id_by_user_id[uid] = client_tab_id;
                return next();
            });

        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ServerExpressController:express:END');
        }

        this.hook_configure_express();

        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ServerExpressController:hook_pwa_init:START');
        }
        await this.hook_pwa_init();
        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ServerExpressController:hook_pwa_init:END');
        }

        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ServerExpressController:registerApis:START');
        }
        this.registerApis(this.app);
        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ServerExpressController:registerApis:END');
        }

        // Pour activation auto let's encrypt
        this.app.use('/.well-known', express.static('.well-known'));

        this.app.use(ModuleFile.FILES_ROOT.replace(/^[.][/]/, '/'), express.static(ModuleFile.FILES_ROOT.replace(/^[.][/]/, '')));

        /**
         * @depracated : DELETE When ok
         */
        this.app.use('/client/public', express.static('dist/public/client'));
        this.app.use('/admin/public', express.static('dist/public/admin'));
        this.app.use('/login/public', express.static('dist/public/login'));
        this.app.use('/vuejsclient/public', express.static('dist/public/vuejsclient'));

        /**
         * Pour le DEBUG en local
         */
        if (ConfigurationService.node_configuration.isdev) {
            this.app.use('/node_modules/oswedev/src/', express.static('../oswedev/src/'));
        }


        // Use this instead
        // this.app.use('/public', express.static('dist/public'));
        this.app.get('/public/*', async (req, res, next) => {

            const url = path.normalize(decodeURIComponent(req.path));
            const normalized = path.resolve('./dist' + url);

            if (!this.ROOT_FOLDER) {
                this.ROOT_FOLDER = path.resolve('./');
            }

            // Le cas du service worker est déjà traité, ici on a tout sauf le service_worker. Si on ne trouve pas le fichier c'est une erreur et on demande un reload
            // On fait la chasse aux sync
            if (!normalized.startsWith(this.ROOT_FOLDER)) {
                StatsController.register_stat_COMPTEUR('express', 'public', 'strange_normalized_url');

                const uid = req.session ? req.session.uid : null;
                const client_tab_id = req.headers ? req.headers.client_tab_id : null;

                if (uid && /^\/public\/[^/]+\.js$/i.test(url)) {
                    StatsController.register_stat_COMPTEUR('express', 'public', 'reload');
                    ConsoleHandler.warn("ServerExpressController:public:NOT_FOUND:" + req.url + ": asking for reload after failing loading component");
                    await PushDataServerController.getInstance().notifyTabReload(uid, client_tab_id);
                } else {
                    ConsoleHandler.error("ServerExpressController:public:NOT_FOUND:" + url + ": no uid or not a component - doing nothing...:uid:" + uid + ":client_tab_id:" + client_tab_id);
                }

                res.status(404).send("Not found");
                return;
            }

            res.sendFile(normalized);
        });

        // Le service de push
        this.app.get('/sw_push.js', (req, res, next) => {
            res.sendFile(path.resolve('./dist/public/vuejsclient/sw_push.js'));
        });

        // this.app.use(
        //     expressSession({
        //         secret: 'vk4s8dq2j4',
        //         name: 'sid',
        //         proxy: true,
        //         resave: false,
        //         saveUninitialized: false,
        //         store: new FileStore()
        //     })
        // );
        // allow cors
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Credentials', 'true');
            res.header('Access-Control-Allow-Origin', (req.headers.origin ? req.headers.origin.toString() : ""));
            res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
            res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
            next();
        });


        this.app.use(function (req, res, next) {
            // TODO JNE - A DISCUTER
            try {
                const sid = res.req.cookies['sid'];

                if (sid) {
                    req.session.sid = sid;
                }
            } catch (error) {
            }
            next();
        });
        // /**
        //  * Seconde option pour tenter de récupérer le session share
        //  *  cf: https://stackoverflow.com/questions/29425070/is-it-possible-to-get-an-express-session-by-sessionid
        //  */
        // this.app.use(function (req, res, next) {
        //     var sessionId = req.query.sessionid;
        //     if (!sessionId) {
        //         next();
        //         return;
        //     }

        //     if (req.session.id == sessionId) {
        //         next();
        //         return;
        //     }

        //     function makeNew(next) {
        //         if (req.sessionStore) {
        //             req.sessionStore.get(sessionId, function (err, session) {
        //                 if (err) {
        //                     console.error("error while restoring a session by id", err);
        //                 }
        //                 if (session) {
        //                     req.sessionStore.createSession(req, session);
        //                 }
        //                 next();
        //             });
        //         } else {
        //             console.error("req.sessionStore isn't available");
        //             next();
        //         }
        //     }

        //     if (sessionId) {
        //         if (req.session) {
        //             req.session.destroy(function (err) {
        //                 if (err) {
        //                     console.error('error while destroying initial session', err);
        //                 }
        //                 makeNew(next);
        //             });
        //         } else {
        //             makeNew(next);
        //         }
        //     } else {
        //         next();
        //     }
        // });

        this.app.use('/admin/js', express.static('dist/admin/public/js'));

        this.app.use(express.json({ limit: '150mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '150mb' }));

        // this.app.use(StackContext.middleware);

        this.app.use(async (req, res, next) => {

            let session: IServerUserSession = null;
            if (req && !!req.session) {
                session = req.session;

                if (!session.returning) {
                    // session was just created
                    session.returning = true;
                    session.creation_date_unix = Dates.now();
                } else {

                    // old session - on check qu'on doit pas invalider
                    if ((!session.last_check_session_validity) ||
                        (Dates.now() >= session.last_check_session_validity + 10)) {

                        session.last_check_session_validity = Dates.now();

                        if (!this.check_session_validity(session)) {
                            await ConsoleHandler.warn('unregisterSession:!check_session_validity:UID:' + session.uid);
                            await StackContext.runPromise(
                                await ServerExpressController.getInstance().getStackContextFromReq(req, session),
                                async () => {

                                    await PushDataServerController.getInstance().unregisterSession(session);
                                    session.destroy(async () => {
                                        await ServerBase.getInstance().redirect_login_or_home(req, res);
                                    });
                                });
                            return;
                        }
                    }
                }
            }

            if (session && session.uid) {

                if ((!session.last_check_blocked_or_expired) ||
                    (Dates.now() >= (session.last_check_blocked_or_expired + 60))) {

                    session.last_check_blocked_or_expired = Dates.now();
                    // On doit vérifier que le compte est ni bloqué ni expiré
                    const user = await query(UserVO.API_TYPE_ID).filter_by_id(session.uid).exec_as_server().select_vo<UserVO>();

                    if ((!user) || user.blocked || user.invalidated) {

                        await ConsoleHandler.warn('unregisterSession:last_check_blocked_or_expired:UID:' + session.uid + ':user:' + (user ? JSON.stringify(user) : 'N/A'));
                        await StackContext.runPromise(
                            await ServerExpressController.getInstance().getStackContextFromReq(req, session),
                            async () => {

                                await PushDataServerController.getInstance().unregisterSession(session);
                                session.destroy(async () => {
                                    await ServerBase.getInstance().redirect_login_or_home(req, res);
                                });
                            });

                        return;
                    }
                }

                PushDataServerController.getInstance().registerSession(session);

                if (MaintenanceServerController.getInstance().has_planned_maintenance) {

                    await StackContext.runPromise(
                        await ServerExpressController.getInstance().getStackContextFromReq(req, session),
                        async () => await MaintenanceServerController.getInstance().inform_user_on_request(session.uid));
                }

                if (EnvHandler.node_verbose) {
                    ConsoleHandler.log('REQUETE: ' + req.url + ' | USER ID: ' + session.uid + ' | BODY: ' + JSON.stringify(req.body));
                }
            }

            // On log les requêtes pour ensuite pouvoir les utiliser dans le delete session en log
            const api_req: string[] = [];
            const uid: number = (session) ? session.uid : null;
            const sid: string = (session) ? session.sid : null;
            const date: string = Dates.format(Dates.now(), "DD/MM/YYYY HH:mm:ss", true);

            if (req.url == "/api_handler/requests_wrapper") {
                for (const i in req.body) {
                    api_req.push("DATE:" + date + " || UID:" + uid + " || SID:" + sid + " || URL:" + req.body[i].url);
                }
            } else {
                api_req.push("DATE:" + date + " || UID:" + uid + " || SID:" + sid + " || URL:" + req.url);
            }

            await ForkedTasksController.exec_self_on_bgthread(
                AccessPolicyDeleteSessionBGThread.getInstance().name,
                AccessPolicyDeleteSessionBGThread.TASK_NAME_add_api_reqs,
                api_req
            );

            // Génération à la volée des images en fonction du format demandé
            if (req.url.indexOf(ModuleImageFormat.RESIZABLE_IMGS_PATH_BASE.replace('./', '/')) == 0) {
                const matches: string[] = req.url.match('(' + ModuleImageFormat.RESIZABLE_IMGS_PATH_BASE.replace('./', '/') + ')([^/]+)/(.*)');

                if (!matches || !matches.length) {
                    return res.status(404).send('Not matches');
                }

                const format_name: string = matches[2];
                const file_path: string = decodeURI(matches[3]);

                if (fs.existsSync(decodeURI(req.url)) || !format_name || !file_path) {
                    // Le fichier existe, on le renvoie directement
                    return res.sendFile(path.resolve(decodeURI(req.url)));
                }

                const base_filepath: string = ModuleFile.FILES_ROOT + file_path;

                // On vérifie que le fichier de base existe pour appliquer le format dessus
                if (!fs.existsSync(base_filepath)) {
                    // Le fichier n'existe pas, donc 404
                    return res.status(404).send('Not found : ' + base_filepath);
                }

                const format: ImageFormatVO = await query(ImageFormatVO.API_TYPE_ID)
                    .filter_by_text_eq(field_names<ImageFormatVO>().name, format_name, ImageFormatVO.API_TYPE_ID, true)
                    .select_vo<ImageFormatVO>();

                if (!format) {
                    // Pas de format
                    return res.status(404).send('Pas de format : ' + format_name);
                }

                const formatted_image: FormattedImageVO = await ModuleImageFormat.getInstance().get_formatted_image(
                    base_filepath,
                    format_name,
                    format.width,
                    format.height
                );

                if (!formatted_image) {
                    return res.status(404).send('Erreur génération image formatée');
                }

                return res.sendFile(path.resolve(formatted_image.formatted_src));
            }

            next();
        });

        /**
         * Pas trouvé à faire une route récursive propre, on limite à 5 sous-reps
         */
        this.app.use(ModuleFile.SECURED_FILES_ROOT.replace(/^[.][/]/, '/') + '(:folder1/)?(:folder2/)?(:folder3/)?(:folder4/)?(:folder5/)?:file_name', async (req: Request, res: Response, next: NextFunction) => {

            const folders = (req.params.folder1 ? req.params.folder1 + '/' + (
                req.params.folder2 ? req.params.folder2 + '/' + (
                    req.params.folder3 ? req.params.folder3 + '/' + (
                        req.params.folder4 ? req.params.folder4 + '/' + (
                            req.params.folder5 ? req.params.folder5 + '/' : ''
                        ) : ''
                    ) : ''
                ) : ''
            ) : '');
            const file_name = req.params.file_name;

            if (file_name.indexOf(';') >= 0) {
                next();
                return;
            }

            if (file_name.indexOf(')') >= 0) {
                next();
                return;
            }

            if (file_name.indexOf("'") >= 0) {
                next();
                return;
            }

            const session: IServerUserSession = req.session as IServerUserSession;
            let file: FileVO = null;
            let has_access: boolean = false;

            await StackContext.runPromise(
                await ServerExpressController.getInstance().getStackContextFromReq(req, session),
                async () => {
                    file = await query(FileVO.API_TYPE_ID)
                        .filter_is_true(field_names<FileVO>().is_secured)
                        .filter_by_text_eq(field_names<FileVO>().path, ModuleFile.SECURED_FILES_ROOT + folders + file_name).select_vo<FileVO>();
                    has_access = (file && file.file_access_policy_name) ? AccessPolicyServerController.checkAccessSync(file.file_access_policy_name) : false;
                });

            if (!has_access) {

                await ServerBase.getInstance().redirect_login_or_home(req, res);
                return;
            }
            res.sendFile(path.resolve(file.path));
        });

        // On préload les droits / users / groupes / deps pour accélérer le démarrage
        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ServerExpressController:preload_access_rights:START');
        }
        await ModuleAccessPolicyServer.getInstance().preload_access_rights();
        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ServerExpressController:preload_access_rights:END');
        }

        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ServerExpressController:configure_server_modules:START');
        }
        await this.modulesService.configure_server_modules(this.app);
        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ServerExpressController:configure_server_modules:END');
        }

        // A ce stade on a chargé toutes les trads par défaut possible et immaginables
        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ServerExpressController:saveDefaultTranslations:START');
        }
        await DefaultTranslationsServerManager.getInstance().saveDefaultTranslations();
        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ServerExpressController:saveDefaultTranslations:END');
        }

        // Derniers chargements
        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ServerExpressController:late_server_modules_configurations:START');
        }
        await this.modulesService.late_server_modules_configurations(false);
        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ServerExpressController:late_server_modules_configurations:END');
        }

        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ServerExpressController:i18nextInit:getALL_LOCALES:START');
        }
        // Avant de supprimer i18next... on corrige pour que ça fonctionne coté serveur aussi les locales
        const locales = await ModuleTranslation.getInstance().getALL_LOCALES();
        const locales_corrected = {};
        for (const lang in locales) {
            if (lang && lang.indexOf('-') >= 0) {
                const lang_parts = lang.split('-');
                if (lang_parts.length == 2) {
                    locales_corrected[lang_parts[0] + '-' + lang_parts[1].toUpperCase()] = locales[lang];
                }
            }
        }
        const i18nextInit = I18nextInit.getInstance(locales_corrected);
        LocaleManager.getInstance().i18n = i18nextInit.i18next;
        this.app.use(i18nextInit.i18nextMiddleware.handle(i18nextInit.i18next, {
            ignoreRoutes: ["/public"]
        }));
        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ServerExpressController:i18nextInit:getALL_LOCALES:END');
        }

        this.app.get('/', async (req: Request, res: Response) => {

            const session: IServerUserSession = req.session as IServerUserSession;

            // On va regarder si la personne essaye d'y accéder en direct
            // Si c'est le cas, on considère que la personne peut ne pas avoir accès et donc sa session ne sera pas supprimée
            let can_fail: boolean = true;

            if (req && req.headers && req.headers.referer) {
                can_fail = false;
            }

            const has_access: boolean = await StackContext.runPromise(
                await ServerExpressController.getInstance().getStackContextFromReq(req, session),
                async () => AccessPolicyServerController.checkAccessSync(ModuleAccessPolicy.POLICY_FO_ACCESS, can_fail));

            if (!has_access) {
                await ServerBase.getInstance().redirect_login_or_home(req, res);
                return;
            }

            res.sendFile(path.resolve('./dist/public/index.html'));
        });

        this.app.get('/admin', async (req: Request, res) => {

            const session: IServerUserSession = req.session as IServerUserSession;

            // On va regarder si la personne essaye d'y accéder en direct
            // Si c'est le cas, on considère que la personne peut ne pas avoir accès et donc sa session ne sera pas supprimée
            let can_fail: boolean = true;

            if (req && req.headers && req.headers.referer) {
                can_fail = false;
            }

            const has_access: boolean = await StackContext.runPromise(
                await ServerExpressController.getInstance().getStackContextFromReq(req, session),
                async () => AccessPolicyServerController.checkAccessSync(ModuleAccessPolicy.POLICY_BO_ACCESS, can_fail));

            if (!has_access) {

                await ServerBase.getInstance().redirect_login_or_home(req, res, '/');
                return;
            }
            res.sendFile(path.resolve('./dist/public/admin.html'));
        });

        // Accès aux logs iisnode
        this.app.get('/iisnode/:file_name', async (req: Request, res) => {

            const file_name = req.params.file_name;

            const session: IServerUserSession = req.session as IServerUserSession;
            let has_access: boolean = false;

            if (file_name) {
                await StackContext.runPromise(
                    await ServerExpressController.getInstance().getStackContextFromReq(req, session),
                    async () => {
                        has_access = AccessPolicyServerController.checkAccessSync(ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS) && AccessPolicyServerController.checkAccessSync(ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_ACCESS);
                    });
            }

            if (!has_access) {

                await ServerBase.getInstance().redirect_login_or_home(req, res, '/');
                return;
            }
            res.sendFile(path.resolve('./iisnode/' + file_name));
        });

        // this.app.set('views', 'src/client/views');

        // Send CSRF token for session
        this.app.get('/api/getcsrftoken', ServerBase.getInstance().csrfProtection, async (req, res) => {

            /**
             * On stocke dans la session l'info de la date de chargement de l'application
             */
            let session: IServerUserSession = null;
            if (req && req.session) {
                session = req.session;

                session.last_load_date_unix = Dates.now();
            }

            if (session && session.uid) {
                const uid: number = session.uid;

                // On doit vérifier que le compte est ni bloqué ni expiré
                const user = await query(UserVO.API_TYPE_ID).filter_by_id(session.uid).exec_as_server().select_vo<UserVO>();
                if ((!user) || user.blocked || user.invalidated) {

                    await ConsoleHandler.warn('unregisterSession:getcsrftoken:UID:' + session.uid + ':user:' + (user ? JSON.stringify(user) : 'N/A'));
                    await StackContext.runPromise(
                        await ServerExpressController.getInstance().getStackContextFromReq(req, session),
                        async () => {

                            await PushDataServerController.getInstance().unregisterSession(session);
                            session.destroy(async () => {
                                await ServerBase.getInstance().redirect_login_or_home(req, res);
                            });
                        });
                    return;
                }
                session.last_check_blocked_or_expired = Dates.now();

                PushDataServerController.getInstance().registerSession(session);

                // On stocke le log de connexion en base
                const user_log: UserLogVO = new UserLogVO();
                user_log.user_id = uid;
                user_log.log_time = Dates.now();
                user_log.impersonated = false;
                user_log.referer = req.headers.referer;
                user_log.log_type = UserLogVO.LOG_TYPE_CSRF_REQUEST;

                /**
                 * Gestion du impersonate
                 */
                user_log.handle_impersonation(session);

                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(user_log);
            }

            return res.json({ csrfToken: req.csrfToken() });
        });

        this.app.get('/login', (req, res) => {
            res.sendFile(path.resolve('./dist/public/login.html'));
        });

        this.app.get('/logout', async (req, res) => {

            const err = await StackContext.runPromise(
                await ServerExpressController.getInstance().getStackContextFromReq(req, req.session),
                async () => await ModuleAccessPolicyServer.getInstance().logout()
            );

            // await ThreadHandler.sleep(1000);
            // res.redirect('/');

            const PARAM_TECH_DISCONNECT_URL: string = await ModuleParams.getInstance().getParamValueAsString(ModulePushData.PARAM_TECH_DISCONNECT_URL);
            res.redirect(PARAM_TECH_DISCONNECT_URL);
        });

        this.app.use('/js', express.static('client/js'));
        this.app.use('/css', express.static('client/css'));
        this.app.use('/temp', express.static('temp'));
        this.app.use('/admin/temp', express.static('temp'));

        // reflect_headers
        this.app.get('/api/reflect_headers', (req, res) => {

            // ConsoleHandler.log(JSON.stringify(req.headers));
            const result = JSON.stringify(req.headers);
            res.send(result);
        });
        this.app.get('/api/clientappcontrollerinit', async (req, res) => {
            const session = req.session;

            const user: UserVO = await StackContext.runPromise(
                await ServerExpressController.getInstance().getStackContextFromReq(req, session),
                async () => await ModuleAccessPolicyServer.getSelfUser());

            res.json(JSON.stringify(
                {
                    data_version: ServerBase.getInstance().version,
                    data_user: user,
                    data_ui_debug: ServerBase.getInstance().uiDebug,
                    // data_base_api_url: "",
                    data_default_locale: ServerBase.getInstance().envParam.default_locale
                }
            ));
        });

        this.app.get('/api/adminappcontrollerinit', async (req, res) => {
            const session = req.session;

            const user: UserVO = await StackContext.runPromise(
                await ServerExpressController.getInstance().getStackContextFromReq(req, session),
                async () => await ModuleAccessPolicyServer.getSelfUser());

            res.json(JSON.stringify(
                {
                    data_version: ServerBase.getInstance().version,
                    data_code_pays: ServerBase.getInstance().envParam.code_pays,
                    data_node_env: process.env.NODE_ENV,
                    data_user: user,
                    data_ui_debug: ServerBase.getInstance().uiDebug,
                    data_default_locale: ServerBase.getInstance().envParam.default_locale,
                }
            ));
        });

        // // L'API qui renvoie les infos pour générer l'interface NGA pour les modules (activation / désactivation des modules et les paramètres de chaque module)
        // this.app.get('/api/modules_nga_fields_infos/:env', (req, res) => {

        //     // On envoie en fait un fichier JS... Pour avoir un chargement des modules synchrone côté client en intégrant juste un fichier js.
        //     res.send('GM_Modules = ' + JSON.stringify(GM.get_modules_infos(req.params.env)) + ';');
        // });

        // // JNE : Savoir si on est en DEV depuis la Vue.js client
        // this.app.get('/api/isdev', (req, res) => {
        //     res.json(ServerBase.getInstance().envParam.isdev);
        // });
        // // !JNE : Savoir si on est en DEV depuis la Vue.js client

        // Déclenchement du cron
        this.app.get('/cron', async (req: Request, res) => {

            /**
             * Cas particulier du cron qui est appelé directement par les taches planifiées et qui doit
             *  attendre la fin du démarrage du serveur et des childs threads pour lancer le broadcast
             */
            let timeout_sec: number = 30;
            while ((!ForkServerController.forks_are_initialized) && (timeout_sec > 0)) {
                await ThreadHandler.sleep(1000, '/cron.!forks_are_initialized', true);
                timeout_sec--;
            }

            if (!ForkServerController.forks_are_initialized) {
                ConsoleHandler.error('CRON non lancé car le thread enfant n\'est pas disponible en 30 secondes.');
                res.send();
            } else {

                try {

                    // Retrait IS_CLIENT false puisque les crons sont sur des bgthreads, il n'y a pas de maintien du context client dans tous les cas
                    await CronServerController.getInstance().executeWorkers();
                    res.json();
                } catch (err) {
                    ConsoleHandler.error("error: " + (err.message || err));
                    return res.status(500).send(err.message || err);
                }
            }
        });

        // TODO FIXME : à passer en API normale !
        if (ModuleCommerce.getInstance().actif) {
            this.app.get('/getIdPanierEnCours', (req: Request, res) => {
                res.json({ id_panier: this.session.id_panier });
                res.send();
            });
            this.app.get('/setIdPanierEnCours/:value', (req: Request, res) => {
                this.session.id_panier = parseInt(req.params.value);
                res.json({ id_panier: this.session.id_panier });
                res.send();
            });
        }

        // this.initializePush();
        // this.initializePushApis(this.app);
        this.registerApis(this.app);

        if (ConfigurationService.node_configuration.activate_long_john) {
            require('longjohn');
        }

        process.on('uncaughtException', function (err) {
            ConsoleHandler.error("Node nearly failed: " + err.stack);
        });

        ThreadHandler.set_interval(MemoryUsageStat.updateMemoryUsageStat, 45000, 'MemoryUsageStat.updateMemoryUsageStat', true);

        ConsoleHandler.log('listening on port: ' + ServerBase.getInstance().port);

        const on_connection = async () => {
            ConsoleHandler.log('connection to db successful');

            const server = require('http').Server(ServerBase.getInstance().app);
            const io = require('socket.io')(server);
            ServerBase.getInstance().io = io;
            io.use(sharedsession(ServerBase.getInstance().session));

            io.of('/').adapter.on('join-room', (room) => {
                // On ne s'intéresse qu'aux rooms de push (donc un vo stringified)
                if (!room || (typeof room != 'string') || (room.indexOf('{"') != 0)) {
                    return;
                }

                if (ConfigurationService.node_configuration.debug_io_rooms) {
                    ConsoleHandler.log('SOCKET IO:join-room: ' + room);
                }
            });

            io.of('/').adapter.on('leave-room', (room) => {
                // On ne s'intéresse qu'aux rooms de push (donc un vo stringified)
                if (!room || (typeof room != 'string') || (room.indexOf('{"') != 0)) {
                    return;
                }

                if (ConfigurationService.node_configuration.debug_io_rooms) {
                    ConsoleHandler.log('SOCKET IO:leave-room: ' + room);
                }
            });

            io.of('/').adapter.on('create-room', (room) => {

                // On ne s'intéresse qu'aux rooms de push (donc un vo stringified)
                if (!room || (typeof room != 'string') || (room.indexOf('{"') != 0)) {
                    return;
                }

                if (ConfigurationService.node_configuration.debug_io_rooms) {
                    ConsoleHandler.log('SOCKET IO:create-room: ' + room);
                }

                ModulePushDataServer.getInstance().on_create_room(room);
            });
            io.of('/').adapter.on('delete-room', (room) => {
                // On ne s'intéresse qu'aux rooms de push (donc un vo stringified)
                if (!room || (typeof room != 'string') || (room.indexOf('{"') != 0)) {
                    return;
                }

                if (ConfigurationService.node_configuration.debug_io_rooms) {
                    ConsoleHandler.log('SOCKET IO:delete-room: ' + room);
                }

                ModulePushDataServer.getInstance().on_delete_room(room);
            });

            server.listen(ServerBase.getInstance().port);
            // ServerBase.getInstance().app.listen(ServerBase.getInstance().port);

            // SocketIO
            // let io = socketIO.listen(ServerBase.getInstance().app);
            //turn off debug
            // io.set('log level', 1);
            // define interactions with client

            io.on('connection', function (socket: socketIO.Socket) {
                const session: IServerUserSession = socket.handshake['session'];

                if (!session) {
                    ConsoleHandler.error('Impossible de charger la session dans SocketIO');
                    return;
                }

                PushDataServerController.getInstance().registerSocket(session, socket);
            }.bind(ServerBase.getInstance()));

            io.on('disconnect', function (socket: socketIO.Socket) {
                const session: IServerUserSession = socket.handshake['session'];

                PushDataServerController.getInstance().unregisterSocket(session, socket);
            });

            io.on('error', function (err) {
                ConsoleHandler.error("IO nearly failed: " + err.stack);
            });

            // ServerBase.getInstance().testNotifs();

            if (ConfigurationService.node_configuration.debug_start_server) {
                ConsoleHandler.log('ServerExpressController:hook_on_ready:START');
            }
            await ServerBase.getInstance().hook_on_ready();
            if (ConfigurationService.node_configuration.debug_start_server) {
                ConsoleHandler.log('ServerExpressController:hook_on_ready:END');
            }

            if (ConfigurationService.node_configuration.debug_start_server) {
                ConsoleHandler.log('ServerExpressController:fork_threads:START');
            }
            await ForkServerController.fork_threads();
            if (ConfigurationService.node_configuration.debug_start_server) {
                ConsoleHandler.log('ServerExpressController:fork_threads:END');
            }
            BGThreadServerController.SERVER_READY = true;

            if (ConfigurationService.node_configuration.auto_end_maintenance_on_start) {
                await ModuleMaintenance.getInstance().end_planned_maintenance();
            }

            ConsoleHandler.log('Server ready to go !');
        };

        ServerBase.getInstance().db.one('SELECT 1')
            .then(on_connection)
            .catch(async (err) => {
                ConsoleHandler.error('error while connecting to db: ' + (err.message || err) + ' : trying to handle the error...');

                try {
                    await ModuleServiceBase.getInstance().handle_errors(err, 'initial_db_connection', ServerBase.getInstance().db.one, ['SELECT 1']);
                    await on_connection();
                } catch (error) {
                    ConsoleHandler.error('Could not handle error while connecting to db: ' + (error.message || error));
                    process.exit(1);
                }
            });

        // pgp.end();
    }

    /* istanbul ignore next: nothing to test here */
    protected async hook_on_ready() { }

    /* istanbul ignore next: nothing to test here */
    protected async hook_pwa_init() {
        const version = this.getVersion();

        // this.app.get('/public/client-sw.' + version + '.js', (req, res, next) => {
        //     res.header('Service-Worker-Allowed', '/public/');

        // });

        this.app.get('/public/client-sw.*.js', (req, res, next) => {
            res.header('Service-Worker-Allowed', '/');

            // si on tente de récupérer un service worker qui n'existe pas, on laisse passer l'erreur et on ne recharge pas.
            // par contre si on est ailleurs dans le /public/, il faudra demander un reload de la page
            res.sendFile(path.resolve('./dist' + req.url));
        });
    }

    /* istanbul ignore next: hardly testable */
    protected handleError(promise, res) {
        promise.catch((err) => {
            ConsoleHandler.error("error: " + (err.message || err));
            return res.status(500).send(err.message || err);
        });
    }

    /* istanbul ignore next: hardly testable */
    protected sendError(res, errormessage) {
        ConsoleHandler.error("error: " + errormessage);
        return res.status(500).send(errormessage);
    }

    /* istanbul ignore next: nothing to test here */
    protected registerApis(app) {
    }

    /**
     * On s'assure de la création des dossiers nécessaires au bon fonctionnement de l'application
     */
    /* istanbul ignore next: hardly testable */
    protected async createMandatoryFolders() {
        await ModuleFileServer.getInstance().makeSureThisFolderExists('./temp');
        await ModuleFileServer.getInstance().makeSureThisFolderExists('./files');
        await ModuleFileServer.getInstance().makeSureThisFolderExists('./sfiles');
        await ModuleFileServer.getInstance().makeSureThisFolderExists('./files/upload');
        await ModuleFileServer.getInstance().makeSureThisFolderExists('./logs');
    }

    protected async redirect_login_or_home(req: Request, res: Response, url: string = null) {
        if (!await ModuleAccessPolicy.getInstance().getLoggedUserId()) {
            const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.redirect('/login#?redirect_to=' + encodeURIComponent(fullUrl));
            return;
        }
        res.redirect(url ? url : '/login');
        return;
    }

    protected check_session_validity(session: IServerUserSession): boolean {
        return true;
    }

    protected async exitHandler(options, exitCode, from) {
        ConsoleHandler.log('Server is starting cleanup: ' + from);

        ConsoleHandler.log(JSON.stringify(VarsDatasVoUpdateHandler['ordered_vos_cud']));
        await VarsDatasVoUpdateHandler.force_empty_vars_datas_vo_update_cache();
        if (options.cleanup) {
            console.log('clean');
        }
        if (exitCode || exitCode === 0) {
            console.log(exitCode);
        }
        if (options.exit) {
            process.exit();
        }
    }

    /* istanbul ignore next: nothing to test here */
    protected abstract initializeDataImports();
    /* istanbul ignore next: nothing to test here */
    protected abstract hook_configure_express();
    /* istanbul ignore next: nothing to test here */

    protected abstract getVersion();
}
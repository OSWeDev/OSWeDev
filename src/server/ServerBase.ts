import * as bodyParser from 'body-parser-with-msgpack';
import * as child_process from 'child_process';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import * as csrf from 'csurf';
import * as express from 'express';
import { NextFunction, Request, Response } from 'express';
import * as createLocaleMiddleware from 'express-locale';
import * as expressSession from 'express-session';
import * as sharedsession from 'express-socket.io-session';
import * as fs from 'fs';
import * as msgpackResponse from 'msgpack-response';
import * as path from 'path';
import * as pg from 'pg';
import * as pg_promise from 'pg-promise';
import { IDatabase } from 'pg-promise';
import * as socketIO from 'socket.io';
import * as winston from 'winston';
import * as winston_daily_rotate_file from 'winston-daily-rotate-file';
import ModuleAccessPolicy from '../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserLogVO from '../shared/modules/AccessPolicy/vos/UserLogVO';
import UserSessionVO from '../shared/modules/AccessPolicy/vos/UserSessionVO';
import UserVO from '../shared/modules/AccessPolicy/vos/UserVO';
import AjaxCacheController from '../shared/modules/AjaxCache/AjaxCacheController';
import ModuleCommerce from '../shared/modules/Commerce/ModuleCommerce';
import { query } from '../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../shared/modules/DAO/ModuleDAO';
import ModuleFile from '../shared/modules/File/ModuleFile';
import FileVO from '../shared/modules/File/vos/FileVO';
import Dates from '../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleMaintenance from '../shared/modules/Maintenance/ModuleMaintenance';
import ModulesManager from '../shared/modules/ModulesManager';
import ModuleTranslation from '../shared/modules/Translation/ModuleTranslation';
import ConsoleHandler from '../shared/tools/ConsoleHandler';
import EnvHandler from '../shared/tools/EnvHandler';
import ThreadHandler from '../shared/tools/ThreadHandler';
import ConfigurationService from './env/ConfigurationService';
import EnvParam from './env/EnvParam';
import FileLoggerHandler from './FileLoggerHandler';
import I18nextInit from './I18nextInit';
import IServerUserSession from './IServerUserSession';
import AccessPolicyDeleteSessionBGThread from './modules/AccessPolicy/bgthreads/AccessPolicyDeleteSessionBGThread';
import ModuleAccessPolicyServer from './modules/AccessPolicy/ModuleAccessPolicyServer';
import BGThreadServerController from './modules/BGThread/BGThreadServerController';
import CronServerController from './modules/Cron/CronServerController';
import ModuleDAOServer from './modules/DAO/ModuleDAOServer';
import ModuleFileServer from './modules/File/ModuleFileServer';
import ForkedTasksController from './modules/Fork/ForkedTasksController';
import ForkServerController from './modules/Fork/ForkServerController';
import MaintenanceServerController from './modules/Maintenance/MaintenanceServerController';
import ModuleServiceBase from './modules/ModuleServiceBase';
import PushDataServerController from './modules/PushData/PushDataServerController';
import DefaultTranslationsServerManager from './modules/Translation/DefaultTranslationsServerManager';
// import { createTerminus } from '@godaddy/terminus';
import VarsDatasVoUpdateHandler from './modules/Var/VarsDatasVoUpdateHandler';
import ServerExpressController from './ServerExpressController';
import StackContext from './StackContext';
require('moment-json-parser').overrideDefault();
const pgSession = require('oswedev-connect-pg-simple')(expressSession);

export default abstract class ServerBase {

    /* istanbul ignore next: nothing to test here */
    public static getInstance(): ServerBase {
        return ServerBase.instance;
    }

    /* istanbul ignore next: nothing to test here */
    protected static instance: ServerBase = null;

    public csrfProtection;

    protected db: IDatabase<any>;
    protected spawn;
    protected app;
    protected port;
    protected uiDebug;
    protected envParam: EnvParam;
    protected version;
    private connectionString: string;
    // private jwtSecret: string;
    private modulesService: ModuleServiceBase;
    private STATIC_ENV_PARAMS: { [env: string]: EnvParam };

    private session;
    // private subscription;

    /* istanbul ignore next: nothing to test here */
    protected constructor(modulesService: ModuleServiceBase, STATIC_ENV_PARAMS: { [env: string]: EnvParam }) {

        ForkedTasksController.getInstance().assert_is_main_process();

        ServerBase.instance = this;
        this.modulesService = modulesService;
        this.STATIC_ENV_PARAMS = STATIC_ENV_PARAMS;
        ConfigurationService.getInstance().setEnvParams(this.STATIC_ENV_PARAMS);

        FileLoggerHandler.getInstance().prepare().then(() => {
            ConsoleHandler.getInstance().logger_handler = FileLoggerHandler.getInstance();
            ConsoleHandler.getInstance().log("Main Process starting");
        }).catch((reason) => {
            ConsoleHandler.getInstance().error("FileLogger prepare : " + reason);
        });

        // Les bgthreads peuvent être register mais pas run dans le process server principal. On le dédie à Express et aux APIs
        BGThreadServerController.getInstance().register_bgthreads = true;
        CronServerController.getInstance().register_crons = true;

        ModulesManager.getInstance().isServerSide = true;
        this.csrfProtection = csrf({ cookie: true });
    }

    /* istanbul ignore next: nothing to test here */
    public async getUserData(uid: number) {
        return null;
    }

    /* istanbul ignore next: FIXME Don't want to test this file, but there are many things that should be externalized in smaller files and tested */
    public async initializeNodeServer() {

        await this.createMandatoryFolders();

        this.version = this.getVersion();

        this.envParam = ConfigurationService.getInstance().node_configuration;
        EnvHandler.getInstance().BASE_URL = this.envParam.BASE_URL;
        EnvHandler.getInstance().NODE_VERBOSE = !!this.envParam.NODE_VERBOSE;
        EnvHandler.getInstance().IS_DEV = !!this.envParam.ISDEV;
        EnvHandler.getInstance().MSGPCK = !!this.envParam.MSGPCK;
        EnvHandler.getInstance().COMPRESS = !!this.envParam.COMPRESS;
        EnvHandler.getInstance().CODE_GOOGLE_ANALYTICS = this.envParam.CODE_GOOGLE_ANALYTICS;
        EnvHandler.getInstance().VERSION = this.version;
        EnvHandler.getInstance().ACTIVATE_PWA = !!this.envParam.ACTIVATE_PWA;

        this.connectionString = this.envParam.CONNECTION_STRING;
        this.uiDebug = null; // JNE MODIF FLK process.env.UI_DEBUG;
        this.port = process.env.PORT ? process.env.PORT : this.envParam.PORT;

        // this.jwtSecret = 'This is the jwt secret for the rest part';

        let pgp: pg_promise.IMain = pg_promise({});
        this.db = pgp({
            connectionString: this.connectionString,
            max: this.envParam.MAX_POOL,
        });

        this.db.$pool.options.max = ConfigurationService.getInstance().node_configuration.MAX_POOL;
        this.db.$pool.options.idleTimeoutMillis = 120000;

        let GM = this.modulesService;
        await GM.register_all_modules(this.db);

        await this.initializeDataImports();

        this.spawn = child_process.spawn;

        /* A voir l'intéret des différents routers this.app.use(apiRouter());
        this.app.use(config.IS_PRODUCTION ? staticsRouter() : staticsDevRouter());*/

        /*app.listen(config.SERVER_PORT, () => {
            ConsoleHandler.getInstance().log(`App listening on port ${config.SERVER_PORT}!`);
        });*/


        const logger = new (winston.Logger)({
            transports: [
                new (winston.transports.Console)(),
                new (winston_daily_rotate_file)({
                    filename: './logs/log',
                    datePattern: 'yyyy-MM-dd.',
                    prepend: true
                })
            ]
        });

        // Correction timezone
        let types = pg.types;
        types.setTypeParser(1114, (stringValue) => {
            return stringValue;
        });

        // Une fois qu'on a créé les fichiers pour les modules côté client / admin, on lance les webpacks
        // Il faut relancer une compilation si on change les datas ou si on active / désactive un module.
        // WebpackInitializer.getInstance().compile();

        // .init({
        //     saveMissing: true,
        //     sendMissingTo: 'fallback',
        //     fallbackLng: envParam.DEFAULT_LOCALE,
        //     preload: [envParam.DEFAULT_LOCALE],
        //     debugger: false,
        //     resGetPath: __dirname + '/../../src/client/locales/__lng__/__ns__.json',
        //     resPostPath: __dirname + '/../../src/client/locales/__lng__/__ns__.missing.json',
        //     backend: {
        //         loadPath: path.join(__dirname, '/../../src/public/locales/{{lng}}/{{ns}}.json'),
        //         // path to post missing resources
        //         addPath: path.join(__dirname, '/../../src/public/locales/{{lng}}/{{ns}}.missing.json'),

        //         // jsonIndent to use when storing json files
        //         jsonIndent: 2
        //     },
        // }
        // /*, function() {
        //   i18nextMiddleware.addRoute(i18next, '/:lng/key-to-translate', ['fr-FR', 'de', 'es'], app, 'get',
        //     function(req, res) {
        //       // endpoint function
        //     })
        //   }*/
        // );

        this.app = express();

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

        if (this.envParam.COMPRESS) {
            let shouldCompress = function (req, res) {
                if (req.headers['x-no-compression']) {
                    // don't compress responses with this request header
                    return false;
                }

                // On check le cas du MSGPack qui est pas géré pour le moment pour indiquer compressible
                if (req.headers['content-type'] == AjaxCacheController.MSGPACK_REQUEST_TYPE) {
                    return true;
                }

                // fallback to standard filter function
                return compression.filter(req, res);
            };
            this.app.use(compression({ filter: shouldCompress }));
        }

        this.app.use(createLocaleMiddleware({
            priority: ["accept-language", "default"],
            default: this.envParam.DEFAULT_LOCALE
        }));

        // Chargement des WebPack Client et Admin
        // const webpack = require('webpack');

        // let compiler_client = webpack(WebpackConfigClient);
        // compiler_client.apply(new webpack.ProgressPlugin());
        // compiler_client.run(function (err, stats) {
        //     if (err) {
        //         ConsoleHandler.getInstance().error("[CLIENT]:" + err);
        //     }
        // });

        // JNE : Ajout du header no cache sur les requetes gérées par express
        this.app.use(
            (req, res, next) => {
                res.setHeader("cache-control", "no-cache");
                return next();
            });

        // !JNE : Ajout du header no cache sur les requetes gérées par express


        // Pour renvoyer les js en gzip directement quand ils sont appelés en .js.gz dans le html
        // Accept-Encoding: gzip, deflate
        // app.get('/public/generated/js/*.js.gz', function (req, res, next) {
        //     res.set('Content-Encoding', 'gzip');
        //     next();
        // });
        // test: /\.js$|\.css$|\.html|\.woff2?|\.eot|\.ttf|\.svg$/,
        //'/public/generated/js/*.js'

        let tryuseGZ = function (bundle, req, res, next) {

            let gzpath = './src/' + bundle + '/' + req.url + '.gz';
            if (req.acceptsEncodings('gzip') || req.acceptsEncodings('deflate')) {

                res.set('Content-Encoding', 'gzip');
                if (fs.existsSync(gzpath)) {

                    res.sendFile(path.resolve(gzpath));
                    return;
                }
            }
            next();
        };

        this.hook_configure_express();

        await this.hook_pwa_init();

        // app.get(/^[/]public[/]generated[/].*/, function (req, res, next) {
        //     tryuseGZ('client', req, res, next);
        // });

        // app.get(/^[/]admin[/]public[/]generated[/].*/, function (req, res, next) {
        //     tryuseGZ('admin', req, res, next);
        // });

        // app.get('*.gz', function (req, res, next) {
        //     res.set('Content-Encoding', 'gzip');
        //     next();
        // });

        this.registerApis(this.app);

        // Pour activation auto let's encrypt
        this.app.use('/.well-known', express.static('.well-known'));

        this.app.use(ModuleFile.FILES_ROOT.replace(/^[.][/]/, '/'), express.static(ModuleFile.FILES_ROOT.replace(/^[.][/]/, '')));

        this.app.use('/client/public', express.static('dist/client/public'));
        this.app.use('/admin/public', express.static('dist/admin/public'));
        this.app.use('/login/public', express.static('dist/login/public'));
        this.app.use('/vuejsclient/public', express.static('dist/vuejsclient/public'));

        // Le service de push
        this.app.get('/sw_push.js', (req, res, next) => {
            res.sendFile(path.resolve('./dist/vuejsclient/public/sw_push.js'));
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

        if (!!EnvHandler.getInstance().MSGPCK) {
            this.app.use(bodyParser.msgpack({
                limit: '100mb'
            }));
            this.app.use(msgpackResponse({ auto_detect: true }));
        }


        // Log request & response
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            // logger.info('req', {
            //     ip: req.ip,
            //     method: req.method,
            //     url: req.originalUrl,
            //     sessionID: req.sessionID
            // });

            const requestEnd = res.end;

            res.end = (chunk?: any, encoding?: any) => {

                // logger.info('res', {
                //     ip: req.ip,
                //     method: req.method,
                //     url: req.originalUrl,
                //     sessionID: req.sessionID,
                //     statusCode: res.statusCode
                // });

                // Do the work expected
                res.end = requestEnd;
                res.end(chunk, encoding);
            };

            return next();
        });

        /**
         * On tente de récupérer un ID unique de session en request, et si on en trouve, on essaie de charger la session correspondante
         * cf : https://stackoverflow.com/questions/29425070/is-it-possible-to-get-an-express-session-by-sessionid
         */
        this.app.use(function getSessionViaQuerystring(req, res: Response, next) {
            var sessionid = req.query.sessionid;
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
                for (let i in req.rawHeaders) {
                    let rawHeader = req.rawHeaders[i];
                    if (/^(.*; ?)?sid=[^;]+(; ?(.*))?$/.test(rawHeader)) {

                        let groups = /^(.*; ?)?sid=[^;]+(; ?(.*))?$/.exec(rawHeader);
                        req.rawHeaders[i] = (groups[1] ? groups[1] : '') + 'sid=' + req.query.sessionid + (groups[2] ? groups[2] : '');
                    }
                }
            }

            if (req.headers && req.headers['cookie'] && (req.headers['cookie'].indexOf('sid') >= 0)) {

                let groups = /^(.*; ?)?sid=[^;]+(; ?(.*))?$/.exec(req.headers['cookie']);
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
            secret: 'vk4s8dq2j4',
            name: 'sid',
            proxy: true,
            resave: false,
            saveUninitialized: false,
            store: new pgSession({
                conString: this.connectionString,
                schemaName: 'ref',
                tableName: UserSessionVO.API_TYPE_ID,
            }),
            cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
        });
        this.app.use(this.session);

        this.app.use(function (req, res, next) {
            // TODO JNE - A DISCUTER
            try {
                let sid = res.req.cookies['sid'];

                if (!!sid) {
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

        // this.app.use(StackContext.getInstance().middleware);

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
                            await ConsoleHandler.getInstance().warn('unregisterSession:!check_session_validity:UID:' + session.uid);
                            await StackContext.getInstance().runPromise(
                                ServerExpressController.getInstance().getStackContextFromReq(req, session),
                                async () => {

                                    await PushDataServerController.getInstance().unregisterSession(session);
                                    session.destroy(() => {
                                        ServerBase.getInstance().redirect_login_or_home(req, res);
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

                    // On doit vérifier que le compte est ni bloqué ni expiré
                    let user = null;
                    await StackContext.getInstance().runPromise(
                        { IS_CLIENT: false },
                        async () => {
                            user = await ModuleDAO.getInstance().getVoById<UserVO>(UserVO.API_TYPE_ID, session.uid);
                        });

                    if ((!user) || user.blocked || user.invalidated) {

                        await ConsoleHandler.getInstance().warn('unregisterSession:last_check_blocked_or_expired:UID:' + session.uid + ':user:' + (user ? JSON.stringify(user) : 'N/A'));
                        await StackContext.getInstance().runPromise(
                            ServerExpressController.getInstance().getStackContextFromReq(req, session),
                            async () => {

                                await PushDataServerController.getInstance().unregisterSession(session);
                                session.destroy(() => {
                                    ServerBase.getInstance().redirect_login_or_home(req, res);
                                });
                            });

                        return;
                    }
                    session.last_check_blocked_or_expired = Dates.now();
                }

                PushDataServerController.getInstance().registerSession(session);

                if (MaintenanceServerController.getInstance().has_planned_maintenance) {

                    await StackContext.getInstance().runPromise(
                        ServerExpressController.getInstance().getStackContextFromReq(req, session),
                        async () => await MaintenanceServerController.getInstance().inform_user_on_request(session.uid));
                }

                if (!!EnvHandler.getInstance().NODE_VERBOSE) {
                    ConsoleHandler.getInstance().log('REQUETE: ' + req.url + ' | USER ID: ' + session.uid + ' | BODY: ' + JSON.stringify(req.body));
                }
            }

            // On log les requêtes pour ensuite pouvoir les utiliser dans le delete session en log
            let api_req: string[] = [];
            let uid: number = (session) ? session.uid : null;
            let sid: string = (session) ? session.sid : null;
            let date: string = Dates.format(Dates.now(), "DD/MM/YYYY HH:mm:ss", true);

            if (req.url == "/api_handler/requests_wrapper") {
                for (let i in req.body) {
                    api_req.push("DATE:" + date + " || UID:" + uid + " || SID:" + sid + " || URL:" + req.body[i].url);
                }
            } else {
                api_req.push("DATE:" + date + " || UID:" + uid + " || SID:" + sid + " || URL:" + req.url);
            }

            await ForkedTasksController.getInstance().exec_self_on_bgthread(
                AccessPolicyDeleteSessionBGThread.getInstance().name,
                AccessPolicyDeleteSessionBGThread.TASK_NAME_add_api_reqs,
                api_req
            );

            next();
        });

        /**
         * Pas trouvé à faire une route récursive propre, on limite à 5 sous-reps
         */
        this.app.use(ModuleFile.SECURED_FILES_ROOT.replace(/^[.][/]/, '/') + '(:folder1/)?(:folder2/)?(:folder3/)?(:folder4/)?(:folder5/)?:file_name', async (req: Request, res: Response, next: NextFunction) => {

            let folders = (req.params.folder1 ? req.params.folder1 + '/' + (
                req.params.folder2 ? req.params.folder2 + '/' + (
                    req.params.folder3 ? req.params.folder3 + '/' + (
                        req.params.folder4 ? req.params.folder4 + '/' + (
                            req.params.folder5 ? req.params.folder5 + '/' : ''
                        ) : ''
                    ) : ''
                ) : ''
            ) : '');
            let file_name = req.params.file_name;

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

            let session: IServerUserSession = req.session as IServerUserSession;
            let file: FileVO = null;
            let has_access: boolean = false;

            await StackContext.getInstance().runPromise(
                ServerExpressController.getInstance().getStackContextFromReq(req, session),
                async () => {
                    file = await query(FileVO.API_TYPE_ID).filter_is_true('is_secured').filter_by_text_eq('path', ModuleFile.SECURED_FILES_ROOT + folders + file_name).select_vo<FileVO>();
                    has_access = (file && file.file_access_policy_name) ? ModuleAccessPolicyServer.getInstance().checkAccessSync(file.file_access_policy_name) : false;
                });

            if (!has_access) {

                ServerBase.getInstance().redirect_login_or_home(req, res);
                return;
            }
            res.sendFile(path.resolve(file.path));
        });


        await this.modulesService.configure_server_modules(this.app);
        // A ce stade on a chargé toutes les trads par défaut possible et immaginables
        await DefaultTranslationsServerManager.getInstance().saveDefaultTranslations();
        // Une fois tous les droits / rôles définis, on doit pouvoir initialiser les droits d'accès
        await ModuleAccessPolicyServer.getInstance().preload_access_rights();

        // Derniers chargements
        await this.modulesService.late_server_modules_configurations();

        let i18nextInit = I18nextInit.getInstance(await ModuleTranslation.getInstance().getALL_LOCALES());
        this.app.use(i18nextInit.i18nextMiddleware.handle(i18nextInit.i18next, {
            ignoreRoutes: ["/public"]
        }));

        this.app.get('/', async (req: Request, res: Response) => {

            let session: IServerUserSession = req.session as IServerUserSession;

            // On va regarder si la personne essaye d'y accéder en direct
            // Si c'est le cas, on considère que la personne peut ne pas avoir accès et donc sa session ne sera pas supprimée
            let can_fail: boolean = true;

            if (req && req.headers && req.headers.referer) {
                can_fail = false;
            }

            let has_access: boolean = await StackContext.getInstance().runPromise(
                ServerExpressController.getInstance().getStackContextFromReq(req, session),
                async () => ModuleAccessPolicyServer.getInstance().checkAccessSync(ModuleAccessPolicy.POLICY_FO_ACCESS, can_fail));

            if (!has_access) {
                ServerBase.getInstance().redirect_login_or_home(req, res);
                return;
            }

            res.sendFile(path.resolve('./dist/client/public/generated/index.html'));
        });

        this.app.get('/admin', async (req: Request, res) => {

            let session: IServerUserSession = req.session as IServerUserSession;

            // On va regarder si la personne essaye d'y accéder en direct
            // Si c'est le cas, on considère que la personne peut ne pas avoir accès et donc sa session ne sera pas supprimée
            let can_fail: boolean = true;

            if (req && req.headers && req.headers.referer) {
                can_fail = false;
            }

            let has_access: boolean = await StackContext.getInstance().runPromise(
                ServerExpressController.getInstance().getStackContextFromReq(req, session),
                async () => ModuleAccessPolicyServer.getInstance().checkAccessSync(ModuleAccessPolicy.POLICY_BO_ACCESS, can_fail));

            if (!has_access) {

                ServerBase.getInstance().redirect_login_or_home(req, res, '/');
                return;
            }
            res.sendFile(path.resolve('./dist/admin/public/generated/admin.html'));
        });

        // Accès aux logs iisnode
        this.app.get('/iisnode/:file_name', async (req: Request, res) => {

            let file_name = req.params.file_name;

            let session: IServerUserSession = req.session as IServerUserSession;
            let has_access: boolean = false;

            if (file_name) {
                await StackContext.getInstance().runPromise(
                    ServerExpressController.getInstance().getStackContextFromReq(req, session),
                    async () => {
                        has_access = ModuleAccessPolicyServer.getInstance().checkAccessSync(ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS) && ModuleAccessPolicyServer.getInstance().checkAccessSync(ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_ACCESS);
                    });
            }

            if (!has_access) {

                ServerBase.getInstance().redirect_login_or_home(req, res, '/');
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
                let uid: number = session.uid;

                // On doit vérifier que le compte est ni bloqué ni expiré
                let user = null;
                await StackContext.getInstance().runPromise(
                    { IS_CLIENT: false },
                    async () => {
                        user = await ModuleDAO.getInstance().getVoById<UserVO>(UserVO.API_TYPE_ID, session.uid);
                    });
                if ((!user) || user.blocked || user.invalidated) {

                    await ConsoleHandler.getInstance().warn('unregisterSession:getcsrftoken:UID:' + session.uid + ':user:' + (user ? JSON.stringify(user) : 'N/A'));
                    await StackContext.getInstance().runPromise(
                        ServerExpressController.getInstance().getStackContextFromReq(req, session),
                        async () => {

                            await PushDataServerController.getInstance().unregisterSession(session);
                            session.destroy(() => {
                                ServerBase.getInstance().redirect_login_or_home(req, res);
                            });
                        });
                    return;
                }
                session.last_check_blocked_or_expired = Dates.now();

                PushDataServerController.getInstance().registerSession(session);

                // On stocke le log de connexion en base
                let user_log: UserLogVO = new UserLogVO();
                user_log.user_id = uid;
                user_log.log_time = Dates.now();
                user_log.impersonated = false;
                user_log.referer = req.headers.referer;
                user_log.log_type = UserLogVO.LOG_TYPE_CSRF_REQUEST;

                /**
                 * Gestion du impersonate
                 */
                user_log.handle_impersonation(session);

                await StackContext.getInstance().runPromise(
                    { IS_CLIENT: false },
                    async () => {
                        await ModuleDAO.getInstance().insertOrUpdateVO(user_log);
                    });
            }

            return res.json({ csrfToken: req.csrfToken() });
        });

        this.app.get('/login', (req, res) => {
            res.sendFile(path.resolve('./dist/login/public/generated/login.html'));
        });

        this.app.get('/logout', async (req, res) => {

            let err = await StackContext.getInstance().runPromise(
                ServerExpressController.getInstance().getStackContextFromReq(req, req.session),
                async () => await ModuleAccessPolicyServer.getInstance().logout()
            );

            // await ThreadHandler.getInstance().sleep(1000);
            // res.redirect('/');
        });

        this.app.use('/js', express.static('client/js'));
        this.app.use('/css', express.static('client/css'));
        this.app.use('/temp', express.static('temp'));
        this.app.use('/admin/temp', express.static('temp'));

        // reflect_headers
        this.app.get('/api/reflect_headers', (req, res) => {

            // ConsoleHandler.getInstance().log(JSON.stringify(req.headers));
            const result = JSON.stringify(req.headers);
            res.send(result);
        });
        this.app.get('/api/clientappcontrollerinit', async (req, res) => {
            const session = req.session;

            let user: UserVO = await StackContext.getInstance().runPromise(
                ServerExpressController.getInstance().getStackContextFromReq(req, session),
                async () => await ModuleAccessPolicyServer.getInstance().getSelfUser());

            res.json(JSON.stringify(
                {
                    data_version: ServerBase.getInstance().version,
                    data_user: user,
                    data_ui_debug: ServerBase.getInstance().uiDebug,
                    // data_base_api_url: "",
                    data_default_locale: ServerBase.getInstance().envParam.DEFAULT_LOCALE
                }
            ));
        });

        this.app.get('/api/adminappcontrollerinit', async (req, res) => {
            const session = req.session;

            let user: UserVO = await StackContext.getInstance().runPromise(
                ServerExpressController.getInstance().getStackContextFromReq(req, session),
                async () => await ModuleAccessPolicyServer.getInstance().getSelfUser());

            res.json(JSON.stringify(
                {
                    data_version: ServerBase.getInstance().version,
                    data_code_pays: ServerBase.getInstance().envParam.CODE_PAYS,
                    data_node_env: process.env.NODE_ENV,
                    data_user: user,
                    data_ui_debug: ServerBase.getInstance().uiDebug,
                    data_default_locale: ServerBase.getInstance().envParam.DEFAULT_LOCALE,
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
        //     res.json(ServerBase.getInstance().envParam.ISDEV);
        // });
        // // !JNE : Savoir si on est en DEV depuis la Vue.js client

        // Déclenchement du cron
        this.app.get('/cron', async (req: Request, res) => {

            /**
             * Cas particulier du cron qui est appelé directement par les taches planifiées et qui doit
             *  attendre la fin du démarrage du serveur et des childs threads pour lancer le broadcast
             */
            let timeout_sec: number = 30;
            while ((!ForkServerController.getInstance().forks_are_initialized) && (timeout_sec > 0)) {
                await ThreadHandler.getInstance().sleep(1000);
                timeout_sec--;
            }

            if (!ForkServerController.getInstance().forks_are_initialized) {
                ConsoleHandler.getInstance().error('CRON non lancé car le thread enfant n\'est pas disponible en 30 secondes.');
                res.send();
            } else {

                try {

                    await StackContext.getInstance().runPromise({ IS_CLIENT: false }, async () => await CronServerController.getInstance().executeWorkers());
                    res.json();
                } catch (err) {
                    ConsoleHandler.getInstance().error("error: " + (err.message || err));
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

        if (!!ConfigurationService.getInstance().node_configuration.ACTIVATE_LONG_JOHN) {
            require('longjohn');
        }

        process.on('uncaughtException', function (err) {
            ConsoleHandler.getInstance().error("Node nearly failed: " + err.stack);
        });

        ConsoleHandler.getInstance().log('listening on port: ' + ServerBase.getInstance().port);
        ServerBase.getInstance().db.one('SELECT 1')
            .then(async () => {
                ConsoleHandler.getInstance().log('connection to db successful');

                let server = require('http').Server(ServerBase.getInstance().app);
                let io = require('socket.io')(server);
                io.use(sharedsession(ServerBase.getInstance().session));

                server.listen(ServerBase.getInstance().port);
                // ServerBase.getInstance().app.listen(ServerBase.getInstance().port);

                // SocketIO
                // let io = socketIO.listen(ServerBase.getInstance().app);
                //turn off debug
                // io.set('log level', 1);
                // define interactions with client
                io.on('connection', function (socket: socketIO.Socket) {
                    let session: IServerUserSession = socket.handshake['session'];

                    if (!session) {
                        ConsoleHandler.getInstance().error('Impossible de charger la session dans SocketIO');
                        return;
                    }

                    PushDataServerController.getInstance().registerSocket(session, socket);
                }.bind(ServerBase.getInstance()));

                io.on('disconnect', function (socket: socketIO.Socket) {
                    let session: IServerUserSession = socket.handshake['session'];

                    PushDataServerController.getInstance().unregisterSocket(session, socket);
                });

                io.on('error', function (err) {
                    ConsoleHandler.getInstance().error("IO nearly failed: " + err.stack);
                });

                // ServerBase.getInstance().testNotifs();

                await ServerBase.getInstance().hook_on_ready();

                // //TODO DELETE TEST JNE
                // let fake_file: FileVO = new FileVO();
                // fake_file.file_access_policy_name = null;
                // fake_file.path = 'test.txt';
                // fake_file.is_secured = false;

                // await ModuleDAOServer.getInstance().insert_without_triggers_using_COPY([
                //     fake_file
                // ]);

                await ForkServerController.getInstance().fork_threads();
                BGThreadServerController.getInstance().server_ready = true;

                if (ConfigurationService.getInstance().node_configuration.AUTO_END_MAINTENANCE_ON_START) {
                    await ModuleMaintenance.getInstance().end_planned_maintenance();
                }

                ConsoleHandler.getInstance().log('Server ready to go !');
            })
            .catch((err) => {
                ConsoleHandler.getInstance().log('error while connecting to db: ' + (err.message || err));
            });

        // pgp.end();
    }

    /* istanbul ignore next: nothing to test here */
    protected async hook_on_ready() { }

    /* istanbul ignore next: nothing to test here */
    protected async hook_pwa_init() {
        let version = this.getVersion();

        this.app.get('/vuejsclient/public/pwa/client-sw.' + version + '.js', (req, res, next) => {
            res.header('Service-Worker-Allowed', '/');

            res.sendFile(path.resolve('./dist/vuejsclient/public/pwa/client-sw.' + version + '.js'));
        });

        this.app.get('/vuejsclient/public/pwa/login-sw.' + version + '.js', (req, res, next) => {
            res.header('Service-Worker-Allowed', '/');

            res.sendFile(path.resolve('./dist/vuejsclient/public/pwa/login-sw.' + version + '.js'));
        });
    }

    /* istanbul ignore next: hardly testable */
    protected handleError(promise, res) {
        promise.catch((err) => {
            ConsoleHandler.getInstance().error("error: " + (err.message || err));
            return res.status(500).send(err.message || err);
        });
    }

    /* istanbul ignore next: hardly testable */
    protected sendError(res, errormessage) {
        ConsoleHandler.getInstance().error("error: " + errormessage);
        return res.status(500).send(errormessage);
    }

    /* istanbul ignore next: nothing to test here */
    protected abstract initializeDataImports();
    /* istanbul ignore next: nothing to test here */
    protected abstract hook_configure_express();
    /* istanbul ignore next: nothing to test here */

    protected abstract getVersion();

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

    protected redirect_login_or_home(req: Request, res: Response, url: string = null) {
        if (!ModuleAccessPolicy.getInstance().getLoggedUserId()) {
            let fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
            res.redirect('/login#?redirect_to=' + encodeURIComponent(fullUrl));
            return;
        }
        res.redirect(url ? url : '/login');
        return;
    }

    protected check_session_validity(session: IServerUserSession): boolean {
        return true;
    }

    // protected terminus() {
    //     ConsoleHandler.getInstance().log('Server is starting cleanup');
    //     return Promise.all([
    //         VarsDatasVoUpdateHandler.getInstance().handle_buffer(null)
    //     ]);
    // }

    protected async exitHandler(options, exitCode, from) {
        ConsoleHandler.getInstance().log('Server is starting cleanup: ' + from);

        ConsoleHandler.getInstance().log(JSON.stringify(VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud']));
        await VarsDatasVoUpdateHandler.getInstance().force_empty_vars_datas_vo_update_cache();
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
}
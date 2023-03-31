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
import * as path from 'path';
import * as pg from 'pg';
import * as pg_promise from 'pg-promise';
import { IDatabase } from 'pg-promise';
import * as socketIO from 'socket.io';
import * as winston from 'winston';
import * as winston_daily_rotate_file from 'winston-daily-rotate-file';
import ModuleAccessPolicy from '../shared/modules/AccessPolicy/ModuleAccessPolicy';
import IServerUserSession from '../shared/modules/AccessPolicy/vos/IServerUserSession';
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
import ModuleImageFormat from '../shared/modules/ImageFormat/ModuleImageFormat';
import FormattedImageVO from '../shared/modules/ImageFormat/vos/FormattedImageVO';
import ImageFormatVO from '../shared/modules/ImageFormat/vos/ImageFormatVO';
import ModuleMaintenance from '../shared/modules/Maintenance/ModuleMaintenance';
import ModulesManager from '../shared/modules/ModulesManager';
import ModuleParams from '../shared/modules/Params/ModuleParams';
import ModulePushData from '../shared/modules/PushData/ModulePushData';
import ModuleTranslation from '../shared/modules/Translation/ModuleTranslation';
import ConsoleHandler from '../shared/tools/ConsoleHandler';
import EnvHandler from '../shared/tools/EnvHandler';
import LocaleManager from '../shared/tools/LocaleManager';
import ThreadHandler from '../shared/tools/ThreadHandler';
import ConfigurationService from './env/ConfigurationService';
import EnvParam from './env/EnvParam';
import FileLoggerHandler from './FileLoggerHandler';
import I18nextInit from './I18nextInit';
import AccessPolicyDeleteSessionBGThread from './modules/AccessPolicy/bgthreads/AccessPolicyDeleteSessionBGThread';
import ModuleAccessPolicyServer from './modules/AccessPolicy/ModuleAccessPolicyServer';
import BGThreadServerController from './modules/BGThread/BGThreadServerController';
import CronServerController from './modules/Cron/CronServerController';
import ExpressDBSessionsServerController from './modules/ExpressDBSessions/ExpressDBSessionsServerController';
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
        ConfigurationService.setEnvParams(this.STATIC_ENV_PARAMS);

        ConsoleHandler.init();
        FileLoggerHandler.getInstance().prepare().then(() => {
            ConsoleHandler.logger_handler = FileLoggerHandler.getInstance();
            ConsoleHandler.log("Main Process starting");
        }).catch((reason) => {
            ConsoleHandler.error("FileLogger prepare : " + reason);
        });

        // Les bgthreads peuvent être register mais pas run dans le process server principal. On le dédie à Express et aux APIs
        BGThreadServerController.getInstance().register_bgthreads = true;
        CronServerController.getInstance().register_crons = true;

        ModulesManager.getInstance().isServerSide = true;
        this.csrfProtection = csrf({ cookie: true });
    }

    /* istanbul ignore next: FIXME Don't want to test this file, but there are many things that should be externalized in smaller files and tested */
    public async initializeNodeServer() {

        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ServerExpressController:createMandatoryFolders:START');
        }
        await this.createMandatoryFolders();
        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ServerExpressController:createMandatoryFolders:END');
        }

        this.version = this.getVersion();

        this.envParam = ConfigurationService.node_configuration;

        EnvHandler.BASE_URL = this.envParam.BASE_URL;
        EnvHandler.NODE_VERBOSE = !!this.envParam.NODE_VERBOSE;
        EnvHandler.IS_DEV = !!this.envParam.ISDEV;
        EnvHandler.DEBUG_PROMISE_PIPELINE = !!this.envParam.DEBUG_PROMISE_PIPELINE;
        EnvHandler.MAX_POOL = this.envParam.MAX_POOL;
        EnvHandler.COMPRESS = !!this.envParam.COMPRESS;
        EnvHandler.CODE_GOOGLE_ANALYTICS = this.envParam.CODE_GOOGLE_ANALYTICS;
        EnvHandler.VERSION = this.version;
        EnvHandler.ACTIVATE_PWA = !!this.envParam.ACTIVATE_PWA;
        EnvHandler.ZOOM_AUTO = !!this.envParam.ZOOM_AUTO;
        EnvHandler.DEBUG_VARS = !!this.envParam.DEBUG_VARS;

        this.connectionString = this.envParam.CONNECTION_STRING;
        this.uiDebug = null; // JNE MODIF FLK process.env.UI_DEBUG;
        this.port = process.env.PORT ? process.env.PORT : this.envParam.PORT;

        // this.jwtSecret = 'This is the jwt secret for the rest part';

        let pgp: pg_promise.IMain = pg_promise({});
        this.db = pgp({
            connectionString: this.connectionString,
            max: this.envParam.MAX_POOL,
        });

        this.db.$pool.options.max = ConfigurationService.node_configuration.MAX_POOL;
        this.db.$pool.options.idleTimeoutMillis = 120000;

        let GM = this.modulesService;
        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ServerExpressController:register_all_modules:START');
        }
        await GM.register_all_modules(this.db);
        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ServerExpressController:register_all_modules:END');
        }

        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ServerExpressController:initializeDataImports:START');
        }
        await this.initializeDataImports();
        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ServerExpressController:initializeDataImports:END');
        }

        this.spawn = child_process.spawn;

        /* A voir l'intéret des différents routers this.app.use(apiRouter());
        this.app.use(config.IS_PRODUCTION ? staticsRouter() : staticsDevRouter());*/

        /*app.listen(config.SERVER_PORT, () => {
            ConsoleHandler.log(`App listening on port ${config.SERVER_PORT}!`);
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

        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ServerExpressController:express:START');
        }
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
        //         ConsoleHandler.error("[CLIENT]:" + err);
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
        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ServerExpressController:express:END');
        }

        this.hook_configure_express();

        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ServerExpressController:hook_pwa_init:START');
        }
        await this.hook_pwa_init();
        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ServerExpressController:hook_pwa_init:END');
        }

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

        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ServerExpressController:registerApis:START');
        }
        this.registerApis(this.app);
        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ServerExpressController:registerApis:END');
        }

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
            store: ExpressDBSessionsServerController.getInstance({
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
                    await StackContext.runPromise(
                        { IS_CLIENT: false },
                        async () => {
                            user = await query(UserVO.API_TYPE_ID).filter_by_id(session.uid).select_vo<UserVO>();
                        });

                    if ((!user) || user.blocked || user.invalidated) {

                        await ConsoleHandler.warn('unregisterSession:last_check_blocked_or_expired:UID:' + session.uid + ':user:' + (user ? JSON.stringify(user) : 'N/A'));
                        await StackContext.runPromise(
                            await ServerExpressController.getInstance().getStackContextFromReq(req, session),
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

                    await StackContext.runPromise(
                        await ServerExpressController.getInstance().getStackContextFromReq(req, session),
                        async () => await MaintenanceServerController.getInstance().inform_user_on_request(session.uid));
                }

                if (!!EnvHandler.NODE_VERBOSE) {
                    ConsoleHandler.log('REQUETE: ' + req.url + ' | USER ID: ' + session.uid + ' | BODY: ' + JSON.stringify(req.body));
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

            // Génération à la volée des images en fonction du format demandé
            if (req.url.indexOf(ModuleImageFormat.RESIZABLE_IMGS_PATH_BASE.replace('./', '/')) == 0) {
                let matches: string[] = req.url.match('(' + ModuleImageFormat.RESIZABLE_IMGS_PATH_BASE.replace('./', '/') + ')([^/]+)/(.*)');

                if (!matches || !matches.length) {
                    return res.status(404).send('Not matches');
                }

                let format_name: string = matches[2];
                let file_path: string = decodeURI(matches[3]);

                if (fs.existsSync(decodeURI(req.url)) || !format_name || !file_path) {
                    // Le fichier existe, on le renvoie directement
                    return res.sendFile(path.resolve(decodeURI(req.url)));
                }

                let base_filepath: string = ModuleFile.FILES_ROOT + file_path;

                // On vérifie que le fichier de base existe pour appliquer le format dessus
                if (!fs.existsSync(base_filepath)) {
                    // Le fichier n'existe pas, donc 404
                    return res.status(404).send('Not found : ' + base_filepath);
                }

                let format: ImageFormatVO = await query(ImageFormatVO.API_TYPE_ID)
                    .filter_by_text_eq('name', format_name, ImageFormatVO.API_TYPE_ID, true)
                    .select_vo<ImageFormatVO>();

                if (!format) {
                    // Pas de format
                    return res.status(404).send('Pas de format : ' + format_name);
                }

                let formatted_image: FormattedImageVO = await ModuleImageFormat.getInstance().get_formatted_image(
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

            await StackContext.runPromise(
                await ServerExpressController.getInstance().getStackContextFromReq(req, session),
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

        // On préload les droits / users / groupes / deps pour accélérer le démarrage
        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ServerExpressController:preload_access_rights:START');
        }
        await ModuleAccessPolicyServer.getInstance().preload_access_rights();
        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ServerExpressController:preload_access_rights:END');
        }

        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ServerExpressController:configure_server_modules:START');
        }
        await this.modulesService.configure_server_modules(this.app);
        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ServerExpressController:configure_server_modules:END');
        }

        // A ce stade on a chargé toutes les trads par défaut possible et immaginables
        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ServerExpressController:saveDefaultTranslations:START');
        }
        await DefaultTranslationsServerManager.getInstance().saveDefaultTranslations();
        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ServerExpressController:saveDefaultTranslations:END');
        }

        // Derniers chargements
        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ServerExpressController:late_server_modules_configurations:START');
        }
        await this.modulesService.late_server_modules_configurations();
        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ServerExpressController:late_server_modules_configurations:END');
        }

        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ServerExpressController:i18nextInit:getALL_LOCALES:START');
        }
        // Avant de supprimer i18next... on corrige pour que ça fonctionne coté serveur aussi les locales
        let locales = await ModuleTranslation.getInstance().getALL_LOCALES();
        let locales_corrected = {};
        for (let lang in locales) {
            if (lang && lang.indexOf('-') >= 0) {
                let lang_parts = lang.split('-');
                if (lang_parts.length == 2) {
                    locales_corrected[lang_parts[0] + '-' + lang_parts[1].toUpperCase()] = locales[lang];
                }
            }
        }
        let i18nextInit = I18nextInit.getInstance(locales_corrected);
        LocaleManager.getInstance().i18n = i18nextInit.i18next;
        this.app.use(i18nextInit.i18nextMiddleware.handle(i18nextInit.i18next, {
            ignoreRoutes: ["/public"]
        }));
        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ServerExpressController:i18nextInit:getALL_LOCALES:END');
        }

        this.app.get('/', async (req: Request, res: Response) => {

            let session: IServerUserSession = req.session as IServerUserSession;

            // On va regarder si la personne essaye d'y accéder en direct
            // Si c'est le cas, on considère que la personne peut ne pas avoir accès et donc sa session ne sera pas supprimée
            let can_fail: boolean = true;

            if (req && req.headers && req.headers.referer) {
                can_fail = false;
            }

            let has_access: boolean = await StackContext.runPromise(
                await ServerExpressController.getInstance().getStackContextFromReq(req, session),
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

            let has_access: boolean = await StackContext.runPromise(
                await ServerExpressController.getInstance().getStackContextFromReq(req, session),
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
                await StackContext.runPromise(
                    await ServerExpressController.getInstance().getStackContextFromReq(req, session),
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
                await StackContext.runPromise(
                    { IS_CLIENT: false },
                    async () => {
                        user = await query(UserVO.API_TYPE_ID).filter_by_id(session.uid).select_vo<UserVO>();
                    });
                if ((!user) || user.blocked || user.invalidated) {

                    await ConsoleHandler.warn('unregisterSession:getcsrftoken:UID:' + session.uid + ':user:' + (user ? JSON.stringify(user) : 'N/A'));
                    await StackContext.runPromise(
                        await ServerExpressController.getInstance().getStackContextFromReq(req, session),
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

                await StackContext.runPromise(
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

            let err = await StackContext.runPromise(
                await ServerExpressController.getInstance().getStackContextFromReq(req, req.session),
                async () => await ModuleAccessPolicyServer.getInstance().logout()
            );

            // await ThreadHandler.sleep(1000);
            // res.redirect('/');

            let PARAM_TECH_DISCONNECT_URL: string = await ModuleParams.getInstance().getParamValueAsString(ModulePushData.PARAM_TECH_DISCONNECT_URL);
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

            let user: UserVO = await StackContext.runPromise(
                await ServerExpressController.getInstance().getStackContextFromReq(req, session),
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

            let user: UserVO = await StackContext.runPromise(
                await ServerExpressController.getInstance().getStackContextFromReq(req, session),
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
                await ThreadHandler.sleep(1000);
                timeout_sec--;
            }

            if (!ForkServerController.getInstance().forks_are_initialized) {
                ConsoleHandler.error('CRON non lancé car le thread enfant n\'est pas disponible en 30 secondes.');
                res.send();
            } else {

                try {

                    await StackContext.runPromise({ IS_CLIENT: false }, async () => await CronServerController.getInstance().executeWorkers());
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

        if (!!ConfigurationService.node_configuration.ACTIVATE_LONG_JOHN) {
            require('longjohn');
        }

        process.on('uncaughtException', function (err) {
            ConsoleHandler.error("Node nearly failed: " + err.stack);
        });

        ConsoleHandler.log('listening on port: ' + ServerBase.getInstance().port);
        ServerBase.getInstance().db.one('SELECT 1')
            .then(async () => {
                ConsoleHandler.log('connection to db successful');

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
                        ConsoleHandler.error('Impossible de charger la session dans SocketIO');
                        return;
                    }

                    PushDataServerController.getInstance().registerSocket(session, socket);
                }.bind(ServerBase.getInstance()));

                io.on('disconnect', function (socket: socketIO.Socket) {
                    let session: IServerUserSession = socket.handshake['session'];

                    PushDataServerController.getInstance().unregisterSocket(session, socket);
                });

                io.on('error', function (err) {
                    ConsoleHandler.error("IO nearly failed: " + err.stack);
                });

                // ServerBase.getInstance().testNotifs();

                if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
                    ConsoleHandler.log('ServerExpressController:hook_on_ready:START');
                }
                await ServerBase.getInstance().hook_on_ready();
                if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
                    ConsoleHandler.log('ServerExpressController:hook_on_ready:END');
                }

                // //TODO DELETE TEST JNE
                // let fake_file: FileVO = new FileVO();
                // fake_file.file_access_policy_name = null;
                // fake_file.path = 'test.txt';
                // fake_file.is_secured = false;

                // await ModuleDAOServer.getInstance().insert_without_triggers_using_COPY([
                //     fake_file
                // ]);

                if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
                    ConsoleHandler.log('ServerExpressController:fork_threads:START');
                }
                await ForkServerController.getInstance().fork_threads();
                if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
                    ConsoleHandler.log('ServerExpressController:fork_threads:END');
                }
                BGThreadServerController.getInstance().server_ready = true;

                if (ConfigurationService.node_configuration.AUTO_END_MAINTENANCE_ON_START) {
                    await ModuleMaintenance.getInstance().end_planned_maintenance();
                }

                ConsoleHandler.log('Server ready to go !');
            })
            .catch((err) => {
                ConsoleHandler.log('error while connecting to db: ' + (err.message || err));
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
    //     ConsoleHandler.log('Server is starting cleanup');
    //     return all_promises([
    //         VarsDatasVoUpdateHandler.getInstance().handle_buffer(null)
    //     ]);
    // }

    protected async exitHandler(options, exitCode, from) {
        ConsoleHandler.log('Server is starting cleanup: ' + from);

        ConsoleHandler.log(JSON.stringify(VarsDatasVoUpdateHandler.getInstance()['ordered_vos_cud']));
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
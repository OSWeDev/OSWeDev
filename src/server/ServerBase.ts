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
import * as moment from 'moment';
import * as msgpackResponse from 'msgpack-response';
import * as path from 'path';
import * as pg from 'pg';
import * as pg_promise from 'pg-promise';
import { IDatabase } from 'pg-promise';
import * as sessionFileStore from 'session-file-store';
import * as socketIO from 'socket.io';
import * as winston from 'winston';
import * as winston_daily_rotate_file from 'winston-daily-rotate-file';
import ModuleAccessPolicy from '../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserLogVO from '../shared/modules/AccessPolicy/vos/UserLogVO';
import UserVO from '../shared/modules/AccessPolicy/vos/UserVO';
import ModuleAjaxCache from '../shared/modules/AjaxCache/ModuleAjaxCache';
import ModuleAPI from '../shared/modules/API/ModuleAPI';
import ModuleCommerce from '../shared/modules/Commerce/ModuleCommerce';
import ModuleDAO from '../shared/modules/DAO/ModuleDAO';
import ModuleFile from '../shared/modules/File/ModuleFile';
import FileVO from '../shared/modules/File/vos/FileVO';
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
import ModuleAccessPolicyServer from './modules/AccessPolicy/ModuleAccessPolicyServer';
import ServerAPIController from './modules/API/ServerAPIController';
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
import ServerExpressController from './ServerExpressController';
import StackContext from './StackContext';
import { createTerminus } from '@godaddy/terminus';
import VarsDatasVoUpdateHandler from './modules/Var/VarsDatasVoUpdateHandler';
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
        ConfigurationService.getInstance().setEnvParams(this.STATIC_ENV_PARAMS);

        FileLoggerHandler.getInstance().prepare().then(() => {
            ConsoleHandler.getInstance().logger_handler = FileLoggerHandler.getInstance();
            ConsoleHandler.getInstance().log("Main Process starting");
        });

        // Les bgthreads peuvent être register mais pas run dans le process server principal. On le dédie à Express et aux APIs
        BGThreadServerController.getInstance().register_bgthreads = true;
        CronServerController.getInstance().register_crons = true;

        // On initialise le Controller pour les APIs
        ModuleAPI.getInstance().setAPIController(ServerAPIController.getInstance());

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

        this.envParam = ConfigurationService.getInstance().getNodeConfiguration();
        EnvHandler.getInstance().BASE_URL = this.envParam.BASE_URL;
        EnvHandler.getInstance().NODE_VERBOSE = !!this.envParam.NODE_VERBOSE;
        EnvHandler.getInstance().IS_DEV = !!this.envParam.ISDEV;
        EnvHandler.getInstance().MSGPCK = !!this.envParam.MSGPCK;
        EnvHandler.getInstance().COMPRESS = !!this.envParam.COMPRESS;
        this.version = this.getVersion();

        this.connectionString = this.envParam.CONNECTION_STRING;
        this.uiDebug = null; // JNE MODIF FLK process.env.UI_DEBUG;
        this.port = process.env.PORT ? process.env.PORT : this.envParam.PORT;

        // this.jwtSecret = 'This is the jwt secret for the rest part';

        let pgp: pg_promise.IMain = pg_promise({});
        this.db = pgp(this.connectionString);

        this.db.$pool.options.max = this.envParam.MAX_POOL;

        let GM = this.modulesService;
        await GM.register_all_modules(this.db);

        await this.initializeDataImports();

        const FileStore = sessionFileStore(expressSession);
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
        //   i18nextMiddleware.addRoute(i18next, '/:lng/key-to-translate', ['fr', 'de', 'es'], app, 'get',
        //     function(req, res) {
        //       // endpoint function
        //     })
        //   }*/
        // );

        this.app = express();

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
                if (req.headers['content-type'] == ModuleAjaxCache.MSGPACK_REQUEST_TYPE) {
                    return true;
                }

                // fallback to standard filter function
                return compression.filter(req, res);
            };
            this.app.use(compression({ filter: shouldCompress }));
        }

        this.app.use(createLocaleMiddleware({
            priority: ["accept-language", "default"],
            default: "fr_FR"
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


        this.session = expressSession({
            secret: 'vk4s8dq2j4',
            name: 'sid',
            proxy: true,
            resave: false,
            saveUninitialized: false,
            store: new FileStore(),
            cookie: {
                // httpOnly: !ConfigurationService.getInstance().getNodeConfiguration().ISDEV,
                // secure: !ConfigurationService.getInstance().getNodeConfiguration().ISDEV,
                maxAge: Date.now() + (30 * 86400 * 1000)
            }
        });
        this.app.use(this.session);

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
                    session.creation_date_unix = moment().utc(true).unix();
                } else {
                    // old session - on check qu'on doit pas invalider
                    if (!this.check_session_validity(session)) {
                        session.destroy(() => {
                            PushDataServerController.getInstance().unregisterSession(session);
                            this.redirect_login_or_home(req, res);
                        });
                        return;
                    }
                }
            }

            if (session && session.uid) {

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
                    file = await ModuleDAOServer.getInstance().selectOne<FileVO>(FileVO.API_TYPE_ID, " where is_secured and path = $1;", [ModuleFile.SECURED_FILES_ROOT + folders + file_name]);
                    has_access = (file && file.file_access_policy_name) ? await ModuleAccessPolicy.getInstance().checkAccess(file.file_access_policy_name) : false;
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

        let i18nextInit = I18nextInit.getInstance(await ModuleTranslation.getInstance().getALL_LOCALES());
        this.app.use(i18nextInit.i18nextMiddleware.handle(i18nextInit.i18next, {
            ignoreRoutes: ["/public"]
        }));

        this.app.get('/', async (req: Request, res: Response) => {

            let session: IServerUserSession = req.session as IServerUserSession;

            let has_access: boolean = await StackContext.getInstance().runPromise(
                ServerExpressController.getInstance().getStackContextFromReq(req, session),
                async () => await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_FO_ACCESS));

            if (!has_access) {
                ServerBase.getInstance().redirect_login_or_home(req, res);
                return;
            }

            res.sendFile(path.resolve('./dist/client/public/generated/index.html'));
        });

        this.app.get('/admin', async (req: Request, res) => {

            let session: IServerUserSession = req.session as IServerUserSession;

            let has_access: boolean = await StackContext.getInstance().runPromise(
                ServerExpressController.getInstance().getStackContextFromReq(req, session),
                async () => await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_BO_ACCESS));

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
                        has_access = await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS) && await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_ACCESS);
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

                session.last_load_date_unix = moment().utc(true).unix();
            }

            if (session && session.uid) {
                let uid: number = session.uid;

                PushDataServerController.getInstance().registerSession(session);

                // On stocke le log de connexion en base
                let user_log: UserLogVO = new UserLogVO();
                user_log.user_id = uid;
                user_log.log_time = moment().utc(true);
                user_log.impersonated = false;
                user_log.referer = req.headers.referer;
                user_log.log_type = UserLogVO.LOG_TYPE_CSRF_REQUEST;

                /**
                 * Gestion du impersonate
                 */
                if (!!session.impersonated_from) {

                    let imp_uid: number = session.impersonated_from.uid;
                    user_log.impersonated = true;
                    user_log.comment = 'Impersonated from user_id [' + imp_uid + ']';
                }

                await StackContext.getInstance().runPromise(
                    ServerExpressController.getInstance().getStackContextFromReq(req, session),
                    async () => await ModuleDAO.getInstance().insertOrUpdateVO(user_log));
            }

            return res.json({ csrfToken: req.csrfToken() });
        });

        this.app.get('/login', (req, res) => {
            res.sendFile(path.resolve('./dist/login/public/generated/login.html'));
        });

        this.app.get('/logout', async (req, res) => {

            let user_log = null;

            if (req && req.session && req.session.uid) {
                let uid: number = req.session.uid;

                // On stocke le log de connexion en base
                user_log = new UserLogVO();
                user_log.user_id = uid;
                user_log.impersonated = false;
                user_log.log_time = moment().utc(true);
                user_log.referer = req.headers.referer;
                user_log.log_type = UserLogVO.LOG_TYPE_LOGOUT;

                await StackContext.getInstance().runPromise(
                    ServerExpressController.getInstance().getStackContextFromReq(req, req.session),
                    async () => await ModuleDAO.getInstance().insertOrUpdateVO(user_log));
            }

            /**
             * Gestion du impersonate => on restaure la session précédente
             */
            if (req.session && !!req.session.impersonated_from) {
                PushDataServerController.getInstance().unregisterSession(req.session);

                req.session = Object.assign(req.session, req.session.impersonated_from);
                delete req.session.impersonated_from;

                let uid: number = req.session.uid;
                user_log.impersonated = true;
                user_log.comment = 'Impersonated from user_id [' + uid + ']';

                req.session.save((err) => {
                    if (err) {
                        ConsoleHandler.getInstance().log(err);
                    } else {
                        res.redirect('/');
                    }
                });
            } else {

                req.session.destroy((err) => {
                    PushDataServerController.getInstance().unregisterSession(req.session);

                    if (err) {
                        ConsoleHandler.getInstance().log(err);
                    } else {
                        res.redirect('/');
                    }
                });
            }
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

        if (!!ConfigurationService.getInstance().getNodeConfiguration().ACTIVATE_LONG_JOHN) {
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

                ForkServerController.getInstance().fork_threads();
                BGThreadServerController.getInstance().server_ready = true;

                ConsoleHandler.getInstance().log('Server ready to go !');
            })
            .catch((err) => {
                ConsoleHandler.getInstance().log('error while connecting to db: ' + (err.message || err));
            });

        // pgp.end();
    }

    /* istanbul ignore next: nothing to test here */
    protected async hook_on_ready() { }

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

    protected terminus() {
        ConsoleHandler.getInstance().log('Server is starting cleanup');
        return Promise.all([
            VarsDatasVoUpdateHandler.getInstance().handle_buffer(null)
        ]);
    }
}
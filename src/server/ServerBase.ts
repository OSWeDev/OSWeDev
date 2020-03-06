import moment = require('moment');
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
import * as sessionFileStore from 'session-file-store';
import * as socketIO from 'socket.io';
import * as winston from 'winston';
import * as winston_daily_rotate_file from 'winston-daily-rotate-file';
import ModuleAccessPolicy from '../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserLogVO from '../shared/modules/AccessPolicy/vos/UserLogVO';
import ModuleAjaxCache from '../shared/modules/AjaxCache/ModuleAjaxCache';
import ModuleCommerce from '../shared/modules/Commerce/ModuleCommerce';
import ModuleDAO from '../shared/modules/DAO/ModuleDAO';
import ModuleFile from '../shared/modules/File/ModuleFile';
import ModulesManager from '../shared/modules/ModulesManager';
import ModuleTranslation from '../shared/modules/Translation/ModuleTranslation';
import ConsoleHandler from '../shared/tools/ConsoleHandler';
import EnvHandler from '../shared/tools/EnvHandler';
import ConfigurationService from './env/ConfigurationService';
import EnvParam from './env/EnvParam';
import I18nextInit from './I18nextInit';
import ModuleAccessPolicyServer from './modules/AccessPolicy/ModuleAccessPolicyServer';
import ModuleCronServer from './modules/Cron/ModuleCronServer';
import ModuleFileServer from './modules/File/ModuleFileServer';
import ModuleMaintenanceServer from './modules/Maintenance/ModuleMaintenanceServer';
import ModuleServiceBase from './modules/ModuleServiceBase';
import ModulePushDataServer from './modules/PushData/ModulePushDataServer';
import DefaultTranslationsServerManager from './modules/Translation/DefaultTranslationsServerManager';
import VarsdatasComputerBGThread from './modules/Var/bgthreads/VarsdatasComputerBGThread';
require('moment-json-parser').overrideDefault();

export default abstract class ServerBase {

    public static getInstance(): ServerBase {
        return ServerBase.instance;
    }

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

    protected constructor(modulesService: ModuleServiceBase, STATIC_ENV_PARAMS: { [env: string]: EnvParam }) {
        ServerBase.instance = this;
        this.modulesService = modulesService;
        this.STATIC_ENV_PARAMS = STATIC_ENV_PARAMS;
        ConfigurationService.getInstance().setEnvParams(this.STATIC_ENV_PARAMS);
        ModulesManager.getInstance().isServerSide = true;
        this.csrfProtection = csrf({ cookie: true });
    }

    public abstract getHttpContext();

    public async initializeNodeServer() {

        await this.createMandatoryFolders();

        this.envParam = ConfigurationService.getInstance().getNodeConfiguration();
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
        let httpContext = ServerBase.getInstance().getHttpContext();

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

        this.app.use('/public', express.static('src/client/public'));
        this.app.use('/admin/public', express.static('src/admin/public'));
        this.app.use('/login/public', express.static('src/login/public'));

        // Le service de push
        this.app.get('/sw_push.js', (req, res, next) => {
            res.sendFile(path.resolve('./src/vuejsclient/public/sw_push.js'));
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


        // Faille de sécu ? à voir si il manque quelque chose, normalement avec les droits par table directement on devrait être clean...
        // this.app.use((req, res, next) => {
        //     const session = req.session;
        //     const publicPrefix = "/public/";
        //     const isPublic = req.path.substring(0, publicPrefix.length) == publicPrefix;
        //     if (req.method == "OPTIONS" || req.path == "/login" || req.path == "/recover" || req.path == "/cron" || req.path == "/reset" || req.path == "/logout" || isPublic || session.user) {
        //         next();
        //     } else {
        //         if (req.path.indexOf("/api") == 0) {
        //             return res.sendStatus(401);
        //         } else {
        //             res.redirect('/login?redirect_to=' + encodeURIComponent(req.originalUrl));
        //         }
        //     }
        // });

        this.app.use('/admin/js', express.static('src/admin/public/js'));

        this.app.use(express.json({ limit: '150mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '150mb' }));

        this.app.use(httpContext.middleware);


        // Example authorization middleware
        this.app.use(async (req, res, next) => {

            httpContext.set('IS_CLIENT', true);
            httpContext.set('REFERER', req.headers.referer);

            if (req && req.session && req.session.user && req.session.user.id) {
                let uid: number = parseInt(req.session.user.id.toString());
                httpContext.set('UID', uid);
                httpContext.set('SESSION', req.session);
                httpContext.set('USER', req.session.user);
                httpContext.set('USER_DATA', await ServerBase.getInstance().getUserData(uid));

                if (ModuleMaintenanceServer.getInstance().has_planned_maintenance) {
                    ModuleMaintenanceServer.getInstance().inform_user_on_request(req.session.user.id);
                }

                if (!!EnvHandler.getInstance().NODE_VERBOSE) {
                    ConsoleHandler.getInstance().log('REQUETE: ' + req.url + ' | USER: ' + req.session.user.name + ' | BODY: ' + JSON.stringify(req.body));
                }
            } else {
                httpContext.set('UID', null);
                httpContext.set('SESSION', req ? req.session : null);
                httpContext.set('USER', null);
                httpContext.set('USER_DATA', null);
            }

            next();
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

        this.app.get('/', async (req, res) => {

            if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_FO_ACCESS)) {
                if (!await ModuleAccessPolicy.getInstance().getLoggedUser()) {
                    let fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                    res.redirect('/login#?redirect_to=' + encodeURIComponent(fullUrl));
                    return;
                }
                res.redirect('/login');
                return;
            }
            res.sendFile(path.resolve('./src/client/public/generated/index.html'));
        });

        this.app.get('/admin', async (req: Request, res) => {

            if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_BO_ACCESS)) {

                if (!await ModuleAccessPolicy.getInstance().getLoggedUser()) {
                    let fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                    res.redirect('/login#?redirect_to=' + encodeURIComponent(fullUrl));
                    return;
                }
                res.redirect('/');
                return;
            }
            res.sendFile(path.resolve('./src/admin/public/generated/admin.html'));
        });

        // Accès aux logs iisnode
        this.app.get('/iisnode/:file_name', async (req: Request, res) => {

            let file_name = req.params.file_name;

            if ((!file_name)
                || (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS))
                || (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_ACCESS))) {

                if (!await ModuleAccessPolicy.getInstance().getLoggedUser()) {
                    let fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                    res.redirect('/login#?redirect_to=' + encodeURIComponent(fullUrl));
                    return;
                }
                res.redirect('/');
                return;
            }
            res.sendFile(path.resolve('./iisnode/' + file_name));
        });

        this.app.set('views', 'src/client/views');

        // Send CSRF token for session
        this.app.get('/api/getcsrftoken', ServerBase.getInstance().csrfProtection, function (req, res) {

            if (req && req.session && req.session.user && req.session.user.id) {
                let uid: number = parseInt(req.session.user.id.toString());

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
                if (req.session && !!req.session.impersonated_from) {

                    let imp_uid: number = parseInt(req.session.impersonated_from.user.id.toString());
                    user_log.impersonated = true;
                    user_log.comment = 'Impersonated from user_id [' + imp_uid + ']';
                }

                ModuleDAO.getInstance().insertOrUpdateVO(user_log);
            }

            return res.json({ csrfToken: req.csrfToken() });
        });

        this.app.get('/login', (req, res) => {
            res.sendFile(path.resolve('./src/login/public/generated/login.html'));
        });

        this.app.get('/logout', async (req, res) => {

            let user_log = null;

            if (req && req.session && req.session.user && req.session.user.id) {
                let uid: number = parseInt(req.session.user.id.toString());

                // On stocke le log de connexion en base
                user_log = new UserLogVO();
                user_log.user_id = uid;
                user_log.impersonated = false;
                user_log.log_time = moment().utc(true);
                user_log.referer = req.headers.referer;
                user_log.log_type = UserLogVO.LOG_TYPE_LOGOUT;
            }

            /**
             * Gestion du impersonate => on restaure la session précédente
             */
            if (req.session && !!req.session.impersonated_from) {
                req.session = Object.assign(req.session, req.session.impersonated_from);
                delete req.session.impersonated_from;

                let uid: number = parseInt(req.session.user.id.toString());
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
                    if (err) {
                        ConsoleHandler.getInstance().log(err);
                    } else {
                        res.redirect('/');
                    }
                });
            }

            if (!!user_log) {

                // On await pas ici on se fiche du résultat
                ModuleDAO.getInstance().insertOrUpdateVO(user_log);
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

            res.json(JSON.stringify(
                {
                    data_version: ServerBase.getInstance().version,
                    data_user: (!!session.user) ? session.user : null,
                    data_ui_debug: ServerBase.getInstance().uiDebug,
                    // data_base_api_url: "",
                    data_default_locale: ServerBase.getInstance().envParam.DEFAULT_LOCALE
                }
            ));
        });

        this.app.get('/api/adminappcontrollerinit', async (req, res) => {
            const session = req.session;

            res.json(JSON.stringify(
                {
                    data_version: ServerBase.getInstance().version,
                    data_code_pays: ServerBase.getInstance().envParam.CODE_PAYS,
                    data_node_env: process.env.NODE_ENV,
                    data_user: (!!session.user) ? session.user : null,
                    data_ui_debug: ServerBase.getInstance().uiDebug,
                    data_default_locale: ServerBase.getInstance().envParam.DEFAULT_LOCALE,
                }
            ));
        });

        // L'API qui renvoie les infos pour générer l'interface NGA pour les modules (activation / désactivation des modules et les paramètres de chaque module)
        this.app.get('/api/modules_nga_fields_infos/:env', (req, res) => {

            // On envoie en fait un fichier JS... Pour avoir un chargement des modules synchrone côté client en intégrant juste un fichier js.
            res.send('GM_Modules = ' + JSON.stringify(GM.get_modules_infos(req.params.env)) + ';');
        });

        // // JNE : Savoir si on est en DEV depuis la Vue.js client
        // this.app.get('/api/isdev', (req, res) => {
        //     res.json(ServerBase.getInstance().envParam.ISDEV);
        // });
        // // !JNE : Savoir si on est en DEV depuis la Vue.js client

        // Déclenchement du cron
        this.app.get('/cron', (req: Request, res) => {
            // Sinon la gestion des droits intervient et empêche de retrouver le compte et les trads ...
            httpContext.set('IS_CLIENT', false);

            return ServerBase.getInstance().handleError(ModuleCronServer.getInstance().executeWorkers().then(() => {
                res.json();
            }), res);
        });

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
                    let session: Express.Session = socket.handshake['session'];

                    if (!session) {
                        ConsoleHandler.getInstance().error('Impossible de charger la session dans SocketIO');
                        return;
                    }

                    ModulePushDataServer.getInstance().registerSocket(session.user ? session.user.id : null, session.id, socket);
                }.bind(ServerBase.getInstance()));

                io.on('error', function (err) {
                    ConsoleHandler.getInstance().error("IO nearly failed: " + err.stack);
                });

                // ServerBase.getInstance().testNotifs();

                await ServerBase.getInstance().hook_on_ready();

                VarsdatasComputerBGThread.getInstance().server_ready = true;
                ConsoleHandler.getInstance().log('Server ready to go !');
            })
            .catch((err) => {
                ConsoleHandler.getInstance().log('error while connecting to db: ' + (err.message || err));
            });

        // pgp.end();
    }

    protected async hook_on_ready() { }

    protected handleError(promise, res) {
        promise.catch((err) => {
            ConsoleHandler.getInstance().error("error: " + (err.message || err));
            return res.status(500).send(err.message || err);
        });
    }

    protected sendError(res, errormessage) {
        ConsoleHandler.getInstance().error("error: " + errormessage);
        return res.status(500).send(errormessage);
    }

    protected abstract initializeDataImports();
    protected abstract hook_configure_express();
    protected abstract getVersion();

    protected async getUserData(uid: number) {
        return null;
    }

    protected registerApis(app) {
    }

    /**
     * On s'assure de la création des dossiers nécessaires au bon fonctionnement de l'application
     */
    protected async createMandatoryFolders() {
        await ModuleFileServer.getInstance().makeSureThisFolderExists('./temp');
        await ModuleFileServer.getInstance().makeSureThisFolderExists('./files');
        await ModuleFileServer.getInstance().makeSureThisFolderExists('./files/upload');
        await ModuleFileServer.getInstance().makeSureThisFolderExists('./logs');
    }
}
import * as helmet from 'helmet';
// import * as csurf from 'csrf';
// import * as cookieParser from 'cookie-parser';
import * as child_process from 'child_process';
import * as compression from 'compression';
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
import * as sessionFileStore from 'session-file-store';
// import * as webpush from 'web-push';
import * as socketIO from 'socket.io';
import * as winston from 'winston';
import * as winston_daily_rotate_file from 'winston-daily-rotate-file';
import ModuleAccessPolicy from '../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleCommerce from '../shared/modules/Commerce/ModuleCommerce';
import ModuleFile from '../shared/modules/File/ModuleFile';
import ModulesManager from '../shared/modules/ModulesManager';
import ModuleTranslation from '../shared/modules/Translation/ModuleTranslation';
import LangVO from '../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../shared/modules/Translation/vos/TranslationVO';
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

require('moment-json-parser').overrideDefault();
// require('helmet');

export default abstract class ServerBase {

    public static getInstance(): ServerBase {
        return ServerBase.instance;
    }

    protected static instance: ServerBase = null;

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
    }

    public abstract getHttpContext();

    public async initializeNodeServer() {

        await this.createMandatoryFolders();

        this.envParam = ConfigurationService.getInstance().getNodeConfiguration();
        this.version = this.getVersion();

        this.connectionString = this.envParam.CONNECTION_STRING;
        this.uiDebug = null; // JNE MODIF FLK process.env.UI_DEBUG;
        this.port = process.env.PORT ? process.env.PORT : this.envParam.PORT;

        // this.jwtSecret = 'This is the jwt secret for the rest part';

        let pgp: pg_promise.IMain = pg_promise({});
        this.db = pgp(this.connectionString);

        let GM = this.modulesService;
        await GM.register_all_modules(this.db);

        await this.initializeDataImports();

        const FileStore = sessionFileStore(expressSession);
        this.spawn = child_process.spawn;

        /* A voir l'intéret des différents routers this.app.use(apiRouter());
        this.app.use(config.IS_PRODUCTION ? staticsRouter() : staticsDevRouter());*/

        /*app.listen(config.SERVER_PORT, () => {
            console.log(`App listening on port ${config.SERVER_PORT}!`);
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
            this.app.use(compression());
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
        //         console.error("[CLIENT]:" + err);
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

            if (req && req.session && req.session.user && req.session.user.id) {
                let uid: number = parseInt(req.session.user.id.toString());
                httpContext.set('UID', uid);
                httpContext.set('SESSION', req.session);
                httpContext.set('USER', req.session.user);
                httpContext.set('USER_DATA', await ServerBase.getInstance().getUserData(uid));

                if (ModuleMaintenanceServer.getInstance().has_planned_maintenance) {
                    ModuleMaintenanceServer.getInstance().inform_user_on_request(req.session.user.id);
                }

                // On log en PROD
                if (!ServerBase.getInstance().envParam.ISDEV) {
                    console.log('REQUETE: ' + req.url + ' | USER: ' + req.session.user.name + ' | BODY: ' + JSON.stringify(req.body));
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

        this.app.set('view engine', 'jade');
        this.app.set('views', 'src/client/views');

        this.app.get('/login', (req, res) => {
            res.sendFile(path.resolve('./src/login/public/generated/login.html'));
        });

        this.app.get('/recover', (req, res) => {
            res.render('recover.jade');
        });

        this.app.get('/reset', (req, res) => {
            res.render('reset.jade');
        });


        this.app.post('/recover', async (req, res) => {
            const session = req.session;

            // Sinon la gestion des droits intervient et empêche de retrouver le compte et les trads ...
            httpContext.set('IS_CLIENT', false);

            const email = req.body.email;
            let code_lang = (req['locale'] && (typeof req['locale'] == "string")) ? req['locale'].substr(0, 2) : ServerBase.getInstance().envParam.DEFAULT_LOCALE;
            let translation: TranslationVO;

            if (email && (email != "")) {

                await ModuleAccessPolicy.getInstance().beginRecover(email);
                let langs: LangVO[] = await ModuleTranslation.getInstance().getLangs();
                let langObj: LangVO = langs[0];

                for (let i in langs) {
                    let lang = langs[i];

                    if (lang.code_lang == code_lang) {
                        langObj = lang;
                    }
                }

                let translatable: TranslatableTextVO = await ModuleTranslation.getInstance().getTranslatableText('login.recover.answer');
                translation = await ModuleTranslation.getInstance().getTranslation(langObj.id, translatable.id);
            }
            res.render('recover.jade', {
                message: translation ? translation.translated : ""
            });
        });

        this.app.post('/reset', async (req, res) => {
            const session = req.session;

            // Sinon la gestion des droits intervient et empêche de retrouver le compte et les trads ...
            httpContext.set('IS_CLIENT', false);

            const email = req.body.email;
            const challenge = req.body.challenge;
            const new_pwd1 = req.body.new_pwd1;

            let code_lang = (req['locale'] && (typeof req['locale'] == "string")) ? req['locale'].substr(0, 2) : ServerBase.getInstance().envParam.DEFAULT_LOCALE;

            let langs: LangVO[] = await ModuleTranslation.getInstance().getLangs();
            let langObj: LangVO = langs[0];

            for (let i in langs) {
                let lang = langs[i];

                if (lang.code_lang == code_lang) {
                    langObj = lang;
                }
            }

            let translatable_ok: TranslatableTextVO = await ModuleTranslation.getInstance().getTranslatableText('login.reset.answer_ok');
            let translatable_ko: TranslatableTextVO = await ModuleTranslation.getInstance().getTranslatableText('login.reset.answer_ko');
            let translation_ok: TranslationVO = await ModuleTranslation.getInstance().getTranslation(langObj.id, translatable_ok.id);
            let translation_ko: TranslationVO = await ModuleTranslation.getInstance().getTranslation(langObj.id, translatable_ko.id);

            let translation: TranslationVO = translation_ko;

            if (email && (email != "") && challenge && (challenge != "") && new_pwd1 && (new_pwd1 != "")) {

                if (await ModuleAccessPolicy.getInstance().resetPwd(email, challenge, new_pwd1)) {
                    translation = translation_ok;
                }
            }
            res.render('reset.jade', {
                message: translation ? translation.translated : ""
            });
        });

        this.app.get('/logout', (req, res) => {
            req.session.destroy((err) => {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect('/');
                }
            });
        });

        this.app.use('/js', express.static('client/js'));
        this.app.use('/css', express.static('client/css'));
        this.app.use('/temp', express.static('temp'));
        this.app.use('/admin/temp', express.static('temp'));

        // reflect_headers
        this.app.get('/api/reflect_headers', (req, res) => {

            // console.log(JSON.stringify(req.headers));
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
                    data_is_dev: ServerBase.getInstance().envParam.ISDEV
                }
            ));
        });

        // L'API qui renvoie les infos pour générer l'interface NGA pour les modules (activation / désactivation des modules et les paramètres de chaque module)
        this.app.get('/api/modules_nga_fields_infos/:env', (req, res) => {

            // On envoie en fait un fichier JS... Pour avoir un chargement des modules synchrone côté client en intégrant juste un fichier js.
            res.send('GM_Modules = ' + JSON.stringify(GM.get_modules_infos(req.params.env)) + ';');
        });

        // JNE : Savoir si on est en DEV depuis la Vue.js client
        this.app.get('/api/isdev', (req, res) => {
            res.json(ServerBase.getInstance().envParam.ISDEV);
        });
        // !JNE : Savoir si on est en DEV depuis la Vue.js client

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


        console.log('listening on port', ServerBase.getInstance().port);
        ServerBase.getInstance().db.one('SELECT 1')
            .then(async () => {
                console.log('connection to db successful');

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
                        console.error('Impossible de charger la session dans SocketIO');
                        return;
                    }

                    ModulePushDataServer.getInstance().registerSocket(session.user ? session.user.id : null, session.id, socket);
                    socket.on('my other event', function (data) {
                        console.log(data);
                    });
                }.bind(ServerBase.getInstance()));

                // ServerBase.getInstance().testNotifs();

                await ServerBase.getInstance().hook_on_ready();
                console.log('Server ready to go !');
            })
            .catch((err) => {
                console.log('error while connecting to db:', err.message || err);
            });

        // pgp.end();
    }

    protected async hook_on_ready() { }

    protected handleError(promise, res) {
        promise.catch((err) => {
            console.error("error", err.message || err);
            return res.status(500).send(err.message || err);
        });
    }

    protected sendError(res, errormessage) {
        console.error("error", errormessage);
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
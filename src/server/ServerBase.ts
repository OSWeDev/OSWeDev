import * as child_process from 'child_process';
import * as compression from 'compression';
import * as express from 'express';
import { NextFunction, Request, Response } from 'express';
import * as createLocaleMiddleware from 'express-locale';
import * as expressSession from 'express-session';
import * as fs from 'fs';
import * as proxyMiddleware from 'http-proxy-middleware';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';
import * as pg from 'pg';
import * as pg_promise from 'pg-promise';
import { IDatabase } from 'pg-promise';
import * as sessionFileStore from 'session-file-store';
import * as winston from 'winston';
import * as winston_daily_rotate_file from 'winston-daily-rotate-file';
import ModuleAccessPolicy from '../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleDAO from '../shared/modules/DAO/ModuleDAO';
import ModulesManager from '../shared/modules/ModulesManager';
import ModuleTranslation from '../shared/modules/Translation/ModuleTranslation';
import LangVO from '../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../shared/modules/Translation/vos/TranslationVO';
import ConfigurationService from './env/ConfigurationService';
import EnvParam from './env/EnvParam';
import I18nextInit from './I18nextInit';
import ModuleCronServer from './modules/Cron/ModuleCronServer';
import ModuleServiceBase from './modules/ModuleServiceBase';
// import * as webpush from 'web-push';
import * as socketIO from 'socket.io';
import * as sharedsession from 'express-socket.io-session';
import ModulePushDataServer from './modules/PushData/ModulePushDataServer';
import SocketWrapper from './modules/PushData/vos/SocketWrapper';
import NotificationVO from '../shared/modules/PushData/vos/NotificationVO';
import ModuleFile from '../shared/modules/File/ModuleFile';
import ModuleAccessPolicyServer from './modules/AccessPolicy/ModuleAccessPolicyServer';

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
    private jwtSecret: string;
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

        this.envParam = ConfigurationService.getInstance().getNodeConfiguration();
        this.version = this.getVersion();

        this.connectionString = this.envParam.CONNECTION_STRING;
        this.uiDebug = null; // JNE MODIF FLK process.env.UI_DEBUG;
        this.port = process.env.PORT ? process.env.PORT : this.envParam.PORT;

        this.jwtSecret = 'This is the jwt secret for the rest part';

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

        let i18nextInit = I18nextInit.getInstance(await ModuleTranslation.getInstance().getALL_LOCALES());
        this.app.use(i18nextInit.i18nextMiddleware.handle(i18nextInit.i18next, {
            ignoreRoutes: ["/public"]
        }));

        // Pour activation auto let's encrypt
        this.app.use('/.well-known', express.static('.well-known'));

        this.app.use(ModuleFile.FILES_ROOT.replace(/^[.][/]/, '/'), express.static(ModuleFile.FILES_ROOT.replace(/^[.][/]/, '')));

        this.app.use('/public', express.static('src/client/public'));
        this.app.use('/admin/public', express.static('src/admin/public'));

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
            store: new FileStore()
        });
        this.app.use(this.session);


        this.app.use((req, res, next) => {
            const session = req.session;
            const publicPrefix = "/public/";
            const isPublic = req.path.substring(0, publicPrefix.length) == publicPrefix;
            if (req.method == "OPTIONS" || req.path == "/login" || req.path == "/recover" || req.path == "/cron" || req.path == "/reset" || req.path == "/logout" || isPublic || session.user) {
                next();
            } else {
                if (req.path.indexOf("/api") == 0) {
                    return res.sendStatus(401);
                } else {
                    res.redirect('/login?url=' + encodeURIComponent(req.originalUrl));
                }
            }
        });

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

                httpContext.set('USER_DATA', await ServerBase.getInstance().getUserData(uid));
            } else {
                httpContext.set('UID', null);
            }
            next();
        });

        this.app.get('/admin', (req, res) => {

            if (ModuleAccessPolicy.getInstance().actif && (!ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_BO_ACCESS))) {
                res.redirect('/');
            }
            res.sendFile(path.resolve('./src/admin/public/generated/admin.html'));
        });

        this.app.set('view engine', 'jade');
        this.app.set('views', 'src/client/views');

        this.app.get('/login', (req, res) => {
            res.render('login.jade', {
                url: req.query.url || '/'
            });
        });

        this.app.get('/recover', (req, res) => {
            res.render('recover.jade');
        });

        this.app.get('/reset', (req, res) => {
            res.render('reset.jade');
        });


        this.app.post('/login', (req, res) => {
            ServerBase.getInstance().login(req, res, ServerBase.getInstance().jwtSecret);
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
            let user_infos = await ServerBase.getInstance().getUserInfos(session.user.email);

            if (!user_infos) {
                ServerBase.getInstance().sendError(res, "No user info. Please reload.");
                return;
            }

            res.json(JSON.stringify(
                {
                    data_version: ServerBase.getInstance().version,
                    data_user: user_infos,
                    data_ui_debug: ServerBase.getInstance().uiDebug,
                    data_base_api_url: "",
                    data_default_locale: ServerBase.getInstance().envParam.DEFAULT_LOCALE
                }
            ));
        });

        this.app.get('/api/adminappcontrollerinit', async (req, res) => {
            const session = req.session;
            let user_infos = await ServerBase.getInstance().getUserInfos(session.user.email);

            if (!user_infos) {
                ServerBase.getInstance().sendError(res, "No user info. Please reload.");
                return;
            }

            res.json(JSON.stringify(
                {
                    data_version: ServerBase.getInstance().version,
                    data_code_pays: ServerBase.getInstance().envParam.CODE_PAYS,
                    data_node_env: process.env.NODE_ENV,
                    data_user: user_infos,
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

        // this.initializePush();
        // this.initializePushApis(this.app);
        this.registerApis(this.app);

        await this.modulesService.configure_server_modules(this.app);
        // Une fois tous les droits / rôles définis, on doit pouvoir initialiser les droits d'accès
        await ModuleAccessPolicyServer.getInstance().preload_access_rights();

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

    protected async login(req, res, jwtSecret) {

        const session = req.session;

        const email = req.body.email;
        const password = req.body.password;

        const redirectUrl = req.body.url || '/';

        let request = 'SELECT "user", role FROM web.';

        // JNE : a changer evidemment....
        request += 'user_info_without_stores';
        request += ' WHERE login = $1 AND password = crypt($2, password)';

        this.db.one(request, [email, password])
            .then((row) => {
                session.user = row.user;
                session.jwtToken = jwt.sign({
                    role: row.role
                }, jwtSecret);

                // console.log('storing in session', JSON.stringify(row.user));
                // console.log('storing in session jwt for role', row.role, session.jwtToken);
                // console.log('redirecting to', redirectUrl);

                res.redirect(redirectUrl);
            })
            .catch((err) => {
                console.log("Login error :" + err);
                res.render('login.jade', {
                    message: "user/password not found",
                    url: redirectUrl
                });
            });
    }

    protected async getUserData(uid: number) {
        return null;
    }

    // A changer ASAP
    protected async getUserInfos(email: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let request = 'SELECT "user" FROM web.';
            request += 'user_info_without_stores';
            request += ' WHERE login = $1';
            ServerBase.getInstance().db.one(request, email)
                .then((row) => {
                    resolve(row.user);
                });
        });
    }

    protected registerApis(app) {
    }

    // private initializePushApis(app) {
    //     let self = this;

    //     app.post('/subscribepush', (req, res) => {
    //         self.subscription = req.body;
    //         res.status(201).json({});
    //         const payload = JSON.stringify({ title: 'test' });
    //         webpush.sendNotification(self.subscription, payload);

    //         setTimeout(self.testNotifs.bind(self), 1000);
    //     });
    // }

    // private async testNotifs() {

    //     try {

    //         let allSockets: SocketWrapper[] = ModulePushDataServer.getInstance().getAllSockets();
    //         let allUsersIds: number[] = [];
    //         for (let i in allSockets) {
    //             let socketWrapper: SocketWrapper = allSockets[i];
    //             if (allUsersIds.indexOf(socketWrapper.userId) < 0) {
    //                 allUsersIds.push(socketWrapper.userId);
    //             }
    //         }

    //         for (let i in allUsersIds) {
    //             let userId: number = allUsersIds[i];

    //             let notification: NotificationVO = new NotificationVO();
    //             notification.notification_type = NotificationVO.TYPE_NOTIF_SIMPLE;
    //             let index = Math.floor(Math.random() * 4);
    //             notification.simple_notif_type = [NotificationVO.SIMPLE_SUCCESS, NotificationVO.SIMPLE_INFO, NotificationVO.SIMPLE_WARN, NotificationVO.SIMPLE_ERROR][index];
    //             notification.simple_notif_label = 'notifsimple.' + index;

    //             await ModulePushDataServer.getInstance().notify(userId, notification);
    //         }

    //         setTimeout(this.testNotifs.bind(this), 5000);
    //     } catch (e) {
    //         console.error(e);
    //     }
    // }

    // private async testNotifs() {
    //     const payload = JSON.stringify({ title: 'test' });

    //     try {
    //         await webpush.sendNotification(this.subscription, payload);
    //         setTimeout(this.testNotifs.bind(this), 10000);
    //     } catch (e) {
    //         console.error(e);
    //     }
    // }

    // private initializePush() {
    //     const publicVapidKey = this.envParam.PUBLIC_VAPID_KEY;
    //     const privateVapidKey = this.envParam.PRIVATE_VAPID_KEY;

    //     webpush.setVapidDetails('mailto:contact@wedev.fr', publicVapidKey, privateVapidKey);
    // }
}
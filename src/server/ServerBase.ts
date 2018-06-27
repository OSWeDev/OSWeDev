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
import ModuleCron from '../shared/modules/Cron/ModuleCron';
import ModuleDAO from '../shared/modules/DAO/ModuleDAO';
import ModuleTranslation from '../shared/modules/Translation/ModuleTranslation';
import LangVO from '../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../shared/modules/Translation/vos/TranslationVO';
import ConfigurationService from './env/ConfigurationService';
import EnvParam from './env/EnvParam';
import I18nextInit from './I18nextInit';
import ModuleServiceBase from './modules/ModuleServiceBase';
import ModulesManager from '../shared/modules/ModulesManager';
import ModuleCronServer from './modules/Cron/ModuleCronServer';

export default abstract class ServerBase {

    public static getInstance(): ServerBase {
        return ServerBase.instance;
    }

    protected static instance: ServerBase = null;

    protected db: IDatabase<any>;
    protected run_postgrest_apis: boolean = true;
    protected spawn;
    protected app;
    protected port;
    protected uiDebug;
    protected envParam: EnvParam;
    protected version;
    private connectionString: string;
    private jwtSecret: string;
    private modulesService: ModuleServiceBase;
    private ALL_LOCALES;
    private STATIC_ENV_PARAMS: { [env: string]: EnvParam };

    protected constructor(modulesService: ModuleServiceBase, ALL_LOCALES, STATIC_ENV_PARAMS: { [env: string]: EnvParam }) {
        ServerBase.instance = this;
        this.modulesService = modulesService;
        this.ALL_LOCALES = ALL_LOCALES;
        this.STATIC_ENV_PARAMS = STATIC_ENV_PARAMS;
        ModulesManager.getInstance().isServerSide = true;
    }

    public abstract getHttpContext();

    public async initializeNodeServer() {

        ConfigurationService.getInstance().setEnvParams(this.STATIC_ENV_PARAMS);
        this.envParam = ConfigurationService.getInstance().getNodeConfiguration();
        this.version = this.getVersion();

        this.connectionString = this.envParam.CONNECTION_STRING;
        this.uiDebug = null; // JNE MODIF FLK process.env.UI_DEBUG;
        this.port = this.envParam.PORT;

        this.jwtSecret = 'This is the jwt secret for the rest part';

        let pgp: pg_promise.IMain = pg_promise({});
        this.db = pgp(this.connectionString);

        let GM = this.modulesService;
        await GM.register_all_modules(this.db);

        this.initializeDataImports();

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

        let i18nextInit = I18nextInit.getInstance(this.ALL_LOCALES);
        this.app.use(i18nextInit.i18nextMiddleware.handle(i18nextInit.i18next, {
            ignoreRoutes: ["/public"]
        }));

        // Pour activation auto let's encrypt
        this.app.use('/.well-known', express.static('.well-known'));

        this.app.use('/public', express.static('src/client/public'));
        this.app.use('/admin/public', express.static('src/admin/public'));

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


        this.app.use(
            expressSession({
                secret: 'vk4s8dq2j4',
                name: 'sid',
                proxy: true,
                resave: false,
                saveUninitialized: false,
                store: new FileStore()
            })
        );

        this.app.use((req, res, next) => {
            const session = req.session;
            const publicPrefix = "/public/";
            const isPublic = req.path.substring(0, publicPrefix.length) == publicPrefix;
            if (req.method == "OPTIONS" || req.path == "/login" || req.path == "/recover" || req.path == "/cron" || req.path == "/reset" || req.path == "/logout" || isPublic || session.user) {
                // console.log('next()', isPublic, req.path, req.url);
                next();
            } else {
                if (req.path.indexOf("/api") == 0) {
                    return res.sendStatus(401);
                } else {
                    // console.log('req.path', isPublic, req.path, req.url);
                    res.redirect('/login?url=' + encodeURIComponent(req.originalUrl));
                }
            }
        });

        // admin
        // FIXME:JNE:MODIF:FLK test sans le proxy dans nodejs mais dans IIS directement
        let proxy = proxyMiddleware('/admin/api/**', {
            target: 'http://localhost:' + ServerBase.getInstance().envParam.ADMIN_PROXY_PORT, // target host
            pathRewrite: {
                '^/admin/api/': '/' // rewrite paths
            },
            onProxyReq: (proxyReq, req, res, options) => {
                const session = req.session;
                proxyReq.setHeader('Authorization', 'Bearer ' + session.jwtToken);
            },
        });

        this.app.use(proxy);
        proxy = proxyMiddleware('/ref/api/**', {
            target: 'http://localhost:' + ServerBase.getInstance().envParam.REF_PROXY_PORT, // target host
            pathRewrite: {
                '^/ref/api/': '/' // rewrite paths
            },
            onProxyReq: (proxyReq, req, res, options) => {
                const session = req.session;
                proxyReq.setHeader('Authorization', 'Bearer ' + session.jwtToken);
            },
        });

        this.app.use(proxy);

        this.app.use('/admin/js', express.static('src/admin/public/js'));

        // // La position semble très importante pour ce bodyParser
        // this.app.use(bodyParser.urlencoded({
        //     limit: '150mb',
        //     extended: true
        // }));
        // this.app.use(bodyParser.json({
        //     limit: '150mb'
        // }));

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

            if (ModuleAccessPolicy.getInstance().actif && (!ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.MAIN_ACCESS_GROUP_NAME, ModuleAccessPolicy.ADMIN_ACCESS_NAME))) {
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
                    data_url_import: ServerBase.getInstance().envParam.URL_IMPORT,
                    data_node_env: process.env.NODE_ENV,
                    data_user: user_infos,
                    data_ui_debug: ServerBase.getInstance().uiDebug,
                    data_base_api_url: "/admin/api/",
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
        this.app.get('/cron', (req, res) => {

            // Sinon la gestion des droits intervient et empêche de retrouver le compte et les trads ...
            httpContext.set('IS_CLIENT', false);

            return ServerBase.getInstance().handleError(ModuleCronServer.getInstance().executeWorkers().then(() => {
                res.json();
            }), res);
        });

        this.app.post('/api/save', (req, res) => {
            return ServerBase.getInstance().handleError(ModuleDAO.getInstance().db_tx_update(req.body).then((data) => {
                res.json(data);
            }), res);
        });

        this.registerApis(this.app);

        this.modulesService.configure_server_modules(this.app);

        console.log('listening on port', ServerBase.getInstance().port);
        ServerBase.getInstance().db.one('SELECT 1')
            .then(() => {
                console.log('connection to db successful');

                // On lance un deuxième postgres, sur le schéma ref et pour le front
                if (ServerBase.getInstance().run_postgrest_apis) {
                    ServerBase.getInstance().runPostgrestAPI('admin', ServerBase.getInstance().envParam.ADMIN_PROXY_PORT).then(() => {

                        ServerBase.getInstance().runPostgrestAPI('ref', ServerBase.getInstance().envParam.REF_PROXY_PORT).then(() => {

                            ServerBase.getInstance().app.listen(ServerBase.getInstance().port);
                        });
                    });
                }
            })
            .catch((err) => {
                console.log('error while connecting to db:', err.message || err);
            });

        // pgp.end();
    }

    protected runPostgrestAPI(schema, port) {
        return new Promise((resolve, reject) => {
            const version = '0.4.2.0'; // JNE modif version'0.3.2.0';
            const executable = path.join('.', 'admin', 'postgrest', version, 'postgrest');
            const args = [ServerBase.getInstance().connectionString, '-a', 'rocher', '--schema', schema, '--jwt-secret', ServerBase.getInstance().jwtSecret, '-p', port];

            let postgrest;
            if (version == '0.4.2.0') {
                // Changement de la gestion des paramètres, on doit passer par un fichier de conf
                const postgrestconf = path.join('.', 'admin', 'postgrest', version, 'postgrest.' + schema + '.conf');

                fs.writeFile(postgrestconf,
                    'db-uri       = "' + ServerBase.getInstance().connectionString + '"\n' +
                    'db-schema    = "' + schema + '"\n' +
                    'jwt-secret   = "' + ServerBase.getInstance().jwtSecret + '"\n' +
                    'server-port  = "' + port + '"\n' +
                    'db-anon-role  = "rocher"\n'
                    //# send logs where the collector can access them
                    //# log every kind of SQL statement
                    // 'log_statement = "all"\n' +
                    // 'log_destination = "stderr"\n'
                    ,
                    (err) => {
                        if (err) {
                            reject(err);
                            // return console.log('postgrest.conf : ' + err);
                        }

                        // console.log('postgrest.conf saved!');
                        postgrest = ServerBase.getInstance().spawn(executable, [postgrestconf]);

                        postgrest.stdout.on('data', (data) => {
                            // console.log('postgrest ' + schema + ' stdout: ' + data);
                        });

                        postgrest.stderr.on('data', (data) => {
                            console.log('postgrest ' + schema + ' stderr: ' + data);
                        });

                        postgrest.on('close', (code) => {
                            // console.log('child process exited with code :' + schema + ':' + code);
                        });

                        resolve();
                    });

            } else {
                postgrest = ServerBase.getInstance().spawn(executable, args);

                postgrest.stdout.on('data', (data) => {
                    console.log('postgrest ' + schema + ' stdout: ' + data);
                });

                postgrest.stderr.on('data', (data) => {
                    console.log('postgrest ' + schema + ' stderr: ' + data);
                });

                postgrest.on('close', (code) => {
                    // console.log('child process exited with code :' + schema + ':' + code);
                });

                resolve();
            }

        });
    }

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
}
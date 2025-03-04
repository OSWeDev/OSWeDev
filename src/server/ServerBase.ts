import child_process from 'child_process';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mime from 'mime-types';
// import csrf from 'csurf';
import express, { Application, NextFunction, Request, Response } from 'express';
import createLocaleMiddleware from 'express-locale';
import expressSession from 'express-session';
import sharedsession from 'express-socket.io-session';
import fs from 'fs';
import helmet from 'helmet';
import path from 'path';
import pg from 'pg';
import pg_promise, { IDatabase, IEventContext, IResultExt } from 'pg-promise';
import socketIO from 'socket.io';
import winston from 'winston';
import winston_daily_rotate_file from 'winston-daily-rotate-file';
import ModuleAccessPolicy from '../shared/modules/AccessPolicy/ModuleAccessPolicy';
import IServerUserSession from '../shared/modules/AccessPolicy/vos/IServerUserSession';
import UserLogVO from '../shared/modules/AccessPolicy/vos/UserLogVO';
import UserVO from '../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleFile from '../shared/modules/File/ModuleFile';
import FileVO from '../shared/modules/File/vos/FileVO';
import Dates from '../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleImageFormat from '../shared/modules/ImageFormat/ModuleImageFormat';
import FormattedImageVO from '../shared/modules/ImageFormat/vos/FormattedImageVO';
import ImageFormatVO from '../shared/modules/ImageFormat/vos/ImageFormatVO';
import ModuleMaintenance from '../shared/modules/Maintenance/ModuleMaintenance';
import ModulesManager from '../shared/modules/ModulesManager';
import ModulePushData from '../shared/modules/PushData/ModulePushData';
import StatsController from '../shared/modules/Stats/StatsController';
import ModuleTranslation from '../shared/modules/Translation/ModuleTranslation';
import ConsoleHandler from '../shared/tools/ConsoleHandler';
import EnvHandler from '../shared/tools/EnvHandler';
import ThreadHandler from '../shared/tools/ThreadHandler';
import FileLoggerHandler from './FileLoggerHandler';
import MemoryUsageStat from './MemoryUsageStat';
import ConfigurationService from './env/ConfigurationService';
import EnvParam from './env/EnvParam';
import AccessPolicyServerController from './modules/AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from './modules/AccessPolicy/ModuleAccessPolicyServer';
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
import expressStaticGzip from 'express-static-gzip';
import { IClient } from 'pg-promise/typescript/pg-subset';
import APIDefinition from '../shared/modules/API/vos/APIDefinition';
import EventsController from '../shared/modules/Eventify/EventsController';
import OseliaReferrerVO from '../shared/modules/Oselia/vos/OseliaReferrerVO';
import DBDisconnectionManager from '../shared/tools/DBDisconnectionManager';
import { field_names } from '../shared/tools/ObjectHandler';
import PromisePipeline from '../shared/tools/PromisePipeline/PromisePipeline';
import StackContextWrapper from '../shared/tools/StackContextWrapper';
import ServerExpressController from './ServerExpressController';
import StackContext from './StackContext';
import BGThreadServerDataManager from './modules/BGThread/BGThreadServerDataManager';
import RunsOnBgThreadDataController from './modules/BGThread/annotations/RunsOnBGThread';
import RunsOnMainThreadDataController from './modules/BGThread/annotations/RunsOnMainThread';
import DBDisconnectionServerHandler from './modules/DAO/disconnection/DBDisconnectionServerHandler';
import ForkMessageController from './modules/Fork/ForkMessageController';
import IFork from './modules/Fork/interfaces/IFork';
import PingForkMessage from './modules/Fork/messages/PingForkMessage';
import OseliaServerController from './modules/Oselia/OseliaServerController';
import ParamsServerController from './modules/Params/ParamsServerController';
import ModulePushDataServer from './modules/PushData/ModulePushDataServer';
import AsyncHookPromiseWatchController from './modules/Stats/AsyncHookPromiseWatchController';
import VarsDatasVoUpdateHandler from './modules/Var/VarsDatasVoUpdateHandler';

export default abstract class ServerBase {

    protected static SLOW_EXPRESS_QUERY_LIMIT_MS_PARAM_NAME: string = 'ServerBase.SLOW_EXPRESS_QUERY_LIMIT_MS';

    /* istanbul ignore next: nothing to test here */
    protected static instance: ServerBase = null;

    // public csrf_protection;
    public version;
    public io;

    protected db: IDatabase<any>;
    protected spawn;
    protected app: Application;
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

        StackContextWrapper.instance = StackContext;
        RunsOnMainThreadDataController.exec_self_on_main_process_and_return_value_method = ForkedTasksController.exec_self_on_main_process_and_return_value.bind(ForkedTasksController);
        RunsOnBgThreadDataController.exec_self_on_bgthread_and_return_value_method = ForkedTasksController.exec_self_on_bgthread_and_return_value.bind(ForkedTasksController);
        ModulesManager.initialize();

        ForkedTasksController.init();
        ForkedTasksController.assert_is_main_process();

        // INIT Stats Server side
        StatsController.THREAD_NAME = 'main';
        StatsController.getInstance().UNSTACK_THROTTLE = 10000;
        StatsController.UNSTACK_THROTTLE_PARAM_NAME = 'StatsController.UNSTACK_THROTTLE_SERVER';
        StatsController.new_stats_handler = StatsServerController.new_stats_handler;
        StatsController.register_stat_COMPTEUR('ServerBase', 'START', '-');

        ServerBase.instance = this;
        this.modulesService = modulesService;
        this.STATIC_ENV_PARAMS = STATIC_ENV_PARAMS;
        ConfigurationService.setEnvParams(this.STATIC_ENV_PARAMS);
        PromisePipeline.DEBUG_PROMISE_PIPELINE_WORKER_STATS = ConfigurationService.node_configuration.debug_promise_pipeline_worker_stats;
        DBDisconnectionManager.instance = new DBDisconnectionServerHandler();
        EventsController.hook_stack_incompatible = ConfigurationService.node_configuration.activate_incompatible_stack_context ? StackContext.context_incompatible : null;

        ConsoleHandler.init('main');
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
        // this.csrf_protection = csrf({
        //     cookie: true
        // });
    }

    /* istanbul ignore next: nothing to test here */
    public static getInstance(): ServerBase {
        return ServerBase.instance;
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
        EnvHandler.logo_path = this.envParam.logo_path;
        this.connectionString = this.envParam.connection_string;
        this.uiDebug = null; // JNE MODIF FLK process.env.UI_DEBUG;
        this.port = process.env.PORT ? process.env.PORT : this.envParam.port;

        PushDataServerController.initialize();

        // this.jwtSecret = 'This is the jwt secret for the rest part';

        const pgp: pg_promise.IMain = pg_promise({
            receive: StatsController.ACTIVATED ?
                (e: { data: any[]; result: void | IResultExt<unknown>; ctx: IEventContext<IClient>; }) => {

                    StatsController.register_stat_COMPTEUR('ServerBase', 'PGP', 'receive');

                    if (ConfigurationService.node_configuration.debug_top_10_query_size) {
                        /**
                         * On stocke l'info de la taille des requetes si en plus d'etre en stats on est en debug_top_10_query_size
                         */
                        const size_ko = Buffer.byteLength(JSON.stringify(e.data), 'utf8');
                        StatsServerController.pgsql_queries_log.push({
                            query: e.ctx.query,
                            size_ko: size_ko
                        });
                    }

                } : null,
            connect: StatsController.ACTIVATED ?
                async (e: { client: IClient, dc: any, useCount: number }) => {
                    StatsController.register_stat_COMPTEUR('ServerBase', 'PGP', 'connect');

                    // /**
                    //  * FIXME : JNE DELETE : only for debug
                    //  */
                    // e.client['__connectStart'] = Dates.now_ms();
                    // /**
                    //  * ! FIXME : JNE DELETE : only for debug
                    //  */

                } : undefined,
            disconnect: StatsController.ACTIVATED ?
                async (e: { client: IClient, dc: any }) => {
                    StatsController.register_stat_COMPTEUR('ServerBase', 'PGP', 'disconnect');

                    // const totalConnTime = Dates.now_ms() - e.client['__connectStart'];
                    // console.log('DISCONNECT EVENT: durée depuis l’obtention de la connexion =', totalConnTime, 'ms');
                } : undefined,
            query: StatsController.ACTIVATED ?
                async (e: IEventContext<IClient>) => {
                    StatsController.register_stat_COMPTEUR('ServerBase', 'PGP', 'query');

                    // /**
                    //  * FIXME : JNE DELETE : only for debug
                    //  */
                    // if (!e.ctx) {
                    //     e.ctx = {} as ITaskContext;
                    // }
                    // e.ctx['queryStart'] = Dates.now_ms();
                    // /**
                    //  * ! FIXME : JNE DELETE : only for debug
                    //  */
                } : undefined,
            // async receive(e: { data: any[], result: IResultExt | void, ctx: IEventContext<IClient> }) {
            // const queryTime = e.ctx['queryStart'] ? Dates.now_ms() - e.ctx['queryStart'] : 'N/A';
            // console.log('RECEIVE EVENT: durée exécution côté serveur = ' + queryTime + 'ms, rows = ' + e.data.length);
            // },
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
        this.app.disable('x-powered-by'); // On ne veut pas communiquer la techno utilisée

        if (this.envParam.compress) {
            const shouldCompress = function (req, res) {
                if (req.headers['x-no-compression']) {
                    // don't compress responses with this request header
                    return false;
                }

                // fallback to standard filter function
                return compression.filter(req, res);
            };
            this.app.use(compression({
                filter: shouldCompress,
                threshold: 1024, // Taille min avant compression
            }));
        }

        // On déclare le middleware session
        this.session = expressSession({
            secret: ConfigurationService.node_configuration.express_secret,
            name: 'sid',
            proxy: true,
            resave: false,
            saveUninitialized: false,
            store: ExpressDBSessionsServerController.getInstance({
                conString: this.connectionString,
                schemaName: 'ref',
                tableName: 'module_expressdbsessions_express_session', // En dur pour le chargement de l'appli
            }),
            // On durcit un peu la session
            cookie: {
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
                httpOnly: true,  // empêche l'accès au cookie depuis le JS
                secure: (!ConfigurationService.node_configuration.isdev) && (!ConfigurationService.node_configuration.base_url.startsWith('http://localhost')),    // n'envoie le cookie qu'en HTTPS
                sameSite: 'lax', // bloque largement les requêtes cross-site
            },
        });

        /**
         * Urls valides pour l'appli :
         *  - Les statiques : un seul middleware, avec ou sans cache
         *      - /public/client-sw.*.js : pour le service worker
         *      - /public/* : pour les fichiers statiques de l'appli
         *      - /files/* : pour les fichiers de l'appli
         *      - /admin/js/* : a priori historique : pour on sait pas trop quoi, donc à virer si on peut
         *      - /js/* : historique : pour on sait pas trop quoi, donc à virer si on peut
         *      - /css/* : historique : pour on sait pas trop quoi, donc à virer si on peut
         *      - /temp/* : historique : pour on sait pas trop quoi, donc à virer si on peut
         *      - /admin/temp/* : historique : pour on sait pas trop quoi, donc à virer si on peut
         *      - /.well-known/* : pour les fichiers de configuration du cetrificat let's encrypt
         *      Concernant les statics :
         *          fallthrough: false sert uniquement à indiquer que si le fichier statique n'est pas trouvé, on ne passe pas à la suite des middlewares, mais n'a aucun effet si on a trouvé le fichier
         *      Pour éviter d'appliquer les middlewares suivants si on a trouvé le fichier statique, il faut utiliser un fonctionnement d'exclusion des middlewares, ou limiter l'application des middlewares directement aux routes concernées
         * - Les APIs :
         *      - /api_handler/* : pour les APIs
         *          - middleware pour recoller la session
         *          - middleware de l'api
         * - Les autres :
         *      - /sfiles/* : pour les fichiers sécurisés de l'appli
         *          - middleware pour recoller la session
         *          - middleware pour vérifier les droits d'accès aux sfiles
         *      - /, /login, /admin : pour les 3 endpoints de l'appli
         *      - /node_modules/oswedev/src/* : pour le debug en local
         */
        await this.define_express_statics();

        this.app.use(helmet());
        this.app.use(this.check_origin_or_referer_middleware.bind(this));

        /**
         * Application des différents middlewares suivant les regex des urls
         */
        const cookieParser_middleware = cookieParser();
        const express_json_middleware = express.json({ limit: '150mb' });
        const express_urlencoded_middleware = express.urlencoded({ extended: true, limit: '150mb' });

        const session_dependant_middlewares: ((req: Request, res: Response, next: NextFunction) => void)[] = [
            cookieParser_middleware,
            express_json_middleware,
            express_urlencoded_middleware,
            this.pre_init_session_middleware.bind(this),
            this.session,
            this.post_init_session_middleware.bind(this),
        ];

        const middlewares_by_urls_and_methd: { [method: number]: { [url: string]: ((req: Request, res: Response, next: NextFunction) => void)[] } } = {
            [APIDefinition.API_TYPE_GET]: {
                [ModuleFile.SECURED_FILES_ROOT.replace(/^[.][/]/, '/') + '(:folder1/)?(:folder2/)?(:folder3/)?(:folder4/)?(:folder5/)?:file_name']: [
                    ...session_dependant_middlewares,
                    this.sfiles_middleware.bind(this),
                ],
                '/api_handler/*': [
                    ...session_dependant_middlewares,
                    // this.response_time_middleware.bind(this),
                ],
                '*/f/*': [
                    this.redirect_fragmented_url.bind(this),
                ],
                '/': [
                    this.redirect_fragmented_url.bind(this),
                    ...session_dependant_middlewares,
                    this.client_home_middleware.bind(this),
                ],
                '/admin': [
                    this.redirect_fragmented_url.bind(this),
                    ...session_dependant_middlewares,
                    this.admin_home_middleware.bind(this),
                ],
                '/login': [
                    this.redirect_fragmented_url.bind(this),
                    (req, res) => res.sendFile(path.resolve('./dist/public/login.html')),
                ],

                // reflect_headers
                '/api/reflect_headers': [
                    createLocaleMiddleware({
                        priority: ["accept-language", "default"],
                        default: this.envParam.default_locale
                    }),
                    this.reflect_header_middleware.bind(this),
                ],

                // // Send CSRF token for session
                // '/api/getcsrftoken': [
                //     ...session_dependant_middlewares,
                //     this.csrf_middleware.bind(this),
                // ],

                '/logout': [
                    ...session_dependant_middlewares,
                    this.logout_middleware.bind(this),
                ],

                '/api/clientappcontrollerinit': [
                    ...session_dependant_middlewares,
                    this.clientappcontrollerinit_middleware.bind(this),
                ],

                '/api/adminappcontrollerinit': [
                    ...session_dependant_middlewares,
                    this.adminappcontrollerinit_middleware.bind(this),
                ],

                '/cron': [
                    this.cron_middleware.bind(this),
                ],

                '/thread_alive/:uid': [
                    this.thread_alive_middleware.bind(this),
                ],

                [ModuleImageFormat.RESIZABLE_IMGS_PATH_BASE.replace('./', '/')]: [
                    ...session_dependant_middlewares,
                    this.resizable_images_middleware.bind(this),
                ],
            },
            [APIDefinition.API_TYPE_POST]: {
                '/api_handler/*': [
                    ...session_dependant_middlewares,
                    // this.response_time_middleware.bind(this),
                ],
            },
        };
        this.apply_middlewares(middlewares_by_urls_and_methd);


        if (ConfigurationService.node_configuration.activate_long_john) {
            require('longjohn');
        }


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

        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ServerExpressController:express:END');
        }

        this.hook_configure_express();

        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ServerExpressController:registerApis:START');
        }
        this.registerApis(this.app);
        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ServerExpressController:registerApis:END');
        }

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

        AsyncHookPromiseWatchController.init();

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

        process.on('uncaughtException', function (err) {
            ConsoleHandler.error("Node nearly failed: " + err.stack);
        });

        ThreadHandler.set_interval(
            'MemoryUsageStat.updateMemoryUsageStat',
            MemoryUsageStat.updateMemoryUsageStat,
            45000,
            'MemoryUsageStat.updateMemoryUsageStat',
            true,
        );

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

                PushDataServerController.registerSocket(session, socket);
            }.bind(ServerBase.getInstance()));

            io.on('disconnect', function (socket: socketIO.Socket) {
                const session: IServerUserSession = socket.handshake['session'];

                PushDataServerController.unregisterSocket(session, socket);
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

    // /* istanbul ignore next: nothing to test here */
    // protected async hook_pwa_init() {

    //     // this.app.get('/public/client-sw.' + version + '.js', (req, res, next) => {
    //     //     res.header('Service-Worker-Allowed', '/public/');

    //     // });

    //     this.app.get('/public/client-sw.*.js', (req, res, next) => {
    //         res.header('Service-Worker-Allowed', '/');

    //         // si on tente de récupérer un service worker qui n'existe pas, on laisse passer l'erreur et on ne recharge pas.
    //         // par contre si on est ailleurs dans le /public/, il faudra demander un reload de la page
    //         res.sendFile(path.resolve('./dist' + req.url));
    //     });
    // }

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

    /**
     * DELETE ME Post suppression StackContext: Does not need StackContext
     * @param req
     * @param res
     * @param uid
     * @param url
     * @returns
     */
    protected redirect_login_or_home(req: Request, res: Response, uid: number, url: string = null) {
        if (!uid) {
            const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

            if (ConfigurationService.node_configuration.log_login_redirects) {
                ConsoleHandler.log('ServerBase:redirect_login_or_home:redirecting to login:fullUrl:' + fullUrl + ':url:' + url + ':req.originalUrl:' + req.originalUrl);
            }

            res.redirect('/login#?redirect_to=' + encodeURIComponent(fullUrl));
            return;
        }

        if (req.session && req.session.last_fragmented_url) {
            if (ConfigurationService.node_configuration.log_login_redirects) {
                ConsoleHandler.log('ServerBase:redirect_login_or_home:redirecting to login:req.session.last_fragmented_url:' + req.session.last_fragmented_url + ':url:' + url + ':req.originalUrl:' + req.originalUrl);
            }
            req.session.last_fragmented_url = null;

            res.redirect(307, req
                .url
                .replace(/\/f\//, '/#/'));
            return;
        }

        if (ConfigurationService.node_configuration.log_login_redirects) {
            ConsoleHandler.log('ServerBase:redirect_login_or_home:redirecting to home:url:' + url + ':req.originalUrl:' + req.originalUrl);
        }

        res.redirect(url ? url : '/');
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

    /**
     * A voir si on devrait pas bloquer tout ce qui n'est pas un get sur les statics... mais express.static n'a pas de conf a priori pour ça et doit etre utilisé avec use et pas get. à creuser à l'occasion
     */
    private async define_express_statics() {
        const cache_duration = 90 * 24 * 60 * 60 * 1000; // 90 jours

        // Avant le static du public il faut autoriser la PWA sur /
        this.app.get('/public/client-sw.*.js', (req, res, next) => {
            res.header('Service-Worker-Allowed', '/');
            next();
        });

        // Le service de push => je sais pas si on l'utilise actuellement, je pense pas
        this.app.use('/sw_push.js', express.static(path.resolve('./dist/public/vuejsclient/sw_push.js'), {
            maxAge: cache_duration,
            etag: true,
            lastModified: true,
            fallthrough: false,
        }));

        // Cache + static sur le public
        this.app.use('/public', expressStaticGzip('dist/public', {
            enableBrotli: true,
            orderPreference: ['br', 'gz'],
            index: false,
            serveStatic: {
                cacheControl: true,
                lastModified: true,
                etag: true,
                maxAge: cache_duration,
                fallthrough: false,
            },
        }));

        // Cache sur les files
        this.app.use(ModuleFile.FILES_ROOT.replace(/^[.][/]/, '/'), expressStaticGzip(ModuleFile.FILES_ROOT.replace(/^[.][/]/, ''), {
            enableBrotli: true,
            orderPreference: ['br', 'gz'],
            index: false,
            serveStatic: {
                cacheControl: true,
                lastModified: true,
                etag: true,
                maxAge: cache_duration,
                fallthrough: false,
            },
        }));

        // Pour activation auto let's encrypt - pas de cache
        this.app.use('/.well-known', express.static('.well-known', {
            fallthrough: false,
        }));

        /**
         * Pour le DEBUG en local - pas de cache
         */
        if (ConfigurationService.node_configuration.isdev) {
            this.app.use('/node_modules/oswedev/src/', express.static('../oswedev/src/', {
                fallthrough: false,
            }));
        }

        // ???
        this.app.use('/admin/js', express.static('dist/admin/public/js', {
            fallthrough: false,
        }));

        // A priori à supprimer....
        this.app.use('/js', express.static('client/js', {
            fallthrough: false,
        }));
        this.app.use('/css', express.static('client/css', {
            fallthrough: false,
        }));
        this.app.use('/temp', express.static('temp', {
            fallthrough: false,
        }));
        this.app.use('/admin/temp', express.static('temp', {
            fallthrough: false,
        }));
        /// .........
    }

    /**
     * Pas trouvé à faire une route récursive propre, on limite à 7 sous-reps
     */
    private async sfiles_middleware(req: Request, res: Response, next: NextFunction) {
        const folders = (req.params.folder1 ? req.params.folder1 + '/' + (
            req.params.folder2 ? req.params.folder2 + '/' + (
                req.params.folder3 ? req.params.folder3 + '/' + (
                    req.params.folder4 ? req.params.folder4 + '/' + (
                        req.params.folder5 ? req.params.folder5 + '/' + (
                            req.params.folder6 ? req.params.folder6 + '/' + (
                                req.params.folder7 ? req.params.folder7 + '/' : ''
                            ) : ''
                        ) : ''
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

        file = await query(FileVO.API_TYPE_ID)
            .filter_is_true(field_names<FileVO>().is_secured)
            .filter_by_text_eq(field_names<FileVO>().path, ModuleFile.SECURED_FILES_ROOT + folders + file_name)
            .exec_as_server()
            .select_vo<FileVO>();
        has_access = (file && file.file_access_policy_name) ?
            await StackContext.runPromise(
                await ServerExpressController.getInstance().getStackContextFromReq(req, session.id, session.sid, session.uid),
                AccessPolicyServerController.checkAccessSync,
                AccessPolicyServerController,
                file.file_access_policy_name
            ) : false;

        if (!has_access) {

            await ServerBase.getInstance().redirect_login_or_home(req, res, session.uid);
            return;
        }
        res.sendFile(path.resolve(file.path));
    }

    /**
     * Pas trouvé à faire une route récursive propre, on limite à 7 sous-reps
     */
    private async files_middleware(req: Request, res: Response, next: NextFunction) {
        const folders = (req.params.folder1 ? req.params.folder1 + '/' + (
            req.params.folder2 ? req.params.folder2 + '/' + (
                req.params.folder3 ? req.params.folder3 + '/' + (
                    req.params.folder4 ? req.params.folder4 + '/' + (
                        req.params.folder5 ? req.params.folder5 + '/' + (
                            req.params.folder6 ? req.params.folder6 + '/' + (
                                req.params.folder7 ? req.params.folder7 + '/' : ''
                            ) : ''
                        ) : ''
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

        let file: FileVO = null;

        file = await query(FileVO.API_TYPE_ID)
            .filter_is_true(field_names<FileVO>().is_secured)
            .filter_by_text_eq(field_names<FileVO>().path, ModuleFile.SECURED_FILES_ROOT + folders + file_name)
            .exec_as_server()
            .select_vo<FileVO>();

        /**
         * Gestion de l'archivage des fichiers /files
         */
        if (file && file.is_archived && file.archive_path) {

            // On doit charger le fichier avec fs.promises.readFile et le renvoyer
            //  readFile a été modifié pour réaliser du stream depuis le zip en cas d'archivage ce qui est le cas ici, donc on peut le renvoyer directement
            const archive_path = file.archive_path;

            const archive_file = await fs.promises.readFile(archive_path);

            // On déduit le type mime de l'extension du fichier
            const mime_type = mime.getType(file_name);
            res.setHeader('Content-Type', mime_type);
            res.setHeader('Content-Length', archive_file.length);
            res.setHeader('Content-Disposition', 'attachment; filename=' + file_name);
            res.end(archive_file);

            return;
        }

        res.sendFile(path.resolve(file.path));
    }


    private apply_middlewares(middlewares_by_urls_and_methdods: { [url: string]: { [method: string]: ((req: Request, res: Response, next: NextFunction) => void)[] } }) {
        for (const method_s in middlewares_by_urls_and_methdods) {
            const method = parseInt(method_s);
            const middlewares_by_urls = middlewares_by_urls_and_methdods[method];

            for (const url in middlewares_by_urls) {
                const middlewares = middlewares_by_urls[url];

                switch (method) {
                    case APIDefinition.API_TYPE_GET:
                        this.app.get(url, middlewares);
                        break;
                    case APIDefinition.API_TYPE_POST:
                        this.app.post(url, middlewares);
                        break;
                    default:
                        throw new Error('Unsupported method: ' + method);
                }
            }
        }
    }

    // private response_time_middleware(req: Request, res: Response, next: NextFunction) {
    //     return responseTime(async (req, res, time) => {
    //         const url = req.originalUrl;
    //         const method = req.method;
    //         const status = res.statusCode;

    //         const log = `${method} ${url} ${status} ${time.toFixed(3)} ms`;

    //         // let cleaned_url = req.url.toLowerCase()
    //         //     .replace(/[:.]/g, '')
    //         //     .replace(/\//g, '_');

    //         StatsController.register_stat_DUREE('express', method, status, time);
    //         StatsController.register_stat_COMPTEUR('express', method, status);

    //         if (status >= 500) {
    //             ConsoleHandler.error(log);
    //         } else if (status >= 400) {
    //             ConsoleHandler.warn(log);
    //         } else {

    //             /**
    //              * On stocke les requêtes par :
    //              *  - par méthode
    //              *  - par status
    //              *  - par temps de réponse - en 2 catégories : toutes les requêtes et les requêtes qui ont pris plus de 1s (paramétrable)
    //              */
    //             const slow_queries_limit = await ParamsServerController.getParamValueAsInt(
    //                 ServerBase.SLOW_EXPRESS_QUERY_LIMIT_MS_PARAM_NAME, 1000, 300000
    //             );
    //             if (time > slow_queries_limit) {
    //                 StatsController.register_stat_COMPTEUR('express', method, 'slow');
    //             }
    //         }
    //     });
    // }

    private async check_origin_or_referer_middleware(req: Request, res: Response, next): Promise<void> {
        const origin = (req.headers.origin || req.headers.referer) as string;

        if (!origin) {
            next();
            return;
        }

        // On prend le domaine du static env + les parteners osélia
        const authorized_origins: string[] = [
            new URL(ConfigurationService.node_configuration.base_url).hostname,
        ];
        // On se laisse 10 minutes pour recharger les partenaires
        const oselia_parteners: OseliaReferrerVO[] = await query(OseliaReferrerVO.API_TYPE_ID).set_max_age_ms(1000 * 60 * 10).exec_as_server().select_vos<OseliaReferrerVO>();
        for (const i in oselia_parteners) {
            authorized_origins.push(oselia_parteners[i].referrer_origin);
        }

        const origin_hostname = origin ? new URL(origin).hostname : null;
        if (!(origin && authorized_origins.indexOf(origin_hostname) >= 0)) {
            res.status(403).send('Forbidden - Invalid Origin');
            return;
        }

        next();
    }


    private async client_home_middleware(req: Request, res: Response) {

        const session: IServerUserSession = req.session as IServerUserSession;

        // On va regarder si la personne essaye d'y accéder en direct
        // Si c'est le cas, on considère que la personne peut ne pas avoir accès et donc sa session ne sera pas supprimée
        let can_fail: boolean = true;

        if (req && req.headers && req.headers.referer) {
            can_fail = false;
        }

        const has_access: boolean =
            await StackContext.runPromise(
                await ServerExpressController.getInstance().getStackContextFromReq(req, session.id, session.sid, session.uid),
                AccessPolicyServerController.checkAccessSync,
                AccessPolicyServerController,
                ModuleAccessPolicy.POLICY_FO_ACCESS,
                can_fail);

        if (!has_access) {
            await ServerBase.getInstance().redirect_login_or_home(req, res, session.uid);
            return;
        }

        res.sendFile(path.resolve('./dist/public/index.html'));
    }

    private async admin_home_middleware(req: Request, res: Response) {

        const session: IServerUserSession = req.session as IServerUserSession;

        // On va regarder si la personne essaye d'y accéder en direct
        // Si c'est le cas, on considère que la personne peut ne pas avoir accès et donc sa session ne sera pas supprimée
        let can_fail: boolean = true;

        if (req && req.headers && req.headers.referer) {
            can_fail = false;
        }

        const has_access: boolean =
            await StackContext.runPromise(
                await ServerExpressController.getInstance().getStackContextFromReq(req, session.id, session.sid, session.uid),
                AccessPolicyServerController.checkAccessSync,
                AccessPolicyServerController,
                ModuleAccessPolicy.POLICY_BO_ACCESS,
                can_fail);

        if (!has_access) {

            await ServerBase.getInstance().redirect_login_or_home(req, res, session.uid, '/');
            return;
        }
        res.sendFile(path.resolve('./dist/public/admin.html'));
    }

    private async reflect_header_middleware(req: Request, res: Response, next: NextFunction) {
        const result = JSON.stringify(req.headers);
        res.send(result);

        // On stocke le log de connexion en base
        let session: IServerUserSession = req ? req.session as IServerUserSession : null;

        if (session && session.uid) {
            const uid: number = session.uid;

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

            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(user_log);
        }
    }

    private pre_init_session_middleware(req: Request, res: Response, next: NextFunction) {
        // JNE : Ajout du header no cache sur les requetes gérées par express
        res.setHeader("cache-control", "no-cache");
        // !JNE : Ajout du header no cache sur les requetes gérées par express

        /**
         * On tente de récupérer un ID unique de session en request, et si on en trouve, on essaie de charger la session correspondante
         * cf : https://stackoverflow.com/questions/29425070/is-it-possible-to-get-an-express-session-by-sessionid
         */
        const sid = req.query.sessionid;
        if (!sid) {
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
    }

    private async post_init_session_middleware(req: Request, res: Response, next: NextFunction) {
        try {
            const sid = res.req.cookies['sid'];

            if (sid) {
                req.session.sid = sid;
            }
        } catch (error) {
            //
        }


        /**
         * On ajoute un contrôle de la version du client et si il se co avec une version trop ancienne on lui demande de reload
         */
        if (req.headers.version) {
            const client_version = req.headers.version as string;
            const server_version = this.getVersion();

            if (client_version != server_version) {

                const server_app_version_timestamp_str: string = server_version.split('-')[1];
                const server_app_version_timestamp: number = server_app_version_timestamp_str?.length ? parseInt(server_app_version_timestamp_str) : null;

                const local_app_version_timestamp_str: string = client_version.split('-')[1];
                const local_app_version_timestamp: number = local_app_version_timestamp_str?.length ? parseInt(local_app_version_timestamp_str) : null;

                // if (server_app_version_timestamp && local_app_version_timestamp && (local_app_version_timestamp > server_app_version_timestamp)) {
                // } else {

                if ((!server_app_version_timestamp) || (!local_app_version_timestamp) || (local_app_version_timestamp <= server_app_version_timestamp)) {
                    ConsoleHandler.log("[CLIENT]:" + client_version + " != " + server_version);

                    const uid = req.session ? req.session.uid : null;
                    const client_tab_id = req.headers ? req.headers.client_tab_id as string : null;

                    if (uid && client_tab_id) {
                        StatsController.register_stat_COMPTEUR('express', 'version', 'reload');
                        ConsoleHandler.log("ServerExpressController:version:uid:" + uid + ":client_tab_id:" + client_tab_id + ": asking for reload");
                        await PushDataServerController.notifyTabReload(uid, client_tab_id);
                    }

                    res.setHeader("cache-control", "no-cache");
                    res.status(426).send("Version mismatch, please reload your browser");
                    return;
                }
            }
        }

        // On rajoute un middleware pour stocker l'info de la last use tab_id par user
        const uid = req.session ? req.session.uid : null;
        const client_tab_id = req.headers ? req.headers.client_tab_id as string : null;

        if (uid && client_tab_id) {
            PushDataServerController.last_known_tab_id_by_user_id[uid] = client_tab_id;
        }


        // Middleware pour définir dynamiquement les en-têtes X-Frame-Options
        let origin = req.get('Origin');
        if ((!origin) || !(origin.length)) {
            origin = req.get('Referer');
        }

        if (!/^(https?:\/\/[^/]+\/).*/i.test(origin)) {
            origin = origin + '/';
        }

        // On veut que la partie de l'URL qui nous intéresse (https://www.monsite.com) et pas le reste
        origin = origin.replace(/^(https?:\/\/[^/]+)\/?.*/i, '$1');

        if (origin && (ConfigurationService.node_configuration.base_url.toLowerCase().startsWith(origin.toLowerCase()) || OseliaServerController.has_authorization(origin))) {
            res.setHeader('X-Frame-Options', `ALLOW-FROM ${origin}`);

            if (ConfigurationService.node_configuration.debug_oselia_referrer_origin) {
                ConsoleHandler.log("ServerExpressController:origin:" + origin + ":X-Frame-Options:ALLOW-FROM");
            }

        } else {
            res.setHeader('X-Frame-Options', 'DENY');

            if (ConfigurationService.node_configuration.debug_oselia_referrer_origin) {
                ConsoleHandler.log("ServerExpressController:origin:" + origin + ":X-Frame-Options:DENY");
            }
        }

        // allow cors
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Origin', (req.headers.origin ? req.headers.origin.toString() : ""));
        res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');





        // Suite de la gestion de la session
        let session: IServerUserSession = null;
        if (req && !!req.session) {
            session = req.session as IServerUserSession;

            if (!!session) {
                await PushDataServerController.registerSession(session);
            }

            if (!session.returning) {
                // session was just created
                session.returning = true;
                session.creation_date_unix = Dates.now();
            } else {

                // old session - on check qu'on doit pas invalider
                if ((!session.last_check_session_validity) ||
                    (Dates.now() >= session.last_check_session_validity + 60)) {

                    session.last_check_session_validity = Dates.now();

                    if (!this.check_session_validity(session)) {
                        await ConsoleHandler.warn('unregisterSession:!check_session_validity:UID:' + session.uid);

                        await PushDataServerController.unregisterSession(session.sid);
                        session.destroy(async () => {
                            await ServerBase.getInstance().redirect_login_or_home(req, res, session.uid);
                        });
                    }
                }
            }
        }

        if (session && session.uid) {

            if ((!session.last_check_blocked_or_expired) ||
                (Dates.now() >= (session.last_check_blocked_or_expired + 60))) {

                session.last_check_blocked_or_expired = Dates.now();
                session.save(() => { });

                // On doit vérifier que le compte est ni bloqué ni expiré
                const user = await query(UserVO.API_TYPE_ID).filter_by_id(session.uid).exec_as_server().set_max_age_ms(60000).select_vo<UserVO>();

                if ((!user) || user.blocked || user.invalidated) {

                    await ConsoleHandler.warn('unregisterSession:last_check_blocked_or_expired:UID:' + session.uid + ':user:' + (user ? JSON.stringify(user) : 'N/A'));

                    await PushDataServerController.unregisterSession(session.sid);
                    session.destroy(async () => {
                        await ServerBase.getInstance().redirect_login_or_home(req, res, session.uid);
                    });
                }
            }

            if (MaintenanceServerController.getInstance().has_planned_maintenance) {
                await MaintenanceServerController.getInstance().inform_user_on_request(session.uid);
            }

            if (EnvHandler.node_verbose) {
                ConsoleHandler.log('REQUETE: ' + req.url + ' | USER ID: ' + session.uid + ' | BODY: ' + JSON.stringify(req.body));
            }
        }


        next();
    }

    // private async csrf_middleware(req: Request, res: Response, next: NextFunction) {

    //     /**
    //      * On stocke dans la session l'info de la date de chargement de l'application
    //      */
    //     let session: IServerUserSession = null;
    //     if (req && req.session) {
    //         session = req.session as IServerUserSession;

    //         session.last_load_date_unix = Dates.now();
    //     }

    //     if (session && session.uid) {
    //         const uid: number = session.uid;

    //         // On doit vérifier que le compte est ni bloqué ni expiré
    //         const user = await query(UserVO.API_TYPE_ID).filter_by_id(session.uid).exec_as_server().set_max_age_ms(60000).select_vo<UserVO>();
    //         if ((!user) || user.blocked || user.invalidated) {

    //             await ConsoleHandler.warn('unregisterSession:getcsrftoken:UID:' + session.uid + ':user:' + (user ? JSON.stringify(user) : 'N/A'));

    //             await PushDataServerController.unregisterSession(session.sid);
    //             session.destroy(async () => {
    //                 await ServerBase.getInstance().redirect_login_or_home(req, res, session.uid);
    //             });
    //             return;
    //         }
    //         session.last_check_blocked_or_expired = Dates.now();

    //         await PushDataServerController.registerSession(session);

    //         // On stocke le log de connexion en base
    //         const user_log: UserLogVO = new UserLogVO();
    //         user_log.user_id = uid;
    //         user_log.log_time = Dates.now();
    //         user_log.impersonated = false;
    //         user_log.referer = req.headers.referer;
    //         user_log.log_type = UserLogVO.LOG_TYPE_CSRF_REQUEST;

    //         /**
    //          * Gestion du impersonate
    //          */
    //         user_log.handle_impersonation(session);

    //         await ModuleDAOServer.instance.insertOrUpdateVO_as_server(user_log);
    //     }

    //     return res.json({ csrfToken: (req as any).csrfToken() });
    // }

    private async redirect_fragmented_url(req: Request, res: Response, next: NextFunction) {

        /**
                * On ajoute un comportement pour pouvoir rediriger correctement après un login par exemple
                * et de manière plus générale on fourni une URL sans fragment à toutes les urls fragmentées
                * en faisant une redirection temporaire de /f/[...] vers /#/[...]
                */
        if (req.url.indexOf('/f/') >= 0) {
            // req.session.last_fragmented_url = req.url;
            // à creuser mais si on stocke ici en session, ça pose des pbs ensuite quand on logas, ... et je suppode que le /f/ résoud le pb en fait directement donc j'aurai tendance à voir si on peut pas le supprimer tout simplement...

            if (ConfigurationService.node_configuration.log_login_redirects) {
                ConsoleHandler.log('ServerBase:redirect_login_or_home:redirecting:' + req.url + ' to ' + req.url.replace(/\/f\//, '/#/'));
            }

            res.redirect(307, req
                .url
                .replace(/\/f\//, '/#/'));

            // Osef non ?
            // if (!req.session) {
            //     ConsoleHandler.error('ServerBase:redirect_login_or_home:No session');
            //     return;
            // }

            return;
        }

        next();
    }

    private async logout_middleware(req, res) {

        if (req?.session?.sid) {
            await ModuleAccessPolicyServer.getInstance().logout_sid(req.session.sid);
        } else {
            ConsoleHandler.error('ServerExpressController:logout:no session to logout:' + JSON.stringify(req.session));
        }

        // await ThreadHandler.sleep(1000);
        // res.redirect('/');

        const PARAM_TECH_DISCONNECT_URL: string = await ParamsServerController.getParamValueAsString(ModulePushData.PARAM_TECH_DISCONNECT_URL);

        if (ConfigurationService.node_configuration.log_login_redirects) {
            ConsoleHandler.log('ServerBase:redirect_login_or_home:redirecting:logout to ' + PARAM_TECH_DISCONNECT_URL);
        }

        res.redirect(PARAM_TECH_DISCONNECT_URL);
    }

    private async clientappcontrollerinit_middleware(req, res) {

        const session = req.session;

        const user: UserVO = (session && session.uid) ? await query(UserVO.API_TYPE_ID).filter_by_id(session.uid).exec_as_server().select_vo<UserVO>() : null;

        res.json(JSON.stringify(
            {
                data_version: ServerBase.getInstance().version,
                data_user: user,
                data_ui_debug: ServerBase.getInstance().uiDebug,
                // data_base_api_url: "",
                data_default_locale: ServerBase.getInstance().envParam.default_locale
            }
        ));
    }

    private async adminappcontrollerinit_middleware(req, res) {
        const session = req.session;

        const user: UserVO = (session && session.uid) ? await query(UserVO.API_TYPE_ID).filter_by_id(session.uid).exec_as_server().select_vo<UserVO>() : null;

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
    }

    private async cron_middleware(req, res) {

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

                await StackContext.exec_as_server(CronServerController.getInstance().executeWorkers, CronServerController.getInstance(), true);
                res.json();
            } catch (err) {
                ConsoleHandler.error("error: " + (err.message || err));
                return res.status(500).send(err.message || err);
            }
        }
    }

    private async thread_alive_middleware(req, res) {
        let uid = req.params.uid;

        if (!uid) {
            return res.status(404).send('Pas de uid envoyé');
        }

        let fork: IFork = ForkServerController.forks[uid];

        if (!fork) {
            return res.status(404).send('Pas de fork trouvé pour uid: ' + uid);
        }

        let check_process: boolean = false;

        for (let i in fork.processes) {
            let process = fork.processes[i];

            if (process.type != BGThreadServerDataManager.ForkedProcessType) {
                continue;
            }

            let thrower = (error) => {
                ConsoleHandler.error('API thread_alive:' + error);
                return res.status(500).send(false);
            };
            let resolver = async (res_resolver) => {
                return res.status(200).send(res_resolver);
            };

            await ForkedTasksController.exec_self_on_bgthread_and_return_value(
                false,
                thrower,
                process.name,
                BGThreadServerController.TASK_NAME_is_alive,
                resolver,
            );

            check_process = true;

            break;
        }

        if (check_process) {
            return;
        }

        let msg = new PingForkMessage(fork.uid);

        let is_alive: boolean = await ForkMessageController.send(msg, fork.worker, fork);

        return res.status(200).send(is_alive);
    }

    // Génération à la volée des images en fonction du format demandé
    private async resizable_images_middleware(req: Request, res: Response, next: NextFunction) {
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

    /* istanbul ignore next: nothing to test here */
    protected abstract initializeDataImports();
    /* istanbul ignore next: nothing to test here */
    protected abstract hook_configure_express();
    /* istanbul ignore next: nothing to test here */

    protected abstract getVersion();
}
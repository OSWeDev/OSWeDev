import cookie from 'cookie';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import IServerUserSession from '../../../../shared/modules/AccessPolicy/vos/IServerUserSession';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../../env/ConfigurationService';
import ServerBaseConfHolder from '../../../ServerBaseConfHolder';
import ServerExpressController from '../../../ServerExpressController';
import LoadBalancedBGThreadBase from '../../BGThread/LoadBalancedBGThreadBase';
import ExpressDBSessionsServerController from '../../ExpressDBSessions/ExpressDBSessionsServerController';
import ModulePushDataServer from '../../PushData/ModulePushDataServer';
import PushDataServerController from '../../PushData/PushDataServerController';
import APIBGThreadBaseNameHolder from './APIBGThreadBaseNameHolder';

/**
 * On déclare le BGThgread des APIs, qui est un LoadBalancedBGThreadBase, et qui instancie un server http et un socket.io
 * pour chaque worker load balancé, on aura côté client un socket dédié à ce worker.
 */
export default class APIBGThread extends LoadBalancedBGThreadBase {

    private static instance: APIBGThread = null;

    public current_timeout: number = 1;
    public MAX_timeout: number = 3000000;
    public MIN_timeout: number = 1;

    private initialized: boolean = false;

    public constructor() {
        super();
    }

    get base_name(): string {
        return APIBGThreadBaseNameHolder.BGTHREAD_name;
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!APIBGThread.instance) {
            APIBGThread.instance = new APIBGThread();
            // On doit aussi instantier ServerExpressController pour que les tâches soient enregistrées
            ServerExpressController.getInstance();
        }
        return APIBGThread.instance;
    }

    public async work(): Promise<number> {

        if (this.initialized) {
            return 1000;
        }

        this.initialized = true;

        const server = createServer();

        let origin = ConfigurationService.node_configuration.base_url;
        if (origin.endsWith('/')) {
            origin = origin.substring(0, origin.length - 1);
        }

        const io = new Server(server, {
            /**
             * Le socket est établi par le site web :
             *  ConfigurationService.node_configuration.base_url: exemple d'une adresse type en test : 'http://localhost:49407/',
             *  Le port du worker est différent du port qui est dans ConfigurationService.node_configuration.base_url.
             * On doit donc autoriser le CORS pour que le site web puisse se connecter au worker.
             */
            cors: {
                origin, /*, methods: ['GET', 'POST']*/
                credentials: true,
            },
        });

        ServerBaseConfHolder.io = io;

        const sessionStore = ExpressDBSessionsServerController.getInstance({
            conString: ConfigurationService.node_configuration.connection_string,
            schemaName: 'ref',
            tableName: 'module_expressdbsessions_express_session', // En dur pour le chargement de l'appli
        });

        io.use(async (socket, next) => {
            const cookies = cookie.parse(socket.handshake.headers.cookie || '');
            const signedCookie = cookies['sid']; // "sid" est le nom de ton cookie de session Express actuel
            const sessionId = cookieParser.signedCookie(signedCookie, ConfigurationService.node_configuration.express_secret);

            if (!sessionId) return next(new Error('No session cookie'));

            try {
                const session = await new Promise((resolve, reject) => {
                    sessionStore.get(sessionId, (err, sess) => {
                        if (err || !sess) reject(err || new Error('Session not found'));
                        else resolve(sess);
                    });
                });

                socket.data.session = session; // accessible ensuite via socket.data.session
                socket.data.session.id = sessionId;
                next();
            } catch (e) {
                next(new Error('Session invalid'));
            }
        });

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

        server.listen(ServerBaseConfHolder.port);

        // res.header('Access-Control-Allow-Credentials', 'true');
        // res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
        // res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');


        ConsoleHandler.log('APIBGThread: listening on port ' + ServerBaseConfHolder.port + ' for socket.io');
        // ServerBase.getInstance().app.listen(ServerBaseConfHolder.port);

        // SocketIO
        // let io = socketIO.listen(ServerBase.getInstance().app);
        //turn off debug
        // io.set('log level', 1);
        // define interactions with client

        io.on('connection', function (socket: Socket) {
            const session: IServerUserSession = socket.data.session;

            if (!session) {
                ConsoleHandler.error('Impossible de charger la session dans SocketIO');
                return;
            }

            PushDataServerController.registerSocket(session, socket);
        });

        io.on('disconnect', function (socket: Socket) {
            const session: IServerUserSession = socket.data.session;

            PushDataServerController.unregisterSocket(session, socket);
        });

        io.on('error', function (err) {
            ConsoleHandler.error("IO nearly failed: " + err.stack);
        });

        return 1000;
    }
}
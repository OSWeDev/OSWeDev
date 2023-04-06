import ModuleExpressDBSessions from '../../../shared/modules/ExpressDBSessions/ModuleExpressDBSessions';
import ModuleServerBase from '../ModuleServerBase';
import ExpressDBSessionsWorkersHandler from './ExpressDBSessionsWorkersHandler';

export default class ModuleExpressDBSessionServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleExpressDBSessionServer.instance) {
            ModuleExpressDBSessionServer.instance = new ModuleExpressDBSessionServer();
        }
        return ModuleExpressDBSessionServer.instance;
    }

    private static instance: ModuleExpressDBSessionServer = null;

    private constructor() {
        super(ModuleExpressDBSessions.getInstance().name);
    }

    public registerCrons(): void {
        ExpressDBSessionsWorkersHandler.getInstance();
    }
}
import ModuleExpressDBSessions from '../../../shared/modules/ExpressDBSessions/ModuleExpressDBSessions';
import ModuleServerBase from '../ModuleServerBase';
import ExpressDBSessionsWorkersHandler from './ExpressDBSessionsWorkersHandler';

export default class ModuleExpressDBSessionServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleExpressDBSessionServer.instance) {
            ModuleExpressDBSessionServer.instance = new ModuleExpressDBSessionServer();
        }
        return ModuleExpressDBSessionServer.instance;
    }

    private static instance: ModuleExpressDBSessionServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleExpressDBSessions.getInstance().name);
    }

    // istanbul ignore next: cannot test registerCrons
    public registerCrons(): void {
        ExpressDBSessionsWorkersHandler.getInstance();
    }
}
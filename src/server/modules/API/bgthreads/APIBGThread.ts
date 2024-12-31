import ServerExpressController from '../../../ServerExpressController';
import IBGThread from '../../BGThread/interfaces/IBGThread';

/**
 * Coquille vide pour init un thread dédié au traitement de base des APIs
 */
export default class APIBGThread implements IBGThread {

    public static BGTHREAD_name: string = 'APIBGThread';
    private static instance: APIBGThread = null;

    public current_timeout: number = 60000;
    public MAX_timeout: number = 300000;
    public MIN_timeout: number = 60000;

    public exec_in_dedicated_thread: boolean = false;

    private constructor() {
    }

    get name(): string {
        return APIBGThread.BGTHREAD_name;
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
        return null;
    }
}
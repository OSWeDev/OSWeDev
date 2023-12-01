import ModuleServerBase from '../../ModuleServerBase';
import ModuleAbonnement from '../../../../shared/modules/Commerce/Abonnement/ModuleAbonnement';

export default class ModuleAbonnementServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleAbonnementServer.instance) {
            ModuleAbonnementServer.instance = new ModuleAbonnementServer();
        }
        return ModuleAbonnementServer.instance;
    }

    private static instance: ModuleAbonnementServer = null;

    constructor() {
        super(ModuleAbonnement.getInstance().name);
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
    }
}
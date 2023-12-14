import ModuleServerBase from '../../ModuleServerBase';
import ModulePaiement from '../../../../shared/modules/Commerce/Paiement/ModulePaiement';

export default class ModulePaiementServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModulePaiementServer.instance) {
            ModulePaiementServer.instance = new ModulePaiementServer();
        }
        return ModulePaiementServer.instance;
    }

    private static instance: ModulePaiementServer = null;

    constructor() {
        super(ModulePaiement.getInstance().name);
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
    }
}
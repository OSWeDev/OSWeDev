import ModuleServerBase from '../../ModuleServerBase';
import ModulePaiement from '../../../../shared/modules/Commerce/Paiement/ModulePaiement';

export default class ModulePaiementServer extends ModuleServerBase {

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

    public registerServerApiHandlers() {
    }
}
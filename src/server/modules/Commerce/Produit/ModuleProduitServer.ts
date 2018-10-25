import ModuleServerBase from '../../ModuleServerBase';
import ModuleProduit from '../../../../shared/modules/Commerce/Produit/ModuleProduit';

export default class ModuleProduitServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleProduitServer.instance) {
            ModuleProduitServer.instance = new ModuleProduitServer();
        }
        return ModuleProduitServer.instance;
    }

    private static instance: ModuleProduitServer = null;

    constructor() {
        super(ModuleProduit.getInstance().name);
    }

    public registerServerApiHandlers() {
    }
}
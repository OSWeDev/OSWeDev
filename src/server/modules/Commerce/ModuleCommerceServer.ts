import ModuleServerBase from '../ModuleServerBase';
import ModuleCommerce from '../../../shared/modules/Commerce/ModuleCommerce';
import ModuleCommandeServer from './Commande/ModuleCommandeServer';

export default class ModuleCommerceServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleCommerceServer.instance) {
            ModuleCommerceServer.instance = new ModuleCommerceServer();
        }
        return ModuleCommerceServer.instance;
    }

    private static instance: ModuleCommerceServer = null;

    constructor() {
        super(ModuleCommerce.getInstance().name);
    }

    public registerServerApiHandlers() { }
}
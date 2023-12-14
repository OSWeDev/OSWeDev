import ModuleServerBase from '../ModuleServerBase';
import ModuleCommerce from '../../../shared/modules/Commerce/ModuleCommerce';

export default class ModuleCommerceServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
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

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() { }
}
import ModuleServerBase from '../../ModuleServerBase';
import ModuleService from '../../../../shared/modules/Commerce/Service/ModuleService';

export default class ModuleServiceServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleServiceServer.instance) {
            ModuleServiceServer.instance = new ModuleServiceServer();
        }
        return ModuleServiceServer.instance;
    }

    private static instance: ModuleServiceServer = null;

    constructor() {
        super(ModuleService.getInstance().name);
    }

    public registerServerApiHandlers() {
    }
}
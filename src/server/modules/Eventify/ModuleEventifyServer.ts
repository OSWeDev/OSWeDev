import ModuleEventify from '../../../shared/modules/Eventify/ModuleEventify';
import ModuleServerBase from '../ModuleServerBase';

export default class ModuleEventifyServer extends ModuleServerBase {

    private static instance: ModuleEventifyServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleEventify.getInstance().name);
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleEventifyServer.instance) {
            ModuleEventifyServer.instance = new ModuleEventifyServer();
        }
        return ModuleEventifyServer.instance;
    }

    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> { }

    // istanbul ignore next: cannot test configure
    public async configure() {
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
    }
}
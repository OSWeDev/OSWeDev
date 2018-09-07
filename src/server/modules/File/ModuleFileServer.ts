import ModuleFile from '../../../shared/modules/File/ModuleFile';
import ModuleServerBase from '../ModuleServerBase';

export default class ModuleFileServer extends ModuleServerBase {

    public static getInstance(): ModuleFileServer {
        if (!ModuleFileServer.instance) {
            ModuleFileServer.instance = new ModuleFileServer();
        }
        return ModuleFileServer.instance;
    }

    private static instance: ModuleFileServer = null;

    private constructor() {
        super(ModuleFile.getInstance().name);
    }
}
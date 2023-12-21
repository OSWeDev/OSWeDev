import ModuleTeamsAPI from '../../../shared/modules/TeamsAPI/ModuleTeamsAPI';
import ModuleServerBase from '../ModuleServerBase';

export default class ModuleTeamsAPIServer extends ModuleServerBase {

    public static TEAMS_HOST_PARAM_NAME: string = 'TEAMS_HOST';

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleTeamsAPIServer.instance) {
            ModuleTeamsAPIServer.instance = new ModuleTeamsAPIServer();
        }
        return ModuleTeamsAPIServer.instance;
    }

    private static instance: ModuleTeamsAPIServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleTeamsAPI.getInstance().name);
    }

    // istanbul ignore next: cannot test configure
    public async configure() {
    }
}
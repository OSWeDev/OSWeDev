import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ModuleRequest from '../../../shared/modules/Request/ModuleRequest';
import ModuleTeamsAPI from '../../../shared/modules/TeamsAPI/ModuleTeamsAPI';
import TeamsWebhookContentSectionVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentSectionVO';
import TeamsWebhookContentVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import TextHandler from '../../../shared/tools/TextHandler';
import ConfigurationService from '../../env/ConfigurationService';
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
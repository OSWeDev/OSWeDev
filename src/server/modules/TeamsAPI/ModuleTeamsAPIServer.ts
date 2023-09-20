import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ModuleRequest from '../../../shared/modules/Request/ModuleRequest';
import ModuleTeamsAPI from '../../../shared/modules/TeamsAPI/ModuleTeamsAPI';
import TeamsWebhookContentVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentVO';
import TextHandler from '../../../shared/tools/TextHandler';
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

    public async send_to_teams_webhook(webhook: string, message: TeamsWebhookContentVO) {

        let TEAMS_HOST: string = await ModuleParams.getInstance().getParamValueAsString(ModuleTeamsAPIServer.TEAMS_HOST_PARAM_NAME);
        let msg = TextHandler.getInstance().sanityze_object(message);

        await ModuleRequest.getInstance().sendRequestFromApp(
            ModuleRequest.METHOD_POST,
            TEAMS_HOST,
            webhook,
            msg,
            null,
            true,
            null,
            false,
            true
        );
    }
}
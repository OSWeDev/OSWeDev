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

    public async send_to_teams_webhook(webhook: string, message: TeamsWebhookContentVO) {

        if (ConfigurationService.node_configuration.BLOCK_TEAMS_MESSAGES) {
            ConsoleHandler.log('ModuleTeamsAPIServer.send_to_teams_webhook: BLOCK_TEAMS_MESSAGES in ConfigurationService.node_configuration : Aborting :' + message.title);
            return;
        }

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
            true,
            true
        );
    }

    public async send_teams_error(title: string, message: string, webhook_param_name: string = null, webhook_default_value: string = null) {
        await this.send_teams_level('error', title, message, webhook_param_name, webhook_default_value);
    }

    public async send_teams_info(title: string, message: string, webhook_param_name: string = null, webhook_default_value: string = null) {
        await this.send_teams_level('info', title, message, webhook_param_name, webhook_default_value);
    }

    public async send_teams_warn(title: string, message: string, webhook_param_name: string = null, webhook_default_value: string = null) {
        await this.send_teams_level('warn', title, message, webhook_param_name, webhook_default_value);
    }

    public async send_teams_success(title: string, message: string, webhook_param_name: string = null, webhook_default_value: string = null) {
        await this.send_teams_level('success', title, message, webhook_param_name, webhook_default_value);
    }

    private async send_teams_level(level: string, title: string, message: string, webhook_param_name: string = null, webhook_default_value: string = null) {
        try {
            let webhook: string = webhook_param_name ? await ModuleParams.getInstance().getParamValueAsString(webhook_param_name, webhook_default_value, 180000) :
                ConfigurationService.node_configuration['TEAMS_WEBHOOK__TECH_' + level.toUpperCase()];

            if (webhook) {
                let m: TeamsWebhookContentVO = new TeamsWebhookContentVO();
                m.title = title;
                m.summary = message;
                m.sections.push(
                    new TeamsWebhookContentSectionVO().set_text(message)
                        .set_activityImage(ConfigurationService.node_configuration.BASE_URL + "public/vuejsclient/img/" + level.toLowerCase() + ".png")
                );

                await this.send_to_teams_webhook(webhook, m);
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    private get_key(level: string, title: string, webhook: string) {
        return level + '_' + title + '_' + webhook;
    }
}
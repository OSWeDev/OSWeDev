import GPTConversationVO from '../../../shared/modules/GPT/vos/GPTConversationVO';
import GPTMessageVO from '../../../shared/modules/GPT/vos/GPTMessageVO';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ModuleRequest from '../../../shared/modules/Request/ModuleRequest';
import TeamsWebhookContentSectionVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentSectionVO';
import TeamsWebhookContentVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import TextHandler from '../../../shared/tools/TextHandler';
import ThrottleHelper from '../../../shared/tools/ThrottleHelper';
import ConfigurationService from '../../env/ConfigurationService';
import ModuleGPTServer from '../GPT/ModuleGPTServer';
import ModuleTeamsAPIServer from './ModuleTeamsAPIServer';
import SendTeamsLevelParam from './SendTeamsLevelParam';

export default class TeamsAPIServerController {

    /**
     * Utiliser uniquement si on ne veut pas de throttling, ou des boutons pour le moment
     *  sinon préférer send_teams_error, send_teams_info, send_teams_warn, send_teams_success
     * @param webhook
     * @param message
     * @returns
     */
    public static async send_to_teams_webhook(webhook: string, message: TeamsWebhookContentVO) {

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

    public static async send_teams_error(title: string, message: string, webhook_param_name: string = null, webhook_default_value: string = null) {
        await TeamsAPIServerController.send_teams_level('error', title, message, webhook_param_name, webhook_default_value);
    }

    public static async send_teams_info(title: string, message: string, webhook_param_name: string = null, webhook_default_value: string = null) {
        await TeamsAPIServerController.send_teams_level('info', title, message, webhook_param_name, webhook_default_value);
    }

    public static async send_teams_warn(title: string, message: string, webhook_param_name: string = null, webhook_default_value: string = null) {
        await TeamsAPIServerController.send_teams_level('warn', title, message, webhook_param_name, webhook_default_value);
    }

    public static async send_teams_success(title: string, message: string, webhook_param_name: string = null, webhook_default_value: string = null) {
        await TeamsAPIServerController.send_teams_level('success', title, message, webhook_param_name, webhook_default_value);
    }

    private static throttle_send_teams = null;

    private static get_throttle_send_teams_level() {
        if (!TeamsAPIServerController.throttle_send_teams) {
            TeamsAPIServerController.throttle_send_teams = ThrottleHelper.declare_throttle_with_stackable_args(TeamsAPIServerController.throttled_send_teams_level, ConfigurationService.node_configuration.TEAMS_WEBHOOK__THROTTLE_MS);
        }
        return TeamsAPIServerController.throttle_send_teams;
    }
    private static async send_teams_level(level: string, title: string, message: string, webhook_param_name: string = null, webhook_default_value: string = null) {
        try {
            let webhook: string = webhook_param_name ? await ModuleParams.getInstance().getParamValueAsString(webhook_param_name, webhook_default_value, 180000) :
                ConfigurationService.node_configuration['TEAMS_WEBHOOK__TECH_' + level.toUpperCase()];

            if (webhook) {

                let param = new SendTeamsLevelParam(level, title, message, webhook);
                await (TeamsAPIServerController.get_throttle_send_teams_level()(param));
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    private static get_key(title: string, webhook: string) {
        return title + '_' + webhook;
    }

    private static async throttled_send_teams_level(params: SendTeamsLevelParam[]) {

        let params_by_key: { [key: string]: SendTeamsLevelParam[] } = {};

        // On n'envoie pas 2 fois le même message
        let messages: { [message: string]: boolean } = {};

        for (let i in params) {
            let param = params[i];

            if (messages[param.message]) {
                continue;
            }
            messages[param.message] = true;

            let key = TeamsAPIServerController.get_key(param.title, param.webhook);

            if (!params_by_key[key]) {
                params_by_key[key] = [];
            }

            params_by_key[key].push(param);
        }

        for (let key in params_by_key) {
            let key_params = params_by_key[key];

            let webhook: string = key_params[0].webhook;
            let level: string = key_params[0].level;
            let title: string = key_params[0].title;

            let m: TeamsWebhookContentVO = new TeamsWebhookContentVO();
            m.title = title;

            let message: string = key_params.map((p) => p.message).join('<br><br>');

            if (message.length > ConfigurationService.node_configuration.TEAMS_WEBHOOK__MESSAGE_MAX_SIZE) {

                if (ConfigurationService.node_configuration.TEAMS_WEBHOOK__MESSAGE_MAX_SIZE_AUTO_SUMMARIZE) {
                    try {

                        let response: GPTMessageVO = await ModuleGPTServer.getInstance().generate_response(new GPTConversationVO(), GPTMessageVO.createNew(
                            GPTMessageVO.GPTMSG_ROLE_TYPE_USER,
                            null,
                            'Ton objectif : Faire un résumé de ce message en moins de ' + (Math.round(ConfigurationService.node_configuration.TEAMS_WEBHOOK__MESSAGE_MAX_SIZE * 0.9)) + ' caractères, formatté en HTML pour envoi dans un channel Teams :\n\n' + message
                        ));
                        message = response.content;
                    } catch (error) {
                        ConsoleHandler.error('Impossible de résumer le message trop long pour Teams via GPT:' + error);
                        message = message.substring(0, ConfigurationService.node_configuration.TEAMS_WEBHOOK__MESSAGE_MAX_SIZE - 3) + '...';
                    }
                } else {
                    message = message.substring(0, ConfigurationService.node_configuration.TEAMS_WEBHOOK__MESSAGE_MAX_SIZE - 3) + '...';
                }
            }

            m.summary = message;
            m.sections.push(
                new TeamsWebhookContentSectionVO().set_text(message)
                    .set_activityImage(ConfigurationService.node_configuration.BASE_URL + "public/vuejsclient/img/" + level.toLowerCase() + ".png")
            );

            await TeamsAPIServerController.send_to_teams_webhook(webhook, m);
        }
    }
}
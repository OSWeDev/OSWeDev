import ActionURLVO from '../../../shared/modules/ActionURL/vos/ActionURLVO';
import TSRange from '../../../shared/modules/DataRender/vos/TSRange';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleOselia from '../../../shared/modules/Oselia/ModuleOselia';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ModuleRequest from '../../../shared/modules/Request/ModuleRequest';
import TeamsWebhookContentActionCardOpenURITargetVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentActionCardOpenURITargetVO';
import TeamsWebhookContentActionCardVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentActionCardVO';
import TeamsWebhookContentSectionVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentSectionVO';
import TeamsWebhookContentVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { reflect } from '../../../shared/tools/ObjectHandler';
import RangeHandler from '../../../shared/tools/RangeHandler';
import TextHandler from '../../../shared/tools/TextHandler';
import ThrottleHelper from '../../../shared/tools/ThrottleHelper';
import ConfigurationService from '../../env/ConfigurationService';
import ActionURLServerTools from '../ActionURL/ActionURLServerTools';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleOseliaServer from '../Oselia/ModuleOseliaServer';
import ModuleTeamsAPIServer from './ModuleTeamsAPIServer';
import SendTeamsLevelParam from './SendTeamsLevelParam';

export default class TeamsAPIServerController {

    private static throttle_send_teams = null;

    /**
     * Utiliser uniquement si on ne veut pas de throttling, ou des boutons pour le moment
     *  sinon préférer send_teams_error, send_teams_info, send_teams_warn, send_teams_success
     * @param webhook
     * @param message
     * @returns
     */
    public static async send_to_teams_webhook(webhook: string, message: TeamsWebhookContentVO) {

        if (ConfigurationService.node_configuration.block_teams_messages) {
            ConsoleHandler.log('ModuleTeamsAPIServer.send_to_teams_webhook: BLOCK_TEAMS_MESSAGES in ConfigurationService.node_configuration : Aborting :' + message.title);
            return;
        }

        const TEAMS_HOST: string = await ModuleParams.getInstance().getParamValueAsString(ModuleTeamsAPIServer.TEAMS_HOST_PARAM_NAME);
        // let msg = TextHandler.getInstance().sanityze_object(message);
        const msg = TextHandler.getInstance().encode_object(message);

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

    // istanbul ignore next: nothing to test : send_teams
    public static async send_teams_oselia_error(title: string, message: string, thread_id: number, webhook_param_name: string = ModuleOselia.WEBHOOK_TEAMS_PARAM_NAME, webhook_default_value: string = null) {
        await TeamsAPIServerController.send_teams_oselia_level('error', title, message, thread_id, webhook_param_name, webhook_default_value);
    }

    // istanbul ignore next: nothing to test : send_teams
    public static async send_teams_oselia_info(title: string, message: string, thread_id: number, webhook_param_name: string = ModuleOselia.WEBHOOK_TEAMS_PARAM_NAME, webhook_default_value: string = null) {
        await TeamsAPIServerController.send_teams_oselia_level('info', title, message, thread_id, webhook_param_name, webhook_default_value);
    }

    // istanbul ignore next: nothing to test : send_teams
    public static async send_teams_oselia_warn(title: string, message: string, thread_id: number, webhook_param_name: string = ModuleOselia.WEBHOOK_TEAMS_PARAM_NAME, webhook_default_value: string = null) {
        await TeamsAPIServerController.send_teams_oselia_level('warn', title, message, thread_id, webhook_param_name, webhook_default_value);
    }

    // istanbul ignore next: nothing to test : send_teams
    public static async send_teams_oselia_success(title: string, message: string, thread_id: number, webhook_param_name: string = ModuleOselia.WEBHOOK_TEAMS_PARAM_NAME, webhook_default_value: string = null) {
        await TeamsAPIServerController.send_teams_oselia_level('success', title, message, thread_id, webhook_param_name, webhook_default_value);
    }


    // istanbul ignore next: nothing to test : send_teams
    public static async send_teams_error(title: string, message: string, webhook_param_name: string = null, webhook_default_value: string = null) {
        await TeamsAPIServerController.send_teams_level('error', title, message, webhook_param_name, webhook_default_value);
    }

    // istanbul ignore next: nothing to test : send_teams
    public static async send_teams_info(title: string, message: string, webhook_param_name: string = null, webhook_default_value: string = null) {
        await TeamsAPIServerController.send_teams_level('info', title, message, webhook_param_name, webhook_default_value);
    }

    // istanbul ignore next: nothing to test : send_teams
    public static async send_teams_warn(title: string, message: string, webhook_param_name: string = null, webhook_default_value: string = null) {
        await TeamsAPIServerController.send_teams_level('warn', title, message, webhook_param_name, webhook_default_value);
    }

    // istanbul ignore next: nothing to test : send_teams
    public static async send_teams_success(title: string, message: string, webhook_param_name: string = null, webhook_default_value: string = null) {
        await TeamsAPIServerController.send_teams_level('success', title, message, webhook_param_name, webhook_default_value);
    }

    // istanbul ignore next: nothing to test : send_teams
    private static async send_teams_oselia_level(level: string, title: string, message: string, thread_id: number, webhook_param_name: string = null, webhook_default_value: string = null) {
        try {
            const webhook: string = webhook_param_name ? await ModuleParams.getInstance().getParamValueAsString(webhook_param_name, webhook_default_value, 180000) :
                ConfigurationService.node_configuration['teams_webhook__oselia_' + level.toLowerCase()];

            if (webhook) {

                const m: TeamsWebhookContentVO = new TeamsWebhookContentVO();
                m.title = title;

                m.summary = message;
                m.sections.push(
                    new TeamsWebhookContentSectionVO().set_text(message)
                        .set_activityImage(ConfigurationService.node_configuration.base_url + "public/vuejsclient/img/" + level.toLowerCase() + ".png")
                );

                const open_oselia: ActionURLVO = await this.create_action_button_open_oselia(thread_id);

                m.potentialAction.push(
                    new TeamsWebhookContentActionCardVO().set_type("OpenUri").set_name('Oselia').set_targets([
                        new TeamsWebhookContentActionCardOpenURITargetVO().set_os('default').set_uri(
                            ActionURLServerTools.get_action_full_url(open_oselia))]));

                await TeamsAPIServerController.send_to_teams_webhook(webhook, m);
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    // istanbul ignore next: nothing to test : send_teams
    private static get_throttle_send_teams_level() {
        if (!TeamsAPIServerController.throttle_send_teams) {
            TeamsAPIServerController.throttle_send_teams = ThrottleHelper.declare_throttle_with_stackable_args(TeamsAPIServerController.throttled_send_teams_level, ConfigurationService.node_configuration.teams_webhook__throttle_ms);
        }
        return TeamsAPIServerController.throttle_send_teams;
    }
    // istanbul ignore next: nothing to test : send_teams
    private static async send_teams_level(level: string, title: string, message: string, webhook_param_name: string = null, webhook_default_value: string = null) {
        try {
            const webhook: string = webhook_param_name ? await ModuleParams.getInstance().getParamValueAsString(webhook_param_name, webhook_default_value, 180000) :
                ConfigurationService.node_configuration['teams_webhook__tech_' + level.toLowerCase()];

            if (webhook) {

                const param = new SendTeamsLevelParam(level, title, message, webhook);
                await (TeamsAPIServerController.get_throttle_send_teams_level()(param));
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    // istanbul ignore next: nothing to test : get_key
    private static get_key(title: string, webhook: string) {
        return title + '_' + webhook;
    }

    // istanbul ignore next: nothing to test : get_key
    private static async throttled_send_teams_level(params: SendTeamsLevelParam[]) {

        const params_by_key: { [key: string]: SendTeamsLevelParam[] } = {};

        // On n'envoie pas 2 fois le même message
        const messages: { [message: string]: boolean } = {};

        for (const i in params) {
            const param = params[i];

            if (messages[param.message]) {
                continue;
            }
            messages[param.message] = true;

            const key = TeamsAPIServerController.get_key(param.title, param.webhook);

            if (!params_by_key[key]) {
                params_by_key[key] = [];
            }

            params_by_key[key].push(param);
        }

        for (const key in params_by_key) {
            const key_params = params_by_key[key];

            const webhook: string = key_params[0].webhook;
            const level: string = key_params[0].level;
            const title: string = key_params[0].title;

            const m: TeamsWebhookContentVO = new TeamsWebhookContentVO();
            m.title = title;

            let message: string = key_params.map((p) => p.message).join('<br><br>');

            if (message.length > ConfigurationService.node_configuration.teams_webhook__message_max_size) {

                // if (ConfigurationService.node_configuration.teams_webhook__message_max_size_auto_summarize) {
                //     try {

                //         // TODO FIXME Passer en assistant et ATTENTION au coût potentiel de cet appel à l'API
                //         const response: GPTCompletionAPIMessageVO = await ModuleGPTServer.getInstance().generate_response(new GPTCompletionAPIConversationVO(), GPTCompletionAPIMessageVO.createNew(
                //             GPTCompletionAPIMessageVO.GPTMSG_ROLE_TYPE_USER,
                //             null,
                //             'Ton objectif : Faire un résumé de ce message en moins de ' + (Math.round(ConfigurationService.node_configuration.teams_webhook__message_max_size * 0.9)) + ' caractères, formatté en HTML pour envoi dans un channel Teams :\n\n' + message
                //         ));
                //         message = response.content;
                //     } catch (error) {
                //         ConsoleHandler.error('Impossible de résumer le message trop long pour Teams via GPT:' + error);
                //         message = message.substring(0, ConfigurationService.node_configuration.teams_webhook__message_max_size - 3) + '...';
                //     }
                // } else {
                message = message.substring(0, ConfigurationService.node_configuration.teams_webhook__message_max_size - 3) + '...';
                // }
            }

            m.summary = message;
            m.sections.push(
                new TeamsWebhookContentSectionVO().set_text(message)
                    .set_activityImage(ConfigurationService.node_configuration.base_url + "public/vuejsclient/img/" + level.toLowerCase() + ".png")
            );

            await TeamsAPIServerController.send_to_teams_webhook(webhook, m);
        }
    }

    private static async create_action_button_open_oselia(thread_id: number): Promise<ActionURLVO> {
        const action = new ActionURLVO();

        action.action_name = 'En parler avec Osélia [' + thread_id + ']';
        action.action_code = ActionURLServerTools.get_unique_code_from_text(action.action_name);
        action.action_remaining_counter = -1; // infini
        action.params_json = thread_id.toString();
        action.valid_ts_range = RangeHandler.createNew(TSRange.RANGE_TYPE, Dates.now(), Dates.add(Dates.now(), 60, TimeSegment.TYPE_DAY), true, true, TimeSegment.TYPE_DAY);

        action.action_callback_function_name = reflect<ModuleOseliaServer>().open_oselia_db_from_action_url;
        action.action_callback_module_name = ModuleOseliaServer.getInstance().name;

        action.button_bootstrap_type = ActionURLVO.BOOTSTRAP_BUTTON_TYPE_PRIMARY;
        action.button_translatable_name = 'TeamsAPIServerController.open_oselia';
        action.button_translatable_name_params_json = null;
        action.button_fc_icon_classnames = ['fa-duotone', 'fa-comment-heart'];

        const res = await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(action);
        if ((!res) || (!res.id)) {
            ConsoleHandler.error('Impossible de créer l\'action URL pour le bouton de discussion avec Osélia : ' + action.action_name);
            return null;
        }

        await ActionURLServerTools.add_right_for_admins_on_action_url(action);

        return action;
    }
}
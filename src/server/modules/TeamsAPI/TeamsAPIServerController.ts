import ActionURLVO from '../../../shared/modules/ActionURL/vos/ActionURLVO';
import TSRange from '../../../shared/modules/DataRender/vos/TSRange';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ModuleRequest from '../../../shared/modules/Request/ModuleRequest';
import TeamsWebhookContentActionOpenUrlVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentActionOpenUrlVO';
import TeamsWebhookContentAdaptiveCardVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentAdaptiveCardVO';
import TeamsWebhookContentAttachmentsVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentAttachmentsVO';
import TeamsWebhookContentImageVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentImageVO';
import TeamsWebhookContentTextBlockVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentTextBlockVO';
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
import SendTeamsLevelParam from './SendTeamsLevelParam';

export default class TeamsAPIServerController {

    private static throttle_send_teams = null;

    /**
     * Utiliser uniquement si on ne veut pas de throttling, ou des boutons pour le moment
     *  sinon préférer send_teams_error, send_teams_info, send_teams_warn, send_teams_success
     * @param group_id
     * @param channel_id
     * @param message
     * @param action_urls On passe les action url pour update le message_id par la suite dessus, et pouvoir modifier/supprimer le message quand on veut
     * @returns le message_id du message créé par la webhook
     */
    public static async send_to_teams_webhook(
        channel_id: string,
        group_id: string,
        message: TeamsWebhookContentVO,
        action_urls: ActionURLVO[] = []
    ): Promise<string> {

        if (ConfigurationService.node_configuration.block_teams_messages) {
            ConsoleHandler.log('ModuleTeamsAPIServer.send_to_teams_webhook: BLOCK_TEAMS_MESSAGES in ConfigurationService.node_configuration : Aborting :' + message.attachments[0].content.body[0]['text'] ? message.attachments[0].content.body[0]['text'] : 'Error');
            return null;
        }

        if ((!group_id) || (!channel_id)) {
            ConsoleHandler.error('TeamsAPIServerController.send_to_teams_webhook:Impossible de trouver le groupe ou le channel pour envoyer le message Teams');
            return null;
        }

        message.groupId = group_id;
        message.channelId = channel_id;

        const send_message_webhook = ConfigurationService.node_configuration.teams_webhook_send_message;
        const { host, path } = this.getHostAndPathFromUrl(send_message_webhook);

        const msg = TextHandler.getInstance().encode_object(message);
        const webhook_response = await ModuleRequest.getInstance().sendRequestFromApp(
            ModuleRequest.METHOD_POST,
            host,
            path,
            msg,
            null,
            true,
            null,
            true,
            true
        );

        try {
            const message = webhook_response.toString('utf-8');
            console.log(message);

            const message_id: string = message.split(': ')[1].trim();
            ConsoleHandler.log('TeamsAPIServerController.send_to_teams_webhook:Réponse de Teams:message_id:' + message_id);

            for (const action_url of action_urls) {
                action_url.teams_message_id = message_id;
                action_url.teams_group_id = group_id;
                action_url.teams_channel_id = channel_id;
            }
            await ModuleDAOServer.getInstance().insertOrUpdateVOs_as_server(action_urls);

            return message_id;
        } catch (error) {
            ConsoleHandler.error('TeamsAPIServerController.send_to_teams_webhook:Impossible de récupérer le messageId du message Teams créé:' + group_id + ':' + channel_id + ':' + JSON.stringify(message) + ':' + error + ':' + JSON.stringify(webhook_response));
            return null;
        }
    }

    // istanbul ignore next: nothing to test : send_teams
    public static async send_teams_oselia_action_needed(title: string, message: string, thread_id: number, actions: TeamsWebhookContentActionOpenUrlVO[] = []) {
        await TeamsAPIServerController.send_teams_oselia_level('action_needed', title, message, thread_id, actions);
    }

    // istanbul ignore next: nothing to test : send_teams
    public static async send_teams_oselia_error(title: string, message: string, thread_id: number, actions: TeamsWebhookContentActionOpenUrlVO[] = []) {
        await TeamsAPIServerController.send_teams_oselia_level('error', title, message, thread_id, actions);
    }

    // istanbul ignore next: nothing to test : send_teams
    public static async send_teams_oselia_info(title: string, message: string, thread_id: number, actions: TeamsWebhookContentActionOpenUrlVO[] = []) {
        await TeamsAPIServerController.send_teams_oselia_level('info', title, message, thread_id, actions);
    }

    // istanbul ignore next: nothing to test : send_teams
    public static async send_teams_oselia_warn(title: string, message: string, thread_id: number, actions: TeamsWebhookContentActionOpenUrlVO[] = []) {
        await TeamsAPIServerController.send_teams_oselia_level('warn', title, message, thread_id, actions);
    }

    // istanbul ignore next: nothing to test : send_teams
    public static async send_teams_oselia_success(title: string, message: string, thread_id: number, actions: TeamsWebhookContentActionOpenUrlVO[] = []) {
        await TeamsAPIServerController.send_teams_oselia_level('success', title, message, thread_id, actions);
    }


    // istanbul ignore next: nothing to test : send_teams
    public static async send_teams_error(
        title: string,
        message: string,
        actions: TeamsWebhookContentActionOpenUrlVO[] = [],
        groupid_param_name: string = null,
        groupid_default_value: string = null,
        channelid_param_name: string = null,
        channelid_default_value: string = null,
        message_size: string = 'default'
    ) {
        await TeamsAPIServerController.send_teams_level('error', title, message, actions, groupid_param_name, groupid_default_value, channelid_param_name, channelid_default_value, message_size);
    }

    // istanbul ignore next: nothing to test : send_teams
    public static async send_teams_info(
        title: string,
        message: string,
        actions: TeamsWebhookContentActionOpenUrlVO[] = [],
        groupid_param_name: string = null,
        groupid_default_value: string = null,
        channelid_param_name: string = null,
        channelid_default_value: string = null,
        message_size: string = 'default'
    ) {
        await TeamsAPIServerController.send_teams_level('info', title, message, actions, groupid_param_name, groupid_default_value, channelid_param_name, channelid_default_value, message_size);
    }

    // istanbul ignore next: nothing to test : send_teams
    public static async send_teams_warn(
        title: string,
        message: string,
        actions: TeamsWebhookContentActionOpenUrlVO[] = [],
        groupid_param_name: string = null,
        groupid_default_value: string = null,
        channelid_param_name: string = null,
        channelid_default_value: string = null,
        message_size: string = 'default'
    ) {
        await TeamsAPIServerController.send_teams_level('warn', title, message, actions, groupid_param_name, groupid_default_value, channelid_param_name, channelid_default_value, message_size);
    }

    // istanbul ignore next: nothing to test : send_teams
    public static async send_teams_success(
        title: string,
        message: string,
        actions: TeamsWebhookContentActionOpenUrlVO[] = [],
        groupid_param_name: string = null,
        groupid_default_value: string = null,
        channelid_param_name: string = null,
        channelid_default_value: string = null,
        message_size: string = 'default'
    ) {
        await TeamsAPIServerController.send_teams_level('success', title, message, actions, groupid_param_name, groupid_default_value, channelid_param_name, channelid_default_value, message_size);
    }

    public static async update_teams_message(message_id: string, channel_id: string, group_id: string, message: TeamsWebhookContentVO) {
        const webhook = ConfigurationService.node_configuration.teams_webhook_update_message;

        if (!webhook) {
            ConsoleHandler.error('TeamsAPIServerController.update_teams_message:Impossible de trouver le webhook pour envoyer le message Teams');
            return;
        }

        if ((!message) || (!channel_id) || (!group_id) || (!message_id)) {
            ConsoleHandler.error('TeamsAPIServerController.update_teams_message:Impossible de trouver le message à envoyer ou les paramètres pour envoyer le message Teams');
            return;
        }

        // const message = new TeamsWebhookContentVO().set_attachments([new TeamsWebhookContentAttachmentsVO().set_name("Update").set_content(new TeamsWebhookContentAdaptiveCardVO().set_body([{ "type": "TextBlock", "messageId": message_id, "channelId": channel_id, "organisationId": group_id, "message": "Action is already done." }]))]);

        if (ConfigurationService.node_configuration.block_teams_messages) {
            ConsoleHandler.log('ModuleTeamsAPIServer.update_teams_message: BLOCK_TEAMS_MESSAGES in ConfigurationService.node_configuration : Aborting :' + message.attachments[0].content.body[0]['text'] ? message.attachments[0].content.body[0]['text'] : 'Error');
            return;
        }

        const { host, path } = this.getHostAndPathFromUrl(webhook);

        message.groupId = group_id;
        message.channelId = channel_id;
        message.messageId = message_id;

        const msg = TextHandler.getInstance().encode_object(message);
        await ModuleRequest.getInstance().sendRequestFromApp(
            ModuleRequest.METHOD_POST,
            host,
            path,
            msg,
            null,
            true,
            null,
            true,
            true
        );
    }

    /**
     * Fonction pour extraire le host d'une URL.
     * @param urlString - L'URL complète sous forme de chaîne de caractères.
     * @returns Le host de l'URL.
     */
    private static getHostAndPathFromUrl(urlString: string): { host: string, path: string } {
        try {
            const url = new URL(urlString);
            return {
                host: url.hostname,
                path: url.pathname + url.search
            };
        } catch (error) {
            console.error('Invalid URL:', error);
            return { host: '', path: '' };
        }
    }

    // istanbul ignore next: nothing to test : send_teams
    private static async send_teams_oselia_level(level: string, title: string, message: string, thread_id: number, actions: TeamsWebhookContentActionOpenUrlVO[] = []) {
        try {
            const group_id: string = ConfigurationService.node_configuration.teams_groupid__oselia;
            const channel_id: string = ConfigurationService.node_configuration['teams_channelid__oselia_' + level.toLowerCase()];

            if (!group_id || !channel_id) {
                ConsoleHandler.error('TeamsAPIServerController.send_teams_oselia_level:Impossible de trouver le groupe ou le channel pour envoyer le message Teams:' + group_id + ':' + channel_id + ':' + level + ':' + title + ':' + message);
                return;
            }

            title = (ConfigurationService.node_configuration.is_main_prod_env ? '' : (title.startsWith('[TEST] ') ? '' : '[TEST] ')) + title;

            const body = [];
            const m: TeamsWebhookContentVO = new TeamsWebhookContentVO();
            const title_Text = new TeamsWebhookContentTextBlockVO().set_text(title).set_weight("bolder").set_size("large");
            body.push(title_Text);
            const image = new TeamsWebhookContentImageVO().set_url(ConfigurationService.node_configuration.base_url + "public/vuejsclient/img/" + level.toLowerCase() + ".png").set_size("small");
            body.push(image);
            const message_Text = new TeamsWebhookContentTextBlockVO().set_text(message).set_size("small");
            body.push(message_Text);
            const open_oselia: ActionURLVO = await this.create_action_button_open_oselia(thread_id);
            actions.push(new TeamsWebhookContentActionOpenUrlVO().set_url(ActionURLServerTools.get_action_full_url(open_oselia)).set_title('Oselia'));
            m.attachments.push(new TeamsWebhookContentAttachmentsVO().set_name("Oselia Attachment").set_content(new TeamsWebhookContentAdaptiveCardVO().set_body(body).set_actions(actions)));
            await TeamsAPIServerController.send_to_teams_webhook(channel_id, group_id, m, [open_oselia]);
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    // istanbul ignore next: nothing to test : send_teams
    private static get_throttle_send_teams_level() {
        if (!TeamsAPIServerController.throttle_send_teams) {
            TeamsAPIServerController.throttle_send_teams = ThrottleHelper.declare_throttle_with_stackable_args(TeamsAPIServerController.throttled_send_teams_level, ConfigurationService.node_configuration.teams_throttle_ms);
        }
        return TeamsAPIServerController.throttle_send_teams;
    }

    /**
     * Envoyer un message Teams sur un channel donné
     * @param level
     * @param title
     * @param message
     * @param actions
     * @param groupid_param_name
     * @param groupid_default_value
     * @param channelid_param_name
     * @param channelid_default_value
    */
    // istanbul ignore next: nothing to test : send_teams
    private static async send_teams_level(
        level: string,
        title: string,
        message: string,
        actions: TeamsWebhookContentActionOpenUrlVO[] = [],
        groupid_param_name: string = null,
        groupid_default_value: string = null,
        channelid_param_name: string = null,
        channelid_default_value: string = null,
        message_size: string = 'default'
    ) {
        try {
            let group_id: string = groupid_param_name ? await ModuleParams.getInstance().getParamValueAsString(groupid_param_name, groupid_default_value, 180000) : null;
            if ((!group_id) && groupid_param_name) {
                ConsoleHandler.warn('TeamsAPIServerController.send_teams_level:Le paramètre "' + groupid_param_name + '" n\'a pas été trouvé, on utilise la valeur par défaut de configuration "' + ConfigurationService.node_configuration.teams_groupid__tech) + '"';
            }
            group_id = group_id ? group_id : ConfigurationService.node_configuration.teams_groupid__tech;

            let channel_id: string = channelid_param_name ? await ModuleParams.getInstance().getParamValueAsString(channelid_param_name, channelid_default_value, 180000) : null;
            if ((!channel_id) && channelid_param_name) {
                ConsoleHandler.warn('TeamsAPIServerController.send_teams_level:Le paramètre "' + channelid_param_name + '" n\'a pas été trouvé, on utilise la valeur par défaut de configuration "' + ConfigurationService.node_configuration['teams_channelid__tech_' + level.toLowerCase()] + '"');
            }
            channel_id = channel_id ? channel_id : ConfigurationService.node_configuration['teams_channelid__tech_' + level.toLowerCase()];

            if (!group_id || !channel_id) {
                ConsoleHandler.error('TeamsAPIServerController.send_teams_level:Impossible de trouver le groupe ou le channel pour envoyer le message Teams:' + group_id + ':' + channel_id + ':' + level + ':' + title + ':' + message + ':' + groupid_param_name + ':' + groupid_default_value + ':' + channelid_param_name + ':' + channelid_default_value);
                return;
            }

            title = (ConfigurationService.node_configuration.is_main_prod_env ? '' : (title.startsWith('[TEST] ') ? '' : '[TEST] ')) + title;
            const param = new SendTeamsLevelParam(level, title, message, actions, group_id, channel_id, message_size);
            await (TeamsAPIServerController.get_throttle_send_teams_level()(param));
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    // istanbul ignore next: nothing to test : get_key
    private static get_key(title: string, group_id: string, channel_id: string) {
        return title + '_' + group_id + '_' + channel_id;
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

            const key = TeamsAPIServerController.get_key(param.title, param.groupid, param.channelid);

            if (!params_by_key[key]) {
                params_by_key[key] = [];
            }

            params_by_key[key].push(param);
        }

        for (const key in params_by_key) {
            const key_params = params_by_key[key];
            const body = [];
            const actions = []; // Pour le moment les actions ne sont pas gérés dans le cadre d'un throttle de messgae, il faudrait cumuler les actions ? ou juste refuser de throttle les messages avec actions ?

            let message_size: string = 'default';

            for (const i in key_params) {
                const key_param = key_params[i];

                if (key_param.actions && (key_param.actions.length > 0)) {
                    // ConsoleHandler.error('NOT IMPLEMENTED : TeamsAPIServerController.throttled_send_teams_level:Impossible de gérer les actions dans le cadre d\'un throttle de messages');
                    actions.push(...key_param.actions);
                    // break;
                }

                if (key_param.message_size) {
                    // DIRTY Allowed values: ["default", "small", "medium", "large", "extraLarge"]
                    message_size = key_param.message_size;
                }
            }

            const group_id: string = key_params[0].groupid;
            const channel_id: string = key_params[0].channelid;
            const level: string = key_params[0].level;
            const title: string = key_params[0].title;

            const m: TeamsWebhookContentVO = new TeamsWebhookContentVO();
            // m.title = title;

            let message: string = key_params.map((p) => p.message).join('<br><br>');

            if (message.length > ConfigurationService.node_configuration.teams_message_max_size) {

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
                message = message.substring(0, ConfigurationService.node_configuration.teams_message_max_size - 3) + '...';
                // }
            }
            const title_Text = new TeamsWebhookContentTextBlockVO().set_text(title).set_weight("bolder").set_size("large");
            body.push(title_Text);
            const activity_Image = new TeamsWebhookContentImageVO().set_url(ConfigurationService.node_configuration.base_url + "public/vuejsclient/img/" + level.toLowerCase() + ".png").set_size("small");
            body.push(activity_Image);
            const message_Text = new TeamsWebhookContentTextBlockVO().set_text(message).set_size(message_size);
            body.push(message_Text);

            const attachments = new TeamsWebhookContentAttachmentsVO().set_name("Teams Level Attachment").set_content(new TeamsWebhookContentAdaptiveCardVO().set_body(body).set_actions(actions));
            m.set_groupId(group_id);
            m.set_channelId(channel_id);
            m.set_attachments([attachments]);
            // m.summary = message;
            // m.sections.push(
            //     new TeamsWebhookContentSectionVO().set_text(message)
            //         .set_activityImage(ConfigurationService.node_configuration.base_url + "public/vuejsclient/img/" + level.toLowerCase() + ".png")
            // );

            await TeamsAPIServerController.send_to_teams_webhook(channel_id, group_id, m);
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
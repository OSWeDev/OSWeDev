import { Request } from 'express';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleActionURL from '../../../shared/modules/ActionURL/ModuleActionURL';
import ActionURLCRVO from '../../../shared/modules/ActionURL/vos/ActionURLCRVO';
import ActionURLUserVO from '../../../shared/modules/ActionURL/vos/ActionURLUserVO';
import ActionURLVO from '../../../shared/modules/ActionURL/vos/ActionURLVO';
import ContextFilterVOHandler from '../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextQueryVO, { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import IUserData from '../../../shared/modules/DAO/interface/IUserData';
import ModuleTableVO from '../../../shared/modules/DAO/vos/ModuleTableVO';
import ModulesManager from '../../../shared/modules/ModulesManager';
import TeamsWebhookContentAdaptiveCardVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentAdaptiveCardVO';
import TeamsWebhookContentAttachmentsVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentAttachmentsVO';
import TeamsWebhookContentTextBlockVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentTextBlockVO';
import TeamsWebhookContentVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import LocaleManager from '../../../shared/tools/LocaleManager';
import { field_names } from '../../../shared/tools/ObjectHandler';
import ConfigurationService from '../../env/ConfigurationService';
import ServerAPIController from '../API/ServerAPIController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleServerBase from '../ModuleServerBase';
import TeamsAPIServerController from '../TeamsAPI/TeamsAPIServerController';
import ActionURLServerTools from './ActionURLServerTools';
import { ISimpleActionURLParams } from './SimpleActionURL';

export default class ModuleActionURLServer extends ModuleServerBase {

    private static instance: ModuleActionURLServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleActionURL.getInstance().name);
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleActionURLServer.instance) {
            ModuleActionURLServer.instance = new ModuleActionURLServer();
        }
        return ModuleActionURLServer.instance;
    }

    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> { }

    // istanbul ignore next: cannot test configure
    public async configure() {
        ModuleDAOServer.instance.registerContextAccessHook(ActionURLVO.API_TYPE_ID, this, this.filterActionURLVOContextAccessHook);

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': "Cette action n'existe pas ou vous n'y avez pas accès."
        }, 'action_url.not_found.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': "En cours..."
        }, 'OseliaThreadMessageActionURLComponent.execute_action_url.encours.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': "Echec de l'action"
        }, 'OseliaThreadMessageActionURLComponent.execute_action_url.failed.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': "Action effectuée avec succès"
        }, 'OseliaThreadMessageActionURLComponent.execute_action_url.ok.___LABEL___'));
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleActionURL.APINAME_action_url, this.action_url.bind(this));
    }

    /**
     * On renvoie simplement une redirection vers l'administration pour modifier le message
     * @param action_url
     * @param uid
     * @returns
     */
    public async simple_open_url_from_action_url(action_url: ActionURLVO, uid: number, req: Request, call_id: number): Promise<ActionURLCRVO> {
        const param: ISimpleActionURLParams = action_url.params as ISimpleActionURLParams;
        await ServerAPIController.send_redirect_if_headers_not_already_sent(call_id, param.url);
        return ActionURLServerTools.create_info_cr(action_url, 'Redirection vers ' + param.url);
    }

    private async filterActionURLVOContextAccessHook(moduletable: ModuleTableVO, uid: number, user: UserVO, user_data: IUserData, user_roles: RoleVO[]): Promise<ContextQueryVO> {

        if (!uid) {
            return ContextFilterVOHandler.get_empty_res_context_hook_query(moduletable.vo_type);
        }

        return query(ActionURLVO.API_TYPE_ID).field(field_names<ActionURLVO>().id).filter_by_num_eq(field_names<ActionURLUserVO>().user_id, uid, ActionURLUserVO.API_TYPE_ID).exec_as_server();
    }

    /**
     * On appelle le callback (si tout est ok) et on passe en param le action_url et l'uid (et les req: Request, res: Response de l'API)
     * Par ailleurs on met à jour le compteur de l'action_url
     * @param code
     * @returns
     */
    private async action_url(code: string, do_not_redirect: boolean, req: Request, api_call_id: number): Promise<boolean> {

        const uid = ModuleAccessPolicyServer.getLoggedUserId();

        /**
         * On ne gère pas d'action anonyme pour le moment
         */
        if (!uid) {
            ConsoleHandler.error('Anonymous user cannot use action_url:' + code);
            return false;
        }

        const action_url = await query(ActionURLVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<ActionURLUserVO>().user_id, uid, ActionURLUserVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<ActionURLVO>().action_code, code)
            .exec_as_server()
            .select_vo<ActionURLVO>();

        if (!action_url) {
            ConsoleHandler.error('No action_url found for code:' + code + ': or this user does not have access to it:' + uid + ':');
            return false;
        }

        // Si l'action n'est plus appelable, on modifie le message dans Teams pour supprimer le bouton
        // TODO
        // TeamsAPIServerController.update_teams_message(messageId, canalId, groupId);

        try {
            const action_res = await this.do_action_url(action_url, code, uid, req, api_call_id);
            if (!do_not_redirect) {
                // par défaut on redirige vers la page de consultation des crs de cette action_url si aucune redirection n'a été faite
                await ServerAPIController.send_redirect_if_headers_not_already_sent(api_call_id, '/#/action_url_cr/' + action_url.id);
            }

            return action_res;
        } catch (error) {
            ConsoleHandler.error('Error in action_url:' + code + ': module_name:' + action_url.action_callback_module_name + ': function_name:' + action_url.action_callback_function_name + ': error:' + error);
        }
        return false;
    }

    private async do_action_url(action_url: ActionURLVO, code: string, uid: number, req: Request, api_call_id: number): Promise<boolean> {
        if (action_url.action_remaining_counter == 0) {
            ConsoleHandler.error('No more remaining counter for action_url:' + code + ': module_name:' + action_url.action_callback_module_name + ': function_name:' + action_url.action_callback_function_name);
            return false;
        }

        if (!action_url.action_callback_module_name) {
            ConsoleHandler.error('No action_callback_module_name found for action_url:' + code);
            return false;
        }

        const module_instance = ModulesManager.getModuleByNameAndRole(action_url.action_callback_module_name, ModuleServerBase.SERVER_MODULE_ROLE_NAME);

        if (!module_instance) {
            ConsoleHandler.error('No module found for action_url:' + code + ': module_name:' + action_url.action_callback_module_name);
            return false;
        }

        if (!module_instance[action_url.action_callback_function_name]) {
            ConsoleHandler.error('No function found for action_url:' + code + ': module_name:' + action_url.action_callback_module_name + ': function_name:' + action_url.action_callback_function_name);
            return false;
        }

        // Si -1, infini
        if (action_url.action_remaining_counter > 0) {
            action_url.action_remaining_counter--;
        }
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(action_url);

        const action_cr: ActionURLCRVO = await module_instance[action_url.action_callback_function_name](action_url, uid, req, api_call_id);

        if (action_cr) {
            action_cr.action_url_id = action_url.id;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(action_cr);
        }

        /**
         * Si on a une action url à la fois en teams_auto_close_message_on_completion et dont on a plus d'action, on envoie le CR à la place du message actuel
         */
        if (action_url.teams_auto_close_message_on_completion && (action_url.action_remaining_counter == 0)) {
            let title_content = 'Action réalisée';
            let message_content = ' ';

            if (action_cr) {

                const lang = await query(LangVO.API_TYPE_ID).filter_by_id(uid, UserVO.API_TYPE_ID).select_vo<LangVO>();
                const title_text = await query(TranslatableTextVO.API_TYPE_ID).filter_by_text_eq(field_names<TranslatableTextVO>().code_text, action_cr.translatable_cr_title).exec_as_server().select_vo<TranslatableTextVO>();

                let content_text = null;
                if (!!action_cr.translatable_cr_content) {
                    content_text = await query(TranslatableTextVO.API_TYPE_ID).filter_by_text_eq(field_names<TranslatableTextVO>().code_text, action_cr.translatable_cr_content).exec_as_server().select_vo<TranslatableTextVO>();
                }

                title_content = action_cr.translatable_cr_title;
                message_content = action_cr.translatable_cr_content;
                if (lang && title_text) {
                    const title_translation = await ModuleTranslation.getInstance().getTranslation(lang.id, title_text.id);

                    if (title_translation) {
                        title_content = LocaleManager.t(title_translation.translated, action_cr.translatable_cr_title_params_json);
                    }
                }

                if (lang && content_text) {
                    const content_translation = await ModuleTranslation.getInstance().getTranslation(lang.id, content_text.id);

                    if (content_translation) {
                        message_content = LocaleManager.t(content_translation.translated, action_cr.translatable_cr_content_params_json);
                    }
                }
            }
            const body = [];

            const title_elt = new TeamsWebhookContentTextBlockVO().set_text((ConfigurationService.node_configuration.is_main_prod_env ? '[PROD] ' : '[TEST] ') + title_content).set_weight("bolder").set_size("large");
            body.push(title_elt);
            const content_elt = new TeamsWebhookContentTextBlockVO().set_text(message_content).set_size("small");
            body.push(content_elt);

            const nouveau_contenu: TeamsWebhookContentVO = new TeamsWebhookContentVO().set_attachments([new TeamsWebhookContentAttachmentsVO().set_name("Update").set_content(new TeamsWebhookContentAdaptiveCardVO().set_body(body))]);
            await TeamsAPIServerController.update_teams_message(action_url.teams_message_id, action_url.teams_channel_id, action_url.teams_group_id, nouveau_contenu);
        }

        return (!action_cr) ||
            (action_cr.cr_type == ActionURLCRVO.CR_TYPE_SUCCESS) ||
            (action_cr.cr_type == ActionURLCRVO.CR_TYPE_INFO);
    }
}
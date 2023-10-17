import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleBard from '../../../shared/modules/Bard/ModuleBard';
import BardConversationVO from '../../../shared/modules/Bard/vos/BardConversationVO';
import BardMessageVO from '../../../shared/modules/Bard/vos/BardMessageVO';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ConfigurationService from '../../env/ConfigurationService';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import BardAPIMessage from '../../../shared/modules/Bard/api/BardAPIMessage';
import BardApiService from './Service/BardApiService';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import BardConfigurationVO from '../../../shared/modules/Bard/vos/BardConfigurationVO';
import { field_names } from '../../../shared/tools/ObjectHandler';

export default class ModuleBardServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleBardServer.instance) {
            ModuleBardServer.instance = new ModuleBardServer();
        }
        return ModuleBardServer.instance;
    }

    private static instance: ModuleBardServer = null;

    private bard_api_service: BardApiService = null;

    private constructor() {
        super(ModuleBard.getInstance().name);
    }

    public async configure() {
        this.bard_api_service = BardApiService.getInstance();
    }

    /**
     * registerServerApiHandlers
     *  - Define the API handlers of the module
     */
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleBard.APINAME_bard_ask, this.bard_ask.bind(this));
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleBard.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            'fr-fr': 'Bard'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleBard.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            'fr-fr': 'Administration du module Bard'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let POLICY_FO_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_FO_ACCESS.group_id = group.id;
        POLICY_FO_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_FO_ACCESS.translatable_name = ModuleBard.POLICY_FO_ACCESS;
        POLICY_FO_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_FO_ACCESS, new DefaultTranslation({
            'fr-fr': 'Accès front - Bard'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    /**
     * bard_ask
     *  - Called by the client to ask the assistant a question
     *
     * @param {BardMessageVO} message
     * @returns {Promise<BardMessageVO>} should return the assistant's response
     */
    public async bard_ask(message: BardMessageVO): Promise<BardMessageVO> {
        if (!message) {
            return null;
        }

        try {
            // Get the user configuration
            const user_id = message.user_id;

            // Get the user's cookies
            const bard_configuration = await query(BardConfigurationVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<BardConfigurationVO>().user_id, user_id)
                .select_vo<BardConfigurationVO>();

            if (!bard_configuration) {
                throw new Error("No bard configuration for user " + user_id);
            }

            // Get the conversation
            const response = await this.bard_api_service.ask(
                bard_configuration.cookies,
                message.content,
                { conversation_id: "", request_id: "", response_id: "" }
            );

        } catch (err) {

        }
    }

    public async generate_response(conversation: BardConversationVO, newPrompt: BardMessageVO): Promise<BardMessageVO> {
        try {
            if (!conversation || !newPrompt) {
                throw new Error("Invalid conversation or prompt");
            }

            // Add the new message to the conversation
            if (!conversation.messages) {
                conversation.messages = [];
            }
            conversation.messages.push(newPrompt);

            // Extract the currentMessages from the conversation
            const currentMessages = BardAPIMessage.fromConversation(conversation);
            // const result = await this.bard_api_service.createChatCompletion({
            //     model: modelId,
            //     messages: currentMessages,
            // });

            // TODO: Call the API to get the assistant's response

            const responseText = '';
            const responseMessage: BardMessageVO = new BardMessageVO();
            responseMessage.date = Dates.now();
            responseMessage.content = responseText;
            responseMessage.role_type = BardMessageVO.BARD_MSG_ROLE_TYPE_ASSISTANT;

            // Add the assistant's response to the conversation
            conversation.messages.push(responseMessage);
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(conversation);

            return responseMessage;
        } catch (err) {
            ConsoleHandler.error(err);
        }
    }
}
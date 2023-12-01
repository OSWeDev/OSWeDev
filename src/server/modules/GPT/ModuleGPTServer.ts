import OpenAI from 'openai';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleGPT from '../../../shared/modules/GPT/ModuleGPT';
import GPTAPIMessage from '../../../shared/modules/GPT/api/GPTAPIMessage';
import GPTConversationVO from '../../../shared/modules/GPT/vos/GPTConversationVO';
import GPTMessageVO from '../../../shared/modules/GPT/vos/GPTMessageVO';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../env/ConfigurationService';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import APIControllerWrapper from "../../../shared/modules/API/APIControllerWrapper";

export default class ModuleGPTServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleGPTServer.instance) {
            ModuleGPTServer.instance = new ModuleGPTServer();
        }
        return ModuleGPTServer.instance;
    }

    private static instance: ModuleGPTServer = null;

    private openai = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleGPT.getInstance().name);
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleGPT.APINAME_generate_response, this.generate_response.bind(this));
    }

    // istanbul ignore next: cannot test configure
    public async configure() {
        if (!ConfigurationService.node_configuration.OPEN_API_API_KEY) {
            ConsoleHandler.warn('OPEN_API_API_KEY is not set in configuration');
            return;
        }

        this.openai = new OpenAI({
            apiKey: ConfigurationService.node_configuration.OPEN_API_API_KEY
        });
    }

    /**
     * On définit les droits d'accès du module
     */
    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleGPT.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            'fr-fr': 'GPT'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleGPT.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            'fr-fr': 'Administration du module GPT'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let POLICY_FO_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_FO_ACCESS.group_id = group.id;
        POLICY_FO_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_FO_ACCESS.translatable_name = ModuleGPT.POLICY_FO_ACCESS;
        POLICY_FO_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_FO_ACCESS, new DefaultTranslation({
            'fr-fr': 'Accès front - GPT'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    // istanbul ignore next: cannot test extern apis
    public async generate_response(conversation: GPTConversationVO, newPrompt: GPTMessageVO): Promise<GPTMessageVO> {
        try {
            const modelId = await ModuleParams.getInstance().getParamValueAsString(ModuleGPT.PARAM_NAME_MODEL_ID, "gpt-4", 60000);
            // const modelId = await ModuleParams.getInstance().getParamValueAsString(ModuleGPT.PARAM_NAME_MODEL_ID, "gpt-3.5-turbo", 60000);
            // const modelId = "gpt-3.5-turbo";

            if (!conversation || !newPrompt) {
                throw new Error("Invalid conversation or prompt");
            }

            const currentMessages = await this.prepare_for_api(conversation, newPrompt);
            if (!currentMessages) {
                throw new Error("Invalid currentMessages");
            }

            const result = await this.call_api(modelId, currentMessages);

            return await this.api_response_handler(conversation, result);
        } catch (err) {
            ConsoleHandler.error(err);
        }
        return null;
    }

    /**
     *
     * @param conversation
     * @param newPrompt
     * @returns current messages for the API
     */
    private async prepare_for_api(conversation: GPTConversationVO, newPrompt: GPTMessageVO): Promise<GPTAPIMessage[]> {
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
            return GPTAPIMessage.fromConversation(conversation);
        } catch (err) {
            ConsoleHandler.error(err);
        }
        return null;
    }

    // istanbul ignore next: cannot test extern apis
    private async call_api(modelId: string, currentMessages: GPTAPIMessage[]): Promise<any> {
        try {
            return await this.openai.chat.completions.create({
                model: modelId,
                messages: currentMessages,
            });
        } catch (err) {
            ConsoleHandler.error(err);
        }
    }

    private async api_response_handler(conversation: GPTConversationVO, result: any): Promise<GPTMessageVO> {
        try {
            const responseText = result.choices.shift().message.content;
            const responseMessage: GPTMessageVO = new GPTMessageVO();
            responseMessage.date = Dates.now();
            responseMessage.content = responseText;
            responseMessage.role_type = GPTMessageVO.GPTMSG_ROLE_TYPE_ASSISTANT;

            // Add the assistant's response to the conversation
            conversation.messages.push(responseMessage);
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(conversation);

            return responseMessage;
        } catch (err) {
            ConsoleHandler.error(err);
        }
    }
}
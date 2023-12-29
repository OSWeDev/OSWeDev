import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import APIControllerWrapper from "../../../shared/modules/API/APIControllerWrapper";
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleGPT from '../../../shared/modules/GPT/ModuleGPT';
import GPTAssistantAPIThreadMessageVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import GPTCompletionAPIConversationVO from '../../../shared/modules/GPT/vos/GPTCompletionAPIConversationVO';
import GPTCompletionAPIMessageVO from '../../../shared/modules/GPT/vos/GPTCompletionAPIMessageVO';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../env/ConfigurationService';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';
import GPTAssistantAPIServerController from './GPTAssistantAPIServerController';

export default class ModuleGPTServer extends ModuleServerBase {

    public static openai: OpenAI = null;

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleGPTServer.instance) {
            ModuleGPTServer.instance = new ModuleGPTServer();
        }
        return ModuleGPTServer.instance;
    }

    private static instance: ModuleGPTServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleGPT.getInstance().name);
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleGPT.APINAME_generate_response, this.generate_response.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleGPT.APINAME_ask_assistant, this.ask_assistant.bind(this));
    }

    public async ask_assistant(
        assistant_id: string,
        thread_id: string,
        content: string,
        files: FileVO[],
        user_id: number
    ): Promise<GPTAssistantAPIThreadMessageVO[]> {
        return await GPTAssistantAPIServerController.ask_assistant(assistant_id, thread_id, content, files, user_id);
    }

    // istanbul ignore next: cannot test configure
    public async configure() {

        let preCreateTrigger: DAOPreCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCreateTrigger.registerHandler(GPTCompletionAPIConversationVO.API_TYPE_ID, this, this.handleTriggerPreCreateGPTCompletionAPIConversationVO);

        if (!ConfigurationService.node_configuration.OPEN_API_API_KEY) {
            ConsoleHandler.warn('OPEN_API_API_KEY is not set in configuration');
            return;
        }

        ModuleGPTServer.openai = new OpenAI({
            apiKey: ConfigurationService.node_configuration.OPEN_API_API_KEY
        });
    }

    public async handleTriggerPreCreateGPTCompletionAPIConversationVO(vo: GPTCompletionAPIConversationVO): Promise<boolean> {
        vo.date = Dates.now();
        return true;
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

        let POLICY_ASSISTANT_FILES_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_ASSISTANT_FILES_ACCESS.group_id = group.id;
        POLICY_ASSISTANT_FILES_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_ASSISTANT_FILES_ACCESS.translatable_name = ModuleGPT.POLICY_ASSISTANT_FILES_ACCESS;
        POLICY_ASSISTANT_FILES_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_ASSISTANT_FILES_ACCESS, new DefaultTranslation({
            'fr-fr': 'Accès aux fichiers issus de GPT'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    // istanbul ignore next: cannot test extern apis
    public async generate_response(conversation: GPTCompletionAPIConversationVO, newPrompt: GPTCompletionAPIMessageVO): Promise<GPTCompletionAPIMessageVO> {
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
    private async prepare_for_api(conversation: GPTCompletionAPIConversationVO, newPrompt: GPTCompletionAPIMessageVO): Promise<ChatCompletionMessageParam[]> {
        try {
            if (!conversation || !newPrompt) {
                throw new Error("Invalid conversation or prompt");
            }

            let messages: GPTCompletionAPIMessageVO[] = await query(GPTCompletionAPIMessageVO.API_TYPE_ID).filter_by_id(conversation.id, GPTCompletionAPIConversationVO.API_TYPE_ID).exec_as_server().select_vos<GPTCompletionAPIMessageVO>();
            if (!messages) {
                messages = [];
            }
            messages.push(newPrompt);

            // Extract the currentMessages from the conversation
            return messages.map((m) => m.to_GPT_ChatCompletionMessageParam());
        } catch (err) {
            ConsoleHandler.error(err);
        }
        return null;
    }

    // istanbul ignore next: cannot test extern apis
    private async call_api(modelId: string, currentMessages: ChatCompletionMessageParam[]): Promise<any> {
        try {
            return await ModuleGPTServer.openai.chat.completions.create({
                model: modelId,
                messages: currentMessages as ChatCompletionMessageParam[],
            });
        } catch (err) {
            ConsoleHandler.error(err);
        }
    }

    private async api_response_handler(conversation: GPTCompletionAPIConversationVO, result: any): Promise<GPTCompletionAPIMessageVO> {
        try {
            let responseText = result.choices.shift().message.content;
            let responseMessage: GPTCompletionAPIMessageVO = new GPTCompletionAPIMessageVO();
            responseMessage.date = Dates.now();
            responseMessage.content = responseText;
            responseMessage.role_type = GPTCompletionAPIMessageVO.GPTMSG_ROLE_TYPE_ASSISTANT;
            responseMessage.conversation_id = conversation.id;

            // Add the assistant's response to the conversation
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(responseMessage);

            return responseMessage;
        } catch (err) {
            ConsoleHandler.error(err);
        }
    }
}
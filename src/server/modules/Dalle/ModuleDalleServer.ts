import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../env/ConfigurationService';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import { OpenAIApi, Configuration } from "openai";
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import ModuleDalle from '../../../shared/modules/Dalle/ModuleDalle';

export default class ModuleDalleServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleDalleServer.instance) {
            ModuleDalleServer.instance = new ModuleDalleServer();
        }
        return ModuleDalleServer.instance;
    }

    private static instance: ModuleDalleServer = null;

    private openai = null;

    private constructor() {
        super(ModuleDalle.getInstance().name);
    }

    public async configure() {
        if (!ConfigurationService.node_configuration.OPEN_API_API_KEY) {
            ConsoleHandler.warn('OPEN_API_API_KEY is not set in configuration');
            return;
        }

        const configuration = new Configuration({
            apiKey: ConfigurationService.node_configuration.OPEN_API_API_KEY
        });

        this.openai = new OpenAIApi(configuration);
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleDalle.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            'fr-fr': 'Dalle'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleDalle.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            'fr-fr': 'Administration du module Dalle'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let POLICY_FO_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_FO_ACCESS.group_id = group.id;
        POLICY_FO_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_FO_ACCESS.translatable_name = ModuleDalle.POLICY_FO_ACCESS;
        POLICY_FO_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_FO_ACCESS, new DefaultTranslation({
            'fr-fr': 'Accès front - Dalle'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    // public async generate_response(conversation: GPTConversationVO, newPrompt: GPTMessageVO): Promise<GPTMessageVO> {
    //     try {
    //         // const modelId = "gpt-4";
    //         const modelId = "gpt-3.5-turbo";

    //         if (!conversation || !newPrompt) {
    //             throw new Error("Invalid conversation or prompt");
    //         }

    //         // Add the new message to the conversation
    //         if (!conversation.messages) {
    //             conversation.messages = [];
    //         }
    //         conversation.messages.push(newPrompt);

    //         // Extract the currentMessages from the conversation
    //         const currentMessages = GPTAPIMessage.fromConversation(conversation);
    //         const result = await this.openai.createChatCompletion({
    //             model: modelId,
    //             messages: currentMessages,
    //         });

    //         const responseText = result.data.choices.shift().message.content;
    //         const responseMessage: GPTMessageVO = new GPTMessageVO();
    //         responseMessage.date = Dates.now();
    //         responseMessage.content = responseText;
    //         responseMessage.role_type = GPTMessageVO.GPTMSG_ROLE_TYPE_ASSISTANT;

    //         // Add the assistant's response to the conversation
    //         conversation.messages.push(responseMessage);
    //         await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(conversation);

    //         return responseMessage;
    //     } catch (err) {
    //         ConsoleHandler.error(err);
    //     }
    // }
}
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import APIControllerWrapper from "../../../shared/modules/API/APIControllerWrapper";
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ManualTasksController from '../../../shared/modules/Cron/ManualTasksController';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleGPT from '../../../shared/modules/GPT/ModuleGPT';
import GPTAssistantAPIRunVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIRunVO';
import GPTAssistantAPIThreadMessageVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import GPTAssistantAPIThreadVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import GPTCompletionAPIConversationVO from '../../../shared/modules/GPT/vos/GPTCompletionAPIConversationVO';
import GPTCompletionAPIMessageVO from '../../../shared/modules/GPT/vos/GPTCompletionAPIMessageVO';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
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
import GPTAssistantAPIFunctionGetVoTypeDescriptionController from './functions/get_vo_type_description/GPTAssistantAPIFunctionGetVoTypeDescriptionController';
import AssistantVoFieldDescription from './functions/get_vo_type_description/AssistantVoFieldDescription';
import AssistantVoTypeDescription from './functions/get_vo_type_description/AssistantVoTypeDescription';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import GPTAssistantAPIRunStepVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIRunStepVO';
import GPTAssistantAPIFileVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFileVO';

export default class ModuleGPTServer extends ModuleServerBase {

    public static openai: OpenAI = null;


    private static instance: ModuleGPTServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleGPT.getInstance().name);
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleGPTServer.instance) {
            ModuleGPTServer.instance = new ModuleGPTServer();
        }
        return ModuleGPTServer.instance;
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleGPT.APINAME_generate_response, this.generate_response.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleGPT.APINAME_ask_assistant, this.ask_assistant.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleGPT.APINAME_rerun, this.rerun.bind(this));

        ManualTasksController.getInstance().registered_manual_tasks_by_name[ModuleGPT.MANUAL_TASK_NAME_reload_openai_runs_datas] = this.reload_openai_runs_datas;
    }

    public async reload_openai_runs_datas() {
        const run_vos = await query(GPTAssistantAPIRunVO.API_TYPE_ID).exec_as_server().select_vos<GPTAssistantAPIRunVO>();
        for (const i in run_vos) {
            const run_vo = run_vos[i];
            if (run_vo.gpt_run_id) {

                if (!run_vo.gpt_thread_id) {
                    const thread_vo = await query(GPTAssistantAPIThreadVO.API_TYPE_ID).filter_by_id(run_vo.thread_id, GPTAssistantAPIThreadVO.API_TYPE_ID).select_vo<GPTAssistantAPIThreadVO>();
                    run_vo.gpt_thread_id = thread_vo.gpt_thread_id;
                }

                const run_gpt = await ModuleGPTServer.openai.beta.threads.runs.retrieve(run_vo.gpt_thread_id, run_vo.gpt_run_id);
                await GPTAssistantAPIServerController.update_run_if_needed(run_vo, run_gpt);
            }
        }
    }

    /**
     * Le re_run a pour but de générer une nouvelle solution à un problème déjà répondu mais dont la réponse n'est pas satisfaisante, ou dont les conditions ont changé
     * Idéalement on veut garder la trace des runs précédents pour pouvoir les comparer et expliquer pourquoi on a choisi la nouvelle solution (il faudrait donc aussi pouvoir dire si on préfère la nouvelle ou pas, et pourquoi)
     * @param run_id
     */
    public async rerun(run_id: number): Promise<GPTAssistantAPIRunVO> {

        // On doit récupérer le thread pour lequel on veut faire un nouveau run
        // On récupère tous les thrads messages pour ce thread
        // On isole les messages du run qu'on veut refaire, ainsi que les messages suivants le run (quelque soit leur role)

        throw new Error('Method not implemented.');
    }

    public async ask_assistant(
        assistant_id: string,
        thread_id: string,
        content: string,
        files: FileVO[],
        user_id: number = null
    ): Promise<GPTAssistantAPIThreadMessageVO[]> {
        return await GPTAssistantAPIServerController.ask_assistant(assistant_id, thread_id, content, files, user_id);
    }

    public async assistant_function_get_vo_type_description_controller(
        thread_vo: GPTAssistantAPIThreadVO,
        api_type_id: string,
    ): Promise<AssistantVoTypeDescription> {
        return await GPTAssistantAPIFunctionGetVoTypeDescriptionController.run_action(thread_vo, api_type_id);
    }

    // istanbul ignore next: cannot test configure
    public async configure() {

        const preCreateTrigger: DAOPreCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCreateTrigger.registerHandler(GPTCompletionAPIConversationVO.API_TYPE_ID, this, this.handleTriggerPreCreateGPTCompletionAPIConversationVO);

        if (!ConfigurationService.node_configuration.open_api_api_key) {
            ConsoleHandler.warn('OPEN_API_API_KEY is not set in configuration');
            return;
        }

        ModuleGPTServer.openai = new OpenAI({
            apiKey: ConfigurationService.node_configuration.open_api_api_key
        });


        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': GPTAssistantAPIRunVO.TO_OPENAI_STATUS_MAP[GPTAssistantAPIRunVO.STATUS_QUEUED] },
            "GPTAssistantAPIRunVO.STATUS_QUEUED"
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': GPTAssistantAPIRunVO.TO_OPENAI_STATUS_MAP[GPTAssistantAPIRunVO.STATUS_IN_PROGRESS] },
            "GPTAssistantAPIRunVO.STATUS_IN_PROGRESS"
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': GPTAssistantAPIRunVO.TO_OPENAI_STATUS_MAP[GPTAssistantAPIRunVO.STATUS_REQUIRES_ACTION] },
            "GPTAssistantAPIRunVO.STATUS_REQUIRES_ACTION"
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': GPTAssistantAPIRunVO.TO_OPENAI_STATUS_MAP[GPTAssistantAPIRunVO.STATUS_CANCELLING] },
            "GPTAssistantAPIRunVO.STATUS_CANCELLING"
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': GPTAssistantAPIRunVO.TO_OPENAI_STATUS_MAP[GPTAssistantAPIRunVO.STATUS_CANCELLED] },
            "GPTAssistantAPIRunVO.STATUS_CANCELLED"
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': GPTAssistantAPIRunVO.TO_OPENAI_STATUS_MAP[GPTAssistantAPIRunVO.STATUS_FAILED] },
            "GPTAssistantAPIRunVO.STATUS_FAILED"
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': GPTAssistantAPIRunVO.TO_OPENAI_STATUS_MAP[GPTAssistantAPIRunVO.STATUS_COMPLETED] },
            "GPTAssistantAPIRunVO.STATUS_COMPLETED"
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': GPTAssistantAPIRunVO.TO_OPENAI_STATUS_MAP[GPTAssistantAPIRunVO.STATUS_INCOMPLETE] },
            "GPTAssistantAPIRunVO.STATUS_INCOMPLETE"
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': GPTAssistantAPIRunVO.TO_OPENAI_STATUS_MAP[GPTAssistantAPIRunVO.STATUS_EXPIRED] },
            "GPTAssistantAPIRunVO.STATUS_EXPIRED"
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': GPTAssistantAPIFileVO.TO_OPENAI_PURPOSE_MAP[GPTAssistantAPIFileVO.PURPOSE_FINE_TUNE] },
            'GPTAssistantAPIFileVO.PURPOSE_FINE_TUNE'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': GPTAssistantAPIFileVO.TO_OPENAI_PURPOSE_MAP[GPTAssistantAPIFileVO.PURPOSE_FINE_TUNE_RESULTS] },
            'GPTAssistantAPIFileVO.PURPOSE_FINE_TUNE_RESULTS'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': GPTAssistantAPIFileVO.TO_OPENAI_PURPOSE_MAP[GPTAssistantAPIFileVO.PURPOSE_ASSISTANTS] },
            'GPTAssistantAPIFileVO.PURPOSE_ASSISTANTS'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': GPTAssistantAPIFileVO.TO_OPENAI_PURPOSE_MAP[GPTAssistantAPIFileVO.PURPOSE_ASSISTANTS_OUTPUT] },
            'GPTAssistantAPIFileVO.PURPOSE_ASSISTANTS_OUTPUT'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': GPTAssistantAPIFileVO.TO_OPENAI_PURPOSE_MAP[GPTAssistantAPIFileVO.PURPOSE_BATCH] },
            'GPTAssistantAPIFileVO.PURPOSE_BATCH'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': GPTAssistantAPIFileVO.TO_OPENAI_PURPOSE_MAP[GPTAssistantAPIFileVO.PURPOSE_BATCH_OUTPUT] },
            'GPTAssistantAPIFileVO.PURPOSE_BATCH_OUTPUT'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': GPTAssistantAPIFileVO.TO_OPENAI_PURPOSE_MAP[GPTAssistantAPIFileVO.PURPOSE_VISION] },
            'GPTAssistantAPIFileVO.PURPOSE_VISION'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': GPTAssistantAPIRunStepVO.TO_OPENAI_STATUS_MAP[GPTAssistantAPIRunStepVO.STATUS_IN_PROGRESS] },
            "GPTAssistantAPIRunStepVO.STATUS_IN_PROGRESS"
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': GPTAssistantAPIRunStepVO.TO_OPENAI_STATUS_MAP[GPTAssistantAPIRunStepVO.STATUS_CANCELLED] },
            "GPTAssistantAPIRunStepVO.STATUS_CANCELLED"
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': GPTAssistantAPIRunStepVO.TO_OPENAI_STATUS_MAP[GPTAssistantAPIRunStepVO.STATUS_FAILED] },
            "GPTAssistantAPIRunStepVO.STATUS_FAILED"
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': GPTAssistantAPIRunStepVO.TO_OPENAI_STATUS_MAP[GPTAssistantAPIRunStepVO.STATUS_COMPLETED] },
            "GPTAssistantAPIRunStepVO.STATUS_COMPLETED"
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': GPTAssistantAPIRunStepVO.TO_OPENAI_STATUS_MAP[GPTAssistantAPIRunStepVO.STATUS_EXPIRED] },
            "GPTAssistantAPIRunStepVO.STATUS_EXPIRED"
        ));
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
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, DefaultTranslationVO.create_new({
            'fr-fr': 'GPT'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleGPT.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, DefaultTranslationVO.create_new({
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
        POLICY_FO_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_FO_ACCESS, DefaultTranslationVO.create_new({
            'fr-fr': 'Accès front - GPT'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let POLICY_ASSISTANT_FILES_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_ASSISTANT_FILES_ACCESS.group_id = group.id;
        POLICY_ASSISTANT_FILES_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_ASSISTANT_FILES_ACCESS.translatable_name = ModuleGPT.POLICY_ASSISTANT_FILES_ACCESS;
        POLICY_ASSISTANT_FILES_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_ASSISTANT_FILES_ACCESS, DefaultTranslationVO.create_new({
            'fr-fr': 'Accès aux fichiers issus de GPT'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let POLICY_ask_assistant: AccessPolicyVO = new AccessPolicyVO();
        POLICY_ask_assistant.group_id = group.id;
        POLICY_ask_assistant.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_ask_assistant.translatable_name = ModuleGPT.POLICY_ask_assistant;
        POLICY_ask_assistant = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_ask_assistant, DefaultTranslationVO.create_new({
            'fr-fr': 'API: ask_assistant'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let POLICY_rerun: AccessPolicyVO = new AccessPolicyVO();
        POLICY_rerun.group_id = group.id;
        POLICY_rerun.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_rerun.translatable_name = ModuleGPT.POLICY_rerun;
        POLICY_rerun = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_rerun, DefaultTranslationVO.create_new({
            'fr-fr': 'API: rerun'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let POLICY_generate_response: AccessPolicyVO = new AccessPolicyVO();
        POLICY_generate_response.group_id = group.id;
        POLICY_generate_response.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_generate_response.translatable_name = ModuleGPT.POLICY_generate_response;
        POLICY_generate_response = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_generate_response, DefaultTranslationVO.create_new({
            'fr-fr': 'API: generate_response'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    /**
     * istanbul ignore next: cannot test extern apis
     * @deprecated use Assistants instead => cheaper / faster / better control. Will be removed soon
     */
    public async generate_response(conversation: GPTCompletionAPIConversationVO, newPrompt: GPTCompletionAPIMessageVO): Promise<GPTCompletionAPIMessageVO> {
        try {
            const modelId = await ModuleParams.getInstance().getParamValueAsString(ModuleGPT.PARAM_NAME_MODEL_ID, "gpt-4-turbo-preview", 60000);

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
            const responseText = result.choices.shift().message.content;
            const responseMessage: GPTCompletionAPIMessageVO = new GPTCompletionAPIMessageVO();
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
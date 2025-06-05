import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import { FileLike } from 'openai/uploads';
import { isMainThread } from 'worker_threads';
import Throttle from '../../../shared/annotations/Throttle';
import APIControllerWrapper from "../../../shared/modules/API/APIControllerWrapper";
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ContextFilterVOHandler from '../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextQueryVO, { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ManualTasksController from '../../../shared/modules/Cron/ManualTasksController';
import IUserData from '../../../shared/modules/DAO/interface/IUserData';
import ModuleTableVO from '../../../shared/modules/DAO/vos/ModuleTableVO';
import EventifyEventListenerConfVO from '../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleGPT from '../../../shared/modules/GPT/ModuleGPT';
import GPTAssistantAPIAssistantFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantFunctionVO';
import GPTAssistantAPIAssistantVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIFileVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFileVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import GPTAssistantAPIRunStepVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIRunStepVO';
import GPTAssistantAPIRunVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIRunVO';
import GPTAssistantAPIThreadMessageContentVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageContentVO';
import GPTAssistantAPIThreadMessageVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import GPTAssistantAPIThreadVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import GPTAssistantAPIVectorStoreFileBatchVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIVectorStoreFileBatchVO';
import GPTAssistantAPIVectorStoreFileVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIVectorStoreFileVO';
import GPTAssistantAPIVectorStoreVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIVectorStoreVO';
import GPTCompletionAPIConversationVO from '../../../shared/modules/GPT/vos/GPTCompletionAPIConversationVO';
import GPTCompletionAPIMessageVO from '../../../shared/modules/GPT/vos/GPTCompletionAPIMessageVO';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import OseliaThreadUserVO from '../../../shared/modules/Oselia/vos/OseliaThreadUserVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../shared/tools/PromiseTools';
import ConfigurationService from '../../env/ConfigurationService';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPostCreateTriggerHook from '../DAO/triggers/DAOPostCreateTriggerHook';
import DAOPostDeleteTriggerHook from '../DAO/triggers/DAOPostDeleteTriggerHook';
import DAOPostUpdateTriggerHook from '../DAO/triggers/DAOPostUpdateTriggerHook';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import DAOPreDeleteTriggerHook from '../DAO/triggers/DAOPreDeleteTriggerHook';
import DAOPreUpdateTriggerHook from '../DAO/triggers/DAOPreUpdateTriggerHook';
import { originalCreateReadStream } from '../File/ArchiveServerController';
import ModuleFileServer from '../File/ModuleFileServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import ParamsServerController from '../Params/ParamsServerController';
import PerfReportServerController from '../PerfReport/PerfReportServerController';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';
import GPTAssistantAPIServerController from './GPTAssistantAPIServerController';
import AssistantVoTypeDescription from './functions/get_vo_type_description/AssistantVoTypeDescription';
import GPTAssistantAPIFunctionGetVoTypeDescriptionController from './functions/get_vo_type_description/GPTAssistantAPIFunctionGetVoTypeDescriptionController';
import GPTAssistantAPIServerSyncAssistantsController from './sync/GPTAssistantAPIServerSyncAssistantsController';
import GPTAssistantAPIServerSyncController from './sync/GPTAssistantAPIServerSyncController';
import GPTAssistantAPIServerSyncFilesController from './sync/GPTAssistantAPIServerSyncFilesController';
import GPTAssistantAPIServerSyncRunStepsController from './sync/GPTAssistantAPIServerSyncRunStepsController';
import GPTAssistantAPIServerSyncRunsController from './sync/GPTAssistantAPIServerSyncRunsController';
import GPTAssistantAPIServerSyncThreadMessagesController from './sync/GPTAssistantAPIServerSyncThreadMessagesController';
import GPTAssistantAPIServerSyncThreadsController from './sync/GPTAssistantAPIServerSyncThreadsController';
import GPTAssistantAPIServerSyncVectorStoreFileBatchesController from './sync/GPTAssistantAPIServerSyncVectorStoreFileBatchesController';
import GPTAssistantAPIServerSyncVectorStoreFilesController from './sync/GPTAssistantAPIServerSyncVectorStoreFilesController';
import GPTAssistantAPIServerSyncVectorStoresController from './sync/GPTAssistantAPIServerSyncVectorStoresController';
import ModuleProgramPlanBase from '../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import IPlanRDVCR from '../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import GPTAssistantAPIThreadMessageContentTextVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageContentTextVO';
import SortByVO from '../../../shared/modules/ContextFilter/vos/SortByVO';

export default class ModuleGPTServer extends ModuleServerBase {

    public static MESSAGE_CONTENT_TTS_FILE_PATH: string = './sfiles/message_content_tts/';
    public static MESSAGE_CONTENT_TTS_FILE_PREFIX: string = 'message_content_tts_';
    public static MESSAGE_CONTENT_TTS_FILE_SUFFIX: string = '.mp3';
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


    @Throttle({
        param_type: EventifyEventListenerConfVO.PARAM_TYPE_MAP,
        throttle_ms: 1000,
        leading: false,
    })
    private async set_message_is_ready(message_ids: { [id: number]: boolean }) {
        await query(GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
            .filter_by_ids(Object.keys(message_ids).map((id) => parseInt(id)))
            .exec_as_server()
            .update_vos({
                is_ready: true,
            } as GPTAssistantAPIThreadMessageVO);
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleGPT.APINAME_generate_response, this.generate_response.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleGPT.APINAME_ask_assistant, this.ask_assistant.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleGPT.APINAME_rerun, this.rerun.bind(this));
        APIControllerWrapper.register_server_api_handler(ModuleGPT.getInstance().name, reflect<ModuleGPT>().get_tts_file, this.get_tts_file.bind(this));
        APIControllerWrapper.register_server_api_handler(ModuleGPT.getInstance().name, reflect<ModuleGPT>().transcribe_file, this.transcribe_file.bind(this));
        APIControllerWrapper.register_server_api_handler(ModuleGPT.getInstance().name, reflect<ModuleGPT>().summerize, this.summerize.bind(this));
        APIControllerWrapper.register_server_api_handler(ModuleGPT.getInstance().name, reflect<ModuleGPT>().edit_cr_word, this.edit_cr_word.bind(this));
        APIControllerWrapper.register_server_api_handler(ModuleGPT.getInstance().name, reflect<ModuleGPT>().insert_comprehended_text, this.insert_comprehended_text.bind(this));
        APIControllerWrapper.register_server_api_handler(ModuleGPT.getInstance().name, reflect<ModuleGPT>().connect_to_realtime_voice, this.connect_to_realtime_voice.bind(this));

        ManualTasksController.getInstance().registered_manual_tasks_by_name[ModuleGPT.MANUAL_TASK_NAME_sync_openai_datas] = this.sync_openai_datas;
    }

    public async sync_openai_datas() {
        await GPTAssistantAPIServerSyncController.sync_all_datas();
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

    /**
     * istanbul ignore next: cannot test extern apis
     * @deprecated use Assistants instead => cheaper / faster / better control. Will be removed soon
     */
    public async generate_response(conversation: GPTCompletionAPIConversationVO, newPrompt: GPTCompletionAPIMessageVO): Promise<GPTCompletionAPIMessageVO> {
        try {
            const modelId = await ParamsServerController.getParamValueAsString(ModuleGPT.PARAM_NAME_MODEL_ID, "gpt-4-turbo-preview", 60000);

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

    public async ask_assistant(
        assistant_id: string,
        thread_id: string,
        thread_title: string,
        content: string,
        files: FileVO[],
        user_id: number,
        hide_content: boolean,
    ): Promise<GPTAssistantAPIThreadMessageVO[]> {
        return GPTAssistantAPIServerController.ask_assistant(assistant_id, thread_id, thread_title, content, files, user_id, hide_content);
    }

    /**
     * Demander un run d'un assistant suite à un nouveau message
     * @param session_id null pour une nouvelle session, id de la session au sens de l'API GPT
     * @param conversation_id null pour un nouveau thread, sinon l'id du thread au sens de l'API GPT
     * @param user_id contenu text du nouveau message
     * @returns
     */
    public async connect_to_realtime_voice(
        session_id: string,
        conversation_id: string,
        thread_id: string,
        user_id: number,
    ): Promise<void> {
        return await GPTAssistantAPIServerController.connect_to_realtime_voice(session_id, conversation_id, thread_id, user_id);
    }

    public async assistant_function_get_vo_type_description_controller(
        thread_vo: GPTAssistantAPIThreadVO,
        api_type_id: string,
    ): Promise<AssistantVoTypeDescription> {
        return GPTAssistantAPIFunctionGetVoTypeDescriptionController.run_action(thread_vo, api_type_id);
    }

    // istanbul ignore next: cannot test configure
    public async configure() {

        PerfReportServerController.register_perf_module(GPTAssistantAPIServerController.PERF_MODULE_NAME);
        PerfReportServerController.register_perf_module(GPTAssistantAPIServerSyncController.PERF_MODULE_NAME);

        const preCreateTrigger: DAOPreCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        const preUpdateTrigger: DAOPreUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        const preDeleteTrigger: DAOPreDeleteTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreDeleteTriggerHook.DAO_PRE_DELETE_TRIGGER);

        const postCreateTrigger: DAOPostCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        const postUpdateTrigger: DAOPostUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);
        const postDeleteTrigger: DAOPostDeleteTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostDeleteTriggerHook.DAO_POST_DELETE_TRIGGER);

        preCreateTrigger.registerHandler(GPTCompletionAPIConversationVO.API_TYPE_ID, this, this.handleTriggerPreCreateGPTCompletionAPIConversationVO);

        /**
         * On défini les triggers des synchros avec OpenAI
         *  Fonctionnement : En pre : on demande un push vers OpenAI si le on est informé d'une synchro nécessaire, on refuse la mise à jour et on log une erreur. On devrait pouvoir push la modif ou alors faut pas pouvoir la faire.
         */

        /**
         * GPTAssistantAPIAssistantFunctionVO
         * On est en post, car on pousse l'assistant qui ensuite fait des requetes pour charger les fonctions depuis la bdd
         */
        postCreateTrigger.registerHandler(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID, GPTAssistantAPIServerSyncAssistantsController, GPTAssistantAPIServerSyncAssistantsController.post_create_trigger_handler_for_AssistantFunctionVO);
        postUpdateTrigger.registerHandler(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID, GPTAssistantAPIServerSyncAssistantsController, GPTAssistantAPIServerSyncAssistantsController.post_update_trigger_handler_for_AssistantFunctionVO);
        postDeleteTrigger.registerHandler(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID, GPTAssistantAPIServerSyncAssistantsController, GPTAssistantAPIServerSyncAssistantsController.post_delete_trigger_handler_for_AssistantFunctionVO);

        // GPTAssistantAPIAssistantVO
        preCreateTrigger.registerHandler(GPTAssistantAPIAssistantVO.API_TYPE_ID, GPTAssistantAPIServerSyncAssistantsController, GPTAssistantAPIServerSyncAssistantsController.pre_create_trigger_handler_for_AssistantVO);
        preUpdateTrigger.registerHandler(GPTAssistantAPIAssistantVO.API_TYPE_ID, GPTAssistantAPIServerSyncAssistantsController, GPTAssistantAPIServerSyncAssistantsController.pre_update_trigger_handler_for_AssistantVO);
        preDeleteTrigger.registerHandler(GPTAssistantAPIAssistantVO.API_TYPE_ID, GPTAssistantAPIServerSyncAssistantsController, GPTAssistantAPIServerSyncAssistantsController.pre_delete_trigger_handler_for_AssistantVO);

        // GPTAssistantAPIFileVO
        preCreateTrigger.registerHandler(GPTAssistantAPIFileVO.API_TYPE_ID, GPTAssistantAPIServerSyncFilesController, GPTAssistantAPIServerSyncFilesController.pre_create_trigger_handler_for_FileVO);
        preUpdateTrigger.registerHandler(GPTAssistantAPIFileVO.API_TYPE_ID, GPTAssistantAPIServerSyncFilesController, GPTAssistantAPIServerSyncFilesController.pre_update_trigger_handler_for_FileVO);
        preDeleteTrigger.registerHandler(GPTAssistantAPIFileVO.API_TYPE_ID, GPTAssistantAPIServerSyncFilesController, GPTAssistantAPIServerSyncFilesController.pre_delete_trigger_handler_for_FileVO);

        // GPTAssistantAPIThreadVO
        preCreateTrigger.registerHandler(GPTAssistantAPIThreadVO.API_TYPE_ID, GPTAssistantAPIServerSyncThreadsController, GPTAssistantAPIServerSyncThreadsController.pre_create_trigger_handler_for_ThreadVO);
        preUpdateTrigger.registerHandler(GPTAssistantAPIThreadVO.API_TYPE_ID, GPTAssistantAPIServerSyncThreadsController, GPTAssistantAPIServerSyncThreadsController.pre_update_trigger_handler_for_ThreadVO);
        preDeleteTrigger.registerHandler(GPTAssistantAPIThreadVO.API_TYPE_ID, GPTAssistantAPIServerSyncThreadsController, GPTAssistantAPIServerSyncThreadsController.pre_delete_trigger_handler_for_ThreadVO);

        // GPTAssistantAPIVectorStoreFileBatchVO
        preCreateTrigger.registerHandler(GPTAssistantAPIVectorStoreFileBatchVO.API_TYPE_ID, GPTAssistantAPIServerSyncVectorStoreFileBatchesController, GPTAssistantAPIServerSyncVectorStoreFileBatchesController.pre_create_trigger_handler_for_VectorStoreFileBatchVO);
        preUpdateTrigger.registerHandler(GPTAssistantAPIVectorStoreFileBatchVO.API_TYPE_ID, GPTAssistantAPIServerSyncVectorStoreFileBatchesController, GPTAssistantAPIServerSyncVectorStoreFileBatchesController.pre_update_trigger_handler_for_VectorStoreFileBatchVO);
        preDeleteTrigger.registerHandler(GPTAssistantAPIVectorStoreFileBatchVO.API_TYPE_ID, GPTAssistantAPIServerSyncVectorStoreFileBatchesController, GPTAssistantAPIServerSyncVectorStoreFileBatchesController.pre_delete_trigger_handler_for_VectorStoreFileBatchVO);

        // GPTAssistantAPIVectorStoreFileVO
        preCreateTrigger.registerHandler(GPTAssistantAPIVectorStoreFileVO.API_TYPE_ID, GPTAssistantAPIServerSyncVectorStoreFilesController, GPTAssistantAPIServerSyncVectorStoreFilesController.pre_create_trigger_handler_for_VectorStoreFileVO);
        preUpdateTrigger.registerHandler(GPTAssistantAPIVectorStoreFileVO.API_TYPE_ID, GPTAssistantAPIServerSyncVectorStoreFilesController, GPTAssistantAPIServerSyncVectorStoreFilesController.pre_update_trigger_handler_for_VectorStoreFileVO);
        preDeleteTrigger.registerHandler(GPTAssistantAPIVectorStoreFileVO.API_TYPE_ID, GPTAssistantAPIServerSyncVectorStoreFilesController, GPTAssistantAPIServerSyncVectorStoreFilesController.pre_delete_trigger_handler_for_VectorStoreFileVO);

        // GPTAssistantAPIVectorStoreVO
        preCreateTrigger.registerHandler(GPTAssistantAPIVectorStoreVO.API_TYPE_ID, GPTAssistantAPIServerSyncVectorStoresController, GPTAssistantAPIServerSyncVectorStoresController.pre_create_trigger_handler_for_VectorStoreVO);
        preUpdateTrigger.registerHandler(GPTAssistantAPIVectorStoreVO.API_TYPE_ID, GPTAssistantAPIServerSyncVectorStoresController, GPTAssistantAPIServerSyncVectorStoresController.pre_update_trigger_handler_for_VectorStoreVO);
        preDeleteTrigger.registerHandler(GPTAssistantAPIVectorStoreVO.API_TYPE_ID, GPTAssistantAPIServerSyncVectorStoresController, GPTAssistantAPIServerSyncVectorStoresController.pre_delete_trigger_handler_for_VectorStoreVO);

        /**
         * GPTAssistantAPIFunctionParamVO
         * On est en post, car on pousse l'assistant qui ensuite fait des requetes pour charger les fonctions depuis la bdd
         */
        postCreateTrigger.registerHandler(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID, GPTAssistantAPIServerSyncAssistantsController, GPTAssistantAPIServerSyncAssistantsController.post_create_trigger_handler_for_AssistantFunctionVO);
        postUpdateTrigger.registerHandler(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID, GPTAssistantAPIServerSyncAssistantsController, GPTAssistantAPIServerSyncAssistantsController.post_update_trigger_handler_for_AssistantFunctionVO);
        postDeleteTrigger.registerHandler(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID, GPTAssistantAPIServerSyncAssistantsController, GPTAssistantAPIServerSyncAssistantsController.post_delete_trigger_handler_for_AssistantFunctionVO);

        /**
         * GPTAssistantAPIFunctionVO
         * On est en post, car on pousse l'assistant qui ensuite fait des requetes pour charger les fonctions depuis la bdd
         */
        postCreateTrigger.registerHandler(GPTAssistantAPIFunctionVO.API_TYPE_ID, GPTAssistantAPIServerSyncAssistantsController, GPTAssistantAPIServerSyncAssistantsController.post_create_trigger_handler_for_FunctionVO);
        postUpdateTrigger.registerHandler(GPTAssistantAPIFunctionVO.API_TYPE_ID, GPTAssistantAPIServerSyncAssistantsController, GPTAssistantAPIServerSyncAssistantsController.post_update_trigger_handler_for_FunctionVO);
        postDeleteTrigger.registerHandler(GPTAssistantAPIFunctionVO.API_TYPE_ID, GPTAssistantAPIServerSyncAssistantsController, GPTAssistantAPIServerSyncAssistantsController.post_delete_trigger_handler_for_FunctionVO);

        // GPTAssistantAPIRunStepVO
        preCreateTrigger.registerHandler(GPTAssistantAPIRunStepVO.API_TYPE_ID, GPTAssistantAPIServerSyncRunStepsController, GPTAssistantAPIServerSyncRunStepsController.pre_create_trigger_handler_for_RunStepVO);
        preUpdateTrigger.registerHandler(GPTAssistantAPIRunStepVO.API_TYPE_ID, GPTAssistantAPIServerSyncRunStepsController, GPTAssistantAPIServerSyncRunStepsController.pre_update_trigger_handler_for_RunStepVO);
        preDeleteTrigger.registerHandler(GPTAssistantAPIRunStepVO.API_TYPE_ID, GPTAssistantAPIServerSyncRunStepsController, GPTAssistantAPIServerSyncRunStepsController.pre_delete_trigger_handler_for_RunStepVO);

        // GPTAssistantAPIRunVO
        preCreateTrigger.registerHandler(GPTAssistantAPIRunVO.API_TYPE_ID, GPTAssistantAPIServerSyncRunsController, GPTAssistantAPIServerSyncRunsController.pre_create_trigger_handler_for_RunVO);
        preUpdateTrigger.registerHandler(GPTAssistantAPIRunVO.API_TYPE_ID, GPTAssistantAPIServerSyncRunsController, GPTAssistantAPIServerSyncRunsController.pre_update_trigger_handler_for_RunVO);
        preDeleteTrigger.registerHandler(GPTAssistantAPIRunVO.API_TYPE_ID, GPTAssistantAPIServerSyncRunsController, GPTAssistantAPIServerSyncRunsController.pre_delete_trigger_handler_for_RunVO);

        /**
         * GPTAssistantAPIThreadMessageContentVO
         * On est en post, car on pousse l'assistant qui ensuite fait des requetes pour charger les fonctions depuis la bdd
         */
        postCreateTrigger.registerHandler(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, GPTAssistantAPIServerSyncThreadMessagesController, GPTAssistantAPIServerSyncThreadMessagesController.post_create_trigger_handler_for_ThreadMessageContentVO);
        postUpdateTrigger.registerHandler(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, GPTAssistantAPIServerSyncThreadMessagesController, GPTAssistantAPIServerSyncThreadMessagesController.post_update_trigger_handler_for_ThreadMessageContentVO);
        postDeleteTrigger.registerHandler(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, GPTAssistantAPIServerSyncThreadMessagesController, GPTAssistantAPIServerSyncThreadMessagesController.post_delete_trigger_handler_for_ThreadMessageContentVO);


        // GPTAssistantAPIThreadMessageVO
        preCreateTrigger.registerHandler(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, GPTAssistantAPIServerSyncThreadMessagesController, GPTAssistantAPIServerSyncThreadMessagesController.pre_create_trigger_handler_for_ThreadMessageVO);
        preUpdateTrigger.registerHandler(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, GPTAssistantAPIServerSyncThreadMessagesController, GPTAssistantAPIServerSyncThreadMessagesController.pre_update_trigger_handler_for_ThreadMessageVO);
        preDeleteTrigger.registerHandler(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, GPTAssistantAPIServerSyncThreadMessagesController, GPTAssistantAPIServerSyncThreadMessagesController.pre_delete_trigger_handler_for_ThreadMessageVO);

        // Juste pour init la date
        preCreateTrigger.registerHandler(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, this, this.pre_create_trigger_handler_for_ThreadMessageVO);

        /**
         * On configure le pipe des messages pour les pousser aussi dans le thread cible si on a un thread cible
         */
        postCreateTrigger.registerHandler(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, GPTAssistantAPIServerController, this.postcreate_ThreadMessageVO_handle_pipe);
        postCreateTrigger.registerHandler(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, GPTAssistantAPIServerController, this.postcreate_ThreadMessageContentVO_handle_pipe);

        if(ModuleProgramPlanBase.getInstance().rdv_cr_type_id){
            postUpdateTrigger.registerHandler(ModuleProgramPlanBase.getInstance().rdv_cr_type_id, GPTAssistantAPIServerController, GPTAssistantAPIServerController.postupdate_rdv_cr_vo_handle_pipe);
        }

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

    public async late_configuration(is_generator: boolean): Promise<void> {
        if (is_generator) {
            return;
        }

        // On va juste arrêter tous les runs encore en cours au démarrage de l'application pour le moment, jusqu'à ce qu'on ait un système de reprise
        // TODO FIXME : mettre en place un système de reprise

        if (!isMainThread) {
            // On évite de le faire sur tous les processus
            return;
        }

        const runs: GPTAssistantAPIRunVO[] = await query(GPTAssistantAPIRunVO.API_TYPE_ID)
            .filter_by_num_has(field_names<GPTAssistantAPIRunVO>().status, [
                GPTAssistantAPIRunVO.STATUS_INCOMPLETE,
                GPTAssistantAPIRunVO.STATUS_IN_PROGRESS,
                GPTAssistantAPIRunVO.STATUS_QUEUED,
                GPTAssistantAPIRunVO.STATUS_REQUIRES_ACTION,
            ])
            .exec_as_server()
            .select_vos<GPTAssistantAPIRunVO>();

        for (const i in runs) {
            const run = runs[i];

            run.status = GPTAssistantAPIRunVO.STATUS_CANCELLED;
            await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
                .filter_by_id(run.thread_id)
                .exec_as_server()
                .update_vos<GPTAssistantAPIThreadVO>({
                oselia_is_running: false,
            });
        }
        await ModuleDAOServer.instance.insertOrUpdateVOs_as_server(runs);

        const promises = [];
        for (const i in runs) {
            const run = runs[i];

            promises.push((async () => {
                try {
                    await GPTAssistantAPIServerController.wrap_api_call(
                        ModuleGPTServer.openai.beta.threads.runs.cancel,
                        ModuleGPTServer.openai.beta.threads.runs,
                        run.gpt_thread_id,
                        run.gpt_run_id,
                    );
                } catch (error) {
                    ConsoleHandler.warn('Error while cancelling run', error);
                }
            })());
        }
        await all_promises(promises); // Attention Promise[] ne maintient pas le stackcontext a priori de façon systématique, contrairement au PromisePipeline. Ce n'est pas un contexte client donc OSEF ici
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

        let POLICY_USE_OSELIA_REALTIME: AccessPolicyVO = new AccessPolicyVO();
        POLICY_USE_OSELIA_REALTIME.group_id = group.id;
        POLICY_USE_OSELIA_REALTIME.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_USE_OSELIA_REALTIME.translatable_name = ModuleGPT.POLICY_USE_OSELIA_REALTIME;
        POLICY_USE_OSELIA_REALTIME = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_USE_OSELIA_REALTIME, DefaultTranslationVO.create_new({
            'fr-fr': 'API: use oselia realtime voice'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let POLICY_USE_OSELIA_REALTIME_IN_CR: AccessPolicyVO = new AccessPolicyVO();
        POLICY_USE_OSELIA_REALTIME_IN_CR.group_id = group.id;
        POLICY_USE_OSELIA_REALTIME_IN_CR.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_USE_OSELIA_REALTIME_IN_CR.translatable_name = ModuleGPT.POLICY_USE_OSELIA_REALTIME_IN_CR;
        POLICY_USE_OSELIA_REALTIME_IN_CR = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_USE_OSELIA_REALTIME_IN_CR, DefaultTranslationVO.create_new({
            'fr-fr': 'API: use oselia realtime voice in CR'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    public registerAccessHooks(): void {
        ModuleDAOServer.getInstance().registerContextAccessHook(GPTAssistantAPIThreadVO.API_TYPE_ID, this, this.filterThreadsByUserIn);
    }


    /**
     * Context access hook pour les Threads. On sélectionne l'id des vos valides
     * @param moduletable La table sur laquelle on fait la demande
     * @param uid L'uid lié à la session qui fait la requête
     * @param user L'utilisateur qui fait la requête
     * @param user_data Les datas de profil de l'utilisateur qui fait la requête
     * @param user_roles Les rôles de l'utilisateur qui fait la requête
     * @returns la query qui permet de filtrer les vos valides
     */
    private async filterThreadsByUserIn(moduletable: ModuleTableVO, uid: number, user: UserVO, user_data: IUserData, user_roles: RoleVO[]): Promise<ContextQueryVO> {

        const loggedUserId: number = ModuleAccessPolicyServer.getLoggedUserId();
        if (!loggedUserId) {
            return ContextFilterVOHandler.get_empty_res_context_hook_query(moduletable.vo_type);
        }

        if (user_roles && user_roles.find((role) => role.id == AccessPolicyServerController.role_admin.id)) {
            const res: ContextQueryVO = query(moduletable.vo_type)
                .field(field_names<IDistantVOBase>().id, 'filter_' + moduletable.vo_type + '_id')
                .exec_as_server();

            return res;
        }
        const res: ContextQueryVO = query(moduletable.vo_type)
            .field(field_names<IDistantVOBase>().id, 'filter_' + moduletable.vo_type + '_id')
            .filter_by_num_in(field_names<GPTAssistantAPIThreadVO>().id,
                query(OseliaThreadUserVO.API_TYPE_ID)
                    .filter_by_num_eq(field_names<OseliaThreadUserVO>().user_id, loggedUserId)
                    .field(field_names<OseliaThreadUserVO>().thread_id))
            .exec_as_server();

        return res;
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
            if (ConfigurationService.node_configuration.block_openai_sync_push_to_openai) {
                throw new Error('OpenAI sync is blocked');
            }

            return await GPTAssistantAPIServerController.wrap_api_call(
                ModuleGPTServer?.openai?.chat?.completions?.create,
                ModuleGPTServer?.openai?.chat?.completions,
                {
                    model: modelId,
                    messages: currentMessages as ChatCompletionMessageParam[],
                });
        } catch (err) {
            ConsoleHandler.error(err);
        }

        return null;
    }

    private async api_response_handler(conversation: GPTCompletionAPIConversationVO, result: any): Promise<GPTCompletionAPIMessageVO> {
        try {
            const responseText = result?.choices?.length ? result.choices.shift().message.content : null;
            const responseMessage: GPTCompletionAPIMessageVO = new GPTCompletionAPIMessageVO();
            responseMessage.date = Dates.now();
            responseMessage.content = responseText;
            responseMessage.role_type = GPTCompletionAPIMessageVO.GPTMSG_ROLE_TYPE_ASSISTANT;
            responseMessage.conversation_id = conversation.id;

            // Add the assistant's response to the conversation
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(responseMessage);

            return responseMessage;
        } catch (err) {
            ConsoleHandler.error(err);
        }

        return null;
    }

    private pre_create_trigger_handler_for_ThreadMessageVO(vo: GPTAssistantAPIThreadMessageVO): boolean {
        vo.date = vo.created_at ? vo.created_at : Dates.now();
        return true;
    }

    private async transcribe_file(filevo_id: number, auto_commit_auto_input: boolean, gpt_assistant_id: string, gpt_thread_id: string, user_id: number): Promise<string> {
        const filevo: FileVO = await query(FileVO.API_TYPE_ID)
            .filter_by_id(filevo_id)
            .exec_as_server()
            .select_vo<FileVO>();

        if (!filevo) {
            ConsoleHandler.error('transcribe_file:File not found');
            return null;
        }

        const file_path: string = filevo.path;
        if (!file_path) {
            ConsoleHandler.error('transcribe_file:File path not found');
            return null;
        }

        let transcription = null;
        try {
            // const fileBuffer = await ModuleFileServer.getInstance().readFile(file_path);

            // transcription = await GPTAssistantAPIServerController.wrap_api_call(
            //     ModuleGPTServer.openai.audio.transcriptions.create,
            //     ModuleGPTServer.openai.audio.transcriptions,
            //     {
            //         file: new Blob([fileBuffer], { type: 'audio/webm' }) as any,
            //         stream: true,
            //         model: 'gpt-4o-mini-transcribe',
            //         language: 'fr',
            //     });


            const instructions = "Don't try to transcribe exactly the text but give the text that most reliably resembles the meaning. If you're unsure, you can use the word 'inaudible' to indicate that a word is unclear or inaudible. If you're unsure about a phrase, you can use the word 'inaudible' to indicate that a phrase is unclear or inaudible. If you're unsure about a sentence, you can use the word 'inaudible' to indicate that a sentence is unclear or inaudible. If you're unsure about a paragraph, you can use the word 'inaudible' to indicate that a paragraph is unclear or inaudible. If you're unsure about a section, you can use the word 'inaudible' to indicate that a section is unclear or inaudible. If you're unsure about a chapter, you can use the word 'inaudible' to indicate that a chapter is unclear or inaudible. If you're unsure about a page, you can use the word 'inaudible' to indicate that a page is unclear or inaudible. If you're unsure about a book, you can use the word 'inaudible' to indicate that a book is unclear or inaudible.";

            transcription = await GPTAssistantAPIServerController.wrap_api_call(
                ModuleGPTServer.openai.audio.transcriptions.create,
                ModuleGPTServer.openai.audio.transcriptions,
                {
                    file: originalCreateReadStream(file_path) as unknown as FileLike,
                    model: 'gpt-4o-transcribe',
                    language: 'fr',
                    instructions
                } as any);

            if (!transcription.text) {
                ConsoleHandler.error('transcribe_file:No transcription found');
                return null;
            }

            if (auto_commit_auto_input) {
                await ModuleGPT.getInstance().ask_assistant(
                    gpt_assistant_id,
                    gpt_thread_id,
                    null,
                    transcription.text,
                    null,
                    user_id,
                    false
                );
            }

        } catch (error) {
            ConsoleHandler.error('transcribe_file:ERROR:' + error);
        }

        return transcription.text;
    }

    private async get_tts_file(message_content_id: number): Promise<FileVO> {
        if (!message_content_id) {
            return null;
        }

        const message_content: GPTAssistantAPIThreadMessageContentVO = await query(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID)
            .filter_by_id(message_content_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIThreadMessageContentVO>();

        if (!message_content) {
            return null;
        }

        let file: FileVO = null;
        if (!message_content.tts_file_id) {
            // On génère via l'api GPT
            const speech_file_path = ModuleGPTServer.MESSAGE_CONTENT_TTS_FILE_PATH + ModuleGPTServer.MESSAGE_CONTENT_TTS_FILE_PREFIX + message_content.id + ModuleGPTServer.MESSAGE_CONTENT_TTS_FILE_SUFFIX;
            // const instructions = "Affect/personality: A cheerful guide \n\nTone: Friendly, clear, and reassuring, creating a calm atmosphere and making the listener feel confident and comfortable.\n\nPronunciation: Clear, articulate, and steady, ensuring each instruction is easily understood while maintaining a natural, conversational flow.\n\nPause: Brief, purposeful pauses after key instructions (e.g., \"cross the street\" and \"turn right\") to allow time for the listener to process the information and follow along.\n\nEmotion: Warm and supportive, conveying empathy and care, ensuring the listener feels guided and safe throughout the journey.";
            const instructions = "Don't try to read exactly, but with the given text, try to convey the meaning in a way that is most natural and clear.";
            const response = await ModuleGPTServer.openai.audio.speech.create({
                model: "gpt-4o-mini-tts",
                voice: "shimmer",
                input: message_content.content_type_text.value,
                instructions,
            });
            // await response.stream_to_file(speech_file_path); // Doc GPT mais j'ai pas cette fonction :)
            const buffer = Buffer.from(await response.arrayBuffer());
            await ModuleFileServer.getInstance().makeSureThisFolderExists(ModuleGPTServer.MESSAGE_CONTENT_TTS_FILE_PATH);
            await ModuleFileServer.getInstance().writeFile(speech_file_path, buffer);

            file = new FileVO();
            file.path = speech_file_path;
            file.file_access_policy_name = ModuleGPT.POLICY_BO_ACCESS;
            file.is_secured = true;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(file);
            message_content.tts_file_id = file.id;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(message_content);
        } else {
            file = await query(FileVO.API_TYPE_ID)
                .filter_by_id(message_content.tts_file_id)
                .exec_as_server()
                .select_vo<FileVO>();
        }

        return file;
    }

    private async summerize(thread_vo: number): Promise<FileVO> {
        throw new Error('Not implemented');
    }

    private async insert_comprehended_text(target_thread_id: string, comprehension: string, user_id: number): Promise<void> {
        if (!target_thread_id || !comprehension || !user_id) {
            ConsoleHandler.error('insertComprehendedText: Invalid parameters');
            return;
        }
        const thread_vo: GPTAssistantAPIThreadVO = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
            .filter_by_id(parseInt(target_thread_id))
            .exec_as_server()
            .select_vo<GPTAssistantAPIThreadVO>();

        if (!thread_vo) {
            ConsoleHandler.error('insertComprehendedText: Thread not found');
            return;
        }

        const current_user = await query(UserVO.API_TYPE_ID).filter_by_id(user_id).set_limit(1).select_vo<UserVO>();
        if (!current_user) {
            ConsoleHandler.error('insertComprehendedText: User not found');
            return;
        }

        const last_thread_msg: GPTAssistantAPIThreadMessageVO = await query(GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<GPTAssistantAPIThreadMessageVO>().thread_id, thread_vo.id)
            .filter_is_false(field_names<GPTAssistantAPIThreadMessageVO>().archived)
            .set_sort(new SortByVO(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().weight, true))
            .set_limit(1)
            .exec_as_server()
            .select_vo<GPTAssistantAPIThreadMessageVO>();

        const asking_message_vo = new GPTAssistantAPIThreadMessageVO();
        asking_message_vo.date = Dates.now();
        asking_message_vo.gpt_thread_id = thread_vo.gpt_thread_id;
        asking_message_vo.thread_id = thread_vo.id;
        asking_message_vo.weight = last_thread_msg ? last_thread_msg.weight + 1 : 0;
        asking_message_vo.role = GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_USER;
        asking_message_vo.user_id = user_id ? user_id : thread_vo.user_id;
        asking_message_vo.is_ready = false;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(asking_message_vo);

        const message_content = new GPTAssistantAPIThreadMessageContentVO();
        message_content.thread_message_id = asking_message_vo.id;
        message_content.content_type_text = new GPTAssistantAPIThreadMessageContentTextVO();
        message_content.content_type_text.value = comprehension;
        message_content.gpt_thread_message_id = asking_message_vo.gpt_id;
        message_content.type = GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
        message_content.weight = 0;
        message_content.hidden = false;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(message_content);

        const content_name = new GPTAssistantAPIThreadMessageContentVO();
        content_name.thread_message_id = asking_message_vo.id;
        content_name.content_type_text = new GPTAssistantAPIThreadMessageContentTextVO();
        content_name.content_type_text.value = '<name:' + current_user.name + '>';
        content_name.gpt_thread_message_id = asking_message_vo.gpt_id;
        content_name.type = GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
        content_name.weight = 0;
        content_name.hidden = true;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(content_name);

        const content_email = new GPTAssistantAPIThreadMessageContentVO();
        content_email.thread_message_id = asking_message_vo.id;
        content_email.content_type_text = new GPTAssistantAPIThreadMessageContentTextVO();
        content_email.content_type_text.value = '<email:' + current_user.email + '>';
        content_email.gpt_thread_message_id = asking_message_vo.gpt_id;
        content_email.type = GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
        content_email.weight = 0;
        content_email.hidden = true;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(content_email);

        const content_phone = new GPTAssistantAPIThreadMessageContentVO();
        content_phone.thread_message_id = asking_message_vo.id;
        content_phone.content_type_text = new GPTAssistantAPIThreadMessageContentTextVO();
        content_phone.content_type_text.value = '<phone:' + current_user.phone + '>';
        content_phone.gpt_thread_message_id = asking_message_vo.gpt_id;
        content_phone.type = GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
        content_phone.weight = 0;
        content_phone.hidden = true;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(content_phone);

        const content_user_id = new GPTAssistantAPIThreadMessageContentVO();
        content_user_id.thread_message_id = asking_message_vo.id;
        content_user_id.content_type_text = new GPTAssistantAPIThreadMessageContentTextVO();
        content_user_id.content_type_text.value = '<user_id:' + user_id.toString() + '>';
        content_user_id.gpt_thread_message_id = asking_message_vo.gpt_id;
        content_user_id.type = GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
        content_user_id.weight = 0;
        content_user_id.hidden = true;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(content_user_id);

        asking_message_vo.is_ready = true;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(asking_message_vo);
    }

    /**
     * Met à jour une section spécifique avec un nouveau contenu HTML.
     *
     * @param new_content - Nouveau contenu HTML à insérer (peut inclure listes, gras, etc.).
     * @param section - Nom de la section à modifier.
     * @param cr_vo - Instance de IPlanRDVCR représentant le CR à modifier.
     * @param cr_field_titles - Titres des champs du CR pour identifier la section.
     * @return Promise<unknown> - Résultat de l'opération d'édition.
     */
    private async edit_cr_word(new_content: string, section: string, cr_vo: IPlanRDVCR,cr_field_titles: string[]): Promise<unknown> {
        if (!ModuleProgramPlanBase.getInstance().rdv_cr_type_id) {
            ConsoleHandler.error('edit_cr_word: No RDV CR type ID configured');
            return;
        }

        return await ModuleProgramPlanBase.getInstance().editCRSectionContent(
            new_content,
            section,
            cr_vo,
            cr_field_titles,
        );
    }

    private async postcreate_ThreadMessageVO_handle_pipe(msg: GPTAssistantAPIThreadMessageVO) {
        // 1 : On vérifie si on a un thread cible
        // 2 : On push le message dans le thread cible, on fait le lien vers ce message pour indiqué que c'est une copie issue d'un pipe
        const thread: GPTAssistantAPIThreadVO = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
            .filter_by_id(msg.thread_id)
            .exec_as_server()
            .set_max_age_ms(60000) // Le param de pipe devrait pas changer toutes les secondes... voir pas du tout en fait
            .select_vo<GPTAssistantAPIThreadVO>();

        if (!thread) {
            return;
        }

        if (!thread.pipe_outputs_to_thread_id) {
            return;
        }

        const piped_thread: GPTAssistantAPIThreadVO = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
            .filter_by_id(thread.pipe_outputs_to_thread_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIThreadVO>();

        if (!piped_thread) {
            ConsoleHandler.error('postcreate_ThreadMessageVO_handle_pipe: piped_thread not found');
            return;
        }

        const thread_message_copy = Object.assign(new GPTAssistantAPIThreadMessageVO(), msg);
        thread_message_copy.id = null;
        thread_message_copy.gpt_id = null;
        thread_message_copy.gpt_thread_id = piped_thread.gpt_thread_id;
        thread_message_copy.gpt_run_id = null;
        thread_message_copy.thread_id = thread.pipe_outputs_to_thread_id;
        thread_message_copy.piped_from_thread_message_id = msg.id;
        thread_message_copy.piped_from_thread_id = thread.id;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(thread_message_copy);
    }

    private async postcreate_ThreadMessageContentVO_handle_pipe(msg_content: GPTAssistantAPIThreadMessageContentVO) {
        // 1 : On vérifie si on a un thread cible
        // 2 : On push le message content dans le thread cible => en retrouvant la copie du message qui a du être faite déjà du coup aussi. On fait le lien vers ce message content pour indiqué que c'est une copie issue d'un pipe
        const thread: GPTAssistantAPIThreadVO = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
            .filter_by_id(msg_content.thread_message_id, GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
            .exec_as_server()
            .set_max_age_ms(60000) // Le param de pipe devrait pas changer toutes les secondes... voir pas du tout en fait
            .set_discarded_field_path(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().piped_from_thread_message_id)
            .select_vo<GPTAssistantAPIThreadVO>();

        if (!thread) {
            return;
        }

        if (!thread.pipe_outputs_to_thread_id) {
            return;
        }

        // On doit retrouver le message lié
        const piped_message: GPTAssistantAPIThreadMessageVO = await query(GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<GPTAssistantAPIThreadMessageVO>().piped_from_thread_message_id, msg_content.thread_message_id)
            .filter_by_num_eq(field_names<GPTAssistantAPIThreadMessageVO>().piped_from_thread_id, thread.id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIThreadMessageVO>();

        if (!piped_message) {
            ConsoleHandler.error('postcreate_ThreadMessageContentVO_handle_pipe: piped_message not found');
            return;
        }

        const thread_message_content_copy = Object.assign(new GPTAssistantAPIThreadMessageContentVO(), msg_content);
        thread_message_content_copy.id = null;
        thread_message_content_copy.thread_message_id = piped_message.id;
        thread_message_content_copy.piped_from_thread_message_content_id = msg_content.id;
        thread_message_content_copy.piped_from_thread_id = thread.id;
        thread_message_content_copy.gpt_thread_message_id = piped_message.gpt_id;

        let content_type_text: string = msg_content.content_type_text?.value;
        if (!content_type_text) {
            content_type_text = "<Message issu/pipe/dupliqué du thread [" + thread.id + "]>";
        } else {
            content_type_text = "<Message issu/pipe/dupliqué du thread [" + thread.id + "]> : " + content_type_text;
        }
        thread_message_content_copy.content_type_text.value = content_type_text;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(thread_message_content_copy);

        // Et comme on a fait la copie de contenu, on peut planifier le .is_ready = true sur le message
        // (on le fait pas directement des fois qu'il y ai plusieurs contenus dans ce message)
        ModuleGPTServer.getInstance().set_message_is_ready({ [piped_message.id]: true });
    }
}
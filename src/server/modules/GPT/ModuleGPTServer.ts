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
import SortByVO from '../../../shared/modules/ContextFilter/vos/SortByVO';
import ManualTasksController from '../../../shared/modules/Cron/ManualTasksController';
import IUserData from '../../../shared/modules/DAO/interface/IUserData';
import ModuleTableVO from '../../../shared/modules/DAO/vos/ModuleTableVO';
import EventsController from '../../../shared/modules/Eventify/EventsController';
import EventifyEventInstanceVO from '../../../shared/modules/Eventify/vos/EventifyEventInstanceVO';
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
import OseliaAgentMemVO from '../../../shared/modules/Oselia/vos/OseliaAgentMemVO';
import OseliaAppMemVO from '../../../shared/modules/Oselia/vos/OseliaAppMemVO';
import OseliaRunTemplateVO from '../../../shared/modules/Oselia/vos/OseliaRunTemplateVO';
import OseliaRunVO from '../../../shared/modules/Oselia/vos/OseliaRunVO';
import OseliaThreadUserVO from '../../../shared/modules/Oselia/vos/OseliaThreadUserVO';
import OseliaUserMemVO from '../../../shared/modules/Oselia/vos/OseliaUserMemVO';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
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
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import { originalCreateReadStream } from '../File/ArchiveServerController';
import ModuleFileServer from '../File/ModuleFileServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import OseliaRunTemplateServerController from '../Oselia/OseliaRunTemplateServerController';
import ParamsServerController from '../Params/ParamsServerController';
import PerfReportServerController from '../PerfReport/PerfReportServerController';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';
import ModuleVersionedServer from '../Versioned/ModuleVersionedServer';
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

export default class ModuleGPTServer extends ModuleServerBase {

    public static MESSAGE_CONTENT_TTS_FILE_PATH: string = './sfiles/message_content_tts/';
    public static MESSAGE_CONTENT_TTS_FILE_PREFIX: string = 'message_content_tts_';
    public static MESSAGE_CONTENT_TTS_FILE_SUFFIX: string = '.mp3';

    public static MESSAGE_TTS_FILE_PATH: string = './sfiles/message_tts/';
    public static MESSAGE_TTS_FILE_PREFIX: string = 'message_tts_';
    public static MESSAGE_TTS_FILE_SUFFIX: string = '.mp3';

    public static MESSAGE_OSELIA_RUN_SUMMARY_TTS_FILE_PATH: string = './sfiles/oselia_run_summary_tts/';
    public static MESSAGE_OSELIA_RUN_SUMMARY_TTS_FILE_PREFIX: string = 'oselia_run_summary_tts_';
    public static MESSAGE_OSELIA_RUN_SUMMARY_TTS_FILE_SUFFIX: string = '.mp3';

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

    /**
     * Dans un contexte vocal (oselia run associé au message avec option vocale), on génère le fichier audio quand le message est complet
     */
    @Throttle({
        param_type: EventifyEventListenerConfVO.PARAM_TYPE_MAP,
        throttle_ms: 1000,
        leading: false,
    })
    private async auto_get_tts_file(message_content_vo_by_id: { [id: number]: GPTAssistantAPIThreadMessageContentVO }) {

        const mesage_by_id: { [id: number]: GPTAssistantAPIThreadMessageVO } = {};

        const promises = [] as Promise<any>[]; // On va faire un tableau de promesses pour les lancer en parallèle
        for (const i in message_content_vo_by_id) {
            const message_content_vo = message_content_vo_by_id[i];

            if (message_content_vo.tts_file_id) {
                // On ne fait rien si le message a déjà un fichier tts
                continue;
            }

            promises.push(
                (async () => {
                    const message_vo = await query(GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
                        .filter_by_id(message_content_vo.thread_message_id, GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
                        .exec_as_server()
                        .select_vo<GPTAssistantAPIThreadMessageVO>();

                    if (!message_vo || !message_vo.is_ready) {
                        // On ne fait rien si le message n'est pas prêt
                        return;
                    }

                    if (!message_vo.autogen_voice_summary) {
                        // On ne fait rien si le message n'est pas en autogen
                        return;
                    }

                    mesage_by_id[message_vo.id] = message_vo;
                })()
            );
        }

        await all_promises(promises);

        // Pour tous les messages à gérer, on va générer le fichier audio
        const promises2 = [];

        for (const i in mesage_by_id) {
            const message_vo = mesage_by_id[i];

            promises2.push(
                (async () => {
                    await this.get_tts_file_for_message(message_vo.id);
                })()
            );
        }

        await all_promises(promises2);
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
        // APIControllerWrapper.registerServerApiHandler(ModuleGPT.APINAME_connect_to_realtime_voice, this.connect_to_realtime_voice.bind(this));

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
        generate_voice_summary: boolean,
    ): Promise<GPTAssistantAPIThreadMessageVO[]> {
        return GPTAssistantAPIServerController.ask_assistant(
            assistant_id,
            thread_id,
            thread_title,
            content,
            files,
            user_id,
            hide_content,
            null,
            null,
            null,
            null,
            generate_voice_summary,
        );
    }

    // /**
    //  * Demander un run d'un assistant suite à un nouveau message
    //  * @param session_id null pour une nouvelle session, id de la session au sens de l'API GPT
    //  * @param conversation_id null pour un nouveau thread, sinon l'id du thread au sens de l'API GPT
    //  * @param user_id contenu text du nouveau message
    //  * @returns
    //  */
    // public async connect_to_realtime_voice(
    //     session_id: string,
    //     conversation_id: string,
    //     user_id: number
    // ): Promise<GPTRealtimeAPIConversationItemVO[]> {
    //     return await GPTAssistantAPIServerController.connect_to_realtime_voice(session_id, conversation_id, user_id);
    // }

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

        // En amont, si on configure des mémoires sur un assitsant, on doit vérifier la présence d'une phrase dédiée à l'usage de cette mémoire, si une phrase est paramétrée en base
        preCreateTrigger.registerHandler(GPTAssistantAPIAssistantVO.API_TYPE_ID, this, this.pre_create_trigger_handler_for_AssistantVO_check_memory_appended_texts);
        preUpdateTrigger.registerHandler(GPTAssistantAPIAssistantVO.API_TYPE_ID, this, this.pre_update_trigger_handler_for_AssistantVO_check_memory_appended_texts);

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

        postUpdateTrigger.registerHandler(GPTAssistantAPIRunVO.API_TYPE_ID, this, this.on_post_update_run_emit_event);

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
        postCreateTrigger.registerHandler(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, this, this.postcreate_ThreadMessageVO_handle_pipe);
        postCreateTrigger.registerHandler(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, this, this.postcreate_ThreadMessageContentVO_handle_pipe);

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
            let responseText = result?.choices?.length ? result.choices.shift().message.content : null;
            let responseMessage: GPTCompletionAPIMessageVO = new GPTCompletionAPIMessageVO();
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

    private async transcribe_file(
        filevo_id: number,
        auto_commit_auto_input: boolean,
        gpt_assistant_id: string,
        gpt_thread_id: string,
        user_id: number,
    ): Promise<string> {

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
                    false,
                    true,
                );
            }

        } catch (error) {
            ConsoleHandler.error('transcribe_file:ERROR:' + error);
        }

        return transcription.text;
    }


    private async get_tts_file_for_message(message_id: number): Promise<FileVO> {
        if (!message_id) {
            return null;
        }

        const message: GPTAssistantAPIThreadMessageVO = await query(GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
            .filter_by_id(message_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIThreadMessageVO>();

        if (!message) {
            return null;
        }

        if (message.autogen_tts_id) {
            return await await query(FileVO.API_TYPE_ID)
                .filter_by_id(message.autogen_tts_id)
                .exec_as_server()
                .select_vo<FileVO>();
        }


        let file: FileVO = null;

        // On charge les contenus de type texte
        const contents: OpenAI.Beta.Threads.Messages.TextContentBlock[] = await GPTAssistantAPIServerSyncThreadMessagesController.message_contents_to_openai_api(message) as OpenAI.Beta.Threads.Messages.TextContentBlock[];

        if (!contents || contents.length == 0) {
            ConsoleHandler.warn('get_tts_file_for_message:No contents found:' + message_id);
            return null;
        }

        // On génère via l'api GPT
        const speech_file_path = ModuleGPTServer.MESSAGE_CONTENT_TTS_FILE_PATH + ModuleGPTServer.MESSAGE_CONTENT_TTS_FILE_PREFIX + message.id + ModuleGPTServer.MESSAGE_CONTENT_TTS_FILE_SUFFIX;
        // const instructions = "Affect/personality: A cheerful guide \n\nTone: Friendly, clear, and reassuring, creating a calm atmosphere and making the listener feel confident and comfortable.\n\nPronunciation: Clear, articulate, and steady, ensuring each instruction is easily understood while maintaining a natural, conversational flow.\n\nPause: Brief, purposeful pauses after key instructions (e.g., \"cross the street\" and \"turn right\") to allow time for the listener to process the information and follow along.\n\nEmotion: Warm and supportive, conveying empathy and care, ensuring the listener feels guided and safe throughout the journey.";


        // const instructions = "Don't try to read exactly, but with the given text, try to convey the meaning in a way that is most natural and clear.";
        // const response = await ModuleGPTServer.openai.audio.speech.create({
        //     model: "gpt-4o-mini-tts",
        //     voice: "shimmer",
        //     input: message_content.content_type_text.value,
        //     instructions,
        // });


        const instructions = "Fais un résumé très synthétique adapté à une lecture audio naturelle des messages suivants - la narratrice est 'Osélia' l'assistant vocale qui a rédigé ces messages :";
        const completion = await ModuleGPTServer.openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: instructions },
                { role: "user", content: contents.map((content) => content.text).join('\n') }
            ],
            temperature: 0.3
        });

        const texteResume = completion.choices[0].message.content;

        const instructions_tts = "Lecture agréable, avenante, pro mais pas trop formelle.";
        const response = await ModuleGPTServer.openai.audio.speech.create({
            model: "gpt-4o-mini-tts",
            voice: "shimmer",
            input: texteResume,
            instructions: instructions_tts,
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
        message.autogen_tts_id = file.id;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(message);

        return file;
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


            // const instructions = "Don't try to read exactly, but with the given text, try to convey the meaning in a way that is most natural and clear.";
            // const response = await ModuleGPTServer.openai.audio.speech.create({
            //     model: "gpt-4o-mini-tts",
            //     voice: "shimmer",
            //     input: message_content.content_type_text.value,
            //     instructions,
            // });


            const instructions = "Fais un résumé très synthétique adapté à une lecture audio naturelle des messages suivants - la narratrice est 'Osélia' l'assistant vocale qui a rédigé ces messages :";
            const completion = await ModuleGPTServer.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: instructions },
                    { role: "user", content: message_content.content_type_text.value }
                ],
                temperature: 0.3
            });

            const texteResume = completion.choices[0].message.content;

            const instructions_tts = "Lecture agréable, avenante, pro mais pas trop formelle.";
            const response = await ModuleGPTServer.openai.audio.speech.create({
                model: "gpt-4o-mini-tts",
                voice: "shimmer",
                input: texteResume,
                instructions: instructions_tts,
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

        thread_message_copy.role = GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_USER;
        thread_message_copy.user_id = await ModuleVersionedServer.getInstance().get_robot_user_id();

        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(thread_message_copy);
    }

    private push_new_oselia_run_on_supervisor_thread(thread_id: number) {
        return async () => {
            let nb_todo_runs: number = 0;
            let last_run: OseliaRunVO = null;
            let run_template = null;
            let thread_vo: GPTAssistantAPIThreadVO = null;
            await all_promises([
                (async () => {
                    // si il n'y a pas de oselia_run actuellement en attente de run, alors on en pousse un, de type nouvelles_infos_pour_superviseur
                    nb_todo_runs = await query(OseliaRunVO.API_TYPE_ID)
                        .filter_by_num_eq(field_names<OseliaRunVO>().thread_id, thread_id)
                        .filter_by_num_eq(field_names<OseliaRunVO>().state, OseliaRunVO.STATE_TODO)
                        .exec_as_server()
                        .set_limit(1)
                        .select_count();
                })(),
                (async () => {
                    // On récupère le dernier run aussi pour savoir si il est en generate_voice_summary
                    last_run = await query(OseliaRunVO.API_TYPE_ID)
                        .set_sorts([
                            new SortByVO(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().weight, false),
                            new SortByVO(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().id, false)
                        ])
                        .exec_as_server()
                        .set_limit(1)
                        .select_vo<OseliaRunVO>();
                })(),
                (async () => {
                    run_template = await query(OseliaRunTemplateVO.API_TYPE_ID)
                        .filter_by_text_eq(field_names<OseliaRunTemplateVO>().name, OseliaRunTemplateVO.NEW_DATA_FOR_SUPERVISOR_OSELIA_RUN_TEMPLATE)
                        .exec_as_server()
                        .select_vo<OseliaRunTemplateVO>();
                })(),
                (async () => {
                    thread_vo = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
                        .filter_by_id(thread_id)
                        .exec_as_server()
                        .select_vo<GPTAssistantAPIThreadVO>();
                })(),
            ]);

            if (nb_todo_runs > 0) {
                ConsoleHandler.log('push_new_oselia_run_on_supervisor_thread: already a run in todo state on thread:' + thread_id);
                return;
            }

            if (!run_template) {
                ConsoleHandler.error('push_new_oselia_run_on_supervisor_thread: run_template not found:' + OseliaRunTemplateVO.NEW_DATA_FOR_SUPERVISOR_OSELIA_RUN_TEMPLATE);
                return;
            }

            ConsoleHandler.log('push_new_oselia_run_on_supervisor_thread: creating new run on thread:' + thread_id + ' with template:' + run_template.name + ' and last_run:' + last_run?.id + ' and last_run.generate_voice_summary:' + last_run?.generate_voice_summary);
            await OseliaRunTemplateServerController.create_run_from_template(
                run_template,
                {},
                {},
                null,
                thread_vo,
                null,
                null,
                null,
                null,
                !!last_run?.generate_voice_summary,
            );
        };
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

        const piped_thread: GPTAssistantAPIThreadVO = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
            .filter_by_id(thread.pipe_outputs_to_thread_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIThreadVO>();

        if (!piped_thread) {
            ConsoleHandler.error('postcreate_ThreadMessageContentVO_handle_pipe: piped_thread not found');
            return;
        }

        this.wait_for_runs_to_finish_on_thread(piped_thread).then(async () => {

            const thread_message_content_copy = Object.assign(new GPTAssistantAPIThreadMessageContentVO(), msg_content);
            thread_message_content_copy.id = null;
            thread_message_content_copy.thread_message_id = piped_message.id;
            thread_message_content_copy.piped_from_thread_message_content_id = msg_content.id;
            thread_message_content_copy.piped_from_thread_id = thread.id;
            thread_message_content_copy.gpt_thread_message_id = piped_message.gpt_id;
            thread_message_content_copy.hidden = true; // On le cache pour pas qu'il soit visible dans la discussion

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


            // On crée un listener si pas encore existant pour rajouter un OseliaRunVO dans le thread cible, pour initier une nouvelle réflexion avec les nouveaux éléments reçus
            // On doit fairte un sémaphore pour s'assurer qu'on crée un seul oselia_run quelque soit le nombre de messages qui s'ajoutent à la discussion
            const event_name = GPTAssistantAPIRunVO.NEW_PIPED_MESSAGE_EVENT_NAME_TEMPLATE
                .replace('{gpt_thread_id}', piped_thread.gpt_thread_id.toString());

            // Si on a pas encore créé de listener pour cet event, on le fait
            if (!EventsController.registered_listeners[event_name]) {
                EventsController.on_every_event_throttle_cb(
                    event_name,
                    this.push_new_oselia_run_on_supervisor_thread(piped_thread.id).bind(this),
                    20000,
                    true,
                    EventifyEventListenerConfVO.PARAM_TYPE_NONE
                );
            }

            EventsController.emit_event(EventifyEventInstanceVO.new_event(event_name));
        });
    }

    private async pre_create_trigger_handler_for_AssistantVO_check_memory_appended_texts(assistant: GPTAssistantAPIAssistantVO): Promise<boolean> {
        return this.check_memory_appended_texts(assistant);
    }
    private async pre_update_trigger_handler_for_AssistantVO_check_memory_appended_texts(assistant_wrapper: DAOUpdateVOHolder<GPTAssistantAPIAssistantVO>): Promise<boolean> {
        return this.check_memory_appended_texts(assistant_wrapper.post_update_vo);
    }

    private async check_memory_appended_texts(assistant: GPTAssistantAPIAssistantVO): Promise<boolean> {

        // Est-ce qu'on doit ajouter ou supprimer le marqueur ?
        const appended_texts: string[] = [];

        await all_promises([
            (async () => {
                if (assistant.app_mem_access) {
                    const app_mem_access_prepended_text: string = await ModuleParams.instance.getParamValueAsString(
                        OseliaAppMemVO.ASSISTANT_INSTRUCTIONS_APPENDED_TEXT_PARAM_NAME,
                        'Penses à consulter la mémoire de l\'application - app_mem - pour comprendre le contexte de la conversation, les subtilités de cette solution, le langage métier, ...',
                        120000,
                    );
                    if (app_mem_access_prepended_text && app_mem_access_prepended_text.length) {
                        appended_texts.push(app_mem_access_prepended_text);
                    }
                }
            })(),
            (async () => {
                if (assistant.agent_mem_access) {
                    const agent_mem_access_prepended_text: string = await ModuleParams.instance.getParamValueAsString(
                        OseliaAgentMemVO.ASSISTANT_INSTRUCTIONS_APPENDED_TEXT_PARAM_NAME,
                        'AVANT le traitement consulte OBLIGATOIREMENT ta mémoire d\'assistant - agent_mem -  pour prendre en compte les retours pertinents et les compléments d\'informations qui ont pu y être stockés dans des discussions précédentes.',
                        120000,
                    );
                    if (agent_mem_access_prepended_text && agent_mem_access_prepended_text.length) {
                        appended_texts.push(agent_mem_access_prepended_text);
                    }
                }
            })(),
            (async () => {
                if (assistant.user_mem_access) {
                    const user_mem_access_prepended_text: string = await ModuleParams.instance.getParamValueAsString(
                        OseliaUserMemVO.ASSISTANT_INSTRUCTIONS_APPENDED_TEXT_PARAM_NAME,
                        'AVANT de répondre à l\'utilisateur si tu as un user_id identifié auquel répondre, tu DOIS vérifier la mémoire de cet utilisateur - user_mem - pour savoir comment formatter ta réponse, comment t\'adresser à ton interlocuteur.',
                        120000,
                    );
                    if (user_mem_access_prepended_text && user_mem_access_prepended_text.length) {
                        appended_texts.push(user_mem_access_prepended_text);
                    }
                }
            })(),
        ]);

        // On se met un marqueur pour savoir si on a déjà fait le traitement
        const appended_text: string =
            (appended_texts && appended_texts.length) ?
                ('<!-- GPTAssistantAPIMemoryVO:appended_texts START -->\n' +
                    appended_texts.join('\n') +
                    '<!-- GPTAssistantAPIMemoryVO:appended_texts END -->\n')
                :
                '';

        if (appended_text && appended_text.length) {
            // On ajoute en fin d'instructions, ou on remplace si il y avait déjà, le segment en fin d'instruction
            assistant.instructions = assistant.instructions.replace(/<!-- GPTAssistantAPIMemoryVO:appended_texts START -->[\s\S]*?<!-- GPTAssistantAPIMemoryVO:appended_texts END -->/g, appended_text);
            if (assistant.instructions.indexOf('<!-- GPTAssistantAPIMemoryVO:appended_texts START -->') === -1) {
                assistant.instructions += appended_text;
            }
        } else {
            // On supprime le segment si il existe actuellement dans les instructions de l'assistant
            assistant.instructions = assistant.instructions.replace(/<!-- GPTAssistantAPIMemoryVO:appended_texts START -->[\s\S]*?<!-- GPTAssistantAPIMemoryVO:appended_texts END -->/g, '');
        }

        return true;
    }

    private async on_post_update_run_emit_event(run_wrapper: DAOUpdateVOHolder<GPTAssistantAPIRunVO>): Promise<void> {
        // Si l'état change, on veut emit un event sur le nouvel état du thread
        if (run_wrapper.pre_update_vo.status != run_wrapper.post_update_vo.status) {
            const event_name = GPTAssistantAPIRunVO.STATUS_UPDATE_EVENT_NAME_TEMPLATE
                .replace('{rungpt_id}', run_wrapper.post_update_vo.gpt_run_id.toString());
            EventsController.emit_event(EventifyEventInstanceVO.new_event(event_name, run_wrapper.post_update_vo));
        }
    }

    private async wait_for_runs_to_finish_on_thread(thread: GPTAssistantAPIThreadVO): Promise<void> {
        /**
         * On doit vérifier que le run GPT est pas en cours, et sinon, on attend la fin du run précédent pour push les nouveaux messages
         */
        const runs = await GPTAssistantAPIServerController.wrap_api_call(
            ModuleGPTServer.openai.beta.threads.runs.list,
            ModuleGPTServer.openai.beta.threads.runs,
            thread.gpt_thread_id,
        );
        const activeRun = runs.data.find(run => ['queued', 'in_progress', 'requires_action', 'cancelling'].includes(run.status));
        if (activeRun) {
            // On doit passer par une attente de libération du thread
            const event_name = GPTAssistantAPIRunVO.STATUS_UPDATE_EVENT_NAME_TEMPLATE
                .replace('{rungpt_id}', activeRun.id.toString());

            let current_state: number = GPTAssistantAPIRunVO.FROM_OPENAI_STATUS_MAP[activeRun.status];
            const working_states: number[] = [
                GPTAssistantAPIRunVO.STATUS_QUEUED,
                GPTAssistantAPIRunVO.STATUS_IN_PROGRESS,
                GPTAssistantAPIRunVO.STATUS_REQUIRES_ACTION,
                GPTAssistantAPIRunVO.STATUS_CANCELLING,
            ];

            while (working_states.indexOf(current_state) >= 0) {
                const updated_run: GPTAssistantAPIRunVO = await EventsController.await_next_event(event_name) as GPTAssistantAPIRunVO;

                current_state = updated_run.status;
                ConsoleHandler.log('postcreate_ThreadMessageVO_handle_pipe: waiting for run to finish:' + updated_run.id + ':' + updated_run.status);
            }
        }
    }
}
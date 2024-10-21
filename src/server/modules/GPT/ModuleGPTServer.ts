import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import APIControllerWrapper from "../../../shared/modules/API/APIControllerWrapper";
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ContextQueryVO, { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ManualTasksController from '../../../shared/modules/Cron/ManualTasksController';
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
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
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
import ForkServerController from '../Fork/ForkServerController';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
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
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ContextFilterVOHandler from '../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextFilterVO from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import IUserData from '../../../shared/modules/DAO/interface/IUserData';
import ModuleTableVO from '../../../shared/modules/DAO/vos/ModuleTableVO';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import { field_names } from '../../../shared/tools/ObjectHandler';
import OseliaThreadUserVO from '../../../shared/modules/Oselia/vos/OseliaThreadUserVO';
import ContextQueryFieldVO from '../../../shared/modules/ContextFilter/vos/ContextQueryFieldVO';
import GPTRealtimeAPIConversationItemVO from '../../../shared/modules/GPT/vos/GPTRealtimeAPIConversationItemVO';

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

    public async ask_assistant(
        assistant_id: string,
        thread_id: string,
        thread_title: string,
        content: string,
        files: FileVO[],
        user_id: number,
        hide_content: boolean,
    ): Promise<GPTAssistantAPIThreadMessageVO[]> {
        return await GPTAssistantAPIServerController.ask_assistant(assistant_id, thread_id, thread_title, content, files, user_id, hide_content);
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
        return await GPTAssistantAPIFunctionGetVoTypeDescriptionController.run_action(thread_vo, api_type_id);
    }

    // istanbul ignore next: cannot test configure
    public async configure() {

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

        if (!ForkServerController.is_main_process) {
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
        await ModuleDAOServer.getInstance().insertOrUpdateVOs_as_server(runs);

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
        await all_promises(promises);
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
            if (ConfigurationService.node_configuration.block_openai_sync_push_to_openai) {
                throw new Error('OpenAI sync is blocked');
            }

            return await GPTAssistantAPIServerController.wrap_api_call(
                ModuleGPTServer.openai.chat.completions.create,
                ModuleGPTServer.openai.chat.completions,
                {
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

    private pre_create_trigger_handler_for_ThreadMessageVO(vo: GPTAssistantAPIThreadMessageVO): boolean {
        vo.date = vo.created_at ? vo.created_at : Dates.now();
        return true;
    }
}
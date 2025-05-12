import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names, reflect } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import APIDefinition from '../API/vos/APIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import NumberParamVO, { NumberParamVOStatic } from '../API/vos/apis/NumberParamVO';
import UserVO from '../AccessPolicy/vos/UserVO';
import ActionURLVO from '../ActionURL/vos/ActionURLVO';
import ManualTasksController from '../Cron/ManualTasksController';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import FileVO from '../File/vos/FileVO';
import MailVO from '../Mailer/vos/MailVO';
import Module from '../Module';
import OseliaPromptVO from '../Oselia/vos/OseliaPromptVO';
import OseliaRunVO from '../Oselia/vos/OseliaRunVO';
import OseliaThreadFeedbackVO from '../Oselia/vos/OseliaThreadFeedbackVO';
import OseliaThreadMessageFeedbackVO from '../Oselia/vos/OseliaThreadMessageFeedbackVO';
import OseliaUserPromptVO from '../Oselia/vos/OseliaUserPromptVO';
import VersionedVOController from '../Versioned/VersionedVOController';
import APIGPTAskAssistantParam, { APIGPTAskAssistantParamStatic } from './api/APIGPTAskAssistantParam';
import APIGPTGenerateResponseParam, { APIGPTGenerateResponseParamStatic } from './api/APIGPTGenerateResponseParam';
import APIGPTTranscribeParam, { APIGPTTranscribeParamStatic } from './api/APIGPTTranscribeParam';
import GPTAssistantAPIAssistantFunctionVO from './vos/GPTAssistantAPIAssistantFunctionVO';
import GPTAssistantAPIAssistantVO from './vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIErrorVO from './vos/GPTAssistantAPIErrorVO';
import GPTAssistantAPIFileVO from './vos/GPTAssistantAPIFileVO';
import GPTAssistantAPIFunctionParamVO from './vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from './vos/GPTAssistantAPIFunctionVO';
import GPTAssistantAPIRunStepVO from './vos/GPTAssistantAPIRunStepVO';
import GPTAssistantAPIRunVO from './vos/GPTAssistantAPIRunVO';
import GPTAssistantAPIThreadMessageAttachmentVO from './vos/GPTAssistantAPIThreadMessageAttachmentVO';
import GPTAssistantAPIThreadMessageContentFileCitationVO from './vos/GPTAssistantAPIThreadMessageContentFileCitationVO';
import GPTAssistantAPIThreadMessageContentFilePathVO from './vos/GPTAssistantAPIThreadMessageContentFilePathVO';
import GPTAssistantAPIThreadMessageContentImageFileVO from './vos/GPTAssistantAPIThreadMessageContentImageFileVO';
import GPTAssistantAPIThreadMessageContentImageURLVO from './vos/GPTAssistantAPIThreadMessageContentImageURLVO';
import GPTAssistantAPIThreadMessageContentTextVO from './vos/GPTAssistantAPIThreadMessageContentTextVO';
import GPTAssistantAPIThreadMessageContentVO from './vos/GPTAssistantAPIThreadMessageContentVO';
import GPTAssistantAPIThreadMessageVO from './vos/GPTAssistantAPIThreadMessageVO';
import GPTAssistantAPIThreadVO from './vos/GPTAssistantAPIThreadVO';
import GPTAssistantAPIToolResourcesVO from './vos/GPTAssistantAPIToolResourcesVO';
import GPTAssistantAPIVectorStoreFileBatchVO from './vos/GPTAssistantAPIVectorStoreFileBatchVO';
import GPTAssistantAPIVectorStoreFileVO from './vos/GPTAssistantAPIVectorStoreFileVO';
import GPTAssistantAPIVectorStoreVO from './vos/GPTAssistantAPIVectorStoreVO';
import GPTCompletionAPIConversationVO from './vos/GPTCompletionAPIConversationVO';
import GPTCompletionAPIMessageVO from './vos/GPTCompletionAPIMessageVO';

export default class ModuleGPT extends Module {

    public static MODULE_NAME: string = 'GPT';

    public static PARAM_NAME_MODEL_ID: string = 'PARAM_NAME_MODEL_ID';

    /**
     * @deprecated use Assistants instead => cheaper / faster / better control. Will be removed soon
     */
    public static APINAME_generate_response: string = "modulegpt_generate_response";

    public static APINAME_ask_assistant: string = "modulegpt_ask_assistant";
    public static APINAME_rerun: string = "modulegpt_rerun";
    // public static APINAME_connect_to_realtime_voice: string = "modulegpt_connect_to_realtime_voice";

    public static MANUAL_TASK_NAME_sync_openai_datas: string = ModuleGPT.MODULE_NAME + ".sync_openai_datas";

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleGPT.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleGPT.MODULE_NAME + ".BO_ACCESS";
    public static POLICY_FO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleGPT.MODULE_NAME + ".FO_ACCESS";
    public static POLICY_ask_assistant = AccessPolicyTools.POLICY_UID_PREFIX + ModuleGPT.MODULE_NAME + ".ask_assistant";
    public static POLICY_rerun = AccessPolicyTools.POLICY_UID_PREFIX + ModuleGPT.MODULE_NAME + ".rerun";

    /**
     * @deprecated use Assistants instead => cheaper / faster / better control. Will be removed soon
     */
    public static POLICY_generate_response = AccessPolicyTools.POLICY_UID_PREFIX + ModuleGPT.MODULE_NAME + ".generate_response";

    public static POLICY_ASSISTANT_FILES_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleGPT.MODULE_NAME + ".ASSISTANT_FILES_ACCESS";

    private static instance: ModuleGPT = null;

    /**
     * Demander un run d'un assistant suite à un nouveau message
     * @param assistant_id id de l'assistant au sens de l'API GPT
     * @param thread_id null pour un nouveau thread, sinon l'id du thread au sens de l'API GPT
     * @param thread_title titre du nouveau thread
     * @param content contenu text du nouveau message
     * @param files ATTENTION : Limité à 10 fichiers dans l'API GPT pour le moment
     * @param user_id id de l'utilisateur
     * @param hide_content si on veut cacher le texte
     * @returns
     */
    public ask_assistant: (
        assistant_id: string,
        thread_id: string,
        thread_title: string,
        content: string,
        files: FileVO[],
        user_id: number,
        hide_content: boolean,
        generate_voice_summary: boolean,
    ) => Promise<GPTAssistantAPIThreadMessageVO[]> = APIControllerWrapper.sah<APIGPTAskAssistantParam, GPTAssistantAPIThreadMessageVO[]>(ModuleGPT.APINAME_ask_assistant);

    public get_tts_file: (message_content_id: number) => Promise<FileVO> = APIControllerWrapper.sah_optimizer<NumberParamVO, FileVO>(this.name, reflect<this>().get_tts_file);
    public transcribe_file: (file_vo_id: number, auto_commit_auto_input: boolean, gpt_assistant_id: string, gpt_thread_id: string, user_id: number) => Promise<string> = APIControllerWrapper.sah_optimizer<APIGPTTranscribeParam, string>(this.name, reflect<this>().transcribe_file);

    public summerize: (thread_id: number) => Promise<FileVO> = APIControllerWrapper.sah_optimizer<NumberParamVO, FileVO>(this.name, reflect<this>().summerize);

    // /**
    //  * Demander un run d'un assistant suite à un nouveau message
    //  * @param session_id null pour une nouvelle session, id de la session au sens de l'API GPT
    //  * @param conversation_id null pour un nouveau thread, sinon l'id du thread au sens de l'API GPT
    //  * @param user_id contenu text du nouveau message
    //  * @returns
    //  */
    // public connect_to_realtime_voice: (
    //     session_id: string,
    //     conversation_id: string,
    //     user_id: number,

    // ) => Promise<GPTRealtimeAPIConversationItemVO[]> = APIControllerWrapper.sah<APIRealtimeVoiceConnectParam, GPTRealtimeAPIConversationItemVO[]>(ModuleGPT.APINAME_connect_to_realtime_voice);

    /**
     * Re-run un run d'un assistant suite à un nouveau message par exemple ou pour essayer d'avoir une réponse plus pertinente
     */
    public rerun: (
        run_id: number
    ) => Promise<GPTAssistantAPIThreadMessageVO[]> = APIControllerWrapper.sah<APIGPTAskAssistantParam, GPTAssistantAPIThreadMessageVO[]>(ModuleGPT.APINAME_rerun);

    /**
     * @deprecated use Assistants instead => cheaper / faster / better control. Will be removed soon
     */
    public generate_response: (
        conversation: GPTCompletionAPIConversationVO, newPrompt: GPTCompletionAPIMessageVO
    ) => Promise<GPTCompletionAPIMessageVO> = APIControllerWrapper.sah<APIGPTGenerateResponseParam, GPTCompletionAPIMessageVO>(ModuleGPT.APINAME_generate_response);

    private constructor() {

        super("gpt", ModuleGPT.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleGPT {
        if (!ModuleGPT.instance) {
            ModuleGPT.instance = new ModuleGPT();
        }
        return ModuleGPT.instance;
    }

    public registerApis() {

        APIControllerWrapper.registerApi(new PostAPIDefinition<APIGPTGenerateResponseParam, GPTCompletionAPIMessageVO>(
            ModuleGPT.POLICY_generate_response,
            ModuleGPT.APINAME_generate_response,
            [GPTCompletionAPIConversationVO.API_TYPE_ID, GPTCompletionAPIMessageVO.API_TYPE_ID],
            APIGPTGenerateResponseParamStatic
        ));

        APIControllerWrapper.registerApi(PostAPIDefinition.new<APIGPTTranscribeParam, string>(
            ModuleGPT.POLICY_ask_assistant,
            this.name,
            reflect<this>().transcribe_file,
            [GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, GPTAssistantAPIThreadMessageContentTextVO.API_TYPE_ID, ActionURLVO.API_TYPE_ID, MailVO.API_TYPE_ID],
            APIGPTTranscribeParamStatic
        ));

        APIControllerWrapper.registerApi(PostAPIDefinition.new<NumberParamVO, FileVO>(
            ModuleGPT.POLICY_ask_assistant,
            this.name,
            reflect<this>().get_tts_file,
            [GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, FileVO.API_TYPE_ID],
            NumberParamVOStatic,
        ));

        APIControllerWrapper.registerApi(PostAPIDefinition.new<NumberParamVO, FileVO>(
            ModuleGPT.POLICY_ask_assistant,
            this.name,
            reflect<this>().summerize,
            [FileVO.API_TYPE_ID],
            NumberParamVOStatic,
        ));

        /**
         * Depuis la synchro auto en cas de données manquantes, on peut impacter tout type de données en fait sur une ask_assistant...
         */
        APIControllerWrapper.registerApi(new PostAPIDefinition<APIGPTAskAssistantParam, GPTAssistantAPIThreadMessageVO[]>(
            ModuleGPT.POLICY_ask_assistant,
            ModuleGPT.APINAME_ask_assistant,
            [
                GPTAssistantAPIFileVO.API_TYPE_ID,
                GPTAssistantAPIRunVO.API_TYPE_ID,
                GPTAssistantAPIRunStepVO.API_TYPE_ID,
                GPTAssistantAPIThreadMessageAttachmentVO.API_TYPE_ID,
                GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID,
                GPTAssistantAPIThreadMessageVO.API_TYPE_ID,
                GPTAssistantAPIThreadVO.API_TYPE_ID,
                GPTAssistantAPIErrorVO.API_TYPE_ID,
                GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID,
                GPTAssistantAPIFunctionVO.API_TYPE_ID,
                GPTAssistantAPIAssistantVO.API_TYPE_ID,
                GPTAssistantAPIVectorStoreVO.API_TYPE_ID,
                GPTAssistantAPIVectorStoreFileVO.API_TYPE_ID,
                GPTAssistantAPIVectorStoreFileBatchVO.API_TYPE_ID,
                GPTAssistantAPIFunctionParamVO.API_TYPE_ID,
                GPTAssistantAPIThreadMessageContentFileCitationVO.API_TYPE_ID,
                GPTAssistantAPIThreadMessageContentFilePathVO.API_TYPE_ID,
                GPTAssistantAPIThreadMessageContentTextVO.API_TYPE_ID,
                GPTAssistantAPIThreadMessageContentImageFileVO.API_TYPE_ID,
                GPTAssistantAPIThreadMessageContentImageURLVO.API_TYPE_ID
            ],
            APIGPTAskAssistantParamStatic,
            APIDefinition.API_RETURN_TYPE_NOTIF,
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<NumberParamVO, GPTAssistantAPIThreadMessageVO[]>(
            ModuleGPT.POLICY_rerun,
            ModuleGPT.APINAME_rerun,
            [
                GPTAssistantAPIFileVO.API_TYPE_ID,
                GPTAssistantAPIRunVO.API_TYPE_ID,
                GPTAssistantAPIRunStepVO.API_TYPE_ID,
                GPTAssistantAPIThreadMessageAttachmentVO.API_TYPE_ID,
                GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID,
                GPTAssistantAPIThreadMessageVO.API_TYPE_ID,
                GPTAssistantAPIThreadVO.API_TYPE_ID,
                GPTAssistantAPIErrorVO.API_TYPE_ID,
                GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID,
                GPTAssistantAPIFunctionVO.API_TYPE_ID,
                GPTAssistantAPIAssistantVO.API_TYPE_ID,
                GPTAssistantAPIVectorStoreVO.API_TYPE_ID,
                GPTAssistantAPIVectorStoreFileVO.API_TYPE_ID,
                GPTAssistantAPIVectorStoreFileBatchVO.API_TYPE_ID,
                GPTAssistantAPIFunctionParamVO.API_TYPE_ID,
                GPTAssistantAPIThreadMessageContentFileCitationVO.API_TYPE_ID,
                GPTAssistantAPIThreadMessageContentFilePathVO.API_TYPE_ID,
                GPTAssistantAPIThreadMessageContentTextVO.API_TYPE_ID,
                GPTAssistantAPIThreadMessageContentImageFileVO.API_TYPE_ID,
                GPTAssistantAPIThreadMessageContentImageURLVO.API_TYPE_ID
            ],
            NumberParamVOStatic
        ));
    }

    public initialize() {

        ManualTasksController.getInstance().registered_manual_tasks_by_name[ModuleGPT.MANUAL_TASK_NAME_sync_openai_datas] = null;

        this.initializeGPTCompletionAPIConversationVO();
        this.initializeGPTCompletionAPIMessageVO();

        this.initializeGPTAssistantAPIAssistantVO();

        // On intègre les tables Osélia dans le module GPT car elles sont utilisées par les tables du module GPT
        this.initialize_OseliaPromptVO();
        this.initialize_OseliaUserPromptVO();

        this.initializeGPTAssistantAPIErrorVO();
        this.initializeGPTAssistantAPIToolResourcesVO();
        this.initializeGPTAssistantAPIFunctionVO();
        this.initializeGPTAssistantAPIAssistantFunctionVO();
        this.initializeGPTAssistantAPIVectorStoreVO();
        this.initializeGPTAssistantAPIFileVO();
        this.initializeGPTAssistantAPIVectorStoreFileVO();
        this.initializeGPTAssistantAPIVectorStoreFileBatchVO();
        this.initializeGPTAssistantAPIFunctionParamVO();
        this.initializeGPTAssistantAPIThreadVO();
        this.initializeGPTAssistantAPIRunVO();
        this.initializeGPTAssistantAPIRunStepVO();
        this.initializeGPTAssistantAPIThreadMessageVO();
        this.initializeGPTAssistantAPIThreadMessageAttachmentVO();
        this.initializeGPTAssistantAPIThreadMessageContentVO();
        this.initializeGPTAssistantAPIThreadMessageContentFileCitationVO();
        this.initializeGPTAssistantAPIThreadMessageContentFilePathVO();
        this.initializeGPTAssistantAPIThreadMessageContentTextVO();
        this.initializeGPTAssistantAPIThreadMessageContentImageFileVO();
        this.initializeGPTAssistantAPIThreadMessageContentImageURLVO();

        this.initialize_OseliaThreadMessageFeedbackVO();
        this.initialize_OseliaThreadFeedbackVO();
    }

    private initialize_OseliaPromptVO() {
        const label_field = ModuleTableFieldController.create_new(OseliaPromptVO.API_TYPE_ID, field_names<OseliaPromptVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true).unique();
        const default_assistant_id = ModuleTableFieldController.create_new(OseliaPromptVO.API_TYPE_ID, field_names<OseliaPromptVO>().default_assistant_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant par défaut', false);

        ModuleTableFieldController.create_new(OseliaPromptVO.API_TYPE_ID, field_names<OseliaPromptVO>().prompt, ModuleTableFieldVO.FIELD_TYPE_string, 'Prompt', true);
        ModuleTableFieldController.create_new(OseliaPromptVO.API_TYPE_ID, field_names<OseliaPromptVO>().prompt_description, ModuleTableFieldVO.FIELD_TYPE_string, 'Description', true);
        ModuleTableFieldController.create_new(OseliaPromptVO.API_TYPE_ID, field_names<OseliaPromptVO>().prompt_parameters_description, ModuleTableFieldVO.FIELD_TYPE_string, 'Description des paramètres', true);

        const datatable = ModuleTableController.create_new(this.name, OseliaPromptVO, label_field, "Prompts Osélia");
        default_assistant_id.set_many_to_one_target_moduletable_name(GPTAssistantAPIAssistantVO.API_TYPE_ID);

        VersionedVOController.getInstance().registerModuleTable(datatable);
    }

    private initialize_OseliaUserPromptVO() {
        const user_id = ModuleTableFieldController.create_new(OseliaUserPromptVO.API_TYPE_ID, field_names<OseliaUserPromptVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', true);
        const prompt_id = ModuleTableFieldController.create_new(OseliaUserPromptVO.API_TYPE_ID, field_names<OseliaUserPromptVO>().prompt_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Prompt', true);

        ModuleTableFieldController.create_new(OseliaUserPromptVO.API_TYPE_ID, field_names<OseliaUserPromptVO>().adapted_prompt, ModuleTableFieldVO.FIELD_TYPE_string, 'Prompt adapté', true);
        ModuleTableFieldController.create_new(OseliaUserPromptVO.API_TYPE_ID, field_names<OseliaUserPromptVO>().why_and_what_we_adapted_description, ModuleTableFieldVO.FIELD_TYPE_string, 'Description de la spécialisation (raison et impact)', true);

        const datatable = ModuleTableController.create_new(this.name, OseliaUserPromptVO, null, "Prompts Osélia - surcharge par utilisateur");
        user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
        prompt_id.set_many_to_one_target_moduletable_name(OseliaPromptVO.API_TYPE_ID);

        VersionedVOController.getInstance().registerModuleTable(datatable);
    }

    private initialize_OseliaThreadMessageFeedbackVO() {
        const assistant_thread_message_id = ModuleTableFieldController.create_new(OseliaThreadMessageFeedbackVO.API_TYPE_ID, field_names<OseliaThreadMessageFeedbackVO>().assistant_thread_message_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Message Osélia', true);
        const assistant_id = ModuleTableFieldController.create_new(OseliaThreadMessageFeedbackVO.API_TYPE_ID, field_names<OseliaThreadMessageFeedbackVO>().assistant_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant', true);
        const prompt_id = ModuleTableFieldController.create_new(OseliaThreadMessageFeedbackVO.API_TYPE_ID, field_names<OseliaThreadMessageFeedbackVO>().prompt_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Prompt', false);
        const user_id = ModuleTableFieldController.create_new(OseliaThreadMessageFeedbackVO.API_TYPE_ID, field_names<OseliaThreadMessageFeedbackVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', true);

        ModuleTableFieldController.create_new(OseliaThreadMessageFeedbackVO.API_TYPE_ID, field_names<OseliaThreadMessageFeedbackVO>().feedback_positive, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Feedback positif', true, true, true);
        ModuleTableFieldController.create_new(OseliaThreadMessageFeedbackVO.API_TYPE_ID, field_names<OseliaThreadMessageFeedbackVO>().feedback, ModuleTableFieldVO.FIELD_TYPE_string, 'Feedback', false);

        const datatable = ModuleTableController.create_new(this.name, OseliaThreadMessageFeedbackVO, null, "Retour expérience Osélia - Message");
        assistant_thread_message_id.set_many_to_one_target_moduletable_name(GPTAssistantAPIThreadMessageVO.API_TYPE_ID);
        assistant_id.set_many_to_one_target_moduletable_name(GPTAssistantAPIAssistantVO.API_TYPE_ID);
        prompt_id.set_many_to_one_target_moduletable_name(OseliaPromptVO.API_TYPE_ID);
        user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);

        VersionedVOController.getInstance().registerModuleTable(datatable);
    }

    private initialize_OseliaThreadFeedbackVO() {
        const assistant_thread_id = ModuleTableFieldController.create_new(OseliaThreadFeedbackVO.API_TYPE_ID, field_names<OseliaThreadFeedbackVO>().assistant_thread_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Thread Osélia', true);
        const user_id = ModuleTableFieldController.create_new(OseliaThreadFeedbackVO.API_TYPE_ID, field_names<OseliaThreadFeedbackVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', true);

        ModuleTableFieldController.create_new(OseliaThreadFeedbackVO.API_TYPE_ID, field_names<OseliaThreadFeedbackVO>().feedback_positive, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Feedback positif', true, true, true);
        ModuleTableFieldController.create_new(OseliaThreadFeedbackVO.API_TYPE_ID, field_names<OseliaThreadFeedbackVO>().feedback, ModuleTableFieldVO.FIELD_TYPE_string, 'Feedback', false);

        const datatable = ModuleTableController.create_new(this.name, OseliaThreadFeedbackVO, null, "Retour expérience Osélia - Thread");
        assistant_thread_id.set_many_to_one_target_moduletable_name(GPTAssistantAPIThreadVO.API_TYPE_ID);
        user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);

        VersionedVOController.getInstance().registerModuleTable(datatable);
    }

    private initializeGPTCompletionAPIMessageVO() {

        const user_id = ModuleTableFieldController.create_new(GPTCompletionAPIMessageVO.API_TYPE_ID, field_names<GPTCompletionAPIMessageVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'User', false);
        const conversation_id = ModuleTableFieldController.create_new(GPTCompletionAPIMessageVO.API_TYPE_ID, field_names<GPTCompletionAPIMessageVO>().conversation_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Conversation', false);

        ModuleTableFieldController.create_new(GPTCompletionAPIMessageVO.API_TYPE_ID, field_names<GPTCompletionAPIMessageVO>().role_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type de rôle', true, true, GPTCompletionAPIMessageVO.GPTMSG_ROLE_TYPE_SYSTEM).setEnumValues(GPTCompletionAPIMessageVO.GPTMSG_ROLE_TYPE_LABELS);
        ModuleTableFieldController.create_new(GPTCompletionAPIMessageVO.API_TYPE_ID, field_names<GPTCompletionAPIMessageVO>().content, ModuleTableFieldVO.FIELD_TYPE_string, 'Contenu', false);
        ModuleTableFieldController.create_new(GPTCompletionAPIMessageVO.API_TYPE_ID, field_names<GPTCompletionAPIMessageVO>().date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date', true).set_segmentation_type(TimeSegment.TYPE_SECOND);

        ModuleTableController.create_new(this.name, GPTCompletionAPIMessageVO, null, 'GPT Completion API - Message');

        user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
        conversation_id.set_many_to_one_target_moduletable_name(GPTCompletionAPIConversationVO.API_TYPE_ID);
    }

    private initializeGPTCompletionAPIConversationVO() {

        const label = ModuleTableFieldController.create_new(GPTCompletionAPIConversationVO.API_TYPE_ID, field_names<GPTCompletionAPIConversationVO>().date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de création', true).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableController.create_new(this.name, GPTCompletionAPIConversationVO, label, 'GPT Completion API - Conversation');
    }

    private initializeGPTAssistantAPIAssistantVO() {

        ModuleTableFieldController.create_new(GPTAssistantAPIAssistantVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantVO>().gpt_assistant_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT ID', true).unique();

        const label = ModuleTableFieldController.create_new(GPTAssistantAPIAssistantVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantVO>().nom, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true);
        ModuleTableFieldController.create_new(GPTAssistantAPIAssistantVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantVO>().description, ModuleTableFieldVO.FIELD_TYPE_string, 'Description', false);

        ModuleTableFieldController.create_new(GPTAssistantAPIAssistantVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantVO>().created_at, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de création', false).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(GPTAssistantAPIAssistantVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantVO>().model, ModuleTableFieldVO.FIELD_TYPE_string, 'Modèle', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIAssistantVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantVO>().instructions, ModuleTableFieldVO.FIELD_TYPE_textarea, 'Instructions', true);
        ModuleTableFieldController.create_new(GPTAssistantAPIAssistantVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantVO>().tools_code_interpreter, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Outils - Interpréteur de code', true, true, false);
        ModuleTableFieldController.create_new(GPTAssistantAPIAssistantVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantVO>().tools_file_search, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Outils - Recherche de fichiers', true, true, false);
        ModuleTableFieldController.create_new(GPTAssistantAPIAssistantVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantVO>().tools_functions, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Outils - Fonctions', true, true, false);
        ModuleTableFieldController.create_new(GPTAssistantAPIAssistantVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantVO>().tool_resources, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Ressources des outils', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIAssistantVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantVO>().metadata, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Métadonnées', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIAssistantVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantVO>().temperature, ModuleTableFieldVO.FIELD_TYPE_float, 'Température', true, true, 1);
        ModuleTableFieldController.create_new(GPTAssistantAPIAssistantVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantVO>().top_p, ModuleTableFieldVO.FIELD_TYPE_float, 'Top %', true, true, 1);
        ModuleTableFieldController.create_new(GPTAssistantAPIAssistantVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantVO>().response_format, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Format de réponse', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIAssistantVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantVO>().archived, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Archivé', true, true, false);

        ModuleTableFieldController.create_new(GPTAssistantAPIAssistantVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantVO>().app_mem_access, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Accès mémoire - Globale Application', true, true, false);
        ModuleTableFieldController.create_new(GPTAssistantAPIAssistantVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantVO>().user_mem_access, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Accès mémoire - Utilisateur', true, true, false);
        ModuleTableFieldController.create_new(GPTAssistantAPIAssistantVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantVO>().agent_mem_access, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Accès mémoire - Agent', true, true, false);

        const table = ModuleTableController.create_new(this.name, GPTAssistantAPIAssistantVO, label, 'GPT Assistant API - Assistant');
        VersionedVOController.getInstance().registerModuleTable(table);
    }

    private initializeGPTAssistantAPIToolResourcesVO() {

        ModuleTableFieldController.create_new(GPTAssistantAPIToolResourcesVO.API_TYPE_ID, field_names<GPTAssistantAPIToolResourcesVO>().code_interpreter_gpt_file_ids, ModuleTableFieldVO.FIELD_TYPE_string_array, 'Interpréteur de code - Fichiers (GPT IDs)', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIToolResourcesVO.API_TYPE_ID, field_names<GPTAssistantAPIToolResourcesVO>().code_interpreter_file_ids_ranges, ModuleTableFieldVO.FIELD_TYPE_refrange_array, 'Interpréteur de code - Fichiers', false)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIFileVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(GPTAssistantAPIToolResourcesVO.API_TYPE_ID, field_names<GPTAssistantAPIToolResourcesVO>().file_search_gpt_vector_store_ids, ModuleTableFieldVO.FIELD_TYPE_string_array, 'Recherche de fichiers - Vector Store (GPT IDs)', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIToolResourcesVO.API_TYPE_ID, field_names<GPTAssistantAPIToolResourcesVO>().file_search_vector_store_ids_ranges, ModuleTableFieldVO.FIELD_TYPE_refrange_array, 'Recherche de fichiers - Vector Store', false)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIVectorStoreVO.API_TYPE_ID);

        ModuleTableController.create_new(this.name, GPTAssistantAPIToolResourcesVO, null, 'GPT Assistant API - Ressources des outils');
    }

    private initializeGPTAssistantAPIFunctionVO() {

        const label = ModuleTableFieldController.create_new(GPTAssistantAPIFunctionVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionVO>().gpt_function_name, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT - Nom', true).unique();

        ModuleTableFieldController.create_new(GPTAssistantAPIFunctionVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Module', false); // false pour les fonctions des réferrers
        ModuleTableFieldController.create_new(GPTAssistantAPIFunctionVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionVO>().module_function, ModuleTableFieldVO.FIELD_TYPE_string, 'Fonction', false); // false pour les fonctions des réferrers
        ModuleTableFieldController.create_new(GPTAssistantAPIFunctionVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionVO>().gpt_function_description, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT - Description', true);
        ModuleTableFieldController.create_new(GPTAssistantAPIFunctionVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionVO>().prepend_thread_vo, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Thread VO en 1er param', true, true, true);
        ModuleTableFieldController.create_new(GPTAssistantAPIFunctionVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionVO>().json_stringify_output, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Transformer la sortie de la fonction en JSON', true, true, false);
        ModuleTableFieldController.create_new(GPTAssistantAPIFunctionVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionVO>().archived, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Archivé', true, true, false);

        ModuleTableFieldController.create_new(GPTAssistantAPIFunctionVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionVO>().use_promise_pipeline, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Utiliser un PromisePipeline', true, true, false);
        ModuleTableFieldController.create_new(GPTAssistantAPIFunctionVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionVO>().promise_pipeline_max_concurrency, ModuleTableFieldVO.FIELD_TYPE_int, 'PromisePipeline - Max concurrence', true, true, 1);

        const table = ModuleTableController.create_new(this.name, GPTAssistantAPIFunctionVO, label, 'GPT Assistant API - Fonction');
        VersionedVOController.getInstance().registerModuleTable(table);
    }

    private initializeGPTAssistantAPIAssistantFunctionVO() {

        const assistant_id = ModuleTableFieldController.create_new(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantFunctionVO>().assistant_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant', true);
        const function_id = ModuleTableFieldController.create_new(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantFunctionVO>().function_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Fonction', true);
        ModuleTableFieldController.create_new(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantFunctionVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0);

        ModuleTableController.create_new(this.name, GPTAssistantAPIAssistantFunctionVO, null, 'GPT Assistant API - Assistant/Fonction');

        assistant_id.set_many_to_one_target_moduletable_name(GPTAssistantAPIAssistantVO.API_TYPE_ID);
        function_id.set_many_to_one_target_moduletable_name(GPTAssistantAPIFunctionVO.API_TYPE_ID);
    }

    private initializeGPTAssistantAPIErrorVO() {

        ModuleTableFieldController.create_new(GPTAssistantAPIErrorVO.API_TYPE_ID, field_names<GPTAssistantAPIErrorVO>().code, ModuleTableFieldVO.FIELD_TYPE_enum, 'Code', true).setEnumValues(GPTAssistantAPIErrorVO.CODE_LABELS);
        ModuleTableFieldController.create_new(GPTAssistantAPIErrorVO.API_TYPE_ID, field_names<GPTAssistantAPIErrorVO>().message, ModuleTableFieldVO.FIELD_TYPE_string, 'Message', true);

        ModuleTableController.create_new(this.name, GPTAssistantAPIErrorVO, null, 'GPT Assistant API - Erreur');
    }

    private initializeGPTAssistantAPIVectorStoreVO() {

        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreVO>().gpt_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT ID', true).unique();
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreVO>().created_at, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de création', false).set_segmentation_type(TimeSegment.TYPE_SECOND);
        const label = ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreVO>().usage_bytes, ModuleTableFieldVO.FIELD_TYPE_int, 'Bytes utilisés', false, true, 0);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreVO>().file_counts_in_progress, ModuleTableFieldVO.FIELD_TYPE_int, 'Fichiers en cours', false, true, 0);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreVO>().file_counts_completed, ModuleTableFieldVO.FIELD_TYPE_int, 'Fichiers terminés', false, true, 0);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreVO>().file_counts_failed, ModuleTableFieldVO.FIELD_TYPE_int, 'Fichiers en erreur', false, true, 0);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreVO>().file_counts_cancelled, ModuleTableFieldVO.FIELD_TYPE_int, 'Fichiers annulés', false, true, 0);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreVO>().file_counts_total, ModuleTableFieldVO.FIELD_TYPE_int, 'Fichiers total', false, true, 0);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreVO>().status, ModuleTableFieldVO.FIELD_TYPE_enum, 'Etat', false).setEnumValues(GPTAssistantAPIVectorStoreVO.STATUS_LABELS);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreVO>().expires_after_anchor, ModuleTableFieldVO.FIELD_TYPE_enum, 'Expire après - Ancrage', false).setEnumValues(GPTAssistantAPIVectorStoreVO.EXPIRES_AFTER_ANCHOR_LABELS);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreVO>().expires_after_days, ModuleTableFieldVO.FIELD_TYPE_int, 'Expire après - Jours', false, true, 0);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreVO>().expires_at, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Expire à', false).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreVO>().last_active_at, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Dernière activité', false).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreVO>().metadata, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Métadonnées', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreVO>().archived, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Archivé', true, true, false);


        ModuleTableController.create_new(this.name, GPTAssistantAPIVectorStoreVO, label, 'GPT Assistant API - Vector Store');
    }

    private initializeGPTAssistantAPIVectorStoreFileBatchVO() {
        const label = ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreFileBatchVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreFileBatchVO>().gpt_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT ID', true).unique();
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreFileBatchVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreFileBatchVO>().created_at, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de création', true).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreFileBatchVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreFileBatchVO>().vector_store_gpt_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT ID du vector store', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreFileBatchVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreFileBatchVO>().vector_store_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Vector Store', false)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIVectorStoreVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreFileBatchVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreFileBatchVO>().status, ModuleTableFieldVO.FIELD_TYPE_enum, 'Etat', true).setEnumValues(GPTAssistantAPIVectorStoreFileBatchVO.STATUS_LABELS);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreFileBatchVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreFileBatchVO>().file_counts_in_progress, ModuleTableFieldVO.FIELD_TYPE_int, 'Fichiers en cours', true, true, 0);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreFileBatchVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreFileBatchVO>().file_counts_completed, ModuleTableFieldVO.FIELD_TYPE_int, 'Fichiers terminés', true, true, 0);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreFileBatchVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreFileBatchVO>().file_counts_failed, ModuleTableFieldVO.FIELD_TYPE_int, 'Fichiers en erreur', true, true, 0);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreFileBatchVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreFileBatchVO>().file_counts_cancelled, ModuleTableFieldVO.FIELD_TYPE_int, 'Fichiers annulés', true, true, 0);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreFileBatchVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreFileBatchVO>().file_counts_total, ModuleTableFieldVO.FIELD_TYPE_int, 'Fichiers total', true, true, 0);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreFileBatchVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreFileBatchVO>().gpt_file_ids, ModuleTableFieldVO.FIELD_TYPE_string_array, 'Fichiers (GPT IDs)', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreFileBatchVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreFileBatchVO>().file_id_ranges, ModuleTableFieldVO.FIELD_TYPE_refrange_array, 'Fichiers', false)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIFileVO.API_TYPE_ID);

        ModuleTableController.create_new(this.name, GPTAssistantAPIVectorStoreFileBatchVO, label, 'GPT Assistant API - Vector Store File Batch');
    }

    private initializeGPTAssistantAPIVectorStoreFileVO() {
        const label = ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreFileVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreFileVO>().gpt_file_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT File ID', true);

        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreFileVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreFileVO>().file_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant', true)
            .set_many_to_one_target_moduletable_name(FileVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreFileVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreFileVO>().status, ModuleTableFieldVO.FIELD_TYPE_enum, 'Etat', false).setEnumValues(GPTAssistantAPIVectorStoreFileVO.STATUS_LABELS);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreFileVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreFileVO>().created_at, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de création', true).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreFileVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreFileVO>().last_error, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Dernière erreur', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreFileVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreFileVO>().usage_bytes, ModuleTableFieldVO.FIELD_TYPE_int, 'Bytes utilisés', true, true, 0);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreFileVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreFileVO>().vector_store_gpt_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT ID du vector store', true);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreFileVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreFileVO>().vector_store_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Vector Store', true)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIVectorStoreVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(GPTAssistantAPIVectorStoreFileVO.API_TYPE_ID, field_names<GPTAssistantAPIVectorStoreFileVO>().archived, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Archivé', true, true, false);

        ModuleTableController.create_new(this.name, GPTAssistantAPIVectorStoreFileVO, label, 'GPT Assistant API - Vector Store File');
    }

    private initializeGPTAssistantAPIFileVO() {

        const file_id = ModuleTableFieldController.create_new(GPTAssistantAPIFileVO.API_TYPE_ID, field_names<GPTAssistantAPIFileVO>().file_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Fichier', true);
        const label = ModuleTableFieldController.create_new(GPTAssistantAPIFileVO.API_TYPE_ID, field_names<GPTAssistantAPIFileVO>().gpt_file_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT ID', true).index();

        ModuleTableFieldController.create_new(GPTAssistantAPIFileVO.API_TYPE_ID, field_names<GPTAssistantAPIFileVO>().purpose, ModuleTableFieldVO.FIELD_TYPE_enum, 'Params', true, true, GPTAssistantAPIFileVO.PURPOSE_ASSISTANTS).setEnumValues(GPTAssistantAPIFileVO.PURPOSE_LABELS);
        ModuleTableFieldController.create_new(GPTAssistantAPIFileVO.API_TYPE_ID, field_names<GPTAssistantAPIFileVO>().filename, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du fichier', true);
        ModuleTableFieldController.create_new(GPTAssistantAPIFileVO.API_TYPE_ID, field_names<GPTAssistantAPIFileVO>().created_at, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de création', true).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(GPTAssistantAPIFileVO.API_TYPE_ID, field_names<GPTAssistantAPIFileVO>().bytes, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Bytes', true, true, 0);
        ModuleTableFieldController.create_new(GPTAssistantAPIFileVO.API_TYPE_ID, field_names<GPTAssistantAPIFileVO>().archived, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Archivé', true, true, false);

        ModuleTableController.create_new(this.name, GPTAssistantAPIFileVO, label, 'GPT Assistant API - Fichier');

        file_id.set_many_to_one_target_moduletable_name(FileVO.API_TYPE_ID);
    }

    private initializeGPTAssistantAPIFunctionParamVO() {

        const function_id = ModuleTableFieldController.create_new(GPTAssistantAPIFunctionParamVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionParamVO>().function_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Fonction', true);

        ModuleTableFieldController.create_new(GPTAssistantAPIFunctionParamVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionParamVO>().type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type', true, true, GPTAssistantAPIFunctionParamVO.TYPE_STRING).setEnumValues(GPTAssistantAPIFunctionParamVO.TYPE_LABELS);
        ModuleTableFieldController.create_new(GPTAssistantAPIFunctionParamVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du paramètre', true);
        ModuleTableFieldController.create_new(GPTAssistantAPIFunctionParamVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_description, ModuleTableFieldVO.FIELD_TYPE_string, 'Description', true);
        ModuleTableFieldController.create_new(GPTAssistantAPIFunctionParamVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionParamVO>().required, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Requis', true, true, true);
        ModuleTableFieldController.create_new(GPTAssistantAPIFunctionParamVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionParamVO>().not_in_function_params, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Ne pas passer à la fonction (par exemple paramètre d\'URL uniquement)', true, true, false);
        ModuleTableFieldController.create_new(GPTAssistantAPIFunctionParamVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionParamVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0);
        ModuleTableFieldController.create_new(GPTAssistantAPIFunctionParamVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionParamVO>().string_enum, ModuleTableFieldVO.FIELD_TYPE_string_array, 'Options string enum', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIFunctionParamVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionParamVO>().number_enum, ModuleTableFieldVO.FIELD_TYPE_float_array, 'Options numebr enum', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIFunctionParamVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionParamVO>().object_fields, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Champs (type objet)', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIFunctionParamVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionParamVO>().array_items_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type des éléments (type array)', false).setEnumValues(GPTAssistantAPIFunctionParamVO.TYPE_LABELS);
        ModuleTableFieldController.create_new(GPTAssistantAPIFunctionParamVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionParamVO>().default_json_value, ModuleTableFieldVO.FIELD_TYPE_string, 'Valeur par défaut (JSON)', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIFunctionParamVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionParamVO>().archived, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Archivé', true, true, false);

        const table = ModuleTableController.create_new(this.name, GPTAssistantAPIFunctionParamVO, null, 'GPT Assistant API - Param de Fonction');

        function_id.set_many_to_one_target_moduletable_name(GPTAssistantAPIFunctionVO.API_TYPE_ID);
        VersionedVOController.getInstance().registerModuleTable(table);
    }

    private initializeGPTAssistantAPIThreadVO() {

        const user_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', true);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().gpt_thread_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT ID', true).unique();
        const current_default_assistant_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().current_default_assistant_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant par défaut pour les prochains messages / prompts', false);
        const current_oselia_assistant_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().current_oselia_assistant_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant Osélia en cours de run', false);
        const current_oselia_prompt_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().current_oselia_prompt_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Prompt Osélia en cours de réponse', false);

        ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().parent_thread_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Thread parent', false)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIThreadVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().oselia_is_running, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Osélia en cours de réflexion', true, true, false);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().archived, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Archivé', true, true, false);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().created_at, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de création', false).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().tool_resources, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Ressources des outils', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().metadata, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Métadonnées', false);

        ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().has_no_run_ready_to_handle, ModuleTableFieldVO.FIELD_TYPE_boolean, 'N\'a pas de run prêt à être traité', true, true, false);

        const label = ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().thread_title, ModuleTableFieldVO.FIELD_TYPE_string, 'Titre du thread', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().needs_thread_title_build, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Dois build le titre', true, true, false);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().thread_title_auto_build_locked, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Le titre est fiable', true, true, false);

        ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().has_content, ModuleTableFieldVO.FIELD_TYPE_boolean, 'N\'est pas vide', true, true, false);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().oswedev_created_at, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de création OsWeDev', false).set_segmentation_type(TimeSegment.TYPE_SECOND);

        ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().last_gpt_run_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Dernier run GPT', false)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIRunVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().pipe_outputs_to_thread_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Dupliquer les réponses dans le thread', false)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIThreadVO.API_TYPE_ID);

        ModuleTableController.create_new(this.name, GPTAssistantAPIThreadVO, label, 'GPT Assistant API - Thread');

        user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
        current_default_assistant_id.set_many_to_one_target_moduletable_name(GPTAssistantAPIAssistantVO.API_TYPE_ID);
        current_oselia_assistant_id.set_many_to_one_target_moduletable_name(GPTAssistantAPIAssistantVO.API_TYPE_ID);

        current_oselia_prompt_id.set_many_to_one_target_moduletable_name(OseliaPromptVO.API_TYPE_ID);
    }

    private initializeGPTAssistantAPIRunVO() {

        const thread_id = ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().thread_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Thread', true);
        const assistant_id = ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().assistant_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant', false);
        const label = ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().gpt_run_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT ID', true).index();

        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().rerun_of_run_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Re-run de', false)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIRunVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().created_at, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de création', false).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().gpt_thread_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT Thread ID', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().gpt_assistant_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT Assistant ID', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().status, ModuleTableFieldVO.FIELD_TYPE_enum, 'Status', false).setEnumValues(GPTAssistantAPIRunVO.STATUS_LABELS);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().required_action, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Action requise', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().last_error, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Dernière erreur', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().expires_at, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date d\'expiration', false).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().started_at, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de début', false).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().cancelled_at, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date d\'annulation', false).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().failed_at, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date d\'échec', false).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().completed_at, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de fin', false).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().model, ModuleTableFieldVO.FIELD_TYPE_string, 'Modèle', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().instructions, ModuleTableFieldVO.FIELD_TYPE_string, 'Instructions', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().tools, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Outils', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().metadata, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Métadonnées', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().temperature, ModuleTableFieldVO.FIELD_TYPE_float, 'Température', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().is_best_run, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Meilleure réponse', true, true, true);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().ask_user_which_run_is_best, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Demander à l\'utilisateur son choix entre différents runs', true, true, false);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().incomplete_details, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Détails raisons run incomplet', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().top_p, ModuleTableFieldVO.FIELD_TYPE_float, 'Top %', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().max_prompt_tokens, ModuleTableFieldVO.FIELD_TYPE_int, 'Max tokens input', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().max_completion_tokens, ModuleTableFieldVO.FIELD_TYPE_int, 'Max tokens output', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().truncation_strategy, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Stratégie de troncature', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().tool_choice, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Choix des outils', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().response_format, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Format de réponse', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().archived, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Archivé', true, true, false);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().completion_tokens, ModuleTableFieldVO.FIELD_TYPE_int, 'Nb. Tokens Output', false, true, 0);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().prompt_tokens, ModuleTableFieldVO.FIELD_TYPE_int, 'Nb. Tokens Input', false, true, 0);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().total_tokens, ModuleTableFieldVO.FIELD_TYPE_int, 'Nb. Tokens total', false, true, 0);

        ModuleTableController.create_new(this.name, GPTAssistantAPIRunVO, label, 'GPT Assistant API - Run');

        thread_id.set_many_to_one_target_moduletable_name(GPTAssistantAPIThreadVO.API_TYPE_ID);
        assistant_id.set_many_to_one_target_moduletable_name(GPTAssistantAPIAssistantVO.API_TYPE_ID);
    }

    private initializeGPTAssistantAPIRunStepVO() {

        ModuleTableFieldController.create_new(GPTAssistantAPIRunStepVO.API_TYPE_ID, field_names<GPTAssistantAPIRunStepVO>().thread_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Thread', true)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIThreadVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunStepVO.API_TYPE_ID, field_names<GPTAssistantAPIRunStepVO>().assistant_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant', true)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIAssistantVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunStepVO.API_TYPE_ID, field_names<GPTAssistantAPIRunStepVO>().run_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Run', true)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIRunVO.API_TYPE_ID);
        const label = ModuleTableFieldController.create_new(GPTAssistantAPIRunStepVO.API_TYPE_ID, field_names<GPTAssistantAPIRunStepVO>().gpt_run_step_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT ID', true).index();

        ModuleTableFieldController.create_new(GPTAssistantAPIRunStepVO.API_TYPE_ID, field_names<GPTAssistantAPIRunStepVO>().type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type', false).setEnumValues(GPTAssistantAPIRunStepVO.TYPE_LABELS);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunStepVO.API_TYPE_ID, field_names<GPTAssistantAPIRunStepVO>().gpt_run_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT Run ID', true);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunStepVO.API_TYPE_ID, field_names<GPTAssistantAPIRunStepVO>().created_at, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de création', false).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunStepVO.API_TYPE_ID, field_names<GPTAssistantAPIRunStepVO>().gpt_thread_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT Thread ID', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunStepVO.API_TYPE_ID, field_names<GPTAssistantAPIRunStepVO>().gpt_assistant_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT Assistant ID', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunStepVO.API_TYPE_ID, field_names<GPTAssistantAPIRunStepVO>().status, ModuleTableFieldVO.FIELD_TYPE_enum, 'Status', false).setEnumValues(GPTAssistantAPIRunStepVO.STATUS_LABELS);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunStepVO.API_TYPE_ID, field_names<GPTAssistantAPIRunStepVO>().step_details, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Détails', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunStepVO.API_TYPE_ID, field_names<GPTAssistantAPIRunStepVO>().last_error, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Dernière erreur', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunStepVO.API_TYPE_ID, field_names<GPTAssistantAPIRunStepVO>().cancelled_at, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date d\'annulation', false).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunStepVO.API_TYPE_ID, field_names<GPTAssistantAPIRunStepVO>().failed_at, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date d\'échec', false).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunStepVO.API_TYPE_ID, field_names<GPTAssistantAPIRunStepVO>().completed_at, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de fin', false).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunStepVO.API_TYPE_ID, field_names<GPTAssistantAPIRunStepVO>().metadata, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Métadonnées', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunStepVO.API_TYPE_ID, field_names<GPTAssistantAPIRunStepVO>().expired_at, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date d\'expiration', false).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunStepVO.API_TYPE_ID, field_names<GPTAssistantAPIRunStepVO>().completion_tokens, ModuleTableFieldVO.FIELD_TYPE_int, 'Nb. Tokens Output', false, true, 0);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunStepVO.API_TYPE_ID, field_names<GPTAssistantAPIRunStepVO>().prompt_tokens, ModuleTableFieldVO.FIELD_TYPE_int, 'Nb. Tokens Input', false, true, 0);
        ModuleTableFieldController.create_new(GPTAssistantAPIRunStepVO.API_TYPE_ID, field_names<GPTAssistantAPIRunStepVO>().total_tokens, ModuleTableFieldVO.FIELD_TYPE_int, 'Nb. Tokens total', false, true, 0);

        ModuleTableController.create_new(this.name, GPTAssistantAPIRunStepVO, label, 'GPT Assistant API - Run Step');
    }

    private initializeGPTAssistantAPIThreadMessageVO() {

        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().thread_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Thread', true)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIThreadVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().run_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Run', false)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIRunVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', true)
            .set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);

        const label = ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().gpt_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT ID', false).index();

        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().assistant_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant', false)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIAssistantVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().prompt_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Prompt Osélia', false)
            .set_many_to_one_target_moduletable_name(OseliaPromptVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().role, ModuleTableFieldVO.FIELD_TYPE_enum, 'Rôle', true, true, GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_USER).setEnumValues(GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_LABELS);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de création (OSWedev)', true).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().archived, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Archivé', true, true, false);

        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().gpt_assistant_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT Assistant ID', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().gpt_run_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT Run ID', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().gpt_thread_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT Thread ID', false);

        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().created_at, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de création', false).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().status, ModuleTableFieldVO.FIELD_TYPE_enum, 'Status', false).setEnumValues(GPTAssistantAPIThreadMessageVO.STATUS_LABELS);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().incomplete_details, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Détails raisons message incomplet', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().completed_at, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de fin', false).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().incomplete_at, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date d\'incomplétion', false).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().attachments, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Pièces jointes', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().metadata, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Métadonnées', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().is_ready, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Prêt à être envoyé', true, true, true);

        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().piped_from_thread_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Piped from - Thread', false)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIThreadVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().piped_from_thread_message_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Piped from - Message', false)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIThreadMessageVO.API_TYPE_ID);

        ModuleTableController.create_new(this.name, GPTAssistantAPIThreadMessageVO, label, 'GPT Assistant API - Thread Message');
    }

    private initializeGPTAssistantAPIThreadMessageAttachmentVO() {

        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageAttachmentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageAttachmentVO>().file_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Fichier', true)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIFileVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageAttachmentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageAttachmentVO>().add_to_tool_code_interpreter, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Ajouter à l\'interpréteur de code', true, true, false);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageAttachmentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageAttachmentVO>().add_to_tool_file_search, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Ajouter à la recherche de fichier', true, true, false);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageAttachmentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageAttachmentVO>().gpt_file_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT File ID', true);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageAttachmentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageAttachmentVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0);

        ModuleTableController.create_new(this.name, GPTAssistantAPIThreadMessageAttachmentVO, null, 'GPT Assistant API - Thread Message Attachment');
    }

    private initializeGPTAssistantAPIThreadMessageContentVO() {

        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().thread_message_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Message', true)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIThreadMessageVO.API_TYPE_ID);

        // On peut pas unique puisque souvent null, mais on index
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().gpt_thread_message_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT Thread Message ID', false).index();

        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().content_type_text, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Texte', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().content_type_image_file, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Image - Fichier', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().content_type_image_url, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Image - URL', false);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().content_type_action_url_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Action URL', false)
            .set_many_to_one_target_moduletable_name(ActionURLVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().content_type_email_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Email', false)
            .set_many_to_one_target_moduletable_name(MailVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type', true, true, GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT).setEnumValues(GPTAssistantAPIThreadMessageContentVO.TYPE_LABELS);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().hidden, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Caché', true, true, false);

        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().tts_file_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Fichier TTS', false)
            .set_many_to_one_target_moduletable_name(FileVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().piped_from_thread_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Piped from - Thread', false)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIThreadVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().piped_from_thread_message_content_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Piped from - Message Content', false)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID);

        ModuleTableController.create_new(this.name, GPTAssistantAPIThreadMessageContentVO, null, 'GPT Assistant API - Thread Message Content');
    }

    private initializeGPTAssistantAPIThreadMessageContentFileCitationVO() {

        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentFileCitationVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentFileCitationVO>().gpt_file_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT File ID', true);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentFileCitationVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentFileCitationVO>().file_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'File ID', true)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIFileVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentFileCitationVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentFileCitationVO>().quote, ModuleTableFieldVO.FIELD_TYPE_string, 'Quote', true);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentFileCitationVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentFileCitationVO>().start_index, ModuleTableFieldVO.FIELD_TYPE_int, 'Start Index', true);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentFileCitationVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentFileCitationVO>().end_index, ModuleTableFieldVO.FIELD_TYPE_int, 'End Index', true);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentFileCitationVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentFileCitationVO>().text, ModuleTableFieldVO.FIELD_TYPE_string, 'Texte à remplacer', true);

        ModuleTableController.create_new(this.name, GPTAssistantAPIThreadMessageContentFileCitationVO, null, 'GPT Assistant API - Thread Message Content - File Citation');
    }

    private initializeGPTAssistantAPIThreadMessageContentFilePathVO() {

        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentFilePathVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentFilePathVO>().gpt_file_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT File ID', true);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentFilePathVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentFilePathVO>().file_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'File ID', true)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIFileVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentFilePathVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentFilePathVO>().start_index, ModuleTableFieldVO.FIELD_TYPE_int, 'Start Index', true);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentFilePathVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentFilePathVO>().end_index, ModuleTableFieldVO.FIELD_TYPE_int, 'End Index', true);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentFilePathVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentFilePathVO>().text, ModuleTableFieldVO.FIELD_TYPE_string, 'Texte à remplacer', true);

        ModuleTableController.create_new(this.name, GPTAssistantAPIThreadMessageContentFilePathVO, null, 'GPT Assistant API - Thread Message Content - File Path');
    }

    private initializeGPTAssistantAPIThreadMessageContentTextVO() {

        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentTextVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentTextVO>().value, ModuleTableFieldVO.FIELD_TYPE_string, 'Texte', true);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentTextVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentTextVO>().annotations, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Annotations', true);

        ModuleTableController.create_new(this.name, GPTAssistantAPIThreadMessageContentTextVO, null, 'GPT Assistant API - Thread Message Content - Text');
    }

    private initializeGPTAssistantAPIThreadMessageContentImageFileVO() {
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentImageFileVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentImageFileVO>().gpt_file_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT File ID', true);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentImageFileVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentImageFileVO>().file_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'File ID', true)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIFileVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentImageFileVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentImageFileVO>().detail, ModuleTableFieldVO.FIELD_TYPE_string, 'Détail', true);

        ModuleTableController.create_new(this.name, GPTAssistantAPIThreadMessageContentImageFileVO, null, 'GPT Assistant API - Thread Message Content - Image File');
    }

    private initializeGPTAssistantAPIThreadMessageContentImageURLVO() {
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentImageURLVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentImageURLVO>().url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL', true);
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentImageURLVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentImageURLVO>().detail, ModuleTableFieldVO.FIELD_TYPE_string, 'Détail', true);

        ModuleTableController.create_new(this.name, GPTAssistantAPIThreadMessageContentImageURLVO, null, 'GPT Assistant API - Thread Message Content - Image URL');
    }
}
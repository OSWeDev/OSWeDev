import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import UserVO from '../AccessPolicy/vos/UserVO';
import ActionURLVO from '../ActionURL/vos/ActionURLVO';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import FileVO from '../File/vos/FileVO';
import MailVO from '../Mailer/vos/MailVO';
import Module from '../Module';
import OseliaPromptVO from '../Oselia/vos/OseliaPromptVO';
import OseliaThreadFeedbackVO from '../Oselia/vos/OseliaThreadFeedbackVO';
import OseliaThreadMessageFeedbackVO from '../Oselia/vos/OseliaThreadMessageFeedbackVO';
import OseliaUserPromptVO from '../Oselia/vos/OseliaUserPromptVO';
import VersionedVOController from '../Versioned/VersionedVOController';
import APIGPTAskAssistantParam, { APIGPTAskAssistantParamStatic } from './api/APIGPTAskAssistantParam';
import APIGPTGenerateResponseParam, { APIGPTGenerateResponseParamStatic } from './api/APIGPTGenerateResponseParam';
import GPTAssistantAPIAssistantFunctionVO from './vos/GPTAssistantAPIAssistantFunctionVO';
import GPTAssistantAPIAssistantVO from './vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIFileVO from './vos/GPTAssistantAPIFileVO';
import GPTAssistantAPIFunctionParamVO from './vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from './vos/GPTAssistantAPIFunctionVO';
import GPTAssistantAPIRunVO from './vos/GPTAssistantAPIRunVO';
import GPTAssistantAPIThreadMessageContentVO from './vos/GPTAssistantAPIThreadMessageContentVO';
import GPTAssistantAPIThreadMessageFileVO from './vos/GPTAssistantAPIThreadMessageFileVO';
import GPTAssistantAPIThreadMessageVO from './vos/GPTAssistantAPIThreadMessageVO';
import GPTAssistantAPIThreadVO from './vos/GPTAssistantAPIThreadVO';
import GPTCompletionAPIConversationVO from './vos/GPTCompletionAPIConversationVO';
import GPTCompletionAPIMessageVO from './vos/GPTCompletionAPIMessageVO';

export default class ModuleGPT extends Module {

    public static MODULE_NAME: string = 'GPT';

    public static PARAM_NAME_MODEL_ID: string = 'PARAM_NAME_MODEL_ID';

    public static APINAME_generate_response: string = "modulegpt_generate_response";
    public static APINAME_ask_assistant: string = "modulegpt_ask_assistant";

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleGPT.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleGPT.MODULE_NAME + ".BO_ACCESS";
    public static POLICY_FO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleGPT.MODULE_NAME + ".FO_ACCESS";

    public static POLICY_ASSISTANT_FILES_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleGPT.MODULE_NAME + ".ASSISTANT_FILES_ACCESS";

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleGPT {
        if (!ModuleGPT.instance) {
            ModuleGPT.instance = new ModuleGPT();
        }
        return ModuleGPT.instance;
    }

    private static instance: ModuleGPT = null;

    public generate_response: (
        conversation: GPTCompletionAPIConversationVO, newPrompt: GPTCompletionAPIMessageVO
    ) => Promise<GPTCompletionAPIMessageVO> = APIControllerWrapper.sah<APIGPTGenerateResponseParam, GPTCompletionAPIMessageVO>(
        ModuleGPT.APINAME_generate_response);

    /**
     * Demander un run d'un assistant suite à un nouveau message
     * @param assistant_id id de l'assistant au sens de l'API GPT
     * @param thread_id null pour un nouveau thread, sinon l'id du thread au sens de l'API GPT
     * @param content contenu text du nouveau message
     * @param files ATTENTION : Limité à 10 fichiers dans l'API GPT pour le moment
     * @returns
     */
    public ask_assistant: (
        assistant_id: string,
        thread_id: string,
        content: string,
        files: FileVO[],
        user_id: number
    ) => Promise<GPTAssistantAPIThreadMessageVO[]> = APIControllerWrapper.sah<APIGPTAskAssistantParam, GPTAssistantAPIThreadMessageVO[]>(
        ModuleGPT.APINAME_ask_assistant);


    private constructor() {

        super("gpt", ModuleGPT.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {

        APIControllerWrapper.registerApi(new PostAPIDefinition<APIGPTGenerateResponseParam, GPTCompletionAPIMessageVO>(
            null,
            ModuleGPT.APINAME_generate_response,
            [GPTCompletionAPIConversationVO.API_TYPE_ID, GPTCompletionAPIMessageVO.API_TYPE_ID],
            APIGPTGenerateResponseParamStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<APIGPTAskAssistantParam, GPTAssistantAPIThreadMessageVO[]>(
            null,
            ModuleGPT.APINAME_ask_assistant,
            [
                GPTAssistantAPIFileVO.API_TYPE_ID,
                GPTAssistantAPIRunVO.API_TYPE_ID,
                GPTAssistantAPIThreadMessageFileVO.API_TYPE_ID,
                GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID,
                GPTAssistantAPIThreadMessageVO.API_TYPE_ID,
                GPTAssistantAPIThreadVO.API_TYPE_ID
            ],
            APIGPTAskAssistantParamStatic
        ));
    }

    public initialize() {

        this.initializeGPTCompletionAPIConversationVO();
        this.initializeGPTCompletionAPIMessageVO();

        this.initializeGPTAssistantAPIAssistantVO();

        // On intègre les tables Osélia dans le module GPT car elles sont utilisées par les tables du module GPT
        this.initialize_OseliaPromptVO();
        this.initialize_OseliaUserPromptVO();

        this.initializeGPTAssistantAPIFunctionVO();
        this.initializeGPTAssistantAPIAssistantFunctionVO();
        this.initializeGPTAssistantAPIFileVO();
        this.initializeGPTAssistantAPIFunctionParamVO();
        this.initializeGPTAssistantAPIThreadVO();
        this.initializeGPTAssistantAPIRunVO();
        this.initializeGPTAssistantAPIThreadMessageVO();
        this.initializeGPTAssistantAPIThreadMessageFileVO();
        this.initializeGPTAssistantAPIThreadMessageContentVO();

        this.initialize_OseliaThreadMessageFeedbackVO();
        this.initialize_OseliaThreadFeedbackVO();
    }

    private initialize_OseliaPromptVO() {
        const label_field = ModuleTableFieldController.create_new(OseliaPromptVO.API_TYPE_ID, field_names<OseliaPromptVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true).unique();
        const default_assistant_id = ModuleTableFieldController.create_new(OseliaPromptVO.API_TYPE_ID, field_names<OseliaPromptVO>().default_assistant_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant par défaut', false);

        const datatable_fields = [
            label_field,
            ModuleTableFieldController.create_new(OseliaPromptVO.API_TYPE_ID, field_names<OseliaPromptVO>().prompt, ModuleTableFieldVO.FIELD_TYPE_string, 'Prompt', true),
            ModuleTableFieldController.create_new(OseliaPromptVO.API_TYPE_ID, field_names<OseliaPromptVO>().prompt_description, ModuleTableFieldVO.FIELD_TYPE_string, 'Description', true),
            ModuleTableFieldController.create_new(OseliaPromptVO.API_TYPE_ID, field_names<OseliaPromptVO>().prompt_parameters_description, ModuleTableFieldVO.FIELD_TYPE_string, 'Description des paramètres', true),
            default_assistant_id,
        ];

        const datatable = ModuleTableController.create_new(this.name, OseliaPromptVO, label_field, "Prompts Osélia");
        default_assistant_id.set_many_to_one_target_moduletable_name(GPTAssistantAPIAssistantVO.API_TYPE_ID);

        VersionedVOController.getInstance().registerModuleTable(datatable);
    }

    private initialize_OseliaUserPromptVO() {
        const user_id = ModuleTableFieldController.create_new(OseliaUserPromptVO.API_TYPE_ID, field_names<OseliaUserPromptVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', true);
        const prompt_id = ModuleTableFieldController.create_new(OseliaUserPromptVO.API_TYPE_ID, field_names<OseliaUserPromptVO>().prompt_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Prompt', true);

        const datatable_fields = [
            prompt_id,
            user_id,
            ModuleTableFieldController.create_new(OseliaUserPromptVO.API_TYPE_ID, field_names<OseliaUserPromptVO>().adapted_prompt, ModuleTableFieldVO.FIELD_TYPE_string, 'Prompt adapté', true),
            ModuleTableFieldController.create_new(OseliaUserPromptVO.API_TYPE_ID, field_names<OseliaUserPromptVO>().why_and_what_we_adapted_description, ModuleTableFieldVO.FIELD_TYPE_string, 'Description de la spécialisation (raison et impact)', true),
        ];

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

        const datatable_fields = [
            user_id,
            assistant_thread_message_id,
            assistant_id,
            prompt_id,
            ModuleTableFieldController.create_new(OseliaThreadMessageFeedbackVO.API_TYPE_ID, field_names<OseliaThreadMessageFeedbackVO>().feedback_positive, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Feedback positif', true, true, true),
            ModuleTableFieldController.create_new(OseliaThreadMessageFeedbackVO.API_TYPE_ID, field_names<OseliaThreadMessageFeedbackVO>().feedback, ModuleTableFieldVO.FIELD_TYPE_string, 'Feedback', false),
        ];

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

        const datatable_fields = [
            user_id,
            assistant_thread_id,
            ModuleTableFieldController.create_new(OseliaThreadMessageFeedbackVO.API_TYPE_ID, field_names<OseliaThreadMessageFeedbackVO>().feedback_positive, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Feedback positif', true, true, true),
            ModuleTableFieldController.create_new(OseliaThreadMessageFeedbackVO.API_TYPE_ID, field_names<OseliaThreadMessageFeedbackVO>().feedback, ModuleTableFieldVO.FIELD_TYPE_string, 'Feedback', false),
        ];

        const datatable = ModuleTableController.create_new(this.name, OseliaThreadFeedbackVO, null, "Retour expérience Osélia - Thread");
        assistant_thread_id.set_many_to_one_target_moduletable_name(GPTAssistantAPIThreadVO.API_TYPE_ID);
        user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);

        VersionedVOController.getInstance().registerModuleTable(datatable);
    }

    private initializeGPTCompletionAPIMessageVO() {

        const user_id = ModuleTableFieldController.create_new(GPTCompletionAPIMessageVO.API_TYPE_ID, field_names<GPTCompletionAPIMessageVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'User', false);
        const conversation_id = ModuleTableFieldController.create_new(GPTCompletionAPIMessageVO.API_TYPE_ID, field_names<GPTCompletionAPIMessageVO>().conversation_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Conversation', false);

        const fields = [
            conversation_id,
            user_id,
            ModuleTableFieldController.create_new(GPTCompletionAPIMessageVO.API_TYPE_ID, field_names<GPTCompletionAPIMessageVO>().role_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type de rôle', true, true, GPTCompletionAPIMessageVO.GPTMSG_ROLE_TYPE_SYSTEM).setEnumValues(GPTCompletionAPIMessageVO.GPTMSG_ROLE_TYPE_LABELS),
            ModuleTableFieldController.create_new(GPTCompletionAPIMessageVO.API_TYPE_ID, field_names<GPTCompletionAPIMessageVO>().content, ModuleTableFieldVO.FIELD_TYPE_string, 'Contenu', false),
            ModuleTableFieldController.create_new(GPTCompletionAPIMessageVO.API_TYPE_ID, field_names<GPTCompletionAPIMessageVO>().date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date', true),
        ];

        const table = ModuleTableController.create_new(this.name, GPTCompletionAPIMessageVO, null, 'GPT Completion API - Message');

        user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
        conversation_id.set_many_to_one_target_moduletable_name(GPTCompletionAPIConversationVO.API_TYPE_ID);
    }

    private initializeGPTCompletionAPIConversationVO() {

        const label = ModuleTableFieldController.create_new(GPTCompletionAPIConversationVO.API_TYPE_ID, field_names<GPTCompletionAPIConversationVO>().date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de création', true);
        const fields = [
            label
        ];

        const table = ModuleTableController.create_new(this.name, GPTCompletionAPIConversationVO, label, 'GPT Completion API - Conversation');
    }

    private initializeGPTAssistantAPIAssistantVO() {

        const label = ModuleTableFieldController.create_new(GPTAssistantAPIAssistantVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantVO>().gpt_assistant_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT ID', true).unique();

        const fields = [
            label,
            ModuleTableFieldController.create_new(GPTAssistantAPIAssistantVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantVO>().nom, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', false),
            ModuleTableFieldController.create_new(GPTAssistantAPIAssistantVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantVO>().description, ModuleTableFieldVO.FIELD_TYPE_string, 'Description', false),
        ];

        const table = ModuleTableController.create_new(this.name, GPTAssistantAPIAssistantVO, label, 'GPT Assistant API - Assistant');
    }

    private initializeGPTAssistantAPIFunctionVO() {

        const label = ModuleTableFieldController.create_new(GPTAssistantAPIFunctionVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionVO>().gpt_function_name, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT - Nom', true).unique();

        const fields = [
            label,
            ModuleTableFieldController.create_new(GPTAssistantAPIFunctionVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Module', true),
            ModuleTableFieldController.create_new(GPTAssistantAPIFunctionVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionVO>().module_function, ModuleTableFieldVO.FIELD_TYPE_string, 'Fonction', true),
            ModuleTableFieldController.create_new(GPTAssistantAPIFunctionVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionVO>().gpt_function_description, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT - Description', true),
            ModuleTableFieldController.create_new(GPTAssistantAPIFunctionVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionVO>().prepend_thread_vo, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Thread VO en 1er param', true, true, true),
        ];

        const table = ModuleTableController.create_new(this.name, GPTAssistantAPIFunctionVO, label, 'GPT Assistant API - Fonction');
    }

    private initializeGPTAssistantAPIAssistantFunctionVO() {

        const assistant_id = ModuleTableFieldController.create_new(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantFunctionVO>().assistant_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant', true);
        const function_id = ModuleTableFieldController.create_new(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantFunctionVO>().function_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Fonction', true);

        const fields = [
            assistant_id,
            function_id
        ];

        const table = ModuleTableController.create_new(this.name, GPTAssistantAPIAssistantFunctionVO, null, 'GPT Assistant API - Assistant/Fonction');

        assistant_id.set_many_to_one_target_moduletable_name(GPTAssistantAPIAssistantVO.API_TYPE_ID);
        function_id.set_many_to_one_target_moduletable_name(GPTAssistantAPIFunctionVO.API_TYPE_ID);
    }


    private initializeGPTAssistantAPIFileVO() {

        const file_id = ModuleTableFieldController.create_new(GPTAssistantAPIFileVO.API_TYPE_ID, field_names<GPTAssistantAPIFileVO>().file_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant', true).unique();
        const label = ModuleTableFieldController.create_new(GPTAssistantAPIFileVO.API_TYPE_ID, field_names<GPTAssistantAPIFileVO>().gpt_file_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT ID', true).unique();

        const fields = [
            file_id,
            label,
            ModuleTableFieldController.create_new(GPTAssistantAPIFileVO.API_TYPE_ID, field_names<GPTAssistantAPIFileVO>().purpose, ModuleTableFieldVO.FIELD_TYPE_enum, 'Params', true, true, GPTAssistantAPIFileVO.PURPOSE_ASSISTANTS).setEnumValues(GPTAssistantAPIFileVO.PURPOSE_LABELS),
            ModuleTableFieldController.create_new(GPTAssistantAPIFileVO.API_TYPE_ID, field_names<GPTAssistantAPIFileVO>().status, ModuleTableFieldVO.FIELD_TYPE_enum, 'Etat', true, true, GPTAssistantAPIFileVO.STATUS_UPLOADED).setEnumValues(GPTAssistantAPIFileVO.STATUS_LABELS),
            ModuleTableFieldController.create_new(GPTAssistantAPIFileVO.API_TYPE_ID, field_names<GPTAssistantAPIFileVO>().filename, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du fichier', true),
            ModuleTableFieldController.create_new(GPTAssistantAPIFileVO.API_TYPE_ID, field_names<GPTAssistantAPIFileVO>().created_at, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de création', true),
            ModuleTableFieldController.create_new(GPTAssistantAPIFileVO.API_TYPE_ID, field_names<GPTAssistantAPIFileVO>().bytes, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Bytes', true, true, 0),
        ];

        const table = ModuleTableController.create_new(this.name, GPTAssistantAPIFileVO, label, 'GPT Assistant API - Fichier');

        file_id.set_many_to_one_target_moduletable_name(FileVO.API_TYPE_ID);
    }

    private initializeGPTAssistantAPIFunctionParamVO() {

        const function_id = ModuleTableFieldController.create_new(GPTAssistantAPIFunctionParamVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionParamVO>().function_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Fonction', true);

        const fields = [
            function_id,
            ModuleTableFieldController.create_new(GPTAssistantAPIFunctionParamVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionParamVO>().type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type', true, true, GPTAssistantAPIFunctionParamVO.TYPE_STRING).setEnumValues(GPTAssistantAPIFunctionParamVO.TYPE_LABELS),
            ModuleTableFieldController.create_new(GPTAssistantAPIFunctionParamVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du paramètre', true),
            ModuleTableFieldController.create_new(GPTAssistantAPIFunctionParamVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_description, ModuleTableFieldVO.FIELD_TYPE_string, 'Description', true),
            ModuleTableFieldController.create_new(GPTAssistantAPIFunctionParamVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionParamVO>().required, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Requis', true, true, true),
            ModuleTableFieldController.create_new(GPTAssistantAPIFunctionParamVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionParamVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0),
            ModuleTableFieldController.create_new(GPTAssistantAPIFunctionParamVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionParamVO>().string_enum, ModuleTableFieldVO.FIELD_TYPE_string_array, 'Options string enum', false),
            ModuleTableFieldController.create_new(GPTAssistantAPIFunctionParamVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionParamVO>().number_enum, ModuleTableFieldVO.FIELD_TYPE_float_array, 'Options numebr enum', false),
            ModuleTableFieldController.create_new(GPTAssistantAPIFunctionParamVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionParamVO>().object_fields, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Champs (type objet)', false),
            ModuleTableFieldController.create_new(GPTAssistantAPIFunctionParamVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionParamVO>().array_items_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type des éléments (type array)', false).setEnumValues(GPTAssistantAPIFunctionParamVO.TYPE_LABELS),

        ];

        const table = ModuleTableController.create_new(this.name, GPTAssistantAPIFunctionParamVO, null, 'GPT Assistant API - Param de Fonction');

        function_id.set_many_to_one_target_moduletable_name(GPTAssistantAPIFunctionVO.API_TYPE_ID);
    }

    private initializeGPTAssistantAPIThreadVO() {

        const user_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', true);
        const label = ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().gpt_thread_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT ID', true).unique();
        const current_default_assistant_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().current_default_assistant_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant par défaut pour les prochains messages / prompts', false);
        const current_oselia_assistant_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().current_oselia_assistant_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant Osélia en cours de run', false);
        const current_oselia_prompt_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().current_oselia_prompt_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Prompt Osélia en cours de réponse', false);

        const fields = [
            user_id,
            label,
            current_default_assistant_id,
            ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().oselia_is_running, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Osélia en cours de réflexion', true, true, false),
            current_oselia_assistant_id,
            current_oselia_prompt_id
        ];

        const table = ModuleTableController.create_new(this.name, GPTAssistantAPIThreadVO, label, 'GPT Assistant API - Thread');

        user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
        current_default_assistant_id.set_many_to_one_target_moduletable_name(GPTAssistantAPIAssistantVO.API_TYPE_ID);
        current_oselia_assistant_id.set_many_to_one_target_moduletable_name(GPTAssistantAPIAssistantVO.API_TYPE_ID);



        current_oselia_prompt_id.set_many_to_one_target_moduletable_name(OseliaPromptVO.API_TYPE_ID);
    }

    private initializeGPTAssistantAPIRunVO() {

        const thread_id = ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().thread_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Thread', true);
        const assistant_id = ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().assistant_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant', true);
        const label = ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().gpt_run_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT ID', true).unique();

        const fields = [
            thread_id,
            assistant_id,
            label
        ];

        const table = ModuleTableController.create_new(this.name, GPTAssistantAPIRunVO, label, 'GPT Assistant API - Tâche');

        thread_id.set_many_to_one_target_moduletable_name(GPTAssistantAPIThreadVO.API_TYPE_ID);
        assistant_id.set_many_to_one_target_moduletable_name(GPTAssistantAPIAssistantVO.API_TYPE_ID);
    }


    private initializeGPTAssistantAPIThreadMessageVO() {

        const thread_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().thread_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Thread', true);
        const run_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().run_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Tâche', false);
        const user_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', true);

        const label = ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().gpt_message_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT ID', true).unique();

        const assistant_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().assistant_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant', false);
        const prompt_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().prompt_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Prompt Osélia', false);

        const fields = [
            label,

            thread_id,
            run_id,
            user_id,

            assistant_id,
            prompt_id,

            ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().role_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Rôle', true, true, GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_TYPE_USER).setEnumValues(GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_TYPE_LABELS),
            ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date', true),
        ];

        const table = ModuleTableController.create_new(this.name, GPTAssistantAPIThreadMessageVO, label, 'GPT Assistant API - Thread Message');

        thread_id.set_many_to_one_target_moduletable_name(GPTAssistantAPIThreadVO.API_TYPE_ID);
        assistant_id.set_many_to_one_target_moduletable_name(GPTAssistantAPIAssistantVO.API_TYPE_ID);
        run_id.set_many_to_one_target_moduletable_name(GPTAssistantAPIRunVO.API_TYPE_ID);
        user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
        prompt_id.set_many_to_one_target_moduletable_name(OseliaPromptVO.API_TYPE_ID);
    }

    private initializeGPTAssistantAPIThreadMessageFileVO() {

        const thread_message_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageFileVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageFileVO>().thread_message_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Message', true);
        const file_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageFileVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageFileVO>().file_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Fichier', true);

        const fields = [
            thread_message_id,
            file_id
        ];

        const table = ModuleTableController.create_new(this.name, GPTAssistantAPIThreadMessageFileVO, null, 'GPT Assistant API - Thread Message File');

        thread_message_id.set_many_to_one_target_moduletable_name(GPTAssistantAPIThreadMessageVO.API_TYPE_ID);
        file_id.set_many_to_one_target_moduletable_name(GPTAssistantAPIFileVO.API_TYPE_ID);
    }

    private initializeGPTAssistantAPIThreadMessageContentVO() {

        const thread_message_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().thread_message_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Message', true);
        const assistant_file_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().assistant_file_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Fichier/image', false);
        const action_url_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().action_url_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Action URL', false);
        const email_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().email_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Email', false);

        const fields = [
            thread_message_id,
            assistant_file_id,

            ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0),
            ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().value, ModuleTableFieldVO.FIELD_TYPE_string, 'Contenu', false),
            ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().annotations, ModuleTableFieldVO.FIELD_TYPE_string_array, 'Annotations', false),
            ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().content_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type', true, true, GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT).setEnumValues(GPTAssistantAPIThreadMessageContentVO.TYPE_LABELS),

            action_url_id,
            email_id
        ];

        const table = ModuleTableController.create_new(this.name, GPTAssistantAPIThreadMessageContentVO, null, 'GPT Assistant API - Thread Message Content');
        thread_message_id.set_many_to_one_target_moduletable_name(GPTAssistantAPIThreadMessageVO.API_TYPE_ID);
        assistant_file_id.set_many_to_one_target_moduletable_name(GPTAssistantAPIFileVO.API_TYPE_ID);
        action_url_id.set_many_to_one_target_moduletable_name(ActionURLVO.API_TYPE_ID);
        email_id.set_many_to_one_target_moduletable_name(MailVO.API_TYPE_ID);
    }

}
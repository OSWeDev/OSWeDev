import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import UserVO from '../AccessPolicy/vos/UserVO';
import ActionURLVO from '../ActionURL/vos/ActionURLVO';
import FileVO from '../File/vos/FileVO';
import MailVO from '../Mailer/vos/MailVO';
import Module from '../Module';
import ModuleTableVO from '../ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../ModuleTableFieldVO';
import OseliaPromptVO from '../Oselia/vos/OseliaPromptVO';
import OseliaThreadFeedbackVO from '../Oselia/vos/OseliaThreadFeedbackVO';
import OseliaThreadMessageFeedbackVO from '../Oselia/vos/OseliaThreadMessageFeedbackVO';
import OseliaUserPromptVO from '../Oselia/vos/OseliaUserPromptVO';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
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
        let label_field = ModuleTableFieldController.create_new(OseliaPromptVO.API_TYPE_ID, field_names<OseliaPromptVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true).unique();
        let default_assistant_id = ModuleTableFieldController.create_new(OseliaPromptVO.API_TYPE_ID, field_names<OseliaPromptVO>().default_assistant_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant par défaut', false);

        let datatable_fields = [
            label_field,
            ModuleTableFieldController.create_new(OseliaPromptVO.API_TYPE_ID, field_names<OseliaPromptVO>().prompt, ModuleTableFieldVO.FIELD_TYPE_string, 'Prompt', true),
            ModuleTableFieldController.create_new(OseliaPromptVO.API_TYPE_ID, field_names<OseliaPromptVO>().prompt_description, ModuleTableFieldVO.FIELD_TYPE_string, 'Description', true),
            ModuleTableFieldController.create_new(OseliaPromptVO.API_TYPE_ID, field_names<OseliaPromptVO>().prompt_parameters_description, ModuleTableFieldVO.FIELD_TYPE_string, 'Description des paramètres', true),
            default_assistant_id,
        ];

        let datatable = new ModuleTableVO(this, OseliaPromptVO.API_TYPE_ID, () => new OseliaPromptVO(), datatable_fields, label_field, "Prompts Osélia");
        this.datatables.push(datatable);
        default_assistant_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIAssistantVO.API_TYPE_ID]);

        VersionedVOController.getInstance().registerModuleTable(datatable);
    }

    private initialize_OseliaUserPromptVO() {
        let user_id = ModuleTableFieldController.create_new(OseliaUserPromptVO.API_TYPE_ID, field_names<OseliaUserPromptVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', true);
        let prompt_id = ModuleTableFieldController.create_new(OseliaUserPromptVO.API_TYPE_ID, field_names<OseliaUserPromptVO>().prompt_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Prompt', true);

        let datatable_fields = [
            prompt_id,
            user_id,
            ModuleTableFieldController.create_new(OseliaUserPromptVO.API_TYPE_ID, field_names<OseliaUserPromptVO>().adapted_prompt, ModuleTableFieldVO.FIELD_TYPE_string, 'Prompt adapté', true),
            ModuleTableFieldController.create_new(OseliaUserPromptVO.API_TYPE_ID, field_names<OseliaUserPromptVO>().why_and_what_we_adapted_description, ModuleTableFieldVO.FIELD_TYPE_string, 'Description de la spécialisation (raison et impact)', true),
        ];

        let datatable = new ModuleTableVO(this, OseliaUserPromptVO.API_TYPE_ID, () => new OseliaUserPromptVO(), datatable_fields, null, "Prompts Osélia - surcharge par utilisateur");
        this.datatables.push(datatable);
        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
        prompt_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[OseliaPromptVO.API_TYPE_ID]);

        VersionedVOController.getInstance().registerModuleTable(datatable);
    }

    private initialize_OseliaThreadMessageFeedbackVO() {
        let assistant_thread_message_id = ModuleTableFieldController.create_new(OseliaThreadMessageFeedbackVO.API_TYPE_ID, field_names<OseliaThreadMessageFeedbackVO>().assistant_thread_message_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Message Osélia', true);
        let assistant_id = ModuleTableFieldController.create_new(OseliaThreadMessageFeedbackVO.API_TYPE_ID, field_names<OseliaThreadMessageFeedbackVO>().assistant_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant', true);
        let prompt_id = ModuleTableFieldController.create_new(OseliaThreadMessageFeedbackVO.API_TYPE_ID, field_names<OseliaThreadMessageFeedbackVO>().prompt_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Prompt', false);
        let user_id = ModuleTableFieldController.create_new(OseliaThreadMessageFeedbackVO.API_TYPE_ID, field_names<OseliaThreadMessageFeedbackVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', true);

        let datatable_fields = [
            user_id,
            assistant_thread_message_id,
            assistant_id,
            prompt_id,
            ModuleTableFieldController.create_new(OseliaThreadMessageFeedbackVO.API_TYPE_ID, field_names<OseliaThreadMessageFeedbackVO>().feedback_positive, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Feedback positif', true, true, true),
            ModuleTableFieldController.create_new(OseliaThreadMessageFeedbackVO.API_TYPE_ID, field_names<OseliaThreadMessageFeedbackVO>().feedback, ModuleTableFieldVO.FIELD_TYPE_string, 'Feedback', false),
        ];

        let datatable = new ModuleTableVO(this, OseliaThreadMessageFeedbackVO.API_TYPE_ID, () => new OseliaThreadMessageFeedbackVO(), datatable_fields, null, "Retour expérience Osélia - Message");
        this.datatables.push(datatable);
        assistant_thread_message_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIThreadMessageVO.API_TYPE_ID]);
        assistant_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIAssistantVO.API_TYPE_ID]);
        prompt_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[OseliaPromptVO.API_TYPE_ID]);
        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);

        VersionedVOController.getInstance().registerModuleTable(datatable);
    }

    private initialize_OseliaThreadFeedbackVO() {
        let assistant_thread_id = ModuleTableFieldController.create_new(OseliaThreadFeedbackVO.API_TYPE_ID, field_names<OseliaThreadFeedbackVO>().assistant_thread_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Thread Osélia', true);
        let user_id = ModuleTableFieldController.create_new(OseliaThreadFeedbackVO.API_TYPE_ID, field_names<OseliaThreadFeedbackVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', true);

        let datatable_fields = [
            user_id,
            assistant_thread_id,
            ModuleTableFieldController.create_new(OseliaThreadMessageFeedbackVO.API_TYPE_ID, field_names<OseliaThreadMessageFeedbackVO>().feedback_positive, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Feedback positif', true, true, true),
            ModuleTableFieldController.create_new(OseliaThreadMessageFeedbackVO.API_TYPE_ID, field_names<OseliaThreadMessageFeedbackVO>().feedback, ModuleTableFieldVO.FIELD_TYPE_string, 'Feedback', false),
        ];

        let datatable = new ModuleTableVO(this, OseliaThreadFeedbackVO.API_TYPE_ID, () => new OseliaThreadFeedbackVO(), datatable_fields, null, "Retour expérience Osélia - Thread");
        this.datatables.push(datatable);
        assistant_thread_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIThreadVO.API_TYPE_ID]);
        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);

        VersionedVOController.getInstance().registerModuleTable(datatable);
    }

    private initializeGPTCompletionAPIMessageVO() {

        let user_id = ModuleTableFieldController.create_new(GPTCompletionAPIMessageVO.API_TYPE_ID, field_names<GPTCompletionAPIMessageVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'User', false);
        let conversation_id = ModuleTableFieldController.create_new(GPTCompletionAPIMessageVO.API_TYPE_ID, field_names<GPTCompletionAPIMessageVO>().conversation_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Conversation', false);

        let fields = [
            conversation_id,
            user_id,
            ModuleTableFieldController.create_new(GPTCompletionAPIMessageVO.API_TYPE_ID, field_names<GPTCompletionAPIMessageVO>().role_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type de rôle', true, true, GPTCompletionAPIMessageVO.GPTMSG_ROLE_TYPE_SYSTEM).setEnumValues(GPTCompletionAPIMessageVO.GPTMSG_ROLE_TYPE_LABELS),
            ModuleTableFieldController.create_new(GPTCompletionAPIMessageVO.API_TYPE_ID, field_names<GPTCompletionAPIMessageVO>().content, ModuleTableFieldVO.FIELD_TYPE_string, 'Contenu', false),
            ModuleTableFieldController.create_new(GPTCompletionAPIMessageVO.API_TYPE_ID, field_names<GPTCompletionAPIMessageVO>().date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date', true),
        ];

        let table = new ModuleTableVO(this, GPTCompletionAPIMessageVO.API_TYPE_ID, () => new GPTCompletionAPIMessageVO(), fields, null, 'GPT Completion API - Message');
        this.datatables.push(table);

        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
        conversation_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTCompletionAPIConversationVO.API_TYPE_ID]);
    }

    private initializeGPTCompletionAPIConversationVO() {

        let label = ModuleTableFieldController.create_new(GPTCompletionAPIConversationVO.API_TYPE_ID, field_names<GPTCompletionAPIConversationVO>().date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de création', true);
        let fields = [
            label
        ];

        let table = new ModuleTableVO(this, GPTCompletionAPIConversationVO.API_TYPE_ID, () => new GPTCompletionAPIConversationVO(), fields, label, 'GPT Completion API - Conversation');
        this.datatables.push(table);
    }

    private initializeGPTAssistantAPIAssistantVO() {

        let label = ModuleTableFieldController.create_new(GPTAssistantAPIAssistantVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantVO>().gpt_assistant_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT ID', true).unique();

        let fields = [
            label,
            ModuleTableFieldController.create_new(GPTAssistantAPIAssistantVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantVO>().nom, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', false),
            ModuleTableFieldController.create_new(GPTAssistantAPIAssistantVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantVO>().description, ModuleTableFieldVO.FIELD_TYPE_string, 'Description', false),
        ];

        let table = new ModuleTableVO(this, GPTAssistantAPIAssistantVO.API_TYPE_ID, () => new GPTAssistantAPIAssistantVO(), fields, label, 'GPT Assistant API - Assistant');
        this.datatables.push(table);
    }

    private initializeGPTAssistantAPIFunctionVO() {

        let label = ModuleTableFieldController.create_new(GPTAssistantAPIFunctionVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionVO>().gpt_function_name, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT - Nom', true).unique();

        let fields = [
            label,
            ModuleTableFieldController.create_new(GPTAssistantAPIFunctionVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Module', true),
            ModuleTableFieldController.create_new(GPTAssistantAPIFunctionVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionVO>().module_function, ModuleTableFieldVO.FIELD_TYPE_string, 'Fonction', true),
            ModuleTableFieldController.create_new(GPTAssistantAPIFunctionVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionVO>().gpt_function_description, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT - Description', true),
            ModuleTableFieldController.create_new(GPTAssistantAPIFunctionVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionVO>().prepend_thread_vo, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Thread VO en 1er param', true, true, true),
        ];

        let table = new ModuleTableVO(this, GPTAssistantAPIFunctionVO.API_TYPE_ID, () => new GPTAssistantAPIFunctionVO(), fields, label, 'GPT Assistant API - Fonction');
        this.datatables.push(table);
    }

    private initializeGPTAssistantAPIAssistantFunctionVO() {

        let assistant_id = ModuleTableFieldController.create_new(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantFunctionVO>().assistant_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant', true);
        let function_id = ModuleTableFieldController.create_new(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantFunctionVO>().function_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Fonction', true);

        let fields = [
            assistant_id,
            function_id
        ];

        let table = new ModuleTableVO(this, GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID, () => new GPTAssistantAPIAssistantFunctionVO(), fields, null, 'GPT Assistant API - Assistant/Fonction');
        this.datatables.push(table);

        assistant_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIAssistantVO.API_TYPE_ID]);
        function_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIFunctionVO.API_TYPE_ID]);
    }


    private initializeGPTAssistantAPIFileVO() {

        let file_id = ModuleTableFieldController.create_new(GPTAssistantAPIFileVO.API_TYPE_ID, field_names<GPTAssistantAPIFileVO>().file_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant', true).unique();
        let label = ModuleTableFieldController.create_new(GPTAssistantAPIFileVO.API_TYPE_ID, field_names<GPTAssistantAPIFileVO>().gpt_file_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT ID', true).unique();

        let fields = [
            file_id,
            label,
            ModuleTableFieldController.create_new(GPTAssistantAPIFileVO.API_TYPE_ID, field_names<GPTAssistantAPIFileVO>().purpose, ModuleTableFieldVO.FIELD_TYPE_enum, 'Params', true, true, GPTAssistantAPIFileVO.PURPOSE_ASSISTANTS).setEnumValues(GPTAssistantAPIFileVO.PURPOSE_LABELS),
            ModuleTableFieldController.create_new(GPTAssistantAPIFileVO.API_TYPE_ID, field_names<GPTAssistantAPIFileVO>().status, ModuleTableFieldVO.FIELD_TYPE_enum, 'Etat', true, true, GPTAssistantAPIFileVO.STATUS_UPLOADED).setEnumValues(GPTAssistantAPIFileVO.STATUS_LABELS),
            ModuleTableFieldController.create_new(GPTAssistantAPIFileVO.API_TYPE_ID, field_names<GPTAssistantAPIFileVO>().filename, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du fichier', true),
            ModuleTableFieldController.create_new(GPTAssistantAPIFileVO.API_TYPE_ID, field_names<GPTAssistantAPIFileVO>().created_at, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de création', true),
            ModuleTableFieldController.create_new(GPTAssistantAPIFileVO.API_TYPE_ID, field_names<GPTAssistantAPIFileVO>().bytes, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Bytes', true, true, 0),
        ];

        let table = new ModuleTableVO(this, GPTAssistantAPIFileVO.API_TYPE_ID, () => new GPTAssistantAPIFileVO(), fields, label, 'GPT Assistant API - Fichier');
        this.datatables.push(table);

        file_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[FileVO.API_TYPE_ID]);
    }

    private initializeGPTAssistantAPIFunctionParamVO() {

        let function_id = ModuleTableFieldController.create_new(GPTAssistantAPIFunctionParamVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionParamVO>().function_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Fonction', true);

        let fields = [
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

        let table = new ModuleTableVO(this, GPTAssistantAPIFunctionParamVO.API_TYPE_ID, () => new GPTAssistantAPIFunctionParamVO(), fields, null, 'GPT Assistant API - Param de Fonction');
        this.datatables.push(table);

        function_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIFunctionVO.API_TYPE_ID]);
    }

    private initializeGPTAssistantAPIThreadVO() {

        let user_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', true);
        let label = ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().gpt_thread_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT ID', true).unique();
        let current_default_assistant_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().current_default_assistant_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant par défaut pour les prochains messages / prompts', false);
        let current_oselia_assistant_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().current_oselia_assistant_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant Osélia en cours de run', false);
        let current_oselia_prompt_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().current_oselia_prompt_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Prompt Osélia en cours de réponse', false);

        let fields = [
            user_id,
            label,
            current_default_assistant_id,
            ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().oselia_is_running, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Osélia en cours de réflexion', true, true, false),
            current_oselia_assistant_id,
            current_oselia_prompt_id
        ];

        let table = new ModuleTableVO(this, GPTAssistantAPIThreadVO.API_TYPE_ID, () => new GPTAssistantAPIThreadVO(), fields, label, 'GPT Assistant API - Thread');
        this.datatables.push(table);

        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
        current_default_assistant_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIAssistantVO.API_TYPE_ID]);
        current_oselia_assistant_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIAssistantVO.API_TYPE_ID]);



        current_oselia_prompt_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[OseliaPromptVO.API_TYPE_ID]);
    }

    private initializeGPTAssistantAPIRunVO() {

        let thread_id = ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().thread_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Thread', true);
        let assistant_id = ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().assistant_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant', true);
        let label = ModuleTableFieldController.create_new(GPTAssistantAPIRunVO.API_TYPE_ID, field_names<GPTAssistantAPIRunVO>().gpt_run_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT ID', true).unique();

        let fields = [
            thread_id,
            assistant_id,
            label
        ];

        let table = new ModuleTableVO(this, GPTAssistantAPIRunVO.API_TYPE_ID, () => new GPTAssistantAPIRunVO(), fields, label, 'GPT Assistant API - Tâche');
        this.datatables.push(table);

        thread_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIThreadVO.API_TYPE_ID]);
        assistant_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIAssistantVO.API_TYPE_ID]);
    }


    private initializeGPTAssistantAPIThreadMessageVO() {

        let thread_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().thread_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Thread', true);
        let run_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().run_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Tâche', false);
        let user_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', true);

        let label = ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().gpt_message_id, ModuleTableFieldVO.FIELD_TYPE_string, 'GPT ID', true).unique();

        let assistant_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().assistant_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant', false);
        let prompt_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().prompt_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Prompt Osélia', false);

        let fields = [
            label,

            thread_id,
            run_id,
            user_id,

            assistant_id,
            prompt_id,

            ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().role_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Rôle', true, true, GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_TYPE_USER).setEnumValues(GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_TYPE_LABELS),
            ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date', true),
        ];

        let table = new ModuleTableVO(this, GPTAssistantAPIThreadMessageVO.API_TYPE_ID, () => new GPTAssistantAPIThreadMessageVO(), fields, label, 'GPT Assistant API - Thread Message');
        this.datatables.push(table);

        thread_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIThreadVO.API_TYPE_ID]);
        assistant_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIAssistantVO.API_TYPE_ID]);
        run_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIRunVO.API_TYPE_ID]);
        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
        prompt_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[OseliaPromptVO.API_TYPE_ID]);
    }

    private initializeGPTAssistantAPIThreadMessageFileVO() {

        let thread_message_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageFileVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageFileVO>().thread_message_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Message', true);
        let file_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageFileVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageFileVO>().file_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Fichier', true);

        let fields = [
            thread_message_id,
            file_id
        ];

        let table = new ModuleTableVO(this, GPTAssistantAPIThreadMessageFileVO.API_TYPE_ID, () => new GPTAssistantAPIThreadMessageFileVO(), fields, null, 'GPT Assistant API - Thread Message File');
        this.datatables.push(table);

        thread_message_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIThreadMessageVO.API_TYPE_ID]);
        file_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIFileVO.API_TYPE_ID]);
    }

    private initializeGPTAssistantAPIThreadMessageContentVO() {

        let thread_message_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().thread_message_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Message', true);
        let assistant_file_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().assistant_file_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Fichier/image', false);
        let action_url_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().action_url_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Action URL', false);
        let email_id = ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().email_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Email', false);

        let fields = [
            thread_message_id,
            assistant_file_id,

            ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0),
            ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().value, ModuleTableFieldVO.FIELD_TYPE_string, 'Contenu', false),
            ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().annotations, ModuleTableFieldVO.FIELD_TYPE_string_array, 'Annotations', false),
            ModuleTableFieldController.create_new(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().content_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type', true, true, GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT).setEnumValues(GPTAssistantAPIThreadMessageContentVO.TYPE_LABELS),

            action_url_id,
            email_id
        ];

        let table = new ModuleTableVO(this, GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, () => new GPTAssistantAPIThreadMessageContentVO(), fields, null, 'GPT Assistant API - Thread Message Content');
        this.datatables.push(table);
        thread_message_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIThreadMessageVO.API_TYPE_ID]);
        assistant_file_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIFileVO.API_TYPE_ID]);
        action_url_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[ActionURLVO.API_TYPE_ID]);
        email_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[MailVO.API_TYPE_ID]);
    }

}
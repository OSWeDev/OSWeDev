import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import UserVO from '../AccessPolicy/vos/UserVO';
import FileVO from '../File/vos/FileVO';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
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
        this.fields = [];
        this.datatables = [];

        this.initializeGPTCompletionAPIConversationVO();
        this.initializeGPTCompletionAPIMessageVO();

        this.initializeGPTAssistantAPIAssistantVO();
        this.initializeGPTAssistantAPIFunctionVO();
        this.initializeGPTAssistantAPIAssistantFunctionVO();
        this.initializeGPTAssistantAPIFileVO();
        this.initializeGPTAssistantAPIFunctionParamVO();
        this.initializeGPTAssistantAPIThreadVO();
        this.initializeGPTAssistantAPIRunVO();
        this.initializeGPTAssistantAPIThreadMessageVO();
        this.initializeGPTAssistantAPIThreadMessageFileVO();
        this.initializeGPTAssistantAPIThreadMessageContentVO();
    }

    private initializeGPTCompletionAPIMessageVO() {

        let user_id = new ModuleTableField(field_names<GPTCompletionAPIMessageVO>().user_id, ModuleTableField.FIELD_TYPE_foreign_key, 'User', false);
        let conversation_id = new ModuleTableField(field_names<GPTCompletionAPIMessageVO>().conversation_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Conversation', false);

        let fields = [
            conversation_id,
            user_id,
            new ModuleTableField(field_names<GPTCompletionAPIMessageVO>().role_type, ModuleTableField.FIELD_TYPE_enum, 'Type de rôle', true, true, GPTCompletionAPIMessageVO.GPTMSG_ROLE_TYPE_SYSTEM).setEnumValues(GPTCompletionAPIMessageVO.GPTMSG_ROLE_TYPE_LABELS),
            new ModuleTableField(field_names<GPTCompletionAPIMessageVO>().content, ModuleTableField.FIELD_TYPE_string, 'Contenu', false),
            new ModuleTableField(field_names<GPTCompletionAPIMessageVO>().date, ModuleTableField.FIELD_TYPE_tstz, 'Date', true),
        ];

        let table = new ModuleTable(this, GPTCompletionAPIMessageVO.API_TYPE_ID, () => new GPTCompletionAPIMessageVO(), fields, null, 'GPT Completion API - Message');
        this.datatables.push(table);

        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
        conversation_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTCompletionAPIConversationVO.API_TYPE_ID]);
    }

    private initializeGPTCompletionAPIConversationVO() {

        let label = new ModuleTableField(field_names<GPTCompletionAPIConversationVO>().date, ModuleTableField.FIELD_TYPE_tstz, 'Date de création', true);
        let fields = [
            label
        ];

        let table = new ModuleTable(this, GPTCompletionAPIConversationVO.API_TYPE_ID, () => new GPTCompletionAPIConversationVO(), fields, label, 'GPT Completion API - Conversation');
        this.datatables.push(table);
    }

    private initializeGPTAssistantAPIAssistantVO() {

        let label = new ModuleTableField(field_names<GPTAssistantAPIAssistantVO>().gpt_assistant_id, ModuleTableField.FIELD_TYPE_string, 'GPT ID', true).unique();

        let fields = [
            label
        ];

        let table = new ModuleTable(this, GPTAssistantAPIAssistantVO.API_TYPE_ID, () => new GPTAssistantAPIAssistantVO(), fields, label, 'GPT Assistant API - Assistant');
        this.datatables.push(table);
    }

    private initializeGPTAssistantAPIFunctionVO() {

        let label = new ModuleTableField(field_names<GPTAssistantAPIFunctionVO>().gpt_function_name, ModuleTableField.FIELD_TYPE_string, 'GPT - Nom', true).unique();

        let fields = [
            label,
            new ModuleTableField(field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleTableField.FIELD_TYPE_string, 'Module', true),
            new ModuleTableField(field_names<GPTAssistantAPIFunctionVO>().module_function, ModuleTableField.FIELD_TYPE_string, 'Fonction', true),
            new ModuleTableField(field_names<GPTAssistantAPIFunctionVO>().gpt_function_description, ModuleTableField.FIELD_TYPE_string, 'GPT - Description', true),
            new ModuleTableField(field_names<GPTAssistantAPIFunctionVO>().prepend_thread_vo, ModuleTableField.FIELD_TYPE_boolean, 'Thread VO en 1er param', true, true, true),
        ];

        let table = new ModuleTable(this, GPTAssistantAPIFunctionVO.API_TYPE_ID, () => new GPTAssistantAPIFunctionVO(), fields, label, 'GPT Assistant API - Fonction');
        this.datatables.push(table);
    }

    private initializeGPTAssistantAPIAssistantFunctionVO() {

        let assistant_id = new ModuleTableField(field_names<GPTAssistantAPIAssistantFunctionVO>().assistant_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Assistant', true);
        let function_id = new ModuleTableField(field_names<GPTAssistantAPIAssistantFunctionVO>().function_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Fonction', true);

        let fields = [
            assistant_id,
            function_id
        ];

        let table = new ModuleTable(this, GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID, () => new GPTAssistantAPIAssistantFunctionVO(), fields, null, 'GPT Assistant API - Assistant/Fonction');
        this.datatables.push(table);

        assistant_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIAssistantVO.API_TYPE_ID]);
        function_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIFunctionVO.API_TYPE_ID]);
    }


    private initializeGPTAssistantAPIFileVO() {

        let file_id = new ModuleTableField(field_names<GPTAssistantAPIFileVO>().file_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Assistant', true).unique();
        let label = new ModuleTableField(field_names<GPTAssistantAPIFileVO>().gpt_file_id, ModuleTableField.FIELD_TYPE_string, 'GPT ID', true).unique();

        let fields = [
            file_id,
            label,
            new ModuleTableField(field_names<GPTAssistantAPIFileVO>().purpose, ModuleTableField.FIELD_TYPE_enum, 'Params', true, true, GPTAssistantAPIFileVO.PURPOSE_ASSISTANTS).setEnumValues(GPTAssistantAPIFileVO.PURPOSE_LABELS),
            new ModuleTableField(field_names<GPTAssistantAPIFileVO>().status, ModuleTableField.FIELD_TYPE_enum, 'Etat', true, true, GPTAssistantAPIFileVO.STATUS_UPLOADED).setEnumValues(GPTAssistantAPIFileVO.STATUS_LABELS),
            new ModuleTableField(field_names<GPTAssistantAPIFileVO>().filename, ModuleTableField.FIELD_TYPE_string, 'Nom du fichier', true),
            new ModuleTableField(field_names<GPTAssistantAPIFileVO>().created_at, ModuleTableField.FIELD_TYPE_tstz, 'Date de création', true),
            new ModuleTableField(field_names<GPTAssistantAPIFileVO>().bytes, ModuleTableField.FIELD_TYPE_plain_vo_obj, 'Bytes', true, true, 0),
        ];

        let table = new ModuleTable(this, GPTAssistantAPIFileVO.API_TYPE_ID, () => new GPTAssistantAPIFileVO(), fields, label, 'GPT Assistant API - Fichier');
        this.datatables.push(table);

        file_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[FileVO.API_TYPE_ID]);
    }

    private initializeGPTAssistantAPIFunctionParamVO() {

        let function_id = new ModuleTableField(field_names<GPTAssistantAPIFunctionParamVO>().function_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Fonction', true);

        let fields = [
            function_id,
            new ModuleTableField(field_names<GPTAssistantAPIFunctionParamVO>().type, ModuleTableField.FIELD_TYPE_enum, 'Type', true, true, GPTAssistantAPIFunctionParamVO.TYPE_STRING).setEnumValues(GPTAssistantAPIFunctionParamVO.TYPE_LABELS),
            new ModuleTableField(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, ModuleTableField.FIELD_TYPE_string, 'Nom du paramètre', true),
            new ModuleTableField(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_description, ModuleTableField.FIELD_TYPE_string, 'Description', true),
            new ModuleTableField(field_names<GPTAssistantAPIFunctionParamVO>().required, ModuleTableField.FIELD_TYPE_boolean, 'Requis', true, true, true),
            new ModuleTableField(field_names<GPTAssistantAPIFunctionParamVO>().weight, ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0),
            new ModuleTableField(field_names<GPTAssistantAPIFunctionParamVO>().string_enum, ModuleTableField.FIELD_TYPE_string_array, 'Options string enum', false),
            new ModuleTableField(field_names<GPTAssistantAPIFunctionParamVO>().number_enum, ModuleTableField.FIELD_TYPE_float_array, 'Options numebr enum', false),
            new ModuleTableField(field_names<GPTAssistantAPIFunctionParamVO>().object_fields, ModuleTableField.FIELD_TYPE_plain_vo_obj, 'Champs (type objet)', false),
            new ModuleTableField(field_names<GPTAssistantAPIFunctionParamVO>().array_items_type, ModuleTableField.FIELD_TYPE_enum, 'Type des éléments (type array)', false).setEnumValues(GPTAssistantAPIFunctionParamVO.TYPE_LABELS),

        ];

        let table = new ModuleTable(this, GPTAssistantAPIFunctionParamVO.API_TYPE_ID, () => new GPTAssistantAPIFunctionParamVO(), fields, null, 'GPT Assistant API - Param de Fonction');
        this.datatables.push(table);

        function_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIFunctionVO.API_TYPE_ID]);
    }

    private initializeGPTAssistantAPIThreadVO() {

        let user_id = new ModuleTableField(field_names<GPTAssistantAPIThreadVO>().user_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Utilisateur', true);
        let label = new ModuleTableField(field_names<GPTAssistantAPIThreadVO>().gpt_thread_id, ModuleTableField.FIELD_TYPE_string, 'GPT ID', true).unique();

        let fields = [
            user_id,
            label,
        ];

        let table = new ModuleTable(this, GPTAssistantAPIThreadVO.API_TYPE_ID, () => new GPTAssistantAPIThreadVO(), fields, label, 'GPT Assistant API - Thread');
        this.datatables.push(table);

        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
    }

    private initializeGPTAssistantAPIRunVO() {

        let thread_id = new ModuleTableField(field_names<GPTAssistantAPIRunVO>().thread_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Thread', true);
        let assistant_id = new ModuleTableField(field_names<GPTAssistantAPIRunVO>().assistant_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Assistant', true);
        let label = new ModuleTableField(field_names<GPTAssistantAPIRunVO>().gpt_run_id, ModuleTableField.FIELD_TYPE_string, 'GPT ID', true).unique();

        let fields = [
            thread_id,
            assistant_id,
            label
        ];

        let table = new ModuleTable(this, GPTAssistantAPIRunVO.API_TYPE_ID, () => new GPTAssistantAPIRunVO(), fields, label, 'GPT Assistant API - Tâche');
        this.datatables.push(table);

        thread_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIThreadVO.API_TYPE_ID]);
        assistant_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIAssistantVO.API_TYPE_ID]);
    }


    private initializeGPTAssistantAPIThreadMessageVO() {

        let thread_id = new ModuleTableField(field_names<GPTAssistantAPIThreadMessageVO>().thread_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Thread', true);
        let assistant_id = new ModuleTableField(field_names<GPTAssistantAPIThreadMessageVO>().assistant_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Assistant', false);
        let run_id = new ModuleTableField(field_names<GPTAssistantAPIThreadMessageVO>().run_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Tâche', false);
        let user_id = new ModuleTableField(field_names<GPTAssistantAPIThreadMessageVO>().user_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Utilisateur', true);

        let label = new ModuleTableField(field_names<GPTAssistantAPIThreadMessageVO>().gpt_message_id, ModuleTableField.FIELD_TYPE_string, 'GPT ID', true).unique();

        let fields = [
            label,

            thread_id,
            assistant_id,
            run_id,
            user_id,

            new ModuleTableField(field_names<GPTAssistantAPIThreadMessageVO>().role_type, ModuleTableField.FIELD_TYPE_enum, 'Rôle', true, true, GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_TYPE_USER).setEnumValues(GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_TYPE_LABELS),
            new ModuleTableField(field_names<GPTAssistantAPIThreadMessageVO>().date, ModuleTableField.FIELD_TYPE_tstz, 'Date', true),
        ];

        let table = new ModuleTable(this, GPTAssistantAPIThreadMessageVO.API_TYPE_ID, () => new GPTAssistantAPIThreadMessageVO(), fields, label, 'GPT Assistant API - Thread Message');
        this.datatables.push(table);

        thread_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIThreadVO.API_TYPE_ID]);
        assistant_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIAssistantVO.API_TYPE_ID]);
        run_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIRunVO.API_TYPE_ID]);
        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
    }

    private initializeGPTAssistantAPIThreadMessageFileVO() {

        let thread_message_id = new ModuleTableField(field_names<GPTAssistantAPIThreadMessageFileVO>().thread_message_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Message', true);
        let file_id = new ModuleTableField(field_names<GPTAssistantAPIThreadMessageFileVO>().file_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Fichier', true);

        let fields = [
            thread_message_id,
            file_id
        ];

        let table = new ModuleTable(this, GPTAssistantAPIThreadMessageFileVO.API_TYPE_ID, () => new GPTAssistantAPIThreadMessageFileVO(), fields, null, 'GPT Assistant API - Thread Message File');
        this.datatables.push(table);

        thread_message_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIThreadMessageVO.API_TYPE_ID]);
        file_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIFileVO.API_TYPE_ID]);
    }

    private initializeGPTAssistantAPIThreadMessageContentVO() {

        let thread_message_id = new ModuleTableField(field_names<GPTAssistantAPIThreadMessageContentVO>().thread_message_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Message', true);
        let assistant_file_id = new ModuleTableField(field_names<GPTAssistantAPIThreadMessageContentVO>().assistant_file_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Fichier/image', false);

        let fields = [
            thread_message_id,
            assistant_file_id,

            new ModuleTableField(field_names<GPTAssistantAPIThreadMessageContentVO>().weight, ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0),
            new ModuleTableField(field_names<GPTAssistantAPIThreadMessageContentVO>().value, ModuleTableField.FIELD_TYPE_string, 'Contenu', false),
            new ModuleTableField(field_names<GPTAssistantAPIThreadMessageContentVO>().annotations, ModuleTableField.FIELD_TYPE_string_array, 'Annotations', false),
            new ModuleTableField(field_names<GPTAssistantAPIThreadMessageContentVO>().content_type, ModuleTableField.FIELD_TYPE_enum, 'Type', true, true, GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT).setEnumValues(GPTAssistantAPIThreadMessageContentVO.TYPE_LABELS),
        ];

        let table = new ModuleTable(this, GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, () => new GPTAssistantAPIThreadMessageContentVO(), fields, null, 'GPT Assistant API - Thread Message Content');
        this.datatables.push(table);
        thread_message_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIThreadMessageVO.API_TYPE_ID]);
        assistant_file_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[GPTAssistantAPIFileVO.API_TYPE_ID]);
    }

}
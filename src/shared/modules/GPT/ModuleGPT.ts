import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import UserVO from '../AccessPolicy/vos/UserVO';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import APIGPTGenerateMultimodalResponseParam, { APIGPTGenerateMultimodalResponseParamStatic } from './api/APIGPTGenerateMultimodalResponseParam';
import APIGPTGenerateResponseParam, { APIGPTGenerateResponseParamStatic } from './api/APIGPTGenerateResponseParam';
import GPTConversationVO from './vos/GPTConversationVO';
import GPTMessageVO from './vos/GPTMessageVO';
import GPTMultiModalConversationVO from './vos/GPTMultiModalConversationVO';
import GPTMultiModalMessagePartURLVO from './vos/GPTMultiModalMessagePartURLVO';
import GPTMultiModalMessagePartVO from './vos/GPTMultiModalMessagePartVO';
import GPTMultiModalMessageVO from './vos/GPTMultiModalMessageVO';


export default class ModuleGPT extends Module {

    public static MODULE_NAME: string = 'GPT';

    public static PARAM_NAME_MODEL_ID: string = 'ModuleGPT.PARAM_NAME_MODEL_ID';
    public static PARAM_NAME_MODEL_VISION_ID: string = 'ModuleGPT.PARAM_NAME_MODEL_VISION_ID';

    public static APINAME_generate_response: string = "modulegpt_generate_response";
    public static APINAME_generate_multimodal_response: string = "modulegpt_generate_multimodal_response";

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleGPT.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleGPT.MODULE_NAME + ".BO_ACCESS";
    public static POLICY_FO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleGPT.MODULE_NAME + ".FO_ACCESS";

    public static getInstance(): ModuleGPT {
        if (!ModuleGPT.instance) {
            ModuleGPT.instance = new ModuleGPT();
        }
        return ModuleGPT.instance;
    }

    private static instance: ModuleGPT = null;

    public generate_response: (
        conversation: GPTConversationVO, newPrompt: GPTMessageVO
    ) => Promise<GPTMessageVO> = APIControllerWrapper.sah<APIGPTGenerateResponseParam, GPTMessageVO>(
        ModuleGPT.APINAME_generate_response);

    public generate_multimodal_response: (
        conversation: GPTMultiModalConversationVO, newPrompt: GPTMultiModalMessageVO
    ) => Promise<GPTMultiModalMessageVO> = APIControllerWrapper.sah<APIGPTGenerateMultimodalResponseParam, GPTMultiModalMessageVO>(
        ModuleGPT.APINAME_generate_multimodal_response);


    private constructor() {

        super("gpt", ModuleGPT.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<APIGPTGenerateResponseParam, GPTMessageVO>(
            null,
            ModuleGPT.APINAME_generate_response,
            null,
            APIGPTGenerateResponseParamStatic
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<APIGPTGenerateMultimodalResponseParam, GPTMultiModalMessageVO>(
            null,
            ModuleGPT.APINAME_generate_multimodal_response,
            null,
            APIGPTGenerateMultimodalResponseParamStatic
        ));

    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.initializeGPTMessageVO();
        this.initializeGPTConversationVO();

        this.initializeGPTMultiModalMessageVO();
        this.initializeGPTMultiModalMessagePartVO();
        this.initializeGPTMultiModalMessagePartURLVO();
        this.initializeGPTMultiModalConversationVO();
    }

    private initializeGPTMultiModalMessageVO() {

        let user_id = new ModuleTableField(field_names<GPTMultiModalMessageVO>().user_id, ModuleTableField.FIELD_TYPE_foreign_key, 'User', false);

        let fields = [
            new ModuleTableField(field_names<GPTMultiModalMessageVO>().role_type, ModuleTableField.FIELD_TYPE_enum, 'Type de rôle', true, true, GPTMessageVO.GPTMSG_ROLE_TYPE_SYSTEM).setEnumValues(GPTMessageVO.GPTMSG_ROLE_TYPE_LABELS),
            user_id,
            new ModuleTableField(field_names<GPTMultiModalMessageVO>().content, ModuleTableField.FIELD_TYPE_plain_vo_obj, 'Contenu', false),
            new ModuleTableField(field_names<GPTMultiModalMessageVO>().date, ModuleTableField.FIELD_TYPE_tstz, 'Date', true),
        ];

        let table = new ModuleTable(this, GPTMultiModalMessageVO.API_TYPE_ID, () => new GPTMultiModalMessageVO(), fields, null, 'Message multimodal GPT');
        this.datatables.push(table);

        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
    }

    private initializeGPTMultiModalMessagePartVO() {

        let fields = [
            new ModuleTableField(field_names<GPTMultiModalMessagePartVO>().type, ModuleTableField.FIELD_TYPE_string, 'Type', true, true, GPTMultiModalMessagePartVO.CONTENT_TYPE_TEXT),
            new ModuleTableField(field_names<GPTMultiModalMessagePartVO>().text, ModuleTableField.FIELD_TYPE_string, 'Texte', false),
            new ModuleTableField(field_names<GPTMultiModalMessagePartVO>().image_url, ModuleTableField.FIELD_TYPE_string, 'URL de l\'image', false),
        ];

        let table = new ModuleTable(this, GPTMultiModalMessagePartVO.API_TYPE_ID, () => new GPTMultiModalMessagePartVO(), fields, null, 'Contenu multimodal GPT');
        this.datatables.push(table);
    }

    private initializeGPTMultiModalMessagePartURLVO() {

        let fields = [
            new ModuleTableField(field_names<GPTMultiModalMessagePartURLVO>().url, ModuleTableField.FIELD_TYPE_string, 'URL', true),
        ];

        let table = new ModuleTable(this, GPTMultiModalMessagePartURLVO.API_TYPE_ID, () => new GPTMultiModalMessagePartURLVO(), fields, null, 'URL GPT');
        this.datatables.push(table);
    }

    private initializeGPTMultiModalConversationVO() {

        let fields = [
            new ModuleTableField(field_names<GPTMultiModalConversationVO>().messages, ModuleTableField.FIELD_TYPE_plain_vo_obj, 'Messages', false)
        ];

        let table = new ModuleTable(this, GPTMultiModalConversationVO.API_TYPE_ID, () => new GPTMultiModalConversationVO(), fields, null, 'Conversation multimodal GPT');
        this.datatables.push(table);
    }

    private initializeGPTMessageVO() {

        let user_id = new ModuleTableField(field_names<GPTMessageVO>().user_id, ModuleTableField.FIELD_TYPE_foreign_key, 'User', false);

        let fields = [
            new ModuleTableField(field_names<GPTMessageVO>().role_type, ModuleTableField.FIELD_TYPE_enum, 'Type de rôle', true, true, GPTMessageVO.GPTMSG_ROLE_TYPE_SYSTEM).setEnumValues(GPTMessageVO.GPTMSG_ROLE_TYPE_LABELS),
            user_id,
            new ModuleTableField(field_names<GPTMessageVO>().content, ModuleTableField.FIELD_TYPE_string, 'Contenu', false),
            new ModuleTableField(field_names<GPTMessageVO>().date, ModuleTableField.FIELD_TYPE_tstz, 'Date', true),
        ];

        let table = new ModuleTable(this, GPTMessageVO.API_TYPE_ID, () => new GPTMessageVO(), fields, null, 'Message GPT');
        this.datatables.push(table);

        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
    }

    private initializeGPTConversationVO() {

        let fields = [
            new ModuleTableField(field_names<GPTConversationVO>().messages, ModuleTableField.FIELD_TYPE_plain_vo_obj, 'Messages', false)
        ];

        let table = new ModuleTable(this, GPTConversationVO.API_TYPE_ID, () => new GPTConversationVO(), fields, null, 'Conversation GPT');
        this.datatables.push(table);
    }
}
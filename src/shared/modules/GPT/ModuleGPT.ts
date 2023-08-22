import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import UserVO from '../AccessPolicy/vos/UserVO';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import GPTConversationVO from './vos/GPTConversationVO';
import GPTMessageVO from './vos/GPTMessageVO';


export default class ModuleGPT extends Module {

    public static MODULE_NAME: string = 'GPT';

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

    private constructor() {

        super("gpt", ModuleGPT.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.initializeGPTMessageVO();
        this.initializeGPTConversationVO();
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
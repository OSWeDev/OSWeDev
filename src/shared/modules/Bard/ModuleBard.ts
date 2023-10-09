import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import Module from '../Module';
import ModuleTableField from '../ModuleTableField';
import ModuleTable from '../ModuleTable';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import BardConfigurationVO from './vos/BardConfigurationVO';
import BardConversationVO from './vos/BardConversationVO';
import UserVO from '../AccessPolicy/vos/UserVO';
import BardMessageVO from './vos/BardMessageVO';

export default class ModuleBard extends Module {

    public static MODULE_NAME: string = 'BARD';

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleBard.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleBard.MODULE_NAME + ".BO_ACCESS";
    public static POLICY_FO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleBard.MODULE_NAME + ".FO_ACCESS";

    public static APINAME_ask: string = "bard_ask";

    public static getInstance(): ModuleBard {
        if (!ModuleBard.instance) {
            ModuleBard.instance = new ModuleBard();
        }

        return ModuleBard.instance;
    }

    private static instance: ModuleBard = null;

    private constructor() {

        super("bard", ModuleBard.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.initializeBardConfigurationVO();
        this.initializeBardMessageVO();
        this.initializeBardConversationVO();
    }

    private initializeBardConfigurationVO() {

        let user_id = new ModuleTableField(
            field_names<BardConfigurationVO>().user_id,
            ModuleTableField.FIELD_TYPE_foreign_key,
            'User',
            false
        );

        let fields = [
            user_id,
            new ModuleTableField(field_names<BardConfigurationVO>().cookies, ModuleTableField.FIELD_TYPE_string, 'Cookies', false),
            new ModuleTableField(field_names<BardConfigurationVO>().date, ModuleTableField.FIELD_TYPE_tstz, 'Date', true),
        ];

        let table = new ModuleTable(this, BardConfigurationVO.API_TYPE_ID, () => new BardConfigurationVO(), fields, null, 'BARD configurations');

        this.datatables.push(table);

        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
    }

    private initializeBardMessageVO() {

        let user_id = new ModuleTableField(field_names<BardMessageVO>().user_id, ModuleTableField.FIELD_TYPE_foreign_key, 'User', false);

        let fields = [
            new ModuleTableField(
                field_names<BardMessageVO>().role_type,
                ModuleTableField.FIELD_TYPE_enum,
                'Type de rôle',
                true,
                true,
                BardMessageVO.BARD_MSG_ROLE_TYPE_SYSTEM
            ).setEnumValues(BardMessageVO.BARD_MSG_ROLE_TYPE_LABELS),
            user_id,
            new ModuleTableField(field_names<BardMessageVO>().content, ModuleTableField.FIELD_TYPE_string, 'Contenu', false),
            new ModuleTableField(field_names<BardMessageVO>().date, ModuleTableField.FIELD_TYPE_tstz, 'Date', true),
        ];

        let table = new ModuleTable(this, BardMessageVO.API_TYPE_ID, () => new BardMessageVO(), fields, null, 'Message BARD');
        this.datatables.push(table);

        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
    }

    private initializeBardConversationVO() {

        let fields = [
            new ModuleTableField(field_names<BardConversationVO>().messages, ModuleTableField.FIELD_TYPE_plain_vo_obj, 'Messages', false)
        ];

        let table = new ModuleTable(this, BardConversationVO.API_TYPE_ID, () => new BardConversationVO(), fields, null, 'Conversation BARD');
        this.datatables.push(table);
    }
}
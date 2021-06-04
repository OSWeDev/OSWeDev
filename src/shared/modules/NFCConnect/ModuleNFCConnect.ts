import AccessPolicyTools from '../../tools/AccessPolicyTools';
import UserLogVO from '../AccessPolicy/vos/UserLogVO';
import UserVO from '../AccessPolicy/vos/UserVO';
import APIControllerWrapper from '../API/APIControllerWrapper';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VOsTypesManager';
import NFCTagUserVO from './vos/NFCTagUserVO';
import NFCTagVO from './vos/NFCTagVO';

export default class ModuleNFCConnect extends Module {

    public static MODULE_NAME: string = 'NFCConnect';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleNFCConnect.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleNFCConnect.MODULE_NAME + '.BO_ACCESS';
    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleNFCConnect.MODULE_NAME + '.FO_ACCESS';

    public static APINAME_connect = "connect";

    public static getInstance(): ModuleNFCConnect {
        if (!ModuleNFCConnect.instance) {
            ModuleNFCConnect.instance = new ModuleNFCConnect();
        }
        return ModuleNFCConnect.instance;
    }

    private static instance: ModuleNFCConnect = null;

    public connect: (serial_number: string) => Promise<void> = APIControllerWrapper.sah(ModuleNFCConnect.APINAME_connect);

    private constructor() {
        super("nfcconnect", ModuleNFCConnect.MODULE_NAME);
    }

    public registerApis() {

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<StringParamVO, void>(
            null,
            ModuleNFCConnect.APINAME_connect,
            [UserLogVO.API_TYPE_ID],
            StringParamVOStatic
        ));
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        let label = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Numéro de série', true);
        let datatable_fields = [
            label,
            new ModuleTableField('activated', ModuleTableField.FIELD_TYPE_boolean, 'Actif', true, true, true),
        ];
        let datatable = new ModuleTable(this, NFCTagVO.API_TYPE_ID, () => new NFCTagVO(), datatable_fields, label, "NFC Tags");
        this.datatables.push(datatable);

        let nfc_tag_id = new ModuleTableField('nfc_tag_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Utilisateur', true);
        let user_id = new ModuleTableField('user_id', ModuleTableField.FIELD_TYPE_foreign_key, 'NFC Tag', true);
        let datatable_fields_line = [
            nfc_tag_id,
            user_id
        ];
        let datatable_user = new ModuleTable(this, NFCTagUserVO.API_TYPE_ID, () => new NFCTagUserVO(), datatable_fields_line, null, "NFC Tag User");
        user_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);
        nfc_tag_id.addManyToOneRelation(datatable);
        this.datatables.push(datatable_user);
    }
}
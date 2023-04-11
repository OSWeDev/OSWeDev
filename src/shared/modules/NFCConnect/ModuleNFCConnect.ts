import AccessPolicyTools from '../../tools/AccessPolicyTools';
import UserLogVO from '../AccessPolicy/vos/UserLogVO';
import UserVO from '../AccessPolicy/vos/UserVO';
import APIControllerWrapper from '../API/APIControllerWrapper';
import String2ParamVO, { String2ParamVOStatic } from '../API/vos/apis/String2ParamVO';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import APIDAOParamVO, { APIDAOParamVOStatic } from '../DAO/vos/APIDAOParamVO';
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
    public static APINAME_connect_and_redirect = "nfco";
    public static APINAME_checktag_user = "checktag_user";
    public static APINAME_add_tag = "add_tag";
    public static APINAME_remove_user_tag = "remove_user_tag";
    public static APINAME_get_own_tags = "get_own_tags";

    public static getInstance(): ModuleNFCConnect {
        if (!ModuleNFCConnect.instance) {
            ModuleNFCConnect.instance = new ModuleNFCConnect();
        }
        return ModuleNFCConnect.instance;
    }

    private static instance: ModuleNFCConnect = null;

    public connect: (serial_number: string) => Promise<boolean> = APIControllerWrapper.sah(ModuleNFCConnect.APINAME_connect);
    public connect_and_redirect: (serial_number: string) => Promise<boolean> = APIControllerWrapper.sah(ModuleNFCConnect.APINAME_connect_and_redirect);
    public checktag_user: (serial_number: string, user_id: number) => Promise<boolean> = APIControllerWrapper.sah(ModuleNFCConnect.APINAME_checktag_user);
    public add_tag: (serial_number: string) => Promise<boolean> = APIControllerWrapper.sah(ModuleNFCConnect.APINAME_add_tag);
    public remove_user_tag: (serial_number: string) => Promise<boolean> = APIControllerWrapper.sah(ModuleNFCConnect.APINAME_remove_user_tag);
    public get_own_tags: () => Promise<NFCTagVO[]> = APIControllerWrapper.sah(ModuleNFCConnect.APINAME_get_own_tags);

    private constructor() {
        super("nfcconnect", ModuleNFCConnect.MODULE_NAME);
    }

    public registerApis() {

        APIControllerWrapper.registerApi(new GetAPIDefinition<StringParamVO, boolean>(
            null,
            ModuleNFCConnect.APINAME_connect,
            [NFCTagVO.API_TYPE_ID, NFCTagUserVO.API_TYPE_ID],
            StringParamVOStatic
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<StringParamVO, boolean>(
            null,
            ModuleNFCConnect.APINAME_connect_and_redirect,
            [NFCTagVO.API_TYPE_ID, NFCTagUserVO.API_TYPE_ID],
            StringParamVOStatic
        ));


        APIControllerWrapper.registerApi(new PostAPIDefinition<APIDAOParamVO, boolean>(
            null,
            ModuleNFCConnect.APINAME_checktag_user,
            [],
            APIDAOParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<StringParamVO, boolean>(
            null,
            ModuleNFCConnect.APINAME_add_tag,
            [NFCTagVO.API_TYPE_ID, NFCTagUserVO.API_TYPE_ID],
            StringParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<StringParamVO, boolean>(
            null,
            ModuleNFCConnect.APINAME_remove_user_tag,
            [NFCTagVO.API_TYPE_ID, NFCTagUserVO.API_TYPE_ID],
            StringParamVOStatic
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<void, NFCTagVO[]>(
            null,
            ModuleNFCConnect.APINAME_get_own_tags,
            [NFCTagVO.API_TYPE_ID, NFCTagUserVO.API_TYPE_ID]
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

        let nfc_tag_id = new ModuleTableField('nfc_tag_id', ModuleTableField.FIELD_TYPE_foreign_key, 'NFC Tag', true);
        let user_id = new ModuleTableField('user_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Utilisateur', true);
        let datatable_fields_line = [
            nfc_tag_id,
            user_id
        ];
        let datatable_user = new ModuleTable(this, NFCTagUserVO.API_TYPE_ID, () => new NFCTagUserVO(), datatable_fields_line, null, "NFC Tag User");
        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
        nfc_tag_id.addManyToOneRelation(datatable);
        this.datatables.push(datatable_user);
    }
}
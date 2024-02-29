import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import UserVO from '../AccessPolicy/vos/UserVO';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import APIDAOParamVO, { APIDAOParamVOStatic } from '../DAO/vos/APIDAOParamVO';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import Module from '../Module';
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

    // istanbul ignore next: nothing to test
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

        /**
         * Cas particulier d'une API GET qui réalise une action et devrait être un POST, mais qui est utilisé par les tags NFC.
         */
        APIControllerWrapper.registerApi(new GetAPIDefinition<StringParamVO, boolean>(
            null,
            ModuleNFCConnect.APINAME_connect,
            [NFCTagVO.API_TYPE_ID, NFCTagUserVO.API_TYPE_ID],
            StringParamVOStatic
        ));

        /**
         * Cas particulier d'une API GET qui réalise une action et devrait être un POST, mais qui est utilisé par les tags NFC.
         */
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

        const label = ModuleTableFieldController.create_new(NFCTagVO.API_TYPE_ID, field_names<NFCTagVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Numéro de série', true);
        const datatable_fields = [
            label,
            ModuleTableFieldController.create_new(NFCTagVO.API_TYPE_ID, field_names<NFCTagVO>().activated, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Actif', true, true, true),
        ];
        const datatable = ModuleTableController.create_new(this.name, NFCTagVO, label, "NFC Tags");

        const nfc_tag_id = ModuleTableFieldController.create_new(NFCTagUserVO.API_TYPE_ID, field_names<NFCTagUserVO>().nfc_tag_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'NFC Tag', true);
        const user_id = ModuleTableFieldController.create_new(NFCTagUserVO.API_TYPE_ID, field_names<NFCTagUserVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', true);
        const datatable_fields_line = [
            nfc_tag_id,
            user_id
        ];
        const datatable_user = ModuleTableController.create_new(this.name, NFCTagUserVO, null, "NFC Tag User");
        user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
        nfc_tag_id.set_many_to_one_target_moduletable_name(datatable.vo_type);
    }
}
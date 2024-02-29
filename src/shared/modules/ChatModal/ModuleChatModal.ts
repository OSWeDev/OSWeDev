import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import UserVO from '../AccessPolicy/vos/UserVO';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import FileVO from '../File/vos/FileVO';
import ImageVO from '../Image/vos/ImageVO';
import Module from '../Module';
import VersionedVOController from '../Versioned/VersionedVOController';
import ChatModalMessageFileVO from './vos/ChatModalMessageFileVO';
import ChatModalMessageImageVO from './vos/ChatModalMessageImageVO';
import ChatModalMessageReplyOptionVO from './vos/ChatModalMessageReplyOptionVO';
import ChatModalMessageVO from './vos/ChatModalMessageVO';
import ChatModalThreadUserVO from './vos/ChatModalThreadUserVO';
import ChatModalThreadVO from './vos/ChatModalThreadVO';
import ChatModalUserVO from './vos/ChatModalUserVO';

export default class ChatModal extends Module {

    public static MODULE_NAME: string = "ChatModal";

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ChatModal.MODULE_NAME;

    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ChatModal.MODULE_NAME + ".POLICY_FO_ACCESS";

    // istanbul ignore next: nothing to test
    public static getInstance(): ChatModal {
        if (!ChatModal.instance) {
            ChatModal.instance = new ChatModal();
        }
        return ChatModal.instance;
    }

    private static instance: ChatModal = null;

    private constructor() {

        super("chatmodal", ChatModal.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize(): void {
        this.initializeChatModalMessageFileVO();
        this.initializeChatModalMessageImageVO();
        this.initializeChatModalMessageReplyOptionVO();
        this.initializeChatModalMessageVO();
        this.initializeChatModalThreadVO();
        this.initializeChatModalThreadUserVO();
        this.initializeChatModalUserVO();
    }

    private initializeChatModalMessageFileVO() {
        const file_id = ModuleTableFieldController.create_new(ChatModalMessageFileVO.API_TYPE_ID, field_names<ChatModalMessageFileVO>().file_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, "Fichier", false);
        const message_id = ModuleTableFieldController.create_new(ChatModalMessageFileVO.API_TYPE_ID, field_names<ChatModalMessageFileVO>().message_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, "Message", true);

        const fields = [
            file_id,
            message_id,

            ModuleTableFieldController.create_new(ChatModalMessageFileVO.API_TYPE_ID, field_names<ChatModalMessageFileVO>().file_url, ModuleTableFieldVO.FIELD_TYPE_string, "URL du fichier"),
        ];

        const datatable = ModuleTableController.create_new(this.name, ChatModalMessageFileVO, null, "Fichiers attachés aux messages");

        file_id.set_many_to_one_target_moduletable_name(FileVO.API_TYPE_ID);
        message_id.set_many_to_one_target_moduletable_name(ChatModalMessageVO.API_TYPE_ID);
    }

    private initializeChatModalMessageImageVO() {
        const image_id = ModuleTableFieldController.create_new(ChatModalMessageImageVO.API_TYPE_ID, field_names<ChatModalMessageImageVO>().image_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, "Image", false);
        const message_id = ModuleTableFieldController.create_new(ChatModalMessageImageVO.API_TYPE_ID, field_names<ChatModalMessageImageVO>().message_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, "Message", true);

        const fields = [
            image_id,
            message_id,

            ModuleTableFieldController.create_new(ChatModalMessageImageVO.API_TYPE_ID, field_names<ChatModalMessageImageVO>().image_url, ModuleTableFieldVO.FIELD_TYPE_string, "URL de l'image"),
        ];

        const datatable = ModuleTableController.create_new(this.name, ChatModalMessageImageVO, null, "Images attachées aux messages");

        image_id.set_many_to_one_target_moduletable_name(FileVO.API_TYPE_ID);
        message_id.set_many_to_one_target_moduletable_name(ChatModalMessageVO.API_TYPE_ID);
    }

    private initializeChatModalMessageReplyOptionVO() {
        const message_id = ModuleTableFieldController.create_new(ChatModalMessageReplyOptionVO.API_TYPE_ID, field_names<ChatModalMessageReplyOptionVO>().message_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, "Message", true);

        const fields = [
            message_id,

            ModuleTableFieldController.create_new(ChatModalMessageReplyOptionVO.API_TYPE_ID, field_names<ChatModalMessageReplyOptionVO>().callback_api_name, ModuleTableFieldVO.FIELD_TYPE_string, "Nom de l'API de callback"),
            ModuleTableFieldController.create_new(ChatModalMessageReplyOptionVO.API_TYPE_ID, field_names<ChatModalMessageReplyOptionVO>().callback_module_name, ModuleTableFieldVO.FIELD_TYPE_string, "Nom du module de callback"),
            ModuleTableFieldController.create_new(ChatModalMessageReplyOptionVO.API_TYPE_ID, field_names<ChatModalMessageReplyOptionVO>().params, ModuleTableFieldVO.FIELD_TYPE_string, "Paramètres du callback"),
            ModuleTableFieldController.create_new(ChatModalMessageReplyOptionVO.API_TYPE_ID, field_names<ChatModalMessageReplyOptionVO>().translatable_code_text, ModuleTableFieldVO.FIELD_TYPE_translatable_text, "Texte de l'option de réponse"),
        ];

        const datatable = ModuleTableController.create_new(this.name, ChatModalMessageReplyOptionVO, null, "Options de réponse aux messages");

        message_id.set_many_to_one_target_moduletable_name(ChatModalMessageVO.API_TYPE_ID);
    }

    private initializeChatModalMessageVO() {
        const thread_id = ModuleTableFieldController.create_new(ChatModalMessageVO.API_TYPE_ID, field_names<ChatModalMessageVO>().thread_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, "Thread", true);
        const user_id = ModuleTableFieldController.create_new(ChatModalMessageVO.API_TYPE_ID, field_names<ChatModalMessageVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, "Utilisateur", true);

        const fields = [
            thread_id,
            user_id,

            ModuleTableFieldController.create_new(ChatModalMessageVO.API_TYPE_ID, field_names<ChatModalMessageVO>().content, ModuleTableFieldVO.FIELD_TYPE_html, "Contenu du message"),
            ModuleTableFieldController.create_new(ChatModalMessageVO.API_TYPE_ID, field_names<ChatModalMessageVO>().creation_date_sec, ModuleTableFieldVO.FIELD_TYPE_tstz, "Date de création du message"),
        ];

        const datatable = ModuleTableController.create_new(this.name, ChatModalMessageVO, null, "Lien compte Azure");

        thread_id.set_many_to_one_target_moduletable_name(ChatModalThreadVO.API_TYPE_ID);
        user_id.set_many_to_one_target_moduletable_name(ChatModalUserVO.API_TYPE_ID);
    }

    private initializeChatModalThreadVO() {

        const fields = [
            ModuleTableFieldController.create_new(ChatModalThreadVO.API_TYPE_ID, field_names<ChatModalThreadVO>().title, ModuleTableFieldVO.FIELD_TYPE_string, "Titre du thread"),
        ];

        const datatable = ModuleTableController.create_new(this.name, ChatModalThreadVO, null, "Threads");
        VersionedVOController.getInstance().registerModuleTable(datatable);
    }

    private initializeChatModalThreadUserVO() {
        const user_id = ModuleTableFieldController.create_new(ChatModalThreadUserVO.API_TYPE_ID, field_names<ChatModalThreadUserVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, "Utilisateur", true);
        const thread_id = ModuleTableFieldController.create_new(ChatModalThreadUserVO.API_TYPE_ID, field_names<ChatModalThreadUserVO>().thread_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, "Message", true);

        const fields = [
            user_id,
            thread_id,
        ];

        const datatable = ModuleTableController.create_new(this.name, ChatModalThreadUserVO, null, "Utilisateurs du thread");

        user_id.set_many_to_one_target_moduletable_name(ChatModalUserVO.API_TYPE_ID);
        thread_id.set_many_to_one_target_moduletable_name(ChatModalThreadVO.API_TYPE_ID);
    }

    private initializeChatModalUserVO() {
        const avatar_id = ModuleTableFieldController.create_new(ChatModalUserVO.API_TYPE_ID, field_names<ChatModalUserVO>().avatar_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, "Avatar", false);
        const user_id = ModuleTableFieldController.create_new(ChatModalUserVO.API_TYPE_ID, field_names<ChatModalUserVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, "Utilisateur", true);

        const fields = [
            avatar_id,
            user_id,

            ModuleTableFieldController.create_new(ChatModalUserVO.API_TYPE_ID, field_names<ChatModalUserVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, "Nom de l'utilisateur"),
        ];

        const datatable = ModuleTableController.create_new(this.name, ChatModalUserVO, null, "Utilisateurs du chat");

        avatar_id.set_many_to_one_target_moduletable_name(ImageVO.API_TYPE_ID);
        user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
    }
}
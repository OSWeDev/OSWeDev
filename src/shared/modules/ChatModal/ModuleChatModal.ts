import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import UserVO from '../AccessPolicy/vos/UserVO';
import FileVO from '../File/vos/FileVO';
import ImageVO from '../Image/vos/ImageVO';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
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
        let file_id = new ModuleTableField(field_names<ChatModalMessageFileVO>().file_id, ModuleTableField.FIELD_TYPE_foreign_key, "Fichier", false);
        let message_id = new ModuleTableField(field_names<ChatModalMessageFileVO>().message_id, ModuleTableField.FIELD_TYPE_foreign_key, "Message", true);

        let fields = [
            file_id,
            message_id,

            new ModuleTableField(field_names<ChatModalMessageFileVO>().file_url, ModuleTableField.FIELD_TYPE_string, "URL du fichier"),
        ];

        let datatable = new ModuleTable(this, ChatModalMessageFileVO.API_TYPE_ID, () => new ChatModalMessageFileVO(), fields, null, "Fichiers attachés aux messages");

        file_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[FileVO.API_TYPE_ID]);
        message_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[ChatModalMessageVO.API_TYPE_ID]);

        this.datatables.push(datatable);
    }

    private initializeChatModalMessageImageVO() {
        let image_id = new ModuleTableField(field_names<ChatModalMessageImageVO>().image_id, ModuleTableField.FIELD_TYPE_foreign_key, "Image", false);
        let message_id = new ModuleTableField(field_names<ChatModalMessageImageVO>().message_id, ModuleTableField.FIELD_TYPE_foreign_key, "Message", true);

        let fields = [
            image_id,
            message_id,

            new ModuleTableField(field_names<ChatModalMessageImageVO>().image_url, ModuleTableField.FIELD_TYPE_string, "URL de l'image"),
        ];

        let datatable = new ModuleTable(this, ChatModalMessageImageVO.API_TYPE_ID, () => new ChatModalMessageImageVO(), fields, null, "Images attachées aux messages");

        image_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[FileVO.API_TYPE_ID]);
        message_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[ChatModalMessageVO.API_TYPE_ID]);

        this.datatables.push(datatable);
    }

    private initializeChatModalMessageReplyOptionVO() {
        let message_id = new ModuleTableField(field_names<ChatModalMessageReplyOptionVO>().message_id, ModuleTableField.FIELD_TYPE_foreign_key, "Message", true);

        let fields = [
            message_id,

            new ModuleTableField(field_names<ChatModalMessageReplyOptionVO>().callback_api_name, ModuleTableField.FIELD_TYPE_string, "Nom de l'API de callback"),
            new ModuleTableField(field_names<ChatModalMessageReplyOptionVO>().callback_module_name, ModuleTableField.FIELD_TYPE_string, "Nom du module de callback"),
            new ModuleTableField(field_names<ChatModalMessageReplyOptionVO>().params, ModuleTableField.FIELD_TYPE_string, "Paramètres du callback"),
            new ModuleTableField(field_names<ChatModalMessageReplyOptionVO>().translatable_code_text, ModuleTableField.FIELD_TYPE_translatable_text, "Texte de l'option de réponse"),
        ];

        let datatable = new ModuleTable(this, ChatModalMessageReplyOptionVO.API_TYPE_ID, () => new ChatModalMessageReplyOptionVO(), fields, null, "Options de réponse aux messages");

        message_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[ChatModalMessageVO.API_TYPE_ID]);

        this.datatables.push(datatable);
    }

    private initializeChatModalMessageVO() {
        let thread_id = new ModuleTableField(field_names<ChatModalMessageVO>().thread_id, ModuleTableField.FIELD_TYPE_foreign_key, "Thread", true);
        let user_id = new ModuleTableField(field_names<ChatModalMessageVO>().user_id, ModuleTableField.FIELD_TYPE_foreign_key, "Utilisateur", true);

        let fields = [
            thread_id,
            user_id,

            new ModuleTableField(field_names<ChatModalMessageVO>().content, ModuleTableField.FIELD_TYPE_html, "Contenu du message"),
            new ModuleTableField(field_names<ChatModalMessageVO>().creation_date_sec, ModuleTableField.FIELD_TYPE_tstz, "Date de création du message"),
        ];

        let datatable = new ModuleTable(this, ChatModalMessageVO.API_TYPE_ID, () => new ChatModalMessageVO(), fields, null, "Lien compte Azure");

        thread_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[ChatModalThreadVO.API_TYPE_ID]);
        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[ChatModalUserVO.API_TYPE_ID]);

        this.datatables.push(datatable);
    }

    private initializeChatModalThreadVO() {

        let fields = [
            new ModuleTableField(field_names<ChatModalThreadVO>().title, ModuleTableField.FIELD_TYPE_string, "Titre du thread"),
        ];

        let datatable = new ModuleTable(this, ChatModalThreadVO.API_TYPE_ID, () => new ChatModalThreadVO(), fields, null, "Threads");

        this.datatables.push(datatable);
        VersionedVOController.getInstance().registerModuleTable(datatable);
    }

    private initializeChatModalThreadUserVO() {
        let user_id = new ModuleTableField(field_names<ChatModalThreadUserVO>().user_id, ModuleTableField.FIELD_TYPE_foreign_key, "Utilisateur", true);
        let thread_id = new ModuleTableField(field_names<ChatModalThreadUserVO>().thread_id, ModuleTableField.FIELD_TYPE_foreign_key, "Message", true);

        let fields = [
            user_id,
            thread_id,
        ];

        let datatable = new ModuleTable(this, ChatModalThreadUserVO.API_TYPE_ID, () => new ChatModalThreadUserVO(), fields, null, "Utilisateurs du thread");

        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[ChatModalUserVO.API_TYPE_ID]);
        thread_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[ChatModalThreadVO.API_TYPE_ID]);

        this.datatables.push(datatable);
    }

    private initializeChatModalUserVO() {
        let avatar_id = new ModuleTableField(field_names<ChatModalUserVO>().avatar_id, ModuleTableField.FIELD_TYPE_foreign_key, "Avatar", false);
        let user_id = new ModuleTableField(field_names<ChatModalUserVO>().user_id, ModuleTableField.FIELD_TYPE_foreign_key, "Utilisateur", true);

        let fields = [
            avatar_id,
            user_id,

            new ModuleTableField(field_names<ChatModalUserVO>().name, ModuleTableField.FIELD_TYPE_string, "Nom de l'utilisateur"),
        ];

        let datatable = new ModuleTable(this, ChatModalUserVO.API_TYPE_ID, () => new ChatModalUserVO(), fields, null, "Utilisateurs du chat");

        avatar_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[ImageVO.API_TYPE_ID]);
        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);

        this.datatables.push(datatable);
    }
}
import { field_names, reflect } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import StringParamVO from '../API/vos/apis/StringParamVO';
import UserVO from '../AccessPolicy/vos/UserVO';
import APISimpleVOParamVO, { APISimpleVOParamVOStatic } from '../DAO/vos/APISimpleVOParamVO';
import IDistantVOBase from '../IDistantVOBase';
import Module from '../Module';
import ModuleTableVO from '../DAO/vos/ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import APINotifTypeResultVO from './vos/APINotifTypeResultVO';
import NotificationVO from './vos/NotificationVO';
import ModuleTableController from '../DAO/ModuleTableController';

export default class ModulePushData extends Module {

    public static PARAM_TECH_DISCONNECT_URL: string = 'TECH_DISCONNECT_URL';

    private static instance: ModulePushData = null;

    public set_prompt_result: (
        notification: NotificationVO
    ) => Promise<any> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModulePushData>().set_prompt_result);

    public get_app_version: () => Promise<string> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModulePushData>().get_app_version);

    public join_io_room: (room_fields: string[]) => Promise<void> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModulePushData>().join_io_room);
    public leave_io_room: (room_fields: string[]) => Promise<void> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModulePushData>().leave_io_room);

    private constructor() {

        super("pushdata", "PushData");
        this.forceActivationOnInstallation();
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModulePushData {
        if (!ModulePushData.instance) {
            ModulePushData.instance = new ModulePushData();
        }
        return ModulePushData.instance;
    }

    public registerApis() {

        APIControllerWrapper.registerApi(PostAPIDefinition.new<APISimpleVOParamVO, any>(
            null,
            this.name,
            reflect<ModulePushData>().set_prompt_result,
            [NotificationVO.API_TYPE_ID],
            APISimpleVOParamVOStatic
        ));

        APIControllerWrapper.registerApi(PostAPIDefinition.new<void, string>(
            null,
            this.name,
            reflect<ModulePushData>().get_app_version,
            []
        ));

        APIControllerWrapper.registerApi(PostAPIDefinition.new<string[], void>(
            null,
            this.name,
            reflect<ModulePushData>().join_io_room,
            []
        ));
        APIControllerWrapper.registerApi(PostAPIDefinition.new<string[], void>(
            null,
            this.name,
            reflect<ModulePushData>().leave_io_room,
            []
        ));
    }

    public initialize() {

        this.init_NotificationVO();
        this.init_APIResultVO();
    }

    private init_NotificationVO() {
        const user_id = ModuleTableFieldController.create_new(NotificationVO.API_TYPE_ID, field_names<NotificationVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'User', true, false);
        const datatable_fields = [
            ModuleTableFieldController.create_new(NotificationVO.API_TYPE_ID, field_names<NotificationVO>().notification_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type', true, true, NotificationVO.TYPE_NOTIF_SIMPLE).setEnumValues(NotificationVO.TYPE_NAMES),
            user_id,
            ModuleTableFieldController.create_new(NotificationVO.API_TYPE_ID, field_names<NotificationVO>().simple_notif_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Msg Type').setEnumValues({
                [NotificationVO.SIMPLE_SUCCESS]: NotificationVO.SIMPLE_NAMES[NotificationVO.SIMPLE_SUCCESS],
                [NotificationVO.SIMPLE_INFO]: NotificationVO.SIMPLE_NAMES[NotificationVO.SIMPLE_INFO],
                [NotificationVO.SIMPLE_WARN]: NotificationVO.SIMPLE_NAMES[NotificationVO.SIMPLE_WARN],
                [NotificationVO.SIMPLE_ERROR]: NotificationVO.SIMPLE_NAMES[NotificationVO.SIMPLE_ERROR]
            }),
            ModuleTableFieldController.create_new(NotificationVO.API_TYPE_ID, field_names<NotificationVO>().simple_notif_label, ModuleTableFieldVO.FIELD_TYPE_translatable_text, 'Msg Translatable').set_translatable_params_field_name(field_names<NotificationVO>().simple_notif_json_params),
            ModuleTableFieldController.create_new(NotificationVO.API_TYPE_ID, field_names<NotificationVO>().simple_notif_json_params, ModuleTableFieldVO.FIELD_TYPE_string, 'Params JSON', false, true, null),
            ModuleTableFieldController.create_new(NotificationVO.API_TYPE_ID, field_names<NotificationVO>().simple_downloadable_link, ModuleTableFieldVO.FIELD_TYPE_string, 'Lien téléchargeable', false, true, null),
            ModuleTableFieldController.create_new(NotificationVO.API_TYPE_ID, field_names<NotificationVO>().auto_read_if_connected, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Lecture auto si connecté', false),

            ModuleTableFieldController.create_new(NotificationVO.API_TYPE_ID, field_names<NotificationVO>().dao_notif_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Dao Type').setEnumValues({
                [NotificationVO.DAO_GET_VO_BY_ID]: NotificationVO.DAO_NAMES[NotificationVO.DAO_GET_VO_BY_ID],
                [NotificationVO.DAO_GET_VOS]: NotificationVO.DAO_NAMES[NotificationVO.DAO_GET_VOS]
            }),
            ModuleTableFieldController.create_new(NotificationVO.API_TYPE_ID, field_names<NotificationVO>().prompt_uid, ModuleTableFieldVO.FIELD_TYPE_int, 'Prompt UID'),
            ModuleTableFieldController.create_new(NotificationVO.API_TYPE_ID, field_names<NotificationVO>().prompt_result, ModuleTableFieldVO.FIELD_TYPE_string, 'Prompt Result'),
            ModuleTableFieldController.create_new(NotificationVO.API_TYPE_ID, field_names<NotificationVO>().client_tab_id, ModuleTableFieldVO.FIELD_TYPE_string, 'ID Tab Client'),
            ModuleTableFieldController.create_new(NotificationVO.API_TYPE_ID, field_names<NotificationVO>().api_type_id, ModuleTableFieldVO.FIELD_TYPE_string, 'API Type ID'),
            ModuleTableFieldController.create_new(NotificationVO.API_TYPE_ID, field_names<NotificationVO>().dao_notif_vo_id, ModuleTableFieldVO.FIELD_TYPE_int, 'Dao Vo Id'),
            ModuleTableFieldController.create_new(NotificationVO.API_TYPE_ID, field_names<NotificationVO>().read, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Lu', false),
            ModuleTableFieldController.create_new(NotificationVO.API_TYPE_ID, field_names<NotificationVO>().creation_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de création', true),
            ModuleTableFieldController.create_new(NotificationVO.API_TYPE_ID, field_names<NotificationVO>().read_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de lecture', false),
            ModuleTableFieldController.create_new(NotificationVO.API_TYPE_ID, field_names<NotificationVO>().vos, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'vos', false),
            ModuleTableFieldController.create_new(NotificationVO.API_TYPE_ID, field_names<NotificationVO>().notif_route, ModuleTableFieldVO.FIELD_TYPE_string, 'Route pour redirection', false),
            ModuleTableFieldController.create_new(NotificationVO.API_TYPE_ID, field_names<NotificationVO>().notif_route_params_name, ModuleTableFieldVO.FIELD_TYPE_string_array, 'Paramètres d\'URL', false),
            ModuleTableFieldController.create_new(NotificationVO.API_TYPE_ID, field_names<NotificationVO>().notif_route_params_values, ModuleTableFieldVO.FIELD_TYPE_string_array, 'Valeurs des paramètres d\'URL', false),
            ModuleTableFieldController.create_new(NotificationVO.API_TYPE_ID, field_names<NotificationVO>().event_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom d\'événement ', false),
            ModuleTableFieldController.create_new(NotificationVO.API_TYPE_ID, field_names<NotificationVO>().event_param_json, ModuleTableFieldVO.FIELD_TYPE_string, 'Paramètres d\'événement', false, true, null),
            ModuleTableFieldController.create_new(NotificationVO.API_TYPE_ID, field_names<NotificationVO>().room_id, ModuleTableFieldVO.FIELD_TYPE_string, 'Room ID', false),
            ModuleTableFieldController.create_new(NotificationVO.API_TYPE_ID, field_names<NotificationVO>().redirect_uri, ModuleTableFieldVO.FIELD_TYPE_string, 'URI de redirection', false),
        ];
        const datatable = ModuleTableController.create_new(this.name, NotificationVO, null, "Notifications");
        user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
    }

    private init_APIResultVO() {
        const datatable_fields = [
            ModuleTableFieldController.create_new(APINotifTypeResultVO.API_TYPE_ID, field_names<APINotifTypeResultVO>().api_call_id, ModuleTableFieldVO.FIELD_TYPE_int, 'api_call_id', true),
            ModuleTableFieldController.create_new(APINotifTypeResultVO.API_TYPE_ID, field_names<APINotifTypeResultVO>().res, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'res', false)
        ];
        const datatable = ModuleTableController.create_new(this.name, APINotifTypeResultVO, null, "APIRes");
    }
}
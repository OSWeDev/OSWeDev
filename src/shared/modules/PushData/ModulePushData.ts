import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import StringParamVO from '../API/vos/apis/StringParamVO';
import UserVO from '../AccessPolicy/vos/UserVO';
import APISimpleVOParamVO, { APISimpleVOParamVOStatic } from '../DAO/vos/APISimpleVOParamVO';
import IDistantVOBase from '../IDistantVOBase';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import APINotifTypeResultVO from './vos/APINotifTypeResultVO';
import NotificationVO from './vos/NotificationVO';

export default class ModulePushData extends Module {

    public static APINAME_set_prompt_result: string = 'set_prompt_result';
    public static APINAME_get_app_version: string = 'get_app_version';
    public static APINAME_join_io_room: string = 'join_io_room';
    public static APINAME_leave_io_room: string = 'leave_io_room';
    public static PARAM_TECH_DISCONNECT_URL: string = 'TECH_DISCONNECT_URL';

    // istanbul ignore next: nothing to test
    public static getInstance(): ModulePushData {
        if (!ModulePushData.instance) {
            ModulePushData.instance = new ModulePushData();
        }
        return ModulePushData.instance;
    }

    private static instance: ModulePushData = null;

    public set_prompt_result: (
        notification: NotificationVO
    ) => Promise<any> = APIControllerWrapper.sah(ModulePushData.APINAME_set_prompt_result);

    public get_app_version: () => Promise<string> = APIControllerWrapper.sah(ModulePushData.APINAME_get_app_version);

    public join_io_room: (room_fields: string[]) => Promise<void> = APIControllerWrapper.sah(ModulePushData.APINAME_join_io_room);
    public leave_io_room: (room_fields: string[]) => Promise<void> = APIControllerWrapper.sah(ModulePushData.APINAME_leave_io_room);

    private constructor() {

        super("pushdata", "PushData");
        this.forceActivationOnInstallation();
    }

    public registerApis() {

        APIControllerWrapper.registerApi(new PostAPIDefinition<APISimpleVOParamVO, any>(
            null,
            ModulePushData.APINAME_set_prompt_result,
            [NotificationVO.API_TYPE_ID],
            APISimpleVOParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<void, string>(
            null,
            ModulePushData.APINAME_get_app_version,
            []
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<string[], void>(
            null,
            ModulePushData.APINAME_join_io_room,
            []
        ));
        APIControllerWrapper.registerApi(new PostAPIDefinition<string[], void>(
            null,
            ModulePushData.APINAME_leave_io_room,
            []
        ));
    }

    public initialize() {

        this.init_NotificationVO();
        this.init_APIResultVO();
    }

    private init_NotificationVO() {
        let user_id = new ModuleTableField(field_names<NotificationVO>().user_id, ModuleTableField.FIELD_TYPE_foreign_key, 'User', true, false);
        let datatable_fields = [
            new ModuleTableField(field_names<NotificationVO>().notification_type, ModuleTableField.FIELD_TYPE_enum, 'Type', true, true, NotificationVO.TYPE_NOTIF_SIMPLE).setEnumValues(NotificationVO.TYPE_NAMES),
            user_id,
            new ModuleTableField(field_names<NotificationVO>().simple_notif_type, ModuleTableField.FIELD_TYPE_enum, 'Msg Type').setEnumValues({
                [NotificationVO.SIMPLE_SUCCESS]: NotificationVO.SIMPLE_NAMES[NotificationVO.SIMPLE_SUCCESS],
                [NotificationVO.SIMPLE_INFO]: NotificationVO.SIMPLE_NAMES[NotificationVO.SIMPLE_INFO],
                [NotificationVO.SIMPLE_WARN]: NotificationVO.SIMPLE_NAMES[NotificationVO.SIMPLE_WARN],
                [NotificationVO.SIMPLE_ERROR]: NotificationVO.SIMPLE_NAMES[NotificationVO.SIMPLE_ERROR]
            }),
            new ModuleTableField(field_names<NotificationVO>().simple_notif_label, ModuleTableField.FIELD_TYPE_translatable_text, 'Msg Translatable').set_translatable_params_field_name(field_names<NotificationVO>().simple_notif_json_params),
            new ModuleTableField(field_names<NotificationVO>().simple_notif_json_params, ModuleTableField.FIELD_TYPE_string, 'Params JSON', false, true, null),
            new ModuleTableField(field_names<NotificationVO>().simple_downloadable_link, ModuleTableField.FIELD_TYPE_string, 'Lien téléchargeable', false, true, null),
            new ModuleTableField(field_names<NotificationVO>().auto_read_if_connected, ModuleTableField.FIELD_TYPE_boolean, 'Lecture auto si connecté', false),

            new ModuleTableField(field_names<NotificationVO>().dao_notif_type, ModuleTableField.FIELD_TYPE_enum, 'Dao Type').setEnumValues({
                [NotificationVO.DAO_GET_VO_BY_ID]: NotificationVO.DAO_NAMES[NotificationVO.DAO_GET_VO_BY_ID],
                [NotificationVO.DAO_GET_VOS]: NotificationVO.DAO_NAMES[NotificationVO.DAO_GET_VOS]
            }),
            new ModuleTableField(field_names<NotificationVO>().prompt_uid, ModuleTableField.FIELD_TYPE_int, 'Prompt UID'),
            new ModuleTableField(field_names<NotificationVO>().prompt_result, ModuleTableField.FIELD_TYPE_string, 'Prompt Result'),
            new ModuleTableField(field_names<NotificationVO>().client_tab_id, ModuleTableField.FIELD_TYPE_string, 'ID Tab Client'),
            new ModuleTableField(field_names<NotificationVO>().api_type_id, ModuleTableField.FIELD_TYPE_string, 'API Type ID'),
            new ModuleTableField(field_names<NotificationVO>().dao_notif_vo_id, ModuleTableField.FIELD_TYPE_int, 'Dao Vo Id'),
            new ModuleTableField(field_names<NotificationVO>().read, ModuleTableField.FIELD_TYPE_boolean, 'Lu', false),
            new ModuleTableField(field_names<NotificationVO>().creation_date, ModuleTableField.FIELD_TYPE_tstz, 'Date de création', true),
            new ModuleTableField(field_names<NotificationVO>().read_date, ModuleTableField.FIELD_TYPE_tstz, 'Date de lecture', false),
            new ModuleTableField(field_names<NotificationVO>().vos, ModuleTableField.FIELD_TYPE_string, 'vos', false),
            new ModuleTableField(field_names<NotificationVO>().notif_route, ModuleTableField.FIELD_TYPE_string, 'Route pour redirection', false),
            new ModuleTableField(field_names<NotificationVO>().notif_route_params_name, ModuleTableField.FIELD_TYPE_string_array, 'Paramètres d\'URL', false),
            new ModuleTableField(field_names<NotificationVO>().notif_route_params_values, ModuleTableField.FIELD_TYPE_string_array, 'Valeurs des paramètres d\'URL', false),

            new ModuleTableField(field_names<NotificationVO>().room_id, ModuleTableField.FIELD_TYPE_string, 'Room ID', false),
        ];
        let datatable = new ModuleTable(this, NotificationVO.API_TYPE_ID, () => new NotificationVO(), datatable_fields, null, "Notifications");
        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }

    private init_APIResultVO() {
        let datatable_fields = [
            new ModuleTableField(field_names<APINotifTypeResultVO>().api_call_id, ModuleTableField.FIELD_TYPE_int, 'api_call_id', true),
            new ModuleTableField(field_names<APINotifTypeResultVO>().res, ModuleTableField.FIELD_TYPE_plain_vo_obj, 'res', false)
        ];
        let datatable = new ModuleTable(this, APINotifTypeResultVO.API_TYPE_ID, () => new APINotifTypeResultVO(), datatable_fields, null, "APIRes");
        this.datatables.push(datatable);
    }
}
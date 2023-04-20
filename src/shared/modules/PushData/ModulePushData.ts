import UserVO from '../AccessPolicy/vos/UserVO';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import { VOsTypesManager } from '../VO/manager/VOsTypesManager';
import NotificationVO from './vos/NotificationVO';
import APISimpleVOParamVO from '../DAO/vos/APISimpleVOParamVO';
import { APISimpleVOParamVOStatic } from '../DAO/vos/APISimpleVOParamVO';

export default class ModulePushData extends Module {

    public static APINAME_set_prompt_result: string = 'set_prompt_result';
    public static APINAME_get_app_version: string = 'get_app_version';
    public static PARAM_TECH_DISCONNECT_URL: string = 'TECH_DISCONNECT_URL';

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
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        let user_id: ModuleTableField<number> = new ModuleTableField<number>('user_id', ModuleTableField.FIELD_TYPE_foreign_key, 'User', true, false);
        let datatable_fields = [
            new ModuleTableField('notification_type', ModuleTableField.FIELD_TYPE_enum, 'Type', true, true, NotificationVO.TYPE_NOTIF_SIMPLE).setEnumValues(NotificationVO.TYPE_NAMES),
            user_id,
            new ModuleTableField('simple_notif_type', ModuleTableField.FIELD_TYPE_enum, 'Msg Type').setEnumValues({
                [NotificationVO.SIMPLE_SUCCESS]: NotificationVO.SIMPLE_NAMES[NotificationVO.SIMPLE_SUCCESS],
                [NotificationVO.SIMPLE_INFO]: NotificationVO.SIMPLE_NAMES[NotificationVO.SIMPLE_INFO],
                [NotificationVO.SIMPLE_WARN]: NotificationVO.SIMPLE_NAMES[NotificationVO.SIMPLE_WARN],
                [NotificationVO.SIMPLE_ERROR]: NotificationVO.SIMPLE_NAMES[NotificationVO.SIMPLE_ERROR]
            }),
            new ModuleTableField('simple_notif_label', ModuleTableField.FIELD_TYPE_translatable_text, 'Msg Translatable'),
            new ModuleTableField('simple_notif_json_params', ModuleTableField.FIELD_TYPE_string, 'Params JSON', false, true, null),
            new ModuleTableField('simple_downloadable_link', ModuleTableField.FIELD_TYPE_string, 'Lien téléchargeable', false, true, null),

            new ModuleTableField('dao_notif_type', ModuleTableField.FIELD_TYPE_enum, 'Dao Type').setEnumValues({
                [NotificationVO.DAO_GET_VO_BY_ID]: NotificationVO.DAO_NAMES[NotificationVO.DAO_GET_VO_BY_ID],
                [NotificationVO.DAO_GET_VOS]: NotificationVO.DAO_NAMES[NotificationVO.DAO_GET_VOS]
            }),
            new ModuleTableField('prompt_uid', ModuleTableField.FIELD_TYPE_int, 'Prompt UID'),
            new ModuleTableField('prompt_result', ModuleTableField.FIELD_TYPE_string, 'Prompt Result'),
            new ModuleTableField('client_tab_id', ModuleTableField.FIELD_TYPE_string, 'ID Tab Client'),
            new ModuleTableField('api_type_id', ModuleTableField.FIELD_TYPE_string, 'API Type ID'),
            new ModuleTableField('dao_notif_vo_id', ModuleTableField.FIELD_TYPE_int, 'Dao Vo Id'),
            new ModuleTableField('read', ModuleTableField.FIELD_TYPE_boolean, 'Lu', false),
            new ModuleTableField('creation_date', ModuleTableField.FIELD_TYPE_tstz, 'Date de création', true),
            new ModuleTableField('read_date', ModuleTableField.FIELD_TYPE_tstz, 'Date de lecture', false),
            new ModuleTableField('vos', ModuleTableField.FIELD_TYPE_string, 'vos', false),
            new ModuleTableField('notif_route', ModuleTableField.FIELD_TYPE_string, 'Route pour redirection', false),
            new ModuleTableField('notif_route_params_name', ModuleTableField.FIELD_TYPE_string_array, 'Paramètres d\'URL', false),
            new ModuleTableField('notif_route_params_values', ModuleTableField.FIELD_TYPE_string_array, 'Valeurs des paramètres d\'URL', false),
        ];
        let datatable = new ModuleTable(this, NotificationVO.API_TYPE_ID, () => new NotificationVO(), datatable_fields, null, "Notifications");
        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }
}
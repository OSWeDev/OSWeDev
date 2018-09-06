import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import NotificationVO from './vos/NotificationVO';
import VOsTypesManager from '../VOsTypesManager';
import UserVO from '../AccessPolicy/vos/UserVO';

export default class ModulePushData extends Module {

    public static getInstance(): ModulePushData {
        if (!ModulePushData.instance) {
            ModulePushData.instance = new ModulePushData();
        }
        return ModulePushData.instance;
    }

    private static instance: ModulePushData = null;

    private constructor() {

        super("pushdata", "PushData");
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        let user_id: ModuleTableField<number> = new ModuleTableField<number>('user_id', ModuleTableField.FIELD_TYPE_foreign_key, 'User', true, false);
        let datatable_fields = [
            new ModuleTableField('notification_type', ModuleTableField.FIELD_TYPE_enum, 'Type', true, true, NotificationVO.TYPE_NOTIF_SIMPLE).setEnumValues({
                [NotificationVO.TYPE_NOTIF_SIMPLE]: NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_SIMPLE],
                [NotificationVO.TYPE_NOTIF_DAO]: NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_DAO],
                [NotificationVO.TYPE_NOTIF_HOOK]: NotificationVO.TYPE_NAMES[NotificationVO.TYPE_NOTIF_HOOK]
            }),
            user_id,
            new ModuleTableField('simple_notif_type', ModuleTableField.FIELD_TYPE_enum, 'Msg Type').setEnumValues({
                [NotificationVO.SIMPLE_SUCCESS]: NotificationVO.SIMPLE_NAMES[NotificationVO.SIMPLE_SUCCESS],
                [NotificationVO.SIMPLE_INFO]: NotificationVO.SIMPLE_NAMES[NotificationVO.SIMPLE_INFO],
                [NotificationVO.SIMPLE_WARN]: NotificationVO.SIMPLE_NAMES[NotificationVO.SIMPLE_WARN],
                [NotificationVO.SIMPLE_ERROR]: NotificationVO.SIMPLE_NAMES[NotificationVO.SIMPLE_ERROR]
            }),
            new ModuleTableField('simple_notif_label', ModuleTableField.FIELD_TYPE_string, 'Msg Translatable'),
            new ModuleTableField('dao_notif_type', ModuleTableField.FIELD_TYPE_enum, 'Dao Type').setEnumValues({
                [NotificationVO.DAO_GET_VO_BY_ID]: NotificationVO.DAO_NAMES[NotificationVO.DAO_GET_VO_BY_ID],
                [NotificationVO.DAO_GET_VOS]: NotificationVO.DAO_NAMES[NotificationVO.DAO_GET_VOS]
            }),
            new ModuleTableField('api_type_id', ModuleTableField.FIELD_TYPE_string, 'API Type ID'),
            new ModuleTableField('dao_notif_vo_id', ModuleTableField.FIELD_TYPE_int, 'Dao Vo Id'),
            new ModuleTableField('read', ModuleTableField.FIELD_TYPE_boolean, 'Lu', false),
        ];
        let datatable = new ModuleTable(this, NotificationVO.API_TYPE_ID, datatable_fields, null, "Notifications");
        user_id.addManyToOneRelation(datatable, VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }
}
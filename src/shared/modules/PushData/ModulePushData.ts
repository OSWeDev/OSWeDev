import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import NotificationVO from './vos/NotificationVO';

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
                [NotificationVO.TYPE_NOTIF_SIMPLE]: 'notification.TYPE_NOTIF_SIMPLE',
                [NotificationVO.TYPE_NOTIF_DAO]: 'notification.TYPE_NOTIF_DAO',
                [NotificationVO.TYPE_NOTIF_HOOK]: 'notification.TYPE_NOTIF_HOOK'
            }),
            user_id,
            new ModuleTableField('simple_notif_type', ModuleTableField.FIELD_TYPE_enum, 'Msg Type', false, true, NotificationVO.SIMPLE_INFO).setEnumValues({
                [NotificationVO.SIMPLE_SUCCESS]: 'notification.SIMPLE_SUCCESS',
                [NotificationVO.SIMPLE_INFO]: 'notification.SIMPLE_INFO',
                [NotificationVO.SIMPLE_WARN]: 'notification.SIMPLE_WARN',
                [NotificationVO.SIMPLE_ERROR]: 'notification.SIMPLE_ERROR'
            }),
            new ModuleTableField('simple_notif_label', ModuleTableField.FIELD_TYPE_string, 'Msg Translatable', false),
            new ModuleTableField('api_type_id', ModuleTableField.FIELD_TYPE_string, 'API Type ID', false),
            new ModuleTableField('read', ModuleTableField.FIELD_TYPE_boolean, 'Lu', false),
        ];

        let datatable = new ModuleTable(this, NotificationVO.API_TYPE_ID, datatable_fields, "Notifications");
        this.datatables.push(datatable);
    }
}
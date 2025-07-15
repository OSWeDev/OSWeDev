import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import ModulePushData from '../../../../shared/modules/PushData/ModulePushData';
import { StatThisMapKeys } from '../../../../shared/modules/Stats/annotations/StatThisMapKeys';
import ObjectHandler from '../../../../shared/tools/ObjectHandler';
import VOEventRegistrationKey from "./VOEventRegistrationKey";

export default class VOEventRegistrationsHandler {

    protected static VO_EVENTS_CB_ID: number = 0;

    @StatThisMapKeys('VOEventRegistrationsHandler', null, 1)
    public static registered_vo_create_callbacks: { [room_id: string]: { [cb_id: string]: (created_vo: IDistantVOBase) => void } } = {};
    @StatThisMapKeys('VOEventRegistrationsHandler', null, 1)
    public static registered_vo_update_callbacks: { [room_id: string]: { [cb_id: string]: (pre_update_vo: IDistantVOBase, post_update_vo: IDistantVOBase) => void } } = {};
    @StatThisMapKeys('VOEventRegistrationsHandler', null, 1)
    public static registered_vo_delete_callbacks: { [room_id: string]: { [cb_id: string]: (deleted_vo: IDistantVOBase) => void } } = {};

    public static async register_vo_create_callback(
        room_vo: any,
        room_id: string,
        cb: (created_vo: IDistantVOBase) => void): Promise<VOEventRegistrationKey> {

        const room_fields: string[] = [];
        for (const i in room_vo) {
            room_fields.push(i);
            room_fields.push(JSON.stringify(room_vo[i]));
        }

        if (!VOEventRegistrationsHandler.registered_vo_create_callbacks[room_id]) {
            VOEventRegistrationsHandler.registered_vo_create_callbacks[room_id] = {};
            await ModulePushData.getInstance().join_io_room(room_fields);
        }

        const cb_id: number = VOEventRegistrationsHandler.VO_EVENTS_CB_ID++;

        // Attention : contrôle secondaire pour des cas de concurrence entre un register et un unregister sur le même room_id... je suis pas sûr que ce soit normal en soit..
        if (!VOEventRegistrationsHandler.registered_vo_create_callbacks[room_id]) {
            VOEventRegistrationsHandler.registered_vo_create_callbacks[room_id] = {};
        }
        VOEventRegistrationsHandler.registered_vo_create_callbacks[room_id][cb_id] = cb;

        return new VOEventRegistrationKey(VOEventRegistrationKey.EVENT_TYPE_CREATION, room_vo, room_fields, room_id, cb_id);
    }

    public static async unregister_vo_event_callback(registration_key: VOEventRegistrationKey) {

        let map_instance = null;

        switch (registration_key.event_type) {
            case VOEventRegistrationKey.EVENT_TYPE_CREATION:
                map_instance = VOEventRegistrationsHandler.registered_vo_create_callbacks;
                break;
            case VOEventRegistrationKey.EVENT_TYPE_UPDATE:
                map_instance = VOEventRegistrationsHandler.registered_vo_update_callbacks;
                break;
            case VOEventRegistrationKey.EVENT_TYPE_DELETION:
                map_instance = VOEventRegistrationsHandler.registered_vo_delete_callbacks;
                break;
        }

        if (!map_instance[registration_key.room_id]) {
            return;
        }

        delete map_instance[registration_key.room_id][registration_key.cb_id];

        if (!ObjectHandler.hasAtLeastOneAttribute(map_instance[registration_key.room_id])) {
            delete map_instance[registration_key.room_id];
            await ModulePushData.getInstance().leave_io_room(registration_key.room_fields);
        }
    }

    public static async register_vo_update_callback(
        room_vo: any,
        room_id: string,
        cb: (pre_update_vo: IDistantVOBase, post_update_vo: IDistantVOBase) => void): Promise<VOEventRegistrationKey> {

        const room_fields: string[] = [];
        for (const i in room_vo) {
            room_fields.push(i);
            room_fields.push(JSON.stringify(room_vo[i]));
        }

        if (!VOEventRegistrationsHandler.registered_vo_update_callbacks[room_id]) {
            VOEventRegistrationsHandler.registered_vo_update_callbacks[room_id] = {};
            await ModulePushData.getInstance().join_io_room(room_fields);
        }

        const cb_id: number = VOEventRegistrationsHandler.VO_EVENTS_CB_ID++;

        // Attention : contrôle secondaire pour des cas de concurrence entre un register et un unregister sur le même room_id... je suis pas sûr que ce soit normal en soit..
        if (!VOEventRegistrationsHandler.registered_vo_update_callbacks[room_id]) {
            VOEventRegistrationsHandler.registered_vo_update_callbacks[room_id] = {};
        }

        VOEventRegistrationsHandler.registered_vo_update_callbacks[room_id][cb_id] = cb;

        return new VOEventRegistrationKey(VOEventRegistrationKey.EVENT_TYPE_UPDATE, room_vo, room_fields, room_id, cb_id);
    }

    public static async register_vo_delete_callback(
        room_vo: any,
        room_id: string,
        cb: (deleted_vo: IDistantVOBase) => void): Promise<VOEventRegistrationKey> {

        const room_fields: string[] = [];
        for (const i in room_vo) {
            room_fields.push(i);
            room_fields.push(JSON.stringify(room_vo[i]));
        }

        if (!VOEventRegistrationsHandler.registered_vo_delete_callbacks[room_id]) {
            VOEventRegistrationsHandler.registered_vo_delete_callbacks[room_id] = {};
            await ModulePushData.getInstance().join_io_room(room_fields);
        }

        const cb_id: number = VOEventRegistrationsHandler.VO_EVENTS_CB_ID++;

        // Attention : contrôle secondaire pour des cas de concurrence entre un register et un unregister sur le même room_id... je suis pas sûr que ce soit normal en soit..
        if (!VOEventRegistrationsHandler.registered_vo_delete_callbacks[room_id]) {
            VOEventRegistrationsHandler.registered_vo_delete_callbacks[room_id] = {};
        }

        VOEventRegistrationsHandler.registered_vo_delete_callbacks[room_id][cb_id] = cb;

        return new VOEventRegistrationKey(VOEventRegistrationKey.EVENT_TYPE_DELETION, room_vo, room_fields, room_id, cb_id);
    }
}
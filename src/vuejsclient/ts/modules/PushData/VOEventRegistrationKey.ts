
export default class VOEventRegistrationKey {

    public static EVENT_TYPE_CREATION: number = 0;
    public static EVENT_TYPE_UPDATE: number = 1;
    public static EVENT_TYPE_DELETION: number = 2;

    public constructor(
        public event_type: number,
        public room_vo: any,
        public room_fields: string[],
        public room_id: string,
        public cb_id: number) { }
}
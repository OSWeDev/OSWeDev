import Dates from "../../FormatDatesNombres/Dates/Dates";


export default class Alert {

    public static TYPE_ERROR: number = 75;
    public static TYPE_WARN: number = 50;
    public static TYPE_INFO: number = 25;
    public static TYPE_DEBUG: number = 0;

    public pinned: boolean = false;

    public constructor(
        public path: string,
        public translatable_code: string,
        public type: number = Alert.TYPE_INFO,
        public translation_params: any = null,
        public creation_date: number = Dates.now()
    ) { }

    public pin(): Alert {
        this.pinned = true;

        return this;
    }
}
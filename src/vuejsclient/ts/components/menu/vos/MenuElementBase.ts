import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';

export default class MenuElementBase {

    public static PRIORITY_ULTRALOW: number = 50;
    public static PRIORITY_LOW: number = 40;
    public static PRIORITY_MEDIUM: number = 30;
    public static PRIORITY_HIGH: number = 20;
    public static PRIORITY_ULTRAHIGH: number = 10;

    public static TYPE_BRANCH: string = "BRANCH";
    public static TYPE_LEAF: string = "LEAF";

    public type: string;

    public constructor(
        public UID: string,
        public priority: number,
        public fa_class: string) {
    }

    get translatable_title(): string {
        return "menu.menuelements." + this.UID + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }
}
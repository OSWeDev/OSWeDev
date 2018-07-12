import TriggerHook from '../../../../shared/modules/Trigger/TriggerHook';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';

export default class DAOTriggerHook extends TriggerHook<string, IDistantVOBase, boolean>{

    // Les triggers read sont très spécifiques à mettre en place, il faut pouvoir passer des vos[], ... bref pour le moment pas besoin on verra
    // public static DAO_PRE_READ_TRIGGER: string = "DAO_PRE_READ_TRIGGER";
    public static DAO_PRE_UPDATE_TRIGGER: string = "DAO_PRE_UPDATE_TRIGGER";
    public static DAO_PRE_CREATE_TRIGGER: string = "DAO_PRE_CREATE_TRIGGER";
    public static DAO_PRE_DELETE_TRIGGER: string = "DAO_PRE_DELETE_TRIGGER";

    // public static DAO_POST_READ_TRIGGER: string = "DAO_POST_READ_TRIGGER";
    public static DAO_POST_UPDATE_TRIGGER: string = "DAO_POST_UPDATE_TRIGGER";
    public static DAO_POST_CREATE_TRIGGER: string = "DAO_POST_CREATE_TRIGGER";
    public static DAO_POST_DELETE_TRIGGER: string = "DAO_POST_DELETE_TRIGGER";

    constructor(public trigger_type_UID: string) {
        super(trigger_type_UID);
    }

    public getConditionUID_from_Conditions(API_TYPE_ID: string): string {
        return API_TYPE_ID;
    }
} 
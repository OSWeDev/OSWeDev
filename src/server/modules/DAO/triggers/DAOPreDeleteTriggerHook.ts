import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import TriggerHook from '../../../../shared/modules/Trigger/TriggerHook';

export default class DAOPreDeleteTriggerHook extends TriggerHook<string, IDistantVOBase, boolean> {

    public static DAO_PRE_DELETE_TRIGGER: string = "DAO_PRE_DELETE_TRIGGER";

    constructor(public trigger_type_UID: string) {
        super(trigger_type_UID);
    }

    public getConditionUID_from_Conditions(API_TYPE_ID: string): string {
        return API_TYPE_ID;
    }
}
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import TriggerHook from '../../Trigger/TriggerHook';

export default class DAOPostCreateTriggerHook extends TriggerHook<string, IDistantVOBase, void> {

    public static DAO_POST_CREATE_TRIGGER: string = "DAO_POST_CREATE_TRIGGER";

    constructor(public trigger_type_UID: string) {
        super(trigger_type_UID);
    }

    public getConditionUID_from_Conditions(API_TYPE_ID: string): string {
        return API_TYPE_ID;
    }
}
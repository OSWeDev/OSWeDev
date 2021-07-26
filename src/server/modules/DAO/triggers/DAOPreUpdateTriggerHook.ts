import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import TriggerHook from '../../../../shared/modules/Trigger/TriggerHook';
import DAOUpdateVOHolder from '../vos/DAOUpdateVOHolder';

export default class DAOPreUpdateTriggerHook extends TriggerHook<string, DAOUpdateVOHolder<IDistantVOBase>, boolean> {

    public static DAO_PRE_UPDATE_TRIGGER: string = "DAO_PRE_UPDATE_TRIGGER";

    constructor(public trigger_type_UID: string) {
        super(trigger_type_UID);
    }

    public getConditionUID_from_Conditions(API_TYPE_ID: string): string {
        return API_TYPE_ID;
    }
}
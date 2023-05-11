import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import TriggerHook from '../../Trigger/TriggerHook';
import DAOUpdateVOHolder from '../vos/DAOUpdateVOHolder';

export default class DAOPostUpdateTriggerHook extends TriggerHook<string, DAOUpdateVOHolder<IDistantVOBase>, void> {

    public static DAO_POST_UPDATE_TRIGGER: string = "DAO_POST_UPDATE_TRIGGER";

    constructor(public trigger_type_UID: string) {
        super(trigger_type_UID);
    }

    public getConditionUID_from_Conditions(API_TYPE_ID: string): string {
        return API_TYPE_ID;
    }
}
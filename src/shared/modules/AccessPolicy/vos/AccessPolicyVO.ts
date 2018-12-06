import IDistantVOBase from '../../IDistantVOBase';
import IWeightedItem from '../../../tools/interfaces/IWeightedItem';

export default class AccessPolicyVO implements IDistantVOBase, IWeightedItem {

    public static API_TYPE_ID: string = "accpol";

    public static DEFAULT_BEHAVIOUR_LABELS: string[] = ['accpol.default_behaviour.access_denied_to_all_but_admin', 'accpol.default_behaviour.access_denied_to_anonymous', 'accpol.default_behaviour.access_granted_to_anyone'];
    public static DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN: number = 0;
    public static DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ANONYMOUS: number = 1;
    public static DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE: number = 2;

    public id: number;
    public _type: string = AccessPolicyVO.API_TYPE_ID;

    public translatable_name: string;
    public group_id: number;
    public default_behaviour: number;
    public weight: number;
}
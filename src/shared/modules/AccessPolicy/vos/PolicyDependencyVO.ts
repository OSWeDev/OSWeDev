import IDistantVOBase from '../../IDistantVOBase';

export default class PolicyDependencyVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "poldep";

    public static DEFAULT_BEHAVIOUR_LABELS: string[] = ['poldep.default_behaviour.access_denied', 'accpol.default_behaviour.access_granted'];
    public static DEFAULT_BEHAVIOUR_ACCESS_DENIED: number = 0;
    public static DEFAULT_BEHAVIOUR_ACCESS_GRANTED: number = 1;

    public id: number;
    public _type: string = PolicyDependencyVO.API_TYPE_ID;

    public src_pol_id: number;
    public depends_on_pol_id: number;
    public default_behaviour: number;
}
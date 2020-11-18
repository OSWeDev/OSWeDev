import IDistantVOBase from '../../IDistantVOBase';

export default class VarCacheConfVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "var_cache_conf";

    public id: number;
    public _type: string = VarCacheConfVO.API_TYPE_ID;

    public var_id: number;

    /**
     * 0 => infini
     *  FIXME TODO REFONTE dans quel cas on utiliserait ce truc ? Une var utilise des datasources, et donc si on configure
     *      correctement, on devrait pouvoir invalider par les datasources, et pas par un délai
     */
    public cache_timeout_ms: number;

    public cache_seuil_a: number;
    public cache_seuil_b: number;
    public cache_seuil_c: number;
    public calculation_cost_for_1000_card: number;
}
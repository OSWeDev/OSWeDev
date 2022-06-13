import IDistantVOBase from '../../IDistantVOBase';

export default class VarCacheConfVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "var_cache_conf";

    public static VALUE_CACHE_STRATEGY_LABELS: string[] = ['var_cache_conf.cache_strategy.estimated_time', 'var_cache_conf.cache_strategy.cardinal', 'var_cache_conf.cache_strategy.pixel'];
    public static VALUE_CACHE_STRATEGY_ESTIMATED_TIME: number = 0;
    public static VALUE_CACHE_STRATEGY_CARDINAL: number = 1;
    public static VALUE_CACHE_STRATEGY_PIXEL: number = 2;

    public id: number;
    public _type: string = VarCacheConfVO.API_TYPE_ID;

    public var_id: number;

    /**
     * 0 => infini
     *  FIXME TODO REFONTE dans quel cas on utiliserait ce truc ? Une var utilise des datasources, et donc si on configure
     *      correctement, on devrait pouvoir invalider par les datasources, et pas par un délai
     */
    public cache_timeout_secs: number;

    public cache_startegy: number;
    public cache_bdd_only_requested_params: boolean;

    public cache_seuil_a: number;
    public cache_seuil_b: number;
    public cache_seuil_c: number;
    public cache_seuil_c_element: number;
    public cache_seuil_bdd: number;
    public calculation_cost_for_1000_card: number;
}
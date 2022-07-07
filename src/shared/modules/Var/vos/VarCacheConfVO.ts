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

    /**
     * Est-ce qu'on utilise la fonction de last-reads pour partial clean du cache, ou on ignore complètement cette logique, ce qui permet de
     *  réduire fortement les updates en bdd, mais incite à avoir un cache infini, dont le nettoyage est en plus beaucoup plus compliqué puisqu'on
     *  a pas de trace d'usage de la donnée pour prendre une décision.
     */
    public use_cache_read_ms_to_partial_clean: boolean;

    public cache_startegy: number;

    /**
     * Define if we limit cache to registered params from users
     */
    public cache_bdd_only_requested_params: boolean;

    public cache_seuil_a: number;
    public cache_seuil_b: number;
    public cache_seuil_c: number;
    public cache_seuil_c_element: number;
    public cache_seuil_bdd: number;

    public estimated_create_tree_1k_card: number;
    public estimated_load_nodes_datas_1k_card: number;
    public estimated_compute_node_1k_card: number;
}
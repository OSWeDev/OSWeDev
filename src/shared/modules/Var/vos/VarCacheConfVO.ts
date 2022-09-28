import IDistantVOBase from '../../IDistantVOBase';

export default class VarCacheConfVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "var_cache_conf";

    public static VALUE_CACHE_STRATEGY_LABELS: string[] = ['var_cache_conf.cache_strategy.cache_all_never_load_chunks', 'var_cache_conf.cache_strategy.cache_none', 'var_cache_conf.cache_strategy.pixel'];

    /**
     * Attention on remplace la stratégie sur temps passé par une stratégie simple, qui utilise le paramètre cache_bdd_only_requested_params pour savoir
     *  si on limite la mise en cache aux vars registered.
     * Stratégie simple : on sauvegarde tout, mais on ne tentera jamais de se baser sur un calcul partiel
     */
    public static VALUE_CACHE_STRATEGY_CACHE_ALL_NEVER_LOAD_CHUNKS: number = 0;

    /**
     * Attention on remplace la stratégie basée sur le cardinal de la var par une stratégie qui ne met rien en cache et ne charge donc rien du cache
     *  on a fait un patch pour migrer les confs initialement réalisées sur la stratégie cardinal en VALUE_CACHE_STRATEGY_CACHE_ALL_NEVER_LOAD_CHUNKS
     * Stratégie simple : on sauvegarde rien donc on ne charge rien non plus
     */
    public static VALUE_CACHE_STRATEGY_CACHE_NONE: number = 1;

    /**
     * Stratégie forcée dans le cas d'une var pixellisée : équivalent à une stratégie CACHE_ALL_NEVER_LOAD_CHUNKS mais on chargera les chunks dans la gestion des pixels
     */
    public static VALUE_CACHE_STRATEGY_PIXEL: number = 2;

    public id: number;
    public _type: string = VarCacheConfVO.API_TYPE_ID;

    public var_id: number;

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

    public estimated_ctree_ddeps_try_load_cache_complet_1k_card: number;
    public estimated_ctree_ddeps_load_imports_and_split_nodes_1k_card: number;
    public estimated_ctree_ddeps_try_load_cache_partiel_1k_card: number;
    public estimated_ctree_ddeps_get_node_deps_1k_card: number;
    public estimated_ctree_ddeps_handle_pixellisation_1k_card: number;

    public estimated_load_node_datas_1k_card: number;
    public estimated_compute_node_1k_card: number;
}
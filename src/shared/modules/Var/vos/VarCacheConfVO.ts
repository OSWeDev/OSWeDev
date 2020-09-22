import IDistantVOBase from '../../IDistantVOBase';

export default class VarCacheConfVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "var_cache_conf";

    public id: number;
    public _type: string = VarCacheConfVO.API_TYPE_ID;

    public var_id: number;

    /**
     * FIXME TODO REFONTE : est-ce que ça a du sens une fois qu'on défini le cache comme étant global et
     *  initié par le lecteur (donc avec un vrai besoin a priori) et pas en amont ? (à voir d'allieurs si on
     *  supprime toute logique en amont, c'est quand même pas mal pertinent sur le papier... Peut-être via une navigation
     *  artificielle ?)
     *  Tendance à penser par défaut que c'est plus utile, donc à supprimer si ça se confirme (22/09/2020)
     */
    // public consider_null_as_0_and_auto_clean_0_in_cache: boolean;

    /**
     * 0 => infini
     *  FIXME TODO REFONTE dans quel cas on utiliserait ce truc ? Une var utilise des datasources, et donc si on configure
     *      correctement, on devrait pouvoir invalider par les datasources, et pas par un délai
     */
    public cache_timeout_ms: number;
}
import Throttle from "../../annotations/Throttle";
import EventifyEventListenerConfVO from "../../modules/Eventify/vos/EventifyEventListenerConfVO";
import Dates from "../../modules/FormatDatesNombres/Dates/Dates";
import { StatThisMapKeys } from "../../modules/Stats/annotations/StatThisMapKeys";

/**
 * On veut un cache par type de requete + index de la requete (par exemple UserVO + id du user ciblé)
 * qui gère la date de dernière mise à jour. on demande la data au cache avec un age max de la donnée, et si besoin du coup on rechagre la donnée en exécutant la requête
 * ce système peut être mis en place par défaut pour toutes les requêtres simples en set_mage_age qui n'ont qu'un seul filtrage sur l'id de l'objet par exemple, et sans field, sans sort, ...
 * Attention la query est donc en exec_as_server a priori sinon c'est louche
 */
export default class CachedQueryHandler {

    @StatThisMapKeys('CachedQueryHandler', null, 1)
    private static cache: { [query_type_UID: string]: { [this_query_INDEX: string]: { last_update_ms: number, age_max_ms: number, data: any } } } = {};

    /**
     * Si on a une requete simple, sans filtrage de fields, avec un seul filtre sur l'id, en exec_as_server, pas de using, sans sort/limit/..., on peut utiliser le cache directement
     * @param query_type select_vo, ou select_vos, ...
     * @param base_api_type_id
     * @returns
     */
    public static get_basic_select_vo_query_type_UID(base_api_type_id: string): string {
        return 'BASIC__SELECTVO__' + base_api_type_id;
    }

    public static async get<T>(query_type_UID: string, this_query_INDEX: string, age_max_ms: number, expired_query_cb: () => Promise<T>): Promise<T> {

        CachedQueryHandler.clean_cache();

        if (!CachedQueryHandler.cache[query_type_UID]) {
            CachedQueryHandler.cache[query_type_UID] = {};
        }

        const cache = CachedQueryHandler.cache[query_type_UID][this_query_INDEX];

        if (cache) {
            cache.age_max_ms = Math.max(cache.age_max_ms, age_max_ms);
        }

        if ((!cache) || ((cache.last_update_ms + cache.age_max_ms) < Dates.now_ms())) {
            const res = await expired_query_cb();

            if (!CachedQueryHandler.cache[query_type_UID]) {
                CachedQueryHandler.cache[query_type_UID] = {};
            }
            CachedQueryHandler.cache[query_type_UID][this_query_INDEX] = { last_update_ms: Dates.now_ms(), data: res, age_max_ms: age_max_ms };
            return res;
        }

        return cache.data;
    }

    /**
     * Système de nettoyage du cache qui checke les timeouts - toutes les minutes
     */
    @Throttle({
        param_type: EventifyEventListenerConfVO.PARAM_TYPE_NONE,
        throttle_ms: 60000,
        leading: false,
    })
    private static clean_cache() {

        for (const query_type_UID in CachedQueryHandler.cache) {
            const query_type_UID_cache: { [this_query_INDEX: string]: { last_update_ms: number, age_max_ms: number, data: any } } = CachedQueryHandler.cache[query_type_UID];

            for (const this_query_INDEX in query_type_UID_cache) {
                const param = query_type_UID_cache[this_query_INDEX];

                if ((param.last_update_ms + param.age_max_ms) < Dates.now_ms()) {
                    delete query_type_UID_cache[this_query_INDEX];
                }
            }

            if (Object.keys(query_type_UID_cache).length === 0) {
                delete CachedQueryHandler.cache[query_type_UID];
            }
        }
    }
}
import Throttle from "../../../shared/annotations/Throttle";
import DAOCacheParamVO from "../../../shared/modules/DAO/vos/DAOCacheParamVO";
import EventifyEventListenerConfVO from "../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO";
import Dates from "../../../shared/modules/FormatDatesNombres/Dates/Dates";
import { StatThisMapKeys } from "../../../shared/modules/Stats/annotations/StatThisMapKeys";

export default class DAOCacheHandler {

    /**
     * Cache local - au thread - des DAO throttled queries
     */
    @StatThisMapKeys('DAOCacheHandler')
    private static dao_cache: { [parameterized_full_query: string]: any } = {};
    @StatThisMapKeys('DAOCacheHandler')
    private static dao_cache_params: { [parameterized_full_query: string]: DAOCacheParamVO } = {};
    /**
     * --------------------------------
     */

    /**
     * A appeler avant de faire un get_cache
     * @param parameterized_full_query
     * @param max_age_ms
     * @returns
     */
    public static has_cache(parameterized_full_query: string, max_age_ms: number): boolean {

        // On lance le clean du cache à chaque fois qu'on check un cache - ya un throttle sur le clean ça limite les appels réels
        DAOCacheHandler.clean_cache();

        if (!DAOCacheHandler.dao_cache_params[parameterized_full_query]) {
            return false;
        }

        const param: DAOCacheParamVO = DAOCacheHandler.dao_cache_params[parameterized_full_query];

        if ((param.last_update_ms + max_age_ms) < Dates.now_ms()) {
            return false;
        }

        return true;
    }

    /**
     * ATTENTION : on part du principe que le has_cache a été appelé avant et a renvoyé true
     * @param parameterized_full_query
     */
    public static get_cache(parameterized_full_query: string): any {
        return DAOCacheHandler.dao_cache[parameterized_full_query];
    }

    /**
     * @param parameterized_full_query
     * @param data
     * @param max_age_ms
     */
    public static set_cache(parameterized_full_query: string, data: any, max_age_ms: number) {

        DAOCacheHandler.dao_cache[parameterized_full_query] = data;
        const max_age = Math.max(
            DAOCacheHandler.dao_cache_params[parameterized_full_query] ? DAOCacheHandler.dao_cache_params[parameterized_full_query].max_age_ms : 0,
            max_age_ms);
        DAOCacheHandler.dao_cache_params[parameterized_full_query] = new DAOCacheParamVO(Dates.now_ms(), max_age);
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

        for (const i in DAOCacheHandler.dao_cache_params) {
            const param: DAOCacheParamVO = DAOCacheHandler.dao_cache_params[i];

            if ((param.last_update_ms + param.max_age_ms) < Dates.now_ms()) {
                delete DAOCacheHandler.dao_cache_params[i];
                delete DAOCacheHandler.dao_cache[i];
            }
        }
    }
}
import Dates from "../../../shared/modules/FormatDatesNombres/Dates/Dates";
import DAOCacheParamVO from "./bgthreads/vos/DAOCacheParamVO";

export default class DAOCacheHandler {


    /**
     * A appeler avant de faire un get_cache
     * @param parameterized_full_query
     * @param max_age_ms
     * @returns
     */
    public static has_cache(parameterized_full_query: string, max_age_ms: number): boolean {

        if (!DAOCacheHandler.dao_cache_params[parameterized_full_query]) {
            return false;
        }

        let param: DAOCacheParamVO = DAOCacheHandler.dao_cache_params[parameterized_full_query];

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
        let max_age = Math.max(
            DAOCacheHandler.dao_cache_params[parameterized_full_query] ? DAOCacheHandler.dao_cache_params[parameterized_full_query].max_age_ms : 0,
            max_age_ms);
        DAOCacheHandler.dao_cache_params[parameterized_full_query] = new DAOCacheParamVO(Dates.now_ms(), max_age);
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!DAOCacheHandler.instance) {
            DAOCacheHandler.instance = new DAOCacheHandler();
        }
        return DAOCacheHandler.instance;
    }

    private static instance: DAOCacheHandler = null;

    /**
     * Cache local - au thread - des DAO throttled queries
     */
    private static dao_cache: { [parameterized_full_query: string]: any } = {};
    private static dao_cache_params: { [parameterized_full_query: string]: DAOCacheParamVO } = {};
    /**
     * --------------------------------
     */

    private cleaning_semaphore: boolean = false;

    private constructor() {
        setInterval(() => {
            if (!this.cleaning_semaphore) {
                this.clean_cache();
            }
        }, 10000);
    }

    /**
     * Système de nettoyage du cache qui checke les timeouts
     */
    private clean_cache() {

        this.cleaning_semaphore = true;
        for (let i in DAOCacheHandler.dao_cache_params) {
            let param: DAOCacheParamVO = DAOCacheHandler.dao_cache_params[i];

            if ((param.last_update_ms + param.max_age_ms) < Dates.now_ms()) {
                delete DAOCacheHandler.dao_cache_params[i];
                delete DAOCacheHandler.dao_cache[i];
            }
        }
        this.cleaning_semaphore = false;
    }
}
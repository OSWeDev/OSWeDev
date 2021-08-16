import { cloneDeep } from "lodash";
import ForkedTasksController from "../Fork/ForkedTasksController";

export default class DAOQueryCacheController {

    public static TASK_NAME_CLEAR: string = "DAOQueryCacheController.clear_cache";

    public static getInstance() {
        if (!DAOQueryCacheController.instance) {
            DAOQueryCacheController.instance = new DAOQueryCacheController();
        }
        return DAOQueryCacheController.instance;
    }

    private static instance: DAOQueryCacheController = null;

    /**
     * Local thread cache -----
     */

    /**
     * Version très simple, si on fait un update on vide TOUT le cache et si c'est un select on check à l'identique dans le cache
     *  Les versions plus compliquées sont possibles mais très rapidement risquées, par exemple il faut identifier toutes les deps de
     *  VOs en BDD sur un objet  (même un chemin de liaison long de plusieurs tables puisque une suppression d'un VO peut engendrer
     *  la suppression d'un autre enregistrement qui était dépendant par CASCADE)
     */
    private simple_query_cache: { [query: string]: any } = {};

    /**
     * Local thread cache -----
     */

    private constructor() {
        ForkedTasksController.getInstance().register_task(
            DAOQueryCacheController.TASK_NAME_CLEAR,
            this.clear_cache.bind(this));
    }

    /**
     * Avant l'envoie en base on tente d'utiliser le cache
     */
    public async invalidate_cache_from_query_or_return_result(query: string, values: any): Promise<any> {

        if (!query) {
            return undefined;
        }

        let trimed_lower = query.trim().toLowerCase();

        // Si c'est pas un select on vide le cache
        if (!trimed_lower.startsWith('select ')) {

            await ForkedTasksController.getInstance().broadexec(DAOQueryCacheController.TASK_NAME_CLEAR, true);
            return undefined;
        }

        if (!!values) {
            return undefined;
        }

        // if (!!this.simple_query_cache[trimed_lower]) {
        //     ConsoleHandler.getInstance().log("LOAD QUERY FROM CACHE:" + query);
        // }

        if (!this.simple_query_cache[trimed_lower]) {
            return this.simple_query_cache[trimed_lower];
        }

        return cloneDeep(this.simple_query_cache[trimed_lower]);
    }

    public clear_cache(useless: boolean) {
        // ConsoleHandler.getInstance().log("CLEAR QUERY CACHE:");
        DAOQueryCacheController.getInstance().simple_query_cache = {};
    }

    /**
     * Avant l'envoie en base on tente d'utiliser le cache
     */
    public save_cache_from_query_result(query: string, values: any, res: any) {

        if ((!query) || (!!values)) {
            return;
        }

        let trimed_lower = query.trim().toLowerCase();

        // Si c'est pas un select on ignore
        if (!trimed_lower.startsWith('select ')) {
            return;
        }

        // ConsoleHandler.getInstance().log("SAVE QUERY TO CACHE:" + query);

        this.simple_query_cache[trimed_lower] = cloneDeep(res);
    }
}
import ConsoleHandler from "../../../../../shared/tools/ConsoleHandler";
import SemaphoreHandler from "../../../../../shared/tools/SemaphoreHandler";
import ThrottleHelper from "../../../../../shared/tools/ThrottleHelper";
import ForkedTasksController from "../../../Fork/ForkedTasksController";
import VarsBGThreadNameHolder from "../../VarsBGThreadNameHolder";
import VarsTabsSubsController from "../../VarsTabsSubsController";
import VarsClientsSubsCacheHolder from "./VarsClientsSubsCacheHolder";

/**
 * On met en place un cache pour limiter des requêtes au thread principal
 *  son fonctionnement est le suivant :
 * - Le but est de connaître ASAP les nouveaux subs, pour pouvoir les traiter en priorité
 * - En revanche une suppression a peu d'importance, et on veut éviter des risques d'incohérence entre
 *      ce cache et la vraie donnée du thread principal donc on fait des rechargements complets réguliers
 * à réfléchir : On pourrait s'intéresser aussi à la date de sub, pour éviter de traiter des subs nouveaux avant les anciens.
 * Cela dit c'est aussi un risque puisqu'un sub nouveau est clairement en attente de réponse, alors qu'un ancien
 * est peut-être déjà parti / plus un sub sur le thread principal.
 */
export default class VarsClientsSubsCacheManager {

    public static TASK_NAME_throttled_add_new_subs: string = 'throttled_add_new_subs';

    public static init() {
        setInterval(VarsClientsSubsCacheManager.update_clients_subs_indexes_cache.bind(VarsClientsSubsCacheManager), 30000);
    }

    public static add_new_sub(var_index: string) {
        VarsClientsSubsCacheManager.throttle_add_new_subs([var_index]);
    }
    public static remove_sub(var_index: string) {
        VarsClientsSubsCacheManager.throttle_remove_subs([var_index]);
    }

    public static async update_clients_subs_indexes_cache(force_update: boolean = false): Promise<void> {

        await SemaphoreHandler.semaphore_async(
            'VarsClientsSubsCacheManager.update_clients_subs_indexes_cache_semaphore',
            async () => {
                try {

                    let subs_indexs = await VarsTabsSubsController.get_subs_indexs(force_update);

                    let new_cache = {};
                    for (let index of subs_indexs) {
                        new_cache[index] = true;
                    }
                    VarsClientsSubsCacheHolder.clients_subs_indexes_cache = new_cache;
                } catch (error) {
                    ConsoleHandler.error('Error in update_clients_subs_indexes_cache');
                }
            });
    }

    private static throttle_add_new_subs = ThrottleHelper.declare_throttle_with_stackable_args(VarsClientsSubsCacheManager.throttled_add_new_subs.bind(VarsClientsSubsCacheManager), 1);
    private static throttle_remove_subs = ThrottleHelper.declare_throttle_with_stackable_args(VarsClientsSubsCacheManager.throttled_remove_subs.bind(VarsClientsSubsCacheManager), 1);

    /* istanbul ignore next */
    private static async throttled_add_new_subs(var_indexs: string[]): Promise<void> {

        if (!await ForkedTasksController.exec_self_on_bgthread(
            VarsBGThreadNameHolder.bgthread_name,
            VarsClientsSubsCacheManager.TASK_NAME_throttled_add_new_subs, var_indexs)) {
            return;
        }

        VarsClientsSubsCacheManager.throttled_add_new_subs_on_bg_thread(var_indexs);
    }
    private static throttled_add_new_subs_on_bg_thread(var_indexs: string[]) {
        for (let i in var_indexs) {
            VarsClientsSubsCacheHolder.clients_subs_indexes_cache[var_indexs[i]] = true;
        }
    }

    /* istanbul ignore next */
    private static async throttled_remove_subs(var_indexs: string[]): Promise<void> {

        if (!await ForkedTasksController.exec_self_on_bgthread(
            VarsBGThreadNameHolder.bgthread_name,
            VarsClientsSubsCacheManager.TASK_NAME_throttled_add_new_subs, var_indexs)) {
            return;
        }

        VarsClientsSubsCacheManager.throttled_remove_subs_on_bg_thread(var_indexs);
    }
    private static throttled_remove_subs_on_bg_thread(var_indexs: string[]) {
        for (let i in var_indexs) {
            delete VarsClientsSubsCacheHolder.clients_subs_indexes_cache[var_indexs[i]];
        }
    }
}
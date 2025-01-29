import { PostThrottleParam, PreThrottleParam } from "../../../../../shared/annotations/Throttle";
import EventifyEventListenerConfVO from "../../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO";
import ConsoleHandler from "../../../../../shared/tools/ConsoleHandler";
import SemaphoreHandler from "../../../../../shared/tools/SemaphoreHandler";
import ThreadHandler from "../../../../../shared/tools/ThreadHandler";
import ThrottleExecAsServerRunsOnBgThread from "../../../../annotations/ThrottleExecAsServerRunsOnBgThread";
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

    public static init() {
        ThreadHandler.set_interval(
            'VarsClientsSubsCacheManager.update_clients_subs_indexes_cache',
            VarsClientsSubsCacheManager.update_clients_subs_indexes_cache.bind(VarsClientsSubsCacheManager),
            30000,
            'VarsClientsSubsCacheManager.update_clients_subs_indexes_cache',
            false);
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

                    const subs_indexs = await VarsTabsSubsController.get_subs_indexs(force_update);

                    const new_cache = {};
                    for (const index of subs_indexs) {
                        new_cache[index] = true;
                    }
                    VarsClientsSubsCacheHolder.clients_subs_indexes_cache = new_cache;
                } catch (error) {
                    ConsoleHandler.error('Error in update_clients_subs_indexes_cache');
                }
            }, true);
    }

    @ThrottleExecAsServerRunsOnBgThread(
        {
            param_type: EventifyEventListenerConfVO.PARAM_TYPE_STACK,
            throttle_ms: 10,
        },
        VarsBGThreadNameHolder.bgthread_name,
        null, // static
    )
    public static throttle_add_new_subs(@PreThrottleParam pre_var_indexs: string | string[], @PostThrottleParam var_indexs: string[] = null) {
        for (const i in var_indexs) {
            VarsClientsSubsCacheHolder.clients_subs_indexes_cache[var_indexs[i]] = true;
        }
    }

    @ThrottleExecAsServerRunsOnBgThread(
        {
            param_type: EventifyEventListenerConfVO.PARAM_TYPE_STACK,
            throttle_ms: 10,
        },
        VarsBGThreadNameHolder.bgthread_name,
        null, // static
    )
    public static async throttle_remove_subs(@PreThrottleParam pre_var_indexs: string | string[], @PostThrottleParam var_indexs: string[] = null): Promise<void> {

        for (const i in var_indexs) {
            delete VarsClientsSubsCacheHolder.clients_subs_indexes_cache[var_indexs[i]];
        }
    }
}
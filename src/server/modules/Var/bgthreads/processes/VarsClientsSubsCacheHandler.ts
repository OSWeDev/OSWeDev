import ConsoleHandler from "../../../../../shared/tools/ConsoleHandler";
import ThrottleHelper from "../../../../../shared/tools/ThrottleHelper";
import ForkedTasksController from "../../../Fork/ForkedTasksController";
import VarsTabsSubsController from "../../VarsTabsSubsController";
import VarsdatasComputerBGThread from "../VarsdatasComputerBGThread";

export default class VarsClientsSubsCacheHandler {

    public static TASK_NAME_throttled_add_new_subs: string = 'throttled_add_new_subs';

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
    public static clients_subs_indexes_cache: { [var_index: string]: boolean } = {};

    public static init() {
        setInterval(VarsClientsSubsCacheHandler.update_clients_subs_indexes_cache.bind(VarsClientsSubsCacheHandler), 30000);
    }

    public static add_new_sub(var_index: string) {
        VarsClientsSubsCacheHandler.throttle_add_new_subs([var_index]);
    }
    public static remove_sub(var_index: string) {
        VarsClientsSubsCacheHandler.throttle_remove_subs([var_index]);
    }

    public static async update_clients_subs_indexes_cache(): Promise<void> {

        if (VarsClientsSubsCacheHandler.update_clients_subs_indexes_cache_semaphore) {
            return;
        }
        VarsClientsSubsCacheHandler.update_clients_subs_indexes_cache_semaphore = true;

        try {

            let subs_indexs = await VarsTabsSubsController.get_subs_indexs();

            let new_cache = {};
            for (let index of subs_indexs) {
                new_cache[index] = true;
            }
            VarsClientsSubsCacheHandler.clients_subs_indexes_cache = new_cache;
        } catch (error) {
            ConsoleHandler.error('Error in update_clients_subs_indexes_cache');
        }

        VarsClientsSubsCacheHandler.update_clients_subs_indexes_cache_semaphore = false;
    }

    private static update_clients_subs_indexes_cache_semaphore: boolean = false;

    private static throttle_add_new_subs = ThrottleHelper.getInstance().declare_throttle_with_stackable_args(VarsClientsSubsCacheHandler.throttled_add_new_subs.bind(VarsClientsSubsCacheHandler), 1);
    private static throttle_remove_subs = ThrottleHelper.getInstance().declare_throttle_with_stackable_args(VarsClientsSubsCacheHandler.throttled_remove_subs.bind(VarsClientsSubsCacheHandler), 1);

    private static async throttled_add_new_subs(var_indexs: string[]): Promise<void> {

        let self = VarsClientsSubsCacheHandler;

        return new Promise(async (resolve, reject) => {

            if (!await ForkedTasksController.exec_self_on_bgthread(
                VarsdatasComputerBGThread.getInstance().name,
                VarsClientsSubsCacheHandler.TASK_NAME_throttled_add_new_subs, var_indexs)) {
                return;
            }

            for (let i in var_indexs) {
                self.clients_subs_indexes_cache[var_indexs[i]] = true;
            }
        });
    }
    private static async throttled_remove_subs(var_indexs: string[]): Promise<void> {

        let self = VarsClientsSubsCacheHandler;

        return new Promise(async (resolve, reject) => {

            if (!await ForkedTasksController.exec_self_on_bgthread(
                VarsdatasComputerBGThread.getInstance().name,
                VarsClientsSubsCacheHandler.TASK_NAME_throttled_add_new_subs, var_indexs)) {
                return;
            }

            for (let i in var_indexs) {
                delete self.clients_subs_indexes_cache[var_indexs[i]];
            }
        });
    }
}
import ThreadHandler from "./ThreadHandler";

export default class SemaphoreHandler {

    /**
     * @param key
     * @param cb
     * @param return_if_unavailable En async on peut choisir d'attendre la dispo du semaphore ou de retourner null directement si il est indispo
     * @returns
     */
    public static async semaphore_async(key: string, cb: () => any | Promise<any>, return_if_unavailable: boolean = true): Promise<any> {

        if (return_if_unavailable && SemaphoreHandler.SEMAPHORES[key]) {
            return null;
        }

        while (SemaphoreHandler.SEMAPHORES[key]) {
            await ThreadHandler.sleep(1, 'SemaphoreHandler.semaphore_async.' + key);
        }

        SemaphoreHandler.SEMAPHORES[key] = true;
        const res = await cb();
        SemaphoreHandler.SEMAPHORES[key] = false;

        return res;
    }

    /**
     * En sync on est forcément return_if_unavailable = true
     * @param key
     * @param cb
     * @returns
     */
    public static semaphore_sync(key: string, cb: () => any): any {

        if (SemaphoreHandler.SEMAPHORES[key]) {
            return null;
        }

        SemaphoreHandler.SEMAPHORES[key] = true;
        const res = cb();
        SemaphoreHandler.SEMAPHORES[key] = false;

        return res;
    }

    /**
     * En only_once, on peut être appelé plusieurs fois, mais on ne fait le traitement qu'une seule fois
     * @param key
     * @param cb
     * @returns
     */
    public static do_only_once(key: string, cb: () => any | Promise<any>): Promise<any> {

        if (SemaphoreHandler.SEMAPHORES[key]) {
            return null;
        }

        SemaphoreHandler.SEMAPHORES[key] = true;
        const res = cb();

        return res;
    }

    private static SEMAPHORES: { [key: string]: boolean } = {};
}
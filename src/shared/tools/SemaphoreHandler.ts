import { StatThisMapKeys } from "../modules/Stats/annotations/StatThisMapKeys";
import ThreadHandler from "./ThreadHandler";

export interface ISemaphoreHandlerCallInstance<T> {
    params: T;
    resolve: (...x) => unknown | Promise<unknown>;
    reject: (...x) => unknown | Promise<unknown>;
}

export default class SemaphoreHandler {

    @StatThisMapKeys('SemaphoreHandler')
    private static SEMAPHORES: { [key: string]: boolean } = {};

    @StatThisMapKeys('SemaphoreHandler', null, 1, true)
    private static SEMAPHORES_call_instances: { [key: string]: ISemaphoreHandlerCallInstance<unknown>[] } = {};

    /**
     * Cette méthode permet de vérifier la dispo d'un semaphore
     *  Si le sémaphore est dispo : on le prend et on indique que le sémaphore est pris et que cet appel est l'appel qui l'a pris (en renvoyant la map des params + resolve + reject qui pour l'instant ne contient que cet appel)
     *  Si le sémaphore n'est plus dispo : on pousse les params + resolve + reject dans la liste des call_instances, et on renvoie null pour indiquer qu'on n'est pas en charge de cette instance du sémaphore
     */
    public static get_call_instances<T>(semaphore_key: string, call_instance: ISemaphoreHandlerCallInstance<T>): ISemaphoreHandlerCallInstance<T>[] {

        if (!SemaphoreHandler.SEMAPHORES[semaphore_key]) {
            SemaphoreHandler.SEMAPHORES[semaphore_key] = true;
            return [call_instance];
        }

        if (!SemaphoreHandler.SEMAPHORES_call_instances[semaphore_key]) {
            SemaphoreHandler.SEMAPHORES_call_instances[semaphore_key] = [];
        }

        SemaphoreHandler.SEMAPHORES_call_instances[semaphore_key].push(call_instance);

        return null;
    }

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
}
/* istanbul ignore file: nothing to test here */

import ThreadHandler from "./ThreadHandler";

export default class SemaphoreHandler {

    public static async semaphore(key: string, cb: () => Promise<any>): Promise<any> {

        while (SemaphoreHandler.SEMAPHORES[key]) {
            await ThreadHandler.sleep(10);
        }

        SemaphoreHandler.SEMAPHORES[key] = true;
        let res = await cb();
        SemaphoreHandler.SEMAPHORES[key] = false;

        return res;
    }

    private static SEMAPHORES: { [key: string]: boolean } = {};
}
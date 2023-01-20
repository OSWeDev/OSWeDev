/* istanbul ignore file: nothing to test here */

export default class ThreadHandler {

    /**
     * @param timeout en ms
     */
    public static async sleep(timeout: number): Promise<void> {
        return new Promise<any>((resolve) => {
            setTimeout(() => {
                resolve(null);
            }, timeout);
        });
    }

    private constructor() {
    }
}
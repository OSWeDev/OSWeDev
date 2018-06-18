export default class ThreadHandler {

    public static getInstance(): ThreadHandler {
        if (!ThreadHandler.instance) {
            ThreadHandler.instance = new ThreadHandler();
        }
        return ThreadHandler.instance;
    }

    private static instance: ThreadHandler = null;

    private constructor() {
    }

    /**
     * @param timeout en ms
     */
    public async sleep(timeout: number): Promise<void> {
        return new Promise<any>((resolve) => {
            setTimeout(() => {
                resolve();
            }, timeout);
        });
    }
}
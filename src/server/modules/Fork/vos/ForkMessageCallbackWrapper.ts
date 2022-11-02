import Dates from "../../../../shared/modules/FormatDatesNombres/Dates/Dates";

export default class ForkMessageCallbackWrapper {

    public creation_time: number;

    /**
     * Wrapper for waiting for thread interaction
     * @param resolver callback if succeeded
     * @param thrower callback if failed
     * @param timeout in secs (defaults to 3600 / 1 heure - pour attendre les gros calculs)
     */
    public constructor(
        public resolver: (result: any) => any,
        public thrower: (result: any) => any,
        public timeout: number = 3600) {

        this.creation_time = Dates.now();
    }
}
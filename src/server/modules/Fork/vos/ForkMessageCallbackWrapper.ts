import Dates from "../../../../shared/modules/FormatDatesNombres/Dates/Dates";

export default class ForkMessageCallbackWrapper {

    public creation_time: number;

    /**
     * Wrapper for waiting for thread interaction
     * @param resolver callback if succeeded
     * @param thrower callback if failed
     * @param timeout in secs (defaults to 300 / 5 minutes - pour attendre les gros calculs)
     */
    public constructor(
        public resolver: (result: any) => any,
        public thrower: (result: any) => any,

        public task_uid: string, // principalement pour du debug quand il y a un timeout
        public task_params: any,

        public timeout: number = 3600) { // FIXME:TODO: Ya un truc à creuser là dessus.... si on fait un export extrêmement lourd,  on veut pas de timeout. Le reste du temps, on veut un timeout plutôt faible type 300....

        this.creation_time = Dates.now();
    }
}
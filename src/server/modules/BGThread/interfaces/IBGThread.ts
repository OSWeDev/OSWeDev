export default interface IBGThread {

    name: string;

    /**
     * WARNING: Each thread runs with full memory load. Use only for very demanding execs than would dramatically block the other bgthreads or crons otherwise.
     */
    exec_in_dedicated_thread?: boolean;

    /**
     * Timeout (ms) before BGT first launch (see ModuleBGThreadServer.DEFAULT_initial_timeout for example)
     */
    current_timeout: number;

    /**
     * Indique qu'un lancement est en cours
     */
    semaphore: boolean;

    /**
     * Indique qu'un lancement doit être fait ASAP
     */
    run_asap: boolean;

    /**
     * TS du dernier lancement en ms
     */
    last_run_unix: number;

    /**
     * Max timeout (ms) possible for this BGT (see ModuleBGThreadServer.DEFAULT_MAX_timeout for example)
     */
    MAX_timeout: number;

    /**
     * Min timeout (ms) possible for this BGT (see ModuleBGThreadServer.DEFAULT_MIN_timeout for example)
     */
    MIN_timeout: number;

    /**
     * Returns coef to apply to current timeout (see ModuleBGThreadServer.TIMEOUT_COEF_FASTER for example)
     */
    work(): Promise<number>;
}
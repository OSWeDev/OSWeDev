export default interface ICronWorker {

    worker_uid: string;

    /**
     * WARNING: Each thread runs with full memory load. Use only for very demanding execs than would dramatically block the other bgthreads or crons otherwise.
     */
    exec_in_dedicated_thread?: boolean;

    work();
}
export default class BGThreadLoadBalancer {
    public current_worker_index: number = 0;

    public constructor(
        public bg_thread_name: string,
        public nb_workers: number,
    ) { }
}
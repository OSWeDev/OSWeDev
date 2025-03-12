import BGThreadLoadBalancer from "./vos/BGThreadLoadBalancer";

export default class BGThreadLoadBalancerServerController {

    public static GET_WORKER_LATENCY_TASK_NAME: string = 'get_worker_latency';
    public static loadbalancers_by_bg_thread_name: { [bgthread_name: string]: BGThreadLoadBalancer } = {};

    /**
     * Fonction utilisée pour récupérer la latence entre le main et le worker demandé
     * @param worker_name
     * @returns
     */
    public static get_worker_latency: (worker_name: string) => Promise<number> = null;

    public static async get_worker_latency_bgthread_task(): Promise<void> {
    }
}
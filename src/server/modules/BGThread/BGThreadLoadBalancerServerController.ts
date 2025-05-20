import Dates from "../../../shared/modules/FormatDatesNombres/Dates/Dates";
import PerfReportController from "../../../shared/modules/PerfReport/PerfReportController";
import BgthreadPerfModuleNamesHolder from "./BgthreadPerfModuleNamesHolder";
import BGThreadLoadBalancer from "./vos/BGThreadLoadBalancer";

export default class BGThreadLoadBalancerServerController {

    public static GET_WORKER_LATENCY_TASK_NAME: string = 'get_worker_latency';
    public static loadbalancers_by_bg_thread_name: { [bgthread_name: string]: BGThreadLoadBalancer } = {};

    /**
     * Fonction utilisée pour récupérer la latence entre le main et le worker demandé
     * @param worker_name
     * @returns
     */
    public static async get_worker_latency(worker_name: string): Promise<number> {
        const start_ms = Dates.now_ms();

        const ForkedTasksController = require("../Fork/ForkedTasksController").default;
        await ForkedTasksController.exec_task_on_bgthread_and_return_value(true, worker_name, BGThreadLoadBalancerServerController.GET_WORKER_LATENCY_TASK_NAME);

        PerfReportController.add_cooldown(
            BgthreadPerfModuleNamesHolder.BGTHREAD_PING_LATENCY_PERF_MODULE_NAME,
            'BGThreadLoadBalancer.worker_latency.' + worker_name,
            'BGThreadLoadBalancer.worker_latency.' + worker_name,
            'BGThreadLoadBalancer.worker_latency.' + worker_name,
            start_ms,
            Dates.now_ms(),
            'Durée totale : ' + (Dates.now_ms() - start_ms) + ' ms',
        );

        return Dates.now_ms() - start_ms;
    }

    public static async get_worker_latency_bgthread_task(): Promise<void> {
    }
}
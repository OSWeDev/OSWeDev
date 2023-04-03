import TimeSegment from "../shared/modules/DataRender/vos/TimeSegment";
import StatsController from "../shared/modules/Stats/StatsController";
import StatVO from "../shared/modules/Stats/vos/StatVO";
import { all_promises } from "../shared/tools/PromiseTools";
import ThreadHandler from "../shared/tools/ThreadHandler";
import BGThreadServerController from "./modules/BGThread/BGThreadServerController";
import ForkServerController from "./modules/Fork/ForkServerController";

export default class MemoryUsageStat {
    public static async updateMemoryUsageStat() {
        let memory_usage_stat = process.memoryUsage();

        let thread_name = StatsController.get_thread_name();

        await all_promises([
            StatsController.register_stats('MemoryUsageStat.' + thread_name + '.external',
                memory_usage_stat.external, [StatVO.AGGREGATOR_MAX, StatVO.AGGREGATOR_MEAN, StatVO.AGGREGATOR_MIN], TimeSegment.TYPE_MINUTE),

            StatsController.register_stats('MemoryUsageStat.' + thread_name + '.heapTotal',
                memory_usage_stat.heapTotal, [StatVO.AGGREGATOR_MAX, StatVO.AGGREGATOR_MEAN, StatVO.AGGREGATOR_MIN], TimeSegment.TYPE_MINUTE),

            StatsController.register_stats('MemoryUsageStat.' + thread_name + '.heapUsed',
                memory_usage_stat.heapUsed, [StatVO.AGGREGATOR_MAX, StatVO.AGGREGATOR_MEAN, StatVO.AGGREGATOR_MIN], TimeSegment.TYPE_MINUTE),

            StatsController.register_stats('MemoryUsageStat.' + thread_name + '.rss',
                memory_usage_stat.rss, [StatVO.AGGREGATOR_MAX, StatVO.AGGREGATOR_MEAN, StatVO.AGGREGATOR_MIN], TimeSegment.TYPE_MINUTE),
        ]);

        await ThreadHandler.sleep(10000);
    }
}
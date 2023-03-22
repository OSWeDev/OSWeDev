import TimeSegment from "../shared/modules/DataRender/vos/TimeSegment";
import StatsController from "../shared/modules/Stats/StatsController";
import StatVO from "../shared/modules/Stats/vos/StatVO";
import { all_promises } from "../shared/tools/PromiseTools";
import ThreadHandler from "../shared/tools/ThreadHandler";

export default class MemoryUsageStat {
    public static async updateMemoryUsageStat() {
        let memory_usage_stat = process.memoryUsage();

        await all_promises([
            StatsController.register_stat('MemoryUsageStat.' + process.ppid + '.external.max',
                memory_usage_stat.external, StatVO.AGGREGATOR_MAX, TimeSegment.TYPE_MINUTE),
            StatsController.register_stat('MemoryUsageStat.' + process.ppid + '.external.min',
                memory_usage_stat.external, StatVO.AGGREGATOR_MAX, TimeSegment.TYPE_MINUTE),
            StatsController.register_stat('MemoryUsageStat.' + process.ppid + '.external.mean',
                memory_usage_stat.external, StatVO.AGGREGATOR_MAX, TimeSegment.TYPE_MINUTE),

            StatsController.register_stat('MemoryUsageStat.' + process.ppid + '.heapTotal.max',
                memory_usage_stat.heapTotal, StatVO.AGGREGATOR_MAX, TimeSegment.TYPE_MINUTE),
            StatsController.register_stat('MemoryUsageStat.' + process.ppid + '.heapTotal.min',
                memory_usage_stat.heapTotal, StatVO.AGGREGATOR_MAX, TimeSegment.TYPE_MINUTE),
            StatsController.register_stat('MemoryUsageStat.' + process.ppid + '.heapTotal.mean',
                memory_usage_stat.heapTotal, StatVO.AGGREGATOR_MAX, TimeSegment.TYPE_MINUTE),

            StatsController.register_stat('MemoryUsageStat.' + process.ppid + '.heapUsed.max',
                memory_usage_stat.heapUsed, StatVO.AGGREGATOR_MAX, TimeSegment.TYPE_MINUTE),
            StatsController.register_stat('MemoryUsageStat.' + process.ppid + '.heapUsed.min',
                memory_usage_stat.heapUsed, StatVO.AGGREGATOR_MAX, TimeSegment.TYPE_MINUTE),
            StatsController.register_stat('MemoryUsageStat.' + process.ppid + '.heapUsed.mean',
                memory_usage_stat.heapUsed, StatVO.AGGREGATOR_MAX, TimeSegment.TYPE_MINUTE),

            StatsController.register_stat('MemoryUsageStat.' + process.ppid + '.rss.max',
                memory_usage_stat.rss, StatVO.AGGREGATOR_MAX, TimeSegment.TYPE_MINUTE),
            StatsController.register_stat('MemoryUsageStat.' + process.ppid + '.rss.min',
                memory_usage_stat.rss, StatVO.AGGREGATOR_MAX, TimeSegment.TYPE_MINUTE),
            StatsController.register_stat('MemoryUsageStat.' + process.ppid + '.rss.mean',
                memory_usage_stat.rss, StatVO.AGGREGATOR_MAX, TimeSegment.TYPE_MINUTE),
        ]);

        await ThreadHandler.sleep(10000);
    }
}
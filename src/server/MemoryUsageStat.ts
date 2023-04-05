import TimeSegment from "../shared/modules/DataRender/vos/TimeSegment";
import StatVO from "../shared/modules/Stats/vos/StatVO";
import ThreadHandler from "../shared/tools/ThreadHandler";
import StatsServerController from "./modules/Stats/StatsServerController";

export default class MemoryUsageStat {
    public static async updateMemoryUsageStat() {
        let memory_usage_stat = process.memoryUsage();

        StatsServerController.register_stats('MemoryUsageStat.external',
            memory_usage_stat.external, [StatVO.AGGREGATOR_MAX, StatVO.AGGREGATOR_MEAN, StatVO.AGGREGATOR_MIN], TimeSegment.TYPE_MINUTE);
        StatsServerController.register_stats('MemoryUsageStat.heapTotal',
            memory_usage_stat.heapTotal, [StatVO.AGGREGATOR_MAX, StatVO.AGGREGATOR_MEAN, StatVO.AGGREGATOR_MIN], TimeSegment.TYPE_MINUTE);
        StatsServerController.register_stats('MemoryUsageStat.heapUsed',
            memory_usage_stat.heapUsed, [StatVO.AGGREGATOR_MAX, StatVO.AGGREGATOR_MEAN, StatVO.AGGREGATOR_MIN], TimeSegment.TYPE_MINUTE);
        StatsServerController.register_stats('MemoryUsageStat.rss',
            memory_usage_stat.rss, [StatVO.AGGREGATOR_MAX, StatVO.AGGREGATOR_MEAN, StatVO.AGGREGATOR_MIN], TimeSegment.TYPE_MINUTE);

        await ThreadHandler.sleep(10000);
    }
}
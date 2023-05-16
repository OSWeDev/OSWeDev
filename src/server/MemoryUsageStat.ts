import TimeSegment from "../shared/modules/DataRender/vos/TimeSegment";
import StatsController from "../shared/modules/Stats/StatsController";
import StatsTypeVO from "../shared/modules/Stats/vos/StatsTypeVO";
import StatVO from "../shared/modules/Stats/vos/StatVO";
import ThreadHandler from "../shared/tools/ThreadHandler";

export default class MemoryUsageStat {
    public static async updateMemoryUsageStat() {
        let memory_usage_stat = process.memoryUsage();

        StatsController.register_stats('MemoryUsageStat', 'external', '-', StatsTypeVO.TYPE_QUANTITE,
            memory_usage_stat.external, [StatVO.AGGREGATOR_MAX, StatVO.AGGREGATOR_MEAN, StatVO.AGGREGATOR_MIN], TimeSegment.TYPE_MINUTE);
        StatsController.register_stats('MemoryUsageStat', 'heapTotal', '-', StatsTypeVO.TYPE_QUANTITE,
            memory_usage_stat.heapTotal, [StatVO.AGGREGATOR_MAX, StatVO.AGGREGATOR_MEAN, StatVO.AGGREGATOR_MIN], TimeSegment.TYPE_MINUTE);
        StatsController.register_stats('MemoryUsageStat', 'heapUsed', '-', StatsTypeVO.TYPE_QUANTITE,
            memory_usage_stat.heapUsed, [StatVO.AGGREGATOR_MAX, StatVO.AGGREGATOR_MEAN, StatVO.AGGREGATOR_MIN], TimeSegment.TYPE_MINUTE);
        StatsController.register_stats('MemoryUsageStat', 'rss', '-', StatsTypeVO.TYPE_QUANTITE,
            memory_usage_stat.rss, [StatVO.AGGREGATOR_MAX, StatVO.AGGREGATOR_MEAN, StatVO.AGGREGATOR_MIN], TimeSegment.TYPE_MINUTE);

        await ThreadHandler.sleep(10000, 'MemoryUsageStat.updateMemoryUsageStat');
    }
}
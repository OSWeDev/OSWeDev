import StatsController from "../shared/modules/Stats/StatsController";
import ThreadHandler from "../shared/tools/ThreadHandler";

export default class MemoryUsageStat {
    public static async updateMemoryUsageStat() {
        let memory_usage_stat = process.memoryUsage();

        StatsController.register_stat_QUANTITE('MemoryUsageStat', 'external', '-', memory_usage_stat.external);
        StatsController.register_stat_QUANTITE('MemoryUsageStat', 'heapTotal', '-', memory_usage_stat.heapTotal);
        StatsController.register_stat_QUANTITE('MemoryUsageStat', 'heapUsed', '-', memory_usage_stat.heapUsed);
        StatsController.register_stat_QUANTITE('MemoryUsageStat', 'rss', '-', memory_usage_stat.rss);

        await ThreadHandler.sleep(10000, 'MemoryUsageStat.updateMemoryUsageStat');
    }
}
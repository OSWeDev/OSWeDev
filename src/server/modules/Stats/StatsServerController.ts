import StatClientWrapperVO from '../../../shared/modules/Stats/vos/StatClientWrapperVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import StatsUnstackerBGThread from './bgthreads/StatsUnstackerBGThread';

export default class StatsServerController {

    public static getInstance(): StatsServerController {
        if (!StatsServerController.instance) {
            StatsServerController.instance = new StatsServerController();
        }
        return StatsServerController.instance;
    }

    public static async new_stats_handler(all_new_stats: StatClientWrapperVO[]): Promise<boolean> {

        try {

            // Spécifique serveur
            await StatsUnstackerBGThread.getInstance().register_aggregated_stats(all_new_stats);
            return true;
        } catch (error) {
            ConsoleHandler.error('StatsServerController:new_stats_handler:' + error);
            return false;
        }
    }

    private static instance: StatsServerController = null;

    private constructor() { }

}
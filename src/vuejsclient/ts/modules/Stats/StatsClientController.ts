import Dates from "../../../../shared/modules/FormatDatesNombres/Dates/Dates";
import ModuleStats from "../../../../shared/modules/Stats/ModuleStats";
import StatClientWrapperVO from "../../../../shared/modules/Stats/vos/StatClientWrapperVO";
import ConsoleHandler from "../../../../shared/tools/ConsoleHandler";


export default class StatsClientController {

    public static getInstance(): StatsClientController {
        if (!StatsClientController.instance) {
            StatsClientController.instance = new StatsClientController();
        }
        return StatsClientController.instance;
    }

    public static async new_stats_handler(new_stats: StatClientWrapperVO[]): Promise<boolean> {

        try {

            await ModuleStats.getInstance().register_client_stats(new_stats, Dates.now());
            return true;
        } catch (error) {
            ConsoleHandler.error('StatsClientController:new_stats_handler:' + error);
            return false;
        }
    }

    private static instance: StatsClientController = null;
}
import Dates from "../../../../shared/modules/FormatDatesNombres/Dates/Dates";
import ModuleStats from "../../../../shared/modules/Stats/ModuleStats";
import StatClientWrapperVO from "../../../../shared/modules/Stats/vos/StatClientWrapperVO";


export default class StatsClientController {

    public static getInstance(): StatsClientController {
        if (!StatsClientController.instance) {
            StatsClientController.instance = new StatsClientController();
        }
        return StatsClientController.instance;
    }

    public static async new_stats_handler(new_stats: StatClientWrapperVO[]) {

        await ModuleStats.getInstance().register_client_stats(new_stats, Dates.now());
    }

    private static instance: StatsClientController = null;
}
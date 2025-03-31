import { IDatabase } from "pg-promise";
import DashboardCycleChecker from "../../../server/modules/DashboardBuilder/DashboardCycleChecker";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import DashboardVO from "../../../shared/modules/DashboardBuilder/vos/DashboardVO";
import IGeneratorWorker from "../../IGeneratorWorker";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";


export default class Patch20250303CheckDBsCycles implements IGeneratorWorker {

    private static instance: Patch20250303CheckDBsCycles = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20250303CheckDBsCycles';
    }

    public static getInstance(): Patch20250303CheckDBsCycles {
        if (!Patch20250303CheckDBsCycles.instance) {
            Patch20250303CheckDBsCycles.instance = new Patch20250303CheckDBsCycles();
        }
        return Patch20250303CheckDBsCycles.instance;
    }

    public async work(db: IDatabase<unknown>) {
        const dbs = await query(DashboardVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<DashboardVO>();

        for (const i in dbs) {
            const dashboard = dbs[i];

            ConsoleHandler.log('Checking cycles for dashboard ' + dashboard.id);
            await DashboardCycleChecker.detectCyclesForDashboard(dashboard.id);
        }
    }
}
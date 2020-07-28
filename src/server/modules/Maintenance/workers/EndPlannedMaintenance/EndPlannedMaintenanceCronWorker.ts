import ModuleMaintenance from '../../../../../shared/modules/Maintenance/ModuleMaintenance';
import ICronWorker from '../../../Cron/interfaces/ICronWorker';


export default class EndPlannedMaintenanceCronWorker implements ICronWorker {

    public static getInstance() {
        if (!EndPlannedMaintenanceCronWorker.instance) {
            EndPlannedMaintenanceCronWorker.instance = new EndPlannedMaintenanceCronWorker();
        }
        return EndPlannedMaintenanceCronWorker.instance;
    }

    private static instance: EndPlannedMaintenanceCronWorker = null;

    private constructor() {
    }

    get worker_uid(): string {
        return "EndPlannedMaintenanceCronWorker";
    }

    public async work() {
        await ModuleMaintenance.getInstance().end_planned_maintenance();
    }
}
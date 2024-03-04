import ModuleMaintenance from '../../../../../shared/modules/Maintenance/ModuleMaintenance';
import ICronWorker from '../../../Cron/interfaces/ICronWorker';


export default class EndPlannedMaintenanceCronWorker implements ICronWorker {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!EndPlannedMaintenanceCronWorker.instance) {
            EndPlannedMaintenanceCronWorker.instance = new EndPlannedMaintenanceCronWorker();
        }
        return EndPlannedMaintenanceCronWorker.instance;
    }

    private static instance: EndPlannedMaintenanceCronWorker = null;

    private constructor() {
    }

    // istanbul ignore next: nothing to test : worker_uid
    get worker_uid(): string {
        return "EndPlannedMaintenanceCronWorker";
    }

    // istanbul ignore next: nothing to test : work
    public async work() {
        await ModuleMaintenance.getInstance().end_planned_maintenance();
    }
}
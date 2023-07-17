import ModuleMaintenance from '../../../../../shared/modules/Maintenance/ModuleMaintenance';
import ConfigurationService from '../../../../env/ConfigurationService';
import ICronWorker from '../../../Cron/interfaces/ICronWorker';


export default class StartMaintenanceCronWorker implements ICronWorker {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!StartMaintenanceCronWorker.instance) {
            StartMaintenanceCronWorker.instance = new StartMaintenanceCronWorker();
        }
        return StartMaintenanceCronWorker.instance;
    }

    private static instance: StartMaintenanceCronWorker = null;

    private constructor() {
    }

    get worker_uid(): string {
        return "StartMaintenanceCronWorker";
    }

    public async work() {
        await ModuleMaintenance.getInstance().start_maintenance(ConfigurationService.node_configuration.START_MAINTENANCE_ACCEPTATION_CODE);
    }
}

import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleMaintenance from '../../../shared/modules/Maintenance/ModuleMaintenance';
import MaintenanceVO from '../../../shared/modules/Maintenance/vos/MaintenanceVO';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ForkedTasksController from '../Fork/ForkedTasksController';
import PushDataServerController from '../PushData/PushDataServerController';

export default class MaintenanceServerController {

    public static TASK_NAME_set_planned_maintenance_vo = 'MaintenanceServerController.set_planned_maintenance_vo';
    public static TASK_NAME_handleTriggerPreC_MaintenanceVO = 'MaintenanceServerController.handleTriggerPreC_MaintenanceVO';
    public static TASK_NAME_end_maintenance = 'MaintenanceServerController.end_maintenance';
    public static TASK_NAME_start_maintenance = 'ModuleMaintenanceServer.start_maintenance';
    public static TASK_NAME_end_planned_maintenance = 'ModuleMaintenanceServer.end_planned_maintenance';

    public static getInstance() {
        if (!MaintenanceServerController.instance) {
            MaintenanceServerController.instance = new MaintenanceServerController();
        }
        return MaintenanceServerController.instance;
    }

    private static instance: MaintenanceServerController = null;

    /**
     * Global application cache - Handled by Main process -----
     */
    private planned_maintenance: MaintenanceVO = null;
    /**
     * ----- Global application cache - Handled by Main process
     */

    /**
     * Local thread cache -----
     *  - Monothread car un seul thread, le main, peut et doit l'utiliser en CRUD
     */
    private informed_users_tstzs: { [user_id: number]: number } = {};
    /**
     * ----- Local thread cache
     */

    protected constructor() {
        ForkedTasksController.getInstance().register_task(MaintenanceServerController.TASK_NAME_set_planned_maintenance_vo, this.set_planned_maintenance_vo.bind(this));
    }

    public async set_planned_maintenance_vo(maintenance: MaintenanceVO): Promise<void> {

        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(MaintenanceServerController.TASK_NAME_set_planned_maintenance_vo, maintenance)) {
            return;
        }

        this.planned_maintenance = maintenance;
    }

    /**
     * WARN : Should only be used on the main process (express)
     */
    get has_planned_maintenance() {
        ForkedTasksController.getInstance().assert_is_main_process();

        return !!this.planned_maintenance;
    }

    /**
     * WARN : only on main thread (express) since called only when on request
     * @param user_id
     */
    public async inform_user_on_request(user_id: number): Promise<void> {

        ForkedTasksController.getInstance().assert_is_main_process();

        if (!(this.planned_maintenance && (!this.planned_maintenance.maintenance_over))) {
            return;
        }

        let timeout_info: number = await ModuleParams.getInstance().getParamValueAsInt(ModuleMaintenance.PARAM_NAME_INFORM_EVERY_MINUTES, 1);
        if ((!!this.informed_users_tstzs[user_id]) && (Dates.add(this.informed_users_tstzs[user_id], timeout_info, TimeSegment.TYPE_MINUTE) > Dates.now())) {
            return;
        }

        let timeout_minutes_msg1: number = await ModuleParams.getInstance().getParamValueAsInt(ModuleMaintenance.PARAM_NAME_SEND_MSG1_WHEN_SHORTER_THAN_MINUTES);
        let timeout_minutes_msg2: number = await ModuleParams.getInstance().getParamValueAsInt(ModuleMaintenance.PARAM_NAME_SEND_MSG2_WHEN_SHORTER_THAN_MINUTES);
        let timeout_minutes_msg3: number = await ModuleParams.getInstance().getParamValueAsInt(ModuleMaintenance.PARAM_NAME_SEND_MSG3_WHEN_SHORTER_THAN_MINUTES);

        if (Dates.add(this.planned_maintenance.start_ts, -timeout_minutes_msg3, TimeSegment.TYPE_MINUTE) <= Dates.now()) {
            await PushDataServerController.getInstance().notifySimpleERROR(user_id, null, ModuleMaintenance.MSG3_code_text);
        } else if (Dates.add(this.planned_maintenance.start_ts, -timeout_minutes_msg2, TimeSegment.TYPE_MINUTE) <= Dates.now()) {
            await PushDataServerController.getInstance().notifySimpleWARN(user_id, null, ModuleMaintenance.MSG2_code_text);
        } else if (Dates.add(this.planned_maintenance.start_ts, -timeout_minutes_msg1, TimeSegment.TYPE_MINUTE) <= Dates.now()) {
            await PushDataServerController.getInstance().notifySimpleINFO(user_id, null, ModuleMaintenance.MSG1_code_text);
        }

        this.informed_users_tstzs[user_id] = Dates.now();
    }
}
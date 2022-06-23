import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleMaintenance from '../../../../shared/modules/Maintenance/ModuleMaintenance';
import MaintenanceVO from '../../../../shared/modules/Maintenance/vos/MaintenanceVO';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';
import NotificationVO from '../../../../shared/modules/PushData/vos/NotificationVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import PushDataServerController from '../../PushData/PushDataServerController';
import MaintenanceServerController from '../MaintenanceServerController';
import ModuleMaintenanceServer from '../ModuleMaintenanceServer';

export default class MaintenanceBGThread implements IBGThread {

    public static getInstance() {
        if (!MaintenanceBGThread.instance) {
            MaintenanceBGThread.instance = new MaintenanceBGThread();
        }
        return MaintenanceBGThread.instance;
    }

    private static instance: MaintenanceBGThread = null;

    public current_timeout: number = 1000;
    public MAX_timeout: number = 5000;
    public MIN_timeout: number = 1000;

    private constructor() {
    }

    get name(): string {
        return "MaintenanceBGThread";
    }

    public async work(): Promise<number> {

        try {

            // On veut voir si une maintenance est en base et inconnue pour le moment du système
            //  ou si la maintenance que l'on croit devoir préparer est toujours d'actualité
            //  et on informe si c'est pas fait les utilisateurs
            let maintenance: MaintenanceVO = await ModuleMaintenanceServer.getInstance().get_planned_maintenance();

            if ((MaintenanceServerController.getInstance().planned_maintenance != maintenance) ||
                (MaintenanceServerController.getInstance().planned_maintenance && (
                    (MaintenanceServerController.getInstance().planned_maintenance.broadcasted_msg1 != maintenance.broadcasted_msg1) ||
                    (MaintenanceServerController.getInstance().planned_maintenance.broadcasted_msg2 != maintenance.broadcasted_msg2) ||
                    (MaintenanceServerController.getInstance().planned_maintenance.broadcasted_msg3 != maintenance.broadcasted_msg3) ||
                    (MaintenanceServerController.getInstance().planned_maintenance.end_ts != maintenance.end_ts) ||
                    (MaintenanceServerController.getInstance().planned_maintenance.maintenance_over != maintenance.maintenance_over)))) {
                await MaintenanceServerController.getInstance().set_planned_maintenance_vo(maintenance);
            }

            if (!maintenance) {
                return ModuleBGThreadServer.TIMEOUT_COEF_SLOWER;
            }

            let timeout_minutes_msg1: number = await ModuleParams.getInstance().getParamValueAsInt(ModuleMaintenance.PARAM_NAME_SEND_MSG1_WHEN_SHORTER_THAN_MINUTES, 120);
            let timeout_minutes_msg2: number = await ModuleParams.getInstance().getParamValueAsInt(ModuleMaintenance.PARAM_NAME_SEND_MSG2_WHEN_SHORTER_THAN_MINUTES, 15);
            let timeout_minutes_msg3: number = await ModuleParams.getInstance().getParamValueAsInt(ModuleMaintenance.PARAM_NAME_SEND_MSG3_WHEN_SHORTER_THAN_MINUTES, 5);

            let changed: boolean = false;

            if (!maintenance.broadcasted_msg1) {

                if (Dates.now() >= Dates.add(maintenance.start_ts, -timeout_minutes_msg1, TimeSegment.TYPE_MINUTE)) {
                    await PushDataServerController.getInstance().broadcastAllSimple(NotificationVO.SIMPLE_INFO, ModuleMaintenance.MSG1_code_text);
                    maintenance.broadcasted_msg1 = true;
                    changed = true;
                }
            }

            if (!maintenance.broadcasted_msg2) {

                if (Dates.now() >= Dates.add(maintenance.start_ts, -timeout_minutes_msg2, TimeSegment.TYPE_MINUTE)) {
                    await PushDataServerController.getInstance().broadcastAllSimple(NotificationVO.SIMPLE_WARN, ModuleMaintenance.MSG2_code_text);
                    maintenance.broadcasted_msg2 = true;
                    changed = true;
                }
            }

            if (!maintenance.broadcasted_msg3) {

                if (Dates.now() >= Dates.add(maintenance.start_ts, -timeout_minutes_msg3, TimeSegment.TYPE_MINUTE)) {
                    await PushDataServerController.getInstance().broadcastAllSimple(NotificationVO.SIMPLE_ERROR, ModuleMaintenance.MSG3_code_text);
                    maintenance.broadcasted_msg3 = true;
                    changed = true;
                }
            }

            if (Dates.now() > maintenance.end_ts) {
                await ModuleMaintenance.getInstance().end_planned_maintenance();
            }

            if (changed) {
                await ModuleDAO.getInstance().insertOrUpdateVO(maintenance);
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return ModuleBGThreadServer.TIMEOUT_COEF_SLOWER;
    }
}
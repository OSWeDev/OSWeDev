import ManualTasksController from "../../../shared/modules/Cron/ManualTasksController";
import ModuleDAO from "../../../shared/modules/DAO/ModuleDAO";
import PerfMonLineTypeVO from "../../../shared/modules/PerfMon/vos/PerfMonLineTypeVO";
import PerfMonLineVO from "../../../shared/modules/PerfMon/vos/PerfMonLineVO";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import VarsPerfMonServerController from "../Var/VarsPerfMonServerController";
import PerfMonServerController from "./PerfMonServerController";

export default class PerfMonAdminTasksController {

    public static getInstance() {
        if (!PerfMonAdminTasksController.instance) {
            PerfMonAdminTasksController.instance = new PerfMonAdminTasksController();
        }
        return PerfMonAdminTasksController.instance;
    }

    private static instance: PerfMonAdminTasksController = null;

    private constructor() { }

    public register_perfmon_pack(base_name: string, perf_types: PerfMonLineTypeVO[]) {

        ManualTasksController.getInstance().registered_manual_tasks_by_name["START-PERFMON " + base_name] =
            PerfMonAdminTasksController.getInstance().get_start_handler(perf_types);
        ManualTasksController.getInstance().registered_manual_tasks_by_name["STOP -PERFMON " + base_name] =
            PerfMonAdminTasksController.getInstance().get_stop_handler(perf_types);
        ManualTasksController.getInstance().registered_manual_tasks_by_name["CLEAR-PERFMON " + base_name] =
            PerfMonAdminTasksController.getInstance().get_clear_handler(perf_types);
    }

    private get_start_handler(perf_types: PerfMonLineTypeVO[]) {

        return async () => {
            for (let i in perf_types) {
                let perf_type = perf_types[i];
                let bdd_perf_type = await ModuleDAO.getInstance().getNamedVoByName<PerfMonLineTypeVO>(PerfMonLineTypeVO.API_TYPE_ID, perf_type.name);

                if (!bdd_perf_type) {
                    ConsoleHandler.error("Type introuvable:" + perf_type.name);
                    continue;
                }

                bdd_perf_type.is_active = true;
                await ModuleDAO.getInstance().insertOrUpdateVO(bdd_perf_type);
            }
        };
    }

    private get_stop_handler(perf_types: PerfMonLineTypeVO[]) {

        return async () => {
            for (let i in perf_types) {
                let perf_type = perf_types[i];
                let bdd_perf_type = await ModuleDAO.getInstance().getNamedVoByName<PerfMonLineTypeVO>(PerfMonLineTypeVO.API_TYPE_ID, perf_type.name);

                if (!bdd_perf_type) {
                    ConsoleHandler.error("Type introuvable:" + perf_type.name);
                    continue;
                }

                bdd_perf_type.is_active = false;
                await ModuleDAO.getInstance().insertOrUpdateVO(bdd_perf_type);
            }
        };
    }

    /**
     * Le clear fait un stop aussi
     */
    private get_clear_handler(perf_types: PerfMonLineTypeVO[]) {

        return async () => {
            for (let i in perf_types) {
                let perf_type = perf_types[i];
                let bdd_perf_type = await ModuleDAO.getInstance().getNamedVoByName<PerfMonLineTypeVO>(PerfMonLineTypeVO.API_TYPE_ID, perf_type.name);

                if (!bdd_perf_type) {
                    ConsoleHandler.error("Type introuvable:" + perf_type.name);
                    continue;
                }

                bdd_perf_type.is_active = false;
                await ModuleDAO.getInstance().insertOrUpdateVO(bdd_perf_type);
            }
            await ModuleDAO.getInstance().truncate(PerfMonLineVO.API_TYPE_ID);

            PerfMonServerController.getInstance().childrens_per_parent_uid = {};
            PerfMonServerController.getInstance().lines_infos_to_update_in_db_by_uid = {};
            PerfMonServerController.getInstance().ordered_lines_to_update_in_db = [];

            PerfMonServerController.getInstance()['temp_perf_lines_per_uid'] = {};
            PerfMonServerController.getInstance()['temp_childrens_per_parent_uid'] = {};
        };
    }
}
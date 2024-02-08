import { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import CronWorkerPlanification from "../../../../shared/modules/Cron/vos/CronWorkerPlanification";
import Dates from "../../../../shared/modules/FormatDatesNombres/Dates/Dates";
import SupervisionController from "../../../../shared/modules/Supervision/SupervisionController";
import SupervisedCRONVO from "../../../../shared/modules/Supervision/vos/SupervisedCRONVO";
import { field_names } from "../../../../shared/tools/ObjectHandler";
import ModuleDAOServer from "../../DAO/ModuleDAOServer";
import DAOPostCreateTriggerHook from "../../DAO/triggers/DAOPostCreateTriggerHook";
import DAOPreDeleteTriggerHook from "../../DAO/triggers/DAOPreDeleteTriggerHook";
import DAOPreUpdateTriggerHook from "../../DAO/triggers/DAOPreUpdateTriggerHook";
import DAOUpdateVOHolder from "../../DAO/vos/DAOUpdateVOHolder";
import ModuleTriggerServer from "../../Trigger/ModuleTriggerServer";
import SupervisedItemServerControllerBase from "../SupervisedItemServerControllerBase";


export default class SupervisedCRONServerController extends SupervisedItemServerControllerBase<SupervisedCRONVO> {

    public static getInstance(): SupervisedCRONServerController {
        if (!SupervisedCRONServerController.instance) {
            SupervisedCRONServerController.instance = new SupervisedCRONServerController();
        }

        return SupervisedCRONServerController.instance;
    }

    private static instance: SupervisedCRONServerController = null;

    private constructor() {
        super(SupervisedCRONVO.API_TYPE_ID);

        /**
         * On enregistre les triggers
         */
        let postCreateTrigger: DAOPostCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        let preUpdateTrigger: DAOPreUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        let preDeleteTrigger: DAOPostCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreDeleteTriggerHook.DAO_PRE_DELETE_TRIGGER);

        postCreateTrigger.registerHandler(CronWorkerPlanification.API_TYPE_ID, this, this.postCCreateSupervisedItem);
        preUpdateTrigger.registerHandler(CronWorkerPlanification.API_TYPE_ID, this, this.preUUpdateSupervisedItem);
        preDeleteTrigger.registerHandler(CronWorkerPlanification.API_TYPE_ID, this, this.preDDeleteSupervisedItem);
    }

    /**
     * 1 minute minimum entre chaque mise à jour
     */
    public get_execute_time_ms(): number {
        return 60 * 1000;
    }

    public async work_one(supervised_pdv: SupervisedCRONVO, ...args: any[]): Promise<boolean> {

        if (supervised_pdv.state == SupervisionController.STATE_PAUSED) {
            return true;
        }

        supervised_pdv.invalid = false;

        let planification: CronWorkerPlanification = await query(CronWorkerPlanification.API_TYPE_ID)
            .filter_by_text_eq(field_names<CronWorkerPlanification>().planification_uid, supervised_pdv.planification_uid)
            .filter_by_text_eq(field_names<CronWorkerPlanification>().worker_uid, supervised_pdv.worker_uid)
            .exec_as_server()
            .select_vo<CronWorkerPlanification>();

        if (!planification) {
            supervised_pdv.state = SupervisionController.STATE_ERROR;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(supervised_pdv);
            return true;
        }

        /**
         * Si on a un lancement en attente, qui n'a pas été réalisé
         *  (donc dont le temps d'attente dépasse le temps  d'attente max - par défaut 2 intervales de cron donc au max 2H),
         *  on est en erreur. Sinon on est en ok
         */

        let now: number = Dates.now();
        let next_planned_launch: number = planification.date_heure_planifiee;

        if (!next_planned_launch) {
            supervised_pdv.state = SupervisionController.STATE_WARN;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(supervised_pdv);
            return true;
        }

        let time_waited: number = next_planned_launch - now;
        let max_time_to_wait_sec: number = 60 * 60 * 2; // 2H
        supervised_pdv.last_value = time_waited / (60 * 60 * 24);

        if (time_waited < -max_time_to_wait_sec) {
            supervised_pdv.state = SupervisionController.STATE_ERROR;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(supervised_pdv);
            return true;
        }

        supervised_pdv.state = SupervisionController.STATE_OK;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(supervised_pdv);
        return true;
    }

    private async postCCreateSupervisedItem(e: CronWorkerPlanification) {

        let existing = await query(SupervisedCRONVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<SupervisedCRONVO>().planification_uid, e.planification_uid)
            .filter_by_text_eq(field_names<SupervisedCRONVO>().worker_uid, e.worker_uid)
            .select_vo<SupervisedCRONVO>();

        if (!existing) {
            existing = new SupervisedCRONVO();
            existing.planification_uid = e.planification_uid;
            existing.worker_uid = e.worker_uid;
            existing.name = existing.worker_uid + ((existing.worker_uid == existing.planification_uid) ?
                '' : (' - ' + existing.planification_uid));
            existing.state = SupervisionController.STATE_UNKOWN;
            existing.invalid = true;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(existing);
        }
    }

    private async preUUpdateSupervisedItem(updt: DAOUpdateVOHolder<CronWorkerPlanification>): Promise<boolean> {
        await query(SupervisedCRONVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<SupervisedCRONVO>().planification_uid, updt.post_update_vo.planification_uid)
            .filter_by_text_eq(field_names<SupervisedCRONVO>().worker_uid, updt.post_update_vo.worker_uid)
            .update_vos<SupervisedCRONVO>({
                [field_names<SupervisedCRONVO>().invalid]: true
            });
        return true;
    }

    private async preDDeleteSupervisedItem(e: CronWorkerPlanification) {

        await query(SupervisedCRONVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<SupervisedCRONVO>().planification_uid, e.planification_uid)
            .filter_by_text_eq(field_names<SupervisedCRONVO>().worker_uid, e.worker_uid)
            .delete_vos();
    }
}
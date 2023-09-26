import { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import CronWorkerPlanification from "../../../../shared/modules/Cron/vos/CronWorkerPlanification";
import ModuleDAO from "../../../../shared/modules/DAO/ModuleDAO";
import SupervisionController from "../../../../shared/modules/Supervision/SupervisionController";
import SupervisedCRONVO from "../../../../shared/modules/Supervision/vos/SupervisedCRONVO";
import { field_names } from "../../../../shared/tools/ObjectHandler";
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
     * 15 minutes minimum entre chaque mise à jour
     */
    public get_execute_time_ms(): number {
        return 15 * 60 * 1000;
    }

    public async work_one(supervised_pdv: SupervisedCRONVO, ...args: any[]): Promise<boolean> {

        if (supervised_pdv.state == SupervisionController.STATE_PAUSED) {
            return true;
        }

        supervised_pdv.invalid = false;

        // let pdv: PDVVO = await query(PDVVO.API_TYPE_ID).filter_by_id(supervised_pdv.pdv_id).select_vo<PDVVO>();

        // // Si le crescendo est pas actif et initialisé, la sonde devrait être en pause (ou ne devrait pas exister en fait)
        // // Idem si le pdv est mutualisé
        // if ((!pdv.activated) || (!pdv.crescendo_active) || (!pdv.crescendo_initialise) || (!pdv.last_lignefacturation_importation) || (pdv.mutualiser_sur_site_principal_id)) {
        //     supervised_pdv.state = SupervisionController.STATE_PAUSED;
        //     await ModuleDAO.getInstance().insertOrUpdateVO(supervised_pdv);
        //     return true;
        // }

        // /**
        //  * On cherche à identifier tous les jours d'ouverture de la boutique et on soustrait tous les jours pour lesquels on a des factures
        //  *  On se limite aux 60 derniers jours, inutile de remonter à l'infini, et on commence à la date de factu la plus récente en base
        //  */

        // let feries: JourFerieVO[] = await query(JourFerieVO.API_TYPE_ID).select_vos<JourFerieVO>();
        // let fermetures: FermetureVO[] = await query(FermetureVO.API_TYPE_ID).filter_by_num_eq('pdv_id', pdv.id).select_vos<FermetureVO>();
        // let ts_range: TSRange = RangeHandler.createNew(
        //     TSRange.RANGE_TYPE,
        //     Dates.add(pdv.last_lignefacturation_importation, -59, TimeSegment.TYPE_DAY),
        //     pdv.last_lignefacturation_importation,
        //     true,
        //     true,
        //     TimeSegment.TYPE_DAY);

        // let nb_jours_ouverts_sans_factures: number = 0;
        // await RangeHandler.foreach(ts_range, async (date: number) => {

        //     /**
        //      * On check les fermetures hebdos
        //      */
        //     switch (Dates.isoWeekday(date)) {
        //         case 1:
        //             if (!pdv.ouvert_lun) {
        //                 return;
        //             }
        //             break;
        //         case 2:
        //             if (!pdv.ouvert_mar) {
        //                 return;
        //             }
        //             break;
        //         case 3:
        //             if (!pdv.ouvert_mer) {
        //                 return;
        //             }
        //             break;
        //         case 4:
        //             if (!pdv.ouvert_jeu) {
        //                 return;
        //             }
        //             break;
        //         case 5:
        //             if (!pdv.ouvert_ven) {
        //                 return;
        //             }
        //             break;
        //         case 6:
        //             if (!pdv.ouvert_sam) {
        //                 return;
        //             }
        //             break;
        //         case 7:
        //             if (!pdv.ouvert_dim) {
        //                 return;
        //             }
        //             break;
        //     }

        //     /**
        //      * On check les fermetures exceptionnelles
        //      */
        //     for (let i in fermetures) {
        //         let fermeture = fermetures[i];

        //         if (Dates.startOf(fermeture.date, TimeSegment.TYPE_DAY) == date) {
        //             return;
        //         }
        //     }

        //     /**
        //      * On check les fériés
        //      */
        //     for (let i in feries) {
        //         let ferie = feries[i];

        //         if (Dates.startOf(ferie.date, TimeSegment.TYPE_DAY) == date) {
        //             return;
        //         }
        //     }

        //     let has_factu_for_date: boolean = await ModuleSupervisionImportsServer.getInstance().has_factu_for_date(pdv.id, date);
        //     if (has_factu_for_date) {
        //         return;
        //     }

        //     nb_jours_ouverts_sans_factures++;
        // });

        // if (nb_jours_ouverts_sans_factures >= pdv.error_factus_nb_jours) {
        //     switch (supervised_pdv.state) {
        //         case SupervisionController.STATE_ERROR:
        //         case SupervisionController.STATE_ERROR_READ:
        //             break;
        //         case SupervisionController.STATE_WARN:
        //         case SupervisionController.STATE_WARN_READ:
        //         case SupervisionController.STATE_OK:
        //         case SupervisionController.STATE_PAUSED:
        //         case SupervisionController.STATE_UNKOWN:
        //         default:
        //             supervised_pdv.state = SupervisionController.STATE_ERROR;
        //             break;
        //     }
        // } else if (nb_jours_ouverts_sans_factures >= pdv.warn_factus_nb_jours) {
        //     switch (supervised_pdv.state) {
        //         case SupervisionController.STATE_WARN:
        //         case SupervisionController.STATE_WARN_READ:
        //             break;
        //         case SupervisionController.STATE_ERROR:
        //         case SupervisionController.STATE_ERROR_READ:
        //         case SupervisionController.STATE_OK:
        //         case SupervisionController.STATE_PAUSED:
        //         case SupervisionController.STATE_UNKOWN:
        //         default:
        //             supervised_pdv.state = SupervisionController.STATE_WARN;
        //             break;
        //     }
        // } else {
        //     supervised_pdv.state = SupervisionController.STATE_OK;
        // }
        // supervised_pdv.last_value = nb_jours_ouverts_sans_factures;

        // // On en profite pour reconstruire le nom au cas où il y a eu renommage du PDV
        // supervised_pdv.name = SupervisedCRONVO.SUPERVISED_ITEM_BASENAME + VOsTypesManager.moduleTables_by_voType[PDVVO.API_TYPE_ID].table_label_function(pdv);

        // await ModuleDAO.getInstance().insertOrUpdateVO(supervised_pdv);
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
            await ModuleDAO.getInstance().insertOrUpdateVO(existing);
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
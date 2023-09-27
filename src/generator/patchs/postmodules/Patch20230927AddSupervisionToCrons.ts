/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import CronWorkerPlanification from '../../../shared/modules/Cron/vos/CronWorkerPlanification';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import SupervisionController from '../../../shared/modules/Supervision/SupervisionController';
import SupervisedCRONVO from '../../../shared/modules/Supervision/vos/SupervisedCRONVO';
import { field_names } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20230927AddSupervisionToCrons implements IGeneratorWorker {

    public static getInstance(): Patch20230927AddSupervisionToCrons {
        if (!Patch20230927AddSupervisionToCrons.instance) {
            Patch20230927AddSupervisionToCrons.instance = new Patch20230927AddSupervisionToCrons();
        }
        return Patch20230927AddSupervisionToCrons.instance;
    }

    private static instance: Patch20230927AddSupervisionToCrons = null;

    get uid(): string {
        return 'Patch20230927AddSupervisionToCrons';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {

        let crons: CronWorkerPlanification[] = await query(CronWorkerPlanification.API_TYPE_ID).select_vos<CronWorkerPlanification>();

        for (let i in crons) {
            let cron: CronWorkerPlanification = crons[i];

            let supervised_cron: SupervisedCRONVO = await query(SupervisedCRONVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<SupervisedCRONVO>().planification_uid, cron.planification_uid)
                .filter_by_text_eq(field_names<SupervisedCRONVO>().worker_uid, cron.worker_uid)
                .select_vo<SupervisedCRONVO>();

            if (!supervised_cron) {
                supervised_cron = new SupervisedCRONVO();

                supervised_cron.planification_uid = cron.planification_uid;
                supervised_cron.worker_uid = cron.worker_uid;
                supervised_cron.name = supervised_cron.worker_uid + ((supervised_cron.worker_uid == supervised_cron.planification_uid) ?
                    '' : (' - ' + supervised_cron.planification_uid));
                supervised_cron.state = SupervisionController.STATE_UNKOWN;
                supervised_cron.invalid = true;
                await ModuleDAO.getInstance().insertOrUpdateVO(supervised_cron);
            }
        }
    }
}
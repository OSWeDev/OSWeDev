import { query } from "../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import SupervisedCRONVO from "../../../../../shared/modules/Supervision/vos/SupervisedCRONVO";
import ConsoleHandler from "../../../../../shared/tools/ConsoleHandler";
import ICronWorker from "../../../Cron/interfaces/ICronWorker";
import ModuleDAOServer from "../../../DAO/ModuleDAOServer";

export default class RefreshCRONSupervisionEachDayCronWorker implements ICronWorker {

    public static getInstance() {
        if (!RefreshCRONSupervisionEachDayCronWorker.instance) {
            RefreshCRONSupervisionEachDayCronWorker.instance = new RefreshCRONSupervisionEachDayCronWorker();
        }
        return RefreshCRONSupervisionEachDayCronWorker.instance;
    }

    private static instance: RefreshCRONSupervisionEachDayCronWorker = null;

    private constructor() {
    }

    get worker_uid(): string {
        return "RefreshCRONSupervisionEachDayCronWorker";
    }

    public async work() {

        try {

            /**
             * On refresh les supervisions de type cron
             */
            let supervised_pdvs: SupervisedCRONVO[] = await query(SupervisedCRONVO.API_TYPE_ID).select_vos<SupervisedCRONVO>();
            for (let i in supervised_pdvs) {
                let supervised_pdv = supervised_pdvs[i];
                supervised_pdv.invalid = true;
            }
            await ModuleDAOServer.getInstance().insertOrUpdateVOs_as_server(supervised_pdvs);
        } catch (error) {
            ConsoleHandler.error('Erreur lors du RefreshCRONSupervisionEachDayCronWorker:' + error + ':');
        }
    }
}
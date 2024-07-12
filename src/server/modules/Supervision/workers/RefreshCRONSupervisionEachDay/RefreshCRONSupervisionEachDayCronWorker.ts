import { query } from "../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import SupervisedCRONVO from "../../../../../shared/modules/Supervision/vos/SupervisedCRONVO";
import ConsoleHandler from "../../../../../shared/tools/ConsoleHandler";
import ICronWorker from "../../../Cron/interfaces/ICronWorker";
import ModuleDAOServer from "../../../DAO/ModuleDAOServer";

export default class RefreshCRONSupervisionEachDayCronWorker implements ICronWorker {

    // istanbul ignore next: nothing to test
    public static getInstance() {
        if (!RefreshCRONSupervisionEachDayCronWorker.instance) {
            RefreshCRONSupervisionEachDayCronWorker.instance = new RefreshCRONSupervisionEachDayCronWorker();
        }
        return RefreshCRONSupervisionEachDayCronWorker.instance;
    }

    private static instance: RefreshCRONSupervisionEachDayCronWorker = null;

    private constructor() {
    }

    // istanbul ignore next: nothing to test : worker_uid
    get worker_uid(): string {
        return "RefreshCRONSupervisionEachDayCronWorker";
    }

    // istanbul ignore next: nothing to test : work
    public async work() {

        try {

            /**
             * On refresh les supervisions de type cron
             */
            const supervised_pdvs: SupervisedCRONVO[] = await query(SupervisedCRONVO.API_TYPE_ID).select_vos<SupervisedCRONVO>();
            for (const i in supervised_pdvs) {
                const supervised_pdv = supervised_pdvs[i];
                supervised_pdv.invalid = true;
            }
            await ModuleDAOServer.getInstance().insertOrUpdateVOs_as_server(supervised_pdvs);
        } catch (error) {
            ConsoleHandler.error('Erreur lors du RefreshCRONSupervisionEachDayCronWorker:' + error + ':');
        }
    }
}
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import ExpressSessionVO from '../../../../shared/modules/ExpressDBSessions/vos/ExpressSessionVO';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ICronWorker from "../../Cron/interfaces/ICronWorker";


export default class DeleteOldExpressSessionsCronWorker implements ICronWorker {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!DeleteOldExpressSessionsCronWorker.instance) {
            DeleteOldExpressSessionsCronWorker.instance = new DeleteOldExpressSessionsCronWorker();
        }
        return DeleteOldExpressSessionsCronWorker.instance;
    }

    private static instance: DeleteOldExpressSessionsCronWorker = null;


    private constructor() { }

    // istanbul ignore next: nothing to test : worker_uid
    get worker_uid(): string {
        return "DeleteOldExpressSessionsCronWorker";
    }

    // istanbul ignore next: nothing to test : work
    public async work() {

        const old_sessions = await query(ExpressSessionVO.API_TYPE_ID).filter_by_date_before('expire', Dates.now()).select_vos<ExpressSessionVO>();
        await ModuleDAO.getInstance().deleteVOs(old_sessions);
    }
}
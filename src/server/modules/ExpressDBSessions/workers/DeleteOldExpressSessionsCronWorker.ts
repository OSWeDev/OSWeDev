import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import ExpressSessionVO from '../../../../shared/modules/ExpressDBSessions/vos/ExpressSessionVO';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ICronWorker from "../../Cron/interfaces/ICronWorker";


export default class DeleteOldExpressSessionsCronWorker implements ICronWorker {

    public static getInstance() {
        if (!DeleteOldExpressSessionsCronWorker.instance) {
            DeleteOldExpressSessionsCronWorker.instance = new DeleteOldExpressSessionsCronWorker();
        }
        return DeleteOldExpressSessionsCronWorker.instance;
    }

    private static instance: DeleteOldExpressSessionsCronWorker = null;


    private constructor() { }

    get worker_uid(): string {
        return "DeleteOldExpressSessionsCronWorker";
    }

    public async work() {

        let old_sessions = await query(ExpressSessionVO.API_TYPE_ID).filter_by_date_before('expire', Dates.now()).select_vos<ExpressSessionVO>();
        await ModuleDAO.getInstance().deleteVOs(old_sessions);
    }
}
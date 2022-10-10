
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import TimeSegment from '../../../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import NotificationVO from '../../../../../shared/modules/PushData/vos/NotificationVO';
import ICronWorker from '../../../Cron/interfaces/ICronWorker';

export default class CleanOldNotifsCronWorker implements ICronWorker {

    public static getInstance() {
        if (!CleanOldNotifsCronWorker.instance) {
            CleanOldNotifsCronWorker.instance = new CleanOldNotifsCronWorker();
        }
        return CleanOldNotifsCronWorker.instance;
    }

    private static instance: CleanOldNotifsCronWorker = null;

    private constructor() {
    }

    get worker_uid(): string {
        return "CleanOldNotifsCronWorker";
    }

    /**
     * On supprime les notifications lues depuis plus de 10 jours, et on supprime les notifs de plus de 2 mois
     */
    public async work() {
        let notifs: NotificationVO[] = await query(NotificationVO.API_TYPE_ID).select_vos<NotificationVO>();

        for (let i in notifs) {
            let notif: NotificationVO = notifs[i];

            if (notif.read && notif.read_date) {
                if (Dates.add(notif.read_date, 10, TimeSegment.TYPE_DAY) < Dates.now()) {
                    await ModuleDAO.getInstance().deleteVOs([notif]);
                    continue;
                }
            }

            if (Dates.add(notif.creation_date, 60, TimeSegment.TYPE_DAY) < Dates.now()) {
                await ModuleDAO.getInstance().deleteVOs([notif]);
                continue;
            }
        }
    }
}
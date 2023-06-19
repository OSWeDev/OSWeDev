
import ContextFilterVO, { filter } from '../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import TimeSegment from '../../../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import NotificationVO from '../../../../../shared/modules/PushData/vos/NotificationVO';
import { field_names } from '../../../../../shared/tools/ObjectHandler';
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
        await query(NotificationVO.API_TYPE_ID)
            .add_filters([
                ContextFilterVO.or([
                    filter(NotificationVO.API_TYPE_ID, field_names<NotificationVO>().read).is_true().and(
                        filter(NotificationVO.API_TYPE_ID, field_names<NotificationVO>().read_date).by_date_before(Dates.add(Dates.now(), -10, TimeSegment.TYPE_DAY))),
                    filter(NotificationVO.API_TYPE_ID, field_names<NotificationVO>().creation_date).by_date_before(Dates.add(Dates.now(), -60, TimeSegment.TYPE_DAY))
                ])
            ])
            .delete_vos();
    }
}
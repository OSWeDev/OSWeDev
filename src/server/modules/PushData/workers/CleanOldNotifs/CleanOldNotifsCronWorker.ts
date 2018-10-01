import * as moment from 'moment';
import { isNumber } from 'util';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleDataImport from '../../../../../shared/modules/DataImport/ModuleDataImport';
import DataImportHistoricVO from '../../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import ThreadHandler from '../../../../../shared/tools/ThreadHandler';
import ICronWorker from '../../../Cron/interfaces/ICronWorker';
import NotificationVO from '../../../../../shared/modules/PushData/vos/NotificationVO';
import DateHandler from '../../../../../shared/tools/DateHandler';

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
        let notifs: NotificationVO[] = await ModuleDAO.getInstance().getVos<NotificationVO>(NotificationVO.API_TYPE_ID);

        for (let i in notifs) {
            let notif: NotificationVO = notifs[i];

            if (notif.read && notif.read_date) {
                let read_date: moment.Moment = moment(notif.read_date);
                if (read_date.isValid() && read_date.add(10, 'days').isBefore(moment())) {
                    await ModuleDAO.getInstance().deleteVOs([notif]);
                    continue;
                }
            }

            let creation_date: moment.Moment = moment(notif.creation_date);
            if (creation_date.isValid() && creation_date.add(60, 'days').isBefore(moment())) {
                await ModuleDAO.getInstance().deleteVOs([notif]);
                continue;
            }
        }
    }
}
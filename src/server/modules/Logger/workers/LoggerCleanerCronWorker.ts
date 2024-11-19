import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleLogger from '../../../../shared/modules/Logger/ModuleLogger';
import LogTypeVO from '../../../../shared/modules/Logger/vos/LogTypeVO';
import LogVO from '../../../../shared/modules/Logger/vos/LogVO';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import ICronWorker from "../../Cron/interfaces/ICronWorker";


export default class LoggerCleanerCronWorker implements ICronWorker {

    private static instance: LoggerCleanerCronWorker = null;

    private constructor() { }

    // istanbul ignore next: nothing to test : worker_uid
    get worker_uid(): string {
        return "LoggerCleanerCronWorker";
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!LoggerCleanerCronWorker.instance) {
            LoggerCleanerCronWorker.instance = new LoggerCleanerCronWorker();
        }
        return LoggerCleanerCronWorker.instance;
    }

    // istanbul ignore next: nothing to test : work
    public async work() {
        // 15 jours par défaut
        const max_nb_days: number = await ModuleParams.getInstance().getParamValueAsInt(ModuleLogger.PARAM_LOGGER_CLEANER_MAX_NB_DAYS, 15);
        const date: number = Dates.add(Dates.now(), -max_nb_days, TimeSegment.TYPE_DAY);
        const log_types: LogTypeVO[] = await query(LogTypeVO.API_TYPE_ID).select_vos();

        // On supprimer les logs trop vieux
        for (const i in log_types) {
            await query(LogVO.API_TYPE_ID)
                .filter_by_date_before(field_names<LogVO>().date, date, TimeSegment.TYPE_DAY)
                .filter_by_num_eq(field_names<LogVO>().log_type_id, log_types[i].id)
                .delete_vos();
        }
    }
}
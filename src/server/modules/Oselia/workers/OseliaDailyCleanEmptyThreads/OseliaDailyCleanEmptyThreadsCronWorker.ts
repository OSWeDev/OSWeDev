import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import TimeSegment from '../../../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import GPTAssistantAPIThreadVO from '../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import { field_names } from '../../../../../shared/tools/ObjectHandler';
import ICronWorker from '../../../Cron/interfaces/ICronWorker';

export default class OseliaDailyCleanEmptyThreads implements ICronWorker {

    private static instance: OseliaDailyCleanEmptyThreads = null;

    private constructor() {
    }

    // istanbul ignore next: nothing to test : worker_uid
    get worker_uid(): string {
        return "OseliaDailyCleanEmptyThreads";
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!OseliaDailyCleanEmptyThreads.instance) {
            OseliaDailyCleanEmptyThreads.instance = new OseliaDailyCleanEmptyThreads();
        }
        return OseliaDailyCleanEmptyThreads.instance;
    }

    // istanbul ignore next: nothing to test : work
    public async work() {
        /**
         * On archive tous les threads vides de plus de 24h
         */
        await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
            .filter_is_false(field_names<GPTAssistantAPIThreadVO>().has_content)
            .filter_by_date_before(field_names<GPTAssistantAPIThreadVO>().oswedev_created_at, Dates.add(Dates.now(), -1, TimeSegment.TYPE_DAY), TimeSegment.TYPE_MINUTE)
            .exec_as_server()
            .update_vos<GPTAssistantAPIThreadVO>({ archived: true });
    }
}
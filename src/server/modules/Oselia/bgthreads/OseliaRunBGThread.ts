import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../shared/modules/ContextFilter/vos/SortByVO';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import GPTAssistantAPIAssistantVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIThreadMessageContentVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageContentVO';
import GPTAssistantAPIThreadMessageVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import GPTAssistantAPIThreadVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import OseliaRunVO from '../../../../shared/modules/Oselia/vos/OseliaRunVO';
import StatsController from '../../../../shared/modules/Stats/StatsController';
import VOsTypesManager from '../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import ObjectHandler, { field_names } from '../../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../../shared/tools/PromisePipeline/PromisePipeline';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import GPTAssistantAPIServerController from '../../GPT/GPTAssistantAPIServerController';
import GPTAssistantAPIServerSyncThreadMessagesController from '../../GPT/sync/GPTAssistantAPIServerSyncThreadMessagesController';

export default class OseliaRunBGThread implements IBGThread {

    private static instance: OseliaRunBGThread = null;

    public current_timeout: number = 10;
    public MAX_timeout: number = 100;
    public MIN_timeout: number = 10;

    public semaphore: boolean = false;
    public run_asap: boolean = false;
    public last_run_unix: number = null;

    private promise_pipeline: PromisePipeline = new PromisePipeline(10, 'OseliaRunBGThread');
    private currently_running_thread_ids: { [thread_id: number]: number } = {};

    private constructor() {
    }

    get name(): string {
        return "OseliaRunBGThread";
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!OseliaRunBGThread.instance) {
            OseliaRunBGThread.instance = new OseliaRunBGThread();
        }
        return OseliaRunBGThread.instance;
    }

    public async work(): Promise<number> {

        const time_in = Dates.now_ms();

        try {

            StatsController.register_stat_COMPTEUR('OseliaRunBGThread', 'work', 'IN');

            let query_thread_to_handle = query(GPTAssistantAPIThreadVO.API_TYPE_ID)
                .filter_is_null_or_empty(field_names<OseliaRunVO>().end_date, OseliaRunVO.API_TYPE_ID) // Pas terminé
                .filter_by_num_has(field_names<OseliaRunVO>().state, [ // Pas ended, pas en erreur, pas en attente des enfants, pas en cours
                    OseliaRunVO.STATE_TODO,
                    OseliaRunVO.STATE_SPLIT_ENDED,
                    OseliaRunVO.STATE_WAIT_SPLITS_END_ENDED,
                    OseliaRunVO.STATE_RUN_ENDED,
                    OseliaRunVO.STATE_VALIDATION_ENDED,
                ], OseliaRunVO.API_TYPE_ID)
                .set_sort(new SortByVO(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().start_date, true))
                .set_limit(1);

            if (ObjectHandler.hasAtLeastOneAttribute(this.currently_running_thread_ids)) { // Pas déjà en cours de traitement par ce bgthread
                query_thread_to_handle.filter_by_id_not_in(
                    query(GPTAssistantAPIThreadVO.API_TYPE_ID)
                        .filter_by_ids(Object.values(this.currently_running_thread_ids))
                        .field('id')
                        .exec_as_server(),
                    GPTAssistantAPIThreadVO.API_TYPE_ID);
            }

            const thread_to_handle: GPTAssistantAPIThreadVO = await query_thread_to_handle.select_vo<GPTAssistantAPIThreadVO>();

            if (!thread_to_handle) {
                this.stats_out('inactive', time_in);
                return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
            }

            this.currently_running_thread_ids[thread_to_handle.id] = thread_to_handle.id;

            // On fait avancer le thread / run associé au thread
            thread_to_handle

            this.stats_out('ok', time_in);
            return ModuleBGThreadServer.TIMEOUT_COEF_SLOWER;

        } catch (error) {
            ConsoleHandler.error(error);
        }

        this.stats_out('throws', time_in);
        return ModuleBGThreadServer.TIMEOUT_COEF_SLOWER;
    }

    private stats_out(activity: string, time_in: number) {

        const time_out = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('OseliaRunBGThread', 'work', activity + '_OUT');
        StatsController.register_stat_DUREE('OseliaRunBGThread', 'work', activity + '_OUT', time_out - time_in);
    }

    private async
}
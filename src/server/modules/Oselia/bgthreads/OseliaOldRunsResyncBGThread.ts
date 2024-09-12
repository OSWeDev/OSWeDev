import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import GPTAssistantAPIRunVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIRunVO';
import StatsController from '../../../../shared/modules/Stats/StatsController';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../../shared/tools/PromisePipeline/PromisePipeline';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import GPTAssistantAPIServerSyncRunsController from '../../GPT/sync/GPTAssistantAPIServerSyncRunsController';

export default class OseliaOldRunsResyncBGThread implements IBGThread {

    private static instance: OseliaOldRunsResyncBGThread = null;

    public current_timeout: number = 100000;
    public MAX_timeout: number = 300000;
    public MIN_timeout: number = 100000;

    public semaphore: boolean = false;
    public run_asap: boolean = false;
    public last_run_unix: number = null;
    private constructor() {
    }

    get name(): string {
        return "OseliaOldRunsResyncBGThread";
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!OseliaOldRunsResyncBGThread.instance) {
            OseliaOldRunsResyncBGThread.instance = new OseliaOldRunsResyncBGThread();
        }
        return OseliaOldRunsResyncBGThread.instance;
    }

    public async work(): Promise<number> {

        const time_in = Dates.now_ms();

        try {

            StatsController.register_stat_COMPTEUR('OseliaOldRunsResyncBGThread', 'work', 'IN');

            // On charge tous les runs qui sont en cours et qui ont plus de 5 minutes
            // Et on log + resync avec OpenAI
            const runs_to_handle = await query(GPTAssistantAPIRunVO.API_TYPE_ID)
                .filter_is_null_or_empty(field_names<GPTAssistantAPIRunVO>().completed_at)
                .filter_is_null_or_empty(field_names<GPTAssistantAPIRunVO>().failed_at)
                .filter_is_null_or_empty(field_names<GPTAssistantAPIRunVO>().cancelled_at)
                .filter_by_num_has(field_names<GPTAssistantAPIRunVO>().status, [GPTAssistantAPIRunVO.STATUS_IN_PROGRESS, GPTAssistantAPIRunVO.STATUS_REQUIRES_ACTION, GPTAssistantAPIRunVO.STATUS_QUEUED])
                .filter_by_date_before(field_names<GPTAssistantAPIRunVO>().created_at, Dates.now() - 5 * 60)
                .exec_as_server()
                .select_vos<GPTAssistantAPIRunVO>();

            if ((!runs_to_handle) || (!runs_to_handle.length)) {
                this.stats_out('inactive', time_in);
                return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
            }

            const promise_pipeline = new PromisePipeline(10, 'OseliaOldRunsResyncBGThread');
            for (const i in runs_to_handle) {
                const run = runs_to_handle[i];

                await promise_pipeline.push(async () => {
                    await GPTAssistantAPIServerSyncRunsController.sync_run_from_gpt(run);

                    if (([GPTAssistantAPIRunVO.STATUS_IN_PROGRESS, GPTAssistantAPIRunVO.STATUS_REQUIRES_ACTION, GPTAssistantAPIRunVO.STATUS_QUEUED].indexOf(run.status) >= 0) &&
                        (!run.completed_at) &&
                        (!run.failed_at) &&
                        (!run.cancelled_at)) {
                        ConsoleHandler.warn('OseliaOldRunsResyncBGThread:run still in progress:' + run.id + ':status:' + run.status);
                    }
                });
            }
            await promise_pipeline.end();

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
        StatsController.register_stat_COMPTEUR('OseliaOldRunsResyncBGThread', 'work', activity + '_OUT');
        StatsController.register_stat_DUREE('OseliaOldRunsResyncBGThread', 'work', activity + '_OUT', time_out - time_in);
    }
}
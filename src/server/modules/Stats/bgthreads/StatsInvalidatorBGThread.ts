import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import TSRange from '../../../../shared/modules/DataRender/vos/TSRange';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';
import StatsGroupSecDataRangesVO from '../../../../shared/modules/Stats/vars/vos/StatsGroupDayDataRangesVO';
import StatVO from '../../../../shared/modules/Stats/vos/StatVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import ModuleVarServer from '../../Var/ModuleVarServer';
import StatsServerController from '../StatsServerController';
import VarSecStatsGroupeController from '../vars/controllers/VarSecStatsGroupeController';

export default class StatsInvalidatorBGThread implements IBGThread {

    public static PARAM_NAME_invalidation_interval_sec: string = 'StatsInvalidatorBGThread.invalidation_interval_sec';
    public static PARAM_NAME_invalidate_x_previous_minutes: string = 'StatsInvalidatorBGThread.invalidate_x_previous_minutes';
    public static PARAM_NAME_invalidate_current_minute: string = 'StatsInvalidatorBGThread.invalidate_current_minute';

    public static getInstance() {
        if (!StatsInvalidatorBGThread.instance) {
            StatsInvalidatorBGThread.instance = new StatsInvalidatorBGThread();
        }
        return StatsInvalidatorBGThread.instance;
    }

    private static instance: StatsInvalidatorBGThread = null;

    public current_timeout: number = 120;
    public MAX_timeout: number = 300;
    public MIN_timeout: number = 10;

    private last_update_date_sec: number = null;

    private constructor() { }

    get name(): string {
        return "StatsInvalidatorBGThread";
    }

    /**
     * On recharge régulièrement les stats en fonction des paramètres
     */
    public async work(): Promise<number> {

        let time_in = Dates.now_ms();

        try {

            StatsServerController.register_stat('StatsInvalidatorBGThread.work.IN', 1, StatVO.AGGREGATOR_SUM, TimeSegment.TYPE_MINUTE);

            let invalidation_interval_sec = await ModuleParams.getInstance().getParamValueAsInt(StatsInvalidatorBGThread.PARAM_NAME_invalidation_interval_sec, 30, 300000);
            let invalidate_x_previous_minutes = await ModuleParams.getInstance().getParamValueAsInt(StatsInvalidatorBGThread.PARAM_NAME_invalidate_x_previous_minutes, 2, 300000);
            let invalidate_current_minute = await ModuleParams.getInstance().getParamValueAsBoolean(StatsInvalidatorBGThread.PARAM_NAME_invalidate_current_minute, true, 300000);

            let now_sec = Dates.now();

            if ((!this.last_update_date_sec) || (this.last_update_date_sec + invalidation_interval_sec < now_sec)) {
                this.last_update_date_sec = now_sec;

                // On invalide les stats
                await this.invalidateStats(invalidate_x_previous_minutes, invalidate_current_minute);
            }

            if (invalidation_interval_sec < this.current_timeout) {
                this.stats_out('inactive', time_in);
                return ModuleBGThreadServer.TIMEOUT_COEF_FASTER;
            }

            this.stats_out('ok', time_in);
            return ModuleBGThreadServer.TIMEOUT_COEF_NEUTRAL;
        } catch (error) {
            ConsoleHandler.error('StatsInvalidatorBGThread:FAILED:' + error);
        }

        this.stats_out('throws', time_in);
        return ModuleBGThreadServer.TIMEOUT_COEF_NEUTRAL;
    }

    private stats_out(activity: string, time_in: number) {

        let time_out = Dates.now_ms();
        StatsServerController.register_stat('StatsInvalidatorBGThread.work.' + activity + '.OUT.nb', 1, StatVO.AGGREGATOR_SUM, TimeSegment.TYPE_MINUTE);
        StatsServerController.register_stats('StatsInvalidatorBGThread.work.' + activity + '.OUT.time', time_out - time_in,
            [StatVO.AGGREGATOR_SUM, StatVO.AGGREGATOR_MAX, StatVO.AGGREGATOR_MEAN, StatVO.AGGREGATOR_MIN], TimeSegment.TYPE_MINUTE);
    }

    private async invalidateStats(invalidate_x_previous_minutes: number, invalidate_current_minute: boolean) {

        let ts_range: TSRange = RangeHandler.createNew(TSRange.RANGE_TYPE, Dates.now() - (invalidate_x_previous_minutes * 60), Dates.now() - (invalidate_current_minute ? 0 : 59), true, true, TimeSegment.TYPE_MINUTE);

        let intersector: StatsGroupSecDataRangesVO = StatsGroupSecDataRangesVO.createNew(
            VarSecStatsGroupeController.getInstance().varConf.name,
            false,
            [RangeHandler.getMaxNumRange()],
            [ts_range]
        );
        await ModuleVarServer.getInstance().invalidate_cache_intersection_and_parents([intersector]);
    }
}
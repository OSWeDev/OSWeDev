import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import TSRange from '../../../../shared/modules/DataRender/vos/TSRange';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';
import StatsController from '../../../../shared/modules/Stats/StatsController';
import StatsGroupSecDataRangesVO from '../../../../shared/modules/Stats/vars/vos/StatsGroupDayDataRangesVO';
import VarDataInvalidatorVO from '../../../../shared/modules/Var/vos/VarDataInvalidatorVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import VarsDatasVoUpdateHandler from '../../Var/VarsDatasVoUpdateHandler';
import VarSecStatsGroupeController from '../vars/controllers/VarSecStatsGroupeController';

export default class StatsInvalidatorBGThread implements IBGThread {

    public static PARAM_NAME_invalidation_interval_sec: string = 'StatsInvalidatorBGThread.invalidation_interval_sec';
    public static PARAM_NAME_invalidate_x_previous_minutes: string = 'StatsInvalidatorBGThread.invalidate_x_previous_minutes';
    public static PARAM_NAME_invalidate_current_minute: string = 'StatsInvalidatorBGThread.invalidate_current_minute';

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!StatsInvalidatorBGThread.instance) {
            StatsInvalidatorBGThread.instance = new StatsInvalidatorBGThread();
        }
        return StatsInvalidatorBGThread.instance;
    }

    private static instance: StatsInvalidatorBGThread = null;

    public current_timeout: number = 20000;
    public MAX_timeout: number = 20000;
    public MIN_timeout: number = 20000;

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

            StatsController.register_stat_COMPTEUR('StatsInvalidatorBGThread', 'work', 'IN');

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
                return ModuleBGThreadServer.TIMEOUT_COEF_NEUTRAL;
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
        StatsController.register_stat_COMPTEUR('StatsInvalidatorBGThread', 'work', activity + '_OUT');
        StatsController.register_stat_DUREE('StatsInvalidatorBGThread', 'work', activity + '_OUT', time_out - time_in);
    }

    private async invalidateStats(invalidate_x_previous_minutes: number, invalidate_current_minute: boolean) {

        let ts_range: TSRange = RangeHandler.createNew(TSRange.RANGE_TYPE, Dates.now() - (invalidate_x_previous_minutes * 60), Dates.now() - (invalidate_current_minute ? 0 : 59), true, true, TimeSegment.TYPE_MINUTE);

        let intersector: StatsGroupSecDataRangesVO = StatsGroupSecDataRangesVO.createNew(
            VarSecStatsGroupeController.getInstance().varConf.name,
            false,
            [RangeHandler.getMaxNumRange()],
            [ts_range]
        );
        let invalidator = new VarDataInvalidatorVO(
            intersector, VarDataInvalidatorVO.INVALIDATOR_TYPE_INTERSECTED, true, false, false);
        await VarsDatasVoUpdateHandler.push_invalidators([invalidator]);
    }
}
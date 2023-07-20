import pgPromise from 'pg-promise';
import ContextQueryVO from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ParameterizedQueryWrapperField from "../../../../shared/modules/ContextFilter/vos/ParameterizedQueryWrapperField";
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import StatsController from '../../../../shared/modules/Stats/StatsController';

export default class ThrottledSelectQueryParam {

    public static ThrottledSelectQueryParam_index: number = 1;

    public index: number = null;
    public semaphore: boolean = false;

    public parameterized_full_query: string;

    private time_in: number = null;
    private post_unstack_time_in: number = null;
    private pre_cbs_time_in: number = null;

    public constructor(
        public cbs: Array<(...any) => void>,
        public context_query: ContextQueryVO,
        public parameterizedQueryWrapperFields: ParameterizedQueryWrapperField[],
        query_: string,
        values: any) {
        this.parameterized_full_query = (values && values.length) ? pgPromise.as.format(query_, values) : query_;
        this.index = ThrottledSelectQueryParam.ThrottledSelectQueryParam_index++;
        this.time_in = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('ThrottledSelectQueryParam', 'init', '-');
    }

    public register_unstack_stats() {
        StatsController.register_stat_COMPTEUR('ThrottledSelectQueryParam', 'unstack', '-');
        this.post_unstack_time_in = Dates.now_ms();
    }

    public register_precbs_stats() {
        StatsController.register_stat_COMPTEUR('ThrottledSelectQueryParam', 'precbs', '-');
        StatsController.register_stat_DUREE('ThrottledSelectQueryParam', 'start_to_unstack', '-', this.post_unstack_time_in - this.time_in);
        StatsController.register_stat_DUREE('ThrottledSelectQueryParam', 'unstack_to_precbs', '-', Dates.now_ms() - this.post_unstack_time_in);
        StatsController.register_stat_DUREE('ThrottledSelectQueryParam', 'start_to_precbs', '-', Dates.now_ms() - this.time_in);
        this.pre_cbs_time_in = Dates.now_ms();
    }

    public register_postcbs_stats() {
        StatsController.register_stat_COMPTEUR('ThrottledSelectQueryParam', 'postcbs', '-');
        StatsController.register_stat_DUREE('ThrottledSelectQueryParam', 'precbs_to_postcbs', '-', Dates.now_ms() - this.pre_cbs_time_in);
        StatsController.register_stat_DUREE('ThrottledSelectQueryParam', 'unstack_to_postcbs', '-', Dates.now_ms() - this.post_unstack_time_in);
        StatsController.register_stat_DUREE('ThrottledSelectQueryParam', 'start_to_postcbs', '-', Dates.now_ms() - this.time_in);
    }
}
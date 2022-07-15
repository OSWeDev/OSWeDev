import IDistantVOBase from '../../IDistantVOBase';

export default class VarPerfElementVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "var_perf_element";

    public _type: string = VarPerfElementVO.API_TYPE_ID;
    public id: number;

    /**
     * TODO FIXME Utile ?
     */
    public unfinished_perf_start_times: number[];

    public realised_sum_ms: number;
    public realised_nb_card: number;
    public realised_nb_calls: number;

    public current_estimated_remaining_time: number;

    public constructor() {
        this.realised_sum_ms = 0;
        this.realised_nb_card = 0;
        this.realised_nb_calls = 0;
        this.unfinished_perf_start_times = [];
        this.current_estimated_remaining_time = 0;
    }
}
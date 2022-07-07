import IDistantVOBase from '../../IDistantVOBase';

export default class VarPerfElementVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "var_perf_element";

    public _type: string = VarPerfElementVO.API_TYPE_ID;
    public id: number;

    public unfinished_perf_start_times: number[];

    public sum_ms: number;
    public nb_card: number;
    public nb_calls: number;

    public constructor() {
        this.sum_ms = 0;
        this.nb_calls = 0;
        this.nb_card = 0;
        this.unfinished_perf_start_times = [];
    }
}
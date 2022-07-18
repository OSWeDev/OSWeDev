import IDistantVOBase from '../../IDistantVOBase';

export default class VarPerfElementVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "var_perf_element";

    public _type: string = VarPerfElementVO.API_TYPE_ID;
    public id: number;

    public realised_sum_ms: number;
    public realised_nb_card: number;
    public realised_nb_calls: number;
}
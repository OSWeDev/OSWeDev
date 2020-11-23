import INamedVO from '../../../interfaces/INamedVO';

export default class VarPerfVO implements INamedVO {
    public static API_TYPE_ID: string = "var_perf";

    public _type: string = VarPerfVO.API_TYPE_ID;
    public id: number;

    public name: string;

    public var_id: number;

    public sum_ms: number;

    public nb_card: number;
    public nb_calls: number;

    public mean_per_call: number;

    public mean_per_cardinal_1000: number;
}
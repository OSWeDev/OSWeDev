import INamedVO from '../../../interfaces/INamedVO';

export default class SlowVarVO implements INamedVO {

    public static API_TYPE_ID: string = "slow_var";

    public static TYPE_LABELS: string[] = ['slow_var.type.needs_test', 'slow_var.type.denied'];
    public static TYPE_NEEDS_TEST: number = 0;
    public static TYPE_DENIED: number = 1;

    public id: number;
    public _type: string = SlowVarVO.API_TYPE_ID;

    public name: string;
    public type: number;
    public estimated_calculation_time: number;
    public var_id: number;
    public computation_ts: number;
}
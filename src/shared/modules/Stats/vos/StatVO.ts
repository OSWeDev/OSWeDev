
import IDistantVOBase from '../../IDistantVOBase';

export default class StatVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "stat";

    public static AGGREGATOR_LABELS: string[] = [
        'StatVO.AGGREGATOR_MEAN',
        'StatVO.AGGREGATOR_SUM',
        'StatVO.AGGREGATOR_MIN',
        'StatVO.AGGREGATOR_MAX'
    ];

    public static AGGREGATOR_MEAN: number = 0;
    public static AGGREGATOR_SUM: number = 1;
    public static AGGREGATOR_MIN: number = 2;
    public static AGGREGATOR_MAX: number = 3;

    public id: number;
    public _type: string = StatVO.API_TYPE_ID;

    public value: number;
    public timestamp_s: number;
    public stat_group_id: number;
}

import INamedVO from '../../../interfaces/INamedVO';

export default class StatsGroupCacheLinkVO implements INamedVO {
    public static API_TYPE_ID: string = "stats_group_cache_link";

    public id: number;
    public _type: string = StatsGroupCacheLinkVO.API_TYPE_ID;

    public name: string;

    public category_name: string;
    public sub_category_name: string;
    public event_name: string;
    public stats_aggregator: number;
    public stats_aggregator_min_segment_type: number;
    public thead_name: string;
}
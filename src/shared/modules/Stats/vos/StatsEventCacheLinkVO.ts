
import INamedVO from '../../../interfaces/INamedVO';

export default class StatsEventCacheLinkVO implements INamedVO {
    public static API_TYPE_ID: string = "stats_event_cache_link";

    public id: number;
    public _type: string = StatsEventCacheLinkVO.API_TYPE_ID;

    public name: string;
    public sub_category_name: string;
}